const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkLLMSettings() {
  try {
    console.log('Checking LLM settings in database...\n');

    // Get all settings
    const settings = await prisma.setting.findMany({
      where: {
        OR: [
          { key: { startsWith: 'llm_' } },
          { key: { startsWith: 'ollama_' } }
        ]
      },
      orderBy: { key: 'asc' }
    });

    console.log('LLM-related settings:');
    settings.forEach(setting => {
      const value = setting.key.includes('api_key') ? 
        (setting.value ? `${setting.value.substring(0, 10)}...` : 'null') : 
        setting.value;
      console.log(`  ${setting.key}: ${value}`);
    });

    // Check specific provider settings
    const providers = ['groq', 'openai', 'anthropic', 'ollama'];
    
    console.log('\nProvider-specific checks:');
    for (const provider of providers) {
      const apiKey = await prisma.setting.findUnique({
        where: { key: `llm_provider_${provider}_api_key` }
      });
      
      const model = await prisma.setting.findUnique({
        where: { key: `llm_provider_${provider}_model` }
      });
      
      console.log(`  ${provider}:`);
      console.log(`    API Key: ${apiKey ? 'Found' : 'Not found'}`);
      console.log(`    Model: ${model?.value || 'Not set'}`);
    }

  } catch (error) {
    console.error('Error checking LLM settings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLLMSettings(); 