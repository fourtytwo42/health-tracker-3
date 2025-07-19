import { NextRequest, NextResponse } from 'next/server';
import { portablePrisma } from '@/lib/prisma';
import { searchExercises } from '@/lib/searchService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const intensity = searchParams.get('intensity');
    const loadCategories = searchParams.get('loadCategories') === 'true';
    const loadIntensities = searchParams.get('loadIntensities') === 'true';

    // If loading categories or intensities, return all exercises
    if (loadCategories || loadIntensities) {
      const exercises = await portablePrisma.exercise.findMany({
        where: { isActive: true },
        select: {
          id: true,
          activity: true,
          code: true,
          met: true,
          description: true,
          category: true,
          intensity: true
        },
        take: 1000,
        orderBy: { activity: 'asc' }
      });

      return NextResponse.json({ exercises });
    }

    // For regular search, require at least 2 characters
    if (query.length < 2) {
      return NextResponse.json({ exercises: [] });
    }

    // Build where clause for basic filtering
    const whereClause: any = {
      isActive: true
    };

    // Apply basic filters from URL parameters
    if (category) {
      whereClause.category = category;
    }

    if (intensity) {
      whereClause.intensity = intensity;
    }

    // Get exercises from database
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
      take: 1000, // Get a good sample for Fuse.js to search through
      orderBy: {
        activity: 'asc'
      }
    });

    // Use Fuse.js for advanced search
    const searchResults = searchExercises(exercises, query, limit);

    return NextResponse.json({ exercises: searchResults });
  } catch (error) {
    console.error('Error searching exercises:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 