import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import db from './db.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

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
  const { id, title, description, points, duration, category, difficulty, assigned_to, created_by, status, deadline, deadline_type, created_by_kid } = req.body;
  const stmt = db.prepare(
    `INSERT INTO tasks (id, title, description, points, duration, category, difficulty, assigned_to, created_by, status, deadline, deadline_type, created_by_kid)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  stmt.run(id, title, description, points || 0, duration, category, difficulty, assigned_to, created_by, status || 'available', deadline, deadline_type, created_by_kid || 0);
  res.json(req.body);
});

app.put('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, points, duration, category, difficulty, assigned_to, status, completed_at, deadline, deadline_type, return_reason } = req.body;
  const stmt = db.prepare(
    `UPDATE tasks SET title = ?, description = ?, points = ?, duration = ?, category = ?, difficulty = ?,
     assigned_to = ?, status = ?, completed_at = ?, deadline = ?, deadline_type = ?, return_reason = ? WHERE id = ?`
  );
  stmt.run(title, description, points, duration, category, difficulty, assigned_to, status, completed_at, deadline, deadline_type, return_reason, id);
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

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, '../dist')));

  // SPA fallback - send index.html for all non-API routes
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '../dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
