import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { searchIngredientsFlexible } from '@/lib/searchService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const aisle = searchParams.get('aisle');
    const loadCategories = searchParams.get('loadCategories') === 'true';
    const loadAisles = searchParams.get('loadAisles') === 'true';

    // If loading categories or aisles, return all ingredients
    if (loadCategories || loadAisles) {
      const ingredients = await prisma.ingredient.findMany({
        where: { isActive: true },
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
        take: 1000,
        orderBy: { name: 'asc' }
      });

      return NextResponse.json({ ingredients });
    }

    // For regular search, require at least 2 characters
    if (query.length < 2) {
      return NextResponse.json({ ingredients: [] });
    }

    // Build where clause for basic filtering
    const whereClause: any = {
      isActive: true
    };

    // Apply basic filters from URL parameters
    if (category) {
      whereClause.category = category;
    }

    if (aisle) {
      whereClause.aisle = aisle;
    }

    // Get ingredients from database
    const ingredients = await prisma.ingredient.findMany({
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
      take: 1000, // Get a good sample for Fuse.js to search through
      orderBy: {
        name: 'asc'
      }
    });

    // Use improved search with word order flexibility
    const searchResults = searchIngredientsFlexible(ingredients, query, limit);

    return NextResponse.json({ ingredients: searchResults });
  } catch (error) {
    console.error('Error searching ingredients:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 