import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/middleware/auth';
import IngredientService from '@/lib/services/IngredientService';

const ingredientService = IngredientService.getInstance();

export const GET = requireRole('ADMIN')(async (req: NextRequest) => {
  try {
    const categories = await ingredientService.getCategories();
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching ingredient categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch ingredient categories' },
      { status: 500 }
    );
  }
}); 