import { NextResponse } from 'next/server';
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