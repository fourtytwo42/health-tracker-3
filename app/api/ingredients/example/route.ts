import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/middleware/auth';
import IngredientService from '@/lib/services/IngredientService';

const ingredientService = IngredientService.getInstance();

export const GET = requireRole('ADMIN')(async (req: NextRequest) => {
  try {
    const csvData = await ingredientService.getExampleCSV();

    return new NextResponse(csvData, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="ingredients_example.csv"',
      },
    });
  } catch (error) {
    console.error('Error generating example CSV:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate example CSV' },
      { status: 500 }
    );
  }
}); 