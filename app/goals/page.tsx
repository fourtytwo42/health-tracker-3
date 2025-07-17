'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Button,
  Stack,
  LinearProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  TrendingUp as TrendingUpIcon,
  EmojiEvents as EmojiEventsIcon,
} from '@mui/icons-material';

interface Goal {
  id: string;
  title: string;
  description?: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  category: string;
  deadline?: string;
  isCompleted: boolean;
  progress: number;
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        // For now, use mock data since we need authentication
        // TODO: Replace with real API calls when auth is implemented
        setGoals([
          {
            id: '1',
            title: 'Lose 10 pounds',
            description: 'Reach target weight through diet and exercise',
            targetValue: 10,
            currentValue: 3,
            unit: 'pounds',
            category: 'WEIGHT',
            deadline: '2024-12-31',
            isCompleted: false,
            progress: 30,
          },
          {
            id: '2',
            title: 'Run 5K',
            description: 'Complete a 5K race',
            targetValue: 5,
            currentValue: 3,
            unit: 'km',
            category: 'FITNESS',
            deadline: '2024-11-30',
            isCompleted: false,
            progress: 60,
          },
          {
            id: '3',
            title: 'Eat 5 servings of vegetables daily',
            description: 'Improve nutrition with more vegetables',
            targetValue: 5,
            currentValue: 5,
            unit: 'servings',
            category: 'NUTRITION',
            deadline: '2024-12-31',
            isCompleted: true,
            progress: 100,
          },
        ]);

        // TODO: Real API call (commented out until auth is ready)
        /*
        const response = await fetch('/api/goals');
        if (response.ok) {
          const goalsData = await response.json();
          setGoals(goalsData.map((goal: any) => ({
            id: goal.id,
            title: goal.title,
            description: goal.description,
            targetValue: goal.targetValue,
            currentValue: goal.currentValue || 0,
            unit: goal.unit,
            category: goal.type,
            deadline: goal.deadline,
            isCompleted: goal.status === 'COMPLETED',
            progress: goal.targetValue ? Math.round((goal.currentValue / goal.targetValue) * 100) : 0,
          })));
        }
        */
      } catch (error) {
        console.error('Error fetching goals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGoals();
  }, []);

  const handleAddGoal = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'WEIGHT':
        return 'primary';
      case 'FITNESS':
        return 'secondary';
      case 'NUTRITION':
        return 'success';
      case 'HEALTH':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'WEIGHT':
        return <TrendingUpIcon />;
      case 'FITNESS':
        return <EmojiEventsIcon />;
      default:
        return <TrendingUpIcon />;
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <LinearProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">My Goals</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddGoal}
        >
          Add Goal
        </Button>
      </Box>

      <Stack spacing={3}>
        {goals.map((goal) => (
          <Card key={goal.id} sx={{ position: 'relative' }}>
            <CardHeader
              avatar={getCategoryIcon(goal.category)}
              title={goal.title}
              subheader={goal.description}
              action={
                <Chip
                  label={goal.category}
                  color={getCategoryColor(goal.category) as any}
                  size="small"
                />
              }
            />
            <CardContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Progress: {goal.currentValue} / {goal.targetValue} {goal.unit}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={goal.progress}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {goal.progress}% complete
                </Typography>
              </Box>
              
              {goal.deadline && (
                <Typography variant="body2" color="text.secondary">
                  Deadline: {new Date(goal.deadline).toLocaleDateString()}
                </Typography>
              )}
              
              {goal.isCompleted && (
                <Chip
                  label="Completed!"
                  color="success"
                  icon={<EmojiEventsIcon />}
                  sx={{ mt: 1 }}
                />
              )}
            </CardContent>
          </Card>
        ))}
      </Stack>

      {/* Add Goal Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Goal</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Goal Title"
              placeholder="e.g., Lose 10 pounds"
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={2}
              placeholder="Describe your goal..."
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="Target Value"
                type="number"
                sx={{ flex: 1 }}
              />
              <TextField
                label="Unit"
                placeholder="pounds, km, etc."
                sx={{ flex: 1 }}
              />
            </Stack>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select label="Category">
                <MenuItem value="WEIGHT">Weight</MenuItem>
                <MenuItem value="FITNESS">Fitness</MenuItem>
                <MenuItem value="NUTRITION">Nutrition</MenuItem>
                <MenuItem value="HEALTH">Health</MenuItem>
                <MenuItem value="OTHER">Other</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Deadline"
              type="date"
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleCloseDialog}>
            Add Goal
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
} 