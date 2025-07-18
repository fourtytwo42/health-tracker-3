import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/middleware/auth';
import IngredientService from '@/lib/services/IngredientService';

const ingredientService = IngredientService.getInstance();

export const GET = requireRole('ADMIN')(async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const ingredient = await ingredientService.getIngredient(params.id);
    
    if (!ingredient) {
      return NextResponse.json(
        { success: false, error: 'Ingredient not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: ingredient,
    });
  } catch (error) {
    console.error('Error fetching ingredient:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch ingredient' },
      { status: 500 }
    );
  }
});

export const PUT = requireRole('ADMIN')(async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const body = await req.json();
    const ingredient = await ingredientService.updateIngredient(params.id, body);

    return NextResponse.json({
      success: true,
      data: ingredient,
    });
  } catch (error) {
    console.error('Error updating ingredient:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update ingredient' },
      { status: 500 }
    );
  }
});

export const DELETE = requireRole('ADMIN')(async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    await ingredientService.deleteIngredient(params.id);

    return NextResponse.json({
      success: true,
      message: 'Ingredient deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting ingredient:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete ingredient' },
      { status: 500 }
    );
  }
}); 