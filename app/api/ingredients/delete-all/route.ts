import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/middleware/auth';
import IngredientService from '@/lib/services/IngredientService';

const ingredientService = IngredientService.getInstance();

export const DELETE = requireRole('ADMIN')(async (req: NextRequest) => {
  try {
    const result = await ingredientService.deleteAllIngredients();

    return NextResponse.json({
      success: true,
      message: 'All ingredients deleted successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error deleting all ingredients:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete all ingredients' },
      { status: 500 }
    );
  }
}); 