import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '../../../lib/services/UserService';
import { withAuth, AuthenticatedRequest } from '../../../lib/middleware/auth';

const userService = new UserService();

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const profile = await userService.getUserProfile(req.user!.userId);
    return NextResponse.json(profile);
  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
});

export const PUT = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const updatedProfile = await userService.updateUserProfile(req.user!.userId, body);
    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error('Profile PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}); 