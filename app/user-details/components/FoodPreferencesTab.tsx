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
  Clear as ClearIcon,
  SmartToy as AIIcon
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
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);
  const [preferences, setPreferences] = useState<FoodPreference[]>([]);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [preferenceDialog, setPreferenceDialog] = useState(false);
  const [editingPreference, setEditingPreference] = useState<FoodPreference | null>(null);
  const [preferenceType, setPreferenceType] = useState('LIKE');
  const [preferenceNotes, setPreferenceNotes] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
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
  const [sodiumRange, setSodiumRange] = useState([0, 5000]);

  // AI Search states
  const [aiSearchLoading, setAiSearchLoading] = useState(false);
  const [aiSearchError, setAiSearchError] = useState<string | null>(null);
  const [aiSearchResult, setAiSearchResult] = useState<any>(null);
  const [showAiResult, setShowAiResult] = useState(false);

  // Categories and aisles
  const [categories, setCategories] = useState<string[]>([]);
  const [aisles, setAisles] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      loadCategoriesAndAisles();
      loadAllIngredients();
      loadIngredients();
      loadPreferences();
    }
  }, [user]);

  useEffect(() => {
    loadIngredients();
  }, [currentPage, pageSize, searchTerm, categoryFilter, aisleFilter, calorieRange, proteinRange, carbRange, fatRange, fiberRange, sodiumRange]);

  const loadCategoriesAndAisles = async () => {
    try {
      const [categoriesResponse, aislesResponse] = await Promise.all([
        fetch('/api/ingredients/categories'),
        fetch('/api/ingredients/aisles')
      ]);

      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData.categories || []);
      }

      if (aislesResponse.ok) {
        const aislesData = await aislesResponse.json();
        setAisles(aislesData.aisles || []);
      }
    } catch (error) {
      console.error('Error loading categories and aisles:', error);
    }
  };

  const loadAllIngredients = async () => {
    try {
      const response = await fetch('/api/ingredients?limit=1000');
      if (response.ok) {
        const data = await response.json();
        setAllIngredients(data.ingredients || []);
      }
    } catch (error) {
      console.error('Error loading all ingredients:', error);
    }
  };

  const loadIngredients = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString()
      });

      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }
      if (categoryFilter) {
        params.append('category', categoryFilter);
      }
      if (aisleFilter) {
        params.append('aisle', aisleFilter);
      }
      if (calorieRange[0] > 0 || calorieRange[1] < 1000) {
        params.append('caloriesMin', calorieRange[0].toString());
        params.append('caloriesMax', calorieRange[1].toString());
      }
      if (proteinRange[0] > 0 || proteinRange[1] < 100) {
        params.append('proteinMin', proteinRange[0].toString());
        params.append('proteinMax', proteinRange[1].toString());
      }
      if (carbRange[0] > 0 || carbRange[1] < 100) {
        params.append('carbsMin', carbRange[0].toString());
        params.append('carbsMax', carbRange[1].toString());
      }
      if (fatRange[0] > 0 || fatRange[1] < 100) {
        params.append('fatMin', fatRange[0].toString());
        params.append('fatMax', fatRange[1].toString());
      }
      if (fiberRange[0] > 0 || fiberRange[1] < 50) {
        params.append('fiberMin', fiberRange[0].toString());
        params.append('fiberMax', fiberRange[1].toString());
      }
      if (sodiumRange[0] > 0 || sodiumRange[1] < 5000) {
        params.append('sodiumMin', sodiumRange[0].toString());
        params.append('sodiumMax', sodiumRange[1].toString());
      }

      const response = await fetch(`/api/ingredients?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setIngredients(data.ingredients || []);
        setTotalItems(data.total || 0);
        setTotalPages(Math.ceil((data.total || 0) / pageSize));
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
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setAisleFilter('');
    setCalorieRange([0, 1000]);
    setProteinRange([0, 100]);
    setCarbRange([0, 100]);
    setFatRange([0, 100]);
    setFiberRange([0, 50]);
    setSodiumRange([0, 5000]);
    setCurrentPage(1);
    clearAiSearch();
  };

  // AI Search function
  const handleAiSearch = async () => {
    if (!searchTerm.trim()) {
      setAiSearchError('Please enter a search term to analyze');
      return;
    }

    setAiSearchLoading(true);
    setAiSearchError(null);
    setAiSearchResult(null);
    setShowAiResult(false);

    try {
      // Prepare nutrition filters
      const nutritionFilters: any = {};
      if (calorieRange[0] > 0 || calorieRange[1] < 1000) {
        nutritionFilters.calories = { min: calorieRange[0], max: calorieRange[1] };
      }
      if (proteinRange[0] > 0 || proteinRange[1] < 100) {
        nutritionFilters.protein = { min: proteinRange[0], max: proteinRange[1] };
      }
      if (carbRange[0] > 0 || carbRange[1] < 100) {
        nutritionFilters.carbs = { min: carbRange[0], max: carbRange[1] };
      }
      if (fatRange[0] > 0 || fatRange[1] < 100) {
        nutritionFilters.fat = { min: fatRange[0], max: fatRange[1] };
      }
      if (fiberRange[0] > 0 || fiberRange[1] < 50) {
        nutritionFilters.fiber = { min: fiberRange[0], max: fiberRange[1] };
      }
      if (sodiumRange[0] > 0 || sodiumRange[1] < 5000) {
        nutritionFilters.sodium = { min: sodiumRange[0], max: sodiumRange[1] };
      }

      const response = await fetch('/api/ingredients/ai-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          searchTerm: searchTerm.trim(),
          category: categoryFilter || undefined,
          aisle: aisleFilter || undefined,
          nutritionFilters: Object.keys(nutritionFilters).length > 0 ? nutritionFilters : undefined
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setAiSearchResult(result);
        setShowAiResult(true);
      } else {
        setAiSearchError(result.error || 'Failed to get AI recommendation');
      }
    } catch (error) {
      console.error('AI search error:', error);
      setAiSearchError('Failed to connect to AI service');
    } finally {
      setAiSearchLoading(false);
    }
  };

  // Clear AI search results
  const clearAiSearch = () => {
    setAiSearchResult(null);
    setAiSearchError(null);
    setShowAiResult(false);
  };

  const handleAddPreference = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
    setEditingPreference(null);
    setPreferenceType('LIKE');
    setPreferenceNotes('');
    setPreferenceDialog(true);
  };

  const handleEditPreference = (preference: FoodPreference) => {
    setSelectedIngredient(preference.ingredient);
    setEditingPreference(preference);
    setPreferenceType(preference.preference);
    setPreferenceNotes(preference.notes || '');
    setPreferenceDialog(true);
  };

  const handleSavePreference = async () => {
    if (!selectedIngredient) return;

    try {
      const preferenceData = {
        ingredientId: selectedIngredient.id,
        preference: preferenceType,
        notes: preferenceNotes.trim() || undefined
      };

      const url = editingPreference 
        ? `/api/food-preferences/${editingPreference.id}`
        : '/api/food-preferences';
      
      const method = editingPreference ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferenceData),
      });

      if (response.ok) {
        setSuccess(editingPreference ? 'Preference updated successfully!' : 'Preference added successfully!');
        setPreferenceDialog(false);
        await loadPreferences();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save preference');
      }
    } catch (error) {
      setError('An error occurred while saving preference');
    }
  };

  const handleDeletePreference = async (preferenceId: string) => {
    if (!confirm('Are you sure you want to delete this preference?')) return;

    try {
      const response = await fetch(`/api/food-preferences/${preferenceId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccess('Preference deleted successfully!');
        await loadPreferences();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete preference');
      }
    } catch (error) {
      setError('An error occurred while deleting preference');
    }
  };

  const getPreferenceIcon = (type: string) => {
    return PREFERENCE_TYPES.find(p => p.value === type)?.icon || <LikeIcon />;
  };

  const getPreferenceColor = (type: string) => {
    return PREFERENCE_TYPES.find(p => p.value === type)?.color || 'default';
  };

  const getExistingPreference = (ingredientId: string) => {
    return preferences.find(p => p.ingredientId === ingredientId);
  };

  const shouldShowNutritionValue = (value: number | null | undefined): boolean => {
    return value !== null && value !== undefined && value > 0;
  };

  const formatNutritionValue = (value: number | null | undefined, defaultValue: number = 0): number => {
    return shouldShowNutritionValue(value) ? value! : defaultValue;
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Food Preferences & Allergies
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage your food preferences, allergies, and intolerances to help personalize your meal recommendations.
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
        {/* Search and Filters */}
        <Grid item xs={12}>
          <Card>
            <CardHeader 
              title="Search Ingredients"
              action={
                <Box display="flex" gap={1}>
                  <Button
                    variant="outlined"
                    startIcon={<FilterIcon />}
                    onClick={() => setShowFilters(!showFilters)}
                    size="small"
                  >
                    {showFilters ? 'Hide' : 'Show'} Filters
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<ClearIcon />}
                    onClick={clearFilters}
                    size="small"
                  >
                    Clear All
                  </Button>
                </Box>
              }
            />
            <CardContent>
              <Stack spacing={2}>
                {/* Search Bar */}
                <Box display="flex" gap={1}>
                  <TextField
                    fullWidth
                    placeholder="Search ingredients by name..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Button
                    variant="contained"
                    startIcon={<AIIcon />}
                    onClick={handleAiSearch}
                    disabled={aiSearchLoading || !searchTerm.trim()}
                    sx={{ minWidth: 120 }}
                  >
                    {aiSearchLoading ? <CircularProgress size={20} /> : 'AI Match'}
                  </Button>
                </Box>

                {/* AI Search Results */}
                {aiSearchError && (
                  <Alert severity="error" onClose={() => setAiSearchError(null)}>
                    {aiSearchError}
                  </Alert>
                )}

                {showAiResult && aiSearchResult && (
                  <Paper sx={{ p: 2, bgcolor: 'primary.50' }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="h6" color="primary">
                        AI Best Match
                      </Typography>
                      <IconButton size="small" onClick={clearAiSearch}>
                        <ClearIcon />
                      </IconButton>
                    </Box>
                    {aiSearchResult.ingredient && (
                      <Card variant="outlined">
                        <CardContent>
                          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                            <Box>
                              <Typography variant="h6">
                                {aiSearchResult.ingredient.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {aiSearchResult.ingredient.category} • {aiSearchResult.ingredient.aisle}
                              </Typography>
                              <Box display="flex" gap={2} mt={1}>
                                <Typography variant="body2">
                                  {formatNutritionValue(aiSearchResult.ingredient.calories)} cal
                                </Typography>
                                <Typography variant="body2">
                                  P: {formatNutritionValue(aiSearchResult.ingredient.protein)}g
                                </Typography>
                                <Typography variant="body2">
                                  C: {formatNutritionValue(aiSearchResult.ingredient.carbs)}g
                                </Typography>
                                <Typography variant="body2">
                                  F: {formatNutritionValue(aiSearchResult.ingredient.fat)}g
                                </Typography>
                              </Box>
                            </Box>
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => handleAddPreference(aiSearchResult.ingredient)}
                            >
                              Add Preference
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    )}
                    {aiSearchResult.explanation && (
                      <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                        {aiSearchResult.explanation}
                      </Typography>
                    )}
                  </Paper>
                )}

                {/* Filters */}
                <Collapse in={showFilters}>
                  <Paper sx={{ p: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Category</InputLabel>
                          <Select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            label="Category"
                          >
                            <MenuItem value="">All Categories</MenuItem>
                            {categories.map((category) => (
                              <MenuItem key={category} value={category}>
                                {category}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Aisle</InputLabel>
                          <Select
                            value={aisleFilter}
                            onChange={(e) => setAisleFilter(e.target.value)}
                            label="Aisle"
                          >
                            <MenuItem value="">All Aisles</MenuItem>
                            {aisles.map((aisle) => (
                              <MenuItem key={aisle} value={aisle}>
                                {aisle}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      
                      {/* Nutrition Filters */}
                      <Grid item xs={12} md={4}>
                        <Typography variant="body2" gutterBottom>
                          Calories: {calorieRange[0]} - {calorieRange[1]}
                        </Typography>
                        <Slider
                          value={calorieRange}
                          onChange={(_, value) => setCalorieRange(value as number[])}
                          min={0}
                          max={1000}
                          step={10}
                          valueLabelDisplay="auto"
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Typography variant="body2" gutterBottom>
                          Protein: {proteinRange[0]} - {proteinRange[1]}g
                        </Typography>
                        <Slider
                          value={proteinRange}
                          onChange={(_, value) => setProteinRange(value as number[])}
                          min={0}
                          max={100}
                          step={1}
                          valueLabelDisplay="auto"
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Typography variant="body2" gutterBottom>
                          Carbs: {carbRange[0]} - {carbRange[1]}g
                        </Typography>
                        <Slider
                          value={carbRange}
                          onChange={(_, value) => setCarbRange(value as number[])}
                          min={0}
                          max={100}
                          step={1}
                          valueLabelDisplay="auto"
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Typography variant="body2" gutterBottom>
                          Fat: {fatRange[0]} - {fatRange[1]}g
                        </Typography>
                        <Slider
                          value={fatRange}
                          onChange={(_, value) => setFatRange(value as number[])}
                          min={0}
                          max={100}
                          step={1}
                          valueLabelDisplay="auto"
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Typography variant="body2" gutterBottom>
                          Fiber: {fiberRange[0]} - {fiberRange[1]}g
                        </Typography>
                        <Slider
                          value={fiberRange}
                          onChange={(_, value) => setFiberRange(value as number[])}
                          min={0}
                          max={50}
                          step={1}
                          valueLabelDisplay="auto"
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Typography variant="body2" gutterBottom>
                          Sodium: {sodiumRange[0]} - {sodiumRange[1]}mg
                        </Typography>
                        <Slider
                          value={sodiumRange}
                          onChange={(_, value) => setSodiumRange(value as number[])}
                          min={0}
                          max={5000}
                          step={50}
                          valueLabelDisplay="auto"
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Collapse>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Ingredients List */}
        <Grid item xs={12}>
          <Card>
            <CardHeader 
              title={`Ingredients (${totalItems} total)`}
              subheader={`Showing ${ingredients.length} ingredients on page ${currentPage} of ${totalPages}`}
            />
            <CardContent>
              {loading ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              ) : ingredients.length === 0 ? (
                <Typography variant="body2" color="text.secondary" align="center" py={3}>
                  No ingredients found. Try adjusting your search or filters.
                </Typography>
              ) : (
                <List>
                  {ingredients.map((ingredient) => {
                    const existingPreference = getExistingPreference(ingredient.id);
                    return (
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
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="body1">
                                {ingredient.name}
                              </Typography>
                              {existingPreference && (
                                <Chip
                                  icon={getPreferenceIcon(existingPreference.preference)}
                                  label={existingPreference.preference.replace('_', ' ')}
                                  color={getPreferenceColor(existingPreference.preference) as any}
                                  size="small"
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {ingredient.category} • {ingredient.aisle}
                              </Typography>
                              <Box display="flex" gap={2} mt={0.5}>
                                {shouldShowNutritionValue(ingredient.calories) && (
                                  <Typography variant="body2">
                                    {ingredient.calories} cal
                                  </Typography>
                                )}
                                {shouldShowNutritionValue(ingredient.protein) && (
                                  <Typography variant="body2">
                                    P: {ingredient.protein}g
                                  </Typography>
                                )}
                                {shouldShowNutritionValue(ingredient.carbs) && (
                                  <Typography variant="body2">
                                    C: {ingredient.carbs}g
                                  </Typography>
                                )}
                                {shouldShowNutritionValue(ingredient.fat) && (
                                  <Typography variant="body2">
                                    F: {ingredient.fat}g
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          {existingPreference ? (
                            <Box display="flex" gap={1}>
                              <IconButton
                                size="small"
                                onClick={() => handleEditPreference(existingPreference)}
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeletePreference(existingPreference.id)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                          ) : (
                            <IconButton
                              size="small"
                              onClick={() => handleAddPreference(ingredient)}
                            >
                              <AddIcon />
                            </IconButton>
                          )}
                        </ListItemSecondaryAction>
                      </ListItem>
                    );
                  })}
                </List>
              )}
              
              {/* Pagination */}
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
            </CardContent>
          </Card>
        </Grid>

        {/* Current Preferences */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Your Food Preferences" />
            <CardContent>
              {preferences.length === 0 ? (
                <Typography variant="body2" color="text.secondary" align="center" py={3}>
                  No food preferences set yet. Search for ingredients above to add your preferences.
                </Typography>
              ) : (
                <List>
                  {preferences.map((preference) => (
                    <ListItem
                      key={preference.id}
                      sx={{
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        mb: 1
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body1">
                              {preference.ingredient.name}
                            </Typography>
                            <Chip
                              icon={getPreferenceIcon(preference.preference)}
                              label={preference.preference.replace('_', ' ')}
                              color={getPreferenceColor(preference.preference) as any}
                              size="small"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {preference.ingredient.category} • {preference.ingredient.aisle}
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
                        <Box display="flex" gap={1}>
                          <IconButton
                            size="small"
                            onClick={() => handleEditPreference(preference)}
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
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
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
                <Typography variant="h6">{selectedIngredient.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedIngredient.category} • {selectedIngredient.aisle}
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
              placeholder="Add any notes about this preference..."
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