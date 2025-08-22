module.exports = (sequelize, DataTypes) => {
  const MeditationSession = sequelize.define('MeditationSession', {
    userId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    day: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    duration: {
      type: DataTypes.STRING,
      allowNull: false
    },
    videoId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'meditation_videos',
        key: 'id'
      },
      comment: 'Reference to the meditation video used'
    },
    videoTitle: {
      type: DataTypes.STRING,
      allowNull: true
    },
    videoUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    bctTechniqueId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    bctMessage: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    completed: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    videoHelpful: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 5
      }
    },
    messageHelpful: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 5
      }
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  });

  MeditationSession.associate = function(models) {
    MeditationSession.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    
    MeditationSession.belongsTo(models.MeditationVideo, {
      foreignKey: 'videoId',
      as: 'video'
    });
    
    MeditationSession.hasOne(models.VideoRating, {
      foreignKey: 'sessionId',
      as: 'rating'
    });
  };

  return MeditationSession;
};