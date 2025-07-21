import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'openai_api_key' },
    });

    if (!setting?.value) {
      return NextResponse.json({ hasKey: false });
    }

    // Return masked key
    const maskedKey = setting.value.substring(0, 7) + '...' + setting.value.substring(setting.value.length - 4);
    return NextResponse.json({ hasKey: true, maskedKey });
  } catch (error) {
    console.error('Error checking API key status:', error);
    return NextResponse.json({ hasKey: false });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey } = body;

    if (!apiKey?.trim()) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 });
    }

    // Validate API key format
    if (!apiKey.startsWith('sk-')) {
      return NextResponse.json({ error: 'Invalid API key format' }, { status: 400 });
    }

    // Store API key in database
    await prisma.setting.upsert({
      where: { key: 'openai_api_key' },
      update: { value: apiKey.trim() },
      create: { key: 'openai_api_key', value: apiKey.trim() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving API key:', error);
    return NextResponse.json({ error: 'Failed to save API key' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await prisma.setting.delete({
      where: { key: 'openai_api_key' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing API key:', error);
    return NextResponse.json({ error: 'Failed to remove API key' }, { status: 500 });
  }
} 