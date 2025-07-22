'use client';

import React, { useState } from 'react';
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
import { useUserSettings } from '@/hooks/useUserSettings';

export default function SettingsPage() {
  const { settings, loading, error, saveSettings, updateSetting } = useUserSettings();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSave = async () => {
    try {
      setSaving(true);
      setSuccess(null);
      await saveSettings(settings);
      setSuccess('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationChange = (key: keyof typeof settings.notifications) => {
    updateSetting('notifications', key, !settings.notifications[key]);
  };

  const handlePrivacyChange = (key: keyof typeof settings.privacy) => {
    updateSetting('privacy', key, !settings.privacy[key]);
  };

  const handleRecipeChange = (key: keyof typeof settings.recipe) => {
    updateSetting('recipe', key, !settings.recipe[key]);
  };

  const handleUnitsChange = (key: keyof typeof settings.units) => {
    updateSetting('units', key, !settings.units[key]);
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

          {/* Units Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Language sx={{ mr: 1 }} />
              Units & Measurements
            </Typography>
            <List>
              <ListItem>
                <ListItemText
                  primary="Use Metric Units"
                  secondary="Display weights in kg/g and volumes in L/ml instead of lbs/oz and cups"
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={settings.units.useMetricUnits}
                    onChange={() => handleUnitsChange('useMetricUnits')}
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