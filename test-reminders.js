require('dotenv').config();
const reminderService = require('./services/reminderService');
const { User, MeditationSession } = require('./models');
const { sequelize } = require('./models');

async function testReminders() {
  console.log('🧪 Testing Reminder System\n');

  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Get reminder statistics
    console.log('📊 Reminder Statistics:');
    const stats = await reminderService.getReminderStats();
    console.log(JSON.stringify(stats, null, 2));
    console.log('');

    // Get all user reminder settings
    console.log('👥 User Reminder Settings:');
    const userReminders = await reminderService.getAllUserReminders();
    
    if (userReminders.length === 0) {
      console.log('❌ No users found. Please create a user first by starting the bot.');
      return;
    }

    userReminders.forEach(user => {
      console.log(`📱 ${user.name} (${user.telegramId})`);
      console.log(`   ⏰ Reminder: ${user.reminderTime} (${user.timezone})`);
      console.log(`   🎯 Next: ${user.nextReminder}`);
      console.log(`   🟢 Active: ${user.isActive}`);
      console.log('');
    });

    // Test sending a reminder to the first user
    if (userReminders.length > 0) {
      const testUser = userReminders[0];
      console.log(`🧪 Testing reminder for ${testUser.name}...`);
      
      const success = await reminderService.testReminderForUser(testUser.telegramId);
      if (success) {
        console.log('✅ Test reminder sent successfully!');
      } else {
        console.log('❌ Failed to send test reminder.');
      }
    }

    // Test the scheduling logic
    console.log('\n🔍 Testing Scheduling Logic:');
    console.log('Running reminder check (same as cron job)...');
    
    // This will check if any users should receive reminders now
    await reminderService.sendScheduledReminders(null);
    
    console.log('\n✅ Reminder system test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Close database connection
    await sequelize.close();
  }
}

// Helper function to create a test user
async function createTestUser() {
  try {
    await sequelize.authenticate();
    
    const testUser = await User.create({
      telegramId: 123456789,
      username: 'test_user',
      firstName: 'Test',
      name: 'Test User',
      age: 25,
      preferredDuration: '10 min',
      reminderTime: '09:00',
      timezone: 'UTC',
      isOnboardingComplete: true,
      isActive: true,
      currentDay: 1
    });

    console.log('✅ Test user created:', testUser.name);
    return testUser;
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      console.log('ℹ️ Test user already exists');
      return await User.findOne({ where: { telegramId: 123456789 } });
    }
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Command line arguments
const command = process.argv[2];

if (command === 'create-test-user') {
  createTestUser();
} else if (command === 'test') {
  testReminders();
} else {
  console.log('Usage:');
  console.log('  node test-reminders.js test              - Test reminder system');
  console.log('  node test-reminders.js create-test-user  - Create a test user');
}