import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedLLMProviders() {
  try {
    console.log('Seeding LLM provider configurations...');

    // Seed LLM settings
    const defaultLLMSettings = {
      selectedModel: 'llama3.2:3b',
      selectedProvider: 'ollama',
      latencyWeight: 0.7,
      costWeight: 0.3,
      providers: {
        ollama: { enabled: true, priority: 1 },
        groq: { enabled: true, priority: 2 },
        openai: { enabled: true, priority: 3 },
        anthropic: { enabled: true, priority: 4 },
        aws: { enabled: false, priority: 5 },
        azure: { enabled: false, priority: 6 },
      },
    };

    await prisma.setting.upsert({
      where: { key: 'llm_settings' },
      update: {
        value: JSON.stringify(defaultLLMSettings),
        description: 'LLM Router Configuration',
        updatedAt: new Date(),
      },
      create: {
        key: 'llm_settings',
        value: JSON.stringify(defaultLLMSettings),
        description: 'LLM Router Configuration',
      },
    });

    // Seed provider configurations (these will be empty initially)
    const providers = ['groq', 'openai', 'anthropic', 'aws', 'azure'];
    
    for (const provider of providers) {
      // API key setting
      await prisma.setting.upsert({
        where: { key: `llm_provider_${provider}_api_key` },
        update: {
          value: '',
          description: `API Key for ${provider} LLM provider`,
          updatedAt: new Date(),
        },
        create: {
          key: `llm_provider_${provider}_api_key`,
          value: '',
          description: `API Key for ${provider} LLM provider`,
        },
      });

      // Models setting
      await prisma.setting.upsert({
        where: { key: `llm_provider_${provider}_models` },
        update: {
          value: JSON.stringify([]),
          description: `Available models for ${provider} LLM provider`,
          updatedAt: new Date(),
        },
        create: {
          key: `llm_provider_${provider}_models`,
          value: JSON.stringify([]),
          description: `Available models for ${provider} LLM provider`,
        },
      });
    }

    console.log('✅ LLM provider configurations seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding LLM provider configurations:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedLLMProviders()
  .then(() => {
    console.log('LLM provider seeding completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('LLM provider seeding failed:', error);
    process.exit(1);
  }); 