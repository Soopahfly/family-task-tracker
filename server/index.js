import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import db from './db.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { checkAchievements, getAchievementsWithProgress } from './achievementEngine.js';
import { startTaskScheduler, processRecurringTasks } from './taskScheduler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Password persistence protection - ensure password settings are never accidentally deleted
// This middleware runs on every request to monitor critical settings
let passwordCheckInterval = null;

function ensurePasswordPersistence() {
  try {
    const password = db.prepare('SELECT value FROM settings WHERE key = ?').get('parentPassword');
    const passwordBackup = db.prepare('SELECT value FROM settings WHERE key = ?').get('passwordBackup');

    // If password exists but backup doesn't, create backup
    if (password && !passwordBackup) {
      db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)').run('passwordBackup', password.value);
      console.log('🔐 Password backup created');
    }

    // If password is lost but backup exists, restore it
    if (!password && passwordBackup) {
      db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('parentPassword', passwordBackup.value);
      console.log('🔐 Password restored from backup!');
    }
  } catch (error) {
    console.error('⚠️  Password persistence check failed:', error.message);
  }
}

// Run password persistence check every 60 seconds
passwordCheckInterval = setInterval(ensurePasswordPersistence, 60000);

// Run once on startup
ensurePasswordPersistence();

// Helper function to calculate age from date of birth
function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

// Family Members endpoints
app.get('/api/family-members', (req, res) => {
  const members = db.prepare('SELECT * FROM family_members ORDER BY created_at').all();
  // Calculate age from date_of_birth if available
  members.forEach(member => {
    if (member.date_of_birth) {
      member.age = calculateAge(member.date_of_birth);
    }
  });
  res.json(members);
});

app.post('/api/family-members', (req, res) => {
  const { id, name, role, age, date_of_birth, points, avatar } = req.body;
  const calculatedAge = date_of_birth ? calculateAge(date_of_birth) : age;
  const stmt = db.prepare(
    'INSERT INTO family_members (id, name, role, age, date_of_birth, points, avatar) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  stmt.run(id, name, role, calculatedAge, date_of_birth || null, points || 0, avatar || null);
  res.json({ id, name, role, age: calculatedAge, date_of_birth, points, avatar });
});

app.put('/api/family-members/:id', (req, res) => {
  const { id } = req.params;
  const { name, role, age, date_of_birth, points, avatar } = req.body;
  const calculatedAge = date_of_birth ? calculateAge(date_of_birth) : age;
  const stmt = db.prepare(
    'UPDATE family_members SET name = ?, role = ?, age = ?, date_of_birth = ?, points = ?, avatar = ? WHERE id = ?'
  );
  stmt.run(name, role, calculatedAge, date_of_birth || null, points, avatar, id);
  res.json({ id, name, role, age: calculatedAge, date_of_birth, points, avatar });
});

app.delete('/api/family-members/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM family_members WHERE id = ?').run(id);
  res.json({ success: true });
});

// Tasks endpoints
app.get('/api/tasks', (req, res) => {
  const tasks = db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all();
  res.json(tasks);
});

app.post('/api/tasks', (req, res) => {
  const { id, title, description, points, duration, category, difficulty, assigned_to, created_by, status, deadline, deadline_type, created_by_kid, recurring, recurring_parent_id, taskType } = req.body;
  const stmt = db.prepare(
    `INSERT INTO tasks (id, title, description, points, duration, category, difficulty, assigned_to, created_by, status, deadline, deadline_type, created_by_kid, recurring, recurring_parent_id, taskType)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  stmt.run(id, title, description, points || 0, duration, category, difficulty, assigned_to, created_by, status || 'available', deadline, deadline_type, created_by_kid || 0, recurring || 'none', recurring_parent_id || null, taskType || 'optional');
  res.json(req.body);
});

app.put('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, points, duration, category, difficulty, assigned_to, status, completed_at, deadline, deadline_type, return_reason, recurring, recurring_parent_id, taskType } = req.body;
  const stmt = db.prepare(
    `UPDATE tasks SET title = ?, description = ?, points = ?, duration = ?, category = ?, difficulty = ?,
     assigned_to = ?, status = ?, completed_at = ?, deadline = ?, deadline_type = ?, return_reason = ?, recurring = ?, recurring_parent_id = ?, taskType = ? WHERE id = ?`
  );
  stmt.run(title, description, points, duration, category, difficulty, assigned_to, status, completed_at, deadline, deadline_type, return_reason, recurring, recurring_parent_id, taskType, id);
  res.json(req.body);
});

app.post('/api/tasks/:id/return', (req, res) => {
  const { id } = req.params;
  const { return_reason } = req.body;

  if (!return_reason || return_reason.trim().length === 0) {
    return res.status(400).json({ success: false, error: 'Return reason is required' });
  }

  const stmt = db.prepare(
    `UPDATE tasks SET status = 'available', assigned_to = NULL, return_reason = ? WHERE id = ?`
  );
  stmt.run(return_reason, id);
  res.json({ success: true });
});

app.delete('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  res.json({ success: true });
});

// Task completion endpoint with achievements, streaks, and history integration
app.post('/api/tasks/:id/complete', (req, res) => {
  const { id } = req.params;
  const { family_member_id } = req.body;

  if (!family_member_id) {
    return res.status(400).json({ success: false, error: 'family_member_id is required' });
  }

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);

  if (!task) {
    return res.status(404).json({ success: false, error: 'Task not found' });
  }

  // IMPORTANT: If this is a recurring template (not an instance), create an instance and complete that instead
  // Recurring templates should never be marked as completed themselves
  if (task.recurring && task.recurring !== 'none' && !task.recurring_parent_id) {
    console.log(`⚠️  Attempted to complete recurring template: ${task.title}`);
    console.log(`   Creating instance instead...`);

    // Check if instance already exists today
    const today = new Date().toISOString().split('T')[0];
    const existingInstance = db.prepare(`
      SELECT * FROM tasks
      WHERE recurring_parent_id = ?
      AND DATE(created_at) = ?
    `).get(task.id, today);

    let instanceToComplete;

    if (existingInstance) {
      // Use existing instance
      instanceToComplete = existingInstance;
      console.log(`   Found existing instance: ${existingInstance.id}`);
    } else {
      // Create new instance
      const newInstanceId = crypto.randomBytes(16).toString('hex');
      const now = new Date().toISOString();

      db.prepare(`
        INSERT INTO tasks (
          id, title, description, points, duration, category, difficulty,
          assigned_to, created_by, status, completed_at, deadline, deadline_type,
          created_by_kid, recurring, recurring_parent_id, created_at, taskType
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        newInstanceId, task.title, task.description, task.points, task.duration,
        task.category, task.difficulty, family_member_id, task.created_by, 'available',
        null, task.deadline, task.deadline_type, task.created_by_kid, 'none',
        task.id, now, task.taskType
      );

      instanceToComplete = db.prepare('SELECT * FROM tasks WHERE id = ?').get(newInstanceId);
      console.log(`   Created new instance: ${newInstanceId}`);
    }

    // Now complete the instance (not the template)
    const completedAt = new Date().toISOString();
    db.prepare(`
      UPDATE tasks SET status = 'completed', completed_at = ?, assigned_to = ?
      WHERE id = ?
    `).run(completedAt, family_member_id, instanceToComplete.id);

    // Continue with the instance as the task
    // Update the task variable for the rest of the function
    task.id = instanceToComplete.id;
  } else {
    // Normal task or instance - complete it normally
    const completedAt = new Date().toISOString();

    // Update task status
    db.prepare(`
      UPDATE tasks SET status = 'completed', completed_at = ?, assigned_to = ?
      WHERE id = ?
    `).run(completedAt, family_member_id, id);
  }

  const completedAt = new Date().toISOString();

  // Add points to family member
  db.prepare('UPDATE family_members SET points = points + ? WHERE id = ?')
    .run(task.points, family_member_id);

  // Add to task history
  const historyId = crypto.randomBytes(16).toString('hex');
  db.prepare(`
    INSERT INTO task_history (id, task_id, task_title, family_member_id, points_earned, completed_at, category, difficulty)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(historyId, task.id, task.title, family_member_id, task.points, completedAt, task.category, task.difficulty);

  // Update streaks
  const streakResult = db.prepare(`
    SELECT * FROM streaks WHERE family_member_id = ? AND streak_type = 'daily'
  `).get(family_member_id);

  const today = new Date().toISOString().split('T')[0];
  let newCurrentStreak = 1;
  let newLongestStreak = 1;

  if (streakResult) {
    const lastDate = streakResult.last_completion_date;

    if (lastDate) {
      const lastDateObj = new Date(lastDate);
      const todayObj = new Date(today);
      const diffDays = Math.floor((todayObj - lastDateObj) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        // Same day, no change to streak
        newCurrentStreak = streakResult.current_streak;
        newLongestStreak = streakResult.longest_streak;
      } else if (diffDays === 1) {
        // Consecutive day, increment streak
        newCurrentStreak = streakResult.current_streak + 1;
        newLongestStreak = Math.max(streakResult.longest_streak, newCurrentStreak);
      } else {
        // Streak broken, reset to 1
        newCurrentStreak = 1;
        newLongestStreak = streakResult.longest_streak;
      }
    }

    db.prepare(`
      UPDATE streaks
      SET current_streak = ?, longest_streak = ?, last_completion_date = ?, updated_at = CURRENT_TIMESTAMP
      WHERE family_member_id = ? AND streak_type = 'daily'
    `).run(newCurrentStreak, newLongestStreak, today, family_member_id);
  } else {
    // Create new streak
    const streakId = crypto.randomBytes(16).toString('hex');
    db.prepare(`
      INSERT INTO streaks (id, family_member_id, streak_type, current_streak, longest_streak, last_completion_date)
      VALUES (?, ?, 'daily', ?, ?, ?)
    `).run(streakId, family_member_id, newCurrentStreak, newLongestStreak, today);
  }

  // Check for new achievements
  const achievementResult = checkAchievements(family_member_id);

  res.json({
    success: true,
    task: { ...task, status: 'completed', completed_at: completedAt },
    streak: { current_streak: newCurrentStreak, longest_streak: newLongestStreak },
    achievements: achievementResult
  });
});

// Rewards endpoints
app.get('/api/rewards', (req, res) => {
  const rewards = db.prepare('SELECT * FROM rewards ORDER BY created_at').all();
  res.json(rewards);
});

app.post('/api/rewards', (req, res) => {
  const { id, title, description, cost, category, image, stock, claimed_count } = req.body;
  const stmt = db.prepare(
    'INSERT INTO rewards (id, title, description, cost, category, image, stock, claimed_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );
  stmt.run(id, title, description, cost, category, image, stock, claimed_count || 0);
  res.json(req.body);
});

app.put('/api/rewards/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, cost, category, image, stock, claimed_count } = req.body;
  const stmt = db.prepare(
    'UPDATE rewards SET title = ?, description = ?, cost = ?, category = ?, image = ?, stock = ?, claimed_count = ? WHERE id = ?'
  );
  stmt.run(title, description, cost, category, image, stock, claimed_count, id);
  res.json(req.body);
});

app.delete('/api/rewards/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM rewards WHERE id = ?').run(id);
  res.json({ success: true });
});

// Reward Suggestions endpoints
app.get('/api/reward-suggestions', (req, res) => {
  const suggestions = db.prepare('SELECT * FROM reward_suggestions ORDER BY created_at DESC').all();
  res.json(suggestions);
});

app.post('/api/reward-suggestions', (req, res) => {
  const { id, title, description, suggested_by, status } = req.body;
  const stmt = db.prepare(
    'INSERT INTO reward_suggestions (id, title, description, suggested_by, status) VALUES (?, ?, ?, ?, ?)'
  );
  stmt.run(id, title, description, suggested_by, status || 'pending');
  res.json(req.body);
});

app.put('/api/reward-suggestions/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, status } = req.body;
  const stmt = db.prepare(
    'UPDATE reward_suggestions SET title = ?, description = ?, status = ? WHERE id = ?'
  );
  stmt.run(title, description, status, id);
  res.json(req.body);
});

app.delete('/api/reward-suggestions/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM reward_suggestions WHERE id = ?').run(id);
  res.json({ success: true });
});

// Settings endpoints
app.get('/api/settings', (req, res) => {
  const settings = db.prepare('SELECT * FROM settings WHERE key != ?').all('parentPassword');
  const settingsObj = {};
  settings.forEach(s => {
    try {
      settingsObj[s.key] = JSON.parse(s.value);
    } catch (e) {
      settingsObj[s.key] = s.value;
    }
  });
  res.json(settingsObj);
});

app.put('/api/settings', (req, res) => {
  const settings = req.body;
  const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  for (const [key, value] of Object.entries(settings)) {
    stmt.run(key, JSON.stringify(value));
  }
  res.json(settings);
});

// Integrations endpoints
app.get('/api/integrations', (req, res) => {
  const integrations = db.prepare('SELECT * FROM integrations').all();
  res.json(integrations.map(i => ({ ...i, config: JSON.parse(i.config), enabled: Boolean(i.enabled) })));
});

app.post('/api/integrations', (req, res) => {
  const { id, type, config, enabled } = req.body;
  const stmt = db.prepare(
    'INSERT INTO integrations (id, type, config, enabled) VALUES (?, ?, ?, ?)'
  );
  stmt.run(id, type, JSON.stringify(config), enabled ? 1 : 0);
  res.json(req.body);
});

app.put('/api/integrations/:id', (req, res) => {
  const { id } = req.params;
  const { type, config, enabled } = req.body;
  const stmt = db.prepare(
    'UPDATE integrations SET type = ?, config = ?, enabled = ? WHERE id = ?'
  );
  stmt.run(type, JSON.stringify(config), enabled ? 1 : 0, id);
  res.json(req.body);
});

app.delete('/api/integrations/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM integrations WHERE id = ?').run(id);
  res.json({ success: true });
});

// Module States endpoints
app.get('/api/module-states', (req, res) => {
  const states = db.prepare('SELECT * FROM module_states').all();
  const statesObj = {};
  states.forEach(s => {
    statesObj[s.module_name] = Boolean(s.enabled);
  });
  res.json(statesObj);
});

app.put('/api/module-states', (req, res) => {
  const states = req.body;
  const stmt = db.prepare('INSERT OR REPLACE INTO module_states (module_name, enabled) VALUES (?, ?)');
  for (const [module_name, enabled] of Object.entries(states)) {
    stmt.run(module_name, enabled ? 1 : 0);
  }
  res.json(states);
});

// Password Authentication endpoints
app.get('/api/auth/password-status', (req, res) => {
  const password = db.prepare('SELECT value FROM settings WHERE key = ?').get('parentPassword');
  res.json({ isSet: password !== undefined });
});

app.post('/api/auth/setup-password', (req, res) => {
  const { password } = req.body;

  if (!password || password.length < 4) {
    return res.status(400).json({ success: false, error: 'Password must be at least 4 characters' });
  }

  // Check if password already exists
  const existing = db.prepare('SELECT value FROM settings WHERE key = ?').get('parentPassword');
  if (existing) {
    return res.status(400).json({ success: false, error: 'Password already set' });
  }

  // Hash password
  const hash = crypto.createHash('sha256').update(password).digest('hex');
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('parentPassword', hash);

  // Create backup copy for persistence protection
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('passwordBackup', hash);

  console.log('🔐 Password set and backup created');
  res.json({ success: true });
});

app.post('/api/auth/verify-password', (req, res) => {
  const { password } = req.body;

  const stored = db.prepare('SELECT value FROM settings WHERE key = ?').get('parentPassword');
  if (!stored) {
    return res.status(400).json({ success: false, error: 'No password set' });
  }

  const hash = crypto.createHash('sha256').update(password).digest('hex');

  if (hash === stored.value) {
    const sessionToken = crypto.randomBytes(32).toString('hex');
    res.json({ success: true, token: sessionToken });
  } else {
    res.status(401).json({ success: false, error: 'Incorrect password' });
  }
});

app.post('/api/auth/change-password', (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const stored = db.prepare('SELECT value FROM settings WHERE key = ?').get('parentPassword');
  if (!stored) {
    return res.status(400).json({ success: false, error: 'No password set' });
  }

  const currentHash = crypto.createHash('sha256').update(currentPassword).digest('hex');

  if (currentHash !== stored.value) {
    return res.status(401).json({ success: false, error: 'Current password is incorrect' });
  }

  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ success: false, error: 'New password must be at least 4 characters' });
  }

  const newHash = crypto.createHash('sha256').update(newPassword).digest('hex');
  db.prepare('UPDATE settings SET value = ? WHERE key = ?').run(newHash, 'parentPassword');

  // Update backup as well
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('passwordBackup', newHash);

  console.log('🔐 Password changed and backup updated');
  res.json({ success: true });
});

app.post('/api/auth/remove-password', (req, res) => {
  const { currentPassword } = req.body;

  const stored = db.prepare('SELECT value FROM settings WHERE key = ?').get('parentPassword');
  if (!stored) {
    return res.status(400).json({ success: false, error: 'No password set' });
  }

  const hash = crypto.createHash('sha256').update(currentPassword).digest('hex');

  if (hash !== stored.value) {
    return res.status(401).json({ success: false, error: 'Incorrect password' });
  }

  db.prepare('DELETE FROM settings WHERE key = ?').run('parentPassword');
  // Also delete backup when intentionally removing password
  db.prepare('DELETE FROM settings WHERE key = ?').run('passwordBackup');

  console.log('🔐 Password removed (backup also cleared)');
  res.json({ success: true });
});

// Emergency password reset - requires knowing a parent's name
app.post('/api/auth/emergency-reset', (req, res) => {
  const { parentName, newPassword } = req.body;

  // Verify a parent with this name exists
  const parent = db.prepare('SELECT * FROM family_members WHERE name = ? AND role = ?').get(parentName, 'parent');
  if (!parent) {
    return res.status(401).json({ success: false, error: 'Invalid credentials' });
  }

  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ success: false, error: 'Password must be at least 4 characters' });
  }

  // Hash new password
  const hash = crypto.createHash('sha256').update(newPassword).digest('hex');

  // Update or insert password
  const existing = db.prepare('SELECT value FROM settings WHERE key = ?').get('parentPassword');
  if (existing) {
    db.prepare('UPDATE settings SET value = ? WHERE key = ?').run(hash, 'parentPassword');
  } else {
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('parentPassword', hash);
  }

  res.json({ success: true, message: 'Password reset successfully' });
});

// Merit Types endpoints
app.get('/api/merit-types', (req, res) => {
  const meritTypes = db.prepare('SELECT * FROM merit_types ORDER BY name').all();
  res.json(meritTypes);
});

app.post('/api/merit-types', (req, res) => {
  const { id, name, points, icon } = req.body;
  const stmt = db.prepare(
    'INSERT INTO merit_types (id, name, points, icon) VALUES (?, ?, ?, ?)'
  );
  stmt.run(id, name, points, icon || null);
  res.json({ id, name, points, icon });
});

app.put('/api/merit-types/:id', (req, res) => {
  const { id } = req.params;
  const { name, points, icon } = req.body;
  const stmt = db.prepare(
    'UPDATE merit_types SET name = ?, points = ?, icon = ? WHERE id = ?'
  );
  stmt.run(name, points, icon, id);
  res.json({ id, name, points, icon });
});

app.delete('/api/merit-types/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM merit_types WHERE id = ?').run(id);
  res.json({ success: true });
});

// Merits endpoints
app.get('/api/merits', (req, res) => {
  const merits = db.prepare(`
    SELECT m.*, mt.name as merit_name, mt.icon as merit_icon,
           fm.name as family_member_name
    FROM merits m
    JOIN merit_types mt ON m.merit_type_id = mt.id
    JOIN family_members fm ON m.family_member_id = fm.id
    ORDER BY m.awarded_at DESC
  `).all();
  res.json(merits);
});

app.post('/api/merits', (req, res) => {
  const { id, merit_type_id, family_member_id, note, points } = req.body;

  // Insert merit
  const stmt = db.prepare(
    'INSERT INTO merits (id, merit_type_id, family_member_id, note, points) VALUES (?, ?, ?, ?, ?)'
  );
  stmt.run(id, merit_type_id, family_member_id, note || null, points);

  // Update family member points
  db.prepare('UPDATE family_members SET points = points + ? WHERE id = ?').run(points, family_member_id);

  res.json({ id, merit_type_id, family_member_id, note, points });
});

app.delete('/api/merits/:id', (req, res) => {
  const { id } = req.params;

  // Get merit details before deleting to reverse points
  const merit = db.prepare('SELECT * FROM merits WHERE id = ?').get(id);

  if (merit) {
    // Reverse the points
    db.prepare('UPDATE family_members SET points = points - ? WHERE id = ?').run(merit.points, merit.family_member_id);

    // Delete merit
    db.prepare('DELETE FROM merits WHERE id = ?').run(id);
  }

  res.json({ success: true });
});

// ==================== STAGE 1: ACHIEVEMENTS & STREAKS ENDPOINTS ====================

// Achievement endpoints
app.get('/api/achievements', (req, res) => {
  const achievements = db.prepare('SELECT * FROM achievements ORDER BY category, requirement_value').all();
  res.json(achievements);
});

app.get('/api/achievements/:memberId', (req, res) => {
  const { memberId } = req.params;
  const achievementsWithProgress = getAchievementsWithProgress(memberId);
  res.json(achievementsWithProgress);
});

app.post('/api/achievements/check/:memberId', (req, res) => {
  const { memberId } = req.params;
  const result = checkAchievements(memberId);
  res.json(result);
});

// Streaks endpoints
app.get('/api/streaks/:memberId', (req, res) => {
  const { memberId } = req.params;
  const streaks = db.prepare(`
    SELECT * FROM streaks WHERE family_member_id = ?
  `).all(memberId);

  // Return all streak types, creating default if none exist
  const streakTypes = ['daily', 'weekly'];
  const streakMap = new Map(streaks.map(s => [s.streak_type, s]));

  const result = streakTypes.map(type => {
    if (streakMap.has(type)) {
      return streakMap.get(type);
    } else {
      return {
        streak_type: type,
        current_streak: 0,
        longest_streak: 0,
        last_completion_date: null
      };
    }
  });

  res.json(result);
});

app.post('/api/streaks/update/:memberId', (req, res) => {
  const { memberId } = req.params;
  const { streak_type = 'daily' } = req.body;

  // Get current streak
  const currentStreak = db.prepare(`
    SELECT * FROM streaks WHERE family_member_id = ? AND streak_type = ?
  `).get(memberId, streak_type);

  const today = new Date().toISOString().split('T')[0];
  let newCurrentStreak = 1;
  let newLongestStreak = 1;

  if (currentStreak) {
    const lastDate = currentStreak.last_completion_date;

    if (lastDate) {
      const lastDateObj = new Date(lastDate);
      const todayObj = new Date(today);
      const diffDays = Math.floor((todayObj - lastDateObj) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        // Same day, no change
        return res.json(currentStreak);
      } else if (diffDays === 1) {
        // Consecutive day, increment streak
        newCurrentStreak = currentStreak.current_streak + 1;
      } else {
        // Streak broken, reset to 1
        newCurrentStreak = 1;
      }

      newLongestStreak = Math.max(currentStreak.longest_streak, newCurrentStreak);
    }

    // Update existing streak
    db.prepare(`
      UPDATE streaks
      SET current_streak = ?, longest_streak = ?, last_completion_date = ?, updated_at = CURRENT_TIMESTAMP
      WHERE family_member_id = ? AND streak_type = ?
    `).run(newCurrentStreak, newLongestStreak, today, memberId, streak_type);
  } else {
    // Create new streak
    const id = crypto.randomBytes(16).toString('hex');
    db.prepare(`
      INSERT INTO streaks (id, family_member_id, streak_type, current_streak, longest_streak, last_completion_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, memberId, streak_type, newCurrentStreak, newLongestStreak, today);
  }

  // Get updated streak
  const updatedStreak = db.prepare(`
    SELECT * FROM streaks WHERE family_member_id = ? AND streak_type = ?
  `).get(memberId, streak_type);

  res.json(updatedStreak);
});

// Task Templates endpoints
app.get('/api/task-templates', (req, res) => {
  const templates = db.prepare('SELECT * FROM task_templates ORDER BY created_at DESC').all();
  res.json(templates.map(t => ({
    ...t,
    tasks: JSON.parse(t.tasks),
    is_system: Boolean(t.is_system)
  })));
});

app.post('/api/task-templates', (req, res) => {
  const { id, name, description, tasks, created_by, is_system } = req.body;

  if (!Array.isArray(tasks) || tasks.length === 0) {
    return res.status(400).json({ success: false, error: 'Tasks must be a non-empty array' });
  }

  const stmt = db.prepare(`
    INSERT INTO task_templates (id, name, description, tasks, created_by, is_system)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run(id, name, description || null, JSON.stringify(tasks), created_by || null, is_system ? 1 : 0);

  res.json({ id, name, description, tasks, created_by, is_system });
});

app.post('/api/task-templates/:id/deploy', (req, res) => {
  const { id } = req.params;
  const { assigned_to, created_by } = req.body;

  const template = db.prepare('SELECT * FROM task_templates WHERE id = ?').get(id);

  if (!template) {
    return res.status(404).json({ success: false, error: 'Template not found' });
  }

  const tasks = JSON.parse(template.tasks);
  const createdTasks = [];

  for (const taskTemplate of tasks) {
    const taskId = crypto.randomBytes(16).toString('hex');
    const task = {
      id: taskId,
      title: taskTemplate.title,
      description: taskTemplate.description || null,
      points: taskTemplate.points || 10,
      duration: taskTemplate.duration || null,
      category: taskTemplate.category || 'chore',
      difficulty: taskTemplate.difficulty || 'medium',
      assigned_to: assigned_to || null,
      created_by: created_by || null,
      status: 'available',
      deadline: taskTemplate.deadline || null,
      deadline_type: taskTemplate.deadline_type || null,
      created_by_kid: 0
    };

    const stmt = db.prepare(`
      INSERT INTO tasks (id, title, description, points, duration, category, difficulty, assigned_to, created_by, status, deadline, deadline_type, created_by_kid)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      task.id, task.title, task.description, task.points, task.duration,
      task.category, task.difficulty, task.assigned_to, task.created_by,
      task.status, task.deadline, task.deadline_type, task.created_by_kid
    );

    createdTasks.push(task);
  }

  res.json({ success: true, tasks: createdTasks });
});

app.delete('/api/task-templates/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM task_templates WHERE id = ?').run(id);
  res.json({ success: true });
});

// Task History endpoints
app.get('/api/task-history/:memberId', (req, res) => {
  const { memberId } = req.params;
  const { startDate, endDate } = req.query;

  let query = 'SELECT * FROM task_history WHERE family_member_id = ?';
  const params = [memberId];

  if (startDate && endDate) {
    query += ' AND DATE(completed_at) BETWEEN ? AND ?';
    params.push(startDate, endDate);
  }

  query += ' ORDER BY completed_at DESC';

  const history = db.prepare(query).all(...params);
  res.json(history);
});

app.post('/api/task-history', (req, res) => {
  const { id, task_id, task_title, family_member_id, points_earned, completed_at, category, difficulty } = req.body;

  const stmt = db.prepare(`
    INSERT INTO task_history (id, task_id, task_title, family_member_id, points_earned, completed_at, category, difficulty)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(id, task_id || null, task_title, family_member_id, points_earned, completed_at, category || null, difficulty || null);

  res.json({ success: true, id });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, '../dist')));

  // SPA fallback - send index.html for all non-API routes
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '../dist/index.html'));
  });
}

// Start the task scheduler
startTaskScheduler();

// Add API endpoint to manually trigger recurring task processing (for testing)
app.post('/api/recurring-tasks/process', (req, res) => {
  try {
    const result = processRecurringTasks();
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error processing recurring tasks:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
