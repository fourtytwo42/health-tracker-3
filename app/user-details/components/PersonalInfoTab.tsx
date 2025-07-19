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

interface UserDetails {
  id?: string;
  height?: number;
  weight?: number;
  targetWeight?: number;
  bodyFatPercentage?: number;
  muscleMass?: number;
  bmi?: number;
  bloodType?: string;
  allergies?: string;
  medications?: string;
  medicalConditions?: string;
  disabilities?: string;
  exerciseLimitations?: string;
  mobilityIssues?: string;
  injuryHistory?: string;
  activityLevel: string;
  sleepQuality?: string;
  stressLevel?: string;
  smokingStatus?: string;
  alcoholConsumption?: string;
  fitnessGoals?: string;
  dietaryGoals?: string;
  weightGoals?: string;
}

const ACTIVITY_LEVELS = [
  'SEDENTARY',
  'LIGHTLY_ACTIVE',
  'MODERATELY_ACTIVE',
  'VERY_ACTIVE',
  'EXTREMELY_ACTIVE'
];

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const QUALITY_LEVELS = ['POOR', 'FAIR', 'GOOD', 'EXCELLENT'];

const STRESS_LEVELS = ['LOW', 'MODERATE', 'HIGH', 'VERY_HIGH'];

const SMOKING_STATUS = ['NEVER', 'FORMER', 'CURRENT', 'OCCASIONAL'];

const ALCOHOL_CONSUMPTION = ['NONE', 'LIGHT', 'MODERATE', 'HEAVY'];

export default function PersonalInfoTab() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails>({
    activityLevel: 'SEDENTARY'
  });

  useEffect(() => {
    if (user) {
      loadUserDetails();
    }
  }, [user]);

  const loadUserDetails = async () => {
    try {
      const response = await fetch('/api/user-details');
      if (response.ok) {
        const data = await response.json();
        if (data.userDetails) {
          setUserDetails(data.userDetails);
        }
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

  const calculateBMI = () => {
    if (userDetails.height && userDetails.weight) {
      const heightInMeters = userDetails.height / 100;
      const bmi = userDetails.weight / (heightInMeters * heightInMeters);
      setUserDetails(prev => ({ ...prev, bmi: Math.round(bmi * 10) / 10 }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      calculateBMI();
      
      const response = await fetch('/api/user-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userDetails),
      });

      if (response.ok) {
        setSuccess('User details saved successfully!');
        const data = await response.json();
        if (data.userDetails) {
          setUserDetails(data.userDetails);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save user details');
      }
    } catch (error) {
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
        Personal Information & Health Details
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
        {/* Physical Measurements */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Physical Measurements" />
            <CardContent>
              <Stack spacing={2}>
                <TextField
                  label="Height (cm)"
                  type="number"
                  value={userDetails.height || ''}
                  onChange={(e) => handleInputChange('height', parseFloat(e.target.value) || undefined)}
                  fullWidth
                />
                <TextField
                  label="Weight (kg)"
                  type="number"
                  value={userDetails.weight || ''}
                  onChange={(e) => handleInputChange('weight', parseFloat(e.target.value) || undefined)}
                  fullWidth
                />
                <TextField
                  label="Target Weight (kg)"
                  type="number"
                  value={userDetails.targetWeight || ''}
                  onChange={(e) => handleInputChange('targetWeight', parseFloat(e.target.value) || undefined)}
                  fullWidth
                />
                <TextField
                  label="Body Fat Percentage"
                  type="number"
                  value={userDetails.bodyFatPercentage || ''}
                  onChange={(e) => handleInputChange('bodyFatPercentage', parseFloat(e.target.value) || undefined)}
                  fullWidth
                />
                <TextField
                  label="Muscle Mass (kg)"
                  type="number"
                  value={userDetails.muscleMass || ''}
                  onChange={(e) => handleInputChange('muscleMass', parseFloat(e.target.value) || undefined)}
                  fullWidth
                />
                {userDetails.bmi && (
                  <TextField
                    label="BMI"
                    value={userDetails.bmi}
                    fullWidth
                    disabled
                    helperText={`${userDetails.bmi < 18.5 ? 'Underweight' : userDetails.bmi < 25 ? 'Normal' : userDetails.bmi < 30 ? 'Overweight' : 'Obese'}`}
                  />
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Health Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Health Information" />
            <CardContent>
              <Stack spacing={2}>
                <FormControl fullWidth>
                  <InputLabel>Blood Type</InputLabel>
                  <Select
                    value={userDetails.bloodType || ''}
                    onChange={(e) => handleInputChange('bloodType', e.target.value)}
                    label="Blood Type"
                  >
                    {BLOOD_TYPES.map((type) => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
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
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Exercise Limitations */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Exercise Limitations & Disabilities" />
            <CardContent>
              <Stack spacing={2}>
                <TextField
                  label="Disabilities"
                  multiline
                  rows={3}
                  value={userDetails.disabilities || ''}
                  onChange={(e) => handleInputChange('disabilities', e.target.value)}
                  fullWidth
                  helperText="Describe any disabilities or physical limitations"
                />
                
                <TextField
                  label="Exercise Limitations"
                  multiline
                  rows={3}
                  value={userDetails.exerciseLimitations || ''}
                  onChange={(e) => handleInputChange('exerciseLimitations', e.target.value)}
                  fullWidth
                  helperText="List body parts or movements to avoid or modify"
                />
                
                <TextField
                  label="Mobility Issues"
                  multiline
                  rows={3}
                  value={userDetails.mobilityIssues || ''}
                  onChange={(e) => handleInputChange('mobilityIssues', e.target.value)}
                  fullWidth
                  helperText="Describe any mobility or balance issues"
                />
                
                <TextField
                  label="Injury History"
                  multiline
                  rows={3}
                  value={userDetails.injuryHistory || ''}
                  onChange={(e) => handleInputChange('injuryHistory', e.target.value)}
                  fullWidth
                  helperText="List past injuries and current status"
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Lifestyle & Goals */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Lifestyle & Goals" />
            <CardContent>
              <Stack spacing={2}>
                <FormControl fullWidth>
                  <InputLabel>Activity Level</InputLabel>
                  <Select
                    value={userDetails.activityLevel}
                    onChange={(e) => handleInputChange('activityLevel', e.target.value)}
                    label="Activity Level"
                  >
                    {ACTIVITY_LEVELS.map((level) => (
                      <MenuItem key={level} value={level}>
                        {level.replace('_', ' ')}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl fullWidth>
                  <InputLabel>Sleep Quality</InputLabel>
                  <Select
                    value={userDetails.sleepQuality || ''}
                    onChange={(e) => handleInputChange('sleepQuality', e.target.value)}
                    label="Sleep Quality"
                  >
                    {QUALITY_LEVELS.map((level) => (
                      <MenuItem key={level} value={level}>{level}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl fullWidth>
                  <InputLabel>Stress Level</InputLabel>
                  <Select
                    value={userDetails.stressLevel || ''}
                    onChange={(e) => handleInputChange('stressLevel', e.target.value)}
                    label="Stress Level"
                  >
                    {STRESS_LEVELS.map((level) => (
                      <MenuItem key={level} value={level}>{level}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl fullWidth>
                  <InputLabel>Smoking Status</InputLabel>
                  <Select
                    value={userDetails.smokingStatus || ''}
                    onChange={(e) => handleInputChange('smokingStatus', e.target.value)}
                    label="Smoking Status"
                  >
                    {SMOKING_STATUS.map((status) => (
                      <MenuItem key={status} value={status}>{status}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl fullWidth>
                  <InputLabel>Alcohol Consumption</InputLabel>
                  <Select
                    value={userDetails.alcoholConsumption || ''}
                    onChange={(e) => handleInputChange('alcoholConsumption', e.target.value)}
                    label="Alcohol Consumption"
                  >
                    {ALCOHOL_CONSUMPTION.map((level) => (
                      <MenuItem key={level} value={level}>{level}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Goals */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Health & Fitness Goals" />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Fitness Goals"
                    multiline
                    rows={4}
                    value={userDetails.fitnessGoals || ''}
                    onChange={(e) => handleInputChange('fitnessGoals', e.target.value)}
                    fullWidth
                    helperText="What are your fitness goals?"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Dietary Goals"
                    multiline
                    rows={4}
                    value={userDetails.dietaryGoals || ''}
                    onChange={(e) => handleInputChange('dietaryGoals', e.target.value)}
                    fullWidth
                    helperText="What are your dietary goals?"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Weight Goals"
                    multiline
                    rows={4}
                    value={userDetails.weightGoals || ''}
                    onChange={(e) => handleInputChange('weightGoals', e.target.value)}
                    fullWidth
                    helperText="What are your weight management goals?"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          size="large"
        >
          {saving ? <CircularProgress size={24} /> : 'Save Changes'}
        </Button>
      </Box>
    </Box>
  );
} 