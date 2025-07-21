import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';

interface ImageGenerationConfig {
  prompt: string;
  textModel: string;
  quality: 'low' | 'medium' | 'high' | 'auto';
  size: '1024x1024' | '1536x1024' | '1024x1536' | 'auto';
  background: 'opaque' | 'transparent';
  format: 'png' | 'jpeg' | 'webp';
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
    // Get API key from database
    const setting = await prisma.setting.findUnique({
      where: { key: 'openai_api_key' },
    });

    if (!setting?.value) {
      return {
        success: false,
        error: 'OpenAI API key not configured'
      };
    }

    const openai = new OpenAI({
      apiKey: setting.value,
    });

    // Call OpenAI Images API directly
    const imageResponse = await openai.images.generate({
      model: 'dall-e-3',
      prompt: config.prompt,
      n: 1,
      size: config.size,
      quality: config.quality,
      response_format: 'b64_json'
    });

    const imageData = imageResponse.data?.[0];
    
    if (!imageData || !imageData.b64_json) {
      return {
        success: false,
        error: 'No image data in response'
      };
    }

    // Convert base64 to data URL
    const imageUrl = `data:image/${config.format};base64,${imageData.b64_json}`;

    return {
      success: true,
      imageUrl,
      metadata: {
        revisedPrompt: imageData.revised_prompt,
        tokens: 0, // Images API doesn't return token usage
        cost: 0 // TODO: Calculate actual cost based on usage
      }
    };

  } catch (error: any) {
    console.error('Error generating image:', error);
    
    if (error.code === 'insufficient_quota') {
      return {
        success: false,
        error: 'OpenAI quota exceeded'
      };
    }
    
    if (error.code === 'content_policy_violation') {
      return {
        success: false,
        error: 'Content policy violation'
      };
    }
    
    return {
      success: false,
      error: error.message || 'Failed to generate image'
    };
  }
} 