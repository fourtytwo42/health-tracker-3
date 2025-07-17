import { NextResponse } from 'next/server';
import { featureFlagService } from '@/lib/featureFlagService';
import { requireRole } from '@/lib/middleware/auth';
import { z } from 'zod';

// Validation schemas
const createSettingSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.string(),
  description: z.string().optional()
});

const updateSettingSchema = z.object({
  value: z.string(),
  description: z.string().optional()
});

export const GET = requireRole('ADMIN')(async (req) => {
  try {
    const settings = await featureFlagService.getAllSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const POST = requireRole('ADMIN')(async (req) => {
  try {
    const body = await req.json();
    const validatedData = createSettingSchema.parse(body);

    const setting = await featureFlagService.setSetting(
      validatedData.key,
      validatedData.value,
      validatedData.description
    );
    
    return NextResponse.json({ setting }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating setting:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}); 