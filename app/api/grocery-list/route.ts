import { NextRequest, NextResponse } from 'next/server';
import { GroceryService } from '../../../lib/services/GroceryService';
import { withAuth, AuthenticatedRequest } from '../../../lib/middleware/auth';

const groceryService = new GroceryService();

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const { planIds, includeSnacks, format } = body;
    
    const groceryList = await groceryService.generateGroceryList(
      req.user!.userId,
      planIds || [],
      { includeSnacks, format }
    );
    
    return NextResponse.json(groceryList);
  } catch (error) {
    console.error('Grocery list generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate grocery list' },
      { status: 500 }
    );
  }
});

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    
    const groceryLists = await groceryService.getGroceryListHistory(req.user!.userId, limit);
    return NextResponse.json(groceryLists);
  } catch (error) {
    console.error('Grocery lists GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch grocery lists' },
      { status: 500 }
    );
  }
}); 