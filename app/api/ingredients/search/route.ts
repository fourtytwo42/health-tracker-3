import { NextRequest, NextResponse } from 'next/server';
import { portablePrisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const aisle = searchParams.get('aisle');

    if (!query || query.length < 2) {
      return NextResponse.json({ ingredients: [] });
    }

    // Build where clause for SQLite (no mode: insensitive support)
    const whereClause: any = {
      isActive: true
    };

    // Add search condition
    if (query) {
      whereClause.name = {
        contains: query
      };
    }

    if (category) {
      whereClause.category = category;
    }

    if (aisle) {
      whereClause.aisle = aisle;
    }

    const ingredients = await portablePrisma.ingredient.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        category: true,
        aisle: true,
        calories: true,
        protein: true,
        carbs: true,
        fat: true,
        fiber: true,
        sugar: true
      },
      take: limit * 2, // Get more results to filter from
      orderBy: {
        name: 'asc'
      }
    });

    // Filter results to ensure case-insensitive matching
    const filteredIngredients = ingredients
      .filter(ingredient =>
        ingredient.name.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, limit); // Limit the final results

    return NextResponse.json({ ingredients: filteredIngredients });
  } catch (error) {
    console.error('Error searching ingredients:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 