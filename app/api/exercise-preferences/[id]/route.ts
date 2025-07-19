import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuth } from '@/lib/middleware/auth';

const prisma = new PrismaClient();

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.preference) {
      return NextResponse.json(
        { error: 'Preference type is required' },
        { status: 400 }
      );
    }

    // Update preference
    const preference = await prisma.exercisePreference.update({
      where: { 
        id: params.id,
        userId: user.id // Ensure user owns this preference
      },
      data: {
        preference: body.preference,
        notes: body.notes,
        updatedAt: new Date()
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
      message: 'Exercise preference updated successfully',
      preference 
    });
  } catch (error) {
    console.error('Error updating exercise preference:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete preference
    await prisma.exercisePreference.delete({
      where: { 
        id: params.id,
        userId: user.id // Ensure user owns this preference
      }
    });

    return NextResponse.json({ 
      message: 'Exercise preference deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting exercise preference:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 