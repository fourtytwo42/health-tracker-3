'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import { useAuth } from '@/context/AuthContext';
import PersonalInfoTab from './components/PersonalInfoTab';
import FoodPreferencesTab from './components/FoodPreferencesTab';
import ExercisePreferencesTab from './components/ExercisePreferencesTab';
import CalendarTab from './components/CalendarTab';
import HealthMetricsTab from './components/HealthMetricsTab';
import MenuBuilderTab from './components/MenuBuilderTab';
import WorkoutBuilderTab from './components/WorkoutBuilderTab';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`user-details-tabpanel-${index}`}
      aria-labelledby={`user-details-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `user-details-tab-${index}`,
    'aria-controls': `user-details-tabpanel-${index}`,
  };
}

export default function UserDetailsPage() {
  const { user, loading } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [foodPreferences, setFoodPreferences] = useState<any[]>([]);
  const [exercisePreferences, setExercisePreferences] = useState<any[]>([]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  useEffect(() => {
    if (user) {
      // Load user profile and preferences for Menu Builder and Workout Builder
      const loadUserData = async () => {
        try {
          const [profileResponse, foodPreferencesResponse, exercisePreferencesResponse] = await Promise.all([
            fetch('/api/profile'),
            fetch('/api/food-preferences'),
            fetch('/api/exercise-preferences')
          ]);

          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            setUserProfile(profileData.profile);
          }

          if (foodPreferencesResponse.ok) {
            const preferencesData = await foodPreferencesResponse.json();
            setFoodPreferences(preferencesData.preferences || []);
          }

          if (exercisePreferencesResponse.ok) {
            const exerciseData = await exercisePreferencesResponse.json();
            setExercisePreferences(exerciseData.preferences || []);
          }
        } catch (error) {
          console.error('Error loading user data:', error);
        }
      };

      loadUserData();
    }
  }, [user]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">Please log in to access your user details.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        My Health Profile
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Manage your personal information, preferences, and health data
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ width: '100%', mt: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="user details tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Personal Info" {...a11yProps(0)} />
            <Tab label="Health Metrics" {...a11yProps(1)} />
            <Tab label="Food Preferences" {...a11yProps(2)} />
            <Tab label="Exercise Preferences" {...a11yProps(3)} />
            <Tab label="Menu Builder" {...a11yProps(4)} />
            <Tab label="Workout Builder" {...a11yProps(5)} />
            <Tab label="Calendar & Schedule" {...a11yProps(6)} />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <PersonalInfoTab />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <HealthMetricsTab />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <FoodPreferencesTab />
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <ExercisePreferencesTab />
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <MenuBuilderTab userProfile={userProfile} foodPreferences={foodPreferences} />
        </TabPanel>

        <TabPanel value={tabValue} index={5}>
          <WorkoutBuilderTab userProfile={userProfile} exercisePreferences={exercisePreferences} />
        </TabPanel>

        <TabPanel value={tabValue} index={6}>
          <CalendarTab />
        </TabPanel>
      </Paper>
    </Container>
  );
} 