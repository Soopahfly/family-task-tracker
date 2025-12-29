import db from './db.js';
import crypto from 'crypto';

/**
 * Task Scheduler
 * Runs daily at midnight to check for recurring tasks and create new instances
 */

// Helper function to get day of week (0 = Sunday, 6 = Saturday)
function getDayOfWeek(date) {
  return date.getDay();
}

// Helper function to check if a task should recur today
function shouldRecurToday(task, today) {
  if (!task.recurring || task.recurring === 'none') {
    return false;
  }

  // For daily tasks, always return true
  if (task.recurring === 'daily') {
    return true;
  }

  // For weekly tasks, check if it's the same day of the week as when created
  if (task.recurring === 'weekly') {
    const createdDate = new Date(task.created_at);
    const createdDayOfWeek = getDayOfWeek(createdDate);
    const todayDayOfWeek = getDayOfWeek(today);
    return createdDayOfWeek === todayDayOfWeek;
  }

  return false;
}

// Helper function to check if a new instance was already created today
function instanceCreatedToday(parentTaskId) {
  const today = new Date().toISOString().split('T')[0];
  const instance = db.prepare(`
    SELECT * FROM tasks
    WHERE recurring_parent_id = ?
    AND DATE(created_at) = ?
  `).get(parentTaskId, today);

  return instance !== undefined;
}

// Helper function to check if previous instance is completed
function previousInstanceCompleted(parentTaskId) {
  // Get the most recent instance (excluding today's)
  const today = new Date().toISOString().split('T')[0];
  const previousInstance = db.prepare(`
    SELECT * FROM tasks
    WHERE recurring_parent_id = ?
    AND DATE(created_at) < ?
    ORDER BY created_at DESC
    LIMIT 1
  `).get(parentTaskId, today);

  // If no previous instance exists, the parent task itself must be completed
  if (!previousInstance) {
    const parentTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(parentTaskId);
    return parentTask && parentTask.status === 'completed';
  }

  // Check if previous instance is completed
  return previousInstance.status === 'completed';
}

// Helper function to create a new task instance from a recurring task
function createTaskInstance(parentTask) {
  const newTaskId = crypto.randomBytes(16).toString('hex');
  const now = new Date().toISOString();

  // Calculate deadline if the parent task had one
  let newDeadline = null;
  if (parentTask.deadline && parentTask.deadline_type) {
    const today = new Date();
    if (parentTask.deadline_type === 'daily') {
      today.setHours(23, 59, 59, 999);
      newDeadline = today.toISOString();
    } else if (parentTask.deadline_type === 'weekly') {
      today.setDate(today.getDate() + 6);
      today.setHours(23, 59, 59, 999);
      newDeadline = today.toISOString();
    }
  }

  const newTask = {
    id: newTaskId,
    title: parentTask.title,
    description: parentTask.description,
    points: parentTask.points,
    duration: parentTask.duration,
    category: parentTask.category,
    difficulty: parentTask.difficulty,
    assigned_to: parentTask.assigned_to,
    created_by: parentTask.created_by,
    status: 'available',
    completed_at: null,
    deadline: newDeadline,
    deadline_type: parentTask.deadline_type,
    created_by_kid: parentTask.created_by_kid,
    recurring: 'none', // Instance tasks are not themselves recurring
    recurring_parent_id: parentTask.id
  };

  const stmt = db.prepare(`
    INSERT INTO tasks (
      id, title, description, points, duration, category, difficulty,
      assigned_to, created_by, status, completed_at, deadline, deadline_type,
      created_by_kid, recurring, recurring_parent_id, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    newTask.id,
    newTask.title,
    newTask.description,
    newTask.points,
    newTask.duration,
    newTask.category,
    newTask.difficulty,
    newTask.assigned_to,
    newTask.created_by,
    newTask.status,
    newTask.completed_at,
    newTask.deadline,
    newTask.deadline_type,
    newTask.created_by_kid,
    newTask.recurring,
    newTask.recurring_parent_id,
    now
  );

  console.log(`✅ Created recurring task instance: ${newTask.title} (${newTaskId})`);
  return newTask;
}

// Main function to process recurring tasks
export function processRecurringTasks() {
  const today = new Date();
  console.log(`🔄 Processing recurring tasks for ${today.toISOString().split('T')[0]}`);

  // Get all recurring tasks (that are themselves recurring templates, not instances)
  const recurringTasks = db.prepare(`
    SELECT * FROM tasks
    WHERE recurring IN ('daily', 'weekly')
    AND recurring_parent_id IS NULL
  `).all();

  console.log(`📋 Found ${recurringTasks.length} recurring task templates`);

  let createdCount = 0;
  let skippedCount = 0;

  for (const task of recurringTasks) {
    // Check if this task should recur today
    if (!shouldRecurToday(task, today)) {
      console.log(`⏭️  Skipping ${task.title} - not scheduled for today`);
      skippedCount++;
      continue;
    }

    // Check if instance already created today
    if (instanceCreatedToday(task.id)) {
      console.log(`⏭️  Skipping ${task.title} - instance already created today`);
      skippedCount++;
      continue;
    }

    // Check if previous instance is completed
    if (!previousInstanceCompleted(task.id)) {
      console.log(`⏭️  Skipping ${task.title} - previous instance not completed`);
      skippedCount++;
      continue;
    }

    // Create new instance
    createTaskInstance(task);
    createdCount++;
  }

  console.log(`✨ Recurring tasks processed: ${createdCount} created, ${skippedCount} skipped`);
  return { created: createdCount, skipped: skippedCount };
}

// Schedule the recurring task processor to run daily at midnight
export function startTaskScheduler() {
  console.log('🚀 Starting task scheduler...');

  // Calculate time until next midnight
  function getMillisecondsUntilMidnight() {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    return midnight - now;
  }

  // Schedule first run at midnight
  const msUntilMidnight = getMillisecondsUntilMidnight();
  console.log(`⏰ First run scheduled in ${Math.round(msUntilMidnight / 1000 / 60)} minutes`);

  setTimeout(() => {
    processRecurringTasks();

    // Then run every 24 hours
    setInterval(() => {
      processRecurringTasks();
    }, 24 * 60 * 60 * 1000);
  }, msUntilMidnight);

  // Run once immediately on startup to catch any missed tasks
  console.log('🔄 Running initial recurring task check...');
  processRecurringTasks();

  console.log('✅ Task scheduler started successfully');
}

// Export for manual testing/triggering
export default {
  startTaskScheduler,
  processRecurringTasks
};
