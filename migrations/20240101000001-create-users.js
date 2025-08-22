'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      telegramId: {
        type: Sequelize.BIGINT,
        unique: true,
        allowNull: false
      },
      username: {
        type: Sequelize.STRING,
        allowNull: true
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: true
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      age: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      gender: {
        type: Sequelize.STRING,
        allowNull: true
      },
      motivation: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      preferredDuration: {
        type: Sequelize.STRING,
        defaultValue: '10 min'
      },
      reminderTime: {
        type: Sequelize.STRING,
        defaultValue: '09:00'
      },
      timezone: {
        type: Sequelize.STRING,
        defaultValue: 'UTC'
      },
      onboardingStep: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      isOnboardingComplete: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      currentDay: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Users');
  }
};