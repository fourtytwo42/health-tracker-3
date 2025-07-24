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
  Clear as ClearIcon,
  SmartToy as AIIcon
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
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [preferences, setPreferences] = useState<ExercisePreference[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [preferenceDialog, setPreferenceDialog] = useState(false);
  const [editingPreference, setEditingPreference] = useState<ExercisePreference | null>(null);
  const [preferenceType, setPreferenceType] = useState('LIKE');
  const [preferenceNotes, setPreferenceNotes] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [intensityFilter, setIntensityFilter] = useState('');
  const [metRange, setMetRange] = useState([1, 10]);

  // AI Search states
  const [aiSearchLoading, setAiSearchLoading] = useState(false);
  const [aiSearchError, setAiSearchError] = useState<string | null>(null);
  const [aiSearchResult, setAiSearchResult] = useState<any>(null);
  const [showAiResult, setShowAiResult] = useState(false);

  // Categories and intensities
  const [categories, setCategories] = useState<string[]>([]);
  const [intensities, setIntensities] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      loadCategoriesAndIntensities();
      loadAllExercises();
      loadExercises();
      loadPreferences();
    }
  }, [user]);

  useEffect(() => {
    loadExercises();
  }, [currentPage, pageSize, searchTerm, categoryFilter, intensityFilter, metRange]);

  const loadCategoriesAndIntensities = async () => {
    try {
      const [categoriesResponse, intensitiesResponse] = await Promise.all([
        fetch('/api/exercises/categories'),
        fetch('/api/exercises/intensities')
      ]);

      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData.categories || []);
      }

      if (intensitiesResponse.ok) {
        const intensitiesData = await intensitiesResponse.json();
        setIntensities(intensitiesData.intensities || []);
      }
    } catch (error) {
      console.error('Error loading categories and intensities:', error);
    }
  };

  const loadAllExercises = async () => {
    try {
      const response = await fetch('/api/exercises?limit=1000');
      if (response.ok) {
        const data = await response.json();
        setAllExercises(data.exercises || []);
      }
    } catch (error) {
      console.error('Error loading all exercises:', error);
    }
  };

  const loadExercises = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString()
      });

      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }
      if (categoryFilter) {
        params.append('category', categoryFilter);
      }
      if (intensityFilter) {
        params.append('intensity', intensityFilter);
      }
      if (metRange[0] > 1 || metRange[1] < 10) {
        params.append('metMin', metRange[0].toString());
        params.append('metMax', metRange[1].toString());
      }

      const response = await fetch(`/api/exercises?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setExercises(data.exercises || []);
        setTotalItems(data.total || 0);
        setTotalPages(Math.ceil((data.total || 0) / pageSize));
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
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setIntensityFilter('');
    setMetRange([1, 10]);
    setCurrentPage(1);
    clearAiSearch();
  };

  // AI Search function
  const handleAiSearch = async () => {
    if (!searchTerm.trim()) {
      setAiSearchError('Please enter a search term to analyze');
      return;
    }

    setAiSearchLoading(true);
    setAiSearchError(null);
    setAiSearchResult(null);
    setShowAiResult(false);

    try {
      // Prepare filters
      const filters: any = {};
      if (categoryFilter) {
        filters.category = categoryFilter;
      }
      if (intensityFilter) {
        filters.intensity = intensityFilter;
      }
      if (metRange[0] > 1 || metRange[1] < 10) {
        filters.met = { min: metRange[0], max: metRange[1] };
      }

      const response = await fetch('/api/exercises/ai-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          searchTerm: searchTerm.trim(),
          filters: Object.keys(filters).length > 0 ? filters : undefined
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setAiSearchResult(result);
        setShowAiResult(true);
      } else {
        setAiSearchError(result.error || 'Failed to get AI recommendation');
      }
    } catch (error) {
      console.error('AI search error:', error);
      setAiSearchError('Failed to connect to AI service');
    } finally {
      setAiSearchLoading(false);
    }
  };

  // Clear AI search results
  const clearAiSearch = () => {
    setAiSearchResult(null);
    setAiSearchError(null);
    setShowAiResult(false);
  };

  const handleAddPreference = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setEditingPreference(null);
    setPreferenceType('LIKE');
    setPreferenceNotes('');
    setPreferenceDialog(true);
  };

  const handleEditPreference = (preference: ExercisePreference) => {
    setSelectedExercise(preference.exercise);
    setEditingPreference(preference);
    setPreferenceType(preference.preference);
    setPreferenceNotes(preference.notes || '');
    setPreferenceDialog(true);
  };

  const handleSavePreference = async () => {
    if (!selectedExercise) return;

    try {
      const preferenceData = {
        exerciseId: selectedExercise.id,
        preference: preferenceType,
        notes: preferenceNotes.trim() || undefined
      };

      const url = editingPreference 
        ? `/api/exercise-preferences/${editingPreference.id}`
        : '/api/exercise-preferences';
      
      const method = editingPreference ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferenceData),
      });

      if (response.ok) {
        setSuccess(editingPreference ? 'Preference updated successfully!' : 'Preference added successfully!');
        setPreferenceDialog(false);
        await loadPreferences();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save preference');
      }
    } catch (error) {
      setError('An error occurred while saving preference');
    }
  };

  const handleDeletePreference = async (preferenceId: string) => {
    if (!confirm('Are you sure you want to delete this preference?')) return;

    try {
      const response = await fetch(`/api/exercise-preferences/${preferenceId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccess('Preference deleted successfully!');
        await loadPreferences();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete preference');
      }
    } catch (error) {
      setError('An error occurred while deleting preference');
    }
  };

  const getPreferenceIcon = (type: string) => {
    return PREFERENCE_TYPES.find(p => p.value === type)?.icon || <LikeIcon />;
  };

  const getPreferenceColor = (type: string) => {
    return PREFERENCE_TYPES.find(p => p.value === type)?.color || 'default';
  };

  const getExistingPreference = (exerciseId: string) => {
    return preferences.find(p => p.exerciseId === exerciseId);
  };

  const getIntensityColor = (intensity: string) => {
    return INTENSITY_COLORS[intensity as keyof typeof INTENSITY_COLORS] || 'default';
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Exercise Preferences
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage your exercise preferences and limitations to help personalize your workout recommendations.
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
        {/* Search and Filters */}
        <Grid item xs={12}>
          <Card>
            <CardHeader 
              title="Search Exercises"
              action={
                <Box display="flex" gap={1}>
                  <Button
                    variant="outlined"
                    startIcon={<FilterIcon />}
                    onClick={() => setShowFilters(!showFilters)}
                    size="small"
                  >
                    {showFilters ? 'Hide' : 'Show'} Filters
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<ClearIcon />}
                    onClick={clearFilters}
                    size="small"
                  >
                    Clear All
                  </Button>
                </Box>
              }
            />
            <CardContent>
              <Stack spacing={2}>
                {/* Search Bar */}
                <Box display="flex" gap={1}>
                  <TextField
                    fullWidth
                    placeholder="Search exercises by name..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Button
                    variant="contained"
                    startIcon={<AIIcon />}
                    onClick={handleAiSearch}
                    disabled={aiSearchLoading || !searchTerm.trim()}
                    sx={{ minWidth: 120 }}
                  >
                    {aiSearchLoading ? <CircularProgress size={20} /> : 'AI Match'}
                  </Button>
                </Box>

                {/* AI Search Results */}
                {aiSearchError && (
                  <Alert severity="error" onClose={() => setAiSearchError(null)}>
                    {aiSearchError}
                  </Alert>
                )}

                {showAiResult && aiSearchResult && (
                  <Paper sx={{ p: 2, bgcolor: 'primary.50' }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="h6" color="primary">
                        AI Best Match
                      </Typography>
                      <IconButton size="small" onClick={clearAiSearch}>
                        <ClearIcon />
                      </IconButton>
                    </Box>
                    {aiSearchResult.exercise && (
                      <Card variant="outlined">
                        <CardContent>
                          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                            <Box>
                              <Typography variant="h6">
                                {aiSearchResult.exercise.activity}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {aiSearchResult.exercise.category} • {aiSearchResult.exercise.intensity}
                              </Typography>
                              <Box display="flex" gap={2} mt={1}>
                                <Chip
                                  label={`MET: ${aiSearchResult.exercise.met}`}
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                />
                                <Chip
                                  label={aiSearchResult.exercise.intensity}
                                  size="small"
                                  color={getIntensityColor(aiSearchResult.exercise.intensity) as any}
                                />
                              </Box>
                            </Box>
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => handleAddPreference(aiSearchResult.exercise)}
                            >
                              Add Preference
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    )}
                    {aiSearchResult.explanation && (
                      <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                        {aiSearchResult.explanation}
                      </Typography>
                    )}
                  </Paper>
                )}

                {/* Filters */}
                <Collapse in={showFilters}>
                  <Paper sx={{ p: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Category</InputLabel>
                          <Select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            label="Category"
                          >
                            <MenuItem value="">All Categories</MenuItem>
                            {categories.map((category) => (
                              <MenuItem key={category} value={category}>
                                {category}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Intensity</InputLabel>
                          <Select
                            value={intensityFilter}
                            onChange={(e) => setIntensityFilter(e.target.value)}
                            label="Intensity"
                          >
                            <MenuItem value="">All Intensities</MenuItem>
                            {intensities.map((intensity) => (
                              <MenuItem key={intensity} value={intensity}>
                                {intensity}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      
                      {/* MET Range Filter */}
                      <Grid item xs={12}>
                        <Typography variant="body2" gutterBottom>
                          MET Range: {metRange[0]} - {metRange[1]}
                        </Typography>
                        <Slider
                          value={metRange}
                          onChange={(_, value) => setMetRange(value as number[])}
                          min={1}
                          max={10}
                          step={0.1}
                          valueLabelDisplay="auto"
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Collapse>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Exercises List */}
        <Grid item xs={12}>
          <Card>
            <CardHeader 
              title={`Exercises (${totalItems} total)`}
              subheader={`Showing ${exercises.length} exercises on page ${currentPage} of ${totalPages}`}
            />
            <CardContent>
              {loading ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              ) : exercises.length === 0 ? (
                <Typography variant="body2" color="text.secondary" align="center" py={3}>
                  No exercises found. Try adjusting your search or filters.
                </Typography>
              ) : (
                <List>
                  {exercises.map((exercise) => {
                    const existingPreference = getExistingPreference(exercise.id);
                    return (
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
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="body1">
                                {exercise.activity}
                              </Typography>
                              {existingPreference && (
                                <Chip
                                  icon={getPreferenceIcon(existingPreference.preference)}
                                  label={existingPreference.preference.replace('_', ' ')}
                                  color={getPreferenceColor(existingPreference.preference) as any}
                                  size="small"
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {exercise.category} • {exercise.intensity}
                              </Typography>
                              <Box display="flex" gap={1} mt={0.5}>
                                <Chip
                                  label={`MET: ${exercise.met}`}
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                />
                                <Chip
                                  label={exercise.intensity}
                                  size="small"
                                  color={getIntensityColor(exercise.intensity) as any}
                                />
                              </Box>
                              {exercise.description && (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                  {exercise.description}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          {existingPreference ? (
                            <Box display="flex" gap={1}>
                              <IconButton
                                size="small"
                                onClick={() => handleEditPreference(existingPreference)}
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeletePreference(existingPreference.id)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                          ) : (
                            <IconButton
                              size="small"
                              onClick={() => handleAddPreference(exercise)}
                            >
                              <AddIcon />
                            </IconButton>
                          )}
                        </ListItemSecondaryAction>
                      </ListItem>
                    );
                  })}
                </List>
              )}
              
              {/* Pagination */}
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
            </CardContent>
          </Card>
        </Grid>

        {/* Current Preferences */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Your Exercise Preferences" />
            <CardContent>
              {preferences.length === 0 ? (
                <Typography variant="body2" color="text.secondary" align="center" py={3}>
                  No exercise preferences set yet. Search for exercises above to add your preferences.
                </Typography>
              ) : (
                <List>
                  {preferences.map((preference) => (
                    <ListItem
                      key={preference.id}
                      sx={{
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        mb: 1
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body1">
                              {preference.exercise.activity}
                            </Typography>
                            <Chip
                              icon={getPreferenceIcon(preference.preference)}
                              label={preference.preference.replace('_', ' ')}
                              color={getPreferenceColor(preference.preference) as any}
                              size="small"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {preference.exercise.category} • {preference.exercise.intensity}
                            </Typography>
                            <Box display="flex" gap={1} mt={0.5}>
                              <Chip
                                label={`MET: ${preference.exercise.met}`}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                              <Chip
                                label={preference.exercise.intensity}
                                size="small"
                                color={getIntensityColor(preference.exercise.intensity) as any}
                              />
                            </Box>
                            {preference.notes && (
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                Notes: {preference.notes}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Box display="flex" gap={1}>
                          <IconButton
                            size="small"
                            onClick={() => handleEditPreference(preference)}
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
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
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
                <Typography variant="h6">{selectedExercise.activity}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedExercise.category} • {selectedExercise.intensity}
                </Typography>
                <Box display="flex" gap={1} mt={1}>
                  <Chip
                    label={`MET: ${selectedExercise.met}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                  <Chip
                    label={selectedExercise.intensity}
                    size="small"
                    color={getIntensityColor(selectedExercise.intensity) as any}
                  />
                </Box>
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
              placeholder="Add any notes about this preference..."
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