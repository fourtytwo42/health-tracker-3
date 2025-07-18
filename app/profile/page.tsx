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
} from '@mui/material';
import { PhotoCamera, Save, Cancel } from '@mui/icons-material';

interface Profile {
  id: string;
  userId: string;
  firstName: string | null;
  lastName: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  height: number | null;
  weight: number | null;
  targetWeight: number | null;
  activityLevel: string;
  dietaryPreferences: string[];
  calorieTarget: number | null;
  proteinTarget: number | null;
  carbTarget: number | null;
  fatTarget: number | null;
  fiberTarget: number | null;
  privacySettings: {
    leaderboardVisible: boolean;
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
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    height: '',
    weight: '',
    targetWeight: '',
    activityLevel: 'SEDENTARY',
    dietaryPreferences: [] as string[],
    calorieTarget: '',
    proteinTarget: '',
    carbTarget: '',
    fatTarget: '',
    fiberTarget: '',
    leaderboardVisible: true,
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
        fetch('/api/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/profile/details', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUser(userData.user);
        if (userData.user.avatarUrl) {
          setAvatarPreview(userData.user.avatarUrl);
        }
      }

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setProfile(profileData.profile);
        
        // Parse JSON fields
        const dietaryPrefs = profileData.profile.dietaryPreferences 
          ? JSON.parse(profileData.profile.dietaryPreferences)
          : [];
        const privacySettings = profileData.profile.privacySettings
          ? JSON.parse(profileData.profile.privacySettings)
          : { leaderboardVisible: true };

        setFormData({
          firstName: profileData.profile.firstName || '',
          lastName: profileData.profile.lastName || '',
          dateOfBirth: profileData.profile.dateOfBirth 
            ? new Date(profileData.profile.dateOfBirth).toISOString().split('T')[0]
            : '',
          gender: profileData.profile.gender || '',
          height: profileData.profile.height?.toString() || '',
          weight: profileData.profile.weight?.toString() || '',
          targetWeight: profileData.profile.targetWeight?.toString() || '',
          activityLevel: profileData.profile.activityLevel || 'SEDENTARY',
          dietaryPreferences: dietaryPrefs,
          calorieTarget: profileData.profile.calorieTarget?.toString() || '',
          proteinTarget: profileData.profile.proteinTarget?.toString() || '',
          carbTarget: profileData.profile.carbTarget?.toString() || '',
          fatTarget: profileData.profile.fatTarget?.toString() || '',
          fiberTarget: profileData.profile.fiberTarget?.toString() || '',
          leaderboardVisible: privacySettings.leaderboardVisible,
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
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

      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        return data.avatarUrl;
      }
      return null;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      return null;
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Upload avatar first if changed
      let avatarUrl = user?.avatarUrl || null;
      if (avatarFile) {
        avatarUrl = await uploadAvatar();
        if (avatarUrl) {
          setUser(prev => prev ? { ...prev, avatarUrl } : null);
        }
      }

      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          dietaryPreferences: JSON.stringify(formData.dietaryPreferences),
          privacySettings: JSON.stringify({
            leaderboardVisible: formData.leaderboardVisible,
          }),
          avatarUrl,
        }),
      });

      if (response.ok) {
        setSuccess('Profile updated successfully');
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
    loadProfile(); // Reset to original data
    setAvatarFile(null);
    setAvatarPreview(user?.avatarUrl || null);
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">Failed to load profile</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Profile Settings
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
          <Grid container spacing={3}>
            {/* Avatar Section */}
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Avatar
                  src={avatarPreview || undefined}
                  sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
                />
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="avatar-upload"
                  type="file"
                  onChange={handleAvatarChange}
                />
                <label htmlFor="avatar-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<PhotoCamera />}
                  >
                    Change Avatar
                  </Button>
                </label>
              </Box>
            </Grid>

            {/* Profile Form */}
            <Grid item xs={12} md={8}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Date of Birth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Gender</InputLabel>
                    <Select
                      value={formData.gender}
                      label="Gender"
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    >
                      <MenuItem value="MALE">Male</MenuItem>
                      <MenuItem value="FEMALE">Female</MenuItem>
                      <MenuItem value="OTHER">Other</MenuItem>
                      <MenuItem value="PREFER_NOT_TO_SAY">Prefer not to say</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Height (cm)"
                    type="number"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Weight (kg)"
                    type="number"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Target Weight (kg)"
                    type="number"
                    value={formData.targetWeight}
                    onChange={(e) => setFormData({ ...formData, targetWeight: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Activity Level</InputLabel>
                    <Select
                      value={formData.activityLevel}
                      label="Activity Level"
                      onChange={(e) => setFormData({ ...formData, activityLevel: e.target.value })}
                    >
                      <MenuItem value="SEDENTARY">Sedentary</MenuItem>
                      <MenuItem value="LIGHTLY_ACTIVE">Lightly Active</MenuItem>
                      <MenuItem value="MODERATELY_ACTIVE">Moderately Active</MenuItem>
                      <MenuItem value="VERY_ACTIVE">Very Active</MenuItem>
                      <MenuItem value="EXTREMELY_ACTIVE">Extremely Active</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Dietary Preferences</InputLabel>
                    <Select
                      multiple
                      value={formData.dietaryPreferences}
                      label="Dietary Preferences"
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        dietaryPreferences: typeof e.target.value === 'string' 
                          ? e.target.value.split(',') 
                          : e.target.value 
                      })}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => (
                            <Chip key={value} label={value} size="small" />
                          ))}
                        </Box>
                      )}
                    >
                      <MenuItem value="vegetarian">Vegetarian</MenuItem>
                      <MenuItem value="vegan">Vegan</MenuItem>
                      <MenuItem value="gluten-free">Gluten Free</MenuItem>
                      <MenuItem value="dairy-free">Dairy Free</MenuItem>
                      <MenuItem value="keto">Keto</MenuItem>
                      <MenuItem value="paleo">Paleo</MenuItem>
                      <MenuItem value="mediterranean">Mediterranean</MenuItem>
                      <MenuItem value="none">None</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Grid>
          </Grid>

          {/* Nutrition Targets */}
          <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
            Nutrition Targets
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Calorie Target"
                type="number"
                value={formData.calorieTarget}
                onChange={(e) => setFormData({ ...formData, calorieTarget: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Protein Target (g)"
                type="number"
                value={formData.proteinTarget}
                onChange={(e) => setFormData({ ...formData, proteinTarget: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Carb Target (g)"
                type="number"
                value={formData.carbTarget}
                onChange={(e) => setFormData({ ...formData, carbTarget: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Fat Target (g)"
                type="number"
                value={formData.fatTarget}
                onChange={(e) => setFormData({ ...formData, fatTarget: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Fiber Target (g)"
                type="number"
                value={formData.fiberTarget}
                onChange={(e) => setFormData({ ...formData, fiberTarget: e.target.value })}
              />
            </Grid>
          </Grid>

          {/* Privacy Settings */}
          <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
            Privacy Settings
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Leaderboard Visibility</InputLabel>
            <Select
              value={formData.leaderboardVisible ? 'visible' : 'hidden'}
              label="Leaderboard Visibility"
              onChange={(e) => setFormData({ 
                ...formData, 
                leaderboardVisible: e.target.value === 'visible' 
              })}
            >
              <MenuItem value="visible">Visible to others</MenuItem>
              <MenuItem value="hidden">Hidden from others</MenuItem>
            </Select>
          </FormControl>

          {/* Action Buttons */}
          <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
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
        </CardContent>
      </Card>
    </Container>
  );
} 