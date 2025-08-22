const { User } = require('../models');
const moment = require('moment-timezone');
const telegramHandler = require('../handlers/telegramHandler');

class ReminderService {
  constructor() {
    this.sentRemindersToday = new Set();
    this.lastProcessedMinute = null;
  }

  async sendScheduledReminders(bot) {
    try {
      const currentUtc = moment.utc();
      const currentMinute = currentUtc.format('YYYY-MM-DD-HH-mm');
      
      // Prevent duplicate processing for the same minute
      if (this.lastProcessedMinute === currentMinute) {
        return;
      }
      this.lastProcessedMinute = currentMinute;

      console.log(`🔔 Checking reminders at ${currentUtc.format('YYYY-MM-DD HH:mm')} UTC`);
      
      // Find users who should receive reminders now
      const users = await User.findAll({
        where: {
          isActive: true,
          isOnboardingComplete: true
        }
      });

      console.log(`📊 Found ${users.length} active users to check for reminders`);
      let remindersSent = 0;

      for (const user of users) {
        try {
          // Get user's timezone (detect from system or use UTC)
          const userTimezone = this.getUserTimezone(user);
          const userTime = currentUtc.clone().tz(userTimezone);
          const currentTimeString = userTime.format('HH:mm');
          
          // Check if it's time to send reminder (match user's set time)
          if (this.shouldSendReminder(user, currentTimeString, userTime)) {
            const reminderKey = `${user.telegramId}_${userTime.format('YYYY-MM-DD')}`;
            
            // Check if we already sent a reminder today
            if (!this.sentRemindersToday.has(reminderKey)) {
              console.log(`⏰ Sending reminder to ${user.name || user.telegramId} (${user.reminderTime}) in ${userTimezone}`);
              
              await telegramHandler.sendDailyReminder(user);
              this.sentRemindersToday.add(reminderKey);
              remindersSent++;
              
              console.log(`✅ Reminder sent successfully to user ${user.telegramId} at ${currentTimeString} ${userTimezone}`);
            } else {
              console.log(`⏭️ Reminder already sent today to user ${user.telegramId}`);
            }
          }
        } catch (userError) {
          console.error(`❌ Error processing reminder for user ${user.telegramId}:`, userError);
        }
      }
      
      if (remindersSent > 0) {
        console.log(`🎯 Sent ${remindersSent} reminders this minute`);
      }
      
      // Clean up old reminder tracking (keep only today's)
      this.cleanupOldReminders();
      
    } catch (error) {
      console.error('❌ Error in sendScheduledReminders:', error);
    }
  }

  // Determine user's timezone
  getUserTimezone(user) {
    if (user.timezone && user.timezone !== 'UTC') {
      return user.timezone;
    }
    
    // Try to detect timezone based on common patterns or default to UTC
    // You could enhance this to detect user's timezone from their Telegram data
    return process.env.DEFAULT_TIMEZONE || 'UTC';
  }

  // Check if reminder should be sent
  shouldSendReminder(user, currentTimeString, userTime) {
    // Exact time match
    if (currentTimeString === user.reminderTime) {
      return true;
    }
    
    // Handle cases where reminder time might be in different format
    const reminderMoment = moment(user.reminderTime, ['HH:mm', 'H:mm', 'HH:mm:ss']);
    if (reminderMoment.isValid()) {
      const reminderTimeFormatted = reminderMoment.format('HH:mm');
      return currentTimeString === reminderTimeFormatted;
    }
    
    return false;
  }

  cleanupOldReminders() {
    const today = moment().format('YYYY-MM-DD');
    const keysToDelete = [];
    
    for (const key of this.sentRemindersToday) {
      if (!key.includes(today)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => {
      this.sentRemindersToday.delete(key);
    });
  }

  // Send a one-time reminder to specific user
  async sendImmediateReminder(bot, userId) {
    try {
      const user = await User.findByPk(userId);
      if (user && user.isActive && user.isOnboardingComplete) {
        await telegramHandler.sendDailyReminder(user);
        console.log(`Sent immediate reminder to user ${user.telegramId}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error sending immediate reminder to user ${userId}:`, error);
      return false;
    }
  }

  // Get user statistics for reminders
  async getReminderStats() {
    try {
      const totalUsers = await User.count({
        where: {
          isOnboardingComplete: true
        }
      });

      const activeUsers = await User.count({
        where: {
          isActive: true,
          isOnboardingComplete: true
        }
      });

      const sentToday = this.sentRemindersToday.size;

      return {
        totalUsers,
        activeUsers,
        sentToday,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting reminder stats:', error);
      return null;
    }
  }

  // Update user's reminder time
  async updateUserReminderTime(telegramId, newTime) {
    try {
      const user = await User.findOne({ where: { telegramId } });
      if (user) {
        await user.update({ reminderTime: newTime });
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error updating reminder time for user ${telegramId}:`, error);
      return false;
    }
  }

  // Update user's timezone
  async updateUserTimezone(telegramId, timezone) {
    try {
      const user = await User.findOne({ where: { telegramId } });
      if (user) {
        await user.update({ timezone });
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error updating timezone for user ${telegramId}:`, error);
      return false;
    }
  }

  // Deactivate user reminders
  async deactivateUser(telegramId) {
    try {
      const user = await User.findOne({ where: { telegramId } });
      if (user) {
        await user.update({ isActive: false });
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error deactivating user ${telegramId}:`, error);
      return false;
    }
  }

  // Reactivate user reminders
  async reactivateUser(telegramId) {
    try {
      const user = await User.findOne({ where: { telegramId } });
      if (user) {
        await user.update({ isActive: true });
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error reactivating user ${telegramId}:`, error);
      return false;
    }
  }

  // Manual trigger for testing reminders
  async testReminderForUser(telegramId) {
    try {
      const user = await User.findOne({ where: { telegramId } });
      if (user && user.isOnboardingComplete) {
        console.log(`🧪 Testing reminder for user ${user.name || telegramId}`);
        await telegramHandler.sendDailyReminder(user);
        console.log(`✅ Test reminder sent successfully`);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error testing reminder for user ${telegramId}:`, error);
      return false;
    }
  }

  // Get all users with their reminder settings
  async getAllUserReminders() {
    try {
      const users = await User.findAll({
        where: {
          isOnboardingComplete: true
        },
        attributes: ['telegramId', 'name', 'reminderTime', 'timezone', 'isActive']
      });

      return users.map(user => ({
        telegramId: user.telegramId,
        name: user.name || 'Unknown',
        reminderTime: user.reminderTime,
        timezone: this.getUserTimezone(user),
        isActive: user.isActive,
        nextReminder: this.getNextReminderTime(user)
      }));
    } catch (error) {
      console.error('Error getting user reminders:', error);
      return [];
    }
  }

  // Calculate next reminder time for a user
  getNextReminderTime(user) {
    try {
      const userTimezone = this.getUserTimezone(user);
      const now = moment().tz(userTimezone);
      const reminderTime = moment.tz(user.reminderTime, 'HH:mm', userTimezone);
      
      // If reminder time has passed today, set for tomorrow
      if (reminderTime.isBefore(now)) {
        reminderTime.add(1, 'day');
      }
      
      return reminderTime.format('YYYY-MM-DD HH:mm z');
    } catch (error) {
      return 'Invalid time';
    }
  }

  // Set user timezone automatically based on their Telegram data (if available)
  async detectAndSetUserTimezone(user, telegramData = null) {
    try {
      // This is a placeholder for timezone detection
      // In practice, you might ask the user or use Telegram's API data
      
      let detectedTimezone = 'UTC';
      
      // You could enhance this with:
      // - User's language code from Telegram
      // - IP-based detection (if available)
      // - Manual timezone selection during onboarding
      
      await user.update({ timezone: detectedTimezone });
      console.log(`Set timezone for user ${user.telegramId}: ${detectedTimezone}`);
      
      return detectedTimezone;
    } catch (error) {
      console.error(`Error detecting timezone for user ${user.telegramId}:`, error);
      return 'UTC';
    }
  }
}

module.exports = new ReminderService();