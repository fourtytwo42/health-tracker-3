import React from 'react';
import { Card, CardContent, CardHeader, Typography, Box, Chip, Avatar } from '@mui/material';
import { FitnessCenter, Timer, TrendingUp } from '@mui/icons-material';

interface ExerciseCardProps {
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
  generateImage?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  sets,
  reps,
  duration,
  restPeriod,
  notes,
  description,
  generateImage = false,
  size = 'medium'
}) => {
  const getIntensityColor = (intensity?: string) => {
    switch (intensity?.toLowerCase()) {
      case 'light':
        return 'success';
      case 'moderate':
        return 'warning';
      case 'vigorous':
        return 'error';
      default:
        return 'default';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          maxWidth: 280,
          fontSize: '0.875rem'
        };
      case 'large':
        return {
          maxWidth: 400,
          fontSize: '1.125rem'
        };
      default:
        return {
          maxWidth: 320,
          fontSize: '1rem'
        };
    }
  };

  const styles = getSizeStyles();

  return (
    <Card 
      sx={{ 
        ...styles,
        height: 'fit-content',
        display: 'flex',
        flexDirection: 'column',
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
            <FitnessCenter />
          </Avatar>
        }
        title={
          <Typography 
            variant={size === 'small' ? 'h6' : size === 'large' ? 'h4' : 'h5'}
            component="h3"
            sx={{ 
              fontWeight: 600,
              fontSize: styles.fontSize,
              lineHeight: 1.2
            }}
          >
            {exercise.activity}
          </Typography>
        }
        subheader={
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
            {exercise.category && (
              <Chip 
                label={exercise.category} 
                size="small" 
                variant="outlined"
                sx={{ fontSize: size === 'small' ? '0.75rem' : '0.875rem' }}
              />
            )}
            {exercise.intensity && (
              <Chip 
                label={exercise.intensity} 
                size="small" 
                color={getIntensityColor(exercise.intensity) as any}
                sx={{ fontSize: size === 'small' ? '0.75rem' : '0.875rem' }}
              />
            )}
            {exercise.met && (
              <Chip 
                icon={<TrendingUp />}
                label={`MET: ${exercise.met}`} 
                size="small" 
                variant="outlined"
                sx={{ fontSize: size === 'small' ? '0.75rem' : '0.875rem' }}
              />
            )}
          </Box>
        }
        sx={{ 
          pb: 1,
          '& .MuiCardHeader-content': {
            minWidth: 0
          }
        }}
      />
      
      <CardContent sx={{ pt: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Exercise Description */}
        {(description || exercise.description) && (
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              mb: 2,
              fontSize: size === 'small' ? '0.75rem' : '0.875rem',
              lineHeight: 1.5
            }}
          >
            {description || exercise.description}
          </Typography>
        )}

        {/* Exercise Parameters */}
        {(sets || reps || duration || restPeriod) && (
          <Box sx={{ mb: 2 }}>
            <Typography 
              variant="subtitle2" 
              sx={{ 
                fontWeight: 600,
                mb: 1,
                fontSize: size === 'small' ? '0.75rem' : '0.875rem'
              }}
            >
              Exercise Parameters
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {sets && (
                <Chip 
                  label={`${sets} sets`} 
                  size="small" 
                  variant="outlined"
                  sx={{ fontSize: size === 'small' ? '0.75rem' : '0.875rem' }}
                />
              )}
              {reps && (
                <Chip 
                  label={`${reps} reps`} 
                  size="small" 
                  variant="outlined"
                  sx={{ fontSize: size === 'small' ? '0.75rem' : '0.875rem' }}
                />
              )}
              {duration && (
                <Chip 
                  icon={<Timer />}
                  label={duration >= 60 ? `${Math.floor(duration / 60)}m` : `${duration}s`} 
                  size="small" 
                  variant="outlined"
                  sx={{ fontSize: size === 'small' ? '0.75rem' : '0.875rem' }}
                />
              )}
              {restPeriod && (
                <Chip 
                  label={`${restPeriod >= 60 ? Math.floor(restPeriod / 60) : restPeriod}${restPeriod >= 60 ? 'm' : 's'} rest`} 
                  size="small" 
                  variant="outlined"
                  sx={{ fontSize: size === 'small' ? '0.75rem' : '0.875rem' }}
                />
              )}
            </Box>
          </Box>
        )}

        {/* Notes */}
        {notes && (
          <Box sx={{ mt: 'auto' }}>
            <Typography 
              variant="subtitle2" 
              sx={{ 
                fontWeight: 600,
                mb: 1,
                fontSize: size === 'small' ? '0.75rem' : '0.875rem'
              }}
            >
              Notes
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ 
                fontSize: size === 'small' ? '0.75rem' : '0.875rem',
                lineHeight: 1.4,
                fontStyle: 'italic'
              }}
            >
              {notes}
            </Typography>
          </Box>
        )}

        {/* Exercise Image */}
        {(() => {
          console.log(`DEBUG: ExerciseCard for ${exercise.activity} - imageUrl:`, exercise.imageUrl);
          return null;
        })()}
        {(generateImage || exercise.imageUrl) && (
          <Box sx={{ mt: 2 }}>
            {exercise.imageUrl ? (
              <img 
                src={exercise.imageUrl} 
                alt={`${exercise.activity} exercise`}
                style={{
                  width: '100%',
                  aspectRatio: '2 / 3',
                  objectFit: 'cover',
                  borderRadius: '8px'
                }}
              />
            ) : (
              <Box 
                sx={{ 
                  height: 120,
                  bgcolor: 'grey.100',
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px dashed',
                  borderColor: 'grey.300'
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Generating exercise image...
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ExerciseCard; 