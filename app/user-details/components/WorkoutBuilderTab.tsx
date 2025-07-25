'use client';

import React, { useState, useEffect } from 'react';
import { authenticatedFetch } from '@/lib/utils/apiClient';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ListItemButton,
  ListItemIcon,
  Tooltip,
  Slider,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Fab,
  Badge,
} from '@mui/material';
import {
  Add as AddIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  FitnessCenter as FitnessCenterIcon,
  DirectionsRun as DirectionsRunIcon,
  DirectionsWalk as DirectionsWalkIcon,
  Speed as SpeedIcon,
  TrendingUp as TrendingUpIcon,
  ShoppingCart as ShoppingCartIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  SwapHoriz as SwapHorizIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Delete as DeleteIcon,
  Timer as TimerIcon,
  Image as ImageIcon,
  Print as PrintIcon,
  LocalFireDepartment as LocalFireDepartmentIcon,
} from '@mui/icons-material';
import { useAuth } from '@/context/AuthContext';
import WorkoutCard from '@/app/components/WorkoutCard';

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

interface WorkoutBuilderTabProps {
  userProfile: any;
  exercisePreferences: any[];
}

export default function WorkoutBuilderTab({ userProfile, exercisePreferences }: WorkoutBuilderTabProps) {
  const { user } = useAuth();
  const router = useRouter();

  // State for workout generation
  const [keywords, setKeywords] = useState('');
  const [workoutType, setWorkoutType] = useState('STRENGTH');
  const [duration, setDuration] = useState(30);
  const [difficulty, setDifficulty] = useState('INTERMEDIATE');
  const [targetMuscleGroups, setTargetMuscleGroups] = useState<string[]>([]);
  const [equipment, setEquipment] = useState<string[]>([]);
  const [generateImage, setGenerateImage] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // State for workout management
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // State for dialogs
  const [showNutritionDialog, setShowNutritionDialog] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [targetCalories, setTargetCalories] = useState(0);

  const workoutTypes = [
    { value: 'STRENGTH', label: 'Strength Training' },
    { value: 'CARDIO', label: 'Cardio' },
    { value: 'FLEXIBILITY', label: 'Flexibility' },
    { value: 'HIIT', label: 'HIIT' },
    { value: 'SPORTS', label: 'Sports' },
    { value: 'REHAB', label: 'Rehabilitation' }
  ];

  const difficulties = [
    { value: 'BEGINNER', label: 'Beginner' },
    { value: 'INTERMEDIATE', label: 'Intermediate' },
    { value: 'ADVANCED', label: 'Advanced' }
  ];

  const muscleGroups = [
    'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Forearms',
    'Core', 'Glutes', 'Quadriceps', 'Hamstrings', 'Calves', 'Full Body'
  ];

  const equipmentOptions = [
    'None', 'Dumbbells', 'Barbell', 'Resistance Bands', 'Pull-up Bar',
    'Bench', 'Kettlebell', 'Medicine Ball', 'Foam Roller', 'Yoga Mat'
  ];

  // Load user settings and workouts
  useEffect(() => {
    if (user) {
      loadUserSettings();
      loadWorkouts();
    }
  }, [user, currentPage, searchTerm, selectedCategory]);

  const loadUserSettings = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/settings/user', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const settings = await response.json();
        // Apply user settings if needed
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
    }
  };

  const loadWorkouts = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        search: searchTerm,
        category: selectedCategory !== 'all' ? selectedCategory : ''
      });

      const response = await authenticatedFetch(`/api/workouts?${params}`);

      if (response.ok) {
        const data = await response.json();
        setWorkouts(data.workouts);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error('Error loading workouts:', error);
    }
  };

  const generateWorkout = async () => {
    // Description is now optional - allow empty keywords

    setIsGenerating(true);
    try {
      const response = await authenticatedFetch('/api/workouts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keywords,
          workoutType,
          duration,
          difficulty,
          targetMuscleGroups,
          equipment,
          generateImage
        })
      });

      if (response.ok) {
        const newWorkout = await response.json();
        setWorkouts(prev => [newWorkout, ...prev]);
        setKeywords('');
        setWorkoutType('STRENGTH');
        setDuration(30);
        setDifficulty('INTERMEDIATE');
        setTargetMuscleGroups([]);
        setEquipment([]);
      } else {
        const error = await response.json();
        alert(`Error generating workout: ${error.error}`);
      }
    } catch (error) {
      console.error('Error generating workout:', error);
      alert('Error generating workout. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleFavorite = async (workoutId: string) => {
    try {
      const response = await authenticatedFetch(`/api/workouts/${workoutId}/toggle-favorite`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        setWorkouts(prev => {
          const updated = prev.map(workout => 
            workout.id === workoutId 
              ? data.workout
              : workout
          );
          return updated;
        });
        
        // Dispatch event to notify calendar component
        window.dispatchEvent(new CustomEvent('favoriteChanged'));
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const regenerateWorkout = async (workoutId: string) => {
    try {
      const response = await authenticatedFetch('/api/workouts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keywords: workouts.find(w => w.id === workoutId)?.originalQuery || '',
          workoutType: workouts.find(w => w.id === workoutId)?.category || 'STRENGTH',
          duration: workouts.find(w => w.id === workoutId)?.duration || 30,
          difficulty: workouts.find(w => w.id === workoutId)?.difficulty || 'INTERMEDIATE',
          targetMuscleGroups: workouts.find(w => w.id === workoutId)?.targetMuscleGroups || [],
          equipment: workouts.find(w => w.id === workoutId)?.equipment || [],
          generateImage
        })
      });

      if (response.ok) {
        const newWorkout = await response.json();
        setWorkouts(prev => prev.map(workout => 
          workout.id === workoutId ? newWorkout : workout
        ));
      }
    } catch (error) {
      console.error('Error regenerating workout:', error);
    }
  };

  const deleteWorkout = async (workoutId: string) => {
    if (!confirm('Are you sure you want to delete this workout?')) return;

    try {
      const response = await authenticatedFetch(`/api/workouts/${workoutId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setWorkouts(prev => prev.filter(workout => workout.id !== workoutId));
      }
    } catch (error) {
      console.error('Error deleting workout:', error);
    }
  };

  const printWorkout = (workout: Workout) => {
    router.push(`/print-workout?id=${workout.id}`);
  };

  const handleMuscleGroupToggle = (muscleGroup: string) => {
    setTargetMuscleGroups(prev => 
      prev.includes(muscleGroup)
        ? prev.filter(mg => mg !== muscleGroup)
        : [...prev, muscleGroup]
    );
  };

  const handleEquipmentToggle = (equipmentItem: string) => {
    setEquipment(prev => 
      prev.includes(equipmentItem)
        ? prev.filter(eq => eq !== equipmentItem)
        : [...prev, equipmentItem]
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
        Workout Builder
      </Typography>

      {/* Workout Generation Form */}
      <Card sx={{ mb: 4, p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Generate AI Workout
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Describe your workout (optional)"
              placeholder="e.g., 30-minute upper body strength workout with dumbbells (leave empty for AI to generate)"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              multiline
              rows={3}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Workout Type</InputLabel>
                  <Select
                    value={workoutType}
                    onChange={(e) => setWorkoutType(e.target.value)}
                    label="Workout Type"
                  >
                    {workoutTypes.map(type => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Difficulty</InputLabel>
                  <Select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    label="Difficulty"
                  >
                    {difficulties.map(diff => (
                      <MenuItem key={diff.value} value={diff.value}>
                        {diff.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Duration: {duration} minutes
                </Typography>
                <Slider
                  value={duration}
                  onChange={(e, value) => setDuration(value as number)}
                  min={10}
                  max={120}
                  step={5}
                  marks={[
                    { value: 10, label: '10m' },
                    { value: 60, label: '60m' },
                    { value: 120, label: '120m' }
                  ]}
                />
              </Grid>
              
              <Grid item xs={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={generateImage}
                      onChange={(e) => setGenerateImage(e.target.checked)}
                    />
                  }
                  label="Generate workout image"
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Target Muscle Groups */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Target Muscle Groups
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {muscleGroups.map(muscleGroup => (
                <Chip
                  key={muscleGroup}
                  label={muscleGroup}
                  onClick={() => handleMuscleGroupToggle(muscleGroup)}
                  color={targetMuscleGroups.includes(muscleGroup) ? 'primary' : 'default'}
                  variant={targetMuscleGroups.includes(muscleGroup) ? 'filled' : 'outlined'}
                  size="small"
                />
              ))}
            </Box>
          </Grid>

          {/* Equipment */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Available Equipment
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {equipmentOptions.map(equipmentItem => (
                <Chip
                  key={equipmentItem}
                  label={equipmentItem}
                  onClick={() => handleEquipmentToggle(equipmentItem)}
                  color={equipment.includes(equipmentItem) ? 'primary' : 'default'}
                  variant={equipment.includes(equipmentItem) ? 'filled' : 'outlined'}
                  size="small"
                />
              ))}
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Button
              variant="contained"
              size="large"
              onClick={generateWorkout}
              disabled={isGenerating || !keywords.trim()}
              startIcon={isGenerating ? <CircularProgress size={20} /> : <AddIcon />}
              sx={{ minWidth: 200 }}
            >
              {isGenerating ? 'Generating...' : 'Generate Workout'}
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Search and Filter */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search workouts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            label="Category"
          >
            <MenuItem value="all">All Categories</MenuItem>
            {workoutTypes.map(type => (
              <MenuItem key={type.value} value={type.value}>
                {type.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Workouts List */}
      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '16px',
        justifyContent: 'center'
      }}>
        {workouts.map((workout) => (
          <Box key={workout.id} sx={{ width: { xs: '100%', sm: '400px', md: '350px' } }}>
            <WorkoutCard
              workout={workout}
              onToggleFavorite={toggleFavorite}
              onDelete={deleteWorkout}
              onPrint={printWorkout}
              generateImage={generateImage}
            />
          </Box>
        ))}
      </Box>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(e, page) => setCurrentPage(page)}
            color="primary"
          />
        </Box>
      )}

      {/* Floating Action Button for Quick Generation */}
      <Fab
        color="primary"
        aria-label="generate workout"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => {
          setKeywords('Quick workout');
          generateWorkout();
        }}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
} 