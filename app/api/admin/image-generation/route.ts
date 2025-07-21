import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';

interface ImageGenerationRequest {
  prompt: string;
  textModel: string;
  quality: 'low' | 'medium' | 'high' | 'auto';
  size: '1024x1024' | '1536x1024' | '1024x1536' | 'auto';
  background: 'opaque' | 'transparent';
  format: 'png' | 'jpeg' | 'webp';
  outputCompression?: number;
}

// Cost per token for different qualities (approximate)
const COST_PER_TOKEN = {
  low: 0.0000404, // $0.011 / 272 tokens for 1024x1024
  medium: 0.0000398, // $0.042 / 1056 tokens for 1024x1024
  high: 0.0000401, // $0.167 / 4160 tokens for 1024x1024
};

// Token counts for different sizes and qualities
const TOKEN_COUNTS = {
  low: {
    '1024x1024': 272,
    '1024x1536': 408,
    '1536x1024': 400,
  },
  medium: {
    '1024x1024': 1056,
    '1024x1536': 1584,
    '1536x1024': 1568,
  },
  high: {
    '1024x1024': 4160,
    '1024x1536': 6240,
    '1536x1024': 6208,
  },
};

export async function POST(request: NextRequest) {
  try {
    const body: ImageGenerationRequest = await request.json();
    const { prompt, textModel, quality, size, background, format, outputCompression } = body;

    // Validate required fields
    if (!prompt?.trim()) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Get API key from database
    const setting = await prisma.setting.findUnique({
      where: { key: 'openai_api_key' },
    });

    if (!setting?.value) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 400 });
    }

    const openai = new OpenAI({
      apiKey: setting.value,
    });

    // Build the image generation tool configuration
    const imageGenerationTool: any = {
      type: 'image_generation',
    };

    // Add quality if not auto
    if (quality !== 'auto') {
      imageGenerationTool.quality = quality;
    }

    // Add size if not auto
    if (size !== 'auto') {
      imageGenerationTool.size = size;
    }

    // Add background if transparent
    if (background === 'transparent') {
      imageGenerationTool.background = 'transparent';
    }

    // Add format and compression
    if (format !== 'png') {
      imageGenerationTool.format = format;
      if (outputCompression && (format === 'jpeg' || format === 'webp')) {
        imageGenerationTool.output_compression = outputCompression;
      }
    }

    console.log('Generating image with config:', {
      model: textModel,
      prompt,
      tool: imageGenerationTool,
    });

    // Generate image using OpenAI Responses API
    const response = await openai.responses.create({
      model: textModel,
      input: prompt,
      tools: [imageGenerationTool],
    });

    // Extract image data from response
    const imageGenerationCalls = response.output.filter(
      (output: any) => output.type === 'image_generation_call'
    );

    if (imageGenerationCalls.length === 0) {
      return NextResponse.json({ error: 'No image generated' }, { status: 500 });
    }

    const imageCall = imageGenerationCalls[0] as any;
    
    if (imageCall.status !== 'completed') {
      return NextResponse.json({ error: 'Image generation failed' }, { status: 500 });
    }

    // Convert base64 to data URL
    const imageDataUrl = `data:image/${format};base64,${imageCall.result}`;

    // Calculate cost
    const actualQuality = quality === 'auto' ? 'medium' : quality;
    const actualSize = size === 'auto' ? '1024x1024' : size;
    const tokens = TOKEN_COUNTS[actualQuality][actualSize as keyof typeof TOKEN_COUNTS[typeof actualQuality]];
    const cost = tokens * COST_PER_TOKEN[actualQuality];

    return NextResponse.json({
      image: imageDataUrl,
      revisedPrompt: imageCall.revised_prompt,
      tokens,
      cost,
      format,
    });

  } catch (error) {
    console.error('Image generation error:', error);
    
    if (error instanceof Error) {
      // Handle OpenAI API errors
      if (error.message.includes('insufficient_quota')) {
        return NextResponse.json({ error: 'OpenAI API quota exceeded' }, { status: 429 });
      }
      if (error.message.includes('content_policy')) {
        return NextResponse.json({ error: 'Content policy violation' }, { status: 400 });
      }
      if (error.message.includes('invalid_api_key')) {
        return NextResponse.json({ error: 'Invalid OpenAI API key' }, { status: 401 });
      }
    }

    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    );
  }
} 