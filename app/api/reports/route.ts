import { NextRequest, NextResponse } from 'next/server';
import { ReportService } from '../../../lib/services/ReportService';
import { withAuth, AuthenticatedRequest } from '../../../lib/middleware/auth';

const reportService = new ReportService();

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'health';
    const format = searchParams.get('format') || 'json';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    const params = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      format,
    };

    const report = await reportService.generateHealthReport(req.user!.userId, params);
    return NextResponse.json(report);
  } catch (error) {
    console.error('Reports GET error:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const { type, format, ...params } = body;
    
    const report = await reportService.generateHealthReport(req.user!.userId, {
      ...params,
      format: format || 'json',
    });
    
    return NextResponse.json(report);
  } catch (error) {
    console.error('Reports POST error:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}); 