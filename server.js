require('dotenv').config();
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');
const moment = require('moment-timezone');
const { sequelize } = require('./models');
const telegramHandler = require('./handlers/telegramHandler');
const reminderService = require('./services/reminderService');

const app = express();
const port = process.env.PORT || 3001;

// Initialize Telegram Bot
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Reminder management endpoints
app.get('/reminders/stats', async (req, res) => {
  try {
    const stats = await reminderService.getReminderStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/reminders/users', async (req, res) => {
  try {
    const userReminders = await reminderService.getAllUserReminders();
    res.json(userReminders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/reminders/test/:telegramId', async (req, res) => {
  try {
    const { telegramId } = req.params;
    const success = await reminderService.testReminderForUser(parseInt(telegramId));
    res.json({ success, message: success ? 'Test reminder sent' : 'Failed to send reminder' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Initialize Telegram handlers
telegramHandler.init(bot);

// Schedule daily reminders (runs every minute to check for reminders)
cron.schedule('* * * * *', async () => {
  try {
    await reminderService.sendScheduledReminders(bot);
  } catch (error) {
    console.error('Error sending scheduled reminders:', error);
  }
});

// Database connection and server start
async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    
    // Sync database models
    await sequelize.sync();
    console.log('Database models synchronized.');
    
    // Start server
    app.listen(port, '0.0.0.0', () => {
      console.log(`MindfulU Telegram Bot server running on port ${port}`);
      console.log('Bot is active and listening for messages...');
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await sequelize.close();
  process.exit(0);
});

// Start the server
startServer();