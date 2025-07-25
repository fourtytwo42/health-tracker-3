import React from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  Typography, 
  Box, 
  Chip, 
  Avatar, 
  Divider,
  List,
  ListItem,
  ListItemText,
  Button,
  Grid
} from '@mui/material';
import { 
  FitnessCenter, 
  Timer, 
  TrendingUp, 
  LocalFireDepartment,
  PlayArrow,
  Favorite,
  Share
} from '@mui/icons-material';
import ExerciseCard from './ExerciseCard';

interface WorkoutExercise {
  exercise: {
    id: string;
    activity: string;
    description?: string;
    category?: string;
    intensity?: string;
    met?: number;
    code?: string;
    imageUrl?: string;
  };
  sets?: number;
  reps?: number;
  duration?: number;
  restPeriod?: number;
  notes?: string;
  description?: string;
  searchTerm?: string;
}

interface WorkoutCardProps {
  workout: {
    id: string;
    name: string;
    description?: string;
    category: string;
    difficulty: string;
    duration: number;
    totalCalories?: number;
    targetMuscleGroups?: string[];
    equipment?: string[];
    instructions?: string[];
    exercises: WorkoutExercise[];
    isFavorite?: boolean;
    aiGenerated?: boolean;
    photoUrl?: string;
  };
  generateImage?: boolean;
  onStartWorkout?: (workoutId: string) => void;
  onToggleFavorite?: (workoutId: string) => void;
  onShare?: (workoutId: string) => void;
}

const WorkoutCard: React.FC<WorkoutCardProps> = ({
  workout,
  generateImage = false,
  onStartWorkout,
  onToggleFavorite,
  onShare
}) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return 'success';
      case 'intermediate':
        return 'warning';
      case 'advanced':
        return 'error';
      default:
        return 'default';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'strength':
        return <FitnessCenter />;
      case 'cardio':
        return <TrendingUp />;
      case 'flexibility':
        return <Timer />;
      default:
        return <FitnessCenter />;
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <Card 
      sx={{ 
        maxWidth: 800,
        width: '100%',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 4
        }
      }}
    >
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            {getCategoryIcon(workout.category)}
          </Avatar>
        }
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            {onStartWorkout && (
              <Button
                variant="contained"
                size="small"
                startIcon={<PlayArrow />}
                onClick={() => onStartWorkout(workout.id)}
                sx={{ minWidth: 'auto' }}
              >
                Start
              </Button>
            )}
            {onToggleFavorite && (
              <Button
                variant="outlined"
                size="small"
                onClick={() => onToggleFavorite(workout.id)}
                sx={{ 
                  minWidth: 'auto',
                  color: workout.isFavorite ? 'error.main' : 'inherit'
                }}
              >
                <Favorite sx={{ 
                  color: workout.isFavorite ? 'error.main' : 'inherit',
                  fontSize: '1.2rem'
                }} />
              </Button>
            )}
            {onShare && (
              <Button
                variant="outlined"
                size="small"
                onClick={() => onShare(workout.id)}
                sx={{ minWidth: 'auto' }}
              >
                <Share sx={{ fontSize: '1.2rem' }} />
              </Button>
            )}
          </Box>
        }
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography 
              variant="h4" 
              component="h2" 
              sx={{ 
                fontWeight: 700,
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
                color: 'text.primary',
                lineHeight: 1.2,
                mb: 0.5,
                '&.MuiTypography-root': {
                  fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
                }
              }}
            >
              {workout.name}
            </Typography>
            {workout.aiGenerated && (
              <Chip 
                label="AI Generated" 
                size="small" 
                color="primary" 
                variant="outlined"
              />
            )}
          </Box>
        }
        subheader={
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
            <Chip 
              label={workout.category} 
              size="small" 
              variant="outlined"
            />
            <Chip 
              label={workout.difficulty} 
              size="small" 
              color={getDifficultyColor(workout.difficulty) as any}
            />
            <Chip 
              icon={<Timer />}
              label={formatDuration(workout.duration)} 
              size="small" 
              variant="outlined"
            />
            {workout.totalCalories && (
              <Chip 
                icon={<LocalFireDepartment />}
                label={`${workout.totalCalories} cal`} 
                size="small" 
                variant="outlined"
              />
            )}
          </Box>
        }
      />
      
      {/* Workout Image */}
      {workout.photoUrl && (
        <Box sx={{ p: 2, pb: 0 }}>
          <img 
            src={workout.photoUrl} 
            alt={`${workout.name} workout`}
            style={{
              width: '100%',
              aspectRatio: '2 / 3',
              objectFit: 'cover',
              borderRadius: '8px'
            }}
          />
        </Box>
      )}
      
      <CardContent>
        {/* Workout Description */}
        {workout.description && (
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ mb: 3, lineHeight: 1.6 }}
          >
            {workout.description}
          </Typography>
        )}

        {/* Target Muscle Groups & Equipment */}
        {(workout.targetMuscleGroups?.length || workout.equipment?.length) && (
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2}>
              {workout.targetMuscleGroups?.length && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Target Muscle Groups
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {workout.targetMuscleGroups.map((muscle, index) => (
                      <Chip 
                        key={index}
                        label={muscle} 
                        size="small" 
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Grid>
              )}
              {workout.equipment?.length && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Equipment Needed
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {workout.equipment.map((equipment, index) => (
                      <Chip 
                        key={index}
                        label={equipment} 
                        size="small" 
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Grid>
              )}
            </Grid>
          </Box>
        )}

        {/* Workout Instructions */}
        {workout.instructions?.length && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Workout Instructions
            </Typography>
            <List dense>
              {workout.instructions.map((instruction, index) => (
                <ListItem key={index} sx={{ py: 0.5 }}>
                  <ListItemText 
                    primary={`${index + 1}. ${instruction}`}
                    sx={{ 
                      '& .MuiListItemText-primary': {
                        fontSize: '0.875rem',
                        lineHeight: 1.5
                      }
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        {/* Exercises */}
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Exercises ({workout.exercises.length})
          </Typography>
          <Grid container spacing={2}>
            {workout.exercises.map((exerciseData, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <ExerciseCard
                  exercise={exerciseData.exercise}
                  sets={exerciseData.sets}
                  reps={exerciseData.reps}
                  duration={exerciseData.duration}
                  restPeriod={exerciseData.restPeriod}
                  notes={exerciseData.notes}
                  description={exerciseData.description}
                  generateImage={generateImage}
                  size="small"
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

export default WorkoutCard; 