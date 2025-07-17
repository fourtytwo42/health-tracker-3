import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

interface FeatureFlagResponse {
  enabled: boolean;
}

export function useFeatureFlag(flagKey: string) {
  const [enabled, setEnabled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const checkFeatureFlag = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/feature-flags/${flagKey}/check`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          },
          body: JSON.stringify({ userId: user?.id })
        });

        if (!response.ok) {
          throw new Error('Failed to check feature flag');
        }

        const data: FeatureFlagResponse = await response.json();
        setEnabled(data.enabled);
      } catch (err) {
        console.error('Error checking feature flag:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setEnabled(false); // Fail safe - disable feature on error
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      checkFeatureFlag();
    } else {
      setLoading(false);
      setEnabled(false);
    }
  }, [flagKey, user?.id]);

  return { enabled, loading, error };
} 