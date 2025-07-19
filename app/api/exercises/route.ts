import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/middleware/auth';
import { ExerciseService } from '@/lib/services/ExerciseService';

const exerciseService = ExerciseService.getInstance();

export const GET = requireRole('ADMIN')(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const search = searchParams.get('search') || undefined;
    const category = searchParams.get('category') || undefined;
    const intensity = searchParams.get('intensity') || undefined;

    // Parse MET range filters
    const metMin = searchParams.get('metMin') ? parseFloat(searchParams.get('metMin')!) : undefined;
    const metMax = searchParams.get('metMax') ? parseFloat(searchParams.get('metMax')!) : undefined;

    // Use paginated method for better performance
    const result = await exerciseService.getExercisesPaginated(
      page,
      pageSize,
      includeInactive,
      search,
      category,
      intensity,
      {
        min: metMin,
        max: metMax
      }
    );

    return NextResponse.json({
      success: true,
      data: result.exercises,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Error fetching exercises:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch exercises' },
      { status: 500 }
    );
  }
});

export const POST = requireRole('ADMIN')(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const exercise = await exerciseService.createExercise(body);

    return NextResponse.json({
      success: true,
      data: exercise,
    });
  } catch (error) {
    console.error('Error creating exercise:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create exercise' },
      { status: 500 }
    );
  }
}); 