'use client';

import React from 'react';
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
  MenuItem
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

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

        {/* Filter Toggle */}
        <Box sx={{ mb: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setShowFilters(!showFilters)}
            size="small"
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </Box>

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