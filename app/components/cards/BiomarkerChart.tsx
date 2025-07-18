'use client';

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  MonitorWeight as WeightIcon,
} from '@mui/icons-material';

interface BiomarkerDataPoint {
  date: string;
  value: number;
  unit: string;
}

interface BiomarkerChartProps {
  metric: string;
  data: BiomarkerDataPoint[];
  currentValue: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  targetRange?: { min: number; max: number };
}

export default function BiomarkerChart({
  metric,
  data,
  currentValue,
  unit,
  trend,
  targetRange,
}: BiomarkerChartProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return <TrendingUpIcon color="success" />;
      case 'down': return <TrendingDownIcon color="error" />;
      default: return <TrendingUpIcon color="action" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'success';
      case 'down': return 'error';
      default: return 'default';
    }
  };

  const isInTargetRange = targetRange 
    ? currentValue >= targetRange.min && currentValue <= targetRange.max
    : true;

  return (
    <Card sx={{ maxWidth: 500, mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <WeightIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" component="h3">
            {metric.charAt(0).toUpperCase() + metric.slice(1)}
          </Typography>
        </Box>

        {/* Current Value */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h4" fontWeight="bold">
              {currentValue}
            </Typography>
            <Typography variant="h6" color="text.secondary">
              {unit}
            </Typography>
            {getTrendIcon()}
          </Box>
        </Box>

        {/* Status */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Chip 
              label={`Trend: ${trend}`}
              size="small"
              color={getTrendColor() as any}
            />
            {targetRange && (
              <Chip 
                label={isInTargetRange ? 'In Range' : 'Out of Range'}
                size="small"
                color={isInTargetRange ? 'success' : 'warning'}
                variant="outlined"
              />
            )}
          </Box>
        </Box>

        {/* Target Range */}
        {targetRange && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Target Range: {targetRange.min} - {targetRange.max} {unit}
            </Typography>
          </Box>
        )}

        {/* Recent Data */}
        {data.length > 0 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Recent History
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {data.slice(-5).map((point, index) => (
                <Chip
                  key={index}
                  label={`${point.value}${point.unit}`}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
} 