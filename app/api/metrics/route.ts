import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Simple metrics collection (in production, use prom-client)
let requestCount = 0;
let errorCount = 0;
const startTime = Date.now();

export function incrementRequestCount() {
  requestCount++;
}

export function incrementErrorCount() {
  errorCount++;
}

export async function GET() {
  try {
    // Get database metrics
    const userCount = await prisma.user.count();
    const mealCount = await prisma.meal.count();
    const biomarkerCount = await prisma.biomarker.count();
    
    const uptime = Date.now() - startTime;
    
    // Format as Prometheus metrics
    const metrics = [
      '# HELP health_tracker_requests_total Total number of requests',
      '# TYPE health_tracker_requests_total counter',
      `health_tracker_requests_total ${requestCount}`,
      '',
      '# HELP health_tracker_errors_total Total number of errors',
      '# TYPE health_tracker_errors_total counter',
      `health_tracker_errors_total ${errorCount}`,
      '',
      '# HELP health_tracker_uptime_seconds Application uptime in seconds',
      '# TYPE health_tracker_uptime_seconds gauge',
      `health_tracker_uptime_seconds ${uptime / 1000}`,
      '',
      '# HELP health_tracker_users_total Total number of users',
      '# TYPE health_tracker_users_total gauge',
      `health_tracker_users_total ${userCount}`,
      '',
      '# HELP health_tracker_meals_total Total number of meals',
      '# TYPE health_tracker_meals_total gauge',
      `health_tracker_meals_total ${mealCount}`,
      '',
      '# HELP health_tracker_biomarkers_total Total number of biomarkers',
      '# TYPE health_tracker_biomarkers_total gauge',
      `health_tracker_biomarkers_total ${biomarkerCount}`,
      '',
      '# HELP health_tracker_memory_bytes Memory usage in bytes',
      '# TYPE health_tracker_memory_bytes gauge',
      `health_tracker_memory_bytes{type="heapUsed"} ${process.memoryUsage().heapUsed}`,
      `health_tracker_memory_bytes{type="heapTotal"} ${process.memoryUsage().heapTotal}`,
      `health_tracker_memory_bytes{type="external"} ${process.memoryUsage().external}`,
      `health_tracker_memory_bytes{type="rss"} ${process.memoryUsage().rss}`,
    ].join('\n');

    return new NextResponse(metrics, {
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Metrics collection failed:', error);
    return NextResponse.json(
      { error: 'Failed to collect metrics' },
      { status: 500 }
    );
  }
} 