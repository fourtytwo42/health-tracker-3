const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedSystemMessages() {
  console.log('💬 Seeding system messages...');
  
  const systemMessages = [
    {
      key: 'welcome',
      title: 'Welcome Message',
      content: 'Welcome to your AI Health Companion! I\'m here to help you achieve your health and fitness goals. I can assist with meal planning, exercise recommendations, tracking your progress, and answering health-related questions. How can I help you today?',
      category: 'GENERAL',
      isActive: true
    },
    {
      key: 'meal_planning',
      title: 'Meal Planning Assistant',
      content: 'I can help you create personalized meal plans based on your dietary preferences, allergies, and health goals. I\'ll consider your calorie needs, macronutrient targets, and food preferences to suggest balanced, nutritious meals.',
      category: 'MEAL_PLANNING',
      isActive: true
    },
    {
      key: 'exercise_guidance',
      title: 'Exercise Guidance',
      content: 'I can provide exercise recommendations tailored to your fitness level, goals, and any physical limitations. I\'ll help you create workout plans, suggest modifications for injuries, and track your progress.',
      category: 'EXERCISE',
      isActive: true
    },
    {
      key: 'health_tracking',
      title: 'Health Tracking',
      content: 'I can help you track various health metrics including weight, body measurements, biomarkers, and progress toward your goals. I\'ll provide insights and recommendations based on your data.',
      category: 'TRACKING',
      isActive: true
    },
    {
      key: 'nutrition_advice',
      title: 'Nutrition Advice',
      content: 'I can provide evidence-based nutrition advice, help you understand food labels, suggest healthy alternatives, and answer questions about vitamins, minerals, and dietary supplements.',
      category: 'NUTRITION',
      isActive: true
    }
  ];

  for (const message of systemMessages) {
    await prisma.systemMessage.upsert({
      where: { key: message.key },
      update: message,
      create: message
    });
  }
  
  console.log('✅ System messages seeded successfully');
}

async function seedLLMProviders() {
  console.log('🤖 Seeding LLM providers...');
  
  const providers = [
    {
      name: 'OpenAI',
      type: 'OPENAI',
      baseUrl: 'https://api.openai.com/v1',
      apiKey: process.env.OPENAI_API_KEY || '',
      isActive: true,
      priority: 1,
      models: ['gpt-4', 'gpt-3.5-turbo', 'gpt-4-turbo']
    },
    {
      name: 'Anthropic',
      type: 'ANTHROPIC',
      baseUrl: 'https://api.anthropic.com',
      apiKey: process.env.ANTHROPIC_API_KEY || '',
      isActive: true,
      priority: 2,
      models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307']
    },
    {
      name: 'Ollama Local',
      type: 'OLLAMA',
      baseUrl: 'http://localhost:11434',
      apiKey: '',
      isActive: false,
      priority: 3,
      models: ['llama2', 'mistral', 'codellama']
    }
  ];

  for (const provider of providers) {
    await prisma.setting.upsert({
      where: { key: `llm_provider_${provider.name.toLowerCase()}` },
      update: {
        value: JSON.stringify(provider)
      },
      create: {
        key: `llm_provider_${provider.name.toLowerCase()}`,
        value: JSON.stringify(provider),
        description: `LLM Provider configuration for ${provider.name}`
      }
    });
  }
  
  console.log('✅ LLM providers seeded successfully');
}

async function seedLLMSettings() {
  console.log('⚙️  Seeding LLM settings...');
  
  const settings = [
    {
      key: 'default_llm_provider',
      value: 'OpenAI',
      description: 'Default LLM provider to use'
    },
    {
      key: 'default_model',
      value: 'gpt-4',
      description: 'Default model to use for LLM requests'
    },
    {
      key: 'max_tokens',
      value: '2000',
      description: 'Maximum tokens for LLM responses'
    },
    {
      key: 'temperature',
      value: '0.7',
      description: 'Temperature setting for LLM responses'
    },
    {
      key: 'enable_router',
      value: 'true',
      description: 'Enable LLM router for automatic provider selection'
    }
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: setting,
      create: setting
    });
  }
  
  console.log('✅ LLM settings seeded successfully');
}

async function main() {
  try {
    await seedSystemMessages();
    await seedLLMProviders();
    await seedLLMSettings();
    console.log('🎉 Settings seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during settings seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { seedSystemMessages, seedLLMProviders, seedLLMSettings }; 