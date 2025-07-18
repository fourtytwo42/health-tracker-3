import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/middleware/auth';
import IngredientService from '@/lib/services/IngredientService';

const ingredientService = IngredientService.getInstance();

export const POST = requireRole('ADMIN')(async (req: NextRequest) => {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    const csvData = await file.text();
    const results = await ingredientService.importFromCSV(csvData);

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Error importing ingredients:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to import ingredients' },
      { status: 500 }
    );
  }
}); 