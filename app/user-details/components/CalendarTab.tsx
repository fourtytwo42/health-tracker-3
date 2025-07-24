'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Stack,
  Chip,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Restaurant as MealIcon,
  FitnessCenter as ExerciseIcon,
  CalendarToday as CalendarIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  DragIndicator as DragIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { useAuth } from '@/context/AuthContext';

interface ScheduledItem {
  id: string;
  title: string;
  type: 'meal' | 'workout';
  scheduledDate: string;
  scheduledTime: string;
  duration?: number; // Duration in minutes
  notes?: string;
  isCompleted: boolean;
  itemId?: string; // ID of the original recipe/workout
  mealType?: string; // For meals: breakfast, lunch, dinner, snack
  servings?: number; // For meals: number of servings
  nutrition?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
  };
}

interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isPast: boolean;
  items: ScheduledItem[];
}

interface Recipe {
  id: string;
  name: string;
  isFavorite: boolean;
  mealType?: string;
  servings?: number;
  nutrition?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
  };
}

interface Workout {
  id: string;
  name: string;
  isFavorite: boolean;
  duration?: number; // Duration in minutes
}

interface TimePeriod {
  period: string;
  items: ScheduledItem[];
}

interface UserProfile {
  weight?: number;
  height?: number;
  age?: number;
  gender?: string;
  activityLevel?: string;
}

interface CalorieSummary {
  period: string;
  restingCalories: number;
  caloriesConsumed: number;
  caloriesBurned: number;
  netCalories: number;
  deficit: number;
  fastingHours?: number;
}

const TIME_PERIODS = [
  'Morning',
  'Midday', 
  'Afternoon',
  'Evening'
];

// Period-specific fasting hours (assuming 8pm to 8am fasting)
const FASTING_HOURS = {
  'Morning': 12, // 8pm to 8am
  'Midday': 0,
  'Afternoon': 0,
  'Evening': 0
};

export default function CalendarTab() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [scheduledItems, setScheduledItems] = useState<ScheduledItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [timePeriods, setTimePeriods] = useState<TimePeriod[]>([]);
  const [favoriteRecipes, setFavoriteRecipes] = useState<Recipe[]>([]);
  const [favoriteWorkouts, setFavoriteWorkouts] = useState<Workout[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>({});
  const [calorieSummaries, setCalorieSummaries] = useState<CalorieSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Drag and drop state
  const [draggedItem, setDraggedItem] = useState<{ 
    type: 'recipe' | 'workout', 
    id: string, 
    name: string, 
    duration?: number,
    mealType?: string,
    servings?: number,
    nutrition?: {
      calories?: number;
      protein?: number;
      carbs?: number;
      fat?: number;
      fiber?: number;
    }
  } | null>(null);
  const [dragOverTime, setDragOverTime] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      generateCalendar();
      loadScheduledItems();
      loadFavoriteRecipes();
      loadFavoriteWorkouts();
      loadUserProfile();
    }
  }, [user, currentDate]);

  // Set today as selected date when calendar is first generated
  useEffect(() => {
    if (calendarDays.length > 0 && selectedDate) {
      const today = calendarDays.find(day => day.isToday);
      if (today && !selectedDay) {
        setSelectedDay(today);
      }
    }
  }, [calendarDays, selectedDate, selectedDay]);

  // Listen for favorite changes
  useEffect(() => {
    const handleFavoriteChange = () => {
      loadFavoriteRecipes();
      loadFavoriteWorkouts();
    };

    window.addEventListener('favoriteChanged', handleFavoriteChange);
    return () => {
      window.removeEventListener('favoriteChanged', handleFavoriteChange);
    };
  }, []);

  useEffect(() => {
    if (selectedDate) {
      generateTimePeriods();
    }
  }, [selectedDate, scheduledItems, userProfile]);

  const generateCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
    
    const days: CalendarDay[] = [];
    const today = new Date();
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const date = new Date(d);
      const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
      days.push({
        date,
        day: date.getDate(),
        isCurrentMonth: date.getMonth() === month,
        isToday: date.toDateString() === today.toDateString(),
        isPast,
        items: []
      });
    }
    
    setCalendarDays(days);
  };

  const generateTimePeriods = () => {
    if (!selectedDate) return;

    const dateStr = selectedDate.toISOString().split('T')[0];
    const dayItems = scheduledItems.filter(item => item.scheduledDate === dateStr);
    
    // Initialize periods
    const periods = TIME_PERIODS.map(period => ({
      period,
      items: [] as ScheduledItem[]
    }));
    
    // Process each scheduled item
    dayItems.forEach(item => {
      // Map time to period (we'll need to update the database to store period instead of time)
      const period = item.scheduledTime; // For now, use scheduledTime as period
      const periodIndex = TIME_PERIODS.indexOf(period);
      if (periodIndex !== -1) {
        periods[periodIndex].items.push(item);
      }
    });
    
    setTimePeriods(periods);
    calculateCalorieSummaries(periods);
  };

  const loadUserProfile = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.log('No access token found'); // Debug log
        return;
      }

      // Get profile data (height, age, gender, activity level)
      const profileResponse = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Profile API response status:', profileResponse.status); // Debug log
      
      let profileData: UserProfile = {
        weight: undefined,
        height: undefined,
        age: undefined,
        gender: undefined,
        activityLevel: undefined
      };
      
      if (profileResponse.ok) {
        const data = await profileResponse.json();
        console.log('Raw profile API response:', data); // Debug log
        
        if (data.profile) {
          // Calculate age from dateOfBirth
          let age: number | undefined = undefined;
          if (data.profile.dateOfBirth) {
            const birthDate = new Date(data.profile.dateOfBirth);
            const today = new Date();
            age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
              age--;
            }
          }
          
          profileData = {
            weight: undefined, // Will get from biomarkers
            height: data.profile.height,
            age: age,
            gender: data.profile.gender,
            activityLevel: data.profile.activityLevel
          };
          console.log('Profile height:', data.profile.height, 'cm'); // Debug log
          console.log('Profile age calculated:', age); // Debug log
          console.log('Profile gender:', data.profile.gender); // Debug log
          console.log('Profile activity level:', data.profile.activityLevel); // Debug log
        } else {
          console.log('No profile data found in response - user may need to complete profile'); // Debug log
        }
      } else {
        console.log('Profile API response not ok:', profileResponse.status); // Debug log
        const errorText = await profileResponse.text();
        console.log('Profile API error response:', errorText); // Debug log
      }

      // Get current weight from biomarkers
      const biomarkersResponse = await fetch('/api/biomarkers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (biomarkersResponse.ok) {
        const biomarkersData = await biomarkersResponse.json();
        console.log('Biomarkers API response:', biomarkersData); // Debug log
        
        // Find the latest weight entry
        const weightEntries = biomarkersData.biomarkers?.filter((b: any) => b.type === 'WEIGHT') || [];
        if (weightEntries.length > 0) {
          // Sort by date and get the latest
          const latestWeight = weightEntries.sort((a: any, b: any) => 
            new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime()
          )[0];
          
          profileData.weight = latestWeight.value; // This is in kg
          console.log('Latest weight from biomarkers:', latestWeight.value, 'kg'); // Debug log
        } else {
          console.log('No weight entries found in biomarkers'); // Debug log
        }
      } else {
        console.log('Biomarkers API response not ok:', biomarkersResponse.status); // Debug log
      }

      console.log('Final user profile data for calorie calculation:', profileData); // Debug log
      setUserProfile(profileData);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  // Calculate BMR using Mifflin-St Jeor Equation
  const calculateBMR = (weight: number, height: number, age: number, gender: string): number => {
    if (gender === 'MALE') {
      return 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      return 10 * weight + 6.25 * height - 5 * age - 161;
    }
  };

  // Calculate daily resting calories
  const calculateDailyRestingCalories = (): number => {
    console.log('=== CALORIE CALCULATION DEBUG ==='); // Debug log
    console.log('User profile for calorie calculation:', userProfile); // Debug log
    console.log('User profile weight:', userProfile.weight, 'kg'); // Debug log
    console.log('User profile height:', userProfile.height, 'cm'); // Debug log
    console.log('User profile age:', userProfile.age); // Debug log
    console.log('User profile gender:', userProfile.gender); // Debug log
    console.log('User profile activity level:', userProfile.activityLevel); // Debug log
    
    if (!userProfile.weight || !userProfile.height || !userProfile.age || !userProfile.gender) {
      console.log('Missing user profile data, using fallback values'); // Debug log
      console.log('Missing weight:', !userProfile.weight); // Debug log
      console.log('Missing height:', !userProfile.height); // Debug log
      console.log('Missing age:', !userProfile.age); // Debug log
      console.log('Missing gender:', !userProfile.gender); // Debug log
      
      // Fallback to average values if profile data is missing
      const fallbackWeight = 70; // kg
      const fallbackHeight = 170; // cm
      const fallbackAge = 30;
      const fallbackGender = 'MALE';
      const fallbackActivityLevel = 'SEDENTARY';
      
      console.log('Using fallback values:'); // Debug log
      console.log('- Weight:', fallbackWeight, 'kg'); // Debug log
      console.log('- Height:', fallbackHeight, 'cm'); // Debug log
      console.log('- Age:', fallbackAge); // Debug log
      console.log('- Gender:', fallbackGender); // Debug log
      console.log('- Activity Level:', fallbackActivityLevel); // Debug log
      
      const bmr = calculateBMR(fallbackWeight, fallbackHeight, fallbackAge, fallbackGender);
      console.log('Fallback BMR calculated:', bmr); // Debug log
      
      const activityMultipliers = {
        'SEDENTARY': 1.2,
        'LIGHTLY_ACTIVE': 1.375,
        'MODERATELY_ACTIVE': 1.55,
        'VERY_ACTIVE': 1.725,
        'EXTREMELY_ACTIVE': 1.9
      };
      
      const multiplier = activityMultipliers[fallbackActivityLevel] || 1.2;
      const dailyCalories = Math.round(bmr * multiplier);
      console.log('Fallback daily calories calculated:', dailyCalories); // Debug log
      console.log('=== END FALLBACK CALCULATION ==='); // Debug log
      return dailyCalories;
    }
    
    console.log('Using actual user profile data for calculation'); // Debug log
    const bmr = calculateBMR(userProfile.weight, userProfile.height, userProfile.age, userProfile.gender);
    console.log('Actual BMR calculated:', bmr); // Debug log
    
    // Activity multipliers
    const activityMultipliers = {
      'SEDENTARY': 1.2,
      'LIGHTLY_ACTIVE': 1.375,
      'MODERATELY_ACTIVE': 1.55,
      'VERY_ACTIVE': 1.725,
      'EXTREMELY_ACTIVE': 1.9
    };
    
    const multiplier = activityMultipliers[userProfile.activityLevel as keyof typeof activityMultipliers] || 1.2;
    const dailyCalories = Math.round(bmr * multiplier);
    console.log('Actual daily calories calculated:', dailyCalories); // Debug log
    console.log('=== END ACTUAL CALCULATION ==='); // Debug log
    return dailyCalories;
  };

  // Calculate period-specific resting calories (6 hours per period)
  const calculatePeriodRestingCalories = (period: string): number => {
    const dailyCalories = calculateDailyRestingCalories();
    const hoursInPeriod = 6; // 24 hours / 4 periods
    const fastingHours = FASTING_HOURS[period as keyof typeof FASTING_HOURS] || 0;
    
    // Adjust for fasting (reduce metabolic rate during fasting)
    const fastingAdjustment = fastingHours > 0 ? 0.85 : 1; // 15% reduction during fasting
    
    return Math.round((dailyCalories / 24) * hoursInPeriod * fastingAdjustment);
  };

  // Calculate calories consumed from meals in a period
  const calculateCaloriesConsumed = (items: ScheduledItem[]): number => {
    return items
      .filter(item => item.type === 'meal')
      .reduce((total, item) => {
        const calories = item.nutrition?.calories || 0; // This is already total calories
        console.log(`Calculating calories for ${item.title}: ${calories} cal total`);
        return total + calories;
      }, 0);
  };

  // Calculate calories burned from workouts in a period
  const calculateCaloriesBurned = (items: ScheduledItem[]): number => {
    return items
      .filter(item => item.type === 'workout')
      .reduce((total, item) => {
        const duration = item.duration || 30;
        // Estimate 8-10 calories per minute for moderate exercise
        const caloriesPerMinute = 9;
        return total + (duration * caloriesPerMinute);
      }, 0);
  };

  const calculateCalorieSummaries = (periods: TimePeriod[]) => {
    const summaries: CalorieSummary[] = periods.map(period => {
      const restingCalories = calculatePeriodRestingCalories(period.period);
      const caloriesConsumed = calculateCaloriesConsumed(period.items);
      const caloriesBurned = calculateCaloriesBurned(period.items);
      const netCalories = caloriesConsumed - caloriesBurned;
      const deficit = restingCalories - netCalories;
      const fastingHours = FASTING_HOURS[period.period as keyof typeof FASTING_HOURS];

      return {
        period: period.period,
        restingCalories,
        caloriesConsumed,
        caloriesBurned,
        netCalories,
        deficit,
        fastingHours
      };
    });

    setCalorieSummaries(summaries);
  };

  const loadScheduledItems = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch('/api/schedule', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        // Parse nutrition data from JSON string
        const itemsWithParsedNutrition = (data.items || []).map((item: any) => ({
          ...item,
          nutrition: item.nutrition ? JSON.parse(item.nutrition) : undefined
        }));
        console.log('Loaded scheduled items with nutrition:', itemsWithParsedNutrition);
        setScheduledItems(itemsWithParsedNutrition);
      }
    } catch (error) {
      console.error('Error loading scheduled items:', error);
      setError('Failed to load scheduled items');
    } finally {
      setLoading(false);
    }
  };

  const loadFavoriteRecipes = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch('/api/recipes?isFavorite=true&limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Raw recipe data:', data.recipes); // Debug log
        // Transform the detailed recipe data to match our interface
        const transformedRecipes = (data.recipes || []).map((recipe: any) => ({
          id: recipe.id,
          name: recipe.name,
          isFavorite: recipe.isFavorite,
          mealType: recipe.mealType,
          servings: recipe.servings,
          nutrition: {
            calories: recipe.nutrition?.caloriesPerServing,
            protein: recipe.nutrition?.proteinPerServing,
            carbs: recipe.nutrition?.carbsPerServing,
            fat: recipe.nutrition?.fatPerServing,
            fiber: recipe.nutrition?.fiberPerServing
          }
        }));
        console.log('Transformed recipes:', transformedRecipes); // Debug log
        setFavoriteRecipes(transformedRecipes);
      }
    } catch (error) {
      console.error('Error loading favorite recipes:', error);
    }
  };

  const loadFavoriteWorkouts = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch('/api/workouts?isFavorite=true&limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setFavoriteWorkouts(data.workouts || []);
      }
    } catch (error) {
      console.error('Error loading favorite workouts:', error);
    }
  };

  const handleDateClick = (day: CalendarDay) => {
    if (day.isPast) return; // Prevent clicking on past days
    setSelectedDate(day.date);
    setSelectedDay(day);
  };

  const handleDragStart = (e: React.DragEvent, item: { 
    type: 'recipe' | 'workout', 
    id: string, 
    name: string, 
    duration?: number,
    mealType?: string,
    servings?: number,
    nutrition?: {
      calories?: number;
      protein?: number;
      carbs?: number;
      fat?: number;
      fiber?: number;
    }
  }) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, period: string) => {
    e.preventDefault();
    setDragOverTime(period);
  };

  const handleDragLeave = () => {
    setDragOverTime(null);
  };

  const handleDrop = async (e: React.DragEvent, period: string) => {
    e.preventDefault();
    setDragOverTime(null);
    
    if (!draggedItem || !selectedDate) return;

    try {
      const scheduledItem = {
        title: draggedItem.name,
        type: draggedItem.type === 'recipe' ? 'meal' : 'workout',
        scheduledDate: selectedDate.toISOString().split('T')[0],
        scheduledTime: period, // Now using period instead of time
        duration: draggedItem.duration || (draggedItem.type === 'workout' ? 30 : 15), // Default 30 min for workouts, 15 min for meals
        itemId: draggedItem.id,
        notes: '',
        // Add recipe details if it's a recipe
        ...(draggedItem.type === 'recipe' && {
          mealType: draggedItem.mealType,
          servings: draggedItem.servings,
          nutrition: draggedItem.nutrition
        })
      };
      
      console.log('Scheduling item with nutrition data:', {
        name: draggedItem.name,
        nutrition: draggedItem.nutrition,
        servings: draggedItem.servings
      });

      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(scheduledItem),
      });

      if (response.ok) {
        setSuccess(`${draggedItem.name} scheduled successfully!`);
        await loadScheduledItems();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to schedule item');
      }
    } catch (error) {
      setError('An error occurred while scheduling item');
    }
    
    setDraggedItem(null);
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this scheduled item?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch(`/api/schedule/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setSuccess('Scheduled item deleted successfully!');
        await loadScheduledItems();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete scheduled item');
      }
    } catch (error) {
      setError('An error occurred while deleting scheduled item');
    }
  };

  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };



  const getDayItems = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return scheduledItems.filter(item => item.scheduledDate === dateStr);
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Calendar & Schedule
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Plan your meals and workouts with an Outlook-style calendar interface.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Calendar */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader
              title={getMonthName(currentDate)}
              action={
                <Box display="flex" gap={1}>
                  <IconButton size="small" onClick={() => navigateMonth('prev')}>
                    <CalendarIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => navigateMonth('next')}>
                    <CalendarIcon />
                  </IconButton>
                </Box>
              }
            />
            <CardContent>
              {/* Day headers */}
              <Grid container sx={{ mb: 1 }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <Grid item xs={12/7} key={day}>
                    <Typography variant="body2" align="center" fontWeight="bold">
                      {day}
                    </Typography>
                  </Grid>
                ))}
              </Grid>

              {/* Calendar days */}
              <Grid container spacing={0.5}>
                {calendarDays.map((day, index) => {
                  const dayItems = getDayItems(day.date);
                  return (
                    <Grid item xs={12/7} key={index}>
                      <Box
                        sx={{
                          aspectRatio: '1',
                          border: 1,
                          borderColor: day.isToday ? 'primary.main' : 'divider',
                          borderRadius: 1,
                          p: 0.5,
                          cursor: day.isPast ? 'not-allowed' : 'pointer',
                          bgcolor: day.isPast ? 'action.disabledBackground' :
                                  day.isToday ? 'primary.50' : 
                                  day.isCurrentMonth ? 'background.paper' : 'action.hover',
                          opacity: day.isPast ? 0.5 : 1,
                          '&:hover': { 
                            bgcolor: day.isPast ? 'action.disabledBackground' : 'action.hover' 
                          },
                          ...(selectedDate?.toDateString() === day.date.toDateString() && {
                            bgcolor: 'primary.100',
                            borderColor: 'primary.main'
                          })
                        }}
                        onClick={() => handleDateClick(day)}
                      >
                        <Typography
                          variant="body2"
                          align="center"
                          color={day.isPast ? 'text.disabled' : 
                                 day.isCurrentMonth ? 'text.primary' : 'text.secondary'}
                          fontWeight={day.isToday ? 'bold' : 'normal'}
                        >
                          {day.day}
                        </Typography>
                        {dayItems.length > 0 && (
                          <Box sx={{ mt: 0.5 }}>
                            {dayItems.slice(0, 2).map((item, idx) => (
                              <Box
                                key={idx}
                                sx={{
                                  height: 4,
                                  bgcolor: item.type === 'meal' ? 'success.main' : 'info.main',
                                  borderRadius: 0.5,
                                  mb: 0.25
                                }}
                              />
                            ))}
                            {dayItems.length > 2 && (
                              <Typography variant="caption" color="text.secondary">
                                +{dayItems.length - 2} more
                              </Typography>
                            )}
                          </Box>
                        )}
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Schedule Timeline */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader
              title={
                selectedDate 
                  ? `Schedule for ${selectedDate.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}`
                  : 'Schedule for Today'
              }
            />
            <CardContent>
              <Box sx={{ overflowY: 'auto' }}>
                  {timePeriods.map((period) => (
                    <Box
                      key={period.period}
                      sx={{
                        display: 'flex',
                        borderBottom: 1,
                        borderColor: 'divider',
                        minHeight: 120,
                        bgcolor: dragOverTime === period.period ? 'action.hover' : 'transparent',
                        transition: 'background-color 0.2s'
                      }}
                      onDragOver={(e) => handleDragOver(e, period.period)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, period.period)}
                    >
                      {/* Period column */}
                      <Box
                        sx={{
                          width: 100,
                          p: 1,
                          borderRight: 1,
                          borderColor: 'divider',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Typography variant="body2" color="text.secondary" fontWeight="bold">
                          {period.period}
                        </Typography>
                      </Box>

                      {/* Items column */}
                      <Box sx={{ flex: 1, p: 1 }}>
                        {period.items.map((item) => (
                          <Box
                            key={item.id}
                            sx={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 1,
                              p: 1,
                              mb: 1,
                              bgcolor: item.type === 'meal' ? 'success.50' : 'info.50',
                              border: 1,
                              borderColor: item.type === 'meal' ? 'success.200' : 'info.200',
                              borderRadius: 1
                            }}
                          >
                            {item.type === 'meal' ? <MealIcon color="success" /> : <ExerciseIcon color="info" />}
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body2" fontWeight="medium">
                                {item.title}
                              </Typography>
                              
                              {/* Recipe details */}
                              {item.type === 'meal' && (
                                <Box sx={{ mt: 0.5 }}>
                                  {item.mealType && (
                                    <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                                      {item.mealType}
                                    </Typography>
                                  )}
                                  {item.servings && (
                                    <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                                      {item.servings} serving{item.servings > 1 ? 's' : ''}
                                    </Typography>
                                  )}
                                  {item.nutrition && (
                                    <>
                                      <Typography variant="caption" color="success.main" fontWeight="bold" sx={{ mr: 1 }}>
                                        +{Math.round(item.nutrition.calories || 0)} cal
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                                        {Math.round(item.nutrition.protein || 0)}g protein
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                                        {Math.round(item.nutrition.carbs || 0)}g carbs
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {Math.round(item.nutrition.fat || 0)}g fat
                                      </Typography>
                                    </>
                                  )}
                                </Box>
                              )}
                              
                              {/* Workout details */}
                              {item.type === 'workout' && (
                                <>
                                  {item.duration && (
                                    <Typography variant="caption" color="info.main" fontWeight="bold" sx={{ mr: 1 }}>
                                      -{Math.round((item.duration * 9))} cal
                                    </Typography>
                                  )}
                                  <Typography variant="caption" color="text.secondary">
                                    {item.duration} minutes
                                  </Typography>
                                </>
                              )}
                            </Box>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteItem(item.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        ))}
                        
                        {/* Period Calorie Summary */}
                        {period.items.length > 0 && (
                          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1, border: 1, borderColor: 'divider' }}>
                            <Typography variant="body2" fontWeight="bold" gutterBottom>
                              {period.period} Summary:
                            </Typography>
                            <Box sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                              {(() => {
                                const summary = calorieSummaries.find(s => s.period === period.period);
                                if (!summary) return null;
                                
                                return (
                                  <>
                                    <Box sx={{ mb: 1 }}>
                                      <Typography variant="caption" color="text.secondary">
                                        Resting calories (6h): 
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                        -{summary.restingCalories} cal
                                        {summary.fastingHours && summary.fastingHours > 0 && (
                                          <span style={{ color: '#ed6c02' }}> (fasting adjusted)</span>
                                        )}
                                      </Typography>
                                    </Box>
                                    <Box sx={{ mb: 1 }}>
                                      <Typography variant="caption" color="text.secondary">
                                        Calories consumed: 
                                      </Typography>
                                      <Typography variant="caption" color="success.main" sx={{ ml: 1 }}>
                                        +{summary.caloriesConsumed} cal
                                      </Typography>
                                    </Box>
                                    <Box sx={{ mb: 1 }}>
                                      <Typography variant="caption" color="text.secondary">
                                        Calories burned: 
                                      </Typography>
                                      <Typography variant="caption" color="info.main" sx={{ ml: 1 }}>
                                        -{summary.caloriesBurned} cal
                                      </Typography>
                                    </Box>
                                    <Divider sx={{ my: 1 }} />
                                    <Box>
                                      <Typography variant="caption" color="text.secondary">
                                        {period.period} {summary.deficit > 0 ? 'Deficit' : 'Surplus'}: 
                                      </Typography>
                                      <Typography 
                                        variant="caption" 
                                        color={summary.deficit > 0 ? 'success.main' : 'error.main'} 
                                        fontWeight="bold"
                                        sx={{ ml: 1 }}
                                      >
                                        {summary.deficit > 0 ? '+' : ''}{summary.deficit} cal
                                      </Typography>
                                    </Box>
                                  </>
                                );
                              })()}
                            </Box>
                          </Box>
                        )}
                        
                        {period.items.length === 0 && (
                          <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                            Drop items here
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  ))}
                  
                  {/* Daily Calorie Summary */}
                  <Box sx={{ mt: 3, p: 3, bgcolor: 'primary.50', borderRadius: 2, border: 2, borderColor: 'primary.main' }}>
                    <Typography variant="h6" gutterBottom color="primary.main">
                      Daily Calorie Summary
                    </Typography>
                    <Box sx={{ fontFamily: 'monospace', fontSize: '1rem' }}>
                      <Grid container spacing={2}>
                        <Grid item xs={3}>
                          <Typography variant="body2" color="text.secondary">
                            Resting Calories:
                          </Typography>
                          <Typography variant="h6" color="text.secondary">
                            -{calculateDailyRestingCalories()} cal
                          </Typography>
                        </Grid>
                        <Grid item xs={3}>
                          <Typography variant="body2" color="text.secondary">
                            Total Consumed:
                          </Typography>
                          <Typography variant="h6" color="success.main">
                            +{calorieSummaries.reduce((sum, s) => sum + s.caloriesConsumed, 0)} cal
                          </Typography>
                        </Grid>
                        <Grid item xs={3}>
                          <Typography variant="body2" color="text.secondary">
                            Total Burned:
                          </Typography>
                          <Typography variant="h6" color="info.main">
                            -{calorieSummaries.reduce((sum, s) => sum + s.caloriesBurned, 0)} cal
                          </Typography>
                        </Grid>
                        <Grid item xs={3}>
                          <Typography variant="body2" color="text.secondary">
                            Daily {calorieSummaries.reduce((sum, s) => sum + s.deficit, 0) > 0 ? 'Deficit' : 'Surplus'}:
                          </Typography>
                          <Typography 
                            variant="h6" 
                            color={calorieSummaries.reduce((sum, s) => sum + s.deficit, 0) > 0 ? 'success.main' : 'error.main'}
                            fontWeight="bold"
                          >
                            {calorieSummaries.reduce((sum, s) => sum + s.deficit, 0) > 0 ? '+' : ''}
                            {calorieSummaries.reduce((sum, s) => sum + s.deficit, 0)} cal
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  </Box>
                </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Favorite Items Lists */}
        <Grid item xs={12}>
          <Grid container spacing={2}>
            {/* Favorite Recipes */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader
                  title="Favorite Recipes"
                  avatar={<MealIcon color="success" />}
                />
                <CardContent>
                  {favoriteRecipes.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" align="center" py={2}>
                      No favorite recipes yet. Add favorites in the Menu Builder.
                    </Typography>
                  ) : (
                    <List dense>
                      {favoriteRecipes.map((recipe) => (
                        <ListItem
                          key={recipe.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, { 
                            type: 'recipe', 
                            id: recipe.id, 
                            name: recipe.name,
                            duration: 15, // Default 15 minutes for meals
                            mealType: recipe.mealType,
                            servings: recipe.servings,
                            nutrition: recipe.nutrition
                          })}
                          sx={{
                            cursor: 'grab',
                            '&:hover': { bgcolor: 'action.hover' },
                            '&:active': { cursor: 'grabbing' }
                          }}
                        >
                          <ListItemIcon>
                            <DragIcon />
                          </ListItemIcon>
                          <ListItemText 
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" sx={{ flex: 1 }}>
                                  {recipe.name}
                                </Typography>
                                {recipe.mealType && (
                                  <Typography variant="caption" color="text.secondary">
                                    {recipe.mealType} • {recipe.servings || 1} serving{recipe.servings && recipe.servings > 1 ? 's' : ''}
                                  </Typography>
                                )}
                              </Box>
                            }
                            secondary={
                              recipe.nutrition && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                  <Typography variant="caption" color="success.main" fontWeight="bold">
                                    +{Math.round(recipe.nutrition.calories || 0)} cal
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    •
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {Math.round(recipe.nutrition.protein || 0)}g protein
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    •
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {Math.round(recipe.nutrition.carbs || 0)}g carbs
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    •
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {Math.round(recipe.nutrition.fat || 0)}g fat
                                  </Typography>
                                </Box>
                              )
                            }
                          />
                          <MealIcon color="success" />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Favorite Workouts */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader
                  title="Favorite Workouts"
                  avatar={<ExerciseIcon color="info" />}
                />
                <CardContent>
                  {favoriteWorkouts.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" align="center" py={2}>
                      No favorite workouts yet. Add favorites in the Workout Builder.
                    </Typography>
                  ) : (
                    <List dense>
                      {favoriteWorkouts.map((workout) => (
                        <ListItem
                          key={workout.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, { 
                            type: 'workout', 
                            id: workout.id, 
                            name: workout.name,
                            duration: workout.duration || 30 // Use workout duration or default 30 minutes
                          })}
                          sx={{
                            cursor: 'grab',
                            '&:hover': { bgcolor: 'action.hover' },
                            '&:active': { cursor: 'grabbing' }
                          }}
                        >
                          <ListItemIcon>
                            <DragIcon />
                          </ListItemIcon>
                          <ListItemText 
                            primary={
                              <Typography variant="body2">
                                {workout.name}
                              </Typography>
                            }
                            secondary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                <Typography variant="caption" color="info.main" fontWeight="bold">
                                  -{Math.round((workout.duration || 30) * 9)} cal
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  •
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {workout.duration || 30} min
                                </Typography>
                              </Box>
                            }
                          />
                          <ExerciseIcon color="info" />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
} 