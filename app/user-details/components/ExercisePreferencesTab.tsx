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
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Pagination,
  Stack,
  InputAdornment
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Favorite as LikeIcon,
  FavoriteBorder as DislikeIcon,
  Block as CannotDoIcon,
  Build as ModifiedIcon
} from '@mui/icons-material';
import { useAuth } from '@/context/AuthContext';

interface Exercise {
  id: string;
  activity: string;
  code: string;
  met: number;
  description: string;
  category: string;
  intensity: string;
}

interface ExercisePreference {
  id: string;
  exerciseId: string;
  preference: 'LIKE' | 'DISLIKE' | 'CANNOT_DO' | 'MODIFIED';
  notes?: string;
  exercise: Exercise;
}

const PREFERENCE_TYPES = [
  { value: 'LIKE', label: 'Like', color: 'success', icon: <LikeIcon /> },
  { value: 'DISLIKE', label: 'Dislike', color: 'error', icon: <DislikeIcon /> },
  { value: 'CANNOT_DO', label: 'Cannot Do', color: 'warning', icon: <CannotDoIcon /> },
  { value: 'MODIFIED', label: 'Modified', color: 'info', icon: <ModifiedIcon /> }
];

const INTENSITY_COLORS = {
  'LIGHT': 'success',
  'MODERATE': 'warning',
  'VIGOROUS': 'error'
};

export default function ExercisePreferencesTab() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Exercise[]>([]);
  const [preferences, setPreferences] = useState<ExercisePreference[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [preferenceDialog, setPreferenceDialog] = useState(false);
  const [editingPreference, setEditingPreference] = useState<ExercisePreference | null>(null);
  const [preferenceType, setPreferenceType] = useState('LIKE');
  const [preferenceNotes, setPreferenceNotes] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const itemsPerPage = 10;

  useEffect(() => {
    if (user) {
      loadPreferences();
    }
  }, [user]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/exercise-preferences');
      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences || []);
        setTotalPages(Math.ceil((data.preferences || []).length / itemsPerPage));
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      setError('Failed to load exercise preferences');
    } finally {
      setLoading(false);
    }
  };

  const searchExercises = async (term: string) => {
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(`/api/exercises/search?q=${encodeURIComponent(term)}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.exercises || []);
      }
    } catch (error) {
      console.error('Error searching exercises:', error);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
    searchExercises(value);
  };

  const handleAddPreference = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setPreferenceType('LIKE');
    setPreferenceNotes('');
    setEditingPreference(null);
    setPreferenceDialog(true);
  };

  const handleEditPreference = (preference: ExercisePreference) => {
    setSelectedExercise(preference.exercise);
    setPreferenceType(preference.preference);
    setPreferenceNotes(preference.notes || '');
    setEditingPreference(preference);
    setPreferenceDialog(true);
  };

  const handleSavePreference = async () => {
    if (!selectedExercise) return;

    try {
      const method = editingPreference ? 'PUT' : 'POST';
      const url = editingPreference 
        ? `/api/exercise-preferences/${editingPreference.id}`
        : '/api/exercise-preferences';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exerciseId: selectedExercise.id,
          preference: preferenceType,
          notes: preferenceNotes
        })
      });

      if (response.ok) {
        setSuccess(editingPreference ? 'Preference updated!' : 'Preference added!');
        setPreferenceDialog(false);
        loadPreferences();
        setSearchTerm('');
        setSearchResults([]);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save preference');
      }
    } catch (error) {
      setError('An error occurred while saving');
    }
  };

  const handleDeletePreference = async (preferenceId: string) => {
    try {
      const response = await fetch(`/api/exercise-preferences/${preferenceId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setSuccess('Preference removed!');
        loadPreferences();
      } else {
        setError('Failed to remove preference');
      }
    } catch (error) {
      setError('An error occurred while removing preference');
    }
  };

  const getPreferenceIcon = (type: string) => {
    const preference = PREFERENCE_TYPES.find(p => p.value === type);
    return preference?.icon || <LikeIcon />;
  };

  const getPreferenceColor = (type: string) => {
    const preference = PREFERENCE_TYPES.find(p => p.value === type);
    return preference?.color || 'default';
  };

  const paginatedPreferences = preferences.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Exercise Preferences & Limitations
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
        {/* Search Section */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Search & Add Exercise Preferences" />
            <CardContent>
              <TextField
                fullWidth
                label="Search exercises"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Type to search for exercises..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
              
              {searchResults.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Search Results:
                  </Typography>
                  <List dense>
                    {searchResults.map((exercise) => (
                      <ListItem
                        key={exercise.id}
                        sx={{
                          border: 1,
                          borderColor: 'divider',
                          borderRadius: 1,
                          mb: 1,
                          '&:hover': { bgcolor: 'action.hover' }
                        }}
                      >
                        <ListItemText
                          primary={exercise.activity}
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {exercise.category} • MET: {exercise.met} • {exercise.intensity}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {exercise.description}
                              </Typography>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Button
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={() => handleAddPreference(exercise)}
                          >
                            Add Preference
                          </Button>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Preferences List */}
        <Grid item xs={12}>
          <Card>
            <CardHeader 
              title="Your Exercise Preferences" 
              subheader={`${preferences.length} preferences saved`}
            />
            <CardContent>
              {loading ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              ) : preferences.length === 0 ? (
                <Typography variant="body2" color="text.secondary" align="center" py={3}>
                  No exercise preferences saved yet. Search for exercises above to add your preferences.
                </Typography>
              ) : (
                <>
                  <List>
                    {paginatedPreferences.map((preference) => (
                      <ListItem
                        key={preference.id}
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
                              {getPreferenceIcon(preference.preference)}
                              <Typography variant="body1">
                                {preference.exercise.activity}
                              </Typography>
                              <Chip
                                label={PREFERENCE_TYPES.find(p => p.value === preference.preference)?.label}
                                color={getPreferenceColor(preference.preference) as any}
                                size="small"
                              />
                              <Chip
                                label={preference.exercise.intensity}
                                color={INTENSITY_COLORS[preference.exercise.intensity as keyof typeof INTENSITY_COLORS] as any}
                                size="small"
                                variant="outlined"
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {preference.exercise.category} • MET: {preference.exercise.met}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {preference.exercise.description}
                              </Typography>
                              {preference.notes && (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                  Notes: {preference.notes}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            size="small"
                            onClick={() => handleEditPreference(preference)}
                            sx={{ mr: 1 }}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeletePreference(preference.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                  
                  {totalPages > 1 && (
                    <Box display="flex" justifyContent="center" mt={2}>
                      <Pagination
                        count={totalPages}
                        page={currentPage}
                        onChange={(_, page) => setCurrentPage(page)}
                        color="primary"
                      />
                    </Box>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Preference Dialog */}
      <Dialog open={preferenceDialog} onClose={() => setPreferenceDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingPreference ? 'Edit Exercise Preference' : 'Add Exercise Preference'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {selectedExercise && (
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  {selectedExercise.activity}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedExercise.category} • MET: {selectedExercise.met} • {selectedExercise.intensity}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedExercise.description}
                </Typography>
              </Box>
            )}
            
            <FormControl fullWidth>
              <InputLabel>Preference Type</InputLabel>
              <Select
                value={preferenceType}
                onChange={(e) => setPreferenceType(e.target.value)}
                label="Preference Type"
              >
                {PREFERENCE_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    <Box display="flex" alignItems="center" gap={1}>
                      {type.icon}
                      {type.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              label="Notes (optional)"
              multiline
              rows={3}
              value={preferenceNotes}
              onChange={(e) => setPreferenceNotes(e.target.value)}
              fullWidth
              placeholder="Add any additional notes about this preference, modifications needed, or reasons..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreferenceDialog(false)}>Cancel</Button>
          <Button onClick={handleSavePreference} variant="contained">
            {editingPreference ? 'Update' : 'Add'} Preference
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 