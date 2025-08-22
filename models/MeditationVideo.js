module.exports = (sequelize, DataTypes) => {
  const MeditationVideo = sequelize.define('MeditationVideo', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    youtubeId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'YouTube video ID (e.g., "dQw4w9WgXcQ")'
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Video title'
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Full YouTube URL'
    },
    channelName: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'YouTube channel name (e.g., "Headspace")'
    },
    channelId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'YouTube channel ID'
    },
    duration: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Duration category (e.g., "5 min", "10 min", "15 min")'
    },
    durationSeconds: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Duration in seconds for precise matching'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Video description'
    },
    thumbnailUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'YouTube thumbnail URL'
    },
    publishedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When the video was published on YouTube'
    },
    viewCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: 'YouTube view count'
    },
    likeCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: 'YouTube like count'
    },
    // User rating statistics
    averageRating: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: null,
      comment: 'Average user rating (1-5 scale)'
    },
    totalRatings: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Total number of user ratings'
    },
    ratingSum: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Sum of all ratings for average calculation'
    },
    // Activity tracking
    timesRecommended: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'How many times this video was recommended'
    },
    timesCompleted: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'How many times users completed this video'
    },
    completionRate: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: null,
      comment: 'Percentage of users who completed this video'
    },
    // Categorization
    meditationType: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Type of meditation (e.g., "mindfulness", "sleep", "focus", "anxiety")'
    },
    difficulty: {
      type: DataTypes.ENUM('beginner', 'intermediate', 'advanced'),
      allowNull: true,
      defaultValue: 'beginner',
      comment: 'Difficulty level'
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Array of tags for better categorization'
    },
    // Quality control
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Whether this video is active for recommendations'
    },
    lastChecked: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Last time we verified this video exists on YouTube'
    },
    isAvailable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Whether the video is still available on YouTube'
    }
  }, {
    tableName: 'meditation_videos',
    timestamps: true,
    indexes: [
      {
        name: 'idx_duration',
        fields: ['duration']
      },
      {
        name: 'idx_channel',
        fields: ['channelName']
      },
      {
        name: 'idx_rating',
        fields: ['averageRating', 'totalRatings']
      },
      {
        name: 'idx_active',
        fields: ['isActive', 'isAvailable']
      },
      {
        name: 'idx_youtube_id',
        fields: ['youtubeId']
      }
    ]
  });

  // Associate function for relationships
  MeditationVideo.associate = function(models) {
    // A video can have many ratings
    MeditationVideo.hasMany(models.VideoRating, {
      foreignKey: 'videoId',
      as: 'ratings'
    });
    
    // A video can be used in many meditation sessions
    MeditationVideo.hasMany(models.MeditationSession, {
      foreignKey: 'videoId',
      as: 'sessions'
    });
  };

  // Instance methods for rating management
  MeditationVideo.prototype.addRating = async function(rating) {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }
    
    this.ratingSum += rating;
    this.totalRatings += 1;
    this.averageRating = this.ratingSum / this.totalRatings;
    
    await this.save();
    return this.averageRating;
  };

  MeditationVideo.prototype.incrementRecommended = async function() {
    this.timesRecommended += 1;
    await this.save();
  };

  MeditationVideo.prototype.incrementCompleted = async function() {
    this.timesCompleted += 1;
    this.completionRate = (this.timesCompleted / this.timesRecommended) * 100;
    await this.save();
  };

  // Static methods for video selection
  MeditationVideo.findByDuration = function(duration, limit = 10) {
    return MeditationVideo.findAll({
      where: {
        duration,
        isActive: true,
        isAvailable: true
      },
      order: [
        ['averageRating', 'DESC'],
        ['totalRatings', 'DESC'],
        ['viewCount', 'DESC']
      ],
      limit
    });
  };

  MeditationVideo.findRecommended = function(duration, excludeIds = [], limit = 5) {
    const { Op } = require('sequelize');
    const whereClause = {
      duration,
      isActive: true,
      isAvailable: true
    };
    
    if (excludeIds.length > 0) {
      whereClause.id = { [Op.notIn]: excludeIds };
    }
    
    return MeditationVideo.findAll({
      where: whereClause,
      order: [
        // Prioritize high-rated videos with sufficient ratings
        [sequelize.literal('CASE WHEN total_ratings >= 5 THEN average_rating ELSE 0 END'), 'DESC'],
        ['totalRatings', 'DESC'],
        ['timesCompleted', 'DESC'],
        ['viewCount', 'DESC']
      ],
      limit
    });
  };

  return MeditationVideo;
};