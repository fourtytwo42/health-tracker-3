'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Box,
  Alert,
  CircularProgress,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import { Save, Notifications, Security, Language, Palette, Restaurant } from '@mui/icons-material';

interface Settings {
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
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
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
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch('/api/settings/user', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        // Merge with default settings to ensure all properties exist
        setSettings({
          notifications: {
            email: true,
            push: true,
            mealReminders: true,
            goalReminders: true,
            ...data.settings?.notifications
          },
          privacy: {
            profileVisible: true,
            leaderboardVisible: true,
            dataSharing: false,
            ...data.settings?.privacy
          },
          appearance: {
            theme: 'auto',
            language: 'en',
            ...data.settings?.appearance
          },
          recipe: {
            detailedIngredientInfo: true,
            ...data.settings?.recipe
          }
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch('/api/settings/user', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setSuccess('Settings saved successfully');
        // Also save to localStorage for immediate access
        localStorage.setItem('userSettings', JSON.stringify(settings));
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationChange = (key: keyof Settings['notifications']) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key],
      },
    }));
  };

  const handlePrivacyChange = (key: keyof Settings['privacy']) => {
    setSettings(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [key]: !prev.privacy[key],
      },
    }));
  };

  const handleRecipeChange = (key: keyof Settings['recipe']) => {
    setSettings(prev => ({
      ...prev,
      recipe: {
        ...prev.recipe,
        [key]: !prev.recipe[key],
      },
    }));
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Card>
        <CardContent>
          {/* Notifications Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Notifications sx={{ mr: 1 }} />
              Notifications
            </Typography>
            <List>
              <ListItem>
                <ListItemText
                  primary="Email Notifications"
                  secondary="Receive notifications via email"
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={settings.notifications.email}
                    onChange={() => handleNotificationChange('email')}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Push Notifications"
                  secondary="Receive push notifications in browser"
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={settings.notifications.push}
                    onChange={() => handleNotificationChange('push')}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Meal Reminders"
                  secondary="Get reminded to log your meals"
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={settings.notifications.mealReminders}
                    onChange={() => handleNotificationChange('mealReminders')}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Goal Reminders"
                  secondary="Get reminded about your health goals"
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={settings.notifications.goalReminders}
                    onChange={() => handleNotificationChange('goalReminders')}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Privacy Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Security sx={{ mr: 1 }} />
              Privacy & Security
            </Typography>
            <List>
              <ListItem>
                <ListItemText
                  primary="Profile Visibility"
                  secondary="Allow others to see your profile"
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={settings.privacy.profileVisible}
                    onChange={() => handlePrivacyChange('profileVisible')}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Leaderboard Visibility"
                  secondary="Show your progress on leaderboards"
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={settings.privacy.leaderboardVisible}
                    onChange={() => handlePrivacyChange('leaderboardVisible')}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Data Sharing"
                  secondary="Allow anonymous data sharing for research"
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={settings.privacy.dataSharing}
                    onChange={() => handlePrivacyChange('dataSharing')}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Recipe Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Restaurant sx={{ mr: 1 }} />
              Recipe Settings
            </Typography>
            <List>
              <ListItem>
                <ListItemText
                  primary="Detailed Ingredient Information"
                  secondary="Show database names, categories, and aisles for ingredients"
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={settings.recipe.detailedIngredientInfo}
                    onChange={() => handleRecipeChange('detailedIngredientInfo')}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Appearance Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Palette sx={{ mr: 1 }} />
              Appearance
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Theme and language settings will be available in a future update.
            </Typography>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={20} /> : <Save />}
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
} 