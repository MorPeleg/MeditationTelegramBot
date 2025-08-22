const { User, MeditationSession, VideoRating, MeditationVideo } = require('../models');
const { meditationVideos, durationOptions } = require('../data/meditationData');
const messageGenerationService = require('../services/messageGenerationService');
const analyticsService = require('../services/analyticsService');
const videoRecommendationService = require('../services/videoRecommendationService');
const moment = require('moment-timezone');

class TelegramHandler {
  constructor() {
    this.bot = null;
    this.userSessions = new Map(); // Store temporary session data
  }

  init(bot) {
    this.bot = bot;
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    // Handle /start command
    this.bot.onText(/\/start/, async (msg) => {
      await this.handleStart(msg);
    });

    // Handle /help command
    this.bot.onText(/\/help/, async (msg) => {
      await this.handleHelp(msg);
    });

    // Handle /progress command
    this.bot.onText(/\/progress/, async (msg) => {
      await this.handleProgress(msg);
    });

    // Handle /settings command
    this.bot.onText(/\/settings/, async (msg) => {
      await this.handleSettings(msg);
    });

    // Handle /test command for testing reminders
    this.bot.onText(/\/test/, async (msg) => {
      await this.handleTestReminder(msg);
    });

    // Handle callback queries (inline keyboard buttons)
    this.bot.on('callback_query', async (callbackQuery) => {
      await this.handleCallbackQuery(callbackQuery);
    });

    // Handle text messages
    this.bot.on('message', async (msg) => {
      if (msg.text && !msg.text.startsWith('/')) {
        await this.handleTextMessage(msg);
      }
    });

    console.log('Telegram event handlers initialized');
  }

  async handleStart(msg) {
    const chatId = msg.chat.id;
    const telegramId = msg.from.id;
    
    try {
      let user = await User.findOne({ where: { telegramId } });
      
      if (!user) {
        // Create new user
        user = await User.create({
          telegramId,
          username: msg.from.username,
          firstName: msg.from.first_name,
          lastName: msg.from.last_name,
          onboardingStep: 0,
          isOnboardingComplete: false
        });
      }

      if (!user.isOnboardingComplete) {
        await this.startOnboarding(chatId, user);
      } else {
        await this.showMainMenu(chatId, user);
      }
    } catch (error) {
      console.error('Error handling start command:', error);
      await this.bot.sendMessage(chatId, 'Sorry, something went wrong. Please try again.');
    }
  }

  async startOnboarding(chatId, user) {
    const welcomeMessage = `🧘‍♀️ Welcome to MindfulU Bot!

I'm here to help you build a daily meditation habit with personalized guidance and reminders.

Let's get started with a quick setup. First, what's your name?`;

    await this.bot.sendMessage(chatId, welcomeMessage);
    await user.update({ onboardingStep: 1 });
  }

  async handleTextMessage(msg) {
    const chatId = msg.chat.id;
    const telegramId = msg.from.id;
    const text = msg.text;

    try {
      const user = await User.findOne({ where: { telegramId } });
      if (!user) {
        await this.handleStart(msg);
        return;
      }

      // Check if user is in a special input state (like custom time entry)
      const userSession = this.userSessions.get(telegramId);
      if (userSession && userSession.waitingFor === 'customTime') {
        await this.handleCustomTimeInput(chatId, user, text, userSession);
        return;
      }

      if (!user.isOnboardingComplete) {
        await this.handleOnboardingStep(chatId, user, text);
      } else {
        // Default response for completed users
        await this.bot.sendMessage(chatId, `I received your message: "${text}"\n\nUse /help to see available commands or /start to see your daily meditation.`);
      }
    } catch (error) {
      console.error('Error handling text message:', error);
      await this.bot.sendMessage(chatId, 'Sorry, something went wrong. Please try again.');
    }
  }

  async handleCustomTimeInput(chatId, user, timeText, userSession) {
    try {
      // Validate time format
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
      if (!timeRegex.test(timeText)) {
        await this.bot.sendMessage(chatId, `❌ Invalid time format. Please enter time in HH:MM format (e.g., 08:30, 14:15).\n\nTry again:`);
        return;
      }

      // Update user's reminder time
      await user.update({ reminderTime: timeText });
      
      // Clear user session
      this.userSessions.delete(user.telegramId);

      // Send confirmation
      const userTimezone = user.timezone || 'UTC';
      const confirmationMessage = `✅ *Custom reminder time set successfully!*\n\nNew time: ${timeText} (${userTimezone})\n\nI'll send your daily reminders at ${timeText} in your timezone.`;
      
      const keyboard = {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🧪 Test Reminder Now', callback_data: 'test_reminder' }],
            [{ text: '🔙 Back to Settings', callback_data: 'back_to_settings' }],
            [{ text: '🏠 Main Menu', callback_data: 'back_to_menu' }]
          ]
        }
      };

      // Try to edit the existing message first, if it fails, send a new one
      try {
        if (userSession.messageId) {
          await this.bot.editMessageText(confirmationMessage, {
            chat_id: chatId,
            message_id: userSession.messageId,
            parse_mode: 'Markdown',
            ...keyboard
          });
        } else {
          await this.bot.sendMessage(chatId, confirmationMessage, { 
            parse_mode: 'Markdown',
            ...keyboard
          });
        }
      } catch (editError) {
        // If edit fails, send a new message
        await this.bot.sendMessage(chatId, confirmationMessage, { 
          parse_mode: 'Markdown',
          ...keyboard
        });
      }

    } catch (error) {
      console.error('Error handling custom time input:', error);
      this.userSessions.delete(user.telegramId);
      await this.bot.sendMessage(chatId, '❌ Sorry, something went wrong while setting your reminder time. Please try again through /settings.');
    }
  }

  async handleOnboardingStep(chatId, user, text) {
    const step = user.onboardingStep;

    switch (step) {
      case 1: // Name
        await user.update({ name: text, onboardingStep: 2 });
        await this.bot.sendMessage(chatId, `Nice to meet you, ${text}! 👋\n\nHow old are you? (This helps us personalize your meditation experience)`);
        break;

      case 2: // Age
        const age = parseInt(text);
        if (isNaN(age) || age < 10 || age > 100) {
          await this.bot.sendMessage(chatId, 'Please enter a valid age (between 10 and 100):');
          return;
        }
        await user.update({ age, onboardingStep: 3 });
        
        const genderKeyboard = {
          reply_markup: {
            inline_keyboard: [
              [{ text: 'Male', callback_data: 'gender_Male' }],
              [{ text: 'Female', callback_data: 'gender_Female' }],
              [{ text: 'Non-binary', callback_data: 'gender_Non-binary' }],
              [{ text: 'Prefer not to say', callback_data: 'gender_Prefer not to say' }]
            ]
          }
        };
        await this.bot.sendMessage(chatId, 'What\'s your gender? (Optional - helps us personalize content)', genderKeyboard);
        break;

      case 4: // Motivation
        await user.update({ motivation: text, onboardingStep: 5 });
        
        const durationKeyboard = {
          reply_markup: {
            inline_keyboard: durationOptions.map(duration => 
              [{ text: duration, callback_data: `duration_${duration}` }]
            )
          }
        };
        await this.bot.sendMessage(chatId, 'Great! How long would you like your daily meditation sessions to be?', durationKeyboard);
        break;

      case 6: // Reminder time
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(text)) {
          await this.bot.sendMessage(chatId, 'Please enter a valid time in HH:MM format (e.g., 09:30):');
          return;
        }
        
        await user.update({ 
          reminderTime: text, 
          onboardingStep: 7,
          isOnboardingComplete: true 
        });
        
        const completeMessage = `🎉 Perfect! Your meditation journey is all set up!

📋 Here's your profile:
• Name: ${user.name}
• Age: ${user.age}
• Preferred duration: ${user.preferredDuration}
• Daily reminder: ${text}
• Motivation: ${user.motivation}

I'll send you a daily reminder at ${text} with a personalized meditation session. You can always change these settings with /settings.

Ready to start your mindfulness journey? 🧘‍♀️`;

        await this.bot.sendMessage(chatId, completeMessage);
        await this.showMainMenu(chatId, user);
        break;

      default:
        await this.bot.sendMessage(chatId, 'Something went wrong with onboarding. Let\'s start over with /start');
    }
  }

  async handleCallbackQuery(callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    const telegramId = callbackQuery.from.id;
    const data = callbackQuery.data;

    try {
      const user = await User.findOne({ where: { telegramId } });
      if (!user) return;

      if (data.startsWith('gender_')) {
        const gender = data.replace('gender_', '');
        await user.update({ gender, onboardingStep: 4 });
        await this.bot.editMessageText(
          `Thanks! What motivates you to start meditating?\n\n(e.g., reduce stress, improve focus, better sleep, manage anxiety...)`,
          { chat_id: chatId, message_id: callbackQuery.message.message_id }
        );
      } else if (data.startsWith('duration_')) {
        const duration = data.replace('duration_', '');
        await user.update({ preferredDuration: duration, onboardingStep: 6 });
        await this.bot.editMessageText(
          `Perfect! When would you like your daily meditation reminders?\n\nPlease enter the time in HH:MM format (e.g., 09:00 or 19:30):`,
          { chat_id: chatId, message_id: callbackQuery.message.message_id }
        );
      } else if (data === 'start_meditation') {
        await this.startMeditationSession(chatId, user);
      } else if (data === 'view_progress') {
        // Create a proper message object for progress with the correct from field
        const msgForProgress = {
          chat: callbackQuery.message.chat,
          from: callbackQuery.from,
          message_id: callbackQuery.message.message_id
        };
        await this.handleProgress(msgForProgress);
      } else if (data === 'change_settings') {
        // Create a proper message object for settings with the correct from field
        const msgForSettings = {
          chat: callbackQuery.message.chat,
          from: callbackQuery.from,
          message_id: callbackQuery.message.message_id
        };
        await this.handleSettings(msgForSettings);
      } else if (data.startsWith('feedback_')) {
        await this.handleFeedback(callbackQuery, user);
      } else if (data.startsWith('settings_')) {
        await this.handleSettingsChange(callbackQuery, user);
      } else if (data.startsWith('duration_change_')) {
        await this.handleSettingsChange(callbackQuery, user);
      } else if (data.startsWith('time_change_')) {
        await this.handleSettingsChange(callbackQuery, user);
      } else if (data.startsWith('timezone_')) {
        await this.handleSettingsChange(callbackQuery, user);
      } else if (data === 'time_custom') {
        await this.handleSettingsChange(callbackQuery, user);
      } else if (data === 'back_to_settings') {
        await this.handleSettingsChange(callbackQuery, user);
      } else if (data === 'test_reminder') {
        await this.handleTestReminder(callbackQuery.message);
      } else if (data === 'back_to_menu') {
        await this.showMainMenu(chatId, user);
      }

      await this.bot.answerCallbackQuery(callbackQuery.id);
    } catch (error) {
      console.error('Error handling callback query:', error);
      await this.bot.answerCallbackQuery(callbackQuery.id, { text: 'Something went wrong' });
    }
  }

  async showMainMenu(chatId, user) {
    try {
      console.log(`🔍 showMainMenu called for user: ${user.name}, preferredDuration: "${user.preferredDuration}", currentDay: ${user.currentDay}`);
      
      // Generate dynamic motivational message and store it for later use
      const motivationalMessage = await messageGenerationService.generateMotivationalMessage(user, user.currentDay);
      
      // Store the message temporarily so startMeditationSession can use the same one
      this.userMessages = this.userMessages || new Map();
      this.userMessages.set(user.telegramId, motivationalMessage);
      
      // Get today's static video - handle duration mapping
      let userDuration = user.preferredDuration;
      console.log(`🔍 Original duration: "${userDuration}"`);
      
      // Clean up duration string if it has 'change_' prefix
      if (userDuration && userDuration.startsWith('change_')) {
        userDuration = userDuration.replace('change_', '');
      }
      console.log(`🔍 Cleaned duration: "${userDuration}"`);
      
      // Fallback to '10 min' if duration not found
      if (!meditationVideos[userDuration]) {
        console.warn(`Duration "${userDuration}" not found in static videos, using fallback`);
        userDuration = '10 min';
      }
      console.log(`🔍 Final duration: "${userDuration}"`);
      console.log(`🔍 Available videos for duration:`, meditationVideos[userDuration]);
      
      if (!meditationVideos[userDuration] || !meditationVideos[userDuration].length) {
        throw new Error(`No videos available for duration: ${userDuration}`);
      }
      
      // Get session count for today to cycle through videos
      const userTimezone = user.timezone || 'UTC';
      const todayUserDate = moment().tz(userTimezone).format('YYYY-MM-DD');
      const todaysSessionCount = await MeditationSession.count({
        where: { 
          userId: user.id,
          date: todayUserDate
        }
      });
      
      // Cycle through available videos for variety within the same day
      const videoIndex = (user.currentDay + todaysSessionCount) % meditationVideos[userDuration].length;
      const todaysVideo = meditationVideos[userDuration][videoIndex];
      console.log(`🔍 Selected video (session ${todaysSessionCount + 1} for day ${user.currentDay}):`, todaysVideo.title);

      const menuMessage = `🧘‍♀️ *Day ${user.currentDay}* - Your Daily Meditation

🎯 *Today's Motivation:*
_${motivationalMessage}_

📺 *Today's ${userDuration} meditation:*
*${todaysVideo.title}*

What would you like to do?`;

      const keyboard = {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🎬 Start Today\'s Meditation', callback_data: 'start_meditation' }],
            [{ text: '📊 View Progress', callback_data: 'view_progress' }],
            [{ text: '⚙️ Settings', callback_data: 'change_settings' }]
          ]
        }
      };

      await this.bot.sendMessage(chatId, menuMessage, { 
        parse_mode: 'Markdown',
        ...keyboard
      });
      
    } catch (error) {
      console.error('❌ Error in showMainMenu:', error);
      await this.bot.sendMessage(chatId, '❌ Sorry, something went wrong while loading your menu. Please try again.');
    }
  }

  async startMeditationSession(chatId, user) {
    try {
      // Reuse the same motivational message that was shown in the main menu
      this.userMessages = this.userMessages || new Map();
      const dynamicMessage = this.userMessages.get(user.telegramId) || 
                             await messageGenerationService.generateMotivationalMessage(user, user.currentDay);
      
      // COMMENTED OUT: Dynamic video recommendation system
      /*
      // Get personalized video recommendation
      let recommendedVideo;
      try {
        recommendedVideo = await videoRecommendationService.recommendVideo(user);
      } catch (videoError) {
        console.warn('Video recommendation failed, using fallback:', videoError.message);
        // Fallback to static videos if recommendation fails
        recommendedVideo = meditationVideos[user.preferredDuration][user.currentDay % meditationVideos[user.preferredDuration].length];
      }
      */
      
      // Use static video selection - handle duration mapping
      let userDuration = user.preferredDuration;
      
      // Clean up duration string if it has 'change_' prefix
      if (userDuration.startsWith('change_')) {
        userDuration = userDuration.replace('change_', '');
      }
      
      // Fallback to '10 min' if duration not found
      if (!meditationVideos[userDuration]) {
        console.warn(`Duration "${userDuration}" not found in static videos, using fallback`);
        userDuration = '10 min';
      }
      
      // Get session count for today to cycle through videos  
      const userTimezone = user.timezone || 'UTC';
      const todayUserDate = moment().tz(userTimezone).format('YYYY-MM-DD');
      const todaysSessionCount = await MeditationSession.count({
        where: { 
          userId: user.id,
          date: todayUserDate
        }
      });
      
      // Cycle through available videos for variety within the same day
      const videoIndex = (user.currentDay + todaysSessionCount) % meditationVideos[userDuration].length;
      const todaysVideo = meditationVideos[userDuration][videoIndex];

      // Create meditation session record
      const session = await MeditationSession.create({
        userId: user.id,
        day: user.currentDay,
        date: todayUserDate,
        duration: todaysVideo.duration,
        videoId: null, // No database video ID for static videos
        videoTitle: todaysVideo.title,
        videoUrl: todaysVideo.url,
        bctTechniqueId: "Dynamic", // Mark as dynamically generated
        bctMessage: dynamicMessage
      });

      // Store session in temporary storage for feedback
      this.userSessions.set(user.telegramId, { sessionId: session.id, videoId: null });

      // Create session message - using static video data
      const sessionMessage = `🎬 ${todaysVideo.title}
Duration: ${todaysVideo.duration}

${todaysVideo.url}

After you complete your meditation, I'll ask for some quick feedback to help improve your experience! 🙏`;

      const feedbackKeyboard = {
        reply_markup: {
          inline_keyboard: [
            [{ text: '✅ I completed the meditation', callback_data: 'feedback_completed_yes' }],
            [{ text: '⏸️ I didn\'t finish it', callback_data: 'feedback_completed_no' }]
          ]
        }
      };

      await this.bot.sendMessage(chatId, sessionMessage, feedbackKeyboard);
      
    } catch (error) {
      console.error('Error starting meditation session:', error);
      await this.bot.sendMessage(chatId, '❌ Sorry, something went wrong while preparing your meditation. Please try again.');
    }
  }

  async handleFeedback(callbackQuery, user) {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;
    const sessionData = this.userSessions.get(user.telegramId);

    if (!sessionData || !sessionData.sessionId) {
      await this.bot.editMessageText(
        'Session not found. Please start a new meditation session.',
        { chat_id: chatId, message_id: callbackQuery.message.message_id }
      );
      return;
    }

    const session = await MeditationSession.findByPk(sessionData.sessionId);
    if (!session) return;

    if (data === 'feedback_completed_yes') {
      await session.update({ completed: true });
      
      const ratingKeyboard = {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '1 - Not helpful at all', callback_data: 'feedback_video_1' },
              { text: '2 - Slightly helpful', callback_data: 'feedback_video_2' }
            ],
            [
              { text: '3 - Moderately helpful', callback_data: 'feedback_video_3' },
              { text: '4 - Very helpful', callback_data: 'feedback_video_4' }
            ],
            [
              { text: '5 - Extremely helpful', callback_data: 'feedback_video_5' }
            ]
          ]
        }
      };
      await this.bot.editMessageText(
        '🎉 Great job completing your meditation!\n\n📊 How helpful was this meditation video?\n\nPlease rate on a scale of 1-5:',
        { chat_id: chatId, message_id: callbackQuery.message.message_id, ...ratingKeyboard }
      );
      
    } else if (data === 'feedback_completed_no') {
      await session.update({ completed: false });
      
      const ratingKeyboard = {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '1 - Not helpful at all', callback_data: 'feedback_video_1' },
              { text: '2 - Slightly helpful', callback_data: 'feedback_video_2' }
            ],
            [
              { text: '3 - Moderately helpful', callback_data: 'feedback_video_3' },
              { text: '4 - Very helpful', callback_data: 'feedback_video_4' }
            ],
            [
              { text: '5 - Extremely helpful', callback_data: 'feedback_video_5' }
            ]
          ]
        }
      };
      await this.bot.editMessageText(
        'No worries! Even a few minutes of mindfulness counts. 😊\n\n📊 How helpful was this meditation video?\n\nPlease rate on a scale of 1-5:',
        { chat_id: chatId, message_id: callbackQuery.message.message_id, ...ratingKeyboard }
      );
    } else if (data.startsWith('feedback_video_')) {
      const videoRating = parseInt(data.split('_')[2]);
      await session.update({ videoHelpful: videoRating });
      
      const messageRatingKeyboard = {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '1 - Not helpful at all', callback_data: 'feedback_message_1' },
              { text: '2 - Slightly helpful', callback_data: 'feedback_message_2' }
            ],
            [
              { text: '3 - Moderately helpful', callback_data: 'feedback_message_3' },
              { text: '4 - Very helpful', callback_data: 'feedback_message_4' }
            ],
            [
              { text: '5 - Extremely helpful', callback_data: 'feedback_message_5' }
            ]
          ]
        }
      };
      await this.bot.editMessageText(
        'Thanks for the feedback! 👍\n\n💭 How helpful was today\'s motivational message?\n\nPlease rate on a scale of 1-5:',
        { chat_id: chatId, message_id: callbackQuery.message.message_id, ...messageRatingKeyboard }
      );
      
    } else if (data.startsWith('feedback_message_')) {
      const messageRating = parseInt(data.split('_')[2]);
      await session.update({ messageHelpful: messageRating });
      
      // Record the comprehensive rating for static videos
      try {
        console.log('📊 Recording ratings for static video system');
        console.log('Session data:', {
          sessionId: session.id,
          userId: user.id,
          videoTitle: session.videoTitle,
          videoUrl: session.videoUrl,
          videoRating: session.videoHelpful,
          messageRating: messageRating,
          completed: session.completed,
          bctMessage: session.bctMessage,
          bctTechniqueId: session.bctTechniqueId,
          userDay: session.day,
          duration: session.duration
        });

        // Create a comprehensive rating record
        await VideoRating.create({
          userId: user.id,
          videoId: null, // Static videos don't have database IDs
          sessionId: session.id,
          videoRating: session.videoHelpful,
          messageRating: messageRating,
          completed: session.completed,
          userDay: session.day,
          duration: session.duration,
          bctTechniques: session.bctTechniqueId ? [{
            id: session.bctTechniqueId,
            message: session.bctMessage,
            timestamp: new Date()
          }] : null
        });

        console.log(`📊 Recorded ratings: Video ${session.videoHelpful}/5, Message ${messageRating}/5 for user ${user.name} on day ${session.day}`);
      } catch (ratingError) {
        console.error('Error recording video rating:', ratingError);
        // Continue with the flow even if rating fails
      }
      
      // Check if we should advance to next day based on user's timezone
      const userTimezone = user.timezone || 'UTC';
      const currentUserTime = moment().tz(userTimezone);
      const todayUserDate = currentUserTime.format('YYYY-MM-DD');
      
      // Get the latest session date for this user
      const latestSession = await MeditationSession.findOne({
        where: { userId: user.id },
        order: [['createdAt', 'DESC']]
      });
      
      let shouldAdvanceDay = false;
      let newDay = user.currentDay;
      
      if (!latestSession || latestSession.date !== todayUserDate) {
        // This is the first session of a new day in user's timezone
        shouldAdvanceDay = true;
        newDay = user.currentDay + 1;
        console.log(`📅 Advancing to new day: ${newDay} for user ${user.name} (timezone: ${userTimezone}, date: ${todayUserDate})`);
      } else {
        console.log(`📅 Staying on current day: ${user.currentDay} for user ${user.name} (same date: ${todayUserDate})`);
      }
      
      if (shouldAdvanceDay) {
        await user.update({ currentDay: newDay });
      }
      
      // Clear session from temporary storage
      this.userSessions.delete(user.telegramId);
      
      const dayMessage = shouldAdvanceDay ? 
        `🙏 Thank you for your feedback! Your responses help me provide better meditation experiences.\n\nSee you tomorrow for Day ${newDay + 1}! 🧘‍♀️` :
        `🙏 Thank you for your feedback! Your responses help me provide better meditation experiences.\n\nFeel free to meditate again today or see you tomorrow for Day ${user.currentDay + 1}! 🧘‍♀️`;
      
      await this.bot.editMessageText(dayMessage, { chat_id: chatId, message_id: callbackQuery.message.message_id });
    }
  }

  async handleProgress(msg) {
    const chatId = msg.chat.id;
    const telegramId = msg.from ? msg.from.id : msg.chat.id;
    
    console.log(`🔍 handleProgress called for chatId: ${chatId}, telegramId: ${telegramId}`);

    try {
      const user = await User.findOne({ where: { telegramId } });
      if (!user) {
        await this.handleStart(msg);
        return;
      }

      const sessions = await MeditationSession.findAll({
        where: { userId: user.id },
        order: [['createdAt', 'DESC']],
        limit: 50 // Increased limit to get more comprehensive data
      });

      // Calculate days where meditation was provided (unique days)
      const uniqueDays = new Set(sessions.map(s => s.day));
      const totalDaysProvided = uniqueDays.size;
      
      // Calculate days where at least one meditation was viewed (has a session record)
      const daysWithSessions = totalDaysProvided; // If there's a session, meditation was viewed
      
      // Calculate days where meditation was actually completed
      const completedDays = new Set();
      sessions.forEach(session => {
        if (session.completed === true) {
          completedDays.add(session.day);
        }
      });
      const daysCompleted = completedDays.size;
      
      // Calculate current user's meditation journey length (how many days they've been on the journey)
      const maxDay = user.currentDay;
      
      // Completion rate based on days where meditation was at least viewed
      const completionRate = totalDaysProvided > 0 ? Math.round((daysCompleted / totalDaysProvided) * 100) : 0;

      // Generate dynamic insight message
      const analytics = await analyticsService.getUserAnalytics(telegramId);
      const insightMessage = analytics ? 
        await messageGenerationService.generateInsightMessage(user, analytics) :
        "Your meditation journey is building valuable habits! (BCT 2.3, 15.1)";

      let progressMessage = `📊 Your Meditation Progress

🎯 Personal Insight:
${insightMessage}

📈 Journey Stats:
• Days completed: ${daysCompleted} out of ${totalDaysProvided}
• Completion rate: ${completionRate}%
• Current day: ${user.currentDay}
• Total sessions: ${sessions.length}

📅 Recent Sessions:\n`;

      if (sessions.length === 0) {
        progressMessage += 'No sessions yet. Start your first meditation to see progress!';
      } else {
        // Group sessions by day and show the most recent status for each day
        const sessionsByDay = new Map();
        sessions.forEach(session => {
          if (!sessionsByDay.has(session.day) || session.createdAt > sessionsByDay.get(session.day).createdAt) {
            sessionsByDay.set(session.day, session);
          }
        });
        
        // Sort by day and show recent days
        const sortedDays = Array.from(sessionsByDay.keys()).sort((a, b) => b - a);
        sortedDays.slice(0, 7).forEach(day => {
          const session = sessionsByDay.get(day);
          const status = session.completed === true ? '✅ Completed' : 
                        session.completed === false ? '⏸️ Partial' : '👀 Viewed';
          progressMessage += `${status} - Day ${session.day} (${session.date}) - ${session.duration}\n`;
        });
        
        if (sortedDays.length > 7) {
          progressMessage += `... and ${sortedDays.length - 7} more days\n`;
        }
      }

      await this.bot.sendMessage(chatId, progressMessage);
    } catch (error) {
      console.error('Error handling progress:', error);
      await this.bot.sendMessage(chatId, 'Sorry, I couldn\'t retrieve your progress. Please try again.');
    }
  }

  async handleSettings(msg) {
    const chatId = msg.chat.id;
    const telegramId = msg.from ? msg.from.id : msg.chat.id;

    console.log(`🔍 handleSettings called for chatId: ${chatId}, telegramId: ${telegramId}`);
    console.log(`📱 Message object:`, { 
      chat: msg.chat, 
      from: msg.from,
      message_id: msg.message_id
    });

    try {
      // Check all users to debug the issue
      const allUsers = await User.findAll();
      console.log(`📊 All users in database:`, allUsers.map(u => ({
        id: u.id,
        telegramId: u.telegramId,
        name: u.name,
        age: u.age,
        gender: u.gender,
        reminderTime: u.reminderTime,
        timezone: u.timezone
      })));

      let user = await User.findOne({ where: { telegramId } });
      if (!user) {
        console.log(`❌ No user found for telegramId: ${telegramId}, starting onboarding`);
        await this.handleStart(msg);
        return;
      }

      // Reload user data to ensure we have the latest values
      await user.reload();
      
      console.log(`🔧 Settings for user ${telegramId}:`, {
        name: user.name,
        age: user.age,
        gender: user.gender,
        reminderTime: user.reminderTime,
        timezone: user.timezone,
        preferredDuration: user.preferredDuration
      });

      const settingsMessage = `⚙️ Your Settings

👤 Profile:
• Name: ${user.name || 'Not set'}
• Age: ${user.age || 'Not set'}
• Gender: ${user.gender || 'Not specified'}

🧘‍♀️ Meditation Preferences:
• Duration: ${user.preferredDuration || '10 min'}
• Reminder time: ${user.reminderTime || '09:00'}
• Timezone: ${user.timezone || 'UTC'}
• Motivation: ${user.motivation || 'Not set'}

What would you like to change?`;

      const keyboard = {
        reply_markup: {
          inline_keyboard: [
            [{ text: '⏱️ Change Duration', callback_data: 'settings_duration' }],
            [{ text: '🕐 Change Reminder Time', callback_data: 'settings_time' }],
            [{ text: '🌍 Change Timezone', callback_data: 'settings_timezone' }],
            [{ text: '🔙 Back to Menu', callback_data: 'back_to_menu' }]
          ]
        }
      };

      await this.bot.sendMessage(chatId, settingsMessage, { 
        // Removed parse_mode to avoid Markdown parsing issues
        ...keyboard
      });
    } catch (error) {
      console.error('Error handling settings:', error);
      await this.bot.sendMessage(chatId, 'Sorry, I couldn\'t load your settings. Please try again.');
    }
  }

  async handleSettingsChange(callbackQuery, user) {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;

    try {
      if (data === 'settings_duration') {
        const durationKeyboard = {
          reply_markup: {
            inline_keyboard: [
              ...durationOptions.map(duration => 
                [{ text: duration, callback_data: `duration_change_${duration}` }]
              ),
              [{ text: '🔙 Back to Settings', callback_data: 'back_to_settings' }]
            ]
          }
        };

        await this.bot.editMessageText(
          `⏱️ *Choose your new meditation duration:*\n\nCurrent: ${user.preferredDuration}`,
          { 
            chat_id: chatId, 
            message_id: callbackQuery.message.message_id,
            parse_mode: 'Markdown',
            ...durationKeyboard
          }
        );

      } else if (data === 'settings_time') {
        // Create time selection menu
        const timeOptions = [
          '06:00', '06:30', '07:00', '07:30', '08:00', '08:30',
          '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
          '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
          '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
          '18:00', '18:30', '19:00', '19:30', '20:00', '20:30',
          '21:00', '21:30', '22:00', '22:30'
        ];

        const timeKeyboard = {
          reply_markup: {
            inline_keyboard: [
              ...this.chunkArray(timeOptions, 3).map(row => 
                row.map(time => ({ text: time, callback_data: `time_change_${time}` }))
              ),
              [{ text: '✏️ Custom Time', callback_data: 'time_custom' }],
              [{ text: '🔙 Back to Settings', callback_data: 'back_to_settings' }]
            ]
          }
        };

        await this.bot.editMessageText(
          `🕐 *Choose your new reminder time:*\n\nCurrent: ${user.reminderTime}\n\nSelect a time or choose 'Custom Time' to enter manually:`,
          { 
            chat_id: chatId, 
            message_id: callbackQuery.message.message_id,
            parse_mode: 'Markdown',
            ...timeKeyboard
          }
        );

      } else if (data === 'settings_timezone') {
        const timezoneKeyboard = {
          reply_markup: {
            inline_keyboard: [
              [{ text: 'UTC', callback_data: 'timezone_UTC' }],
              [{ text: 'America/New_York (EST)', callback_data: 'timezone_America/New_York' }],
              [{ text: 'America/Los_Angeles (PST)', callback_data: 'timezone_America/Los_Angeles' }],
              [{ text: 'Europe/London (GMT)', callback_data: 'timezone_Europe/London' }],
              [{ text: 'Europe/Berlin (CET)', callback_data: 'timezone_Europe/Berlin' }],
              [{ text: 'Asia/Jerusalem (IST)', callback_data: 'timezone_Asia/Jerusalem' }],
              [{ text: 'Asia/Tokyo (JST)', callback_data: 'timezone_Asia/Tokyo' }],
              [{ text: 'Australia/Sydney', callback_data: 'timezone_Australia/Sydney' }],
              [{ text: '🔙 Back to Settings', callback_data: 'back_to_settings' }]
            ]
          }
        };

        await this.bot.editMessageText(
          `🌍 *Choose your timezone:*\n\nCurrent: ${user.timezone || 'UTC'}\n\nThis ensures your reminders arrive at the right local time:`,
          { 
            chat_id: chatId, 
            message_id: callbackQuery.message.message_id,
            parse_mode: 'Markdown',
            ...timezoneKeyboard
          }
        );

      } else if (data.startsWith('duration_change_')) {
        const newDuration = data.replace('duration_change_', '');
        await user.update({ preferredDuration: newDuration });
        
        await this.bot.editMessageText(
          `✅ *Duration updated successfully!*\n\nNew duration: ${newDuration}\n\nYour meditation sessions will now be ${newDuration} long.`,
          { 
            chat_id: chatId, 
            message_id: callbackQuery.message.message_id,
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '🔙 Back to Settings', callback_data: 'back_to_settings' }],
                [{ text: '🏠 Main Menu', callback_data: 'back_to_menu' }]
              ]
            }
          }
        );

      } else if (data.startsWith('time_change_')) {
        const newTime = data.replace('time_change_', '');
        console.log(`⏰ Updating reminder time for user ${user.telegramId}: ${user.reminderTime} → ${newTime}`);
        await user.update({ reminderTime: newTime });
        await user.reload(); // Reload to get updated value
        
        const userTimezone = user.timezone || 'UTC';
        console.log(`✅ Reminder time updated: ${user.reminderTime} (${userTimezone})`);
        await this.bot.editMessageText(
          `✅ *Reminder time updated successfully!*\n\nNew time: ${newTime} (${userTimezone})\n\nI'll send your daily reminders at ${newTime} in your timezone.`,
          { 
            chat_id: chatId, 
            message_id: callbackQuery.message.message_id,
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '🧪 Test Reminder Now', callback_data: 'test_reminder' }],
                [{ text: '🔙 Back to Settings', callback_data: 'back_to_settings' }],
                [{ text: '🏠 Main Menu', callback_data: 'back_to_menu' }]
              ]
            }
          }
        );

      } else if (data.startsWith('timezone_')) {
        const newTimezone = data.replace('timezone_', '');
        console.log(`🌍 Updating timezone for user ${user.telegramId}: ${user.timezone} → ${newTimezone}`);
        await user.update({ timezone: newTimezone });
        await user.reload(); // Reload to get updated value
        
        console.log(`✅ Timezone updated: ${user.timezone}, reminder time: ${user.reminderTime}`);
        await this.bot.editMessageText(
          `✅ *Timezone updated successfully!*\n\nNew timezone: ${newTimezone}\n\nYour reminders will now be sent at ${user.reminderTime} ${newTimezone} time.`,
          { 
            chat_id: chatId, 
            message_id: callbackQuery.message.message_id,
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '🧪 Test Reminder Now', callback_data: 'test_reminder' }],
                [{ text: '🔙 Back to Settings', callback_data: 'back_to_settings' }],
                [{ text: '🏠 Main Menu', callback_data: 'back_to_menu' }]
              ]
            }
          }
        );

      } else if (data === 'time_custom') {
        await this.bot.editMessageText(
          `✏️ *Enter Custom Time*\n\nPlease send me your preferred reminder time in HH:MM format.\n\nExamples: 08:30, 14:15, 19:45\n\nI'll wait for your next message:`,
          { 
            chat_id: chatId, 
            message_id: callbackQuery.message.message_id,
            parse_mode: 'Markdown'
          }
        );
        
        // Set user state for custom time input
        this.userSessions.set(user.telegramId, { waitingFor: 'customTime', messageId: callbackQuery.message.message_id });

      } else if (data === 'back_to_settings') {
        // Reload user data before showing settings
        await user.reload();
        // Create a proper message object for settings with the correct from field
        const msgForSettings = {
          chat: callbackQuery.message.chat,
          from: callbackQuery.from,
          message_id: callbackQuery.message.message_id
        };
        await this.handleSettings(msgForSettings);
      } else if (data === 'test_reminder') {
        await this.handleTestReminder(callbackQuery.message);
      }

    } catch (error) {
      console.error('Error handling settings change:', error);
      await this.bot.editMessageText(
        'Sorry, something went wrong while updating your settings. Please try again.',
        { chat_id: chatId, message_id: callbackQuery.message.message_id }
      );
    }
  }

  // Helper method to chunk array into groups
  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  async handleHelp(msg) {
    const chatId = msg.chat.id;
    
    const helpMessage = `🤖 *MindfulU Bot Help*

*Available Commands:*
• /start - Start or restart the bot
• /progress - View your meditation progress
• /settings - Change your preferences
• /test - Test your daily reminder now
• /help - Show this help message

*How it works:*
1️⃣ I'll send you daily meditation reminders at your preferred time
2️⃣ Each day includes a personalized motivation message
3️⃣ I'll suggest meditation videos based on your preferred duration
4️⃣ After each session, I'll ask for quick feedback
5️⃣ Track your progress and build a consistent habit!

*Behavior Change Techniques:*
I use evidence-based techniques to help you build lasting habits:
• Goal setting and progress tracking
• Social accountability and support
• Environmental cues and reminders
• Self-monitoring and reflection

Need help? Just send me a message! 😊`;

    await this.bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
  }

  async handleTestReminder(msg) {
    const chatId = msg.chat.id;
    const telegramId = msg.from.id;

    try {
      const user = await User.findOne({ where: { telegramId } });
      if (!user) {
        await this.bot.sendMessage(chatId, '❌ Please start the bot first with /start');
        return;
      }

      if (!user.isOnboardingComplete) {
        await this.bot.sendMessage(chatId, '❌ Please complete your onboarding first with /start');
        return;
      }

      await this.bot.sendMessage(chatId, '🧪 Testing your daily reminder...');
      
      // Send test reminder
      await this.sendDailyReminder(user);
      
      await this.bot.sendMessage(chatId, `✅ Test reminder sent! 
      
📋 Your settings:
• Reminder time: ${user.reminderTime}
• Duration: ${user.preferredDuration}
• Timezone: ${user.timezone || 'UTC'}

If you didn't receive the reminder above, please check your settings with /settings`);

    } catch (error) {
      console.error('Error handling test reminder:', error);
      await this.bot.sendMessage(chatId, '❌ Sorry, something went wrong with the test reminder.');
    }
  }

  // Method to send daily reminders (called by reminder service)
  async sendDailyReminder(user) {
    try {
      // Generate dynamic motivational message for reminder and store it
      const dynamicMessage = await messageGenerationService.generateMotivationalMessage(user, user.currentDay);
      
      // Store the reminder message so startMeditationSession can use the same one
      this.userMessages = this.userMessages || new Map();
      this.userMessages.set(user.telegramId, dynamicMessage);
      
      // Get today's static video - handle duration mapping (same as showMainMenu)
      let userDuration = user.preferredDuration;
      
      // Clean up duration string if it has 'change_' prefix
      if (userDuration && userDuration.startsWith('change_')) {
        userDuration = userDuration.replace('change_', '');
      }
      
      // Fallback to '10 min' if duration not found
      if (!meditationVideos[userDuration]) {
        console.warn(`Duration "${userDuration}" not found in static videos, using fallback`);
        userDuration = '10 min';
      }
      
      const todaysVideo = meditationVideos[userDuration][user.currentDay % meditationVideos[userDuration].length];

      const reminderMessage = `🔔 *Daily Meditation Reminder*

Good ${this.getTimeOfDayGreeting()}! Time for your daily meditation. 🧘‍♀️

🎯 *Today's Motivation (Day ${user.currentDay}):*
_${dynamicMessage}_

📺 *Today's ${user.preferredDuration} meditation:*
*${todaysVideo.title}*

Ready to start?`;

      const keyboard = {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🎬 Start Meditation', callback_data: 'start_meditation' }],
            [{ text: '⏰ Remind me in 1 hour', callback_data: 'snooze_1h' }]
          ]
        }
      };

      await this.bot.sendMessage(user.telegramId, reminderMessage, {
        parse_mode: 'Markdown',
        ...keyboard
      });
    } catch (error) {
      console.error(`Error sending reminder to user ${user.telegramId}:`, error);
    }
  }

  getTimeOfDayGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  }
}

module.exports = new TelegramHandler();