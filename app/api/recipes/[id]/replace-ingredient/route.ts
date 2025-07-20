import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/middleware/auth';
import { RecipeService } from '@/lib/services/RecipeService';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ingredientId, newIngredientId, adjustAmount } = await request.json();

    if (!ingredientId || !newIngredientId) {
      return NextResponse.json(
        { error: 'Missing ingredientId or newIngredientId' },
        { status: 400 }
      );
    }

    const recipeService = new RecipeService();
    
    // Check if recipe exists and user owns it
    const existingRecipe = await recipeService.getRecipeById(params.id);
    if (!existingRecipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }
    
    if (existingRecipe.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const recipe = await recipeService.replaceIngredient(
      params.id,
      ingredientId,
      newIngredientId,
      adjustAmount !== false
    );

    return NextResponse.json({ recipe });
  } catch (error) {
    console.error('Error replacing ingredient:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 