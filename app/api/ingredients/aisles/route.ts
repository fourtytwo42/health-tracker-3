import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/middleware/auth';
import IngredientService from '@/lib/services/IngredientService';

const ingredientService = IngredientService.getInstance();

export const GET = requireRole('ADMIN')(async (req: NextRequest) => {
  try {
    const aisles = await ingredientService.getAisles();
    return NextResponse.json(aisles);
  } catch (error) {
    console.error('Error fetching ingredient aisles:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch ingredient aisles' },
      { status: 500 }
    );
  }
}); 