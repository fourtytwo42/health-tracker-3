import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

    const whereClause: any = {
      name: {
        contains: query,
        mode: 'insensitive'
      },
      isActive: true
    };

    if (category) {
      whereClause.category = category;
    }

    if (aisle) {
      whereClause.aisle = aisle;
    }

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
      take: limit,
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({ ingredients });
  } catch (error) {
    console.error('Error searching ingredients:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 