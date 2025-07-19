'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  TextField,
  Button,
  Typography,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Pagination,
  Stack,
  Divider,
  InputAdornment,
  Paper,
  Slider,
  Collapse
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Favorite as LikeIcon,
  FavoriteBorder as DislikeIcon,
  Warning as AllergyIcon,
  Block as IntoleranceIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { useAuth } from '@/context/AuthContext';

interface Ingredient {
  id: string;
  name: string;
  category: string;
  aisle: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

interface FoodPreference {
  id: string;
  ingredientId: string;
  preference: 'LIKE' | 'DISLIKE' | 'ALLERGY' | 'INTOLERANCE';
  notes?: string;
  ingredient: Ingredient;
}

const PREFERENCE_TYPES = [
  { value: 'LIKE', label: 'Like', color: 'success', icon: <LikeIcon /> },
  { value: 'DISLIKE', label: 'Dislike', color: 'error', icon: <DislikeIcon /> },
  { value: 'ALLERGY', label: 'Allergy', color: 'warning', icon: <AllergyIcon /> },
  { value: 'INTOLERANCE', label: 'Intolerance', color: 'info', icon: <IntoleranceIcon /> }
];

// Comprehensive food categories
const COMPREHENSIVE_CATEGORIES = [
  'Proteins - Meats (beef, pork, lamb, game)',
  'Proteins - Poultry (chicken, turkey, duck)',
  'Proteins - Seafood (fish, shellfish)',
  'Proteins - Eggs',
  'Proteins - Plant Proteins (tofu, tempeh, seitan)',
  'Vegetables - Leafy Greens (spinach, kale)',
  'Vegetables - Cruciferous (broccoli, cauliflower)',
  'Vegetables - Root (carrots, beets, potatoes)',
  'Vegetables - Alliums (onion, garlic)',
  'Vegetables - Nightshades (tomato, eggplant, pepper)',
  'Vegetables - Gourds & Squashes',
  'Fruits - Berries',
  'Fruits - Citrus',
  'Fruits - Stone Fruits',
  'Fruits - Pomes (apple, pear)',
  'Fruits - Tropical (mango, pineapple)',
  'Fruits - Melons',
  'Grains & Starches - Whole Grains (brown rice, quinoa)',
  'Grains & Starches - Refined Grains (white rice, pasta)',
  'Grains & Starches - Ancient Grains (farro, spelt)',
  'Grains & Starches - Tubers & Root Starches (potato, cassava)',
  'Legumes & Pulses - Beans (black, kidney, navy)',
  'Legumes & Pulses - Lentils, Peas, Chickpeas',
  'Dairy & Alternatives - Milk, Yogurt, Cheese, Butter',
  'Dairy & Alternatives - Plant Milks & Cheeses',
  'Nuts & Seeds - Tree Nuts, Peanuts',
  'Nuts & Seeds - Seeds (chia, flax, sunflower)',
  'Fats & Oils - Cooking Oils (olive, avocado)',
  'Fats & Oils - Animal Fats (lard, tallow)',
  'Condiments & Sauces - Mustards, Ketchups, Hot Sauces',
  'Condiments & Sauces - Marinades & Dressings',
  'Herbs & Spices - Fresh Herbs (basil, cilantro)',
  'Herbs & Spices - Dried Spices & Blends',
  'Beverages - Water, Tea, Coffee',
  'Beverages - Juices, Sodas, Alcohol',
  'Sweets & Snacks - Chocolate, Candy',
  'Sweets & Snacks - Chips, Crackers, Granola Bars',
  'Pantry & Canned Goods - Canned Vegetables, Beans',
  'Pantry & Canned Goods - Stocks & Broths, Vinegars',
  'Frozen Foods - Vegetables, Fruits, Prepared Meals',
  'Bakery - Breads, Tortillas, Pastries'
];

export default function FoodPreferencesTab() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Ingredient[]>([]);
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);
  const [preferences, setPreferences] = useState<FoodPreference[]>([]);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [preferenceDialog, setPreferenceDialog] = useState(false);
  const [editingPreference, setEditingPreference] = useState<FoodPreference | null>(null);
  const [preferenceType, setPreferenceType] = useState('LIKE');
  const [preferenceNotes, setPreferenceNotes] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [aisleFilter, setAisleFilter] = useState('');
  const [calorieRange, setCalorieRange] = useState([0, 1000]);
  const [proteinRange, setProteinRange] = useState([0, 100]);
  const [carbRange, setCarbRange] = useState([0, 100]);
  const [fatRange, setFatRange] = useState([0, 100]);
  const [fiberRange, setFiberRange] = useState([0, 50]);
  const [sodiumRange, setSodiumRange] = useState([0, 2000]);
  const [preferenceTypeFilter, setPreferenceTypeFilter] = useState('');
  
  // Enhanced filter states
  const [dietaryFilter, setDietaryFilter] = useState<string[]>([]);
  const [preparationFilter, setPreparationFilter] = useState<string[]>([]);
  const [mealTypeFilter, setMealTypeFilter] = useState<string[]>([]);
  const [seasonalFilter, setSeasonalFilter] = useState<string[]>([]);

  // Available categories and aisles
  const [categories, setCategories] = useState<string[]>([]);
  const [aisles, setAisles] = useState<string[]>([]);

  // Enhanced filter options
  const dietaryOptions = [
    { value: 'vegan', label: 'Vegan' },
    { value: 'vegetarian', label: 'Vegetarian' },
    { value: 'gluten-free', label: 'Gluten-Free' },
    { value: 'dairy-free', label: 'Dairy-Free' },
    { value: 'keto', label: 'Keto' },
    { value: 'paleo', label: 'Paleo' }
  ];

  const preparationOptions = [
    { value: 'raw', label: 'Raw' },
    { value: 'cooked', label: 'Cooked' },
    { value: 'frozen', label: 'Frozen' },
    { value: 'canned', label: 'Canned' },
    { value: 'fresh', label: 'Fresh' },
    { value: 'dried', label: 'Dried' }
  ];

  const mealTypeOptions = [
    { value: 'breakfast', label: 'Breakfast' },
    { value: 'lunch', label: 'Lunch' },
    { value: 'dinner', label: 'Dinner' },
    { value: 'snack', label: 'Snack' },
    { value: 'dessert', label: 'Dessert' }
  ];

  const seasonalOptions = [
    { value: 'spring', label: 'Spring' },
    { value: 'summer', label: 'Summer' },
    { value: 'fall', label: 'Fall' },
    { value: 'winter', label: 'Winter' },
    { value: 'year-round', label: 'Year-Round' }
  ];

  const itemsPerPage = 20;

  // Filter preferences based on preference type filter
  const filteredPreferences = preferences.filter(preference => {
    if (!preferenceTypeFilter) return true;
    return preference.preference === preferenceTypeFilter;
  });

  // Paginate preferences
  const paginatedPreferences = filteredPreferences.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    if (user) {
      loadCategoriesAndAisles();
      loadPreferences();
      loadAllIngredients();
    }
  }, [user]);

  useEffect(() => {
    // Reset to page 1 when filters change
    setCurrentPage(1);
    loadIngredients();
  }, [searchTerm, categoryFilter, aisleFilter, calorieRange, proteinRange, carbRange, fatRange, fiberRange, sodiumRange, preferenceTypeFilter, dietaryFilter, preparationFilter, mealTypeFilter, seasonalFilter]);

  const loadCategoriesAndAisles = async () => {
    try {
      const response = await fetch('/api/ingredients/search?loadCategories=true&loadAisles=true');
      if (response.ok) {
        const data = await response.json();
        const ingredients = data.ingredients || [];
        
        // Extract unique categories and aisles
        const uniqueCategories = [...new Set(ingredients.map((ing: any) => ing.category).filter(Boolean))];
        const uniqueAisles = [...new Set(ingredients.map((ing: any) => ing.aisle).filter(Boolean))];
        
        setCategories(uniqueCategories.sort());
        setAisles(uniqueAisles.sort());
      }
    } catch (error) {
      console.error('Error loading categories and aisles:', error);
    }
  };

  const loadAllIngredients = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ingredients/search?limit=1000');
      if (response.ok) {
        const data = await response.json();
        setAllIngredients(data.ingredients || []);
      }
    } catch (error) {
      console.error('Error loading all ingredients:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadIngredients = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString()
      });

      if (searchTerm) {
        params.append('q', searchTerm);
      }

      if (categoryFilter) {
        params.append('category', categoryFilter);
      }

      if (aisleFilter) {
        params.append('aisle', aisleFilter);
      }

      // Add nutrition filters
      if (calorieRange[0] > 0 || calorieRange[1] < 1000) {
        params.append('calories', `${calorieRange[0]}-${calorieRange[1]}`);
      }

      if (proteinRange[0] > 0 || proteinRange[1] < 100) {
        params.append('protein', `${proteinRange[0]}-${proteinRange[1]}`);
      }

      if (carbRange[0] > 0 || carbRange[1] < 100) {
        params.append('carbs', `${carbRange[0]}-${carbRange[1]}`);
      }

      if (fatRange[0] > 0 || fatRange[1] < 100) {
        params.append('fat', `${fatRange[0]}-${fatRange[1]}`);
      }

      if (fiberRange[0] > 0 || fiberRange[1] < 50) {
        params.append('fiber', `${fiberRange[0]}-${fiberRange[1]}`);
      }

      if (sodiumRange[0] > 0 || sodiumRange[1] < 2000) {
        params.append('sodium', `${sodiumRange[0]}-${sodiumRange[1]}`);
      }

      const response = await fetch(`/api/ingredients/search?${params}`);
      if (response.ok) {
        const data = await response.json();
        const ingredients = data.ingredients || [];
        
        // Apply enhanced filters client-side
        let filteredIngredients = ingredients;
        
        if (dietaryFilter.length > 0) {
          filteredIngredients = filteredIngredients.filter((ing: Ingredient) => {
            return dietaryFilter.some(diet => {
              const name = ing.name.toLowerCase();
              const category = ing.category.toLowerCase();
              
              switch (diet) {
                case 'vegan':
                  return !name.includes('meat') && !name.includes('chicken') && !name.includes('beef') && 
                         !name.includes('pork') && !name.includes('fish') && !name.includes('dairy') &&
                         !name.includes('milk') && !name.includes('cheese') && !name.includes('egg');
                case 'vegetarian':
                  return !name.includes('meat') && !name.includes('chicken') && !name.includes('beef') && 
                         !name.includes('pork') && !name.includes('fish');
                case 'gluten-free':
                  return !name.includes('wheat') && !name.includes('gluten') && !name.includes('bread') &&
                         !name.includes('pasta') && !name.includes('flour');
                case 'dairy-free':
                  return !name.includes('milk') && !name.includes('cheese') && !name.includes('yogurt') &&
                         !name.includes('butter') && !name.includes('cream');
                case 'keto':
                  return ing.carbs < 10; // Low carb for keto
                case 'paleo':
                  return !name.includes('grain') && !name.includes('wheat') && !name.includes('rice') &&
                         !name.includes('corn') && !name.includes('bean');
                default:
                  return true;
              }
            });
          });
        }

        if (preparationFilter.length > 0) {
          filteredIngredients = filteredIngredients.filter((ing: Ingredient) => {
            return preparationFilter.some(prep => {
              const name = ing.name.toLowerCase();
              
              switch (prep) {
                case 'raw':
                  return name.includes('raw') || name.includes('fresh');
                case 'cooked':
                  return name.includes('cooked') || name.includes('roasted') || name.includes('grilled');
                case 'frozen':
                  return name.includes('frozen');
                case 'canned':
                  return name.includes('canned') || name.includes('preserved');
                case 'fresh':
                  return name.includes('fresh') || !name.includes('frozen') && !name.includes('canned');
                case 'dried':
                  return name.includes('dried') || name.includes('dehydrated');
                default:
                  return true;
              }
            });
          });
        }

        if (mealTypeFilter.length > 0) {
          filteredIngredients = filteredIngredients.filter((ing: Ingredient) => {
            return mealTypeFilter.some(meal => {
              const name = ing.name.toLowerCase();
              const category = ing.category.toLowerCase();
              
              switch (meal) {
                case 'breakfast':
                  return name.includes('egg') || name.includes('cereal') || name.includes('oatmeal') ||
                         name.includes('pancake') || name.includes('waffle') || name.includes('toast') ||
                         category.includes('dairy') || category.includes('fruit');
                case 'lunch':
                  return name.includes('sandwich') || name.includes('salad') || name.includes('soup') ||
                         category.includes('vegetable') || category.includes('protein');
                case 'dinner':
                  return category.includes('protein') || category.includes('vegetable') ||
                         name.includes('pasta') || name.includes('rice') || name.includes('potato');
                case 'snack':
                  return name.includes('chip') || name.includes('cracker') || name.includes('nut') ||
                         name.includes('fruit') || name.includes('yogurt');
                case 'dessert':
                  return name.includes('chocolate') || name.includes('cake') || name.includes('cookie') ||
                         name.includes('ice cream') || name.includes('candy') || name.includes('sweet');
                default:
                  return true;
              }
            });
          });
        }

        setSearchResults(filteredIngredients);
        
        // Calculate pagination
        const total = filteredIngredients.length;
        setTotalItems(total);
        setTotalPages(Math.ceil(total / itemsPerPage));
      }
    } catch (error) {
      console.error('Error loading ingredients:', error);
      setError('Failed to load ingredients');
    } finally {
      setLoading(false);
    }
  };

  const loadPreferences = async () => {
    try {
      const response = await fetch('/api/food-preferences');
      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences || []);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
  };

  const clearFilters = () => {
    setCategoryFilter('');
    setAisleFilter('');
    setCalorieRange([0, 1000]);
    setProteinRange([0, 100]);
    setCarbRange([0, 100]);
    setFatRange([0, 100]);
    setFiberRange([0, 50]);
    setSodiumRange([0, 2000]);
    setPreferenceTypeFilter('');
    setDietaryFilter([]);
    setPreparationFilter([]);
    setMealTypeFilter([]);
    setSeasonalFilter([]);
  };

  const handleAddPreference = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
    setPreferenceType('LIKE');
    setPreferenceNotes('');
    setEditingPreference(null);
    setPreferenceDialog(true);
  };

  const handleEditPreference = (preference: FoodPreference) => {
    setSelectedIngredient(preference.ingredient);
    setPreferenceType(preference.preference);
    setPreferenceNotes(preference.notes || '');
    setEditingPreference(preference);
    setPreferenceDialog(true);
  };

  const handleSavePreference = async () => {
    if (!selectedIngredient) return;

    try {
      const method = editingPreference ? 'PUT' : 'POST';
      const url = editingPreference 
        ? `/api/food-preferences/${editingPreference.id}`
        : '/api/food-preferences';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredientId: selectedIngredient.id,
          preference: preferenceType,
          notes: preferenceNotes
        })
      });

      if (response.ok) {
        setSuccess(editingPreference ? 'Preference updated!' : 'Preference added!');
        setPreferenceDialog(false);
        loadPreferences();
        setSearchTerm('');
        setSearchResults([]);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save preference');
      }
    } catch (error) {
      setError('An error occurred while saving');
    }
  };

  const handleDeletePreference = async (preferenceId: string) => {
    try {
      const response = await fetch(`/api/food-preferences/${preferenceId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setSuccess('Preference removed!');
        loadPreferences();
      } else {
        setError('Failed to remove preference');
      }
    } catch (error) {
      setError('An error occurred while removing preference');
    }
  };

  const getPreferenceIcon = (type: string) => {
    const preference = PREFERENCE_TYPES.find(p => p.value === type);
    return preference?.icon || <LikeIcon />;
  };

  const getPreferenceColor = (type: string) => {
    const preference = PREFERENCE_TYPES.find(p => p.value === type);
    return preference?.color || 'default';
  };



  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Food Preferences & Allergies
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
        {/* Search Section */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Search & Add Food Preferences" />
            <CardContent>
              <TextField
                fullWidth
                label="Search ingredients"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Type to search for ingredients..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
              
              {/* Filter Toggle */}
              <Box sx={{ mt: 2, mb: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => setShowFilters(!showFilters)}
                  startIcon={<FilterIcon />}
                  size="small"
                >
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </Button>
                {showFilters && (
                  <Button
                    variant="outlined"
                    onClick={clearFilters}
                    startIcon={<ClearIcon />}
                    size="small"
                    sx={{ ml: 1 }}
                  >
                    Clear Filters
                  </Button>
                )}
              </Box>

              {/* Filter Panel */}
              <Collapse in={showFilters}>
                <Paper sx={{ p: 2, mb: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Search Filters
                  </Typography>
                  
                  <Grid container spacing={2}>
                    {/* Category Filter */}
                    <Grid item xs={12} md={6}>
                      <TextField
                        select
                        fullWidth
                        label="Category"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        size="small"
                      >
                        <MenuItem value="">All Categories</MenuItem>
                        {categories.map((category) => (
                          <MenuItem key={category} value={category}>
                            {category}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>

                    {/* Aisle Filter */}
                    <Grid item xs={12} md={6}>
                      <TextField
                        select
                        fullWidth
                        label="Aisle"
                        value={aisleFilter}
                        onChange={(e) => setAisleFilter(e.target.value)}
                        size="small"
                      >
                        <MenuItem value="">All Aisles</MenuItem>
                        {aisles.map((aisle) => (
                          <MenuItem key={aisle} value={aisle}>
                            {aisle}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>

                    {/* Calorie Range */}
                    <Grid item xs={12} md={6}>
                      <Typography gutterBottom>
                        Calories: {calorieRange[0]} - {calorieRange[1]}
                      </Typography>
                      <Slider
                        value={calorieRange}
                        onChange={(_, newValue) => setCalorieRange(newValue as number[])}
                        valueLabelDisplay="auto"
                        min={0}
                        max={1000}
                        step={10}
                      />
                    </Grid>

                    {/* Protein Range */}
                    <Grid item xs={12} md={6}>
                      <Typography gutterBottom>
                        Protein: {proteinRange[0]} - {proteinRange[1]}g
                      </Typography>
                      <Slider
                        value={proteinRange}
                        onChange={(_, newValue) => setProteinRange(newValue as number[])}
                        valueLabelDisplay="auto"
                        min={0}
                        max={100}
                        step={1}
                      />
                    </Grid>

                    {/* Carb Range */}
                    <Grid item xs={12} md={6}>
                      <Typography gutterBottom>
                        Carbs: {carbRange[0]} - {carbRange[1]}g
                      </Typography>
                      <Slider
                        value={carbRange}
                        onChange={(_, newValue) => setCarbRange(newValue as number[])}
                        valueLabelDisplay="auto"
                        min={0}
                        max={100}
                        step={1}
                      />
                    </Grid>

                    {/* Fat Range */}
                    <Grid item xs={12} md={6}>
                      <Typography gutterBottom>
                        Fat: {fatRange[0]} - {fatRange[1]}g
                      </Typography>
                      <Slider
                        value={fatRange}
                        onChange={(_, newValue) => setFatRange(newValue as number[])}
                        valueLabelDisplay="auto"
                        min={0}
                        max={100}
                        step={1}
                      />
                    </Grid>

                    {/* Fiber Range */}
                    <Grid item xs={12} md={6}>
                      <Typography gutterBottom>
                        Fiber: {fiberRange[0]} - {fiberRange[1]}g
                      </Typography>
                      <Slider
                        value={fiberRange}
                        onChange={(_, newValue) => setFiberRange(newValue as number[])}
                        valueLabelDisplay="auto"
                        min={0}
                        max={50}
                        step={0.5}
                      />
                    </Grid>

                    {/* Sodium Range */}
                    <Grid item xs={12} md={6}>
                      <Typography gutterBottom>
                        Sodium: {sodiumRange[0]} - {sodiumRange[1]}mg
                      </Typography>
                      <Slider
                        value={sodiumRange}
                        onChange={(_, newValue) => setSodiumRange(newValue as number[])}
                        valueLabelDisplay="auto"
                        min={0}
                        max={2000}
                        step={10}
                      />
                    </Grid>

                    {/* Enhanced Filters */}
                    <Grid item xs={12}>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="h6" gutterBottom>
                        Enhanced Filters
                      </Typography>
                    </Grid>

                    {/* Dietary Restrictions */}
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Dietary Restrictions</InputLabel>
                        <Select
                          multiple
                          value={dietaryFilter}
                          onChange={(e) => setDietaryFilter(e.target.value as string[])}
                          renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {selected.map((value) => (
                                <Chip key={value} label={dietaryOptions.find(opt => opt.value === value)?.label || value} size="small" />
                              ))}
                            </Box>
                          )}
                        >
                          {dietaryOptions.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* Preparation Methods */}
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Preparation Methods</InputLabel>
                        <Select
                          multiple
                          value={preparationFilter}
                          onChange={(e) => setPreparationFilter(e.target.value as string[])}
                          renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {selected.map((value) => (
                                <Chip key={value} label={preparationOptions.find(opt => opt.value === value)?.label || value} size="small" />
                              ))}
                            </Box>
                          )}
                        >
                          {preparationOptions.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* Meal Types */}
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Meal Types</InputLabel>
                        <Select
                          multiple
                          value={mealTypeFilter}
                          onChange={(e) => setMealTypeFilter(e.target.value as string[])}
                          renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {selected.map((value) => (
                                <Chip key={value} label={mealTypeOptions.find(opt => opt.value === value)?.label || value} size="small" />
                              ))}
                            </Box>
                          )}
                        >
                          {mealTypeOptions.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* Seasonal Availability */}
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Seasonal Availability</InputLabel>
                        <Select
                          multiple
                          value={seasonalFilter}
                          onChange={(e) => setSeasonalFilter(e.target.value as string[])}
                          renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {selected.map((value) => (
                                <Chip key={value} label={seasonalOptions.find(opt => opt.value === value)?.label || value} size="small" />
                              ))}
                            </Box>
                          )}
                        >
                          {seasonalOptions.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Paper>
              </Collapse>
              
              {loading ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              ) : searchResults.length === 0 ? (
                <Typography variant="body2" color="text.secondary" align="center" py={3}>
                  {searchTerm.length === 0 && !categoryFilter && !aisleFilter
                    ? 'Loading ingredients...'
                    : searchTerm.length > 0 && searchTerm.length < 2 
                    ? 'Enter at least 2 characters to search for ingredients.'
                    : 'No ingredients found matching your search criteria.'
                  }
                </Typography>
              ) : (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    {searchTerm || categoryFilter || aisleFilter 
                      ? `Search Results (${searchResults.length} of ${totalItems}):`
                      : `All Ingredients (${searchResults.length} of ${totalItems}):`
                    }
                  </Typography>
                  <List dense>
                    {searchResults.map((ingredient) => (
                      <ListItem
                        key={ingredient.id}
                        sx={{
                          border: 1,
                          borderColor: 'divider',
                          borderRadius: 1,
                          mb: 1,
                          '&:hover': { bgcolor: 'action.hover' }
                        }}
                      >
                        <ListItemText
                          primary={ingredient.name}
                          secondary={`${ingredient.category} • ${ingredient.calories} cal • ${ingredient.protein}g protein • ${ingredient.carbs}g carbs • ${ingredient.fat}g fat`}
                        />
                        <ListItemSecondaryAction>
                          <Button
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={() => handleAddPreference(ingredient)}
                          >
                            Add Preference
                          </Button>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                  
                  {totalPages > 1 && (
                    <Box display="flex" justifyContent="center" mt={2}>
                      <Pagination
                        count={totalPages}
                        page={currentPage}
                        onChange={(_, page) => setCurrentPage(page)}
                        color="primary"
                      />
                    </Box>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Preferences List */}
        <Grid item xs={12}>
          <Card>
            <CardHeader 
              title="Your Food Preferences" 
              subheader={`${filteredPreferences.length} preferences saved`}
            />
            <CardContent>
              {/* Preference Type Filter */}
              <Box sx={{ mb: 2 }}>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Filter by Preference Type</InputLabel>
                  <Select
                    value={preferenceTypeFilter}
                    onChange={(e) => setPreferenceTypeFilter(e.target.value)}
                    label="Filter by Preference Type"
                  >
                    <MenuItem value="">All Preferences</MenuItem>
                    {PREFERENCE_TYPES.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        <Box display="flex" alignItems="center" gap={1}>
                          {type.icon}
                          {type.label}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {loading ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              ) : filteredPreferences.length === 0 ? (
                <Typography variant="body2" color="text.secondary" align="center" py={3}>
                  {preferences.length === 0 
                    ? 'No food preferences saved yet. Search for ingredients above to add your preferences.'
                    : 'No preferences match the current filter. Try adjusting your filter settings.'
                  }
                </Typography>
              ) : (
                <>
                  <List>
                    {paginatedPreferences.map((preference) => (
                      <ListItem
                        key={preference.id}
                        sx={{
                          border: 1,
                          borderColor: 'divider',
                          borderRadius: 1,
                          mb: 1,
                          '&:hover': { bgcolor: 'action.hover' }
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              {getPreferenceIcon(preference.preference)}
                              <Typography variant="body1">
                                {preference.ingredient.name}
                              </Typography>
                              <Chip
                                label={PREFERENCE_TYPES.find(p => p.value === preference.preference)?.label}
                                color={getPreferenceColor(preference.preference) as any}
                                size="small"
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {preference.ingredient.category} • {preference.ingredient.calories} cal • {preference.ingredient.protein}g protein
                              </Typography>
                              {preference.notes && (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                  Notes: {preference.notes}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            size="small"
                            onClick={() => handleEditPreference(preference)}
                            sx={{ mr: 1 }}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeletePreference(preference.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                  
                  {Math.ceil(filteredPreferences.length / itemsPerPage) > 1 && (
                    <Box display="flex" justifyContent="center" mt={2}>
                      <Pagination
                        count={Math.ceil(filteredPreferences.length / itemsPerPage)}
                        page={currentPage}
                        onChange={(_, page) => setCurrentPage(page)}
                        color="primary"
                      />
                    </Box>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Preference Dialog */}
      <Dialog open={preferenceDialog} onClose={() => setPreferenceDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingPreference ? 'Edit Food Preference' : 'Add Food Preference'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {selectedIngredient && (
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  {selectedIngredient.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedIngredient.category} • {selectedIngredient.calories} calories • {selectedIngredient.protein}g protein
                </Typography>
              </Box>
            )}
            
            <FormControl fullWidth>
              <InputLabel>Preference Type</InputLabel>
              <Select
                value={preferenceType}
                onChange={(e) => setPreferenceType(e.target.value)}
                label="Preference Type"
              >
                {PREFERENCE_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    <Box display="flex" alignItems="center" gap={1}>
                      {type.icon}
                      {type.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              label="Notes (optional)"
              multiline
              rows={3}
              value={preferenceNotes}
              onChange={(e) => setPreferenceNotes(e.target.value)}
              fullWidth
              placeholder="Add any additional notes about this preference..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreferenceDialog(false)}>Cancel</Button>
          <Button onClick={handleSavePreference} variant="contained">
            {editingPreference ? 'Update' : 'Add'} Preference
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 