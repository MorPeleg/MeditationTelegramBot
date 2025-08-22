const { sequelize, User, MeditationSession, VideoRating, MeditationVideo } = require('./models');

async function viewDatabase() {
  try {
    console.log('🗄️  COMPLETE SQLite DATABASE CONTENTS');
    console.log('=====================================');
    console.log('Database File: database.sqlite');
    console.log('');

    // Show all tables
    const [tables] = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table';");
    console.log('📋 DATABASE TABLES:');
    tables.forEach(table => console.log(`   • ${table.name}`));
    console.log('');

    // 1. USERS TABLE
    console.log('👥 USERS TABLE:');
    console.log('===============');
    const users = await User.findAll();
    console.log(`Total Users: ${users.length}`);
    users.forEach((user, index) => {
      console.log(`\n👤 USER ${index + 1}:`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Telegram ID: ${user.telegramId}`);
      console.log(`   Username: ${user.username || 'NULL'}`);
      console.log(`   First Name: ${user.firstName || 'NULL'}`);
      console.log(`   Last Name: ${user.lastName || 'NULL'}`);
      console.log(`   Name: ${user.name || 'NULL'}`);
      console.log(`   Age: ${user.age || 'NULL'}`);
      console.log(`   Gender: ${user.gender || 'NULL'}`);
      console.log(`   Motivation: ${user.motivation || 'NULL'}`);
      console.log(`   Preferred Duration: ${user.preferredDuration || 'NULL'}`);
      console.log(`   Reminder Time: ${user.reminderTime || 'NULL'}`);
      console.log(`   Timezone: ${user.timezone || 'NULL'}`);
      console.log(`   Current Day: ${user.currentDay || 'NULL'}`);
      console.log(`   Onboarding Complete: ${user.isOnboardingComplete}`);
      console.log(`   Is Active: ${user.isActive}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log(`   Updated: ${user.updatedAt}`);
    });

    // 2. MEDITATION SESSIONS TABLE
    console.log('\n\n🧘 MEDITATION SESSIONS TABLE:');
    console.log('=============================');
    const sessions = await MeditationSession.findAll({ 
      order: [['createdAt', 'DESC']],
      include: [{ 
        model: User, 
        as: 'user',
        attributes: ['name', 'telegramId']
      }]
    });
    console.log(`Total Sessions: ${sessions.length}`);
    
    sessions.forEach((session, index) => {
      console.log(`\n📝 SESSION ${index + 1}:`);
      console.log(`   ID: ${session.id}`);
      console.log(`   User: ${session.user?.name || 'Unknown'} (ID: ${session.userId})`);
      console.log(`   Day: ${session.day}`);
      console.log(`   Date: ${session.date}`);
      console.log(`   Duration: ${session.duration || 'NULL'}`);
      console.log(`   Video ID: ${session.videoId || 'NULL'}`);
      console.log(`   Video Title: ${session.videoTitle || 'NULL'}`);
      console.log(`   Video URL: ${session.videoUrl || 'NULL'}`);
      console.log(`   BCT Technique ID: ${session.bctTechniqueId || 'NULL'}`);
      console.log(`   BCT Message: ${session.bctMessage ? session.bctMessage.substring(0, 80) + '...' : 'NULL'}`);
      console.log(`   Completed: ${session.completed}`);
      console.log(`   Video Rating: ${session.videoHelpful || 'NULL'}/5`);
      console.log(`   Message Rating: ${session.messageHelpful || 'NULL'}/5`);
      console.log(`   Notes: ${session.notes || 'NULL'}`);
      console.log(`   Created: ${session.createdAt}`);
      console.log(`   Updated: ${session.updatedAt}`);
    });

    // 3. VIDEO RATINGS TABLE
    console.log('\n\n⭐ VIDEO RATINGS TABLE:');
    console.log('======================');
    const ratings = await VideoRating.findAll({ 
      order: [['createdAt', 'DESC']],
      include: [{ 
        model: User, 
        as: 'user',
        attributes: ['name', 'telegramId']
      }]
    });
    console.log(`Total Ratings: ${ratings.length}`);
    
    ratings.forEach((rating, index) => {
      console.log(`\n🌟 RATING ${index + 1}:`);
      console.log(`   ID: ${rating.id}`);
      console.log(`   User: ${rating.user?.name || 'Unknown'} (ID: ${rating.userId})`);
      console.log(`   Video ID: ${rating.videoId || 'NULL (static video)'}`);
      console.log(`   Session ID: ${rating.sessionId}`);
      console.log(`   Video Rating: ${rating.videoRating}/5`);
      console.log(`   Message Rating: ${rating.messageRating}/5`);
      console.log(`   Completed: ${rating.completed}`);
      console.log(`   User Day: ${rating.userDay}`);
      console.log(`   Duration: ${rating.duration}`);
      console.log(`   BCT Techniques: ${rating.bctTechniques ? JSON.stringify(rating.bctTechniques, null, 2) : 'NULL'}`);
      console.log(`   Feedback: ${rating.feedback || 'NULL'}`);
      console.log(`   Created: ${rating.createdAt}`);
      console.log(`   Updated: ${rating.updatedAt}`);
    });

    // 4. MEDITATION VIDEOS TABLE (if exists)
    console.log('\n\n🎬 MEDITATION VIDEOS TABLE:');
    console.log('===========================');
    try {
      const videos = await MeditationVideo.findAll();
      console.log(`Total Videos: ${videos.length}`);
      
      if (videos.length > 0) {
        videos.forEach((video, index) => {
          console.log(`\n📹 VIDEO ${index + 1}:`);
          console.log(`   ID: ${video.id}`);
          console.log(`   Title: ${video.title || 'NULL'}`);
          console.log(`   YouTube ID: ${video.youtubeId || 'NULL'}`);
          console.log(`   URL: ${video.url || 'NULL'}`);
          console.log(`   Duration: ${video.duration || 'NULL'}`);
          console.log(`   Channel: ${video.channelName || 'NULL'}`);
          console.log(`   Type: ${video.meditationType || 'NULL'}`);
          console.log(`   Difficulty: ${video.difficulty || 'NULL'}`);
          console.log(`   Rating: ${video.averageRating || 'NULL'}`);
          console.log(`   Active: ${video.isActive}`);
        });
      } else {
        console.log('   No videos in database (using static videos from meditationData.js)');
      }
    } catch (error) {
      console.log('   Table does not exist or is empty');
    }

    // 5. DATABASE STATISTICS
    console.log('\n\n📊 DATABASE STATISTICS:');
    console.log('=======================');
    console.log(`Total Users: ${users.length}`);
    console.log(`Total Sessions: ${sessions.length}`);
    console.log(`Total Ratings: ${ratings.length}`);
    console.log(`Sessions with Ratings: ${sessions.filter(s => s.videoHelpful && s.messageHelpful).length}`);
    console.log(`Active Users: ${users.filter(u => u.isActive).length}`);
    console.log(`Completed Onboarding: ${users.filter(u => u.isOnboardingComplete).length}`);
    
    // User-specific stats
    const morUser = users.find(u => u.name === 'Mor');
    if (morUser) {
      const morSessions = sessions.filter(s => s.userId === morUser.id);
      const morRatings = ratings.filter(r => r.userId === morUser.id);
      console.log(`\n👤 MOR'S SPECIFIC STATS:`);
      console.log(`   Total Sessions: ${morSessions.length}`);
      console.log(`   Sessions with Ratings: ${morSessions.filter(s => s.videoHelpful && s.messageHelpful).length}`);
      console.log(`   Comprehensive Ratings: ${morRatings.length}`);
      console.log(`   Current Day: ${morUser.currentDay}`);
      console.log(`   Unique Days: ${new Set(morSessions.map(s => s.day)).size}`);
      console.log(`   Date Range: ${morSessions.length > 0 ? morSessions[morSessions.length-1].date + ' to ' + morSessions[0].date : 'N/A'}`);
    }

    // 6. RAW TABLE STRUCTURE
    console.log('\n\n🏗️  TABLE STRUCTURES:');
    console.log('====================');
    
    const tableStructures = [
      'Users',
      'MeditationSessions', 
      'video_ratings',
      'meditation_videos'
    ];
    
    for (const tableName of tableStructures) {
      try {
        const [structure] = await sequelize.query(`PRAGMA table_info(${tableName});`);
        console.log(`\n📋 ${tableName} COLUMNS:`);
        structure.forEach(col => {
          console.log(`   • ${col.name}: ${col.type}${col.notnull ? ' NOT NULL' : ''}${col.pk ? ' PRIMARY KEY' : ''}${col.dflt_value ? ` DEFAULT ${col.dflt_value}` : ''}`);
        });
      } catch (error) {
        console.log(`\n📋 ${tableName}: Table does not exist`);
      }
    }

  } catch (error) {
    console.error('❌ Database viewing error:', error);
  }
  
  process.exit(0);
}

viewDatabase();