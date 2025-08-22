require('dotenv').config();
const youtubeService = require('./services/youtubeService');
const { sequelize } = require('./models');

async function setupYouTube() {
  console.log('🎬 YouTube Meditation Video Setup\n');

  // Check if YouTube API key is configured
  if (!process.env.YOUTUBE_API_KEY) {
    console.log('❌ YouTube API key not found!');
    console.log('\n📋 To get a YouTube API key:');
    console.log('1. Go to https://console.cloud.google.com/');
    console.log('2. Create a new project or select existing one');
    console.log('3. Enable the YouTube Data API v3');
    console.log('4. Create credentials (API Key)');
    console.log('5. Add your API key to .env file as YOUTUBE_API_KEY=your_key_here');
    console.log('\n🔄 After adding the key, run this script again.\n');
    return;
  }

  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Sync new models
    console.log('🔄 Syncing database models...');
    await sequelize.sync();
    console.log('✅ Database models synced\n');

    // Test YouTube API connection
    console.log('🧪 Testing YouTube API connection...');
    const testVideos = await youtubeService.searchMeditationVideos('10 min', 5);
    
    if (testVideos.length === 0) {
      console.log('❌ No videos found. Check your API key and quota.');
      return;
    }

    console.log(`✅ YouTube API working! Found ${testVideos.length} test videos\n`);

    // Show sample of found videos
    console.log('📋 Sample videos found:');
    testVideos.slice(0, 3).forEach((video, i) => {
      console.log(`${i + 1}. ${video.title}`);
      console.log(`   Channel: ${video.channelName}`);
      console.log(`   Duration: ${Math.floor(video.durationSeconds / 60)}:${(video.durationSeconds % 60).toString().padStart(2, '0')}`);
      console.log('');
    });

    // Ask user if they want to populate the full database
    console.log('🚀 Ready to populate your meditation video database!');
    console.log('This will search for videos in all duration categories (5, 10, 15, 20, 30 min)');
    console.log('and prioritize content from Headspace and other quality meditation channels.\n');

    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('Do you want to populate the database now? (y/n): ', async (answer) => {
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        console.log('\n🎯 Starting full database population...\n');
        
        const results = await youtubeService.populateVideoDatabase();
        
        console.log('\n🎉 Setup complete!');
        console.log(`📊 Total videos: ${results.total.saved + results.total.updated}`);
        console.log(`   • New videos: ${results.total.saved}`);
        console.log(`   • Updated videos: ${results.total.updated}\n`);
        
        // Show breakdown by duration
        console.log('📈 Breakdown by duration:');
        Object.entries(results.byDuration).forEach(([duration, stats]) => {
          console.log(`   ${duration}: ${stats.saved + stats.updated} videos`);
        });

        console.log('\n✅ Your meditation bot now has a curated database of YouTube videos!');
        console.log('🤖 Users will now receive personalized video recommendations based on:');
        console.log('   • Their preferred duration');
        console.log('   • Video ratings from other users');
        console.log('   • Channel quality (Headspace prioritized)');
        console.log('   • View count and engagement\n');
      } else {
        console.log('\n⏸️ Database population skipped.');
        console.log('You can run this script again later to populate videos.\n');
      }
      
      rl.close();
      await sequelize.close();
    });

  } catch (error) {
    console.error('❌ Setup failed:', error);
    await sequelize.close();
  }
}

// Handle command line arguments
const command = process.argv[2];

if (command === 'update-availability') {
  // Update video availability
  (async () => {
    try {
      await sequelize.authenticate();
      const result = await youtubeService.updateVideoAvailability();
      console.log(`✅ Checked ${result.total} videos, ${result.unavailable} marked unavailable`);
      await sequelize.close();
    } catch (error) {
      console.error('Error updating availability:', error);
      await sequelize.close();
    }
  })();
} else if (command === 'populate-only') {
  // Just populate without interactive setup
  (async () => {
    try {
      await sequelize.authenticate();
      await sequelize.sync();
      const results = await youtubeService.populateVideoDatabase();
      console.log('Population complete:', results);
      await sequelize.close();
    } catch (error) {
      console.error('Population failed:', error);
      await sequelize.close();
    }
  })();
} else {
  // Run interactive setup
  setupYouTube();
}

module.exports = { setupYouTube };