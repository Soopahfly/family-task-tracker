import express from 'express';
import cors from 'cors';
import db from './db.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Family Members endpoints
app.get('/api/family-members', (req, res) => {
  const members = db.prepare('SELECT * FROM family_members ORDER BY created_at').all();
  res.json(members);
});

app.post('/api/family-members', (req, res) => {
  const { id, name, role, age, points, avatar } = req.body;
  const stmt = db.prepare(
    'INSERT INTO family_members (id, name, role, age, points, avatar) VALUES (?, ?, ?, ?, ?, ?)'
  );
  stmt.run(id, name, role, age, points || 0, avatar || null);
  res.json({ id, name, role, age, points, avatar });
});

app.put('/api/family-members/:id', (req, res) => {
  const { id } = req.params;
  const { name, role, age, points, avatar } = req.body;
  const stmt = db.prepare(
    'UPDATE family_members SET name = ?, role = ?, age = ?, points = ?, avatar = ? WHERE id = ?'
  );
  stmt.run(name, role, age, points, avatar, id);
  res.json({ id, name, role, age, points, avatar });
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
  const { id, title, description, points, duration, category, difficulty, assigned_to, created_by, status, deadline, deadline_type } = req.body;
  const stmt = db.prepare(
    `INSERT INTO tasks (id, title, description, points, duration, category, difficulty, assigned_to, created_by, status, deadline, deadline_type)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  stmt.run(id, title, description, points, duration, category, difficulty, assigned_to, created_by, status || 'available', deadline, deadline_type);
  res.json(req.body);
});

app.put('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, points, duration, category, difficulty, assigned_to, status, completed_at, deadline, deadline_type } = req.body;
  const stmt = db.prepare(
    `UPDATE tasks SET title = ?, description = ?, points = ?, duration = ?, category = ?, difficulty = ?,
     assigned_to = ?, status = ?, completed_at = ?, deadline = ?, deadline_type = ? WHERE id = ?`
  );
  stmt.run(title, description, points, duration, category, difficulty, assigned_to, status, completed_at, deadline, deadline_type, id);
  res.json(req.body);
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
  const settings = db.prepare('SELECT * FROM settings').all();
  const settingsObj = {};
  settings.forEach(s => {
    settingsObj[s.key] = JSON.parse(s.value);
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

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, '../dist')));
  app.use((req, res) => {
    res.sendFile(join(__dirname, '../dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
