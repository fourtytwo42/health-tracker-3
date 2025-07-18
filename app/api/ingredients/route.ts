import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/middleware/auth';
import IngredientService from '@/lib/services/IngredientService';

const ingredientService = IngredientService.getInstance();

export const GET = requireRole('ADMIN')(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const query = searchParams.get('query');
    const limit = parseInt(searchParams.get('limit') || '100');

    let ingredients;
    if (query) {
      ingredients = await ingredientService.searchIngredients(query, limit);
    } else {
      ingredients = await ingredientService.getAllIngredients(includeInactive);
    }

    return NextResponse.json({
      success: true,
      data: ingredients,
    });
  } catch (error) {
    console.error('Error fetching ingredients:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch ingredients' },
      { status: 500 }
    );
  }
});

export const POST = requireRole('ADMIN')(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const ingredient = await ingredientService.createIngredient(body);

    return NextResponse.json({
      success: true,
      data: ingredient,
    });
  } catch (error) {
    console.error('Error creating ingredient:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create ingredient' },
      { status: 500 }
    );
  }
}); 