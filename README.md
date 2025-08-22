# MindfulU Telegram Bot

A comprehensive meditation bot for Telegram that helps users build daily meditation habits using evidence-based behavior change techniques.

## Features

🧘‍♀️ **Daily Meditation Sessions**
- Personalized meditation recommendations
- Multiple duration options (5 min to 30 min)
- Curated meditation video library

🎯 **Behavior Change Techniques**
- Evidence-based motivational messages
- Progress tracking and streak building
- Social accountability features
- Goal setting and implementation intentions

📊 **Analytics & Progress Tracking**
- Personal meditation statistics
- Streak tracking
- Completion rates
- Performance insights

⏰ **Smart Reminders**
- Timezone-aware daily reminders
- Customizable reminder times
- Snooze functionality

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- Telegram Bot Token (from @BotFather)

### Installation

1. **Clone and setup the project:**
   ```bash
   cd telegram-bot-backend
   npm install
   ```

2. **Database Setup:**
   ```bash
   # Install PostgreSQL and create a database
   createdb mindful_bot
   
   # Run migrations
   npm run migrate
   ```

3. **Environment Configuration:**
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit .env with your configuration
   ```

4. **Configure your .env file:**
   ```env
   # Telegram Bot Token from @BotFather
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=mindful_bot
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   
   # Server Configuration
   PORT=3001
   NODE_ENV=development
   
   # Timezone Configuration
   DEFAULT_TIMEZONE=America/New_York
   ```

### Getting a Telegram Bot Token

1. Open Telegram and search for "@BotFather"
2. Send `/newbot` command
3. Follow the instructions to create your bot
4. Save the token provided by BotFather
5. Add the token to your `.env` file

### Running the Bot

```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

## Bot Commands

- `/start` - Start or restart the bot
- `/progress` - View your meditation progress
- `/settings` - Change your preferences
- `/help` - Show help information

## Project Structure

```
telegram-bot-backend/
├── config/
│   └── database.js          # Database configuration
├── data/
│   └── meditationData.js     # Meditation content and BCT techniques
├── handlers/
│   └── telegramHandler.js    # Telegram bot message handling
├── migrations/
│   ├── 20240101000001-create-users.js
│   └── 20240101000002-create-meditation-sessions.js
├── models/
│   ├── index.js
│   ├── User.js
│   └── MeditationSession.js
├── services/
│   ├── reminderService.js    # Scheduled reminders
│   └── analyticsService.js   # User analytics and insights
├── server.js                 # Main application entry point
└── package.json
```

## Database Schema

### Users Table
- Basic user information (Telegram ID, name, age, gender)
- Meditation preferences (duration, reminder time, timezone)
- Onboarding status and current day tracking
- Activity status

### MeditationSessions Table
- Session tracking (day, date, duration, video)
- Feedback collection (completion status, ratings)
- Behavior change technique data
- User notes and insights

## Behavior Change Techniques

The bot implements evidence-based behavior change techniques (BCTs):

1. **BCT 1.2** - Problem solving
2. **BCT 8.1** - Behavioral practice/rehearsal  
3. **BCT 13.1** - Identity-associated goals
4. **BCT 2.3** - Self-monitoring of behaviour
5. **BCT 3.1** - Social support (unspecified)
6. **BCT 12.1** - Restructuring the physical environment
7. **BCT 1.4** - Action planning
8. **BCT 10.9** - Self-reward

## API Endpoints

- `GET /health` - Health check endpoint
- Server runs on port 3001 by default

## Deployment

### Using PM2 (Recommended for production)

```bash
# Install PM2 globally
npm install -g pm2

# Start the application
pm2 start server.js --name "mindful-bot"

# Setup auto-restart on server reboot
pm2 startup
pm2 save
```

### Using Docker

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["node", "server.js"]
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `TELEGRAM_BOT_TOKEN` | Bot token from @BotFather | Yes |
| `DB_HOST` | PostgreSQL host | Yes |
| `DB_PORT` | PostgreSQL port | Yes |
| `DB_NAME` | Database name | Yes |
| `DB_USER` | Database username | Yes |
| `DB_PASSWORD` | Database password | Yes |
| `PORT` | Server port | No (default: 3001) |
| `NODE_ENV` | Environment | No (default: development) |
| `DEFAULT_TIMEZONE` | Default timezone | No (default: UTC) |

## Features Overview

### Onboarding Flow
1. Welcome message and name collection
2. Age and gender (optional) input
3. Motivation exploration
4. Duration preference selection
5. Reminder time scheduling

### Daily Flow
1. Scheduled reminder with personalized message
2. Meditation video recommendation
3. Session tracking and timer
4. Feedback collection (completion, ratings)
5. Progress update and streak tracking

### Analytics Features
- Personal statistics dashboard
- Streak calculations (current and longest)
- Completion rate analysis
- Weekly and monthly patterns
- Duration preference insights
- Personalized recommendations

## Troubleshooting

### Common Issues

1. **Bot not responding**
   - Check if the bot token is correct
   - Verify the bot is running with `pm2 list` or check logs
   - Ensure database connection is working

2. **Database connection errors**
   - Verify PostgreSQL is running
   - Check database credentials in .env
   - Run migrations with `npm run migrate`

3. **Reminders not sending**
   - Check timezone settings
   - Verify cron job is running
   - Check user's active status in database

### Logs

```bash
# View application logs
pm2 logs mindful-bot

# View real-time logs
pm2 logs mindful-bot --lines 100 -f
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support or questions, please create an issue in the GitHub repository.