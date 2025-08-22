const { MeditationVideo, VideoRating, User } = require('../models');
const { Op } = require('sequelize');

class VideoRecommendationService {
  constructor() {
    // Curated Headspace videos by duration for immediate use
    this.curatedVideos = {
      '5 min': [
        {
          youtubeId: 'ZToicYcHIOU',
          title: 'Headspace | Mini Meditation | Let Go of Stress',
          url: 'https://youtube.com/watch?v=ZToicYcHIOU',
          channelName: 'Headspace',
          duration: '5 min',
          durationSeconds: 300,
          description: 'A quick 5-minute guided meditation to help you let go of stress and find calm.',
          meditationType: 'stress',
          difficulty: 'beginner',
          tags: ['stress', 'guided', 'calm'],
          viewCount: 2500000,
          likeCount: 45000
        },
        {
          youtubeId: 'inpok4MKVLM',
          title: 'Headspace | Meditation | Breathing Space',
          url: 'https://youtube.com/watch?v=inpok4MKVLM',
          channelName: 'Headspace',
          duration: '5 min',
          durationSeconds: 318,
          description: 'Create breathing space with this short mindfulness meditation.',
          meditationType: 'breathing',
          difficulty: 'beginner',
          tags: ['breathing', 'mindfulness', 'space'],
          viewCount: 1800000,
          likeCount: 32000
        },
        {
          youtubeId: 'hDvdqsKlOuU',
          title: 'Headspace | Sleep by Headspace | Meditation',
          url: 'https://youtube.com/watch?v=hDvdqsKlOuU',
          channelName: 'Headspace',
          duration: '5 min',
          durationSeconds: 285,
          description: 'Wind down with this gentle sleep meditation from Headspace.',
          meditationType: 'sleep',
          difficulty: 'beginner',
          tags: ['sleep', 'gentle', 'wind down'],
          viewCount: 3200000,
          likeCount: 58000
        }
      ],
      '10 min': [
        {
          youtubeId: '6p_yaNFSYao',
          title: 'Headspace | Meditation | Basics',
          url: 'https://youtube.com/watch?v=6p_yaNFSYao',
          channelName: 'Headspace',
          duration: '10 min',
          durationSeconds: 480,
          description: 'Learn the basics of meditation with Andy from Headspace.',
          meditationType: 'mindfulness',
          difficulty: 'beginner',
          tags: ['basics', 'andy', 'fundamentals'],
          viewCount: 15000000,
          likeCount: 285000
        },
        {
          youtubeId: 'ZToicYcHIOU',
          title: 'Headspace | Focus Meditation',
          url: 'https://youtube.com/watch?v=ZToicYcHIOU',
          channelName: 'Headspace',
          duration: '10 min',
          durationSeconds: 600,
          description: 'Improve your focus and concentration with this guided meditation.',
          meditationType: 'focus',
          difficulty: 'beginner',
          tags: ['focus', 'concentration', 'productivity'],
          viewCount: 8500000,
          likeCount: 142000
        },
        {
          youtubeId: 'sv2cxyKCWLU',
          title: 'Headspace | Meditation for Anxiety',
          url: 'https://youtube.com/watch?v=sv2cxyKCWLU',
          channelName: 'Headspace',
          duration: '10 min',
          durationSeconds: 540,
          description: 'Find calm and reduce anxiety with this soothing meditation.',
          meditationType: 'anxiety',
          difficulty: 'beginner',
          tags: ['anxiety', 'calm', 'soothing'],
          viewCount: 12000000,
          likeCount: 198000
        }
      ],
      '15 min': [
        {
          youtubeId: 'z6X5oEIg6Ak',
          title: 'Headspace | Body Scan Meditation',
          url: 'https://youtube.com/watch?v=z6X5oEIg6Ak',
          channelName: 'Headspace',
          duration: '15 min',
          durationSeconds: 900,
          description: 'Relax your body and mind with this guided body scan meditation.',
          meditationType: 'body scan',
          difficulty: 'intermediate',
          tags: ['body scan', 'relaxation', 'tension release'],
          viewCount: 6800000,
          likeCount: 95000
        },
        {
          youtubeId: 'jPpUNAFHgxM',
          title: 'Headspace | Mindful Walking',
          url: 'https://youtube.com/watch?v=jPpUNAFHgxM',
          channelName: 'Headspace',
          duration: '15 min',
          durationSeconds: 840,
          description: 'Practice mindfulness while walking with this guided meditation.',
          meditationType: 'mindfulness',
          difficulty: 'intermediate',
          tags: ['walking', 'movement', 'outdoor'],
          viewCount: 4200000,
          likeCount: 76000
        }
      ],
      '20 min': [
        {
          youtubeId: 'ssss7V1_eyA',
          title: 'Headspace | Deep Sleep Meditation',
          url: 'https://youtube.com/watch?v=ssss7V1_eyA',
          channelName: 'Headspace',
          duration: '20 min',
          durationSeconds: 1200,
          description: 'Drift into deep, peaceful sleep with this longer meditation.',
          meditationType: 'sleep',
          difficulty: 'intermediate',
          tags: ['deep sleep', 'peaceful', 'long form'],
          viewCount: 9800000,
          likeCount: 156000
        }
      ],
      '30 min': [
        {
          youtubeId: 'U9YKY7fdwyg',
          title: 'Headspace | Extended Mindfulness Session',
          url: 'https://youtube.com/watch?v=U9YKY7fdwyg',
          channelName: 'Headspace',
          duration: '30 min',
          durationSeconds: 1800,
          description: 'An extended mindfulness meditation for deeper practice.',
          meditationType: 'mindfulness',
          difficulty: 'advanced',
          tags: ['extended', 'deep practice', 'advanced'],
          viewCount: 3500000,
          likeCount: 58000
        }
      ]
    };
  }

  async initializeCuratedVideos() {
    console.log('🎬 Initializing curated video database...');
    
    let savedCount = 0;
    
    for (const [duration, videos] of Object.entries(this.curatedVideos)) {
      for (const videoData of videos) {
        try {
          const [video, created] = await MeditationVideo.findOrCreate({
            where: { youtubeId: videoData.youtubeId },
            defaults: {
              ...videoData,
              isActive: true,
              isAvailable: true,
              lastChecked: new Date(),
              averageRating: null,
              totalRatings: 0,
              ratingSum: 0,
              timesRecommended: 0,
              timesCompleted: 0
            }
          });

          if (created) {
            savedCount++;
            console.log(`💾 Added curated video: ${videoData.title}`);
          }
        } catch (error) {
          console.error(`Error adding curated video ${videoData.title}:`, error.message);
        }
      }
    }

    console.log(`✅ Curated video initialization complete: ${savedCount} videos added`);
    return savedCount;
  }

  async recommendVideo(user, excludeVideoIds = []) {
    // Map user's preferred duration to our video categories
    let duration = user.preferredDuration;
    
    // Handle different duration formats
    if (duration === '5-10 min') {
      duration = '10 min'; // Default to 10 min for 5-10 min preference
    } else if (duration === '10-15 min') {
      duration = '15 min';
    } else if (duration === '15-20 min') {
      duration = '20 min';
    }
    
    console.log(`🎯 Looking for video with duration: ${duration} (user prefers: ${user.preferredDuration})`);
    
    try {
      // Try to get video from database first
      let video = await this.getRecommendedFromDatabase(duration, user.id, excludeVideoIds);
      
      // If no database video found, fall back to curated videos
      if (!video) {
        video = await this.getRecommendedFromCurated(duration, excludeVideoIds);
      }
      
      // If we found a video, increment recommendation counter
      if (video && video.incrementRecommended) {
        await video.incrementRecommended();
      }

      return video;
    } catch (error) {
      console.error('Error recommending video:', error);
      // Ultimate fallback to first curated video
      return this.getFallbackVideo(duration);
    }
  }

  async getRecommendedFromDatabase(duration, userId, excludeVideoIds = []) {
    const whereClause = {
      duration,
      isActive: true,
      isAvailable: true
    };

    if (excludeVideoIds.length > 0) {
      whereClause.id = { [Op.notIn]: excludeVideoIds };
    }

    // Get user's previous ratings to personalize recommendations
    const userRatings = await VideoRating.findAll({
      where: { userId },
      include: [{
        model: MeditationVideo,
        as: 'video',
        attributes: ['channelName', 'meditationType', 'tags']
      }]
    });

    // Analyze user preferences
    const preferences = this.analyzeUserPreferences(userRatings);

    // Find videos matching preferences or highly rated ones
    const videos = await MeditationVideo.findAll({
      where: whereClause,
      order: [
        // Prioritize by view count first (most popular)
        ['viewCount', 'DESC'],
        // Then by average rating (but only if enough ratings)  
        ['averageRating', 'DESC'],
        // Then by total ratings (social proof)
        ['totalRatings', 'DESC']
      ],
      limit: 1
    });

    return videos.length > 0 ? videos[0] : null;
  }

  async getRecommendedFromCurated(duration, excludeVideoIds = []) {
    const curatedForDuration = this.curatedVideos[duration] || [];
    
    if (curatedForDuration.length === 0) {
      return null;
    }

    // Filter out excluded videos
    const availableVideos = curatedForDuration.filter(video => 
      !excludeVideoIds.includes(video.youtubeId)
    );

    if (availableVideos.length === 0) {
      return curatedForDuration[0]; // Return first if all are excluded
    }

    // Return highest rated or most popular
    return availableVideos.sort((a, b) => b.likeCount - a.likeCount)[0];
  }

  getFallbackVideo(duration) {
    const curatedForDuration = this.curatedVideos[duration];
    return curatedForDuration && curatedForDuration.length > 0 ? curatedForDuration[0] : {
      youtubeId: '6p_yaNFSYao',
      title: 'Headspace | Meditation | Basics',
      url: 'https://youtube.com/watch?v=6p_yaNFSYao',
      channelName: 'Headspace',
      duration: duration,
      durationSeconds: 480,
      description: 'A basic meditation to get you started.',
      meditationType: 'mindfulness',
      difficulty: 'beginner'
    };
  }

  analyzeUserPreferences(userRatings) {
    const preferences = {
      preferredChannels: {},
      preferredTypes: {},
      preferredDifficulties: {},
      averageRating: 0
    };

    if (userRatings.length === 0) {
      return preferences;
    }

    // Analyze highly rated content (4+ stars)
    const highRatedRatings = userRatings.filter(r => r.videoRating >= 4);

    highRatedRatings.forEach(rating => {
      const video = rating.video;
      if (!video) return;

      // Count preferred channels
      if (video.channelName) {
        preferences.preferredChannels[video.channelName] = 
          (preferences.preferredChannels[video.channelName] || 0) + 1;
      }

      // Count preferred meditation types
      if (video.meditationType) {
        preferences.preferredTypes[video.meditationType] = 
          (preferences.preferredTypes[video.meditationType] || 0) + 1;
      }
    });

    // Calculate average rating
    const totalRating = userRatings.reduce((sum, r) => sum + r.videoRating, 0);
    preferences.averageRating = totalRating / userRatings.length;

    return preferences;
  }

  buildPreferenceQuery(preferences) {
    // This is a simplified preference scoring for SQLite
    // In a more advanced setup, you'd use a proper recommendation algorithm
    return `
      CASE 
        WHEN channelName = '${Object.keys(preferences.preferredChannels)[0] || 'Headspace'}' THEN 3
        WHEN meditationType = '${Object.keys(preferences.preferredTypes)[0] || 'mindfulness'}' THEN 2
        ELSE 0
      END
    `;
  }

  async recordVideoRating(userId, videoId, sessionId, videoRating, messageRating, completed, userDay, duration) {
    try {
      // Create or update the rating
      const [rating, created] = await VideoRating.upsert({
        userId,
        videoId,
        sessionId,
        videoRating,
        messageRating,
        completed,
        userDay,
        duration,
        feedback: null // Can be added later if needed
      }, {
        returning: true
      });

      // Update video statistics
      const video = await MeditationVideo.findByPk(videoId);
      if (video) {
        // Recalculate average rating
        const allRatings = await VideoRating.findAll({
          where: { videoId },
          attributes: ['videoRating']
        });

        const ratingSum = allRatings.reduce((sum, r) => sum + r.videoRating, 0);
        const totalRatings = allRatings.length;
        const averageRating = ratingSum / totalRatings;

        await video.update({
          averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
          totalRatings,
          ratingSum
        });

        // Update completion stats
        if (completed) {
          await video.incrementCompleted();
        }

        console.log(`📊 Updated ratings for video: ${video.title} (avg: ${averageRating.toFixed(1)}, total: ${totalRatings})`);
      }

      return rating;
    } catch (error) {
      console.error('Error recording video rating:', error);
      throw error;
    }
  }

  async getVideoStats(videoId) {
    const video = await MeditationVideo.findByPk(videoId, {
      include: [{
        model: VideoRating,
        as: 'ratings'
      }]
    });

    if (!video) return null;

    const ratings = video.ratings || [];
    const completedCount = ratings.filter(r => r.completed).length;

    return {
      video: video,
      stats: {
        totalRatings: video.totalRatings,
        averageVideoRating: video.averageRating,
        timesRecommended: video.timesRecommended,
        timesCompleted: video.timesCompleted,
        completionRate: video.completionRate,
        completedSessions: completedCount
      }
    };
  }

  async getUserVideoHistory(userId, limit = 20) {
    return await VideoRating.findAll({
      where: { userId },
      include: [{
        model: MeditationVideo,
        as: 'video',
        attributes: ['title', 'channelName', 'duration', 'meditationType']
      }],
      order: [['createdAt', 'DESC']],
      limit
    });
  }

  // Analytics methods
  async getTopRatedVideos(duration = null, limit = 10) {
    const whereClause = { isActive: true, isAvailable: true };
    if (duration) whereClause.duration = duration;

    return await MeditationVideo.findAll({
      where: whereClause,
      order: [
        ['averageRating', 'DESC NULLS LAST'],
        ['totalRatings', 'DESC']
      ],
      limit
    });
  }

  async getMostPopularVideos(duration = null, limit = 10) {
    const whereClause = { isActive: true, isAvailable: true };
    if (duration) whereClause.duration = duration;

    return await MeditationVideo.findAll({
      where: whereClause,
      order: [
        ['timesRecommended', 'DESC'],
        ['viewCount', 'DESC']
      ],
      limit
    });
  }
}

module.exports = new VideoRecommendationService();