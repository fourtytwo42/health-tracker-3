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
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  Restaurant as MealIcon,
  FitnessCenter as ExerciseIcon,
  CalendarToday as CalendarIcon,
  Delete as DeleteIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { useAuth } from '@/context/AuthContext';

interface ScheduledItem {
  id: string;
  title: string;
  type: 'meal' | 'exercise';
  scheduledDate: string;
  scheduledTime?: string;
  notes?: string;
  isCompleted: boolean;
}

interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  items: ScheduledItem[];
}

export default function CalendarTab() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [scheduledItems, setScheduledItems] = useState<ScheduledItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [addDialog, setAddDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [itemTitle, setItemTitle] = useState('');
  const [itemType, setItemType] = useState<'meal' | 'exercise'>('meal');
  const [itemTime, setItemTime] = useState('');
  const [itemNotes, setItemNotes] = useState('');

  useEffect(() => {
    if (user) {
      generateCalendar();
      loadScheduledItems();
    }
  }, [user, currentDate]);

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
      days.push({
        date,
        day: date.getDate(),
        isCurrentMonth: date.getMonth() === month,
        isToday: date.toDateString() === today.toDateString(),
        items: []
      });
    }
    
    setCalendarDays(days);
  };

  const loadScheduledItems = async () => {
    try {
      setLoading(true);
      // This would load from your API
      // For now, using mock data
      const mockItems: ScheduledItem[] = [
        {
          id: '1',
          title: 'Breakfast - Oatmeal with Berries',
          type: 'meal',
          scheduledDate: '2025-01-20',
          scheduledTime: '08:00',
          notes: 'High protein breakfast',
          isCompleted: false
        },
        {
          id: '2',
          title: 'Morning Walk',
          type: 'exercise',
          scheduledDate: '2025-01-20',
          scheduledTime: '07:00',
          notes: '30 minute walk',
          isCompleted: false
        }
      ];
      
      setScheduledItems(mockItems);
      populateCalendarDays(mockItems);
    } catch (error) {
      console.error('Error loading scheduled items:', error);
      setError('Failed to load scheduled items');
    } finally {
      setLoading(false);
    }
  };

  const populateCalendarDays = (items: ScheduledItem[]) => {
    setCalendarDays(prevDays => 
      prevDays.map(day => ({
        ...day,
        items: items.filter(item => 
          item.scheduledDate === day.date.toISOString().split('T')[0]
        )
      }))
    );
  };

  const handleDateClick = (day: CalendarDay) => {
    setSelectedDay(day);
    setSelectedDate(day.date);
  };

  const handleAddItem = () => {
    if (!selectedDate) return;
    
    setItemTitle('');
    setItemType('meal');
    setItemTime('');
    setItemNotes('');
    setAddDialog(true);
  };

  const handleSaveItem = async () => {
    if (!itemTitle || !selectedDate) return;

    try {
      const newItem: ScheduledItem = {
        id: Date.now().toString(),
        title: itemTitle,
        type: itemType,
        scheduledDate: selectedDate.toISOString().split('T')[0],
        scheduledTime: itemTime,
        notes: itemNotes,
        isCompleted: false
      };

      // This would save to your API
      setScheduledItems(prev => [...prev, newItem]);
      populateCalendarDays([...scheduledItems, newItem]);
      
      setSuccess('Item scheduled successfully!');
      setAddDialog(false);
    } catch (error) {
      setError('Failed to schedule item');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      // This would delete from your API
      const updatedItems = scheduledItems.filter(item => item.id !== itemId);
      setScheduledItems(updatedItems);
      populateCalendarDays(updatedItems);
      setSuccess('Item removed successfully!');
    } catch (error) {
      setError('Failed to remove item');
    }
  };

  const formatTime = (time?: string) => {
    if (!time) return '';
    return time;
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

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Calendar & Schedule
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
        {/* Calendar Header */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Button onClick={() => navigateMonth('prev')}>
                  ← Previous
                </Button>
                <Typography variant="h6">
                  {getMonthName(currentDate)}
                </Typography>
                <Button onClick={() => navigateMonth('next')}>
                  Next →
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Calendar Grid */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              {/* Day Headers */}
              <Grid container sx={{ mb: 1 }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <Grid item xs key={day}>
                    <Typography 
                      variant="subtitle2" 
                      align="center" 
                      sx={{ fontWeight: 'bold', p: 1 }}
                    >
                      {day}
                    </Typography>
                  </Grid>
                ))}
              </Grid>

              {/* Calendar Days */}
              <Grid container spacing={0.5}>
                {calendarDays.map((day, index) => (
                  <Grid item xs key={index}>
                    <Paper
                      sx={{
                        p: 1,
                        minHeight: 100,
                        cursor: 'pointer',
                        border: day.isToday ? 2 : 1,
                        borderColor: day.isToday ? 'primary.main' : 'divider',
                        bgcolor: day.isCurrentMonth ? 'background.paper' : 'action.hover',
                        '&:hover': {
                          bgcolor: 'action.hover'
                        }
                      }}
                      onClick={() => handleDateClick(day)}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: day.isToday ? 'bold' : 'normal',
                          color: day.isCurrentMonth ? 'text.primary' : 'text.secondary'
                        }}
                      >
                        {day.day}
                      </Typography>
                      
                      {/* Scheduled Items */}
                      <Stack spacing={0.5} sx={{ mt: 1 }}>
                        {day.items.slice(0, 2).map((item) => (
                          <Chip
                            key={item.id}
                            label={`${formatTime(item.scheduledTime)} ${item.title.substring(0, 15)}...`}
                            size="small"
                            color={item.type === 'meal' ? 'primary' : 'secondary'}
                            icon={item.type === 'meal' ? <MealIcon /> : <ExerciseIcon />}
                            sx={{ fontSize: '0.7rem' }}
                          />
                        ))}
                        {day.items.length > 2 && (
                          <Typography variant="caption" color="text.secondary">
                            +{day.items.length - 2} more
                          </Typography>
                        )}
                      </Stack>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Selected Day Details */}
        {selectedDay && (
          <Grid item xs={12}>
            <Card>
              <CardHeader
                title={`${selectedDay.date.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}`}
                action={
                  <Button
                    startIcon={<AddIcon />}
                    onClick={handleAddItem}
                    variant="contained"
                    size="small"
                  >
                    Add Item
                  </Button>
                }
              />
              <CardContent>
                {selectedDay.items.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" align="center" py={3}>
                    No items scheduled for this day. Click "Add Item" to schedule something.
                  </Typography>
                ) : (
                  <Stack spacing={1}>
                    {selectedDay.items.map((item) => (
                      <Box
                        key={item.id}
                        sx={{
                          p: 2,
                          border: 1,
                          borderColor: 'divider',
                          borderRadius: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={1}>
                          {item.type === 'meal' ? <MealIcon color="primary" /> : <ExerciseIcon color="secondary" />}
                          <Box>
                            <Typography variant="body1">
                              {item.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {formatTime(item.scheduledTime)} • {item.type}
                            </Typography>
                            {item.notes && (
                              <Typography variant="body2" color="text.secondary">
                                {item.notes}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                        <Box>
                          <IconButton size="small" color="error" onClick={() => handleDeleteItem(item.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Add Item Dialog */}
      <Dialog open={addDialog} onClose={() => setAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Schedule New Item</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Item Type</InputLabel>
              <Select
                value={itemType}
                onChange={(e) => setItemType(e.target.value as 'meal' | 'exercise')}
                label="Item Type"
              >
                <MenuItem value="meal">
                  <Box display="flex" alignItems="center" gap={1}>
                    <MealIcon />
                    Meal
                  </Box>
                </MenuItem>
                <MenuItem value="exercise">
                  <Box display="flex" alignItems="center" gap={1}>
                    <ExerciseIcon />
                    Exercise
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              label="Title"
              value={itemTitle}
              onChange={(e) => setItemTitle(e.target.value)}
              fullWidth
              placeholder={`Enter ${itemType} title...`}
            />
            
            <TextField
              label="Time (optional)"
              type="time"
              value={itemTime}
              onChange={(e) => setItemTime(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            
            <TextField
              label="Notes (optional)"
              multiline
              rows={3}
              value={itemNotes}
              onChange={(e) => setItemNotes(e.target.value)}
              fullWidth
              placeholder="Add any notes about this scheduled item..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveItem} variant="contained">
            Schedule Item
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 