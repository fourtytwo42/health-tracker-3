import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/middleware/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    const where: any = { userId: user.userId };
    if (date) {
      where.scheduledDate = date;
    }

    const items = await prisma.scheduledItem.findMany({
      where,
      orderBy: [
        { scheduledDate: 'asc' },
        { scheduledTime: 'asc' }
      ]
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching scheduled items:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, type, scheduledDate, scheduledTime, itemId, notes, duration, mealType, servings, nutrition } = body;

    if (!title || !type || !scheduledDate || !scheduledTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const scheduledItem = await prisma.scheduledItem.create({
      data: {
        title,
        type,
        scheduledDate,
        scheduledTime,
        duration: duration ? parseInt(duration) : null,
        itemId,
        notes,
        mealType,
        servings: servings ? parseInt(servings) : null,
        nutrition: nutrition ? JSON.stringify(nutrition) : null,
        userId: user.userId,
        isCompleted: false
      }
    });

    return NextResponse.json({ item: scheduledItem });
  } catch (error) {
    console.error('Error creating scheduled item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 