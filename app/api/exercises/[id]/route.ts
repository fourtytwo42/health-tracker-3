import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/middleware/auth';
import { ExerciseService } from '@/lib/services/ExerciseService';

const exerciseService = ExerciseService.getInstance();

export const GET = requireRole('ADMIN')(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const exercise = await exerciseService.getExercise(params.id);
    if (!exercise) {
      return NextResponse.json(
        { success: false, error: 'Exercise not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      data: exercise,
    });
  } catch (error) {
    console.error('Error fetching exercise:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch exercise' },
      { status: 500 }
    );
  }
});

export const PUT = requireRole('ADMIN')(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const body = await req.json();
    const exercise = await exerciseService.updateExercise(params.id, body);
    return NextResponse.json({
      success: true,
      data: exercise,
    });
  } catch (error) {
    console.error('Error updating exercise:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update exercise' },
      { status: 500 }
    );
  }
});

export const DELETE = requireRole('ADMIN')(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    await exerciseService.deleteExercise(params.id);
    return NextResponse.json({
      success: true,
      message: 'Exercise deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting exercise:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete exercise' },
      { status: 500 }
    );
  }
}); 