import { SettingService } from '../lib/services/SettingService';
import { LLMRouter } from '../lib/llmRouter';

async function testLLMSettings() {
  try {
    console.log('Testing LLM Settings...\n');

    // Test SettingService
    const settingService = SettingService.getInstance();
    
    console.log('1. Testing SettingService...');
    const settings = await settingService.getLLMSettings();
    console.log('Current LLM Settings:', JSON.stringify(settings, null, 2));
    
    console.log('\n2. Testing LLMRouter...');
    const llmRouter = LLMRouter.getInstance();
    
    // Refresh providers to ensure they're loaded
    await llmRouter.refreshProviders();
    
    // Get provider stats
    const providerStats = llmRouter.getProviderStats();
    console.log('Provider Stats:', JSON.stringify(providerStats, null, 2));
    
    // Test a simple request
    console.log('\n3. Testing LLM Request...');
    try {
      const response = await llmRouter.generateResponse({
        prompt: 'Hello! Please respond with a short health tip.',
        userId: 'test-user',
        tool: 'test',
      });
      console.log('LLM Response:', response);
    } catch (error) {
      console.error('LLM Request failed:', error);
    }
    
    console.log('\n✅ LLM Settings test completed');
  } catch (error) {
    console.error('❌ LLM Settings test failed:', error);
  }
}

// Run the test
testLLMSettings()
  .then(() => {
    console.log('Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  }); 