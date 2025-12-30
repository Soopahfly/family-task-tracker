import Database from 'better-sqlite3';
const db = new Database('./server/data/data.db');

console.log('=== Fixing Recurring Task Duplicates ===\n');

// Step 1: Find all recurring templates that were incorrectly marked as completed
const completedTemplates = db.prepare(`
  SELECT * FROM tasks
  WHERE recurring IN ('daily', 'weekly')
  AND recurring_parent_id IS NULL
  AND status = 'completed'
`).all();

console.log(`Found ${completedTemplates.length} recurring templates that were incorrectly completed:\n`);

for (const template of completedTemplates) {
  console.log(`📋 ${template.title}`);
  console.log(`   ID: ${template.id}`);
  console.log(`   Completed at: ${template.completed_at}`);
  console.log(`   Recurring: ${template.recurring}`);

  // Find instances created from this template
  const instances = db.prepare(`
    SELECT * FROM tasks
    WHERE recurring_parent_id = ?
    ORDER BY created_at ASC
  `).all(template.id);

  console.log(`   Found ${instances.length} instances created from this template`);

  if (instances.length > 0) {
    instances.forEach((instance, idx) => {
      console.log(`     ${idx + 1}. ${instance.id} - ${instance.status} - ${instance.created_at}`);
    });
  }
  console.log('');
}

// Step 2: Reset the recurring templates to uncompleted status
console.log('\n📝 Resetting recurring templates to "available" status...\n');

for (const template of completedTemplates) {
  db.prepare(`
    UPDATE tasks
    SET status = 'available', completed_at = NULL
    WHERE id = ?
  `).run(template.id);

  console.log(`✅ Reset ${template.title} (${template.id})`);
}

// Step 3: Find and handle duplicate instances created on the same day
console.log('\n🔍 Checking for duplicate instances created on the same day...\n');

const allTemplates = db.prepare(`
  SELECT * FROM tasks
  WHERE recurring IN ('daily', 'weekly')
  AND recurring_parent_id IS NULL
`).all();

for (const template of allTemplates) {
  // Find instances grouped by date
  const instancesByDate = db.prepare(`
    SELECT DATE(created_at) as date, COUNT(*) as count, GROUP_CONCAT(id) as ids
    FROM tasks
    WHERE recurring_parent_id = ?
    GROUP BY DATE(created_at)
    HAVING count > 1
  `).all(template.id);

  if (instancesByDate.length > 0) {
    console.log(`⚠️  Found duplicate instances for "${template.title}":`);

    for (const dateGroup of instancesByDate) {
      console.log(`   Date ${dateGroup.date}: ${dateGroup.count} instances`);

      const instanceIds = dateGroup.ids.split(',');
      const instances = instanceIds.map(id =>
        db.prepare('SELECT * FROM tasks WHERE id = ?').get(id)
      );

      // Keep the first completed one, or if none completed, keep the first one
      const completedInstance = instances.find(i => i.status === 'completed');
      const instanceToKeep = completedInstance || instances[0];

      console.log(`   Keeping: ${instanceToKeep.id} (${instanceToKeep.status})`);

      // Delete the others
      const instancesToDelete = instances.filter(i => i.id !== instanceToKeep.id);

      for (const instance of instancesToDelete) {
        // Check if this instance was completed (points were awarded)
        if (instance.status === 'completed' && instance.completed_at) {
          console.log(`   ⚠️  Deleting completed duplicate: ${instance.id}`);
          console.log(`      This instance earned ${instance.points} points`);
          console.log(`      Points were already awarded, so we won't remove them`);
          console.log(`      But we'll remove this duplicate from task_history`);

          // Remove from task_history
          db.prepare('DELETE FROM task_history WHERE task_id = ?').run(instance.id);
        }

        // Delete the duplicate task
        db.prepare('DELETE FROM tasks WHERE id = ?').run(instance.id);
        console.log(`   ✅ Deleted duplicate: ${instance.id}`);
      }
    }

    console.log('');
  }
}

// Step 4: Summary
console.log('\n========================================');
console.log('✅ Recurring Task Cleanup Complete!');
console.log('========================================\n');

console.log('Summary:');
console.log(`  • ${completedTemplates.length} recurring templates reset to "available"`);
console.log('  • Duplicate instances removed (kept most appropriate one per day)');
console.log('  • Task history cleaned up\n');

console.log('What was fixed:');
console.log('  1. Recurring templates are no longer marked as completed');
console.log('  2. Only one instance per day remains for each recurring task');
console.log('  3. Points that were earned remain with the user\n');

console.log('Going forward:');
console.log('  • Recurring templates will never be completed');
console.log('  • Each day, only ONE instance will be created');
console.log('  • Completing a template will auto-create and complete an instance instead\n');

db.close();
