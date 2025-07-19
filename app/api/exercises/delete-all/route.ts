import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/middleware/auth';
import { ExerciseService } from '@/lib/services/ExerciseService';

const exerciseService = ExerciseService.getInstance();

export const DELETE = requireRole('ADMIN')(async (req: NextRequest) => {
  try {
    const result = await exerciseService.deleteAllExercises();
    return NextResponse.json({
      success: true,
      message: 'All exercises deleted successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error deleting all exercises:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete all exercises' },
      { status: 500 }
    );
  }
}); 