'use client';

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  Restaurant as FoodIcon,
  FitnessCenter as FitnessIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';

interface PlanSummaryProps {
  title: string;
  description?: string;
  type: 'meal' | 'activity';
  duration: number;
  status: 'draft' | 'active' | 'completed';
  totalCalories?: number;
  totalWorkouts?: number;
  days?: Array<{
    day: number;
    meals?: Array<{ name: string; calories: number }>;
    activities?: Array<{ name: string; duration: string; calories: number }>;
  }>;
}

export default function PlanSummary({
  title,
  description,
  type,
  duration,
  status,
  totalCalories,
  totalWorkouts,
  days = [],
}: PlanSummaryProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'completed': return 'primary';
      default: return 'default';
    }
  };

  const getTypeIcon = () => {
    return type === 'meal' ? <FoodIcon /> : <FitnessIcon />;
  };

  return (
    <Card sx={{ maxWidth: 600, mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {getTypeIcon()}
          <Typography variant="h6" component="h3" sx={{ ml: 1 }}>
            {title}
          </Typography>
        </Box>

        {description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {description}
          </Typography>
        )}

        {/* Plan Stats */}
        <Box sx={{ mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <Chip 
                icon={<CalendarIcon />}
                label={`${duration} days`}
                size="small"
                variant="outlined"
              />
            </Grid>
            <Grid item>
              <Chip 
                label={status}
                size="small"
                color={getStatusColor(status) as any}
              />
            </Grid>
            {totalCalories && (
              <Grid item>
                <Chip 
                  label={`${totalCalories} kcal`}
                  size="small"
                  variant="outlined"
                />
              </Grid>
            )}
            {totalWorkouts && (
              <Grid item>
                <Chip 
                  label={`${totalWorkouts} workouts`}
                  size="small"
                  variant="outlined"
                />
              </Grid>
            )}
          </Grid>
        </Box>

        {/* Daily Breakdown */}
        {days.length > 0 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Daily Breakdown
            </Typography>
            <List dense>
              {days.slice(0, 3).map((day, index) => (
                <ListItem key={index} sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <CheckIcon color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={`Day ${day.day}`}
                    secondary={
                      type === 'meal' 
                        ? `${day.meals?.length || 0} meals planned`
                        : `${day.activities?.length || 0} activities planned`
                    }
                    primaryTypographyProps={{ variant: 'body2', fontWeight: 'medium' }}
                    secondaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              ))}
              {days.length > 3 && (
                <ListItem sx={{ py: 0.5 }}>
                  <ListItemText 
                    primary={`... and ${days.length - 3} more days`}
                    primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                  />
                </ListItem>
              )}
            </List>
          </Box>
        )}
      </CardContent>
    </Card>
  );
} 