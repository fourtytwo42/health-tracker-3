const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanAwsAzure() {
  try {
    console.log('🧹 Cleaning AWS and Azure LLM provider settings from database...');

    // List of settings to remove
    const settingsToRemove = [
      'llm_provider_aws_api_key',
      'llm_provider_aws_models',
      'llm_provider_azure_api_key',
      'llm_provider_azure_models'
    ];

    let removedCount = 0;

    for (const settingKey of settingsToRemove) {
      try {
        const deleted = await prisma.setting.deleteMany({
          where: { key: settingKey }
        });
        
        if (deleted.count > 0) {
          console.log(`✅ Removed setting: ${settingKey}`);
          removedCount += deleted.count;
        } else {
          console.log(`ℹ️  Setting not found: ${settingKey}`);
        }
      } catch (error) {
        console.log(`⚠️  Error removing ${settingKey}:`, error.message);
      }
    }

    // Update the main LLM settings to remove AWS and Azure from the providers object
    try {
      const currentSettings = await prisma.setting.findUnique({
        where: { key: 'llm_settings' }
      });

      if (currentSettings) {
        const settings = JSON.parse(currentSettings.value);
        
        // Remove AWS and Azure from providers
        if (settings.providers) {
          delete settings.providers.aws;
          delete settings.providers.azure;
        }

        // Update the settings
        await prisma.setting.update({
          where: { key: 'llm_settings' },
          data: {
            value: JSON.stringify(settings),
            updatedAt: new Date()
          }
        });

        console.log('✅ Updated LLM settings to remove AWS and Azure providers');
      }
    } catch (error) {
      console.log('⚠️  Error updating LLM settings:', error.message);
    }

    console.log(`\n🎉 Cleanup completed!`);
    console.log(`📊 Removed ${removedCount} AWS/Azure settings`);
    console.log('✅ Database is now clean of AWS and Azure LLM providers');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanAwsAzure()
  .then(() => {
    console.log('Cleanup completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Cleanup failed:', error);
    process.exit(1);
  }); 