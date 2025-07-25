'use client';

import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  Collapse,
  Card,
  CardContent,
  Grid,
  Divider,
  Chip,
} from '@mui/material';
import { motion } from 'framer-motion';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import DeleteIcon from '@mui/icons-material/Delete';
import PrintIcon from '@mui/icons-material/Print';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import TimerIcon from '@mui/icons-material/Timer';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import SpeedIcon from '@mui/icons-material/Speed';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface Exercise {
  id: string;
  activity: string;
  code: string;
  met: number;
  description?: string;
  category?: string;
  intensity?: string;
  imageUrl?: string;
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

interface WorkoutCardProps {
  workout: Workout;
  onToggleFavorite: (workoutId: string) => void;
  onDelete: (workoutId: string) => void;
  onPrint: (workout: Workout) => void;
  generateImage?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Constants & Helpers                                               */
/* ------------------------------------------------------------------ */

const getCategoryIcon = (category: string) => {
  switch (category.toUpperCase()) {
    case 'STRENGTH':
      return <FitnessCenterIcon />;
    case 'CARDIO':
      return <DirectionsRunIcon />;
    case 'FLEXIBILITY':
      return <DirectionsWalkIcon />;
    case 'HIIT':
      return <SpeedIcon />;
    default:
      return <FitnessCenterIcon />;
  }
};

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty.toUpperCase()) {
    case 'BEGINNER':
      return 'success';
    case 'INTERMEDIATE':
      return 'warning';
    case 'ADVANCED':
      return 'error';
    default:
      return 'default';
  }
};

const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

const formatExerciseDuration = (seconds: number) => {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`;
};

const clampFont = (
  base: number,
  length: number,
  longThresh: number,
  veryLongThresh: number
): number =>
  length > veryLongThresh ? base * 0.8 : length > longThresh ? base * 0.9 : base;

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function WorkoutCard({
  workout,
  onToggleFavorite,
  onDelete,
  onPrint,
  generateImage = false,
}: WorkoutCardProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const [expanded, setExpanded] = useState(false);

  const fs = (b: number) =>
    `${b * (isMobile ? 0.8 : isTablet ? 0.9 : 1)}rem`;

  const spacing = (v: number) =>
    isMobile ? v * 0.6 : isTablet ? v * 0.8 : v;

  const handleExpandClick = useCallback(() => {
    setExpanded(!expanded);
  }, [expanded]);

  const handleFavoriteClick = useCallback(() => {
    onToggleFavorite(workout.id);
  }, [workout.id, onToggleFavorite]);

  const handleDeleteClick = useCallback(() => {
    onDelete(workout.id);
  }, [workout.id, onDelete]);

  const handlePrintClick = useCallback(() => {
    onPrint(workout);
  }, [workout, onPrint]);

  const titleFontSize = clampFont(
    isMobile ? 1.1 : 1.3,
    workout.name.length,
    30,
    50
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ width: '100%' }}
    >
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'visible',
          '&:hover': {
            boxShadow: theme.shadows[8],
            transform: 'translateY(-2px)',
            transition: 'all 0.3s ease-in-out',
          },
        }}
      >
        {/* Main Image */}
        <Box
          sx={{
            position: 'relative',
            aspectRatio: '2 / 3',
            minHeight: 300,
            background: workout.photoUrl
              ? `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.6)), url(${workout.photoUrl})`
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            color: 'white',
            p: 2,
          }}
        >
          {/* Action Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Chip
              icon={getCategoryIcon(workout.category)}
              label={workout.category}
              size="small"
              sx={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                backdropFilter: 'blur(10px)',
              }}
            />
            <Box>
              <Tooltip title={workout.isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
                <IconButton
                  onClick={handleFavoriteClick}
                  sx={{ color: 'white', mr: 0.5 }}
                  size="small"
                >
                  {workout.isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                </IconButton>
              </Tooltip>
              <Tooltip title="Print workout">
                <IconButton
                  onClick={handlePrintClick}
                  sx={{ color: 'white', mr: 0.5 }}
                  size="small"
                >
                  <PrintIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete workout">
                <IconButton
                  onClick={handleDeleteClick}
                  sx={{ color: 'white' }}
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Description Overlay */}
          {workout.description && (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(8px)',
                borderRadius: 2,
                p: 2,
                maxWidth: '80%',
                maxHeight: '60%',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontSize: fs(0.8),
                  lineHeight: 1.4,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  color: 'white',
                  textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                }}
              >
                {workout.description}
              </Typography>
            </Box>
          )}

          {/* Title and Stats */}
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontSize: titleFontSize,
                fontWeight: 600,
                mb: 1,
                lineHeight: 1.2,
                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
              }}
            >
              {workout.name}
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TimerIcon sx={{ fontSize: 16 }} />
                <Typography variant="body2" sx={{ fontSize: fs(0.8) }}>
                  {formatDuration(workout.duration)}
                </Typography>
              </Box>
              
              {workout.totalCalories && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <LocalFireDepartmentIcon sx={{ fontSize: 16 }} />
                  <Typography variant="body2" sx={{ fontSize: fs(0.8) }}>
                    ~{workout.totalCalories} cal
                  </Typography>
                </Box>
              )}
              
              <Chip
                label={workout.difficulty}
                size="small"
                color={getDifficultyColor(workout.difficulty) as any}
                sx={{ fontSize: fs(0.7) }}
              />
            </Box>

            {/* Target Muscle Groups Badges */}
            {workout.targetMuscleGroups && workout.targetMuscleGroups.length > 0 && (
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {workout.targetMuscleGroups.map((muscle, index) => (
                  <Chip
                    key={index}
                    label={muscle}
                    size="small"
                    sx={{
                      fontSize: fs(0.65),
                      backgroundColor: 'rgba(255,255,255,0.15)',
                      color: 'white',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.2)',
                    }}
                  />
                ))}
              </Box>
            )}
          </Box>
        </Box>

        {/* Content */}
        <CardContent sx={{ flexGrow: 1, p: 2, pt: 1 }}>
          {/* Expandable Exercises */}
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Divider sx={{ my: 2 }} />
            
            <Box>
              {workout.exercises.map((workoutExercise, index) => (
                <Box
                  key={workoutExercise.id}
                  sx={{
                    p: 1.5,
                    mb: 1,
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    backgroundColor: 'background.paper',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        fontSize: fs(0.85),
                        color: 'primary.main',
                      }}
                    >
                      {index + 1}. {workoutExercise.exercise.activity}
                    </Typography>
                    {workoutExercise.sets ? (
                      <Chip
                        label={`${workoutExercise.sets} sets`}
                        size="small"
                        sx={{ fontSize: fs(0.7) }}
                      />
                    ) : workoutExercise.duration ? (
                      <Chip
                        label={formatExerciseDuration(workoutExercise.duration)}
                        size="small"
                        sx={{ fontSize: fs(0.7) }}
                      />
                    ) : null}
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 0.5 }}>
                    {workoutExercise.reps && (
                      <Typography variant="body2" sx={{ fontSize: fs(0.75), color: 'text.secondary' }}>
                        {workoutExercise.reps} reps
                      </Typography>
                    )}
                    {workoutExercise.duration && (
                      <Typography variant="body2" sx={{ fontSize: fs(0.75), color: 'text.secondary' }}>
                        {formatExerciseDuration(workoutExercise.duration)}
                      </Typography>
                    )}
                    <Typography variant="body2" sx={{ fontSize: fs(0.75), color: 'text.secondary' }}>
                      {workoutExercise.restPeriod}s rest
                    </Typography>
                  </Box>
                  
                  {workoutExercise.exercise.description && (
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: fs(0.75),
                        color: 'text.secondary',
                        fontStyle: 'italic',
                      }}
                    >
                      {workoutExercise.exercise.description}
                    </Typography>
                  )}
                  
                  {/* Exercise Image */}
                  {(generateImage || workoutExercise.exercise.imageUrl) && (
                    <Box sx={{ mt: 1 }}>
                      {workoutExercise.exercise.imageUrl ? (
                        <img 
                          src={workoutExercise.exercise.imageUrl} 
                          alt={`${workoutExercise.exercise.activity} exercise`}
                          style={{
                            width: '100%',
                            aspectRatio: '2 / 3',
                            objectFit: 'cover',
                            borderRadius: '4px'
                          }}
                        />
                      ) : (
                        <Box 
                          sx={{ 
                            height: 80,
                            bgcolor: 'grey.100',
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px dashed',
                            borderColor: 'grey.300'
                          }}
                        >
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: fs(0.7) }}>
                            Generating image...
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          </Collapse>
        </CardContent>

        {/* Expand Button */}
        <Box sx={{ display: 'flex', justifyContent: 'center', pb: 1 }}>
          <IconButton
            onClick={handleExpandClick}
            sx={{
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s',
            }}
            size="small"
          >
            <ExpandMoreIcon />
          </IconButton>
        </Box>
      </Card>
    </motion.div>
  );
} 