import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { GroceryService } from '../../../../lib/services/GroceryService';
import { withAuth, AuthenticatedRequest } from ../../../../lib/middleware/auth';

const groceryService = new GroceryService();

// Zod schema for grocery list generation validation
const groceryListSchema = z.object({
  planIds: z.array(z.string()).min(1),
  includeEssentials: z.boolean().default(true),
  excludeAllergens: z.array(z.string()).optional(),
});

async function handlePost(req: AuthenticatedRequest) {
  const body = await req.json();
  
  // Validate request body
  const validatedData = groceryListSchema.parse(body);
  
  // Generate grocery list using the service
  const groceryList = await groceryService.generateGroceryList(
    req.user!.id,
    validatedData.planIds,
    validatedData.includeEssentials,
    validatedData.excludeAllergens
  );

  return NextResponse.json(groceryList);
}

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    return await handlePost(req);
  } catch (error) {
    console.error('Error generating grocery list:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to generate grocery list' },
      { status: 500 }
    );
  }
}); 