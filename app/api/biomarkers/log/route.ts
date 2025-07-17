import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { BiomarkerService } from '../../../../lib/services/BiomarkerService';
import { withAuth, AuthenticatedRequest } from ../../../../lib/middleware/auth';

const biomarkerService = new BiomarkerService();

// Zod schema for biomarker logging validation
const biomarkerLogSchema = z.object({
  type: z.enum(['WEIGHT', 'BLOOD_PRESSURE', 'GLUCOSE', 'KETONES', 'CHOLESTEROL', 'OTHER']),
  value: z.number().min(0).max(1000),
  unit: z.string().min(1).max(20),
  photoUrl: z.string().url().optional(),
  notes: z.string().max(500).optional(),
});

async function handlePost(req: AuthenticatedRequest) {
  const body = await req.json();
  
  // Validate request body
  const validatedData = biomarkerLogSchema.parse(body);
  
  // Log biomarker using the service
  const biomarker = await biomarkerService.logBiomarker(
    req.user!.id,
    validatedData
  );

  return NextResponse.json(biomarker);
}

async function handleGet(req: AuthenticatedRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const daysBack = parseInt(searchParams.get('daysBack') || 300);

  // Get user's biomarker history
  const biomarkers = await biomarkerService.getBiomarkerHistory(
    req.user!.id,
    type,
    daysBack
  );

  return NextResponse.json(biomarkers);
}

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    return await handlePost(req);
  } catch (error) {
    console.error('Error logging biomarker:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to log biomarker' },
      { status: 500 }
    );
  }
});

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    return await handleGet(req);
  } catch (error) {
    console.error('Error fetching biomarker history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch biomarker history' },
      { status: 500 }
    );
  }
}); 