import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/middleware/auth';
import { ExerciseService } from '@/lib/services/ExerciseService';

const exerciseService = ExerciseService.getInstance();

export const GET = requireRole('ADMIN')(async (req: NextRequest) => {
  try {
    const intensities = await exerciseService.getIntensities();
    return NextResponse.json(intensities);
  } catch (error) {
    console.error('Error fetching exercise intensities:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch exercise intensities' },
      { status: 500 }
    );
  }
}); 