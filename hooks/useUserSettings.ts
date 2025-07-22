import { useState, useEffect } from 'react';

export interface UserSettings {
  notifications: {
    email: boolean;
    push: boolean;
    mealReminders: boolean;
    goalReminders: boolean;
  };
  privacy: {
    profileVisible: boolean;
    leaderboardVisible: boolean;
    dataSharing: boolean;
  };
  appearance: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
  };
  recipe: {
    detailedIngredientInfo: boolean;
  };
  units: {
    useMetricUnits: boolean;
  };
}

const defaultSettings: UserSettings = {
  notifications: {
    email: true,
    push: true,
    mealReminders: true,
    goalReminders: true,
  },
  privacy: {
    profileVisible: true,
    leaderboardVisible: true,
    dataSharing: false,
  },
  appearance: {
    theme: 'auto',
    language: 'en',
  },
  recipe: {
    detailedIngredientInfo: true,
  },
  units: {
    useMetricUnits: false,
  },
};

export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load settings from localStorage first, then from API
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      // First try to load from localStorage for immediate access
      const localSettings = localStorage.getItem('userSettings');
      if (localSettings) {
        try {
          const parsed = JSON.parse(localSettings);
          setSettings({ ...defaultSettings, ...parsed });
        } catch (e) {
          console.warn('Failed to parse localStorage settings:', e);
        }
      }

      // Then load from API to get the latest settings
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/settings/user', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const newSettings = { ...defaultSettings, ...data.settings };
        setSettings(newSettings);
        
        // Update localStorage with the latest settings
        localStorage.setItem('userSettings', JSON.stringify(newSettings));
      } else {
        console.warn('Failed to load settings from API, using localStorage only');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: UserSettings) => {
    try {
      setError(null);

      // Update local state immediately
      setSettings(newSettings);
      
      // Save to localStorage for immediate access
      localStorage.setItem('userSettings', JSON.stringify(newSettings));

      // Save to API
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.warn('No access token, settings saved to localStorage only');
        return;
      }

      const response = await fetch('/api/settings/user', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newSettings),
      });

      if (!response.ok) {
        console.warn('Failed to save settings to API, but saved to localStorage');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setError('Failed to save settings');
    }
  };

  const updateSetting = async <K extends keyof UserSettings>(
    section: K,
    key: keyof UserSettings[K],
    value: UserSettings[K][keyof UserSettings[K]]
  ) => {
    const newSettings = {
      ...settings,
      [section]: {
        ...settings[section],
        [key]: value,
      },
    };
    await saveSettings(newSettings);
  };

  return {
    settings,
    loading,
    error,
    saveSettings,
    updateSetting,
    reloadSettings: loadSettings,
  };
} 