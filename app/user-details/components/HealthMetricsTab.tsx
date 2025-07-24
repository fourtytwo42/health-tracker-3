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
  Alert,
  CircularProgress,
  Stack,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip
} from '@mui/material';
import { 
  Add as AddIcon, 
  TrendingUp as TrendingUpIcon,
  Scale as ScaleIcon,
  Favorite as HeartIcon,
  Bloodtype as GlucoseIcon,
  LocalFireDepartment as KetoneIcon
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAuth } from '@/context/AuthContext';
import { 
  convertWeightToAmerican, 
  convertWeightToMetric,
  calculateBodyFatPercentage,
  calculateMuscleMass
} from '@/lib/utils/unitConversion';

interface Biomarker {
  id: string;
  type: string;
  value: number;
  unit: string;
  loggedAt: string;
  notes?: string;
}

interface HealthMetrics {
  weight?: number;
  systolic?: number;
  diastolic?: number;
  glucose?: number;
  ketones?: number;
}

interface UserDetails {
  dateOfBirth?: string;
  gender?: string;
  height?: number;
}

export default function HealthMetricsTab() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [biomarkers, setBiomarkers] = useState<Biomarker[]>([]);
  const [userDetails, setUserDetails] = useState<UserDetails>({});
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newBiomarker, setNewBiomarker] = useState<Partial<Biomarker>>({
    type: 'WEIGHT',
    value: 0,
    unit: 'kg',
    notes: ''
  });
  const [bloodPressure, setBloodPressure] = useState({ systolic: '', diastolic: '' });

  // American units for display
  const [useMetricUnits, setUseMetricUnits] = useState(false);

  useEffect(() => {
    if (user) {
      loadBiomarkers();
    }
  }, [user]);

  const loadBiomarkers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Not authenticated. Please log in again.');
        return;
      }

      const [biomarkersResponse, userDetailsResponse] = await Promise.all([
        fetch('/api/biomarkers', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }),
        fetch('/api/user-details', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
      ]);
      
      if (biomarkersResponse.ok) {
        const data = await biomarkersResponse.json();
        console.log('Biomarkers response:', data); // Debug log
        setBiomarkers(data.biomarkers || []);
      } else {
        console.error('Biomarkers response not ok:', biomarkersResponse.status);
      }
      
      if (userDetailsResponse.ok) {
        const data = await userDetailsResponse.json();
        setUserDetails(data.userDetails || {});
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBiomarker = async () => {
    try {
      setSaving(true);
      setError(null);

      if (newBiomarker.type === 'BLOOD_PRESSURE') {
        // Handle blood pressure - log both systolic and diastolic
        const systolic = parseInt(bloodPressure.systolic);
        const diastolic = parseInt(bloodPressure.diastolic);
        
        if (!systolic || !diastolic) {
          setError('Please enter both systolic and diastolic values');
          return;
        }

        const token = localStorage.getItem('accessToken');
        if (!token) {
          setError('Not authenticated. Please log in again.');
          return;
        }

        // Log systolic
        const systolicResponse = await fetch('/api/biomarkers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            type: 'BLOOD_PRESSURE_SYSTOLIC',
            value: systolic,
            unit: 'mmHg',
            notes: newBiomarker.notes
          }),
        });

        // Log diastolic
        const diastolicResponse = await fetch('/api/biomarkers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            type: 'BLOOD_PRESSURE_DIASTOLIC',
            value: diastolic,
            unit: 'mmHg',
            notes: newBiomarker.notes
          }),
        });

        if (systolicResponse.ok && diastolicResponse.ok) {
          console.log('Blood pressure logged successfully, reloading data...'); // Debug log
          setSuccess('Blood pressure logged successfully!');
          setShowAddDialog(false);
          setBloodPressure({ systolic: '', diastolic: '' });
          setNewBiomarker({
            type: 'WEIGHT',
            value: 0,
            unit: 'kg',
            notes: ''
          });
          await loadBiomarkers();
        } else {
          setError('Failed to log blood pressure');
        }
      } else {
        // Handle other biomarkers
        // Convert weight to metric if needed
        let finalValue = newBiomarker.value;
        let finalUnit = newBiomarker.unit;
        
        if (newBiomarker.type === 'WEIGHT' && !useMetricUnits) {
          finalValue = convertWeightToMetric(newBiomarker.value || 0);
          finalUnit = 'kg';
        }

              const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Not authenticated. Please log in again.');
        return;
      }

      const response = await fetch('/api/biomarkers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: newBiomarker.type,
          value: finalValue,
          unit: finalUnit,
          notes: newBiomarker.notes
        }),
      });

              if (response.ok) {
        console.log('Biomarker logged successfully, reloading data...'); // Debug log
        setSuccess('Biomarker logged successfully!');
        setShowAddDialog(false);
        setNewBiomarker({
          type: 'WEIGHT',
          value: 0,
          unit: 'kg',
          notes: ''
        });
        await loadBiomarkers();
      } else {
          const errorData = await response.json();
          console.log('Error response:', errorData); // Debug log
          // Handle error object properly
          const errorMessage = typeof errorData.error === 'object' 
            ? errorData.error.message || 'Failed to log biomarker'
            : errorData.error || 'Failed to log biomarker';
          console.log('Error message to display:', errorMessage); // Debug log
          setError(errorMessage);
        }
      }
    } catch (error) {
      setError('An error occurred while logging biomarker');
    } finally {
      setSaving(false);
    }
  };

  const getBiomarkerData = (type: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    
    return biomarkers
      .filter(b => b.type === type)
      .filter(b => {
        // If this is the first entry for this type, only show today's entries
        const allEntriesForType = biomarkers.filter(b2 => b2.type === type);
        const hasEntriesBeforeToday = allEntriesForType.some(b2 => {
          const entryDate = new Date(b2.loggedAt);
          entryDate.setHours(0, 0, 0, 0);
          return entryDate < today;
        });
        
        if (!hasEntriesBeforeToday) {
          // Only show today's entries if no previous entries exist
          const entryDate = new Date(b.loggedAt);
          entryDate.setHours(0, 0, 0, 0);
          return entryDate >= today;
        }
        
        return true; // Show all entries if there are previous entries
      })
      .sort((a, b) => new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime())
      .map(b => {
        let displayValue = b.value;
        let displayUnit = b.unit;
        
        // Convert weight based on user preference
        if (type === 'WEIGHT') {
          if (!useMetricUnits && b.unit === 'kg') {
            displayValue = convertWeightToAmerican(b.value);
            displayUnit = 'lbs';
          } else if (useMetricUnits && b.unit === 'lbs') {
            displayValue = convertWeightToMetric(b.value);
            displayUnit = 'kg';
          }
          // Round weight to nearest 0.1
          displayValue = Math.ceil(displayValue * 10) / 10;
        }
        
        return {
          date: new Date(b.loggedAt).toLocaleDateString(),
          value: displayValue,
          unit: displayUnit,
          notes: b.notes
        };
      });
  };

  const getLatestValue = (type: string) => {
    const data = getBiomarkerData(type);
    return data.length > 0 ? data[data.length - 1] : null;
  };

  const getLatestRawValue = (type: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const allEntriesForType = biomarkers.filter(b => b.type === type);
    const hasEntriesBeforeToday = allEntriesForType.some(b => {
      const entryDate = new Date(b.loggedAt);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate < today;
    });
    
    const filteredBiomarkers = biomarkers
      .filter(b => b.type === type)
      .filter(b => {
        if (!hasEntriesBeforeToday) {
          const entryDate = new Date(b.loggedAt);
          entryDate.setHours(0, 0, 0, 0);
          return entryDate >= today;
        }
        return true;
      })
      .sort((a, b) => new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime());
    
    return filteredBiomarkers.length > 0 ? filteredBiomarkers[filteredBiomarkers.length - 1] : null;
  };

  const formatValue = (value: number, unit: string, type: string) => {
    // getBiomarkerData already handles weight conversion, so just format here
    if (type === 'WEIGHT') {
      // Ensure weight is rounded to nearest 0.1
      const roundedValue = Math.ceil(value * 10) / 10;
      return `${roundedValue} ${unit}`;
    }
    return `${value} ${unit}`;
  };

  const formatBloodPressure = () => {
    const systolicData = getLatestValue('BLOOD_PRESSURE_SYSTOLIC');
    const diastolicData = getLatestValue('BLOOD_PRESSURE_DIASTOLIC');
    
    if (systolicData && diastolicData) {
      return `${systolicData.value}/${diastolicData.value} mmHg`;
    } else if (systolicData) {
      return `${systolicData.value}/-- mmHg`;
    } else if (diastolicData) {
      return `--/${diastolicData.value} mmHg`;
    }
    return 'No data';
  };

  const getBiomarkerIcon = (type: string) => {
    switch (type) {
      case 'WEIGHT': return <ScaleIcon />;
      case 'BLOOD_PRESSURE': return <HeartIcon />;
      case 'GLUCOSE': return <GlucoseIcon />;
      case 'KETONES': return <KetoneIcon />;
      default: return <TrendingUpIcon />;
    }
  };

  const getBiomarkerTitle = (type: string) => {
    switch (type) {
      case 'WEIGHT': return 'Weight';
      case 'BLOOD_PRESSURE': return 'Blood Pressure';
      case 'GLUCOSE': return 'Glucose';
      case 'KETONES': return 'Ketones';
      default: return type;
    }
  };

  const calculateBodyComposition = () => {
    const latestWeight = getLatestRawValue('WEIGHT');
    if (!latestWeight || !userDetails.height || !userDetails.dateOfBirth || !userDetails.gender) {
      return null;
    }

    // Convert to kg for calculations if needed
    let weightInKg = latestWeight.value;
    if (latestWeight.unit === 'lbs') {
      weightInKg = convertWeightToMetric(latestWeight.value);
    }

    const age = new Date().getFullYear() - new Date(userDetails.dateOfBirth).getFullYear();
    const bodyFatPercentage = calculateBodyFatPercentage(
      weightInKg,
      userDetails.height,
      age,
      userDetails.gender
    );
    const muscleMass = calculateMuscleMass(weightInKg, bodyFatPercentage);

    return {
      bodyFatPercentage,
      muscleMass
    };
  };

  const getBodyCompositionHistory = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const allWeightEntries = biomarkers.filter(b => b.type === 'WEIGHT');
    const hasEntriesBeforeToday = allWeightEntries.some(b => {
      const entryDate = new Date(b.loggedAt);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate < today;
    });
    
    const filteredWeightData = biomarkers
      .filter(b => b.type === 'WEIGHT')
      .filter(b => {
        if (!hasEntriesBeforeToday) {
          const entryDate = new Date(b.loggedAt);
          entryDate.setHours(0, 0, 0, 0);
          return entryDate >= today;
        }
        return true;
      })
      .sort((a, b) => new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime());
    
    if (!filteredWeightData.length || !userDetails.height || !userDetails.dateOfBirth || !userDetails.gender) {
      return [];
    }

    const age = new Date().getFullYear() - new Date(userDetails.dateOfBirth).getFullYear();
    
    return filteredWeightData.map(entry => {
      // Convert to kg for calculations
      let weightInKg = entry.value;
      if (entry.unit === 'lbs') {
        weightInKg = convertWeightToMetric(entry.value);
      }
      
      const bodyFatPercentage = calculateBodyFatPercentage(
        weightInKg,
        userDetails.height!,
        age,
        userDetails.gender!
      );
      const muscleMass = calculateMuscleMass(weightInKg, bodyFatPercentage);
      
      return {
        date: new Date(entry.loggedAt).toLocaleDateString(),
        bodyFat: bodyFatPercentage,
        muscleMass: useMetricUnits 
          ? Math.ceil(muscleMass * 10) / 10 
          : Math.ceil(convertWeightToAmerican(muscleMass) * 10) / 10,
        weight: useMetricUnits 
          ? Math.ceil(weightInKg * 10) / 10 
          : Math.ceil(convertWeightToAmerican(weightInKg) * 10) / 10
      };
    });
  };

  const renderBiomarkerCard = (type: string) => {
    const data = getBiomarkerData(type);
    const latest = getLatestValue(type);
    const chartData = data.slice(-10); // Last 10 entries

    return (
      <Card key={type}>
        <CardHeader
          title={
            <Box display="flex" alignItems="center" gap={1}>
              {getBiomarkerIcon(type)}
              {getBiomarkerTitle(type)}
            </Box>
          }
          action={
            <IconButton onClick={() => {
              const unit = type === 'WEIGHT' 
                ? (useMetricUnits ? 'kg' : 'lbs')
                : type === 'BLOOD_PRESSURE' 
                  ? 'mmHg'
                  : 'mg/dL';
              setNewBiomarker({ type, value: 0, unit, notes: '' });
              setShowAddDialog(true);
            }}>
              <AddIcon />
            </IconButton>
          }
        />
        <CardContent>
          {type === 'BLOOD_PRESSURE' ? (
            (() => {
              const systolicData = getLatestValue('BLOOD_PRESSURE_SYSTOLIC');
              const diastolicData = getLatestValue('BLOOD_PRESSURE_DIASTOLIC');
              const hasData = systolicData || diastolicData;
              
              if (!hasData) {
                return (
                  <Box textAlign="center" py={3}>
                    <Typography variant="body2" color="text.secondary">
                      No data logged yet
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={() => {
                        setNewBiomarker({ type: 'BLOOD_PRESSURE', value: 0, unit: 'mmHg', notes: '' });
                        setShowAddDialog(true);
                      }}
                      sx={{ mt: 1 }}
                    >
                      Log First Entry
                    </Button>
                  </Box>
                );
              }
              
              // Get chart data for blood pressure
              const systolicChartData = getBiomarkerData('BLOOD_PRESSURE_SYSTOLIC').slice(-10);
              const diastolicChartData = getBiomarkerData('BLOOD_PRESSURE_DIASTOLIC').slice(-10);
              
              return (
                <Box>
                  <Typography variant="h4" gutterBottom>
                    {formatBloodPressure()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Last logged: {(() => {
                      const latestDate = systolicData && diastolicData 
                        ? new Date(Math.max(
                            new Date(systolicData.date).getTime(),
                            new Date(diastolicData.date).getTime()
                          ))
                        : systolicData 
                          ? new Date(systolicData.date)
                          : diastolicData 
                            ? new Date(diastolicData.date)
                            : null;
                      return latestDate ? latestDate.toLocaleDateString() : 'No data';
                    })()}
                  </Typography>
                  
                  {(systolicChartData.length > 1 || diastolicChartData.length > 1) && (
                    <Box mt={2} height={200}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={systolicChartData.length > diastolicChartData.length ? systolicChartData : diastolicChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          {systolicChartData.length > 1 && (
                            <Line type="monotone" dataKey="value" stroke="#ff6b6b" name="Systolic" />
                          )}
                          {diastolicChartData.length > 1 && (
                            <Line type="monotone" dataKey="value" stroke="#4ecdc4" name="Diastolic" />
                          )}
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  )}
                </Box>
              );
            })()
          ) : latest ? (
            <Box>
              <Typography variant="h4" gutterBottom>
                {formatValue(latest.value, latest.unit, type)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Last logged: {new Date(latest.date).toLocaleDateString()}
              </Typography>
              
              {chartData.length > 1 && (
                <Box mt={2} height={200}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="value" stroke="#8884d8" name={getBiomarkerTitle(type)} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </Box>
          ) : (
            <Box textAlign="center" py={3}>
              <Typography variant="body2" color="text.secondary">
                No data logged yet
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => {
                  const unit = type === 'WEIGHT' 
                    ? (useMetricUnits ? 'kg' : 'lbs')
                    : type === 'BLOOD_PRESSURE' 
                      ? 'mmHg'
                      : 'mg/dL';
                  setNewBiomarker({ type, value: 0, unit, notes: '' });
                  setShowAddDialog(true);
                }}
                sx={{ mt: 1 }}
              >
                Log First Entry
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    );
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" gutterBottom>
            Health Metrics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track your weight, blood pressure, glucose, and ketones over time
          </Typography>
        </Box>
        <FormControl size="small">
          <InputLabel>Units</InputLabel>
          <Select
            value={useMetricUnits ? 'metric' : 'imperial'}
            onChange={(e) => setUseMetricUnits(e.target.value === 'metric')}
            label="Units"
          >
            <MenuItem value="imperial">Imperial (lbs)</MenuItem>
            <MenuItem value="metric">Metric (kg)</MenuItem>
          </Select>
        </FormControl>
      </Box>

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
        <Grid item xs={12} md={6}>
          {renderBiomarkerCard('WEIGHT')}
        </Grid>
        <Grid item xs={12} md={6}>
          {renderBiomarkerCard('BLOOD_PRESSURE')}
        </Grid>
        <Grid item xs={12} md={6}>
          {renderBiomarkerCard('GLUCOSE')}
        </Grid>
        <Grid item xs={12} md={6}>
          {renderBiomarkerCard('KETONES')}
        </Grid>
        
        {/* Body Composition */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title={
                <Box display="flex" alignItems="center" gap={1}>
                  <TrendingUpIcon />
                  Body Composition
                </Box>
              }
            />
            <CardContent>
              {(() => {
                const composition = calculateBodyComposition();
                const compositionHistory = getBodyCompositionHistory();
                
                if (!composition) {
                  return (
                    <Box textAlign="center" py={3}>
                      <Typography variant="body2" color="text.secondary">
                        Complete your profile information and log weight to see body composition
                      </Typography>
                    </Box>
                  );
                }
                
                return (
                  <Box>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="h6" color="primary">
                          Body Fat
                        </Typography>
                        <Typography variant="h4">
                          {composition.bodyFatPercentage.toFixed(1)}%
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="h6" color="primary">
                          Muscle Mass
                        </Typography>
                        <Typography variant="h4">
                          {useMetricUnits 
                            ? `${Math.ceil(composition.muscleMass * 10) / 10} kg`
                            : `${Math.ceil(convertWeightToAmerican(composition.muscleMass) * 10) / 10} lbs`
                          }
                        </Typography>
                      </Grid>
                    </Grid>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                      Calculated from your latest weight, height, age, and gender
                    </Typography>
                    
                    {compositionHistory.length > 1 && (
                      <Box mt={2} height={200}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={compositionHistory.slice(-10)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis yAxisId="left" />
                            <YAxis yAxisId="right" orientation="right" />
                            <Tooltip />
                            <Legend />
                            <Line 
                              yAxisId="left"
                              type="monotone" 
                              dataKey="bodyFat" 
                              stroke="#ff6b6b" 
                              name="Body Fat %" 
                            />
                            <Line 
                              yAxisId="right"
                              type="monotone" 
                              dataKey="muscleMass" 
                              stroke="#4ecdc4" 
                              name={`Muscle Mass (${useMetricUnits ? 'kg' : 'lbs'})`} 
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </Box>
                    )}
                  </Box>
                );
              })()}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Add Biomarker Dialog */}
      <Dialog open={showAddDialog} onClose={() => setShowAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Log New {getBiomarkerTitle(newBiomarker.type || '')} Entry</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {newBiomarker.type === 'BLOOD_PRESSURE' ? (
              <>
                <TextField
                  label="Systolic (top number)"
                  type="number"
                  value={bloodPressure.systolic}
                  onChange={(e) => setBloodPressure(prev => ({ 
                    ...prev, 
                    systolic: e.target.value 
                  }))}
                  fullWidth
                  inputProps={{ 
                    min: 70, 
                    max: 200,
                    step: 1
                  }}
                  helperText="Enter your systolic blood pressure (e.g., 120)"
                />
                <TextField
                  label="Diastolic (bottom number)"
                  type="number"
                  value={bloodPressure.diastolic}
                  onChange={(e) => setBloodPressure(prev => ({ 
                    ...prev, 
                    diastolic: e.target.value 
                  }))}
                  fullWidth
                  inputProps={{ 
                    min: 40, 
                    max: 130,
                    step: 1
                  }}
                  helperText="Enter your diastolic blood pressure (e.g., 80)"
                />
              </>
            ) : (
              <TextField
                label="Value"
                type="number"
                value={newBiomarker.value || ''}
                onChange={(e) => setNewBiomarker(prev => ({ 
                  ...prev, 
                  value: parseFloat(e.target.value) || 0 
                }))}
                fullWidth
                inputProps={{ 
                  min: 0, 
                  max: newBiomarker.type === 'WEIGHT' ? 500 : 1000,
                  step: 0.1
                }}
                helperText={`Enter your ${getBiomarkerTitle(newBiomarker.type || '')} in ${newBiomarker.unit}`}
              />
            )}

            <TextField
              label="Notes (optional)"
              multiline
              rows={2}
              value={newBiomarker.notes || ''}
              onChange={(e) => setNewBiomarker(prev => ({ 
                ...prev, 
                notes: e.target.value 
              }))}
              fullWidth
              placeholder="Any additional notes about this measurement..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleAddBiomarker} 
            variant="contained"
            disabled={saving}
          >
            {saving ? 'Logging...' : 'Log Entry'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 