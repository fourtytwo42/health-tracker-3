import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/middleware/auth';
import IngredientService from '@/lib/services/IngredientService';

const ingredientService = IngredientService.getInstance();

export const GET = requireRole('ADMIN')(async (req: NextRequest) => {
  try {
    const csvData = await ingredientService.exportToCSV();

    return new NextResponse(csvData, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="ingredients.csv"',
      },
    });
  } catch (error) {
    console.error('Error exporting ingredients:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export ingredients' },
      { status: 500 }
    );
  }
}); 