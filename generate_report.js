const { User, MeditationSession, VideoRating } = require('./models');

async function generateReport() {
  try {
    const user = await User.findOne({ where: { telegramId: 6679863450 } });
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log('📊 MEDITATION DATA REPORT FOR USER: ' + user.name);
    console.log('================================================');
    console.log('User ID:', user.id);
    console.log('Telegram ID:', user.telegramId);
    console.log('Current Day:', user.currentDay);
    console.log('Preferred Duration:', user.preferredDuration);
    console.log('');
    
    const sessions = await MeditationSession.findAll({ 
      where: { userId: user.id }, 
      order: [['day', 'ASC']] 
    });
    
    console.log('📈 MEDITATION SESSIONS (' + sessions.length + ' total):');
    console.log('Day | Date       | Duration | Completed | Video Rating | Message Rating | Video Title');
    console.log('----+------------+----------+-----------+--------------+----------------+--------------------------------');
    
    sessions.forEach(session => {
      const day = String(session.day).padStart(3);
      const date = session.date || 'N/A';
      const duration = (session.duration || '').padEnd(8);
      const completed = session.completed === true ? '✅ Yes' : session.completed === false ? '❌ No' : '⏳ Pending';
      const videoRating = session.videoHelpful ? session.videoHelpful + '/5' : 'N/A';
      const messageRating = session.messageHelpful ? session.messageHelpful + '/5' : 'N/A';
      const title = (session.videoTitle || 'N/A').substring(0, 25);
      
      console.log(`${day} | ${date} | ${duration} | ${completed.padEnd(9)} | ${videoRating.padEnd(12)} | ${messageRating.padEnd(14)} | ${title}`);
    });
    
    // Calculate statistics
    const completedDays = new Set();
    const daysWithRatings = new Set();
    let totalVideoRating = 0, totalMessageRating = 0, ratingCount = 0;
    
    sessions.forEach(session => {
      if (session.completed === true) {
        completedDays.add(session.day);
      }
      if (session.videoHelpful && session.messageHelpful) {
        daysWithRatings.add(session.day);
        totalVideoRating += session.videoHelpful;
        totalMessageRating += session.messageHelpful;
        ratingCount++;
      }
    });
    
    const uniqueDays = new Set(sessions.map(s => s.day)).size;
    const avgVideoRating = ratingCount > 0 ? (totalVideoRating / ratingCount).toFixed(1) : 'N/A';
    const avgMessageRating = ratingCount > 0 ? (totalMessageRating / ratingCount).toFixed(1) : 'N/A';
    
    console.log('');
    console.log('📈 SUMMARY STATISTICS:');
    console.log('=======================');
    console.log('Days with meditation provided:', uniqueDays);
    console.log('Days completed:', completedDays.size + ' out of ' + uniqueDays);
    console.log('Days with ratings:', daysWithRatings.size);
    console.log('Completion rate:', Math.round((completedDays.size / uniqueDays) * 100) + '%');
    console.log('Average video rating:', avgVideoRating + '/5');
    console.log('Average message rating:', avgMessageRating + '/5');
    console.log('Total sessions recorded:', sessions.length);
    
    // Show VideoRatings table
    console.log('');
    console.log('🎯 VIDEO RATINGS TABLE:');
    console.log('========================');
    const ratings = await VideoRating.findAll({ where: { userId: user.id } });
    if (ratings.length > 0) {
      ratings.forEach(rating => {
        console.log(`Rating ID: ${rating.id}, Session: ${rating.sessionId}, Video: ${rating.videoRating}/5, Message: ${rating.messageRating}/5, Completed: ${rating.completed}`);
      });
    } else {
      console.log('No ratings in VideoRating table yet (this is where comprehensive ratings will be stored)');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

generateReport();