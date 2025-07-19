'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Stack,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as RemoveIcon,
  HealthAndSafety as HealthIcon
} from '@mui/icons-material';
import { useAuth } from '@/context/AuthContext';

interface Biomarker {
  id: string;
  type: string;
  value: number;
  unit: string;
  notes?: string;
  loggedAt: string;
  photoUrl?: string;
}

const BIOMARKER_TYPES = [
  { value: 'WEIGHT', label: 'Weight', unit: 'kg', normalRange: '50-100' },
  { value: 'BLOOD_PRESSURE', label: 'Blood Pressure', unit: 'mmHg', normalRange: '90/60-140/90' },
  { value: 'HEART_RATE', label: 'Heart Rate', unit: 'bpm', normalRange: '60-100' },
  { value: 'BLOOD_SUGAR', label: 'Blood Sugar', unit: 'mg/dL', normalRange: '70-140' },
  { value: 'CHOLESTEROL_TOTAL', label: 'Total Cholesterol', unit: 'mg/dL', normalRange: '<200' },
  { value: 'CHOLESTEROL_HDL', label: 'HDL Cholesterol', unit: 'mg/dL', normalRange: '>40' },
  { value: 'CHOLESTEROL_LDL', label: 'LDL Cholesterol', unit: 'mg/dL', normalRange: '<100' },
  { value: 'TRIGLYCERIDES', label: 'Triglycerides', unit: 'mg/dL', normalRange: '<150' },
  { value: 'BODY_FAT', label: 'Body Fat %', unit: '%', normalRange: '10-25' },
  { value: 'MUSCLE_MASS', label: 'Muscle Mass', unit: 'kg', normalRange: '30-50' },
  { value: 'BODY_TEMPERATURE', label: 'Body Temperature', unit: '°F', normalRange: '97-99' },
  { value: 'OXYGEN_SATURATION', label: 'Oxygen Saturation', unit: '%', normalRange: '95-100' },
  { value: 'VITAMIN_D', label: 'Vitamin D', unit: 'ng/mL', normalRange: '30-100' },
  { value: 'IRON', label: 'Iron', unit: 'µg/dL', normalRange: '60-170' },
  { value: 'CUSTOM', label: 'Custom', unit: '', normalRange: '' }
];

export default function HealthMetricsTab() {
  const { user } = useAuth();
  const [biomarkers, setBiomarkers] = useState<Biomarker[]>([]);
  const [loading, setLoading] = useState(false);
  const [addDialog, setAddDialog] = useState(false);
  const [editingBiomarker, setEditingBiomarker] = useState<Biomarker | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [biomarkerType, setBiomarkerType] = useState('WEIGHT');
  const [biomarkerValue, setBiomarkerValue] = useState('');
  const [biomarkerUnit, setBiomarkerUnit] = useState('');
  const [biomarkerNotes, setBiomarkerNotes] = useState('');
  const [customType, setCustomType] = useState('');

  useEffect(() => {
    if (user) {
      loadBiomarkers();
    }
  }, [user]);

  const loadBiomarkers = async () => {
    try {
      setLoading(true);
      // This would load from your API
      // For now, using mock data
      const mockBiomarkers: Biomarker[] = [
        {
          id: '1',
          type: 'WEIGHT',
          value: 75.5,
          unit: 'kg',
          notes: 'Morning weight after workout',
          loggedAt: '2025-01-20T08:00:00Z'
        },
        {
          id: '2',
          type: 'BLOOD_PRESSURE',
          value: 120,
          unit: 'mmHg',
          notes: 'Systolic pressure',
          loggedAt: '2025-01-20T09:00:00Z'
        }
      ];
      
      setBiomarkers(mockBiomarkers);
    } catch (error) {
      console.error('Error loading biomarkers:', error);
      setError('Failed to load health metrics');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBiomarker = () => {
    setBiomarkerType('WEIGHT');
    setBiomarkerValue('');
    setBiomarkerUnit('');
    setBiomarkerNotes('');
    setCustomType('');
    setEditingBiomarker(null);
    setAddDialog(true);
  };

  const handleEditBiomarker = (biomarker: Biomarker) => {
    setBiomarkerType(biomarker.type);
    setBiomarkerValue(biomarker.value.toString());
    setBiomarkerUnit(biomarker.unit);
    setBiomarkerNotes(biomarker.notes || '');
    setCustomType(biomarker.type === 'CUSTOM' ? biomarker.type : '');
    setEditingBiomarker(biomarker);
    setAddDialog(true);
  };

  const handleSaveBiomarker = async () => {
    if (!biomarkerValue || !biomarkerUnit) {
      setError('Value and unit are required');
      return;
    }

    try {
      const newBiomarker: Biomarker = {
        id: editingBiomarker?.id || Date.now().toString(),
        type: biomarkerType === 'CUSTOM' ? customType : biomarkerType,
        value: parseFloat(biomarkerValue),
        unit: biomarkerUnit,
        notes: biomarkerNotes,
        loggedAt: new Date().toISOString()
      };

      // This would save to your API
      if (editingBiomarker) {
        setBiomarkers(prev => prev.map(b => b.id === editingBiomarker.id ? newBiomarker : b));
        setSuccess('Biomarker updated successfully!');
      } else {
        setBiomarkers(prev => [...prev, newBiomarker]);
        setSuccess('Biomarker added successfully!');
      }
      
      setAddDialog(false);
    } catch (error) {
      setError('Failed to save biomarker');
    }
  };

  const handleDeleteBiomarker = async (biomarkerId: string) => {
    try {
      // This would delete from your API
      setBiomarkers(prev => prev.filter(b => b.id !== biomarkerId));
      setSuccess('Biomarker removed successfully!');
    } catch (error) {
      setError('Failed to remove biomarker');
    }
  };

  const getBiomarkerTypeInfo = (type: string) => {
    return BIOMARKER_TYPES.find(t => t.value === type) || BIOMARKER_TYPES[0];
  };

  const getBiomarkerStatus = (biomarker: Biomarker) => {
    const typeInfo = getBiomarkerTypeInfo(biomarker.type);
    if (!typeInfo.normalRange) return 'normal';

    const range = typeInfo.normalRange;
    const value = biomarker.value;

    if (range.includes('<')) {
      const threshold = parseFloat(range.replace('<', ''));
      return value < threshold ? 'normal' : 'high';
    } else if (range.includes('>')) {
      const threshold = parseFloat(range.replace('>', ''));
      return value > threshold ? 'normal' : 'low';
    } else if (range.includes('-')) {
      const [min, max] = range.split('-').map(v => parseFloat(v));
      if (value >= min && value <= max) return 'normal';
      return value < min ? 'low' : 'high';
    }

    return 'normal';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'high':
        return <TrendingUpIcon color="error" />;
      case 'low':
        return <TrendingDownIcon color="warning" />;
      default:
        return <RemoveIcon color="success" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'high':
        return 'error';
      case 'low':
        return 'warning';
      default:
        return 'success';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const groupedBiomarkers = biomarkers.reduce((groups, biomarker) => {
    const type = biomarker.type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(biomarker);
    return groups;
  }, {} as Record<string, Biomarker[]>);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Health Metrics & Biomarkers
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Add Biomarker Button */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">
                  Track Your Health Metrics
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddBiomarker}
                >
                  Add Biomarker
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Biomarkers by Type */}
        {loading ? (
          <Grid item xs={12}>
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          </Grid>
        ) : Object.keys(groupedBiomarkers).length === 0 ? (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary" align="center" py={3}>
                  No health metrics recorded yet. Click "Add Biomarker" to start tracking your health data.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ) : (
          Object.entries(groupedBiomarkers).map(([type, typeBiomarkers]) => (
            <Grid item xs={12} md={6} key={type}>
              <Card>
                <CardHeader
                  title={getBiomarkerTypeInfo(type).label}
                  subheader={`${typeBiomarkers.length} measurements`}
                  avatar={<HealthIcon />}
                />
                <CardContent>
                  <List dense>
                    {typeBiomarkers
                      .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())
                      .map((biomarker) => {
                        const status = getBiomarkerStatus(biomarker);
                        return (
                          <ListItem
                            key={biomarker.id}
                            sx={{
                              border: 1,
                              borderColor: 'divider',
                              borderRadius: 1,
                              mb: 1,
                              '&:hover': { bgcolor: 'action.hover' }
                            }}
                          >
                            <ListItemText
                              primary={
                                <Box display="flex" alignItems="center" gap={1}>
                                  {getStatusIcon(status)}
                                  <Typography variant="body1">
                                    {biomarker.value} {biomarker.unit}
                                  </Typography>
                                  <Chip
                                    label={status.toUpperCase()}
                                    color={getStatusColor(status) as any}
                                    size="small"
                                  />
                                </Box>
                              }
                              secondary={
                                <Box>
                                  <Typography variant="body2" color="text.secondary">
                                    {formatDate(biomarker.loggedAt)}
                                  </Typography>
                                  {biomarker.notes && (
                                    <Typography variant="body2" color="text.secondary">
                                      {biomarker.notes}
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                            <ListItemSecondaryAction>
                              <IconButton
                                size="small"
                                onClick={() => handleEditBiomarker(biomarker)}
                                sx={{ mr: 1 }}
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteBiomarker(biomarker.id)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        );
                      })}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* Add/Edit Biomarker Dialog */}
      <Dialog open={addDialog} onClose={() => setAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingBiomarker ? 'Edit Biomarker' : 'Add New Biomarker'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Biomarker Type</InputLabel>
              <Select
                value={biomarkerType}
                onChange={(e) => {
                  setBiomarkerType(e.target.value);
                  const typeInfo = getBiomarkerTypeInfo(e.target.value);
                  setBiomarkerUnit(typeInfo.unit);
                }}
                label="Biomarker Type"
              >
                {BIOMARKER_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {biomarkerType === 'CUSTOM' && (
              <TextField
                label="Custom Type Name"
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                fullWidth
                placeholder="e.g., Vitamin B12, Testosterone, etc."
              />
            )}

            <TextField
              label="Value"
              type="number"
              value={biomarkerValue}
              onChange={(e) => setBiomarkerValue(e.target.value)}
              fullWidth
              placeholder="Enter the measurement value"
            />

            <TextField
              label="Unit"
              value={biomarkerUnit}
              onChange={(e) => setBiomarkerUnit(e.target.value)}
              fullWidth
              placeholder="e.g., kg, mg/dL, bpm, etc."
            />

            <TextField
              label="Notes (optional)"
              multiline
              rows={3}
              value={biomarkerNotes}
              onChange={(e) => setBiomarkerNotes(e.target.value)}
              fullWidth
              placeholder="Add any notes about this measurement..."
            />

            {biomarkerType !== 'CUSTOM' && (
              <Alert severity="info">
                Normal range: {getBiomarkerTypeInfo(biomarkerType).normalRange}
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveBiomarker} variant="contained">
            {editingBiomarker ? 'Update' : 'Add'} Biomarker
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 