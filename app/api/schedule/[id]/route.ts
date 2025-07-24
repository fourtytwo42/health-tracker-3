import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/middleware/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Check if the scheduled item belongs to the user
    const scheduledItem = await prisma.scheduledItem.findFirst({
      where: {
        id,
        userId: user.userId
      }
    });

    if (!scheduledItem) {
      return NextResponse.json(
        { error: 'Scheduled item not found' },
        { status: 404 }
      );
    }

    // Delete the scheduled item
    await prisma.scheduledItem.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting scheduled item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 