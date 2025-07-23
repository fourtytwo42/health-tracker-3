'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Button,
} from '@mui/material';
import {
  Print as PrintIcon,
  ArrowBack as ArrowBackIcon,
  Timer as TimerIcon,
  LocalFireDepartment as LocalFireDepartmentIcon,
  FitnessCenter as FitnessCenterIcon,
} from '@mui/icons-material';
import { authenticatedFetch } from '@/lib/utils/apiClient';

interface Exercise {
  id: string;
  activity: string;
  code: string;
  met: number;
  description?: string;
  category?: string;
  intensity?: string;
}

interface WorkoutExercise {
  id: string;
  exerciseId: string;
  sets: number;
  reps?: number;
  duration?: number; // seconds
  restPeriod: number; // seconds
  order: number;
  notes?: string;
  exercise: Exercise;
}

interface Workout {
  id: string;
  name: string;
  description?: string;
  category: string;
  difficulty: string;
  duration: number; // minutes
  totalCalories?: number;
  targetMuscleGroups?: string[];
  equipment?: string[];
  instructions?: string[];
  photoUrl?: string;
  isFavorite: boolean;
  isPublic: boolean;
  aiGenerated: boolean;
  originalQuery?: string;
  createdAt: string;
  updatedAt: string;
  exercises: WorkoutExercise[];
}

export default function PrintWorkoutPage() {
  const searchParams = useSearchParams();
  const workoutId = searchParams.get('id');
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (workoutId) {
      loadWorkout();
    }
  }, [workoutId]);

  const loadWorkout = async () => {
    try {
      const response = await authenticatedFetch(`/api/workouts/${workoutId}`);
      if (response.ok) {
        const data = await response.json();
        setWorkout(data.workout);
      }
    } catch (error) {
      console.error('Error loading workout:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    window.history.back();
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} hour${hours > 1 ? 's' : ''} ${mins} minutes` : `${hours} hour${hours > 1 ? 's' : ''}`;
  };

  const formatExerciseDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds} seconds`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${minutes} minute${minutes > 1 ? 's' : ''} ${secs} seconds` : `${minutes} minute${minutes > 1 ? 's' : ''}`;
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Loading workout...</Typography>
      </Box>
    );
  }

  if (!workout) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Workout not found</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      {/* Print Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, '@media print': { display: 'none' } }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          variant="outlined"
        >
          Back
        </Button>
        <Button
          startIcon={<PrintIcon />}
          onClick={handlePrint}
          variant="contained"
        >
          Print Workout
        </Button>
      </Box>

      {/* Workout Content */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
              {workout.name}
            </Typography>
            {workout.description && (
              <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                {workout.description}
              </Typography>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Chip
                icon={<FitnessCenterIcon />}
                label={workout.category}
                color="primary"
                variant="outlined"
              />
              <Chip
                label={workout.difficulty}
                color={workout.difficulty === 'BEGINNER' ? 'success' : workout.difficulty === 'INTERMEDIATE' ? 'warning' : 'error'}
                variant="outlined"
              />
              <Chip
                icon={<TimerIcon />}
                label={formatDuration(workout.duration)}
                variant="outlined"
              />
              {workout.totalCalories && (
                <Chip
                  icon={<LocalFireDepartmentIcon />}
                  label={`~${workout.totalCalories} calories`}
                  variant="outlined"
                />
              )}
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Workout Details */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {workout.targetMuscleGroups && workout.targetMuscleGroups.length > 0 && (
              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Target Muscle Groups
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {workout.targetMuscleGroups.map((muscle, index) => (
                    <Chip key={index} label={muscle} size="small" />
                  ))}
                </Box>
              </Grid>
            )}
            
            {workout.equipment && workout.equipment.length > 0 && (
              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Equipment Needed
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {workout.equipment.map((item, index) => (
                    <Chip key={index} label={item} size="small" variant="outlined" />
                  ))}
                </Box>
              </Grid>
            )}
          </Grid>

          {/* Instructions */}
          {workout.instructions && workout.instructions.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Instructions
              </Typography>
              <List>
                {workout.instructions.map((instruction, index) => (
                  <ListItem key={index} sx={{ py: 0.5 }}>
                    <ListItemText
                      primary={`${index + 1}. ${instruction}`}
                      sx={{ '& .MuiListItemText-primary': { fontSize: '1rem' } }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          <Divider sx={{ my: 3 }} />

          {/* Exercises */}
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Exercises ({workout.exercises.length})
            </Typography>
            
            {workout.exercises.map((workoutExercise, index) => (
              <Card key={workoutExercise.id} sx={{ mb: 2, border: 1, borderColor: 'divider' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {index + 1}. {workoutExercise.exercise.activity}
                    </Typography>
                    <Chip
                      label={`${workoutExercise.sets} sets`}
                      size="small"
                      color="primary"
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 1, flexWrap: 'wrap' }}>
                    {workoutExercise.reps && (
                      <Typography variant="body2" color="text.secondary">
                        {workoutExercise.reps} reps
                      </Typography>
                    )}
                    {workoutExercise.duration && (
                      <Typography variant="body2" color="text.secondary">
                        {formatExerciseDuration(workoutExercise.duration)}
                      </Typography>
                    )}
                    <Typography variant="body2" color="text.secondary">
                      {workoutExercise.restPeriod}s rest
                    </Typography>
                  </Box>
                  
                  {workoutExercise.exercise.description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontStyle: 'italic', mb: 1 }}
                    >
                      {workoutExercise.exercise.description}
                    </Typography>
                  )}
                  
                  {workoutExercise.notes && (
                    <Typography
                      variant="body2"
                      sx={{
                        backgroundColor: 'grey.100',
                        p: 1,
                        borderRadius: 1,
                        fontSize: '0.875rem',
                      }}
                    >
                      <strong>Notes:</strong> {workoutExercise.notes}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>

          {/* Footer */}
          <Box sx={{ mt: 4, textAlign: 'center', color: 'text.secondary' }}>
            <Typography variant="body2">
              Generated on {new Date(workout.createdAt).toLocaleDateString()}
            </Typography>
            {workout.aiGenerated && (
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                AI-Generated Workout
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
} 