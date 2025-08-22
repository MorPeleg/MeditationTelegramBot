const { User, MeditationSession } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

class AnalyticsService {
  
  // Get user analytics
  async getUserAnalytics(telegramId) {
    try {
      const user = await User.findOne({ 
        where: { telegramId },
        include: [{
          model: MeditationSession,
          as: 'sessions',
          order: [['createdAt', 'DESC']]
        }]
      });

      if (!user) return null;

      const sessions = user.sessions;
      const totalSessions = sessions.length;
      const completedSessions = sessions.filter(s => s.completed === true);
      const completedCount = completedSessions.length;
      
      // Calculate streaks
      const currentStreak = this.calculateCurrentStreak(sessions);
      const longestStreak = this.calculateLongestStreak(sessions);
      
      // Calculate completion rate
      const completionRate = totalSessions > 0 ? Math.round((completedCount / totalSessions) * 100) : 0;
      
      // Average ratings
      const videoRatings = sessions.filter(s => s.videoHelpful).map(s => s.videoHelpful);
      const messageRatings = sessions.filter(s => s.messageHelpful).map(s => s.messageHelpful);
      
      const avgVideoRating = videoRatings.length > 0 ? 
        (videoRatings.reduce((a, b) => a + b, 0) / videoRatings.length).toFixed(1) : 0;
      const avgMessageRating = messageRatings.length > 0 ? 
        (messageRatings.reduce((a, b) => a + b, 0) / messageRatings.length).toFixed(1) : 0;

      // Session frequency analysis
      const weeklyStats = this.getWeeklyStats(sessions);
      const monthlyStats = this.getMonthlyStats(sessions);
      
      // Preferred meditation times
      const durationStats = this.getDurationStats(sessions);
      
      return {
        user: {
          name: user.name,
          currentDay: user.currentDay,
          joinDate: user.createdAt,
          preferredDuration: user.preferredDuration,
          reminderTime: user.reminderTime
        },
        sessions: {
          total: totalSessions,
          completed: completedCount,
          completionRate: completionRate,
          currentStreak: currentStreak,
          longestStreak: longestStreak
        },
        ratings: {
          averageVideoRating: avgVideoRating,
          averageMessageRating: avgMessageRating,
          totalRatings: videoRatings.length
        },
        patterns: {
          weekly: weeklyStats,
          monthly: monthlyStats,
          durations: durationStats
        }
      };
    } catch (error) {
      console.error('Error getting user analytics:', error);
      return null;
    }
  }

  // Calculate current streak
  calculateCurrentStreak(sessions) {
    if (sessions.length === 0) return 0;
    
    // Sort sessions by date (most recent first)
    const sortedSessions = sessions
      .filter(s => s.completed === true)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (sortedSessions.length === 0) return 0;
    
    let streak = 0;
    let currentDate = moment().format('YYYY-MM-DD');
    
    for (const session of sortedSessions) {
      const sessionDate = moment(session.date).format('YYYY-MM-DD');
      
      if (sessionDate === currentDate) {
        streak++;
        currentDate = moment(currentDate).subtract(1, 'day').format('YYYY-MM-DD');
      } else if (moment(currentDate).diff(moment(sessionDate), 'days') === 1) {
        streak++;
        currentDate = moment(currentDate).subtract(1, 'day').format('YYYY-MM-DD');
      } else {
        break;
      }
    }
    
    return streak;
  }

  // Calculate longest streak
  calculateLongestStreak(sessions) {
    if (sessions.length === 0) return 0;
    
    const completedSessions = sessions
      .filter(s => s.completed === true)
      .map(s => moment(s.date).format('YYYY-MM-DD'))
      .sort();
    
    if (completedSessions.length === 0) return 0;
    
    let longestStreak = 1;
    let currentStreak = 1;
    
    for (let i = 1; i < completedSessions.length; i++) {
      const prevDate = moment(completedSessions[i - 1]);
      const currDate = moment(completedSessions[i]);
      
      if (currDate.diff(prevDate, 'days') === 1) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }
    
    return longestStreak;
  }

  // Get weekly statistics
  getWeeklyStats(sessions) {
    const weeklyData = {};
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    sessions.forEach(session => {
      const dayOfWeek = moment(session.date).day();
      const dayName = daysOfWeek[dayOfWeek];
      
      if (!weeklyData[dayName]) {
        weeklyData[dayName] = { total: 0, completed: 0 };
      }
      
      weeklyData[dayName].total++;
      if (session.completed) {
        weeklyData[dayName].completed++;
      }
    });
    
    return weeklyData;
  }

  // Get monthly statistics
  getMonthlyStats(sessions) {
    const monthlyData = {};
    
    sessions.forEach(session => {
      const month = moment(session.date).format('YYYY-MM');
      
      if (!monthlyData[month]) {
        monthlyData[month] = { total: 0, completed: 0 };
      }
      
      monthlyData[month].total++;
      if (session.completed) {
        monthlyData[month].completed++;
      }
    });
    
    return monthlyData;
  }

  // Get duration statistics
  getDurationStats(sessions) {
    const durationData = {};
    
    sessions.forEach(session => {
      const duration = session.duration;
      
      if (!durationData[duration]) {
        durationData[duration] = { total: 0, completed: 0 };
      }
      
      durationData[duration].total++;
      if (session.completed) {
        durationData[duration].completed++;
      }
    });
    
    return durationData;
  }

  // Get global platform analytics
  async getPlatformAnalytics() {
    try {
      // User statistics
      const totalUsers = await User.count();
      const activeUsers = await User.count({ where: { isActive: true } });
      const completedOnboarding = await User.count({ where: { isOnboardingComplete: true } });
      
      // Session statistics
      const totalSessions = await MeditationSession.count();
      const completedSessions = await MeditationSession.count({ where: { completed: true } });
      const platformCompletionRate = totalSessions > 0 ? 
        Math.round((completedSessions / totalSessions) * 100) : 0;
      
      // Recent activity (last 7 days)
      const oneWeekAgo = moment().subtract(7, 'days').format('YYYY-MM-DD');
      const recentSessions = await MeditationSession.count({
        where: {
          date: { [Op.gte]: oneWeekAgo }
        }
      });
      
      const recentCompletedSessions = await MeditationSession.count({
        where: {
          date: { [Op.gte]: oneWeekAgo },
          completed: true
        }
      });
      
      // Average ratings
      const avgVideoRating = await MeditationSession.findAll({
        where: { videoHelpful: { [Op.ne]: null } },
        attributes: [[MeditationSession.sequelize.fn('AVG', MeditationSession.sequelize.col('videoHelpful')), 'avgRating']]
      });
      
      const avgMessageRating = await MeditationSession.findAll({
        where: { messageHelpful: { [Op.ne]: null } },
        attributes: [[MeditationSession.sequelize.fn('AVG', MeditationSession.sequelize.col('messageHelpful')), 'avgRating']]
      });
      
      // Most popular durations
      const durationPopularity = await MeditationSession.findAll({
        attributes: [
          'duration',
          [MeditationSession.sequelize.fn('COUNT', MeditationSession.sequelize.col('duration')), 'count']
        ],
        group: ['duration'],
        order: [[MeditationSession.sequelize.fn('COUNT', MeditationSession.sequelize.col('duration')), 'DESC']]
      });
      
      return {
        users: {
          total: totalUsers,
          active: activeUsers,
          completedOnboarding: completedOnboarding,
          onboardingRate: totalUsers > 0 ? Math.round((completedOnboarding / totalUsers) * 100) : 0
        },
        sessions: {
          total: totalSessions,
          completed: completedSessions,
          completionRate: platformCompletionRate,
          recentTotal: recentSessions,
          recentCompleted: recentCompletedSessions
        },
        ratings: {
          averageVideoRating: avgVideoRating[0] ? parseFloat(avgVideoRating[0].dataValues.avgRating).toFixed(1) : 0,
          averageMessageRating: avgMessageRating[0] ? parseFloat(avgMessageRating[0].dataValues.avgRating).toFixed(1) : 0
        },
        popularity: {
          durations: durationPopularity.map(item => ({
            duration: item.duration,
            count: parseInt(item.dataValues.count)
          }))
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting platform analytics:', error);
      return null;
    }
  }

  // Get user engagement insights
  async getUserEngagementInsights(telegramId) {
    try {
      const analytics = await this.getUserAnalytics(telegramId);
      if (!analytics) return null;
      
      const insights = [];
      
      // Completion rate insights
      if (analytics.sessions.completionRate >= 80) {
        insights.push({
          type: 'positive',
          message: "🎉 Excellent! You're completing over 80% of your meditation sessions. You're building a strong mindfulness habit!"
        });
      } else if (analytics.sessions.completionRate >= 60) {
        insights.push({
          type: 'encouraging',
          message: "👏 Good progress! You're completing most of your sessions. Try to maintain consistency to strengthen your practice."
        });
      } else if (analytics.sessions.completionRate < 40) {
        insights.push({
          type: 'supportive',
          message: "🌱 Every meditation counts! Consider trying shorter sessions or adjusting your reminder time to make it easier to maintain your practice."
        });
      }
      
      // Streak insights
      if (analytics.sessions.currentStreak >= 7) {
        insights.push({
          type: 'achievement',
          message: `🔥 Amazing! You're on a ${analytics.sessions.currentStreak}-day streak. Consistency is key to building lasting habits!`
        });
      } else if (analytics.sessions.currentStreak >= 3) {
        insights.push({
          type: 'positive',
          message: `✨ Great job! You're on a ${analytics.sessions.currentStreak}-day streak. Keep it up!`
        });
      }
      
      // Rating insights
      if (analytics.ratings.averageVideoRating >= 4) {
        insights.push({
          type: 'positive',
          message: "💫 You're finding the meditation videos very helpful! This shows you're engaged and getting value from your practice."
        });
      }
      
      // Frequency insights
      const daysSinceJoin = moment().diff(moment(analytics.user.joinDate), 'days');
      const sessionFrequency = analytics.sessions.total / Math.max(daysSinceJoin, 1);
      
      if (sessionFrequency >= 0.8) {
        insights.push({
          type: 'achievement',
          message: "🌟 You're meditating almost daily! This level of consistency will bring profound benefits to your wellbeing."
        });
      }
      
      return {
        user: analytics.user,
        insights: insights,
        stats: analytics.sessions
      };
    } catch (error) {
      console.error('Error getting user engagement insights:', error);
      return null;
    }
  }

  // Generate personalized recommendations
  async getPersonalizedRecommendations(telegramId) {
    try {
      const analytics = await this.getUserAnalytics(telegramId);
      if (!analytics) return null;
      
      const recommendations = [];
      
      // Duration recommendations based on completion rates
      const durationStats = analytics.patterns.durations;
      let bestDuration = null;
      let bestCompletionRate = 0;
      
      Object.keys(durationStats).forEach(duration => {
        const stats = durationStats[duration];
        const rate = stats.total > 0 ? (stats.completed / stats.total) : 0;
        if (rate > bestCompletionRate && stats.total >= 3) {
          bestCompletionRate = rate;
          bestDuration = duration;
        }
      });
      
      if (bestDuration && bestDuration !== analytics.user.preferredDuration) {
        recommendations.push({
          type: 'duration',
          message: `Consider switching to ${bestDuration} sessions - you have a ${Math.round(bestCompletionRate * 100)}% completion rate with this duration!`,
          actionData: `duration_${bestDuration}`
        });
      }
      
      // Weekly pattern recommendations
      const weeklyStats = analytics.patterns.weekly;
      const bestDays = Object.keys(weeklyStats).filter(day => {
        const stats = weeklyStats[day];
        return stats.total >= 2 && (stats.completed / stats.total) >= 0.8;
      });
      
      if (bestDays.length > 0) {
        recommendations.push({
          type: 'timing',
          message: `You tend to be most successful meditating on ${bestDays.join(', ')}. Consider focusing your practice on these days!`
        });
      }
      
      // Streak building recommendations
      if (analytics.sessions.currentStreak === 0 && analytics.sessions.total > 0) {
        recommendations.push({
          type: 'motivation',
          message: "Let's rebuild your streak! Starting fresh can be just as powerful. Try committing to just 3 days in a row."
        });
      }
      
      return recommendations;
    } catch (error) {
      console.error('Error getting personalized recommendations:', error);
      return [];
    }
  }
}

module.exports = new AnalyticsService();