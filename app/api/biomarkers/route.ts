import { NextRequest, NextResponse } from 'next/server';
import { BiomarkerService } from '../../../lib/services/BiomarkerService';
import { withAuth, AuthenticatedRequest } from '../../../lib/middleware/auth';

const biomarkerService = new BiomarkerService();

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const daysBack = parseInt(searchParams.get('daysBack') || '30', 10);
    const trends = await biomarkerService.getBiomarkerTrends(req.user!.userId, type, daysBack);
    return NextResponse.json(trends);
  } catch (error) {
    console.error('Biomarkers GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch biomarker trends' },
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