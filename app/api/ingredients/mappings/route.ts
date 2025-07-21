import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - List all ingredient mappings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword');
    const ingredientId = searchParams.get('ingredientId');
    const isActive = searchParams.get('isActive');

    const where: any = {};
    
    if (keyword) {
      where.keyword = { contains: keyword, mode: 'insensitive' };
    }
    
    if (ingredientId) {
      where.ingredientId = ingredientId;
    }
    
    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    const mappings = await prisma.ingredientMapping.findMany({
      where,
      include: {
        ingredient: {
          select: {
            id: true,
            name: true,
            category: true
          }
        }
      },
      orderBy: { keyword: 'asc' }
    });

    return NextResponse.json({ success: true, data: mappings });
  } catch (error) {
    console.error('Error fetching ingredient mappings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch ingredient mappings' },
      { status: 500 }
    );
  }
}

// POST - Create a new ingredient mapping
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyword, ingredientId } = body;

    if (!keyword || !ingredientId) {
      return NextResponse.json(
        { success: false, error: 'Keyword and ingredientId are required' },
        { status: 400 }
      );
    }

    // Check if mapping already exists
    const existingMapping = await prisma.ingredientMapping.findUnique({
      where: { keyword }
    });

    if (existingMapping) {
      return NextResponse.json(
        { success: false, error: 'Mapping with this keyword already exists' },
        { status: 409 }
      );
    }

    // Verify ingredient exists
    const ingredient = await prisma.ingredient.findUnique({
      where: { id: ingredientId }
    });

    if (!ingredient) {
      return NextResponse.json(
        { success: false, error: 'Ingredient not found' },
        { status: 404 }
      );
    }

    const mapping = await prisma.ingredientMapping.create({
      data: {
        keyword,
        ingredientId
      },
      include: {
        ingredient: {
          select: {
            id: true,
            name: true,
            category: true
          }
        }
      }
    });

    return NextResponse.json({ success: true, data: mapping });
  } catch (error) {
    console.error('Error creating ingredient mapping:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create ingredient mapping' },
      { status: 500 }
    );
  }
}

// PUT - Update an ingredient mapping
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, keyword, ingredientId, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Mapping ID is required' },
        { status: 400 }
      );
    }

    // Check if mapping exists
    const existingMapping = await prisma.ingredientMapping.findUnique({
      where: { id }
    });

    if (!existingMapping) {
      return NextResponse.json(
        { success: false, error: 'Mapping not found' },
        { status: 404 }
      );
    }

    // If keyword is being updated, check for conflicts
    if (keyword && keyword !== existingMapping.keyword) {
      const conflictingMapping = await prisma.ingredientMapping.findUnique({
        where: { keyword }
      });

      if (conflictingMapping) {
        return NextResponse.json(
          { success: false, error: 'Mapping with this keyword already exists' },
          { status: 409 }
        );
      }
    }

    // Verify ingredient exists if ingredientId is being updated
    if (ingredientId && ingredientId !== existingMapping.ingredientId) {
      const ingredient = await prisma.ingredient.findUnique({
        where: { id: ingredientId }
      });

      if (!ingredient) {
        return NextResponse.json(
          { success: false, error: 'Ingredient not found' },
          { status: 404 }
        );
      }
    }

    const updateData: any = {};
    if (keyword !== undefined) updateData.keyword = keyword;
    if (ingredientId !== undefined) updateData.ingredientId = ingredientId;
    if (isActive !== undefined) updateData.isActive = isActive;

    const mapping = await prisma.ingredientMapping.update({
      where: { id },
      data: updateData,
      include: {
        ingredient: {
          select: {
            id: true,
            name: true,
            category: true
          }
        }
      }
    });

    return NextResponse.json({ success: true, data: mapping });
  } catch (error) {
    console.error('Error updating ingredient mapping:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update ingredient mapping' },
      { status: 500 }
    );
  }
}

// DELETE - Delete an ingredient mapping
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Mapping ID is required' },
        { status: 400 }
      );
    }

    // Check if mapping exists
    const existingMapping = await prisma.ingredientMapping.findUnique({
      where: { id }
    });

    if (!existingMapping) {
      return NextResponse.json(
        { success: false, error: 'Mapping not found' },
        { status: 404 }
      );
    }

    await prisma.ingredientMapping.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Mapping deleted successfully' });
  } catch (error) {
    console.error('Error deleting ingredient mapping:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete ingredient mapping' },
      { status: 500 }
    );
  }
} 