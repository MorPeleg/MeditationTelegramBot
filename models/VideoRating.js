module.exports = (sequelize, DataTypes) => {
  const VideoRating = sequelize.define('VideoRating', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      },
      comment: 'Reference to the user who gave the rating'
    },
    videoId: {
      type: DataTypes.INTEGER,
      allowNull: true, // Allow null for static videos that don't have database IDs
      references: {
        model: 'meditation_videos',
        key: 'id'
      },
      comment: 'Reference to the meditation video being rated (null for static videos)'
    },
    sessionId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'MeditationSessions',
        key: 'id'
      },
      comment: 'Reference to the meditation session this rating belongs to'
    },
    // Ratings (5-point Likert scale)
    videoRating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5
      },
      comment: 'User rating for the video helpfulness (1-5 scale)'
    },
    messageRating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5
      },
      comment: 'User rating for the motivational message (1-5 scale)'
    },
    // Additional feedback
    completed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether the user completed the meditation'
    },
    feedback: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Optional text feedback from user'
    },
    // Context information
    userDay: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'What day of meditation journey this was for the user'
    },
    duration: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Duration category when this rating was given'
    },
    bctTechniques: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'BCT techniques used in the motivational message'
    }
  }, {
    tableName: 'video_ratings',
    timestamps: true,
    indexes: [
      {
        name: 'idx_user_video',
        fields: ['userId', 'videoId'],
        unique: true // Prevent duplicate ratings from same user for same video
      },
      {
        name: 'idx_video_ratings',
        fields: ['videoId', 'videoRating']
      },
      {
        name: 'idx_message_ratings',
        fields: ['videoId', 'messageRating']
      },
      {
        name: 'idx_completion',
        fields: ['videoId', 'completed']
      },
      {
        name: 'idx_session',
        fields: ['sessionId']
      }
    ]
  });

  // Associate function for relationships
  VideoRating.associate = function(models) {
    // A rating belongs to a user
    VideoRating.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    
    // A rating belongs to a video
    VideoRating.belongsTo(models.MeditationVideo, {
      foreignKey: 'videoId',
      as: 'video'
    });
    
    // A rating belongs to a meditation session
    VideoRating.belongsTo(models.MeditationSession, {
      foreignKey: 'sessionId',
      as: 'session'
    });
  };

  // Instance methods
  VideoRating.prototype.isPositive = function() {
    return this.videoRating >= 4 && this.messageRating >= 4;
  };

  VideoRating.prototype.getAverageRating = function() {
    return (this.videoRating + this.messageRating) / 2;
  };

  // Static methods for analytics
  VideoRating.getVideoStats = async function(videoId) {
    const ratings = await VideoRating.findAll({
      where: { videoId },
      attributes: ['videoRating', 'messageRating', 'completed']
    });

    if (ratings.length === 0) {
      return {
        totalRatings: 0,
        averageVideoRating: null,
        averageMessageRating: null,
        completionRate: null
      };
    }

    const videoRatingSum = ratings.reduce((sum, r) => sum + r.videoRating, 0);
    const messageRatingSum = ratings.reduce((sum, r) => sum + r.messageRating, 0);
    const completedCount = ratings.filter(r => r.completed).length;

    return {
      totalRatings: ratings.length,
      averageVideoRating: videoRatingSum / ratings.length,
      averageMessageRating: messageRatingSum / ratings.length,
      completionRate: (completedCount / ratings.length) * 100
    };
  };

  VideoRating.getUserPreferences = async function(userId, limit = 20) {
    return VideoRating.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit,
      include: [{
        model: sequelize.models.MeditationVideo,
        as: 'video',
        attributes: ['channelName', 'meditationType', 'difficulty', 'tags']
      }]
    });
  };

  return VideoRating;
};