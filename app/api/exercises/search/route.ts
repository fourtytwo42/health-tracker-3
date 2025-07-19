import { NextRequest, NextResponse } from 'next/server';
import { portablePrisma } from '@/lib/prisma';

// Helper function to get word variations (singular/plural)
function getWordVariations(word: string): string[] {
  const variations = [word.toLowerCase()];
  
  // Handle plurals
  if (word.endsWith('s')) {
    // Remove 's' to get singular
    variations.push(word.slice(0, -1).toLowerCase());
  } else {
    // Add 's' to get plural
    variations.push(word.toLowerCase() + 's');
  }
  
  // Handle common plural patterns
  if (word.endsWith('ies')) {
    // Change 'ies' to 'y' (e.g., activities -> activity)
    variations.push(word.slice(0, -3) + 'y');
  } else if (word.endsWith('y') && !word.endsWith('ay') && !word.endsWith('ey') && !word.endsWith('oy') && !word.endsWith('uy')) {
    // Change 'y' to 'ies' (e.g., activity -> activities)
    variations.push(word.slice(0, -1) + 'ies');
  }
  
  return Array.from(new Set(variations)); // Remove duplicates
}

// Helper function to check if exercise matches search terms
function matchesSearchTerms(exerciseName: string, searchTerms: string[]): boolean {
  const nameLower = exerciseName.toLowerCase();
  
  // For multiple words, check if ANY of the search terms are found
  // This makes the search more flexible and user-friendly
  return searchTerms.some(term => {
    const termVariations = getWordVariations(term);
    return termVariations.some(variation => nameLower.includes(variation));
  });
}

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

    // Split query into individual words and filter out empty strings
    const searchTerms = query.trim().split(/\s+/).filter(term => term.length > 0);
    
    if (searchTerms.length === 0) {
      return NextResponse.json({ exercises: [] });
    }

    // Build where clause for SQLite (no mode: insensitive support)
    const whereClause: any = {
      isActive: true
    };

    // Use the first search term for the database query to get initial results
    // We'll do more sophisticated filtering in JavaScript
    if (searchTerms.length > 0) {
      whereClause.activity = {
        contains: searchTerms[0]
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
      take: limit * 3, // Get more results to filter from since we're doing more sophisticated filtering
      orderBy: {
        activity: 'asc'
      }
    });

    // Apply sophisticated filtering for multiple words and word variations
    const filteredExercises = exercises
      .filter((exercise: any) => matchesSearchTerms(exercise.activity, searchTerms))
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