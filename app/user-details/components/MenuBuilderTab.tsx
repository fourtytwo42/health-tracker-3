'use client';

import React, { useState, useEffect } from 'react';
import { authenticatedFetch } from '@/lib/utils/apiClient';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ListItemButton,
  ListItemIcon,
  Tooltip,
  Slider,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Fab,
  Badge,
} from '@mui/material';
import {
  Add as AddIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  Restaurant as RestaurantIcon,
  LocalDining as LocalDiningIcon,
  FitnessCenter as FitnessCenterIcon,
  TrendingUp as TrendingUpIcon,
  ShoppingCart as ShoppingCartIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  SwapHoriz as SwapHorizIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Delete as DeleteIcon,
  Timer as TimerIcon,
  Image as ImageIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import { useAuth } from '@/context/AuthContext';
import RecipeCard from '@/app/components/RecipeCard';

interface Recipe {
  id: string;
  name?: string;
  title?: string;
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
  imageUrl?: string;
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
    isOptional?: boolean;
    order?: number;
    name?: string;
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
    ingredient?: {
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
  scalingFactor?: number;
}

interface MenuBuilderTabProps {
  userProfile: any;
  foodPreferences: any[];
}

export default function MenuBuilderTab({ userProfile, foodPreferences }: MenuBuilderTabProps) {
  const { user } = useAuth();
  const router = useRouter();
  
  // State for recipe generation
  const [keywords, setKeywords] = useState('');
  const [mealType, setMealType] = useState('DINNER');
  const [servings, setServings] = useState(2);
  const [calorieGoal, setCalorieGoal] = useState(750);
  const [generateImage, setGenerateImage] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // State for recipes
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMealType, setSelectedMealType] = useState('all');

  // State for dialogs
  const [showRecipeDialog, setShowRecipeDialog] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showIngredientDialog, setShowIngredientDialog] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<any>(null);
  const [showNutritionDialog, setShowNutritionDialog] = useState(false);
  const [targetCalories, setTargetCalories] = useState(0);

  const mealTypes = [
    { value: 'BREAKFAST', label: 'Breakfast' },
    { value: 'LUNCH', label: 'Lunch' },
    { value: 'DINNER', label: 'Dinner' },
    { value: 'SNACK', label: 'Snack' },
    { value: 'DESSERT', label: 'Dessert' }
  ];

  // Helper functions for recipe adjustments
  const getStoredAdjustments = (): Record<string, number> => {
    if (typeof window === 'undefined') return {};
    const stored = localStorage.getItem('recipeAdjustments');
    return stored ? JSON.parse(stored) : {};
  };

  const saveAdjustment = (recipeId: string, scalingFactor: number) => {
    if (typeof window === 'undefined') return;
    const adjustments = getStoredAdjustments();
    adjustments[recipeId] = scalingFactor;
    localStorage.setItem('recipeAdjustments', JSON.stringify(adjustments));
  };

  const removeAdjustment = (recipeId: string) => {
    if (typeof window === 'undefined') return;
    const adjustments = getStoredAdjustments();
    delete adjustments[recipeId];
    localStorage.setItem('recipeAdjustments', JSON.stringify(adjustments));
  };

  const applyAdjustmentToRecipe = (recipe: Recipe): Recipe => {
    const adjustments = getStoredAdjustments();
    const adjustment = adjustments[recipe.id];
    
    if (!adjustment || adjustment === 1) {
      return recipe;
    }

    return {
      ...recipe,
      scalingFactor: adjustment,
      servings: Math.round(recipe.servings * adjustment),
      ingredients: recipe.ingredients.map(ing => ({
        ...ing,
        amount: ing.amount * adjustment
      })),
      nutrition: {
        totalCalories: Math.round(recipe.nutrition.totalCalories * adjustment),
        totalProtein: Math.round(recipe.nutrition.totalProtein * adjustment),
        totalCarbs: Math.round(recipe.nutrition.totalCarbs * adjustment),
        totalFat: Math.round(recipe.nutrition.totalFat * adjustment),
        totalFiber: Math.round(recipe.nutrition.totalFiber * adjustment),
        totalSugar: Math.round(recipe.nutrition.totalSugar * adjustment),
        caloriesPerServing: Math.round(recipe.nutrition.caloriesPerServing * adjustment),
        proteinPerServing: Math.round(recipe.nutrition.proteinPerServing * adjustment),
        carbsPerServing: Math.round(recipe.nutrition.carbsPerServing * adjustment),
        fatPerServing: Math.round(recipe.nutrition.fatPerServing * adjustment),
        fiberPerServing: Math.round(recipe.nutrition.fiberPerServing * adjustment),
        sugarPerServing: Math.round(recipe.nutrition.sugarPerServing * adjustment),
      }
    };
  };

  // Load user settings and recipes
  useEffect(() => {
    console.log('useEffect triggered - selectedMealType:', selectedMealType);
    if (user) {
      loadUserSettings();
      loadRecipes();
    }
  }, [user, currentPage, searchTerm, selectedMealType]);

  const loadUserSettings = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/settings/user', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const settings = await response.json();
        // Apply user settings if needed
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
    }
  };

  const loadRecipes = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        search: searchTerm,
        mealType: selectedMealType !== 'all' ? selectedMealType : '',
        aiGenerated: 'true' // Only show AI-generated recipes in Menu Builder
      });

      const response = await authenticatedFetch(`/api/recipes?${params}`);

      if (response.ok) {
        const data = await response.json();
        console.log('Meal type filter:', selectedMealType, 'Results:', data.recipes.length, 'Meal types in results:', data.recipes.map((r: any) => r.mealType));
        const adjustedRecipes = data.recipes.map(applyAdjustmentToRecipe);
        setRecipes(adjustedRecipes);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error('Error loading recipes:', error);
    }
  };

  const generateRecipe = async () => {
    if (!keywords.trim()) return;

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
          generateImage
        })
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log('Generated recipe structure:', JSON.stringify(responseData, null, 2));
        
        // Extract the recipe data from the response
        const newRecipe = responseData.data?.recipe || responseData.recipe || responseData;
        console.log('Extracted recipe data:', newRecipe);
        
        setRecipes(prev => [newRecipe, ...prev]);
        setKeywords('');
        setMealType('DINNER');
        setServings(2);
        setCalorieGoal(750);
      } else {
        const error = await response.json();
        alert(`Error generating recipe: ${error.error}`);
      }
    } catch (error) {
      console.error('Error generating recipe:', error);
      alert('Error generating recipe. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleFavorite = async (recipeId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/recipes/${recipeId}/toggle-favorite`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setRecipes(prev => {
          const updated = prev.map(recipe => 
            recipe.id === recipeId 
              ? data.recipe
              : recipe
          );
          return updated;
        });
        
        // Dispatch event to notify calendar component
        window.dispatchEvent(new CustomEvent('favoriteChanged'));
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const regenerateRecipe = async (recipeId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/recipes/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          keywords: recipes.find(r => r.id === recipeId)?.originalQuery || '',
          mealType: recipes.find(r => r.id === recipeId)?.mealType || 'DINNER',
                  servings: recipes.find(r => r.id === recipeId)?.servings || 2,
        calorieGoal: recipes.find(r => r.id === recipeId)?.nutrition?.totalCalories || 750,
          generateImage: true
        })
      });

      if (response.ok) {
        const responseData = await response.json();
        const newRecipe = responseData.data?.recipe || responseData.recipe || responseData;
        setRecipes(prev => prev.map(recipe => 
          recipe.id === recipeId ? newRecipe : recipe
        ));
      }
    } catch (error) {
      console.error('Error regenerating recipe:', error);
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
        body: JSON.stringify({ ingredientId, newIngredientId })
      });

      if (response.ok) {
        const updatedRecipe = await response.json();
        setRecipes(prev => prev.map(recipe => 
          recipe.id === recipeId ? updatedRecipe : recipe
        ));
      }
    } catch (error) {
      console.error('Error replacing ingredient:', error);
    }
  };

  const adjustNutrition = async (recipeId: string) => {
    if (!targetCalories) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/recipes/${recipeId}/adjust-nutrition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ targetCalories })
      });

      if (response.ok) {
        const updatedRecipe = await response.json();
        setRecipes(prev => prev.map(recipe => 
          recipe.id === recipeId ? updatedRecipe : recipe
        ));
        setShowNutritionDialog(false);
        setTargetCalories(0);
      }
    } catch (error) {
      console.error('Error adjusting nutrition:', error);
    }
  };

  const resetAdjustment = (recipeId: string) => {
    removeAdjustment(recipeId);
    setRecipes(prev => prev.map(recipe => 
      recipe.id === recipeId ? { ...recipe, scalingFactor: 1 } : recipe
    ));
  };

  const deleteRecipe = async (recipeId: string) => {
    if (!confirm('Are you sure you want to delete this recipe?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/recipes/${recipeId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setRecipes(prev => prev.filter(recipe => recipe.id !== recipeId));
      }
    } catch (error) {
      console.error('Error deleting recipe:', error);
    }
  };

  const printRecipe = (recipe: Recipe) => {
    window.open(`/print-recipe?id=${recipe.id}`, '_blank');
  };

  const handleIngredientPreference = async (ingredientId: string, preference: 'like' | 'dislike' | 'allergy' | 'intolerance') => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/food-preferences/${ingredientId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ preference })
      });

      if (response.ok) {
        // Update UI to reflect preference
      }
    } catch (error) {
      console.error('Error setting ingredient preference:', error);
    }
  };

  return (
    <Box sx={{ p: 4, maxWidth: 'none', width: '100%' }}>
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
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ flex: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Meal Type</InputLabel>
          <Select
            value={selectedMealType}
            onChange={(e) => setSelectedMealType(e.target.value)}
            label="Meal Type"
          >
            <MenuItem value="all">All Types</MenuItem>
            {mealTypes.map(type => (
              <MenuItem key={type.value} value={type.value}>
                {type.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Recipes List */}
      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '16px',
        justifyContent: 'center'
      }}>
        {recipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            onToggleFavorite={toggleFavorite}
            onDelete={deleteRecipe}
            onPrint={printRecipe}
          />
        ))}
      </Box>

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