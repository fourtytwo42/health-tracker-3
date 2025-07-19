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

    const preferences = await prisma.exercisePreference.findMany({
      where: { userId: user.id },
      include: {
        exercise: {
          select: {
            id: true,
            activity: true,
            code: true,
            met: true,
            description: true,
            category: true,
            intensity: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('Error fetching exercise preferences:', error);
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
    if (!body.exerciseId || !body.preference) {
      return NextResponse.json(
        { error: 'Exercise ID and preference type are required' },
        { status: 400 }
      );
    }

    // Check if preference already exists
    const existingPreference = await prisma.exercisePreference.findUnique({
      where: {
        userId_exerciseId: {
          userId: user.id,
          exerciseId: body.exerciseId
        }
      }
    });

    if (existingPreference) {
      return NextResponse.json(
        { error: 'Preference already exists for this exercise' },
        { status: 409 }
      );
    }

    // Create new preference
    const preference = await prisma.exercisePreference.create({
      data: {
        userId: user.id,
        exerciseId: body.exerciseId,
        preference: body.preference,
        notes: body.notes
      },
      include: {
        exercise: {
          select: {
            id: true,
            activity: true,
            code: true,
            met: true,
            description: true,
            category: true,
            intensity: true
          }
        }
      }
    });

    return NextResponse.json({ 
      message: 'Exercise preference created successfully',
      preference 
    });
  } catch (error) {
    console.error('Error creating exercise preference:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 