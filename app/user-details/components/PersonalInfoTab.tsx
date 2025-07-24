'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  TextField,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  Stack
} from '@mui/material';
import { useAuth } from '@/context/AuthContext';
import { 
  convertHeightToAmerican, 
  convertHeightToMetric, 
  convertWeightToAmerican, 
  convertWeightToMetric,
  calculateBMI,
  getBMICategory
} from '@/lib/utils/unitConversion';

interface UserDetails {
  id?: string;
  // Basic Information
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: string;
  
  // Physical Measurements
  height?: number; // stored in cm
  targetWeight?: number; // stored in kg
  
  // Medical Information
  allergies?: string;
  medications?: string;
  medicalConditions?: string;
  disabilities?: string;
  
  // Exercise & Mobility
  exerciseLimitations?: string;
  mobilityIssues?: string;
  injuryHistory?: string;
  
  // Nutrition Targets
  dietaryPreferences?: string[];
  calorieTarget?: number;
  proteinTarget?: number;
  carbTarget?: number;
  fatTarget?: number;
  fiberTarget?: number;
}

// American unit display state
interface AmericanDisplay {
  heightFeet: number;
  heightInches: number;
  targetWeightLbs: number;
}

const GENDERS = ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'];

const DIETARY_PREFERENCES = [
  'VEGETARIAN',
  'VEGAN', 
  'GLUTEN_FREE',
  'DAIRY_FREE',
  'KETO',
  'PALEO',
  'MEDITERRANEAN',
  'LOW_CARB',
  'LOW_FAT',
  'NONE'
];

export default function PersonalInfoTab() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails>({
    dietaryPreferences: []
  });
  
  // American units for display
  const [americanDisplay, setAmericanDisplay] = useState<AmericanDisplay>({
    heightFeet: 5,
    heightInches: 8,
    targetWeightLbs: 150
  });

  useEffect(() => {
    if (user) {
      loadUserDetails();
    }
  }, [user]);

  const loadUserDetails = async () => {
    try {
      setLoading(true);
      
      // Get the access token
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.error('No access token found');
        return;
      }

      const response = await fetch('/api/user-details', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.userDetails) {
          // Ensure dietaryPreferences is always an array
          const userDetailsData = {
            ...data.userDetails,
            dietaryPreferences: Array.isArray(data.userDetails.dietaryPreferences) 
              ? data.userDetails.dietaryPreferences 
              : [],
            // Format dateOfBirth for the date input field
            dateOfBirth: data.userDetails.dateOfBirth 
              ? new Date(data.userDetails.dateOfBirth).toISOString().split('T')[0]
              : ''
          };
          setUserDetails(userDetailsData);
          
          // Convert metric to American for display
          if (data.userDetails.height) {
            const heightConversion = convertHeightToAmerican(data.userDetails.height);
            setAmericanDisplay(prev => ({
              ...prev,
              heightFeet: heightConversion.feet,
              heightInches: heightConversion.inches
            }));
          }
          
          if (data.userDetails.targetWeight) {
            const targetWeightLbs = convertWeightToAmerican(data.userDetails.targetWeight);
            // Round up to nearest 0.1
            const roundedWeight = Math.ceil(targetWeightLbs * 10) / 10;
            setAmericanDisplay(prev => ({
              ...prev,
              targetWeightLbs: roundedWeight
            }));
          }
        }
      } else {
        console.error('Failed to load user details:', response.status);
      }
    } catch (error) {
      console.error('Error loading user details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof UserDetails, value: any) => {
    setUserDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAmericanInputChange = (field: keyof AmericanDisplay, value: number) => {
    setAmericanDisplay(prev => ({
      ...prev,
      [field]: field === 'targetWeightLbs' ? Math.ceil(value * 10) / 10 : value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Get the access token
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('No access token found. Please log in again.');
        return;
      }

      // Convert American units back to metric for database
      const heightCm = convertHeightToMetric(americanDisplay.heightFeet, americanDisplay.heightInches);
      // Round up target weight to nearest 0.1 before converting
      const roundedTargetWeightLbs = Math.ceil(americanDisplay.targetWeightLbs * 10) / 10;
      const targetWeightKg = convertWeightToMetric(roundedTargetWeightLbs);
      
      const updatedUserDetails = {
        ...userDetails,
        height: heightCm,
        targetWeight: targetWeightKg
      };
      
      const response = await fetch('/api/user-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedUserDetails),
      });

      if (response.ok) {
        setSuccess('Personal information saved successfully!');
        const data = await response.json();
        if (data.userDetails) {
          setUserDetails(data.userDetails);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save personal information');
      }
    } catch (error) {
      console.error('Error saving personal info:', error);
      setError('An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Personal Information
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage your basic information, physical measurements, medical details, and nutrition targets.
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
        {/* Basic Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Basic Information" />
            <CardContent>
              <Stack spacing={2}>
                <TextField
                  label="First Name"
                  value={userDetails.firstName || ''}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  fullWidth
                />
                
                <TextField
                  label="Last Name"
                  value={userDetails.lastName || ''}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  fullWidth
                />
                
                <TextField
                  label="Date of Birth"
                  type="date"
                  value={userDetails.dateOfBirth || ''}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
                
                <FormControl fullWidth>
                  <InputLabel>Gender</InputLabel>
                  <Select
                    value={userDetails.gender || ''}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    label="Gender"
                  >
                    {GENDERS.map((gender) => (
                      <MenuItem key={gender} value={gender}>
                        {gender.replace('_', ' ')}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Physical Measurements */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Physical Measurements" />
            <CardContent>
              <Stack spacing={2}>
                <TextField
                  label="Height (feet)"
                  type="number"
                  value={americanDisplay.heightFeet || ''}
                  onChange={(e) => handleAmericanInputChange('heightFeet', parseInt(e.target.value) || 0)}
                  fullWidth
                  inputProps={{ min: 3, max: 8 }}
                />
                
                <TextField
                  label="Height (inches)"
                  type="number"
                  value={americanDisplay.heightInches || ''}
                  onChange={(e) => handleAmericanInputChange('heightInches', parseInt(e.target.value) || 0)}
                  fullWidth
                  inputProps={{ min: 0, max: 11 }}
                />
                
                <TextField
                  label="Target Weight (lbs)"
                  type="number"
                  value={Math.ceil(americanDisplay.targetWeightLbs * 10) / 10 || ''}
                  onChange={(e) => handleAmericanInputChange('targetWeightLbs', parseFloat(e.target.value) || 0)}
                  fullWidth
                  inputProps={{ min: 50, max: 500, step: 0.1 }}
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Medical Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Medical Information" />
            <CardContent>
              <Stack spacing={2}>
                <TextField
                  label="Allergies"
                  multiline
                  rows={3}
                  value={userDetails.allergies || ''}
                  onChange={(e) => handleInputChange('allergies', e.target.value)}
                  fullWidth
                  helperText="List any food, medication, or environmental allergies"
                />
                
                <TextField
                  label="Medications"
                  multiline
                  rows={3}
                  value={userDetails.medications || ''}
                  onChange={(e) => handleInputChange('medications', e.target.value)}
                  fullWidth
                  helperText="List current medications and dosages"
                />
                
                <TextField
                  label="Medical Conditions"
                  multiline
                  rows={3}
                  value={userDetails.medicalConditions || ''}
                  onChange={(e) => handleInputChange('medicalConditions', e.target.value)}
                  fullWidth
                  helperText="List any chronic conditions or health issues"
                />
                
                <TextField
                  label="Disabilities"
                  multiline
                  rows={2}
                  value={userDetails.disabilities || ''}
                  onChange={(e) => handleInputChange('disabilities', e.target.value)}
                  fullWidth
                  helperText="List any physical disabilities or limitations"
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Exercise Limitations */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Exercise & Mobility" />
            <CardContent>
              <Stack spacing={2}>
                <TextField
                  label="Exercise Limitations"
                  multiline
                  rows={3}
                  value={userDetails.exerciseLimitations || ''}
                  onChange={(e) => handleInputChange('exerciseLimitations', e.target.value)}
                  fullWidth
                  helperText="List any exercise restrictions or limitations"
                />
                
                <TextField
                  label="Mobility Issues"
                  multiline
                  rows={2}
                  value={userDetails.mobilityIssues || ''}
                  onChange={(e) => handleInputChange('mobilityIssues', e.target.value)}
                  fullWidth
                  helperText="Describe any mobility challenges"
                />
                
                <TextField
                  label="Injury History"
                  multiline
                  rows={3}
                  value={userDetails.injuryHistory || ''}
                  onChange={(e) => handleInputChange('injuryHistory', e.target.value)}
                  fullWidth
                  helperText="List past injuries and their current status"
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Nutrition Targets */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Nutrition Targets" />
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Stack spacing={2}>
                    <FormControl fullWidth>
                      <InputLabel>Dietary Preferences</InputLabel>
                      <Select
                        multiple
                        value={Array.isArray(userDetails.dietaryPreferences) ? userDetails.dietaryPreferences : []}
                        onChange={(e) => handleInputChange('dietaryPreferences', e.target.value)}
                        label="Dietary Preferences"
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {(Array.isArray(selected) ? selected : []).map((value) => (
                              <Chip key={value} label={value.replace('_', ' ')} size="small" />
                            ))}
                          </Box>
                        )}
                      >
                        {DIETARY_PREFERENCES.map((pref) => (
                          <MenuItem key={pref} value={pref}>
                            {pref.replace('_', ' ')}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    
                    <TextField
                      label="Daily Calorie Target"
                      type="number"
                      value={userDetails.calorieTarget || ''}
                      onChange={(e) => handleInputChange('calorieTarget', parseInt(e.target.value) || undefined)}
                      fullWidth
                      inputProps={{ min: 800, max: 5000 }}
                      helperText="Target daily calorie intake"
                    />
                  </Stack>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Stack spacing={2}>
                    <TextField
                      label="Protein Target (g)"
                      type="number"
                      value={userDetails.proteinTarget || ''}
                      onChange={(e) => handleInputChange('proteinTarget', parseInt(e.target.value) || undefined)}
                      fullWidth
                      inputProps={{ min: 0, max: 500 }}
                    />
                    
                    <TextField
                      label="Carb Target (g)"
                      type="number"
                      value={userDetails.carbTarget || ''}
                      onChange={(e) => handleInputChange('carbTarget', parseInt(e.target.value) || undefined)}
                      fullWidth
                      inputProps={{ min: 0, max: 1000 }}
                    />
                    
                    <TextField
                      label="Fat Target (g)"
                      type="number"
                      value={userDetails.fatTarget || ''}
                      onChange={(e) => handleInputChange('fatTarget', parseInt(e.target.value) || undefined)}
                      fullWidth
                      inputProps={{ min: 0, max: 200 }}
                    />
                    
                    <TextField
                      label="Fiber Target (g)"
                      type="number"
                      value={userDetails.fiberTarget || ''}
                      onChange={(e) => handleInputChange('fiberTarget', parseInt(e.target.value) || undefined)}
                      fullWidth
                      inputProps={{ min: 0, max: 100 }}
                    />
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box display="flex" justifyContent="flex-end" mt={3}>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={20} /> : undefined}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </Box>
    </Box>
  );
} 