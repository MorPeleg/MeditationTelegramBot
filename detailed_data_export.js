const { User, MeditationSession, VideoRating } = require('./models');

async function exportDetailedData() {
  try {
    console.log('🗂️ COMPLETE MEDITATION DATA EXPORT FOR MOR');
    console.log('================================================================');
    
    const user = await User.findOne({ where: { telegramId: 6679863450 } });
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('👤 USER PROFILE:');
    console.log('Database User ID:', user.id);
    console.log('Telegram ID:', user.telegramId);  
    console.log('Name:', user.name);
    console.log('Age:', user.age);
    console.log('Gender:', user.gender);
    console.log('Motivation:', user.motivation);
    console.log('Preferred Duration:', user.preferredDuration);
    console.log('Reminder Time:', user.reminderTime);
    console.log('Timezone:', user.timezone);
    console.log('Current Day:', user.currentDay);
    console.log('Account Created:', user.createdAt);
    console.log('Last Updated:', user.updatedAt);
    console.log('');
    
    console.log('🎯 MEDITATION SESSIONS TABLE (MeditationSessions):');
    console.log('===================================================');
    const sessions = await MeditationSession.findAll({ 
      where: { userId: user.id }, 
      order: [['createdAt', 'DESC']] 
    });
    
    sessions.forEach((session, index) => {
      console.log(`📝 SESSION ${index + 1} [ID: ${session.id}]:`);
      console.log(`   Day: ${session.day}`);
      console.log(`   Date: ${session.date}`);
      console.log(`   Duration Category: ${session.duration}`);
      console.log(`   Video ID: ${session.videoId || 'NULL (static video)'}`);
      console.log(`   Video Title: ${session.videoTitle}`);
      console.log(`   Video URL: ${session.videoUrl}`);
      console.log(`   Completed: ${session.completed}`);
      console.log(`   Video Rating: ${session.videoHelpful || 'NULL'}/5`);
      console.log(`   Message Rating: ${session.messageHelpful || 'NULL'}/5`);
      console.log(`   BCT Technique ID: ${session.bctTechniqueId}`);
      console.log(`   BCT Message: ${session.bctMessage ? session.bctMessage.substring(0, 100) + '...' : 'NULL'}`);
      console.log(`   Session Created: ${session.createdAt}`);
      console.log(`   Session Updated: ${session.updatedAt}`);
      console.log(`   Notes: ${session.notes || 'NULL'}`);
      console.log('   ----------------------------------------');
    });
    
    console.log('');
    console.log('⭐ VIDEO RATINGS TABLE (video_ratings):');
    console.log('=======================================');
    const ratings = await VideoRating.findAll({ 
      where: { userId: user.id },
      order: [['createdAt', 'DESC']]
    });
    
    if (ratings.length === 0) {
      console.log('No entries in VideoRating table yet');
    } else {
      ratings.forEach((rating, index) => {
        console.log(`🌟 RATING ${index + 1} [ID: ${rating.id}]:`);
        console.log(`   User ID: ${rating.userId}`);
        console.log(`   Video ID: ${rating.videoId || 'NULL (static video)'}`);
        console.log(`   Session ID: ${rating.sessionId}`);
        console.log(`   Video Rating: ${rating.videoRating}/5`);
        console.log(`   Message Rating: ${rating.messageRating}/5`);
        console.log(`   Completed: ${rating.completed}`);
        console.log(`   User Day: ${rating.userDay}`);
        console.log(`   Duration: ${rating.duration}`);
        console.log(`   BCT Techniques: ${rating.bctTechniques ? JSON.stringify(rating.bctTechniques) : 'NULL'}`);
        console.log(`   Rating Created: ${rating.createdAt}`);
        console.log(`   Rating Updated: ${rating.updatedAt}`);
        console.log(`   Feedback: ${rating.feedback || 'NULL'}`);
        console.log('   ----------------------------------------');
      });
    }
    
    console.log('');
    console.log('📊 DATA SUMMARY:');
    console.log('================');
    console.log(`Total Sessions: ${sessions.length}`);
    console.log(`Total Ratings: ${ratings.length}`);
    console.log(`Sessions with Video Ratings: ${sessions.filter(s => s.videoHelpful).length}`);
    console.log(`Sessions with Message Ratings: ${sessions.filter(s => s.messageHelpful).length}`);
    console.log(`Unique Days: ${new Set(sessions.map(s => s.day)).size}`);
    console.log(`Date Range: ${sessions.length > 0 ? sessions[sessions.length-1].date + ' to ' + sessions[0].date : 'N/A'}`);
    
  } catch (error) {
    console.error('❌ Export error:', error);
  }
  process.exit(0);
}

exportDetailedData();