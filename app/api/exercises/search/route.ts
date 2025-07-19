import { NextRequest, NextResponse } from 'next/server';
import { portablePrisma } from '@/lib/prisma';

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

    // Build where clause for SQLite (no mode: insensitive support)
    const whereClause: any = {
      isActive: true
    };

    // Add search condition
    if (query) {
      whereClause.activity = {
        contains: query
      };
    }

    if (category) {
      whereClause.category = category;
    }

    if (intensity) {
      whereClause.intensity = intensity;
    }

    const exercises = await portablePrisma.exercise.findMany({
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
      take: limit * 2, // Get more results to filter from
      orderBy: {
        activity: 'asc'
      }
    });

    // Filter results to ensure case-insensitive matching
    const filteredExercises = exercises
      .filter((exercise: any) =>
        exercise.activity.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, limit); // Limit the final results

    return NextResponse.json({ exercises: filteredExercises });
  } catch (error) {
    console.error('Error searching exercises:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 