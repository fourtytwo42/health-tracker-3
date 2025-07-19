import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/middleware/auth';
import IngredientService from '@/lib/services/IngredientService';

const ingredientService = IngredientService.getInstance();

export const GET = requireRole('ADMIN')(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const query = searchParams.get('query');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const search = searchParams.get('search') || undefined;
    const category = searchParams.get('category') || undefined;
    const aisle = searchParams.get('aisle') || undefined;

    // Parse nutrition range filters
    const calorieMin = searchParams.get('calorieMin') ? parseInt(searchParams.get('calorieMin')!) : undefined;
    const calorieMax = searchParams.get('calorieMax') ? parseInt(searchParams.get('calorieMax')!) : undefined;
    const proteinMin = searchParams.get('proteinMin') ? parseFloat(searchParams.get('proteinMin')!) : undefined;
    const proteinMax = searchParams.get('proteinMax') ? parseFloat(searchParams.get('proteinMax')!) : undefined;
    const carbMin = searchParams.get('carbMin') ? parseFloat(searchParams.get('carbMin')!) : undefined;
    const carbMax = searchParams.get('carbMax') ? parseFloat(searchParams.get('carbMax')!) : undefined;
    const fatMin = searchParams.get('fatMin') ? parseFloat(searchParams.get('fatMin')!) : undefined;
    const fatMax = searchParams.get('fatMax') ? parseFloat(searchParams.get('fatMax')!) : undefined;
    const fiberMin = searchParams.get('fiberMin') ? parseFloat(searchParams.get('fiberMin')!) : undefined;
    const fiberMax = searchParams.get('fiberMax') ? parseFloat(searchParams.get('fiberMax')!) : undefined;
    const sodiumMin = searchParams.get('sodiumMin') ? parseFloat(searchParams.get('sodiumMin')!) : undefined;
    const sodiumMax = searchParams.get('sodiumMax') ? parseFloat(searchParams.get('sodiumMax')!) : undefined;

    // Use paginated method for better performance
    const result = await ingredientService.getIngredientsPaginated(
      page,
      pageSize,
      includeInactive,
      search,
      category,
      aisle,
      {
        calories: { min: calorieMin, max: calorieMax },
        protein: { min: proteinMin, max: proteinMax },
        carbs: { min: carbMin, max: carbMax },
        fat: { min: fatMin, max: fatMax },
        fiber: { min: fiberMin, max: fiberMax },
        sodium: { min: sodiumMin, max: sodiumMax }
      }
    );

    return NextResponse.json({
      success: true,
      data: result.ingredients,
      pagination: result.pagination,
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