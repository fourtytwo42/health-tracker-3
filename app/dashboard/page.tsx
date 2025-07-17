'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemText,
  Chip,
  Stack,
  LinearProgress,
  Avatar,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Restaurant as RestaurantIcon,
  FitnessCenter as FitnessCenterIcon,
  MonitorWeight as MonitorWeightIcon,
  EmojiEvents as EmojiEventsIcon,
} from '@mui/icons-material';
import Navigation from '../components/Navigation';

interface UserStats {
  mealsLogged: number;
  activitiesLogged: number;
  biomarkersLogged: number;
  totalGoals: number;
  completedGoals: number;
  totalPoints: number;
  rank: number | null;
}

interface RecentItem {
  id: string;
  name: string;
  timestamp: string;
  type: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentMeals, setRecentMeals] = useState<RecentItem[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentItem[]>([]);
  const [recentBiomarkers, setRecentBiomarkers] = useState<RecentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // For now, use mock data since we need authentication
        // TODO: Replace with real API calls when auth is implemented
        setStats({
          mealsLogged: 12,
          activitiesLogged: 8,
          biomarkersLogged: 5,
          totalGoals: 3,
          completedGoals: 1,
          totalPoints: 245,
          rank: 15,
        });

        setRecentMeals([
          { id: '1', name: 'Grilled Chicken Salad', timestamp: '2 hours ago', type: 'LUNCH' },
          { id: '2', name: 'Oatmeal with Berries', timestamp: '6 hours ago', type: 'BREAKFAST' },
        ]);

        setRecentActivities([
          { id: '1', name: 'Morning Run', timestamp: '1 hour ago', type: 'CARDIO' },
          { id: '2', name: 'Weight Training', timestamp: '1 day ago', type: 'STRENGTH' },
        ]);

        setRecentBiomarkers([
          { id: '1', name: 'Weight: 75.2 kg', timestamp: '2 days ago', type: 'WEIGHT' },
          { id: '2', name: 'Blood Pressure: 120/80', timestamp: '3 days ago', type: 'BLOOD_PRESSURE' },
        ]);

        // TODO: Real API calls (commented out until auth is ready)
        /*
        const [mealsRes, activitiesRes, biomarkersRes, leaderboardRes] = await Promise.all([
          fetch('/api/meals?limit=5'),
          fetch('/api/activities?daysBack=7'),
          fetch('/api/biomarkers?daysBack=7'),
          fetch('/api/leaderboard/me'),
        ]);

        if (mealsRes.ok) {
          const meals = await mealsRes.json();
          setRecentMeals(meals.slice(0, 5).map((meal: any) => ({
            id: meal.id,
            name: meal.name,
            timestamp: new Date(meal.loggedAt).toLocaleString(),
            type: meal.mealType,
          })));
        }

        if (activitiesRes.ok) {
          const activities = await activitiesRes.json();
          setRecentActivities(activities.slice(0, 5).map((activity: any) => ({
            id: activity.id,
            name: activity.name,
            timestamp: new Date(activity.loggedAt).toLocaleString(),
            type: activity.type,
          })));
        }

        if (biomarkersRes.ok) {
          const biomarkers = await biomarkersRes.json();
          setRecentBiomarkers(biomarkers.data.slice(0, 5).map((bio: any) => ({
            id: bio.id,
            name: `${bio.type}: ${bio.value} ${bio.unit}`,
            timestamp: new Date(bio.loggedAt).toLocaleString(),
            type: bio.type,
          })));
        }

        if (leaderboardRes.ok) {
          const leaderboard = await leaderboardRes.json();
          setStats(prev => ({
            ...prev!,
            totalPoints: leaderboard.totalPoints,
            rank: leaderboard.rank,
          }));
        }
        */
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <LinearProgress />
      </Container>
    );
  }

  return (
    <>
      <Navigation />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>

      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <RestaurantIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">{stats?.mealsLogged}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Meals Logged
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'secondary.main' }}>
                  <FitnessCenterIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">{stats?.activitiesLogged}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Activities Logged
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <MonitorWeightIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">{stats?.biomarkersLogged}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Biomarkers Tracked
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <EmojiEventsIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">{stats?.totalPoints}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Points
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Goals Progress */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Goals Progress" />
            <CardContent>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" gutterBottom>
                    Completed Goals: {stats?.completedGoals}/{stats?.totalGoals}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={stats ? (stats.completedGoals / stats.totalGoals) * 100 : 0}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Keep up the great work! You're making excellent progress toward your health goals.
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Leaderboard Status" />
            <CardContent>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="h6" color="primary">
                    Rank #{stats?.rank || 'Unranked'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stats?.totalPoints} points earned
                  </Typography>
                </Box>
                <Chip 
                  icon={<TrendingUpIcon />}
                  label="View Leaderboard"
                  color="primary"
                  variant="outlined"
                  clickable
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      {/* Recent Activity */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Recent Meals" />
            <CardContent>
              <List dense>
                {recentMeals.map((meal) => (
                  <ListItem key={meal.id}>
                    <ListItemText
                      primary={meal.name}
                      secondary={meal.timestamp}
                    />
                    <Chip label={meal.type} size="small" />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Recent Activities" />
            <CardContent>
              <List dense>
                {recentActivities.map((activity) => (
                  <ListItem key={activity.id}>
                    <ListItemText
                      primary={activity.name}
                      secondary={activity.timestamp}
                    />
                    <Chip label={activity.type} size="small" />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Recent Biomarkers" />
            <CardContent>
              <List dense>
                {recentBiomarkers.map((biomarker) => (
                  <ListItem key={biomarker.id}>
                    <ListItemText
                      primary={biomarker.name}
                      secondary={biomarker.timestamp}
                    />
                    <Chip label={biomarker.type} size="small" />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
    </>
  );
} 