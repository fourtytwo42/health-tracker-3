import { NextRequest, NextResponse } from 'next/server';
import { BiomarkerService } from '../../../lib/services/BiomarkerService';
import { withAuth, AuthenticatedRequest } from '../../../lib/middleware/auth';

const biomarkerService = new BiomarkerService();

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const daysBack = parseInt(searchParams.get('daysBack') || '30', 10);
    
    // Get biomarker history instead of trends
    const biomarkers = await biomarkerService.getBiomarkerHistory(req.user!.userId, type || undefined, daysBack);
    return NextResponse.json({ biomarkers });
  } catch (error) {
    console.error('Biomarkers GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch biomarkers' },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const result = await biomarkerService.logBiomarker(req.user!.userId, body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Biomarkers POST error:', error);
    return NextResponse.json(
      { error: 'Failed to log biomarker' },
      { status: 500 }
    );
  }
}); 