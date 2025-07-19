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
  height?: number; // stored in cm
  weight?: number; // stored in kg
  targetWeight?: number; // stored in kg
  bodyFatPercentage?: number;
  muscleMass?: number; // stored in kg
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

// American unit display state
interface AmericanDisplay {
  heightFeet: number;
  heightInches: number;
  weightLbs: number;
  targetWeightLbs: number;
  muscleMassLbs: number;
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
  
  // American units for display
  const [americanDisplay, setAmericanDisplay] = useState<AmericanDisplay>({
    heightFeet: 5,
    heightInches: 8,
    weightLbs: 150,
    targetWeightLbs: 150,
    muscleMassLbs: 50
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
          
          // Convert metric to American for display
          if (data.userDetails.height) {
            const heightConversion = convertHeightToAmerican(data.userDetails.height);
            const totalInches = data.userDetails.height / 2.54;
            const feet = Math.floor(totalInches / 12);
            const inches = Math.round(totalInches % 12);
            setAmericanDisplay(prev => ({
              ...prev,
              heightFeet: feet,
              heightInches: inches
            }));
          }
          
          if (data.userDetails.weight) {
            const weightConversion = convertWeightToAmerican(data.userDetails.weight);
            setAmericanDisplay(prev => ({
              ...prev,
              weightLbs: weightConversion.value * 2.20462
            }));
          }
          
          if (data.userDetails.targetWeight) {
            const targetWeightConversion = convertWeightToAmerican(data.userDetails.targetWeight);
            setAmericanDisplay(prev => ({
              ...prev,
              targetWeightLbs: targetWeightConversion.value * 2.20462
            }));
          }
          
          if (data.userDetails.muscleMass) {
            const muscleMassConversion = convertWeightToAmerican(data.userDetails.muscleMass);
            setAmericanDisplay(prev => ({
              ...prev,
              muscleMassLbs: muscleMassConversion.value * 2.20462
            }));
          }
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

  const handleAmericanInputChange = (field: keyof AmericanDisplay, value: number) => {
    setAmericanDisplay(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateBMIFromAmerican = () => {
    if (americanDisplay.weightLbs && americanDisplay.heightFeet && americanDisplay.heightInches) {
      const bmi = calculateBMI(americanDisplay.weightLbs, americanDisplay.heightFeet, americanDisplay.heightInches);
      setUserDetails(prev => ({ ...prev, bmi }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Convert American units back to metric for database
      const heightCm = convertHeightToMetric(americanDisplay.heightFeet, americanDisplay.heightInches).value;
      const weightKg = convertWeightToMetric(americanDisplay.weightLbs).value;
      const targetWeightKg = convertWeightToMetric(americanDisplay.targetWeightLbs).value;
      const muscleMassKg = convertWeightToMetric(americanDisplay.muscleMassLbs).value;
      
      // Calculate BMI
      calculateBMIFromAmerican();
      
      const updatedUserDetails = {
        ...userDetails,
        height: heightCm,
        weight: weightKg,
        targetWeight: targetWeightKg,
        muscleMass: muscleMassKg
      };
      
      const response = await fetch('/api/user-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedUserDetails),
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
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Height (feet & inches)
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <TextField
                      label="Feet"
                      type="number"
                      value={americanDisplay.heightFeet || ''}
                      onChange={(e) => handleAmericanInputChange('heightFeet', parseInt(e.target.value) || 0)}
                      sx={{ flex: 1 }}
                      inputProps={{ min: 3, max: 8 }}
                    />
                    <TextField
                      label="Inches"
                      type="number"
                      value={americanDisplay.heightInches || ''}
                      onChange={(e) => handleAmericanInputChange('heightInches', parseInt(e.target.value) || 0)}
                      sx={{ flex: 1 }}
                      inputProps={{ min: 0, max: 11 }}
                    />
                  </Stack>
                </Box>
                
                <TextField
                  label="Weight (lbs)"
                  type="number"
                  value={americanDisplay.weightLbs || ''}
                  onChange={(e) => handleAmericanInputChange('weightLbs', parseFloat(e.target.value) || 0)}
                  fullWidth
                  inputProps={{ min: 50, max: 500 }}
                />
                
                <TextField
                  label="Target Weight (lbs)"
                  type="number"
                  value={americanDisplay.targetWeightLbs || ''}
                  onChange={(e) => handleAmericanInputChange('targetWeightLbs', parseFloat(e.target.value) || 0)}
                  fullWidth
                  inputProps={{ min: 50, max: 500 }}
                />
                
                <TextField
                  label="Body Fat Percentage"
                  type="number"
                  value={userDetails.bodyFatPercentage || ''}
                  onChange={(e) => handleInputChange('bodyFatPercentage', parseFloat(e.target.value) || undefined)}
                  fullWidth
                  inputProps={{ min: 0, max: 50 }}
                />
                
                <TextField
                  label="Muscle Mass (lbs)"
                  type="number"
                  value={americanDisplay.muscleMassLbs || ''}
                  onChange={(e) => handleAmericanInputChange('muscleMassLbs', parseFloat(e.target.value) || 0)}
                  fullWidth
                  inputProps={{ min: 20, max: 200 }}
                />
                
                {userDetails.bmi && (
                  <TextField
                    label="BMI"
                    value={`${userDetails.bmi} (${getBMICategory(userDetails.bmi)})`}
                    fullWidth
                    disabled
                    helperText="Calculated automatically from height and weight"
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