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
  const [preferences, setPreferences] = useState<FoodPreference[]>([]);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [preferenceDialog, setPreferenceDialog] = useState(false);
  const [editingPreference, setEditingPreference] = useState<FoodPreference | null>(null);
  const [preferenceType, setPreferenceType] = useState('LIKE');
  const [preferenceNotes, setPreferenceNotes] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
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

  // Available categories and aisles
  const [categories, setCategories] = useState<string[]>([]);
  const [aisles, setAisles] = useState<string[]>([]);

  const itemsPerPage = 10;

  useEffect(() => {
    if (user) {
      loadPreferences();
      loadCategoriesAndAisles();
    }
  }, [user]);

  const loadCategoriesAndAisles = async () => {
    try {
      // Load categories and aisles from the ingredients database
      const response = await fetch('/api/ingredients/search?loadCategories=true&limit=1000');
      if (response.ok) {
        const data = await response.json();
        const ingredients = data.ingredients || [];
        
        // Extract unique categories and aisles
        const uniqueCategories = Array.from(new Set(ingredients.map((i: Ingredient) => i.category).filter(Boolean))) as string[];
        const uniqueAisles = Array.from(new Set(ingredients.map((i: Ingredient) => i.aisle).filter(Boolean))) as string[];
        
        setCategories(uniqueCategories.sort());
        setAisles(uniqueAisles.sort());
      }
    } catch (error) {
      console.error('Error loading categories and aisles:', error);
    }
  };

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/food-preferences');
      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences || []);
        setTotalPages(Math.ceil((data.preferences || []).length / itemsPerPage));
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      setError('Failed to load food preferences');
    } finally {
      setLoading(false);
    }
  };

  const searchIngredients = async (term: string) => {
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      // Build query parameters for filtering
      const params = new URLSearchParams({
        q: term,
        limit: '20'
      });

      if (categoryFilter) params.append('category', categoryFilter);
      if (aisleFilter) params.append('aisle', aisleFilter);

      const response = await fetch(`/api/ingredients/search?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        let ingredients = data.ingredients || [];

        // Apply nutrition filters on the client side
        ingredients = ingredients.filter((ingredient: Ingredient) => {
          return (
            ingredient.calories >= calorieRange[0] && ingredient.calories <= calorieRange[1] &&
            ingredient.protein >= proteinRange[0] && ingredient.protein <= proteinRange[1] &&
            ingredient.carbs >= carbRange[0] && ingredient.carbs <= carbRange[1] &&
            ingredient.fat >= fatRange[0] && ingredient.fat <= fatRange[1] &&
            (!ingredient.fiber || (ingredient.fiber >= fiberRange[0] && ingredient.fiber <= fiberRange[1])) &&
            (!ingredient.sodium || (ingredient.sodium >= sodiumRange[0] && ingredient.sodium <= sodiumRange[1]))
          );
        });

        setSearchResults(ingredients);
      }
    } catch (error) {
      console.error('Error searching ingredients:', error);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
    searchIngredients(value);
  };

  // Apply filters when they change
  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchIngredients(searchTerm);
    }
  }, [categoryFilter, aisleFilter, calorieRange, proteinRange, carbRange, fatRange, fiberRange, sodiumRange]);

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

  // Filter preferences based on preference type filter
  const filteredPreferences = preferences.filter(preference => {
    if (preferenceTypeFilter && preference.preference !== preferenceTypeFilter) {
      return false;
    }
    return true;
  });

  const paginatedPreferences = filteredPreferences.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
                  </Grid>
                </Paper>
              </Collapse>
              
              {searchResults.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Search Results ({searchResults.length}):
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