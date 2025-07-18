'use client';

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  Flag as FlagIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';

interface GoalBadgeProps {
  title: string;
  description?: string;
  type: 'weight' | 'fitness' | 'nutrition' | 'general';
  target: string;
  current: string;
  progress: number; // 0-100
  deadline?: string;
  status: 'active' | 'completed' | 'overdue';
}

export default function GoalBadge({
  title,
  description,
  type,
  target,
  current,
  progress,
  deadline,
  status,
}: GoalBadgeProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'overdue': return 'error';
      default: return 'primary';
    }
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'weight': return '⚖️';
      case 'fitness': return '💪';
      case 'nutrition': return '🥗';
      default: return '🎯';
    }
  };

  return (
    <Card sx={{ maxWidth: 400, mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ mr: 1, fontSize: '1.5rem' }}>
            {getTypeIcon()}
          </Box>
          <Typography variant="h6" component="h3">
            {title}
          </Typography>
        </Box>

        {description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {description}
          </Typography>
        )}

        {/* Progress */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Progress
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {progress}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        {/* Stats */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Chip 
              label={`${current} / ${target}`}
              size="small"
              variant="outlined"
            />
            <Chip 
              label={status}
              size="small"
              color={getStatusColor(status) as any}
            />
          </Box>
        </Box>

        {/* Deadline */}
        {deadline && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TrendingUpIcon sx={{ mr: 1, fontSize: '1rem', color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              Due: {deadline}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
} 