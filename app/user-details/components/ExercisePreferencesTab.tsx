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
  InputAdornment,
  Paper,
  Slider,
  Collapse
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Favorite as LikeIcon,
  FavoriteBorder as DislikeIcon,
  Block as CannotDoIcon,
  Build as ModifiedIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon
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
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [preferences, setPreferences] = useState<ExercisePreference[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [preferenceDialog, setPreferenceDialog] = useState(false);
  const [editingPreference, setEditingPreference] = useState<ExercisePreference | null>(null);
  const [preferenceType, setPreferenceType] = useState('LIKE');
  const [preferenceNotes, setPreferenceNotes] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [intensityFilter, setIntensityFilter] = useState('');
  const [metRange, setMetRange] = useState([0, 20]);
  const [preferenceTypeFilter, setPreferenceTypeFilter] = useState('');

  // Enhanced filter states
  const [equipmentFilter, setEquipmentFilter] = useState<string[]>([]);
  const [bodyPartsFilter, setBodyPartsFilter] = useState<string[]>([]);
  const [exerciseTypeFilter, setExerciseTypeFilter] = useState<string[]>([]);
  const [difficultyFilter, setDifficultyFilter] = useState<string[]>([]);

  // Available categories and intensities
  const [categories, setCategories] = useState<string[]>([]);
  const [intensities, setIntensities] = useState<string[]>([]);

  // Enhanced filter options
  const equipmentOptions = [
    { value: 'none', label: 'No Equipment' },
    { value: 'dumbbells', label: 'Dumbbells' },
    { value: 'barbell', label: 'Barbell' },
    { value: 'resistance-bands', label: 'Resistance Bands' },
    { value: 'cardio-machine', label: 'Cardio Machine' },
    { value: 'bodyweight', label: 'Bodyweight Only' }
  ];

  const bodyPartsOptions = [
    { value: 'legs', label: 'Legs' },
    { value: 'arms', label: 'Arms' },
    { value: 'chest', label: 'Chest' },
    { value: 'back', label: 'Back' },
    { value: 'shoulders', label: 'Shoulders' },
    { value: 'core', label: 'Core' },
    { value: 'full-body', label: 'Full Body' }
  ];

  const exerciseTypeOptions = [
    { value: 'strength', label: 'Strength Training' },
    { value: 'cardio', label: 'Cardio' },
    { value: 'flexibility', label: 'Flexibility' },
    { value: 'balance', label: 'Balance' },
    { value: 'sports', label: 'Sports' }
  ];

  const difficultyOptions = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' }
  ];

  const itemsPerPage = 20;

  useEffect(() => {
    if (user) {
      loadCategoriesAndIntensities();
      loadPreferences();
      loadAllExercises();
    }
  }, [user]);

  useEffect(() => {
    // Reset to page 1 when filters change
    setCurrentPage(1);
    loadExercises();
  }, [searchTerm, categoryFilter, intensityFilter, metRange, equipmentFilter, bodyPartsFilter, exerciseTypeFilter, difficultyFilter]);

  const loadCategoriesAndIntensities = async () => {
    try {
      const response = await fetch('/api/exercises/search?loadCategories=true&loadIntensities=true');
      if (response.ok) {
        const data = await response.json();
        const exercises = data.exercises || [];
        
        // Extract unique categories and intensities
        const uniqueCategories = Array.from(new Set(exercises.map((e: any) => e.category).filter(Boolean)));
        const uniqueIntensities = Array.from(new Set(exercises.map((e: any) => e.intensity).filter(Boolean)));
        
        setCategories(uniqueCategories.sort());
        setIntensities(uniqueIntensities.sort());
      }
    } catch (error) {
      console.error('Error loading categories and intensities:', error);
    }
  };

  const loadAllExercises = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/exercises/search?limit=1000');
      if (response.ok) {
        const data = await response.json();
        setAllExercises(data.exercises || []);
      }
    } catch (error) {
      console.error('Error loading all exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExercises = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString()
      });

      if (searchTerm) {
        params.append('q', searchTerm);
      }

      if (categoryFilter) {
        params.append('category', categoryFilter);
      }

      if (intensityFilter) {
        params.append('intensity', intensityFilter);
      }

      // Add MET filters
      if (metRange[0] > 0 || metRange[1] < 20) {
        params.append('met', `${metRange[0]}-${metRange[1]}`);
      }

      const response = await fetch(`/api/exercises/search?${params}`);
      if (response.ok) {
        const data = await response.json();
        const exercises = data.exercises || [];
        
        // Apply enhanced filters client-side
        let filteredExercises = exercises;
        
        if (equipmentFilter.length > 0) {
          filteredExercises = filteredExercises.filter((exercise: Exercise) => {
            return equipmentFilter.some(equipment => {
              const activity = exercise.activity.toLowerCase();
              const description = exercise.description.toLowerCase();
              
              switch (equipment) {
                case 'none':
                  return !activity.includes('dumbbell') && !activity.includes('barbell') && 
                         !activity.includes('machine') && !activity.includes('equipment');
                case 'dumbbells':
                  return activity.includes('dumbbell') || description.includes('dumbbell');
                case 'barbell':
                  return activity.includes('barbell') || description.includes('barbell');
                case 'resistance-bands':
                  return activity.includes('band') || activity.includes('resistance') || 
                         description.includes('band') || description.includes('resistance');
                case 'cardio-machine':
                  return activity.includes('treadmill') || activity.includes('bike') || 
                         activity.includes('elliptical') || activity.includes('rower');
                case 'bodyweight':
                  return activity.includes('push-up') || activity.includes('pull-up') || 
                         activity.includes('squat') || activity.includes('plank');
                default:
                  return true;
              }
            });
          });
        }

        if (bodyPartsFilter.length > 0) {
          filteredExercises = filteredExercises.filter((exercise: Exercise) => {
            return bodyPartsFilter.some(part => {
              const activity = exercise.activity.toLowerCase();
              const description = exercise.description.toLowerCase();
              
              switch (part) {
                case 'legs':
                  return activity.includes('squat') || activity.includes('lunge') || 
                         activity.includes('leg') || activity.includes('calf') ||
                         activity.includes('running') || activity.includes('walking');
                case 'arms':
                  return activity.includes('curl') || activity.includes('press') || 
                         activity.includes('arm') || activity.includes('bicep') ||
                         activity.includes('tricep');
                case 'chest':
                  return activity.includes('push-up') || activity.includes('bench') || 
                         activity.includes('chest') || activity.includes('pec');
                case 'back':
                  return activity.includes('pull-up') || activity.includes('row') || 
                         activity.includes('back') || activity.includes('lat');
                case 'shoulders':
                  return activity.includes('shoulder') || activity.includes('deltoid') || 
                         activity.includes('press') || activity.includes('raise');
                case 'core':
                  return activity.includes('plank') || activity.includes('crunch') || 
                         activity.includes('sit-up') || activity.includes('core') ||
                         activity.includes('abdominal');
                case 'full-body':
                  return activity.includes('burpee') || activity.includes('mountain climber') || 
                         activity.includes('jumping jack') || activity.includes('full body');
                default:
                  return true;
              }
            });
          });
        }

        if (exerciseTypeFilter.length > 0) {
          filteredExercises = filteredExercises.filter((exercise: Exercise) => {
            return exerciseTypeFilter.some(type => {
              const category = exercise.category.toLowerCase();
              const activity = exercise.activity.toLowerCase();
              
              switch (type) {
                case 'strength':
                  return category.includes('strength') || category.includes('weight') || 
                         activity.includes('lift') || activity.includes('press');
                case 'cardio':
                  return category.includes('cardio') || activity.includes('running') || 
                         activity.includes('walking') || activity.includes('cycling') ||
                         activity.includes('swimming');
                case 'flexibility':
                  return category.includes('flexibility') || activity.includes('stretch') || 
                         activity.includes('yoga') || activity.includes('pilates');
                case 'balance':
                  return category.includes('balance') || activity.includes('balance') || 
                         activity.includes('stability');
                case 'sports':
                  return category.includes('sport') || activity.includes('tennis') || 
                         activity.includes('basketball') || activity.includes('soccer');
                default:
                  return true;
              }
            });
          });
        }

        if (difficultyFilter.length > 0) {
          filteredExercises = filteredExercises.filter((exercise: Exercise) => {
            return difficultyFilter.some(difficulty => {
              const met = exercise.met;
              
              switch (difficulty) {
                case 'beginner':
                  return met <= 3;
                case 'intermediate':
                  return met > 3 && met <= 8;
                case 'advanced':
                  return met > 8;
                default:
                  return true;
              }
            });
          });
        }

        setSearchResults(filteredExercises);
        
        // Calculate pagination
        const total = filteredExercises.length;
        setTotalItems(total);
        setTotalPages(Math.ceil(total / itemsPerPage));
      }
    } catch (error) {
      console.error('Error loading exercises:', error);
      setError('Failed to load exercises');
    } finally {
      setLoading(false);
    }
  };

  const loadPreferences = async () => {
    try {
      const response = await fetch('/api/exercise-preferences');
      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences || []);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setIntensityFilter('');
    setMetRange([0, 20]);
    setEquipmentFilter([]);
    setBodyPartsFilter([]);
    setExerciseTypeFilter([]);
    setDifficultyFilter([]);
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

  // Filter preferences based on preference type filter
  const filteredPreferences = preferences.filter(preference => {
    if (!preferenceTypeFilter) return true;
    return preference.preference === preferenceTypeFilter;
  });

  // Paginate preferences
  const paginatedPreferences = filteredPreferences.slice(
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
              
              {/* Filter Toggle */}
              <Box sx={{ mt: 2, mb: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => setShowFilters(!showFilters)}
                  startIcon={<FilterIcon />}
                  size="small"
                >
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </Button>
                {showFilters && (
                  <Button
                    variant="outlined"
                    onClick={clearFilters}
                    startIcon={<ClearIcon />}
                    size="small"
                    sx={{ ml: 1 }}
                  >
                    Clear Filters
                  </Button>
                )}
              </Box>

              {/* Filter Panel */}
              <Collapse in={showFilters}>
                <Paper sx={{ p: 2, mb: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Search Filters
                  </Typography>
                  
                  <Grid container spacing={2}>
                    {/* Category Filter */}
                    <Grid item xs={12} md={6}>
                      <TextField
                        select
                        fullWidth
                        label="Category"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        size="small"
                      >
                        <MenuItem value="">All Categories</MenuItem>
                        {categories.map((category) => (
                          <MenuItem key={category} value={category}>
                            {category}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>

                    {/* Intensity Filter */}
                    <Grid item xs={12} md={6}>
                      <TextField
                        select
                        fullWidth
                        label="Intensity"
                        value={intensityFilter}
                        onChange={(e) => setIntensityFilter(e.target.value)}
                        size="small"
                      >
                        <MenuItem value="">All Intensities</MenuItem>
                        {intensities.map((intensity) => (
                          <MenuItem key={intensity} value={intensity}>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Chip
                                label={intensity}
                                color={INTENSITY_COLORS[intensity as keyof typeof INTENSITY_COLORS] as any}
                                size="small"
                              />
                            </Box>
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>

                    {/* MET Range */}
                    <Grid item xs={12}>
                      <Typography gutterBottom>
                        MET Value Range: {metRange[0]} - {metRange[1]}
                      </Typography>
                      <Slider
                        value={metRange}
                        onChange={(_, newValue) => setMetRange(newValue as number[])}
                        valueLabelDisplay="auto"
                        min={0}
                        max={20}
                        step={0.1}
                      />
                      <Typography variant="caption" color="text.secondary">
                        MET (Metabolic Equivalent of Task) measures exercise intensity. Higher values = more intense.
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Collapse>
              
              {loading ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              ) : searchResults.length === 0 ? (
                <Typography variant="body2" color="text.secondary" align="center" py={3}>
                  {searchTerm.length === 0 && !categoryFilter && !intensityFilter
                    ? 'Loading exercises...'
                    : searchTerm.length > 0 && searchTerm.length < 2 
                    ? 'Enter at least 2 characters to search for exercises.'
                    : 'No exercises found matching your search criteria.'
                  }
                </Typography>
              ) : (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    {searchTerm || categoryFilter || intensityFilter 
                      ? `Search Results (${searchResults.length} of ${totalItems}):`
                      : `All Exercises (${searchResults.length} of ${totalItems}):`
                    }
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
                                {exercise.category} • MET: {exercise.met} • {exercise.intensity} intensity
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
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
              subheader={`${filteredPreferences.length} preferences saved`}
            />
            <CardContent>
              {/* Preference Type Filter */}
              <Box sx={{ mb: 2 }}>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Filter by Preference Type</InputLabel>
                  <Select
                    value={preferenceTypeFilter}
                    onChange={(e) => setPreferenceTypeFilter(e.target.value)}
                    label="Filter by Preference Type"
                  >
                    <MenuItem value="">All Preferences</MenuItem>
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
              </Box>

              {loading ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              ) : filteredPreferences.length === 0 ? (
                <Typography variant="body2" color="text.secondary" align="center" py={3}>
                  {preferences.length === 0 
                    ? 'No exercise preferences saved yet. Search for exercises above to add your preferences.'
                    : 'No preferences match the current filter. Try adjusting your filter settings.'
                  }
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
                                label={`MET: ${preference.exercise.met}`}
                                color={INTENSITY_COLORS[preference.exercise.intensity as keyof typeof INTENSITY_COLORS] as any}
                                size="small"
                                variant="outlined"
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {preference.exercise.category} • {preference.exercise.intensity} intensity
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
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
                  
                  {Math.ceil(filteredPreferences.length / itemsPerPage) > 1 && (
                    <Box display="flex" justifyContent="center" mt={2}>
                      <Pagination
                        count={Math.ceil(filteredPreferences.length / itemsPerPage)}
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
                  {selectedExercise.category} • MET: {selectedExercise.met} • {selectedExercise.intensity} intensity
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
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
              placeholder="Add any additional notes about this preference..."
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