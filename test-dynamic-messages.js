require('dotenv').config();
const messageGenerationService = require('./services/messageGenerationService');

async function testDynamicMessages() {
  console.log('🧪 Testing Dynamic BCT Message Generation\n');

  // Test user profiles
  const testUsers = [
    {
      name: "Sarah",
      age: 28,
      preferredDuration: "10 min",
      motivation: "reduce anxiety and improve sleep",
      gender: "Female"
    },
    {
      name: "Mike",
      age: 35,
      preferredDuration: "15 min", 
      motivation: "manage work stress and increase focus",
      gender: "Male"
    },
    {
      name: "Alex",
      age: 22,
      preferredDuration: "5 min",
      motivation: "build healthy habits for university",
      gender: "Non-binary"
    }
  ];

  // Test different days
  const testDays = [1, 5, 10, 21];

  for (const user of testUsers) {
    console.log(`👤 Testing messages for ${user.name} (${user.age}, ${user.gender})`);
    console.log(`   Motivation: ${user.motivation}`);
    console.log(`   Duration: ${user.preferredDuration}\n`);

    for (const day of testDays) {
      console.log(`📅 Day ${day}:`);
      try {
        const message = await messageGenerationService.generateMotivationalMessage(user, day);
        console.log(`   "${message}"\n`);
      } catch (error) {
        console.log(`   Error: ${error.message}\n`);
      }
    }
    console.log('─'.repeat(60));
  }

  // Test contextual messages
  console.log('\n🎯 Testing Contextual Messages:\n');
  
  const contexts = [
    { type: 'streak', data: { streak: 7 } },
    { type: 'comeback', data: {} },
    { type: 'struggle', data: {} },
    { type: 'milestone', data: { day: 30 } }
  ];

  for (const context of contexts) {
    console.log(`📋 Context: ${context.type.toUpperCase()}`);
    try {
      const message = await messageGenerationService.generateContextualMessage(
        testUsers[0], 
        context.type, 
        context.data
      );
      console.log(`   "${message}"\n`);
    } catch (error) {
      console.log(`   Error: ${error.message}\n`);
    }
  }

  // Test analytics-based insights
  console.log('📊 Testing Analytics-Based Messages:\n');
  
  const mockAnalytics = {
    sessions: {
      total: 15,
      completed: 12,
      completionRate: 80,
      currentStreak: 5
    },
    ratings: {
      averageVideoRating: 4.2,
      averageMessageRating: 4.5
    }
  };

  try {
    const insightMessage = await messageGenerationService.generateInsightMessage(
      testUsers[0], 
      mockAnalytics
    );
    console.log(`📈 Insight Message: "${insightMessage}"\n`);
  } catch (error) {
    console.log(`Error: ${error.message}\n`);
  }

  console.log('✅ Dynamic message testing completed!');
  
  // Show fallback behavior
  console.log('\n🔄 Fallback Messages (when LLM unavailable):');
  for (let i = 1; i <= 5; i++) {
    const fallback = messageGenerationService.getFallbackMessage(i);
    console.log(`   Day ${i}: "${fallback}"`);
  }
}

// Run the test
testDynamicMessages().catch(console.error);