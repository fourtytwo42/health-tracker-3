import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuth } from '@/lib/middleware/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const preferences = await prisma.foodPreference.findMany({
      where: { userId: user.userId },
      include: {
        ingredient: {
          select: {
            id: true,
            name: true,
            category: true,
            aisle: true,
            calories: true,
            protein: true,
            carbs: true,
            fat: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('Error fetching food preferences:', error);
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
    
    // Validate required fields
    if (!body.ingredientId || !body.preference) {
      return NextResponse.json(
        { error: 'Ingredient ID and preference type are required' },
        { status: 400 }
      );
    }

    // Check if preference already exists
    const existingPreference = await prisma.foodPreference.findUnique({
      where: {
        userId_ingredientId: {
          userId: user.userId,
          ingredientId: body.ingredientId
        }
      }
    });

    if (existingPreference) {
      return NextResponse.json(
        { error: 'Preference already exists for this ingredient' },
        { status: 409 }
      );
    }

    // Create new preference
    const preference = await prisma.foodPreference.create({
      data: {
        userId: user.userId,
        ingredientId: body.ingredientId,
        preference: body.preference,
        notes: body.notes
      },
      include: {
        ingredient: {
          select: {
            id: true,
            name: true,
            category: true,
            aisle: true,
            calories: true,
            protein: true,
            carbs: true,
            fat: true
          }
        }
      }
    });

    return NextResponse.json({ 
      message: 'Food preference created successfully',
      preference 
    });
  } catch (error) {
    console.error('Error creating food preference:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 