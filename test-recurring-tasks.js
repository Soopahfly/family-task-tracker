/**
 * Test Script for Recurring Tasks System
 *
 * This script tests the recurring tasks functionality by:
 * 1. Creating test recurring tasks
 * 2. Manually triggering the scheduler
 * 3. Verifying instances are created correctly
 *
 * Run with: node test-recurring-tasks.js
 */

import db from './server/db.js';
import { processRecurringTasks } from './server/taskScheduler.js';
import crypto from 'crypto';

console.log('🧪 Testing Recurring Tasks System\n');

// Clean up any existing test tasks
console.log('1️⃣  Cleaning up old test data...');
db.prepare("DELETE FROM tasks WHERE title LIKE 'TEST:%'").run();
console.log('✅ Cleanup complete\n');

// Create a test family member if needed
console.log('2️⃣  Setting up test family member...');
let testMember = db.prepare("SELECT * FROM family_members LIMIT 1").get();
if (!testMember) {
  const memberId = crypto.randomBytes(16).toString('hex');
  db.prepare(
    'INSERT INTO family_members (id, name, role, age, points) VALUES (?, ?, ?, ?, ?)'
  ).run(memberId, 'Test Kid', 'kid', 10, 0);
  testMember = db.prepare("SELECT * FROM family_members WHERE id = ?").get(memberId);
  console.log(`✅ Created test member: ${testMember.name}`);
} else {
  console.log(`✅ Using existing member: ${testMember.name}`);
}
console.log('');

// Test 1: Create a daily recurring task
console.log('3️⃣  Creating daily recurring task template...');
const dailyTaskId = crypto.randomBytes(16).toString('hex');
db.prepare(`
  INSERT INTO tasks (
    id, title, description, points, category, difficulty,
    assigned_to, status, recurring, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  dailyTaskId,
  'TEST: Daily Task',
  'This task should recur daily',
  10,
  'chore',
  'easy',
  testMember.id,
  'completed', // Must be completed for first instance to be created
  'daily',
  new Date().toISOString()
);
console.log(`✅ Created daily task template (${dailyTaskId})`);
console.log('');

// Test 2: Create a weekly recurring task
console.log('4️⃣  Creating weekly recurring task template...');
const weeklyTaskId = crypto.randomBytes(16).toString('hex');
db.prepare(`
  INSERT INTO tasks (
    id, title, description, points, category, difficulty,
    assigned_to, status, recurring, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  weeklyTaskId,
  'TEST: Weekly Task',
  'This task should recur weekly',
  20,
  'chore',
  'medium',
  testMember.id,
  'completed', // Must be completed for first instance to be created
  'weekly',
  new Date().toISOString()
);
console.log(`✅ Created weekly task template (${weeklyTaskId})`);
console.log('');

// Test 3: Create a daily task that should NOT recur (previous not completed)
console.log('5️⃣  Creating daily task with incomplete previous instance...');
const noRecurTaskId = crypto.randomBytes(16).toString('hex');
db.prepare(`
  INSERT INTO tasks (
    id, title, description, points, category, difficulty,
    assigned_to, status, recurring, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  noRecurTaskId,
  'TEST: Should Not Recur',
  'This task should NOT create instance (not completed)',
  15,
  'chore',
  'hard',
  testMember.id,
  'available', // NOT completed
  'daily',
  new Date().toISOString()
);
console.log(`✅ Created non-recurring task (${noRecurTaskId})`);
console.log('');

// Test 4: Process recurring tasks
console.log('6️⃣  Processing recurring tasks...\n');
const result = processRecurringTasks();
console.log('');

// Test 5: Verify results
console.log('7️⃣  Verifying results...');
const dailyInstances = db.prepare(
  "SELECT * FROM tasks WHERE recurring_parent_id = ?"
).all(dailyTaskId);

const weeklyInstances = db.prepare(
  "SELECT * FROM tasks WHERE recurring_parent_id = ?"
).all(weeklyTaskId);

const noRecurInstances = db.prepare(
  "SELECT * FROM tasks WHERE recurring_parent_id = ?"
).all(noRecurTaskId);

console.log(`\n📊 Test Results:`);
console.log(`   Daily task instances created: ${dailyInstances.length} (expected: 1)`);
console.log(`   Weekly task instances created: ${weeklyInstances.length} (expected: 1)`);
console.log(`   No-recur task instances created: ${noRecurInstances.length} (expected: 0)`);

// Verify instance properties
if (dailyInstances.length > 0) {
  const instance = dailyInstances[0];
  console.log(`\n✅ Daily instance verification:`);
  console.log(`   - Title: ${instance.title} (matches: ${instance.title === 'TEST: Daily Task'})`);
  console.log(`   - Points: ${instance.points} (matches: ${instance.points === 10})`);
  console.log(`   - Status: ${instance.status} (is available: ${instance.status === 'available'})`);
  console.log(`   - Recurring: ${instance.recurring} (is none: ${instance.recurring === 'none'})`);
  console.log(`   - Parent ID: ${instance.recurring_parent_id} (matches: ${instance.recurring_parent_id === dailyTaskId})`);
}

// Test 6: Try to create duplicate (should be skipped)
console.log(`\n8️⃣  Testing duplicate prevention...`);
const result2 = processRecurringTasks();
console.log(`   Instances created on second run: ${result2.created} (expected: 0)`);
console.log(`   Instances skipped on second run: ${result2.skipped} (expected: 2+)`);

// Summary
console.log(`\n${'='.repeat(50)}`);
if (dailyInstances.length === 1 && weeklyInstances.length === 1 && noRecurInstances.length === 0 && result2.created === 0) {
  console.log('✅ ALL TESTS PASSED!');
} else {
  console.log('❌ SOME TESTS FAILED - Review results above');
}
console.log(`${'='.repeat(50)}\n`);

// Cleanup
console.log('🧹 Cleaning up test data...');
db.prepare("DELETE FROM tasks WHERE title LIKE 'TEST:%'").run();
console.log('✅ Cleanup complete\n');

console.log('Test completed successfully!');
