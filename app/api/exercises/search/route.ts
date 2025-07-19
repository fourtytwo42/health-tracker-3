import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const intensity = searchParams.get('intensity');

    if (!query || query.length < 2) {
      return NextResponse.json({ exercises: [] });
    }

    const whereClause: any = {
      activity: {
        contains: query,
        mode: 'insensitive'
      },
      isActive: true
    };

    if (category) {
      whereClause.category = category;
    }

    if (intensity) {
      whereClause.intensity = intensity;
    }

    const exercises = await prisma.exercise.findMany({
      where: whereClause,
      select: {
        id: true,
        activity: true,
        code: true,
        met: true,
        description: true,
        category: true,
        intensity: true
      },
      take: limit,
      orderBy: {
        activity: 'asc'
      }
    });

    return NextResponse.json({ exercises });
  } catch (error) {
    console.error('Error searching exercises:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 