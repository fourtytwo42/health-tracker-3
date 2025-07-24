import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';

interface ImageGenerationConfig {
  prompt: string;
  textModel: string;
  quality: 'low' | 'medium' | 'high' | 'standard' | 'hd';
  size: '1024x1024' | '1536x1024' | '1024x1536' | 'auto';
  background?: 'opaque' | 'transparent';
  format?: 'png' | 'jpeg' | 'webp';
  outputCompression?: number;
}

interface ImageGenerationResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
  metadata?: {
    revisedPrompt?: string;
    tokens?: number;
    cost?: number;
  };
}

export async function generateImage(config: ImageGenerationConfig): Promise<ImageGenerationResult> {
  try {
    console.log('DEBUG: ImageGenerationService called for prompt:', config.prompt.substring(0, 50) + '...');
    console.log('DEBUG: Full config:', JSON.stringify(config, null, 2));
    
    // Get API key from database
    const setting = await prisma.setting.findUnique({
      where: { key: 'openai_api_key' },
    });

    console.log('DEBUG: API key setting found:', !!setting?.value);
    console.log('DEBUG: API key length:', setting?.value?.length || 0);
    console.log('DEBUG: API key starts with:', setting?.value?.substring(0, 10) + '...');
    
    if (!setting?.value) {
      console.log('DEBUG: No OpenAI API key configured');
      return {
        success: false,
        error: 'OpenAI API key not configured'
      };
    }

    const openai = new OpenAI({
      apiKey: setting.value,
    });

    console.log('DEBUG: About to call OpenAI API with params:', {
      model: 'gpt-image-1',
      prompt: config.prompt.substring(0, 100) + '...',
      n: 1,
      size: config.size,
      quality: config.quality
    });

    // Call OpenAI Images API with GPT Image 1
    const imageResponse = await openai.images.generate({
      model: 'gpt-image-1',
      prompt: config.prompt,
      n: 1,
      size: config.size,
      quality: config.quality
    });

    console.log('DEBUG: OpenAI API response received');
    console.log('DEBUG: Response structure:', Object.keys(imageResponse));
    console.log('DEBUG: Response data length:', imageResponse.data?.length || 0);
    
    const imageData = imageResponse.data?.[0];
    console.log('DEBUG: First image data:', imageData ? Object.keys(imageData) : 'null');
    
    if (!imageData) {
      console.log('DEBUG: No image data in response array');
      return {
        success: false,
        error: 'No image data in response'
      };
    }
    
    // GPT Image 1 returns base64 data, not URLs
    if (imageData?.b64_json) {
      console.log('DEBUG: Base64 image data found, length:', imageData.b64_json.length);
      
      // Convert base64 to data URL
      const imageUrl = `data:image/png;base64,${imageData.b64_json}`;
      console.log('DEBUG: Created data URL, length:', imageUrl.length);
      
      return {
        success: true,
        imageUrl,
        metadata: {
          revisedPrompt: imageData.revised_prompt,
          tokens: 0, // Images API doesn't return token usage
          cost: 0 // TODO: Calculate actual cost based on usage
        }
      };
    }
    
    // Fallback for URL-based responses (DALL-E 3)
    if (imageData?.url) {
      console.log('DEBUG: Image URL found:', imageData.url.substring(0, 50) + '...');
      return {
        success: true,
        imageUrl: imageData.url,
        metadata: {
          revisedPrompt: imageData.revised_prompt,
          tokens: 0, // Images API doesn't return token usage
          cost: 0 // TODO: Calculate actual cost based on usage
        }
      };
    }
    
    console.log('DEBUG: Image data exists but no b64_json or URL:', imageData);
    return {
      success: false,
      error: 'No image data (b64_json or URL) in response'
    };

  } catch (error: any) {
    console.error('DEBUG: Error generating image - Full error:', error);
    console.error('DEBUG: Error type:', typeof error);
    console.error('DEBUG: Error message:', error.message);
    console.error('DEBUG: Error code:', error.code);
    console.error('DEBUG: Error status:', error.status);
    console.error('DEBUG: Error response:', error.response);
    
    if (error.code === 'insufficient_quota') {
      console.log('DEBUG: Quota exceeded error detected');
      return {
        success: false,
        error: 'OpenAI quota exceeded'
      };
    }
    
    if (error.code === 'content_policy_violation') {
      console.log('DEBUG: Content policy violation detected');
      return {
        success: false,
        error: 'Content policy violation'
      };
    }
    
    console.log('DEBUG: Returning generic error');
    return {
      success: false,
      error: error.message || 'Failed to generate image'
    };
  }
} 