import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/middleware/auth';
import { RecipeService } from '@/lib/services/RecipeService';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || undefined;
    const mealType = searchParams.get('mealType') || undefined;
    const isFavorite = searchParams.get('isFavorite') === 'true' ? true : 
                      searchParams.get('isFavorite') === 'false' ? false : undefined;
    const aiGenerated = searchParams.get('aiGenerated') === 'true' ? true : 
                       searchParams.get('aiGenerated') === 'false' ? false : undefined;

    const recipeService = new RecipeService();
    const result = await recipeService.getUserRecipes(
      user.userId,
      page,
      limit,
      search,
      mealType,
      isFavorite,
      aiGenerated
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const recipeService = new RecipeService();
    const recipe = await recipeService.createRecipe({
      ...body,
      userId: user.userId
    });

    return NextResponse.json({ recipe });
  } catch (error) {
    console.error('Error creating recipe:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 