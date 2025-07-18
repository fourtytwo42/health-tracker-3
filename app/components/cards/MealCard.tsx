'use client';

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Grid,
} from '@mui/material';
import {
  Restaurant as RestaurantIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';

interface MealCardProps {
  title: string;
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  time?: string;
  status: 'logged' | 'planned' | 'completed';
  message?: string;
}

export default function MealCard({
  title,
  mealType,
  calories,
  protein,
  carbs,
  fat,
  time,
  status,
  message,
}: MealCardProps) {
  const getMealTypeColor = (type: string) => {
    switch (type) {
      case 'BREAKFAST': return 'warning';
      case 'LUNCH': return 'info';
      case 'DINNER': return 'primary';
      case 'SNACK': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'planned': return 'info';
      default: return 'default';
    }
  };

  return (
    <Card sx={{ maxWidth: 500, mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <RestaurantIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" component="h3">
            {title}
          </Typography>
        </Box>

        {/* Meal Type and Status */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Chip 
              label={mealType}
              size="small"
              color={getMealTypeColor(mealType) as any}
            />
            <Chip 
              label={status}
              size="small"
              color={getStatusColor(status) as any}
            />
            {time && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TimeIcon sx={{ mr: 0.5, fontSize: '1rem', color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {time}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* Nutrition Info */}
        {(calories || protein || carbs || fat) && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Nutrition
            </Typography>
            <Grid container spacing={1}>
              {calories && (
                <Grid item>
                  <Chip label={`${calories} kcal`} size="small" variant="outlined" />
                </Grid>
              )}
              {protein && (
                <Grid item>
                  <Chip label={`${protein}g protein`} size="small" variant="outlined" />
                </Grid>
              )}
              {carbs && (
                <Grid item>
                  <Chip label={`${carbs}g carbs`} size="small" variant="outlined" />
                </Grid>
              )}
              {fat && (
                <Grid item>
                  <Chip label={`${fat}g fat`} size="small" variant="outlined" />
                </Grid>
              )}
            </Grid>
          </Box>
        )}

        {/* Message */}
        {message && (
          <Box>
            <Typography variant="body2" color="text.secondary">
              {message}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
} 