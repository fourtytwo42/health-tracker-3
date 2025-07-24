'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  Avatar,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Switch,
  FormControlLabel,
  Divider,
} from '@mui/material';
import { PhotoCamera, Save, Cancel, Person, Security, Settings } from '@mui/icons-material';
import Navigation from '../components/Navigation';

interface Profile {
  id: string;
  userId: string;
  privacySettings: {
    showInLeaderboard: boolean;
    shareProgress: boolean;
    allowNotifications: boolean;
  };
}

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  avatarUrl: string | null;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state - only account-related fields
  const [formData, setFormData] = useState({
    showInLeaderboard: true,
    shareProgress: false,
    allowNotifications: true,
  });

  // Avatar state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        setError('Not authenticated');
        return;
      }

      const [userResponse, profileResponse] = await Promise.all([
        fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/profile', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (userResponse.ok && profileResponse.ok) {
        const userData = await userResponse.json();
        const profileData = await profileResponse.json();
        
        setUser(userData.user);
        setProfile(profileData.profile);
        
        // Set form data
        setFormData({
          showInLeaderboard: profileData.profile?.privacySettings?.showInLeaderboard ?? true,
          shareProgress: profileData.profile?.privacySettings?.shareProgress ?? false,
          allowNotifications: profileData.profile?.privacySettings?.allowNotifications ?? true,
        });
        
        if (userData.user?.avatarUrl) {
          setAvatarPreview(userData.user.avatarUrl);
        }
      } else {
        setError('Failed to load profile data');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile) return null;

    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);

      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        return data.avatarUrl;
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
    }
    return null;
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

      // Upload avatar first if changed
      let avatarUrl = null;
      if (avatarFile) {
        avatarUrl = await uploadAvatar();
      }

      // Update profile
      const profileData = {
        privacySettings: {
          showInLeaderboard: formData.showInLeaderboard,
          shareProgress: formData.shareProgress,
          allowNotifications: formData.allowNotifications,
        }
      };

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });

      if (response.ok) {
        setSuccess('Profile updated successfully!');
        
        // Update user data in localStorage if avatar was uploaded
        if (avatarUrl) {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            try {
              const userData = JSON.parse(userStr);
              userData.avatarUrl = avatarUrl;
              localStorage.setItem('user', JSON.stringify(userData));
              
              // Dispatch custom event to notify Navigation component
              window.dispatchEvent(new CustomEvent('userDataUpdated', { detail: userData }));
            } catch (error) {
              console.error('Error updating user data in localStorage:', error);
            }
          }
        }
        
        await loadProfile(); // Reload to get updated data
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setError('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    loadProfile(); // Reset to original values
    setAvatarFile(null);
    setAvatarPreview(user?.avatarUrl || null);
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <>
      <Navigation />
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Profile Settings
        </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Manage your account information and privacy settings
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

      <Grid container spacing={3}>
        {/* Account Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Person sx={{ mr: 1 }} />
                <Typography variant="h6">Account Information</Typography>
              </Box>
              
              {/* Avatar Section */}
              <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
                <Avatar
                  src={avatarPreview || undefined}
                  sx={{ width: 100, height: 100, mb: 2 }}
                />
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="avatar-upload"
                  type="file"
                  onChange={handleAvatarChange}
                />
                <label htmlFor="avatar-upload">
                  <IconButton
                    color="primary"
                    aria-label="upload picture"
                    component="span"
                  >
                    <PhotoCamera />
                  </IconButton>
                </label>
                <Typography variant="caption" color="text.secondary">
                  Click to change avatar
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />



              {/* Read-only fields */}
              <TextField
                fullWidth
                label="Username"
                value={user?.username || ''}
                margin="normal"
                InputProps={{ readOnly: true }}
                disabled
              />
              
              <TextField
                fullWidth
                label="Email"
                value={user?.email || ''}
                margin="normal"
                InputProps={{ readOnly: true }}
                disabled
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Privacy Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Security sx={{ mr: 1 }} />
                <Typography variant="h6">Privacy Settings</Typography>
              </Box>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.showInLeaderboard}
                    onChange={(e) => handleInputChange('showInLeaderboard', e.target.checked)}
                  />
                }
                label="Show in Leaderboard"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.shareProgress}
                    onChange={(e) => handleInputChange('shareProgress', e.target.checked)}
                  />
                }
                label="Share Progress"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.allowNotifications}
                    onChange={(e) => handleInputChange('allowNotifications', e.target.checked)}
                  />
                }
                label="Allow Notifications"
              />

              <Box mt={3}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Note:</strong> For personal information (name, health data, nutrition targets), please visit the Personal Info section.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
        <Button
          variant="outlined"
          onClick={handleCancel}
          disabled={saving}
          startIcon={<Cancel />}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={20} /> : <Save />}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </Box>
    </Container>
    </>
  );
} 