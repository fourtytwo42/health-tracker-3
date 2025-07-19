import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/middleware/auth';
import { ExerciseService } from '@/lib/services/ExerciseService';

const exerciseService = ExerciseService.getInstance();

export const GET = requireRole('ADMIN')(async (req: NextRequest) => {
  try {
    const categories = await exerciseService.getCategories();
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching exercise categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch exercise categories' },
      { status: 500 }
    );
  }
}); 