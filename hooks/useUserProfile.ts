import { useState, useEffect } from 'react';
import axios from 'axios';

interface UserProfile {
  id: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: string;
  height?: number;
  weight?: number;
  targetWeight?: number;
  activityLevel: string;
  dietaryPreferences?: string;
  calorieTarget?: number;
  proteinTarget?: number;
  carbTarget?: number;
  fatTarget?: number;
  fiberTarget?: number;
  privacySettings?: string;
  createdAt: string;
  updatedAt: string;
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
          setError('Not authenticated');
          setLoading(false);
          return;
        }

        const response = await axios.get('/api/profile', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (response.data.profile) {
          setProfile(response.data.profile);
        } else {
          setError('Profile not found');
        }
      } catch (err: any) {
        console.error('Error fetching user profile:', err);
        setError(err.response?.data?.error || 'Failed to fetch profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  return { profile, loading, error };
} 