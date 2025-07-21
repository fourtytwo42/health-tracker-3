'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Pagination,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Divider,
  Tooltip,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  ExpandMore as ExpandMoreIcon,
  Restaurant as RestaurantIcon,
  Timer as TimerIcon,
  LocalDining as LocalDiningIcon,
  SwapHoriz as SwapIcon,
  TrendingUp as TrendingUpIcon,
  Delete as DeleteIcon,
  Image as ImageIcon
} from '@mui/icons-material';
import { formatEggDisplay } from '@/lib/utils/unitConversion';
import NutritionLabel from '../../components/cards/NutritionLabel';

// Utility function to convert metric to cups
const convertToCups = (amount: number, unit: string): string => {
  // Common conversion factors
  const conversions: { [key: string]: number } = {
    // Weight to cups (approximate)
    'g': 0.004, // 1g ≈ 0.004 cups (varies by ingredient)
    'kg': 4, // 1kg ≈ 4 cups
    'oz': 0.125, // 1oz ≈ 1/8 cup
    'lb': 2, // 1lb ≈ 2 cups
    
    // Volume to cups
    'ml': 0.004, // 1ml ≈ 0.004 cups
    'l': 4, // 1L ≈ 4 cups
    'tbsp': 0.0625, // 1 tbsp = 1/16 cup
    'tsp': 0.0208, // 1 tsp ≈ 1/48 cup
    'cup': 1, // 1 cup = 1 cup
    'cups': 1
  };

  const conversionFactor = conversions[unit.toLowerCase()] || 0.004; // Default to 0.004 for unknown units
  const cups = amount * conversionFactor;

  // Round to nearest fraction
  if (cups < 1) {
    // For amounts under 1 cup, round to nearest 1/8
    const eighths = Math.round(cups * 8);
    if (eighths === 0) return '';
    if (eighths === 1) return '1/8 cup';
    if (eighths === 2) return '1/4 cup';
    if (eighths === 3) return '3/8 cup';
    if (eighths === 4) return '1/2 cup';
    if (eighths === 5) return '5/8 cup';
    if (eighths === 6) return '3/4 cup';
    if (eighths === 7) return '7/8 cup';
    return '1 cup';
  } else {
    // For amounts over 1 cup, round to nearest 1/4
    const quarters = Math.round(cups * 4);
    const wholeCups = Math.floor(quarters / 4);
    const remainder = quarters % 4;
    
    let result = '';
    if (wholeCups > 0) {
      result += `${wholeCups} cup${wholeCups > 1 ? 's' : ''}`;
    }
    
    if (remainder > 0) {
      if (result) result += ' ';
      if (remainder === 1) result += '1/4';
      else if (remainder === 2) result += '1/2';
      else if (remainder === 3) result += '3/4';
    }
    
    return result;
  }
};

interface Recipe {
  id: string;
  name: string;
  description?: string;
  mealType: string;
  servings: number;
  instructions: string;
  prepTime?: number;
  cookTime?: number;
  totalTime?: number;
  difficulty?: string;
  cuisine?: string;
  tags?: string[];
  photoUrl?: string;
  isFavorite: boolean;
  isPublic: boolean;
  aiGenerated: boolean;
  originalQuery?: string;
  createdAt: string;
  updatedAt: string;
  ingredients: Array<{
    id: string;
    amount: number;
    unit: string;
    notes?: string;
    isOptional: boolean;
    order: number;
    ingredient: {
      id: string;
      name: string;
      category: string;
      aisle: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber: number;
      sugar: number;
    };
  }>;
  nutrition: {
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
    totalFiber: number;
    totalSugar: number;
    caloriesPerServing: number;
    proteinPerServing: number;
    carbsPerServing: number;
    fatPerServing: number;
    fiberPerServing: number;
    sugarPerServing: number;
  };
  // Add scaling factor for local adjustments
  scalingFactor?: number;
}

interface MenuBuilderTabProps {
  userProfile: any;
  foodPreferences: any[];
}

export default function MenuBuilderTab({ userProfile, foodPreferences }: MenuBuilderTabProps) {
  const [keywords, setKeywords] = useState('');
  const [mealType, setMealType] = useState('dinner');
  const [servings, setServings] = useState(2);
  const [calorieGoal, setCalorieGoal] = useState(userProfile?.calorieTarget || 500);
  const [isGenerating, setIsGenerating] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMealType, setFilterMealType] = useState('');
  const [filterFavorite, setFilterFavorite] = useState<boolean | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showRecipeDialog, setShowRecipeDialog] = useState(false);
  const [showIngredientDialog, setShowIngredientDialog] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<any>(null);
  const [showNutritionDialog, setShowNutritionDialog] = useState(false);
  const [targetCalories, setTargetCalories] = useState(0);
  const [generateImage, setGenerateImage] = useState(false);
  const [expandedNutrition, setExpandedNutrition] = useState<Record<string, boolean>>({});
  const [expandedIngredients, setExpandedIngredients] = useState<Record<string, boolean>>({});
  const [expandedInstructions, setExpandedInstructions] = useState<Record<string, boolean>>({});

  const mealTypes = [
    { value: 'breakfast', label: 'Breakfast' },
    { value: 'lunch', label: 'Lunch' },
    { value: 'dinner', label: 'Dinner' },
    { value: 'snack', label: 'Snack' },
    { value: 'dessert', label: 'Dessert' }
  ];

  // LocalStorage functions for calorie adjustments
  const getStoredAdjustments = (): Record<string, number> => {
    try {
      const stored = localStorage.getItem('recipeCalorieAdjustments');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  };

  const saveAdjustment = (recipeId: string, scalingFactor: number) => {
    try {
      const adjustments = getStoredAdjustments();
      adjustments[recipeId] = scalingFactor;
      localStorage.setItem('recipeCalorieAdjustments', JSON.stringify(adjustments));
    } catch (error) {
      console.error('Error saving adjustment:', error);
    }
  };

  const removeAdjustment = (recipeId: string) => {
    try {
      const adjustments = getStoredAdjustments();
      delete adjustments[recipeId];
      localStorage.setItem('recipeCalorieAdjustments', JSON.stringify(adjustments));
    } catch (error) {
      console.error('Error removing adjustment:', error);
    }
  };

  const applyAdjustmentToRecipe = (recipe: Recipe): Recipe => {
    const adjustments = getStoredAdjustments();
    const scalingFactor = adjustments[recipe.id];
    
    if (!scalingFactor || scalingFactor === 1) {
      return recipe;
    }

    // Apply scaling factor to ingredients and nutrition
    const adjustedRecipe = {
      ...recipe,
      scalingFactor,
      ingredients: recipe.ingredients.map(ri => ({
        ...ri,
        amount: ri.amount * scalingFactor
      })),
      nutrition: {
        totalCalories: Math.round(recipe.nutrition.totalCalories * scalingFactor),
        totalProtein: Math.round((recipe.nutrition.totalProtein * scalingFactor) * 10) / 10,
        totalCarbs: Math.round((recipe.nutrition.totalCarbs * scalingFactor) * 10) / 10,
        totalFat: Math.round((recipe.nutrition.totalFat * scalingFactor) * 10) / 10,
        totalFiber: Math.round((recipe.nutrition.totalFiber * scalingFactor) * 10) / 10,
        totalSugar: Math.round((recipe.nutrition.totalSugar * scalingFactor) * 10) / 10,
        caloriesPerServing: Math.round((recipe.nutrition.totalCalories * scalingFactor) / recipe.servings),
        proteinPerServing: Math.round(((recipe.nutrition.totalProtein * scalingFactor) / recipe.servings) * 10) / 10,
        carbsPerServing: Math.round(((recipe.nutrition.totalCarbs * scalingFactor) / recipe.servings) * 10) / 10,
        fatPerServing: Math.round(((recipe.nutrition.totalFat * scalingFactor) / recipe.servings) * 10) / 10,
        fiberPerServing: Math.round(((recipe.nutrition.totalFiber * scalingFactor) / recipe.servings) * 10) / 10,
        sugarPerServing: Math.round(((recipe.nutrition.totalSugar * scalingFactor) / recipe.servings) * 10) / 10
      }
    };

    return adjustedRecipe;
  };

  useEffect(() => {
    loadRecipes();
  }, [currentPage, searchQuery, filterMealType, filterFavorite]);

  const loadRecipes = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      });

      if (searchQuery) params.append('search', searchQuery);
      if (filterMealType) params.append('mealType', filterMealType);
      if (filterFavorite !== undefined) params.append('isFavorite', filterFavorite.toString());

      const response = await fetch(`/api/recipes?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setRecipes(data.recipes.map(applyAdjustmentToRecipe));
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error('Error loading recipes:', error);
    }
  };

  const generateRecipe = async () => {
    if (!keywords.trim()) {
      alert('Please enter keywords for your recipe');
      return;
    }

    setIsGenerating(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/recipes/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          keywords,
          mealType,
          servings,
          calorieGoal,
          preferences: foodPreferences,
          healthMetrics: userProfile,
          generateImage
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Reload recipes to get the updated recipe with image
        await loadRecipes();
        setKeywords('');
        alert('Recipe generated successfully!');
      } else {
        const error = await response.json();
        alert(`Error generating recipe: ${error.error}`);
      }
    } catch (error) {
      console.error('Error generating recipe:', error);
      alert('Error generating recipe');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleFavorite = async (recipeId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/recipes/${recipeId}/toggle-favorite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRecipes(prev => 
          prev.map(recipe => 
            recipe.id === recipeId ? applyAdjustmentToRecipe(data.recipe) : recipe
          )
        );
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const regenerateRecipe = async (recipeId: string) => {
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe?.originalQuery) return;

    setIsGenerating(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/recipes/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          keywords: recipe.originalQuery,
          mealType: recipe.mealType,
          servings: recipe.servings,
          calorieGoal,
          preferences: foodPreferences,
          healthMetrics: userProfile
        })
      });

      if (response.ok) {
        const data = await response.json();
        setRecipes(prev => 
          prev.map(r => r.id === recipeId ? applyAdjustmentToRecipe(data.recipe) : r)
        );
        alert('Recipe regenerated successfully!');
      }
    } catch (error) {
      console.error('Error regenerating recipe:', error);
      alert('Error regenerating recipe');
    } finally {
      setIsGenerating(false);
    }
  };

  const replaceIngredient = async (recipeId: string, ingredientId: string, newIngredientId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/recipes/${recipeId}/replace-ingredient`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ingredientId,
          newIngredientId,
          adjustAmount: true
        })
      });

      if (response.ok) {
        const data = await response.json();
        setRecipes(prev => 
          prev.map(recipe => 
            recipe.id === recipeId ? applyAdjustmentToRecipe(data.recipe) : recipe
          )
        );
        setShowIngredientDialog(false);
        alert('Ingredient replaced successfully!');
      }
    } catch (error) {
      console.error('Error replacing ingredient:', error);
      alert('Error replacing ingredient');
    }
  };

  const adjustNutrition = async (recipeId: string) => {
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return;

    const currentCalories = recipe.nutrition.totalCalories;
    const scalingFactor = targetCalories / currentCalories;

    // Save adjustment to localStorage
    saveAdjustment(recipeId, scalingFactor);

    // Update the recipe in state with the new scaling factor
    setRecipes(prev => 
      prev.map(recipe => 
        recipe.id === recipeId ? applyAdjustmentToRecipe(recipe) : recipe
      )
    );
    
    setShowNutritionDialog(false);
    alert(`Recipe adjusted to ${targetCalories} calories!`);
  };

  const resetAdjustment = (recipeId: string) => {
    // Remove adjustment from localStorage
    removeAdjustment(recipeId);

    // Reload the recipe without adjustment
    setRecipes(prev => 
      prev.map(recipe => 
        recipe.id === recipeId ? { ...recipe, scalingFactor: undefined } : recipe
      )
    );
    
    setShowNutritionDialog(false);
    alert('Recipe adjustment reset to original!');
  };

  const deleteRecipe = async (recipeId: string) => {
    if (!confirm('Are you sure you want to delete this recipe? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/recipes/${recipeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setRecipes(prev => prev.filter(recipe => recipe.id !== recipeId));
        alert('Recipe deleted successfully!');
      } else {
        const error = await response.json();
        alert(`Error deleting recipe: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting recipe:', error);
      alert('Error deleting recipe');
    }
  };

  const toggleNutritionExpansion = (recipeId: string) => {
    setExpandedNutrition(prev => ({
      ...prev,
      [recipeId]: !prev[recipeId]
    }));
    // Close other overlays
    setExpandedIngredients(prev => ({ ...prev, [recipeId]: false }));
    setExpandedInstructions(prev => ({ ...prev, [recipeId]: false }));
  };

  const toggleIngredientsExpansion = (recipeId: string) => {
    setExpandedIngredients(prev => ({
      ...prev,
      [recipeId]: !prev[recipeId]
    }));
    // Close other overlays
    setExpandedNutrition(prev => ({ ...prev, [recipeId]: false }));
    setExpandedInstructions(prev => ({ ...prev, [recipeId]: false }));
  };

  const toggleInstructionsExpansion = (recipeId: string) => {
    setExpandedInstructions(prev => ({
      ...prev,
      [recipeId]: !prev[recipeId]
    }));
    // Close other overlays
    setExpandedNutrition(prev => ({ ...prev, [recipeId]: false }));
    setExpandedIngredients(prev => ({ ...prev, [recipeId]: false }));
  };

  const handleIngredientPreference = async (ingredientId: string, preference: 'like' | 'dislike' | 'allergy' | 'intolerance') => {
    try {
      const response = await fetch(`/api/food-preferences/${ingredientId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preference }),
      });

      if (response.ok) {
        // If it's dislike, allergy, or intolerance, also trigger substitution
        if (preference !== 'like') {
          // This will trigger the existing substitution dialog
          // We'll need to implement this integration
        }
      }
    } catch (error) {
      console.error('Error updating food preference:', error);
    }
  };

  const NutritionCard = ({ nutrition, servings }: { nutrition: any; servings: number }) => (
    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
      <NutritionLabel
        servings={servings}
        calories={nutrition.caloriesPerServing}
        protein={nutrition.proteinPerServing}
        carbs={nutrition.carbsPerServing}
        fat={nutrition.fatPerServing}
        fiber={nutrition.fiberPerServing}
        sugar={nutrition.sugarPerServing}
        sodium={0} // TODO: Add sodium field to nutrition data structure
      />
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Menu Builder
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Create AI-generated recipes based on your preferences and health goals
      </Typography>

      {/* Recipe Generation Form */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Generate New Recipe
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Keywords (e.g., chicken soup, chocolate dessert)"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="Describe what you want to cook..."
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Meal Type</InputLabel>
                <Select
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value)}
                  label="Meal Type"
                >
                  {mealTypes.map(type => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                type="number"
                label="Servings"
                value={servings}
                onChange={(e) => setServings(parseInt(e.target.value) || 1)}
                inputProps={{ min: 1, max: 20 }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                type="number"
                label="Calorie Goal"
                value={calorieGoal}
                onChange={(e) => setCalorieGoal(parseInt(e.target.value) || 500)}
                inputProps={{ min: 100, max: 2000 }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={generateImage}
                    onChange={(e) => setGenerateImage(e.target.checked)}
                    icon={<ImageIcon />}
                    checkedIcon={<ImageIcon />}
                  />
                }
                label="Generate image for recipe"
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                startIcon={isGenerating ? <CircularProgress size={20} /> : <AddIcon />}
                onClick={generateRecipe}
                disabled={isGenerating || !keywords.trim()}
                sx={{ mt: 1 }}
              >
                {isGenerating ? 'Generating...' : 'Generate Recipe'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          placeholder="Search recipes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
          }}
          sx={{ flexGrow: 1 }}
        />
        <IconButton onClick={() => setShowFilters(!showFilters)}>
          <FilterIcon />
        </IconButton>
      </Box>

      {showFilters && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Filter by Meal Type</InputLabel>
                  <Select
                    value={filterMealType}
                    onChange={(e) => setFilterMealType(e.target.value)}
                    label="Filter by Meal Type"
                  >
                    <MenuItem value="">All</MenuItem>
                    {mealTypes.map(type => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Filter by Favorite</InputLabel>
                  <Select
                    value={filterFavorite === undefined ? '' : filterFavorite.toString()}
                    onChange={(e) => setFilterFavorite(e.target.value === '' ? undefined : e.target.value === 'true')}
                    label="Filter by Favorite"
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="true">Favorites Only</MenuItem>
                    <MenuItem value="false">Not Favorites</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Recipes List */}
      <Grid container spacing={3}>
        {recipes.map((recipe) => (
          <Grid item xs={12} md={6} lg={4} key={recipe.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" component="div">
                    {recipe.name}
                  </Typography>
                  <Box>
                    <IconButton
                      size="small"
                      onClick={() => toggleFavorite(recipe.id)}
                      color={recipe.isFavorite ? 'primary' : 'default'}
                    >
                      {recipe.isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => regenerateRecipe(recipe.id)}
                      disabled={isGenerating}
                    >
                      <RefreshIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => deleteRecipe(recipe.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Chip
                    icon={<RestaurantIcon />}
                    label={recipe.mealType}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                  <Chip
                    icon={<LocalDiningIcon />}
                    label={`${recipe.servings} servings`}
                    size="small"
                    variant="outlined"
                  />
                  {recipe.totalTime && (
                    <Chip
                      icon={<TimerIcon />}
                      label={`${recipe.totalTime} min`}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Box>

                {recipe.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {recipe.description}
                  </Typography>
                )}

                {/* Image and Nutrition Section */}
                <Box sx={{ position: 'relative', mb: 2 }}>
                  {recipe.photoUrl ? (
                    <Box sx={{ position: 'relative' }}>
                      <img
                        src={recipe.photoUrl}
                        alt={recipe.name}
                        style={{
                          width: '100%',
                          height: '420px',
                          objectFit: 'cover',
                          borderRadius: '8px'
                        }}
                      />
                      {/* Book-style Navigation - Left Side */}
                      <Box
                        sx={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          display: 'flex',
                          flexDirection: 'row',
                          zIndex: 10
                        }}
                      >
                        {/* Instructions - Always on left unless active */}
                        {!expandedInstructions[recipe.id] && (
                          <Box
                            sx={{
                              width: '40px',
                              height: '100%',
                              background: 'rgba(0, 0, 0, 0.7)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                background: 'rgba(0, 0, 0, 0.8)'
                              }
                            }}
                            onClick={() => toggleInstructionsExpansion(recipe.id)}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                color: 'white',
                                whiteSpace: 'nowrap',
                                fontWeight: 'bold',
                                fontSize: '0.7rem',
                                transform: 'rotate(-90deg)'
                              }}
                            >
                              Instructions
                            </Typography>
                          </Box>
                        )}

                        {/* Ingredients - On left unless active or instructions is active */}
                        {!expandedIngredients[recipe.id] && !expandedInstructions[recipe.id] && (
                          <Box
                            sx={{
                              width: '40px',
                              height: '100%',
                              background: 'rgba(0, 0, 0, 0.7)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                background: 'rgba(0, 0, 0, 0.8)'
                              }
                            }}
                            onClick={() => toggleIngredientsExpansion(recipe.id)}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                color: 'white',
                                whiteSpace: 'nowrap',
                                fontWeight: 'bold',
                                fontSize: '0.7rem',
                                transform: 'rotate(-90deg)'
                              }}
                            >
                              Ingredients
                            </Typography>
                          </Box>
                        )}

                        {/* Nutrition - On left unless any previous is active */}
                        {!expandedNutrition[recipe.id] && !expandedInstructions[recipe.id] && !expandedIngredients[recipe.id] && (
                          <Box
                            sx={{
                              width: '40px',
                              height: '100%',
                              background: 'rgba(0, 0, 0, 0.7)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                background: 'rgba(0, 0, 0, 0.8)'
                              }
                            }}
                            onClick={() => toggleNutritionExpansion(recipe.id)}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                color: 'white',
                                whiteSpace: 'nowrap',
                                fontWeight: 'bold',
                                fontSize: '0.7rem',
                                transform: 'rotate(-90deg)'
                              }}
                            >
                              Nutrition
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      {/* Book-style Navigation - Right Side */}
                      {(expandedNutrition[recipe.id] || expandedIngredients[recipe.id] || expandedInstructions[recipe.id]) && (
                        <Box
                          sx={{
                            position: 'absolute',
                            right: 0,
                            top: 0,
                            bottom: 0,
                            display: 'flex',
                            flexDirection: 'row',
                            zIndex: 10
                          }}
                        >
                          {/* Instructions - On right if active or if ingredients/nutrition is active */}
                          {(expandedInstructions[recipe.id] || expandedIngredients[recipe.id] || expandedNutrition[recipe.id]) && (
                            <Box
                              sx={{
                                width: '40px',
                                height: '100%',
                                background: expandedInstructions[recipe.id] ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.7)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                  background: 'rgba(0, 0, 0, 0.8)'
                                }
                              }}
                              onClick={() => toggleInstructionsExpansion(recipe.id)}
                            >
                              <Typography
                                variant="caption"
                                sx={{
                                  color: 'white',
                                  whiteSpace: 'nowrap',
                                  fontWeight: 'bold',
                                  fontSize: '0.7rem',
                                  transform: 'rotate(-90deg)'
                                }}
                              >
                                Instructions
                              </Typography>
                            </Box>
                          )}

                          {/* Ingredients - On right if active or if nutrition is active */}
                          {(expandedIngredients[recipe.id] || expandedNutrition[recipe.id]) && (
                            <Box
                              sx={{
                                width: '40px',
                                height: '100%',
                                background: expandedIngredients[recipe.id] ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.7)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                  background: 'rgba(0, 0, 0, 0.8)'
                                }
                              }}
                              onClick={() => toggleIngredientsExpansion(recipe.id)}
                            >
                              <Typography
                                variant="caption"
                                sx={{
                                  color: 'white',
                                  whiteSpace: 'nowrap',
                                  fontWeight: 'bold',
                                  fontSize: '0.7rem',
                                  transform: 'rotate(-90deg)'
                                }}
                              >
                                Ingredients
                              </Typography>
                            </Box>
                          )}

                          {/* Nutrition - On right if active */}
                          {expandedNutrition[recipe.id] && (
                            <Box
                              sx={{
                                width: '40px',
                                height: '100%',
                                background: 'rgba(0, 0, 0, 0.8)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                  background: 'rgba(0, 0, 0, 0.8)'
                                }
                              }}
                              onClick={() => toggleNutritionExpansion(recipe.id)}
                            >
                              <Typography
                                variant="caption"
                                sx={{
                                  color: 'white',
                                  whiteSpace: 'nowrap',
                                  fontWeight: 'bold',
                                  fontSize: '0.7rem',
                                  transform: 'rotate(-90deg)'
                                }}
                              >
                                Nutrition
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      )}
                      
                      {/* Image Shading Overlay */}
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: (expandedNutrition[recipe.id] || expandedIngredients[recipe.id] || expandedInstructions[recipe.id]) ? 'rgba(0, 0, 0, 0.4)' : 'transparent',
                          transition: 'background 0.3s ease',
                          borderRadius: '8px',
                          zIndex: 2
                        }}
                      />
                      
                      {/* Nutrition Facts Overlay */}
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: expandedNutrition[recipe.id] ? 0 : '-100%',
                          right: 0,
                          bottom: 0,
                          display: expandedNutrition[recipe.id] ? 'flex' : 'none',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '8px',
                          padding: 2,
                          transition: 'left 0.3s ease',
                          zIndex: 5
                        }}
                      >
                        <Box sx={{ 
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center',
                          padding: 2
                        }}>
                          {/* Nutrition Facts Display */}
                          <Box sx={{
                            width: '100%',
                            maxWidth: '350px',
                            padding: 2
                          }}>
                            <Typography variant="h6" sx={{ 
                              fontWeight: 'bold', 
                              textAlign: 'center', 
                              mb: 2,
                              color: 'white',
                              textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                            }}>
                              Nutrition Facts
                            </Typography>
                            
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="body2" sx={{ 
                                fontWeight: 'bold', 
                                borderBottom: '2px solid white',
                                pb: 0.5,
                                mb: 1,
                                color: 'white',
                                textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                              }}>
                                Serving Size: {recipe.servings} serving{recipe.servings > 1 ? 's' : ''}
                              </Typography>
                            </Box>
                            
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="body2" sx={{ 
                                fontWeight: 'bold', 
                                fontSize: '1.1rem',
                                mb: 1,
                                color: 'white',
                                textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                              }}>
                                Amount Per Serving
                              </Typography>
                            </Box>
                            
                            <Box sx={{ mb: 2 }}>
                              <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between',
                                borderBottom: '1px solid rgba(255,255,255,0.7)',
                                pb: 0.5,
                                mb: 0.5
                              }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'white', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                                  Calories
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'white', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                                  {Math.round(recipe.nutrition.caloriesPerServing)}
                                </Typography>
                              </Box>
                              
                              <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between',
                                borderBottom: '1px solid rgba(255,255,255,0.7)',
                                pb: 0.5,
                                mb: 0.5
                              }}>
                                <Typography variant="body2" sx={{ color: 'white', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                                  Total Fat
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'white', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                                  {Math.round(recipe.nutrition.fatPerServing)}g
                                </Typography>
                              </Box>
                              
                              <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between',
                                borderBottom: '1px solid rgba(255,255,255,0.7)',
                                pb: 0.5,
                                mb: 0.5
                              }}>
                                <Typography variant="body2" sx={{ color: 'white', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                                  Total Carbohydrates
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'white', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                                  {Math.round(recipe.nutrition.carbsPerServing)}g
                                </Typography>
                              </Box>
                              
                              <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between',
                                borderBottom: '1px solid rgba(255,255,255,0.7)',
                                pb: 0.5,
                                mb: 0.5
                              }}>
                                <Typography variant="body2" sx={{ color: 'white', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                                  Protein
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'white', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                                  {Math.round(recipe.nutrition.proteinPerServing)}g
                                </Typography>
                              </Box>
                              
                              <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between',
                                borderBottom: '1px solid rgba(255,255,255,0.7)',
                                pb: 0.5,
                                mb: 0.5
                              }}>
                                <Typography variant="body2" sx={{ color: 'white', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                                  Fiber
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'white', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                                  {Math.round(recipe.nutrition.fiberPerServing)}g
                                </Typography>
                              </Box>
                              
                              <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between',
                                pb: 0.5
                              }}>
                                <Typography variant="body2" sx={{ color: 'white', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                                  Sugar
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'white', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                                  {Math.round(recipe.nutrition.sugarPerServing)}g
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        </Box>
                      </Box>

                      {/* Ingredients Overlay */}
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: expandedIngredients[recipe.id] ? 0 : '-100%',
                          right: 0,
                          bottom: 0,
                          display: expandedIngredients[recipe.id] ? 'flex' : 'none',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '8px',
                          padding: 2,
                          transition: 'left 0.3s ease',
                          zIndex: 5
                        }}
                      >
                        <Box sx={{ 
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center',
                          padding: 2
                        }}>
                          {/* Ingredients Display */}
                          <Box sx={{
                            width: '100%',
                            maxWidth: '600px',
                            padding: 2
                          }}>
                            <Typography variant="h6" sx={{ 
                              fontWeight: 'bold', 
                              textAlign: 'center', 
                              mb: 2,
                              color: 'white',
                              textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                            }}>
                              Ingredients
                            </Typography>
                            
                            <Box sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 1,
                              maxHeight: '350px',
                              overflowY: 'auto'
                            }}>
                              {recipe.ingredients.map((ri, index) => (
                                <Box key={ri.id} sx={{
                                  background: 'rgba(255, 255, 255, 0.9)',
                                  borderRadius: '8px',
                                  padding: 1.5,
                                  border: '1px solid rgba(255, 255, 255, 0.3)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between'
                                }}>
                                  {/* Left side - Ingredient info */}
                                  <Box sx={{ flex: 1 }}>
                                    {/* Row 1: Name and Amount */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                      <Typography variant="body2" sx={{ 
                                        fontWeight: 'bold',
                                        color: '#2c3e50',
                                        mr: 1
                                      }}>
                                        {ri.notes || ri.ingredient.name}
                                      </Typography>
                                      <Typography variant="caption" sx={{ 
                                        color: '#666'
                                      }}>
                                        {formatEggDisplay(ri.amount, ri.unit, recipe.scalingFactor || 1, ri.ingredient.name, ri.ingredient.servingSize, ri.notes)} • {ri.ingredient.name}
                                      </Typography>
                                    </Box>
                                    
                                    {/* Row 2: Nutrition Facts */}
                                    <Typography variant="caption" sx={{ 
                                      color: '#666',
                                      display: 'block'
                                    }}>
                                      {Math.round(ri.amount * (ri.ingredient.calories / 100))} cal • {Math.round(ri.amount * (ri.ingredient.protein / 100))}g protein • {Math.round(ri.amount * (ri.ingredient.carbs / 100))}g carbs • {Math.round(ri.amount * (ri.ingredient.fat / 100))}g fat
                                    </Typography>
                                  </Box>
                                  
                                  {/* Right side - Action Buttons */}
                                  <Box sx={{ 
                                    display: 'flex', 
                                    gap: 0.5,
                                    ml: 1
                                  }}>
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      onClick={() => replaceIngredient(recipe.id, ri.id, '')}
                                      sx={{ 
                                        fontSize: '0.6rem',
                                        minWidth: 'auto',
                                        padding: '2px 4px'
                                      }}
                                    >
                                      Sub
                                    </Button>
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      onClick={() => handleIngredientPreference(ri.ingredient.id, 'like')}
                                      sx={{ 
                                        fontSize: '0.6rem',
                                        minWidth: 'auto',
                                        padding: '2px 4px',
                                        color: 'green'
                                      }}
                                    >
                                      Like
                                    </Button>
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      onClick={() => handleIngredientPreference(ri.ingredient.id, 'dislike')}
                                      sx={{ 
                                        fontSize: '0.6rem',
                                        minWidth: 'auto',
                                        padding: '2px 4px',
                                        color: 'orange'
                                      }}
                                    >
                                      Dis
                                    </Button>
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      onClick={() => handleIngredientPreference(ri.ingredient.id, 'allergy')}
                                      sx={{ 
                                        fontSize: '0.6rem',
                                        minWidth: 'auto',
                                        padding: '2px 4px',
                                        color: 'red'
                                      }}
                                    >
                                      All
                                    </Button>
                                  </Box>
                                </Box>
                              ))}
                            </Box>
                          </Box>
                        </Box>
                      </Box>

                      {/* Instructions Overlay */}
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: expandedInstructions[recipe.id] ? 0 : '-100%',
                          right: 0,
                          bottom: 0,
                          display: expandedInstructions[recipe.id] ? 'flex' : 'none',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '8px',
                          padding: 2,
                          transition: 'left 0.3s ease',
                          zIndex: 5
                        }}
                      >
                        <Box sx={{ 
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center',
                          padding: 2
                        }}>
                          {/* Instructions Display */}
                          <Box sx={{
                            width: '100%',
                            maxWidth: '500px',
                            padding: 2
                          }}>
                            <Typography variant="h6" sx={{ 
                              fontWeight: 'bold', 
                              textAlign: 'center', 
                              mb: 2,
                              color: 'white',
                              textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                            }}>
                              Instructions
                            </Typography>
                            
                            <Box sx={{
                              background: 'rgba(255, 255, 255, 0.9)',
                              borderRadius: '8px',
                              padding: 3,
                              maxHeight: '350px',
                              overflowY: 'auto'
                            }}>
                              <Typography variant="body2" sx={{ 
                                color: '#2c3e50',
                                lineHeight: 1.6,
                                whiteSpace: 'pre-wrap'
                              }}>
                                {recipe.instructions}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  ) : (
                    <NutritionCard nutrition={recipe.nutrition} servings={recipe.servings} />
                  )}
                </Box>

                {/* Show adjustment indicator if recipe has been adjusted */}
                {recipe.scalingFactor && recipe.scalingFactor !== 1 && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Recipe adjusted by {Math.round((recipe.scalingFactor - 1) * 100)}%
                  </Alert>
                )}

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      setSelectedRecipe(recipe);
                      setShowRecipeDialog(true);
                    }}
                  >
                    View Details
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<TrendingUpIcon />}
                    onClick={() => {
                      setSelectedRecipe(recipe);
                      // Set target calories to current adjusted calories
                      setTargetCalories(recipe.nutrition.totalCalories);
                      setShowNutritionDialog(true);
                    }}
                  >
                    Adjust Calories
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(e, page) => setCurrentPage(page)}
            color="primary"
          />
        </Box>
      )}

      {/* Recipe Details Dialog */}
      <Dialog
        open={showRecipeDialog}
        onClose={() => setShowRecipeDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
            {selectedRecipe?.name}
          </Typography>
          <IconButton
            onClick={() => selectedRecipe && toggleFavorite(selectedRecipe.id)}
            sx={{ position: 'absolute', top: 16, right: 16 }}
            color={selectedRecipe?.isFavorite ? 'primary' : 'default'}
          >
            {selectedRecipe?.isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedRecipe && (
            <Box>
              {/* Image and Nutrition Section */}
              {selectedRecipe.photoUrl && (
                <Box sx={{ position: 'relative', mb: 3 }}>
                  <img
                    src={selectedRecipe.photoUrl}
                    alt={selectedRecipe.name}
                    style={{
                      width: '100%',
                      height: '420px',
                      objectFit: 'cover',
                      borderRadius: '8px'
                    }}
                  />
                  {/* Book-style Navigation - Left Side */}
                  <Box
                    sx={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      display: 'flex',
                      flexDirection: 'row',
                      zIndex: 10
                    }}
                  >
                    {/* Instructions - Always on left unless active */}
                    {!expandedInstructions[selectedRecipe.id] && (
                      <Box
                        sx={{
                          width: '40px',
                          height: '100%',
                          background: 'rgba(0, 0, 0, 0.7)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            background: 'rgba(0, 0, 0, 0.8)'
                          }
                        }}
                        onClick={() => toggleInstructionsExpansion(selectedRecipe.id)}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'white',
                            whiteSpace: 'nowrap',
                            fontWeight: 'bold',
                            fontSize: '0.7rem',
                            transform: 'rotate(-90deg)'
                          }}
                        >
                          Instructions
                        </Typography>
                      </Box>
                    )}

                    {/* Ingredients - On left unless active or instructions is active */}
                    {!expandedIngredients[selectedRecipe.id] && !expandedInstructions[selectedRecipe.id] && (
                      <Box
                        sx={{
                          width: '40px',
                          height: '100%',
                          background: 'rgba(0, 0, 0, 0.7)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            background: 'rgba(0, 0, 0, 0.8)'
                          }
                        }}
                        onClick={() => toggleIngredientsExpansion(selectedRecipe.id)}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'white',
                            whiteSpace: 'nowrap',
                            fontWeight: 'bold',
                            fontSize: '0.7rem',
                            transform: 'rotate(-90deg)'
                          }}
                        >
                          Ingredients
                        </Typography>
                      </Box>
                    )}

                    {/* Nutrition - On left unless any previous is active */}
                    {!expandedNutrition[selectedRecipe.id] && !expandedInstructions[selectedRecipe.id] && !expandedIngredients[selectedRecipe.id] && (
                      <Box
                        sx={{
                          width: '40px',
                          height: '100%',
                          background: 'rgba(0, 0, 0, 0.7)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            background: 'rgba(0, 0, 0, 0.8)'
                          }
                        }}
                        onClick={() => toggleNutritionExpansion(selectedRecipe.id)}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'white',
                            whiteSpace: 'nowrap',
                            fontWeight: 'bold',
                            fontSize: '0.7rem',
                            transform: 'rotate(-90deg)'
                          }}
                        >
                          Nutrition
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* Book-style Navigation - Right Side */}
                  {(expandedNutrition[selectedRecipe.id] || expandedIngredients[selectedRecipe.id] || expandedInstructions[selectedRecipe.id]) && (
                    <Box
                      sx={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        bottom: 0,
                        display: 'flex',
                        flexDirection: 'row',
                        zIndex: 10
                      }}
                    >
                      {/* Instructions - On right if active or if ingredients/nutrition is active */}
                      {(expandedInstructions[selectedRecipe.id] || expandedIngredients[selectedRecipe.id] || expandedNutrition[selectedRecipe.id]) && (
                        <Box
                          sx={{
                            width: '40px',
                            height: '100%',
                            background: expandedInstructions[selectedRecipe.id] ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.7)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              background: 'rgba(0, 0, 0, 0.8)'
                            }
                          }}
                          onClick={() => toggleInstructionsExpansion(selectedRecipe.id)}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              color: 'white',
                              whiteSpace: 'nowrap',
                              fontWeight: 'bold',
                              fontSize: '0.7rem',
                              transform: 'rotate(-90deg)'
                            }}
                          >
                            Instructions
                          </Typography>
                        </Box>
                      )}

                      {/* Ingredients - On right if active or if nutrition is active */}
                      {(expandedIngredients[selectedRecipe.id] || expandedNutrition[selectedRecipe.id]) && (
                        <Box
                          sx={{
                            width: '40px',
                            height: '100%',
                            background: expandedIngredients[selectedRecipe.id] ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.7)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              background: 'rgba(0, 0, 0, 0.8)'
                            }
                          }}
                          onClick={() => toggleIngredientsExpansion(selectedRecipe.id)}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              color: 'white',
                              whiteSpace: 'nowrap',
                              fontWeight: 'bold',
                              fontSize: '0.7rem',
                              transform: 'rotate(-90deg)'
                            }}
                          >
                            Ingredients
                          </Typography>
                        </Box>
                      )}

                      {/* Nutrition - On right if active */}
                      {expandedNutrition[selectedRecipe.id] && (
                        <Box
                          sx={{
                            width: '40px',
                            height: '100%',
                            background: 'rgba(0, 0, 0, 0.8)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              background: 'rgba(0, 0, 0, 0.8)'
                            }
                          }}
                          onClick={() => toggleNutritionExpansion(selectedRecipe.id)}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              color: 'white',
                              whiteSpace: 'nowrap',
                              fontWeight: 'bold',
                              fontSize: '0.7rem',
                              transform: 'rotate(-90deg)'
                            }}
                          >
                            Nutrition
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}
                  
                  {/* Image Shading Overlay */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: (expandedNutrition[selectedRecipe.id] || expandedIngredients[selectedRecipe.id] || expandedInstructions[selectedRecipe.id]) ? 'rgba(0, 0, 0, 0.4)' : 'transparent',
                      transition: 'background 0.3s ease',
                      borderRadius: '8px',
                      zIndex: 2
                    }}
                  />
                  
                  {/* Nutrition Facts Overlay */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: expandedNutrition[selectedRecipe.id] ? 0 : '-100%',
                      right: 0,
                      bottom: 0,
                      display: expandedNutrition[selectedRecipe.id] ? 'flex' : 'none',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '8px',
                      padding: 2,
                      transition: 'left 0.3s ease',
                      zIndex: 5
                    }}
                  >
                    <Box sx={{ 
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      padding: 2
                    }}>
                      {/* Nutrition Facts Display */}
                      <Box sx={{
                        width: '100%',
                        maxWidth: '450px',
                        padding: 2
                      }}>
                        <Typography variant="h6" sx={{ 
                          fontWeight: 'bold', 
                          textAlign: 'center', 
                          mb: 2,
                          color: 'white',
                          textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                        }}>
                          Nutrition Facts
                        </Typography>
                        
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" sx={{ 
                            fontWeight: 'bold', 
                            borderBottom: '2px solid white',
                            pb: 0.5,
                            mb: 1,
                            color: 'white',
                            textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                          }}>
                            Serving Size: {selectedRecipe.servings} serving{selectedRecipe.servings > 1 ? 's' : ''}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" sx={{ 
                            fontWeight: 'bold', 
                            fontSize: '1.1rem',
                            mb: 1,
                            color: 'white',
                            textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                          }}>
                            Amount Per Serving
                          </Typography>
                        </Box>
                        
                        <Box sx={{ mb: 2 }}>
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            borderBottom: '1px solid rgba(255,255,255,0.7)',
                            pb: 0.5,
                            mb: 0.5
                          }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'white', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                              Calories
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'white', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                              {Math.round(selectedRecipe.nutrition.caloriesPerServing)}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            borderBottom: '1px solid rgba(255,255,255,0.7)',
                            pb: 0.5,
                            mb: 0.5
                          }}>
                            <Typography variant="body2" sx={{ color: 'white', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                              Total Fat
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'white', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                              {Math.round(selectedRecipe.nutrition.fatPerServing)}g
                            </Typography>
                          </Box>
                          
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            borderBottom: '1px solid rgba(255,255,255,0.7)',
                            pb: 0.5,
                            mb: 0.5
                          }}>
                            <Typography variant="body2" sx={{ color: 'white', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                              Total Carbohydrates
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'white', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                              {Math.round(selectedRecipe.nutrition.carbsPerServing)}g
                            </Typography>
                          </Box>
                          
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            borderBottom: '1px solid rgba(255,255,255,0.7)',
                            pb: 0.5,
                            mb: 0.5
                          }}>
                            <Typography variant="body2" sx={{ color: 'white', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                              Protein
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'white', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                              {Math.round(selectedRecipe.nutrition.proteinPerServing)}g
                            </Typography>
                          </Box>
                          
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            borderBottom: '1px solid rgba(255,255,255,0.7)',
                            pb: 0.5,
                            mb: 0.5
                          }}>
                            <Typography variant="body2" sx={{ color: 'white', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                              Fiber
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'white', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                              {Math.round(selectedRecipe.nutrition.fiberPerServing)}g
                            </Typography>
                          </Box>
                          
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            pb: 0.5
                          }}>
                            <Typography variant="body2" sx={{ color: 'white', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                              Sugar
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'white', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                              {Math.round(selectedRecipe.nutrition.sugarPerServing)}g
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              )}

              <Typography variant="body1" sx={{ mb: 2 }}>
                {selectedRecipe.description}
              </Typography>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">Ingredients</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <List>
                    {selectedRecipe.ingredients.map((ri, index) => (
                      <React.Fragment key={ri.id}>
                        <ListItem>
                          <ListItemText
                            primary={
                              <Box>
                                {/* AI Recipe Name - Main Label */}
                                <Typography variant="body1" fontWeight="medium">
                                  {ri.notes || ri.ingredient.name}
                                </Typography>
                                
                                {/* Weight/Volume */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                  {convertToCups(ri.amount, ri.unit) && (
                                    <Typography variant="body2" color="text.secondary" fontWeight="medium">
                                      {convertToCups(ri.amount, ri.unit)}
                                    </Typography>
                                  )}
                                  <Typography variant="body2" color="text.secondary">
                                    ({formatEggDisplay(ri.amount, ri.unit, selectedRecipe?.scalingFactor || 1, ri.ingredient.name, ri.ingredient.servingSize, ri.notes)})
                                  </Typography>
                                </Box>
                                
                                {/* Database Ingredient Name - Italicized (only show if different from AI name) */}
                                {ri.notes && ri.notes !== ri.ingredient.name && (
                                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                                    {ri.ingredient.name}
                                  </Typography>
                                )}
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Box sx={{ mt: 0.5 }}>
                                  <Grid container spacing={1}>
                                    {(() => {
                                      // Calculate scaled nutrition values for this ingredient
                                      const multiplier = ri.amount / 100; // Assuming nutrition values are per 100g
                                      const scaledCalories = Math.round(ri.ingredient.calories * multiplier);
                                      const scaledProtein = Math.round((ri.ingredient.protein * multiplier) * 10) / 10;
                                      const scaledCarbs = Math.round((ri.ingredient.carbs * multiplier) * 10) / 10;
                                      const scaledFat = Math.round((ri.ingredient.fat * multiplier) * 10) / 10;
                                      
                                      return (
                                        <>
                                          {scaledCalories > 0 && (
                                            <Grid item>
                                              <Chip label={`${scaledCalories} cal`} size="small" variant="outlined" />
                                            </Grid>
                                          )}
                                          {scaledProtein > 0 && (
                                            <Grid item>
                                              <Chip label={`${scaledProtein}g protein`} size="small" variant="outlined" />
                                            </Grid>
                                          )}
                                          {scaledCarbs > 0 && (
                                            <Grid item>
                                              <Chip label={`${scaledCarbs}g carbs`} size="small" variant="outlined" />
                                            </Grid>
                                          )}
                                          {scaledFat > 0 && (
                                            <Grid item>
                                              <Chip label={`${scaledFat}g fat`} size="small" variant="outlined" />
                                            </Grid>
                                          )}
                                        </>
                                      );
                                    })()}
                                  </Grid>
                                </Box>
                              </Box>
                            }
                          />
                          <Tooltip title="Find alternative">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedIngredient(ri);
                                setShowIngredientDialog(true);
                              }}
                            >
                              <SwapIcon />
                            </IconButton>
                          </Tooltip>
                        </ListItem>
                        {index < selectedRecipe.ingredients.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">Instructions</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                    {selectedRecipe.instructions}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRecipeDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Ingredient Replacement Dialog */}
      <Dialog
        open={showIngredientDialog}
        onClose={() => setShowIngredientDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Find Alternative Ingredient</DialogTitle>
        <DialogContent>
          {selectedIngredient && (
            <Typography>
              Find an alternative for {Math.round(selectedIngredient.amount)} {selectedIngredient.unit} of{' '}
              {selectedIngredient.notes || selectedIngredient.ingredient.name}
            </Typography>
          )}
          {/* TODO: Add ingredient search functionality */}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowIngredientDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Nutrition Adjustment Dialog */}
      <Dialog
        open={showNutritionDialog}
        onClose={() => setShowNutritionDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Adjust Recipe Calories</DialogTitle>
        <DialogContent>
          {selectedRecipe && (() => {
            const adjustments = getStoredAdjustments();
            const currentAdjustment = adjustments[selectedRecipe.id];
            const originalCalories = selectedRecipe.nutrition.totalCalories / (currentAdjustment || 1);
            
            return (
              <>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Original calories: {Math.round(originalCalories)}
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Current calories: {selectedRecipe.nutrition.totalCalories}
                  {currentAdjustment && currentAdjustment !== 1 && (
                    <span style={{ color: 'green', marginLeft: '8px' }}>
                      (Adjusted by {Math.round((currentAdjustment - 1) * 100)}%)
                    </span>
                  )}
                </Typography>
                <TextField
                  fullWidth
                  type="number"
                  label="Target Calories"
                  value={targetCalories}
                  onChange={(e) => setTargetCalories(parseInt(e.target.value) || 0)}
                  inputProps={{ min: 100, max: 5000 }}
                  sx={{ mb: 2 }}
                />
                {currentAdjustment && currentAdjustment !== 1 && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    This recipe has been adjusted. You can reset it to the original values.
                  </Alert>
                )}
              </>
            );
          })()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNutritionDialog(false)}>Cancel</Button>
          {selectedRecipe && getStoredAdjustments()[selectedRecipe.id] && (
            <Button 
              color="warning" 
              onClick={() => resetAdjustment(selectedRecipe.id)}
            >
              Reset
            </Button>
          )}
          <Button
            variant="contained"
            onClick={() => selectedRecipe && adjustNutrition(selectedRecipe.id)}
          >
            Adjust
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 