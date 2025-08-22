const OpenAI = require('openai');
const { bctTaxonomy } = require('../data/bctTaxonomy');

class MessageGenerationService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.fallbackMessages = [
      "Remember your why: You started this journey to reduce stress and improve focus. (BCT 1.2)",
      "Small steps lead to big changes: Just 5 minutes today builds the foundation for lifelong well-being. (BCT 8.1)",
      "You're building a new identity: Each meditation session makes you someone who prioritizes mental health. (BCT 13.1)"
    ];
  }

  // Select relevant BCTs for meditation context
  selectRelevantBCTs() {
    const meditationRelevantBCTs = [
      "1.1", "1.2", "1.4", "1.5", "1.9", // Goals and planning
      "2.3", "2.4", "2.7", // Self-monitoring and feedback
      "3.1", "3.3", // Social support
      "5.1", "5.2", "5.6", // Natural consequences
      "8.1", "8.3", "8.7", // Repetition and habit formation
      "10.7", "10.9", // Self-reward
      "11.2", // Reduce negative emotions
      "12.1", "12.4", // Environmental restructuring and distraction
      "13.1", "13.2", "13.4", "13.5", // Identity
      "15.1", "15.2", "15.3", "15.4" // Self-belief
    ];
    
    // Randomly select 1-3 BCTs for the message
    const numBCTs = Math.floor(Math.random() * 3) + 1;
    const selectedBCTs = [];
    
    for (let i = 0; i < numBCTs; i++) {
      const randomIndex = Math.floor(Math.random() * meditationRelevantBCTs.length);
      const bctId = meditationRelevantBCTs[randomIndex];
      
      if (!selectedBCTs.find(b => b.id === bctId)) {
        selectedBCTs.push({
          id: bctId,
          name: bctTaxonomy[bctId]?.name || "Unknown BCT",
          definition: bctTaxonomy[bctId]?.definition || "No definition available"
        });
      }
    }
    
    return selectedBCTs;
  }

  // Generate personalized motivational message using LLM
  async generateMotivationalMessage(user, currentDay = 1) {
    try {
      if (!process.env.OPENAI_API_KEY) {
        console.warn('OpenAI API key not found, using fallback message');
        return this.getFallbackMessage(currentDay);
      }

      const selectedBCTs = this.selectRelevantBCTs();
      const bctDescriptions = selectedBCTs.map(bct => 
        `${bct.id} (${bct.name}): ${bct.definition}`
      ).join('\n');
      
      const bctFormatted = selectedBCTs.map(bct => `BCT ${bct.id} ${bct.name}`).join(', ');

      const prompt = `Generate a personalized, encouraging motivational message for a meditation app user. 

User Profile:
- Name: ${user.name || 'User'}
- Age: ${user.age || 'Unknown'}
- Current day: ${currentDay}
- Preferred duration: ${user.preferredDuration || '10 min'}
- Motivation: ${user.motivation || 'General wellness'}
- Gender: ${user.gender || 'Not specified'}

Use these Behavior Change Techniques (BCTs) to craft the message:
${bctDescriptions}

Requirements:
1. Create a warm, encouraging message (max 2 sentences)
2. Make it specific to meditation and mindfulness
3. Reference the user's motivation if relevant
4. Keep it inspiring and actionable
5. End with the BCT IDs and names in parentheses: (${bctFormatted})

The message should feel personal and motivating for day ${currentDay} of their meditation journey.

Example format: "Your message here that incorporates the BCT techniques naturally. (${bctFormatted})"`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert in behavior change and meditation coaching. Create motivational messages that incorporate behavior change techniques naturally and authentically."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 150,
        temperature: 0.8
      });

      const generatedMessage = completion.choices[0]?.message?.content?.trim();
      
      if (generatedMessage) {
        console.log(`Generated motivational message for user ${user.name}: ${generatedMessage}`);
        return generatedMessage;
      } else {
        throw new Error('No message generated');
      }

    } catch (error) {
      console.error('Error generating motivational message:', error.message);
      return this.getFallbackMessage(currentDay);
    }
  }

  // Generate context-aware message for specific situations
  async generateContextualMessage(user, context = 'daily', additionalData = {}) {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return this.getContextualFallback(context);
      }

      const selectedBCTs = this.selectRelevantBCTs();
      const bctFormatted = selectedBCTs.map(bct => `BCT ${bct.id} ${bct.name}`).join(', ');

      let contextPrompt = '';
      switch (context) {
        case 'streak':
          contextPrompt = `The user is on a ${additionalData.streak}-day meditation streak. Acknowledge their consistency and encourage them to continue.`;
          break;
        case 'comeback':
          contextPrompt = `The user is returning to meditation after a break. Encourage them without judgment and focus on fresh starts.`;
          break;
        case 'struggle':
          contextPrompt = `The user has been having difficulty completing sessions. Provide supportive, understanding motivation.`;
          break;
        case 'milestone':
          contextPrompt = `The user has reached day ${additionalData.day} milestone. Celebrate their progress and encourage continued growth.`;
          break;
        default:
          contextPrompt = 'Generate a standard daily motivational message.';
      }

      const prompt = `${contextPrompt}

User: ${user.name || 'User'}, Day ${additionalData.currentDay || 1}
Motivation: ${user.motivation || 'General wellness'}
Duration preference: ${user.preferredDuration || '10 min'}

Use BCT techniques to create an encouraging message. End with: (${bctFormatted})
Max 2 sentences, meditation-focused.`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system", 
            content: "You are a compassionate meditation guide using evidence-based behavior change techniques."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 120,
        temperature: 0.7
      });

      return completion.choices[0]?.message?.content?.trim() || this.getContextualFallback(context);

    } catch (error) {
      console.error('Error generating contextual message:', error.message);
      return this.getContextualFallback(context);
    }
  }

  // Generate insight-based message from user analytics
  async generateInsightMessage(user, analytics) {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return "Your meditation journey shows real progress! Keep building these healthy habits. (BCT 2.3, 15.3)";
      }

      const completionRate = analytics.sessions.completionRate || 0;
      const streak = analytics.sessions.currentStreak || 0;
      
      const selectedBCTs = this.selectRelevantBCTs();
      const bctFormatted = selectedBCTs.map(bct => `BCT ${bct.id} ${bct.name}`).join(', ');

      const prompt = `Create a personalized insight message for a meditation app user based on their analytics.

User: ${user.name}
Completion rate: ${completionRate}%
Current streak: ${streak} days
Total sessions: ${analytics.sessions.total || 0}
Average video rating: ${analytics.ratings.averageVideoRating || 'N/A'}

Generate an encouraging message that:
1. Acknowledges their specific progress/pattern
2. Uses behavior change techniques naturally
3. Motivates continued practice
4. Max 2 sentences
5. Ends with: (${bctFormatted})`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You're an expert at creating personalized motivation from user data analytics."
          },
          {
            role: "user", 
            content: prompt
          }
        ],
        max_tokens: 100,
        temperature: 0.6
      });

      return completion.choices[0]?.message?.content?.trim() || 
             `Your ${completionRate}% completion rate shows real commitment! Each session builds your mindfulness strength. (${bctFormatted})`;

    } catch (error) {
      console.error('Error generating insight message:', error.message);
      return `Your meditation practice is building valuable habits. Keep up the great work! (BCT 2.3 Self-monitoring of behavior, BCT 15.1 Verbal persuasion about capability)`;
    }
  }

  // Get fallback message when LLM is unavailable
  getFallbackMessage(currentDay = 1) {
    const messages = [
      "Remember your why: You started this journey to reduce stress and improve focus. (BCT 1.2 Problem solving)",
      "Small steps lead to big changes: Just 5 minutes today builds the foundation for lifelong well-being. (BCT 8.1 Behavioral practice/rehearsal)", 
      "You're building a new identity: Each meditation session makes you someone who prioritizes mental health. (BCT 13.1 Identification of self as role model)",
      "Progress tracking: You've meditated consistently - you're creating a powerful habit! (BCT 2.3 Self-monitoring of behavior)",
      "Social accountability: Join thousands who are transforming their lives through mindfulness. (BCT 3.1 Social support (unspecified))",
      "Environmental cue: Find your quiet space and make it your daily sanctuary for peace. (BCT 12.1 Restructuring the physical environment)",
      "Implementation intention: When you feel stressed, you will meditate for peace. (BCT 1.4 Action planning)",
      "Self-reward: After completing this week's meditations, treat yourself to something you enjoy. (BCT 10.9 Self-reward)"
    ];
    
    return messages[currentDay % messages.length];
  }

  // Get contextual fallback messages
  getContextualFallback(context) {
    const fallbacks = {
      streak: "Your consistency is building real change! Keep this momentum going strong. (BCT 2.3 Self-monitoring of behavior, BCT 15.1 Verbal persuasion about capability)",
      comeback: "Welcome back! Every moment is a fresh opportunity to reconnect with mindfulness. (BCT 13.2 Framing/reframing, BCT 15.1 Verbal persuasion about capability)",
      struggle: "Progress isn't always linear - every attempt at mindfulness counts and matters. (BCT 11.2 Reduce negative emotions, BCT 15.4 Self-talk)",
      milestone: "Look how far you've come! This milestone proves your commitment to inner growth. (BCT 15.3 Focus on past success, BCT 10.9 Self-reward)",
      daily: "Today's practice is an investment in your mental well-being and peace. (BCT 1.1 Goal setting (behavior), BCT 13.4 Valued self-identity)"
    };
    
    return fallbacks[context] || fallbacks.daily;
  }

  // Test the message generation system
  async testMessageGeneration() {
    const testUser = {
      name: "Test User",
      age: 25,
      preferredDuration: "10 min",
      motivation: "reduce stress and improve focus",
      gender: "Female"
    };

    try {
      console.log("Testing message generation...");
      const message = await this.generateMotivationalMessage(testUser, 5);
      console.log("Generated test message:", message);
      return message;
    } catch (error) {
      console.error("Test failed:", error);
      return null;
    }
  }
}

module.exports = new MessageGenerationService();