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
  Tooltip
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
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';

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

  const mealTypes = [
    { value: 'breakfast', label: 'Breakfast' },
    { value: 'lunch', label: 'Lunch' },
    { value: 'dinner', label: 'Dinner' },
    { value: 'snack', label: 'Snack' },
    { value: 'dessert', label: 'Dessert' }
  ];

  useEffect(() => {
    loadRecipes();
  }, [currentPage, searchQuery, filterMealType, filterFavorite]);

  const loadRecipes = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      });

      if (searchQuery) params.append('search', searchQuery);
      if (filterMealType) params.append('mealType', filterMealType);
      if (filterFavorite !== undefined) params.append('isFavorite', filterFavorite.toString());

      const response = await fetch(`/api/recipes?${params}`);
      if (response.ok) {
        const data = await response.json();
        setRecipes(data.recipes);
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
      const response = await fetch('/api/recipes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords,
          mealType,
          servings,
          calorieGoal,
          preferences: foodPreferences,
          healthMetrics: userProfile
        })
      });

      if (response.ok) {
        const data = await response.json();
        setRecipes(prev => [data.recipe, ...prev]);
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
      const response = await fetch(`/api/recipes/${recipeId}/toggle-favorite`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        setRecipes(prev => 
          prev.map(recipe => 
            recipe.id === recipeId ? data.recipe : recipe
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
      const response = await fetch('/api/recipes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
          prev.map(r => r.id === recipeId ? data.recipe : r)
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
      const response = await fetch(`/api/recipes/${recipeId}/replace-ingredient`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
            recipe.id === recipeId ? data.recipe : recipe
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
    try {
      const response = await fetch(`/api/recipes/${recipeId}/adjust-nutrition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetCalories })
      });

      if (response.ok) {
        const data = await response.json();
        setRecipes(prev => 
          prev.map(recipe => 
            recipe.id === recipeId ? data.recipe : recipe
          )
        );
        setShowNutritionDialog(false);
        alert('Nutrition adjusted successfully!');
      }
    } catch (error) {
      console.error('Error adjusting nutrition:', error);
      alert('Error adjusting nutrition');
    }
  };

  const NutritionCard = ({ nutrition, servings }: { nutrition: any; servings: number }) => (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Nutrition Facts
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Total Calories
            </Typography>
            <Typography variant="h6">
              {nutrition.totalCalories} cal
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Per Serving
            </Typography>
            <Typography variant="h6">
              {nutrition.caloriesPerServing} cal
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="body2" color="text.secondary">
              Protein
            </Typography>
            <Typography variant="body1">
              {nutrition.totalProtein}g
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="body2" color="text.secondary">
              Carbs
            </Typography>
            <Typography variant="body1">
              {nutrition.totalCarbs}g
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="body2" color="text.secondary">
              Fat
            </Typography>
            <Typography variant="body1">
              {nutrition.totalFat}g
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
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

                <NutritionCard nutrition={recipe.nutrition} servings={recipe.servings} />

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
          {selectedRecipe?.name}
          <IconButton
            onClick={() => selectedRecipe && toggleFavorite(selectedRecipe.id)}
            sx={{ float: 'right' }}
            color={selectedRecipe?.isFavorite ? 'primary' : 'default'}
          >
            {selectedRecipe?.isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedRecipe && (
            <Box>
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
                            primary={`${ri.amount} ${ri.unit} ${ri.ingredient.name}`}
                            secondary={ri.notes}
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

              <NutritionCard nutrition={selectedRecipe.nutrition} servings={selectedRecipe.servings} />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRecipeDialog(false)}>Close</Button>
          <Button
            variant="contained"
            onClick={() => {
              setShowRecipeDialog(false);
              selectedRecipe && regenerateRecipe(selectedRecipe.id);
            }}
            disabled={isGenerating}
          >
            Regenerate
          </Button>
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
              Find an alternative for {selectedIngredient.amount} {selectedIngredient.unit} of{' '}
              {selectedIngredient.ingredient.name}
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
          <Typography variant="body2" sx={{ mb: 2 }}>
            Current total calories: {selectedRecipe?.nutrition.totalCalories}
          </Typography>
          <TextField
            fullWidth
            type="number"
            label="Target Calories"
            value={targetCalories}
            onChange={(e) => setTargetCalories(parseInt(e.target.value) || 0)}
            inputProps={{ min: 100, max: 5000 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNutritionDialog(false)}>Cancel</Button>
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