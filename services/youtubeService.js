const { google } = require('googleapis');
const { MeditationVideo, VideoRating } = require('../models');

class YouTubeService {
  constructor() {
    this.youtube = google.youtube({
      version: 'v3',
      auth: process.env.YOUTUBE_API_KEY
    });
    
    // Duration mapping for search
    this.durationRanges = {
      '5 min': { min: 240, max: 360 }, // 4-6 minutes
      '10 min': { min: 540, max: 720 }, // 9-12 minutes  
      '15 min': { min: 840, max: 1080 }, // 14-18 minutes
      '20 min': { min: 1140, max: 1440 }, // 19-24 minutes
      '30 min': { min: 1740, max: 2100 }  // 29-35 minutes
    };

    // Priority channels for meditation content
    this.priorityChannels = [
      'Headspace',
      'The Honest Guys - Meditations - Relaxation',
      'Great Meditation',
      'Calm',
      'Ten Percent Happier',
      'Mindfulness-Based Happiness',
      'The Mindful Movement'
    ];
  }

  async searchMeditationVideos(duration = '10 min', maxResults = 50) {
    try {
      console.log(`🔍 Searching for ${duration} meditation videos on YouTube...`);
      
      const searchQueries = [
        `guided meditation ${duration.replace(' min', ' minutes')}`,
        `${duration} mindfulness meditation`,
        `meditation for beginners ${duration}`,
        `sleep meditation ${duration}`,
        `anxiety meditation ${duration}`,
        `focus meditation ${duration}`
      ];

      let allVideos = [];

      // Search with different queries to get variety
      for (const query of searchQueries) {
        try {
          const searchResponse = await this.youtube.search.list({
            part: 'snippet',
            q: query,
            type: 'video',
            maxResults: Math.ceil(maxResults / searchQueries.length),
            order: 'relevance',
            videoDuration: this.getYouTubeDurationFilter(duration),
            videoEmbeddable: 'true',
            videoSyndicated: 'true',
            safeSearch: 'strict'
          });

          if (searchResponse.data.items) {
            allVideos.push(...searchResponse.data.items);
          }
        } catch (queryError) {
          console.warn(`Search failed for query "${query}":`, queryError.message);
        }
      }

      // Remove duplicates by video ID
      const uniqueVideos = allVideos.filter((video, index, self) => 
        index === self.findIndex(v => v.id.videoId === video.id.videoId)
      );

      console.log(`📊 Found ${uniqueVideos.length} unique videos for ${duration}`);

      // Get detailed information including duration
      if (uniqueVideos.length > 0) {
        const videoIds = uniqueVideos.map(v => v.id.videoId).join(',');
        const detailsResponse = await this.youtube.videos.list({
          part: 'snippet,contentDetails,statistics',
          id: videoIds
        });

        return this.processVideoDetails(detailsResponse.data.items, duration);
      }

      return [];
    } catch (error) {
      console.error('Error searching YouTube videos:', error);
      return [];
    }
  }

  processVideoDetails(videos, targetDuration) {
    const processedVideos = [];
    const durationRange = this.durationRanges[targetDuration];

    for (const video of videos) {
      try {
        const durationSeconds = this.parseYouTubeDuration(video.contentDetails.duration);
        
        // Filter by duration range
        if (durationRange && (durationSeconds < durationRange.min || durationSeconds > durationRange.max)) {
          continue;
        }

        // Extract meditation type from title and description
        const meditationType = this.extractMeditationType(video.snippet.title, video.snippet.description);
        
        // Determine difficulty level
        const difficulty = this.determineDifficulty(video.snippet.title, video.snippet.description);

        // Extract tags
        const tags = this.extractTags(video.snippet.title, video.snippet.description);

        const processedVideo = {
          youtubeId: video.id,
          title: video.snippet.title,
          url: `https://youtube.com/watch?v=${video.id}`,
          channelName: video.snippet.channelTitle,
          channelId: video.snippet.channelId,
          duration: targetDuration,
          durationSeconds: durationSeconds,
          description: video.snippet.description,
          thumbnailUrl: video.snippet.thumbnails.medium?.url || video.snippet.thumbnails.default?.url,
          publishedAt: new Date(video.snippet.publishedAt),
          viewCount: parseInt(video.statistics.viewCount) || 0,
          likeCount: parseInt(video.statistics.likeCount) || 0,
          meditationType: meditationType,
          difficulty: difficulty,
          tags: tags,
          isActive: true,
          isAvailable: true,
          lastChecked: new Date()
        };

        processedVideos.push(processedVideo);
      } catch (error) {
        console.warn(`Error processing video ${video.id}:`, error.message);
      }
    }

    // Sort by priority: Headspace first, then by view count
    processedVideos.sort((a, b) => {
      const aIsHeadspace = a.channelName.toLowerCase().includes('headspace');
      const bIsHeadspace = b.channelName.toLowerCase().includes('headspace');
      
      if (aIsHeadspace && !bIsHeadspace) return -1;
      if (!aIsHeadspace && bIsHeadspace) return 1;
      
      const aIsPriority = this.priorityChannels.some(channel => 
        a.channelName.toLowerCase().includes(channel.toLowerCase())
      );
      const bIsPriority = this.priorityChannels.some(channel => 
        b.channelName.toLowerCase().includes(channel.toLowerCase())
      );
      
      if (aIsPriority && !bIsPriority) return -1;
      if (!aIsPriority && bIsPriority) return 1;
      
      return b.viewCount - a.viewCount;
    });

    console.log(`✅ Processed ${processedVideos.length} videos for ${targetDuration}`);
    return processedVideos;
  }

  async saveVideosToDatabase(videos) {
    let savedCount = 0;
    let updatedCount = 0;

    for (const videoData of videos) {
      try {
        const [video, created] = await MeditationVideo.upsert(videoData, {
          returning: true
        });

        if (created) {
          savedCount++;
          console.log(`💾 Saved new video: ${videoData.title}`);
        } else {
          updatedCount++;
          console.log(`🔄 Updated video: ${videoData.title}`);
        }
      } catch (error) {
        console.error(`Error saving video ${videoData.title}:`, error.message);
      }
    }

    console.log(`📊 Database update complete: ${savedCount} new, ${updatedCount} updated`);
    return { saved: savedCount, updated: updatedCount };
  }

  async populateVideoDatabase(durations = ['5 min', '10 min', '15 min', '20 min', '30 min']) {
    console.log('🚀 Starting YouTube video population...');
    
    const results = {
      total: { saved: 0, updated: 0 },
      byDuration: {}
    };

    for (const duration of durations) {
      console.log(`\n📝 Processing ${duration} videos...`);
      
      const videos = await this.searchMeditationVideos(duration, 30);
      if (videos.length > 0) {
        const dbResult = await this.saveVideosToDatabase(videos);
        results.byDuration[duration] = dbResult;
        results.total.saved += dbResult.saved;
        results.total.updated += dbResult.updated;
      }
      
      // Rate limiting: wait between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n🎉 Video population complete!');
    console.log('📊 Total results:', results);
    return results;
  }

  // Helper methods
  parseYouTubeDuration(duration) {
    // Parse ISO 8601 duration (PT4M13S = 4 minutes 13 seconds)
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    
    const hours = parseInt(match[1]) || 0;
    const minutes = parseInt(match[2]) || 0;
    const seconds = parseInt(match[3]) || 0;
    
    return hours * 3600 + minutes * 60 + seconds;
  }

  getYouTubeDurationFilter(targetDuration) {
    // YouTube API duration filters
    switch (targetDuration) {
      case '5 min':
        return 'short'; // < 4 minutes (we'll filter more precisely)
      case '10 min':
      case '15 min':
      case '20 min':
        return 'medium'; // 4-20 minutes
      case '30 min':
        return 'long'; // > 20 minutes
      default:
        return 'any';
    }
  }

  extractMeditationType(title, description) {
    const text = (title + ' ' + description).toLowerCase();
    
    const types = {
      'sleep': ['sleep', 'bedtime', 'insomnia', 'night'],
      'anxiety': ['anxiety', 'stress', 'worry', 'calm'],
      'focus': ['focus', 'concentration', 'attention', 'productivity'],
      'mindfulness': ['mindfulness', 'awareness', 'present'],
      'breathing': ['breathing', 'breath', 'pranayama'],
      'body scan': ['body scan', 'progressive relaxation'],
      'loving kindness': ['loving kindness', 'metta', 'compassion']
    };

    for (const [type, keywords] of Object.entries(types)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return type;
      }
    }

    return 'general';
  }

  determineDifficulty(title, description) {
    const text = (title + ' ' + description).toLowerCase();
    
    if (text.includes('beginner') || text.includes('first time') || text.includes('introduction')) {
      return 'beginner';
    }
    if (text.includes('advanced') || text.includes('experienced') || text.includes('deep')) {
      return 'advanced';
    }
    return 'beginner'; // Default to beginner for meditation
  }

  extractTags(title, description) {
    const text = (title + ' ' + description).toLowerCase();
    const possibleTags = [
      'guided', 'music', 'nature sounds', 'rain', 'ocean', 'forest',
      'chakra', 'visualization', 'mantra', 'silent', 'binaural',
      'healing', 'relaxation', 'wellness', 'mindful', 'peace',
      'gratitude', 'self-love', 'confidence', 'motivation'
    ];

    return possibleTags.filter(tag => text.includes(tag));
  }

  async checkVideoAvailability(videoId) {
    try {
      const response = await this.youtube.videos.list({
        part: 'status',
        id: videoId
      });

      return response.data.items.length > 0 && 
             response.data.items[0].status.privacyStatus === 'public';
    } catch (error) {
      console.warn(`Could not check availability for video ${videoId}:`, error.message);
      return false;
    }
  }

  async updateVideoAvailability() {
    console.log('🔍 Checking video availability...');
    
    const videos = await MeditationVideo.findAll({
      where: { isActive: true },
      attributes: ['id', 'youtubeId', 'title']
    });

    let unavailableCount = 0;

    for (const video of videos) {
      const isAvailable = await this.checkVideoAvailability(video.youtubeId);
      
      if (!isAvailable) {
        await video.update({ isAvailable: false });
        console.log(`❌ Video unavailable: ${video.title}`);
        unavailableCount++;
      }
      
      await video.update({ lastChecked: new Date() });
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`✅ Availability check complete. ${unavailableCount} videos marked as unavailable.`);
    return { total: videos.length, unavailable: unavailableCount };
  }
}

module.exports = new YouTubeService();