'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  Slider,
  Paper,
  IconButton,
  Chip,
  CircularProgress,
  Pagination,
  Select,
  MenuItem,
  Alert,
  Collapse
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, SmartToy as AIIcon } from '@mui/icons-material';

interface Exercise {
  id: string;
  activity: string;
  code: string;
  met: number;
  description: string;
  category?: string;
  intensity?: string;
  isActive: boolean;
}

interface ExercisesTabProps {
  exercises: Exercise[];
  exercisesLoading: boolean;
  currentPage: number;
  pageSize: number;
  totalExercises: number;
  totalPages: number;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  exerciseCategoryFilter: string;
  setExerciseCategoryFilter: (filter: string) => void;
  exerciseIntensityFilter: string;
  setExerciseIntensityFilter: (filter: string) => void;
  metRange: number[];
  setMetRange: (range: number[]) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  categories: string[];
  intensities: string[];
  openExerciseDialog: (exercise?: Exercise) => void;
  deleteExercise: (id: string) => Promise<void>;
  loadExercises: (page: number, size: number) => Promise<void>;
  setPageSize: (size: number) => void;
  setCurrentPage: (page: number) => void;
}

export default function ExercisesTab({
  exercises,
  exercisesLoading,
  currentPage,
  pageSize,
  totalExercises,
  totalPages,
  searchTerm,
  setSearchTerm,
  exerciseCategoryFilter,
  setExerciseCategoryFilter,
  exerciseIntensityFilter,
  setExerciseIntensityFilter,
  metRange,
  setMetRange,
  showFilters,
  setShowFilters,
  categories,
  intensities,
  openExerciseDialog,
  deleteExercise,
  loadExercises,
  setPageSize,
  setCurrentPage
}: ExercisesTabProps) {
  
  // AI Search state
  const [aiSearchLoading, setAiSearchLoading] = useState(false);
  const [aiSearchError, setAiSearchError] = useState<string | null>(null);
  const [aiSearchResult, setAiSearchResult] = useState<any>(null);
  const [showAiResult, setShowAiResult] = useState(false);

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
      // Prepare MET range filter
      const metRangeFilter = metRange[0] > 0 || metRange[1] < 20 ? { min: metRange[0], max: metRange[1] } : undefined;

      const response = await fetch('/api/exercises/ai-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          searchTerm: searchTerm.trim(),
          category: exerciseCategoryFilter || undefined,
          intensity: exerciseIntensityFilter || undefined,
          metRange: metRangeFilter
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
  
  // Helper function to get intensity color
  const getIntensityColor = (intensity: string) => {
    switch (intensity?.toUpperCase()) {
      case 'LIGHT': return 'success';
      case 'MODERATE': return 'warning';
      case 'VIGOROUS': return 'error';
      default: return 'default';
    }
  };

  // Helper function to get MET intensity description
  const getMETIntensityDescription = (met: number) => {
    if (met < 3.0) return 'Light';
    if (met < 6.0) return 'Moderate';
    return 'Vigorous';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Exercises Management</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            color="error"
            onClick={async () => {
              if (!confirm('Are you sure you want to delete ALL exercises? This action cannot be undone.')) return;
              
              try {
                const response = await fetch('/api/exercises/delete-all', {
                  method: 'DELETE',
                  headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
                });
                if (response.ok) {
                  await loadExercises(1, pageSize);
                } else {
                  const error = await response.json();
                  console.error(error.error || 'Failed to delete all exercises');
                }
              } catch (error) {
                console.error('Failed to delete all exercises');
              }
            }}
          >
            Delete All
          </Button>
          <Button
            variant="contained"
            onClick={() => openExerciseDialog()}
          >
            Add Exercise
          </Button>
        </Box>
      </Box>

      {/* Search and Filter Section */}
      <Box sx={{ mb: 3 }}>
        {/* Search Bar */}
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            label="Search exercises..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by activity, description, or category..."
            variant="outlined"
            size="small"
          />
        </Box>

        {/* Filter and AI Search Toggle */}
        <Box sx={{ mb: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button
            variant="outlined"
            onClick={() => setShowFilters(!showFilters)}
            size="small"
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          
          {/* AI Search Button */}
          <Button
            variant="outlined"
            color="primary"
            startIcon={aiSearchLoading ? <CircularProgress size={16} /> : <AIIcon />}
            onClick={handleAiSearch}
            disabled={aiSearchLoading || !searchTerm.trim()}
            size="small"
          >
            {aiSearchLoading ? 'AI Analyzing...' : 'AI Best Match'}
          </Button>

          {/* Clear AI Results Button */}
          {showAiResult && (
            <Button
              variant="outlined"
              color="secondary"
              onClick={clearAiSearch}
              size="small"
            >
              Clear AI Result
            </Button>
          )}
        </Box>

        {/* AI Search Error */}
        {aiSearchError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setAiSearchError(null)}>
            {aiSearchError}
          </Alert>
        )}

        {/* AI Search Result */}
        <Collapse in={showAiResult}>
          {aiSearchResult && (
            <Paper sx={{ p: 2, mb: 2, backgroundColor: '#f8f9fa', border: '2px solid #1976d2' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Typography variant="h6" color="primary">
                  🤖 AI Best Match
                </Typography>
                <Chip 
                  label={`Analyzed ${aiSearchResult.totalCandidates} exercises`} 
                  size="small" 
                  color="info" 
                />
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
                "{aiSearchResult.reasoning}"
              </Typography>

              {/* AI Selected Exercise Card */}
              <Card sx={{ backgroundColor: 'white' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" component="div">
                      {aiSearchResult.bestMatch.activity}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip 
                        label={aiSearchResult.bestMatch.category || 'Unknown'} 
                        size="small" 
                        color="primary" 
                      />
                      <Chip 
                        label={aiSearchResult.bestMatch.intensity || 'Unknown'} 
                        size="small" 
                        color={getIntensityColor(aiSearchResult.bestMatch.intensity) as any}
                      />
                    </Box>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {aiSearchResult.bestMatch.description}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                    <Typography variant="body2">
                      <strong>Code:</strong> {aiSearchResult.bestMatch.code}
                    </Typography>
                    <Typography variant="body2">
                      <strong>MET:</strong> {aiSearchResult.bestMatch.met}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Chip 
                      label={getMETIntensityDescription(aiSearchResult.bestMatch.met)} 
                      size="small" 
                      color={getIntensityColor(getMETIntensityDescription(aiSearchResult.bestMatch.met)) as any}
                      variant="outlined"
                    />
                    <Chip 
                      label={aiSearchResult.bestMatch.isActive ? 'Active' : 'Inactive'} 
                      size="small" 
                      color={aiSearchResult.bestMatch.isActive ? 'success' : 'default'}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Paper>
          )}
        </Collapse>

        {/* Filter Panel */}
        {showFilters && (
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Filters
            </Typography>
            
            <Grid container spacing={2}>
              {/* Category Filter */}
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Category"
                  value={exerciseCategoryFilter}
                  onChange={(e) => setExerciseCategoryFilter(e.target.value)}
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
                  value={exerciseIntensityFilter}
                  onChange={(e) => setExerciseIntensityFilter(e.target.value)}
                  size="small"
                >
                  <MenuItem value="">All Intensities</MenuItem>
                  {intensities.map((intensity) => (
                    <MenuItem key={intensity} value={intensity}>
                      {intensity}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* MET Range */}
              <Grid item xs={12}>
                <Typography gutterBottom>
                  MET Range: {metRange[0]} - {metRange[1]}
                </Typography>
                <Slider
                  value={metRange}
                  onChange={(_, newValue) => setMetRange(newValue as number[])}
                  valueLabelDisplay="auto"
                  min={0}
                  max={20}
                  step={0.1}
                />
              </Grid>

              {/* Clear Filters */}
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setSearchTerm('');
                    setExerciseCategoryFilter('');
                    setExerciseIntensityFilter('');
                    setMetRange([0, 20]);
                  }}
                  size="small"
                >
                  Clear All Filters
                </Button>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Results Count */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Showing {exercises.length} of {totalExercises} exercises
          </Typography>
        </Box>
      </Box>

      {exercisesLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={2}>
          {exercises.map((exercise) => (
            <Grid item xs={12} md={6} lg={4} key={exercise.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" component="div">
                      {exercise.activity}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => openExerciseDialog(exercise)}
                        color="primary"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => deleteExercise(exercise.id)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {exercise.description}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Code:</strong> {exercise.code}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>MET:</strong> {exercise.met}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    {exercise.category && (
                      <Chip 
                        label={exercise.category} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                    )}
                    {exercise.intensity && (
                      <Chip 
                        label={exercise.intensity} 
                        size="small" 
                        color={getIntensityColor(exercise.intensity) as any}
                      />
                    )}
                    <Chip 
                      label={getMETIntensityDescription(exercise.met)} 
                      size="small" 
                      color={getIntensityColor(getMETIntensityDescription(exercise.met)) as any}
                      variant="outlined"
                    />
                    <Chip 
                      label={exercise.isActive ? 'Active' : 'Inactive'} 
                      size="small" 
                      color={exercise.isActive ? 'success' : 'default'}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 2 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(event: any, page: number) => {
              setCurrentPage(page);
              loadExercises(page, pageSize);
            }}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}
      
      {/* Page Size Selector */}
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mb: 2 }}>
        <Typography variant="body2">Items per page:</Typography>
        <Select
          value={pageSize}
          onChange={(e: any) => {
            const newSize = e.target.value as number;
            setPageSize(newSize);
            setCurrentPage(1);
            loadExercises(1, newSize);
          }}
          size="small"
        >
          <MenuItem value={25}>25</MenuItem>
          <MenuItem value={50}>50</MenuItem>
          <MenuItem value={100}>100</MenuItem>
          <MenuItem value={200}>200</MenuItem>
        </Select>
        <Typography variant="body2" color="text.secondary">
          Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalExercises)} of {totalExercises} exercises
        </Typography>
      </Box>
    </Box>
  );
} 