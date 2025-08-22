module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    telegramId: {
      type: DataTypes.BIGINT,
      unique: true,
      allowNull: false
    },
    username: {
      type: DataTypes.STRING,
      allowNull: true
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    gender: {
      type: DataTypes.STRING,
      allowNull: true
    },
    motivation: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    preferredDuration: {
      type: DataTypes.STRING,
      defaultValue: '10 min'
    },
    reminderTime: {
      type: DataTypes.STRING,
      defaultValue: '09:00'
    },
    timezone: {
      type: DataTypes.STRING,
      defaultValue: 'UTC'
    },
    onboardingStep: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    isOnboardingComplete: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    currentDay: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    }
  });

  User.associate = function(models) {
    User.hasMany(models.MeditationSession, {
      foreignKey: 'userId',
      as: 'sessions'
    });
  };

  return User;
};