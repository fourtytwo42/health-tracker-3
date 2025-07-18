import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedLLMSettings() {
  try {
    console.log('Seeding LLM settings...');

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

    // Upsert the LLM settings
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

    console.log('✅ LLM settings seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding LLM settings:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedLLMSettings()
  .then(() => {
    console.log('LLM settings seeding completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('LLM settings seeding failed:', error);
    process.exit(1);
  }); 