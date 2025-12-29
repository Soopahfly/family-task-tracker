// Migration script to copy data from production server to local dev
// Uses native fetch (Node 18+)

const PRODUCTION_URL = 'http://192.168.1.61:3000';
const LOCAL_URL = 'http://localhost:3001';

async function fetchData(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }
  return response.json();
}

async function postData(url, data) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    throw new Error(`Failed to post to ${url}: ${response.statusText}`);
  }
  return response.json();
}

async function migrate() {
  console.log('🚀 Starting migration from production to local dev...\n');

  try {
    // 1. Fetch all data from production
    console.log('📥 Fetching data from production server...');
    const [familyMembers, tasks, rewards, rewardSuggestions, settings] = await Promise.all([
      fetchData(`${PRODUCTION_URL}/api/family-members`),
      fetchData(`${PRODUCTION_URL}/api/tasks`),
      fetchData(`${PRODUCTION_URL}/api/rewards`),
      fetchData(`${PRODUCTION_URL}/api/reward-suggestions`),
      fetchData(`${PRODUCTION_URL}/api/settings`)
    ]);

    console.log(`✅ Fetched:`);
    console.log(`   - ${familyMembers.length} family members`);
    console.log(`   - ${tasks.length} tasks`);
    console.log(`   - ${rewards.length} rewards`);
    console.log(`   - ${rewardSuggestions.length} reward suggestions`);
    console.log('');

    // 2. Import family members
    console.log('👨‍👩‍👧‍👦 Importing family members...');
    for (const member of familyMembers) {
      await postData(`${LOCAL_URL}/api/family-members`, member);
      console.log(`   ✓ ${member.name}`);
    }

    // 3. Import tasks
    console.log('\n📋 Importing tasks...');
    for (const task of tasks) {
      await postData(`${LOCAL_URL}/api/tasks`, task);
      console.log(`   ✓ ${task.title}`);
    }

    // 4. Import rewards
    console.log('\n🎁 Importing rewards...');
    for (const reward of rewards) {
      await postData(`${LOCAL_URL}/api/rewards`, reward);
      console.log(`   ✓ ${reward.title}`);
    }

    // 5. Import reward suggestions
    console.log('\n💡 Importing reward suggestions...');
    for (const suggestion of rewardSuggestions) {
      await postData(`${LOCAL_URL}/api/reward-suggestions`, suggestion);
      console.log(`   ✓ ${suggestion.title}`);
    }

    // 6. Import settings
    if (settings && Object.keys(settings).length > 0) {
      console.log('\n⚙️  Importing settings...');
      const response = await fetch(`${LOCAL_URL}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (response.ok) {
        console.log('   ✓ Settings imported');
      }
    }

    console.log('\n');
    console.log('========================================');
    console.log('✅ MIGRATION COMPLETE!');
    console.log('========================================');
    console.log('');
    console.log('Summary:');
    console.log(`  • ${familyMembers.length} family members`);
    console.log(`  • ${tasks.length} tasks`);
    console.log(`  • ${rewards.length} rewards`);
    console.log(`  • ${rewardSuggestions.length} reward suggestions`);
    console.log('');
    console.log('Your local dev environment now has all production data!');
    console.log('Refresh your browser to see the data: http://localhost:5175');
    console.log('');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('');
    console.error('Please make sure:');
    console.error('  1. Production server is running at http://192.168.1.61:3000');
    console.error('  2. Local dev server is running at http://localhost:3001');
    console.error('  3. You can access both servers');
    process.exit(1);
  }
}

// Run migration
migrate();
