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
  Collapse,
  TextareaAutosize,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  SmartToy as AIIcon,
  PhotoCamera as PhotoIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
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

interface RecipeIngredient {
  ingredient: Ingredient;
  amount: number;
  unit: string;
  notes?: string;
}

interface ManualRecipe {
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
  tags?: string;
  photoUrl?: string;
  isFavorite: boolean;
  ingredients: RecipeIngredient[];
  createdAt: string;
  updatedAt: string;
}

const MEAL_TYPES = [
  'BREAKFAST',
  'LUNCH', 
  'DINNER',
  'SNACK',
  'DESSERT',
  'BEVERAGE'
];

const DIFFICULTY_LEVELS = [
  'EASY',
  'MEDIUM', 
  'HARD',
  'EXPERT'
];

const CUISINES = [
  'AMERICAN',
  'ITALIAN',
  'MEXICAN',
  'CHINESE',
  'JAPANESE',
  'INDIAN',
  'THAI',
  'FRENCH',
  'MEDITERRANEAN',
  'GREEK',
  'SPANISH',
  'MOROCCAN',
  'LEBANESE',
  'TURKISH',
  'RUSSIAN',
  'GERMAN',
  'BRITISH',
  'IRISH',
  'SCOTTISH',
  'WELSH',
  'CANADIAN',
  'AUSTRALIAN',
  'NEW_ZEALAND',
  'SOUTH_AFRICAN',
  'BRAZILIAN',
  'ARGENTINE',
  'CHILEAN',
  'PERUVIAN',
  'COLOMBIAN',
  'VENEZUELAN',
  'ECUADORIAN',
  'BOLIVIAN',
  'PARAGUAYAN',
  'URUGUAYAN',
  'GUYANESE',
  'SURINAMESE',
  'FRENCH_GUIANESE',
  'FALKLANDS',
  'OTHER'
];

const UNITS = [
  'g', 'kg', 'oz', 'lb',
  'ml', 'l', 'cup', 'cups', 'tbsp', 'tsp',
  'piece', 'pieces', 'slice', 'slices',
  'clove', 'cloves', 'bunch', 'bunches',
  'can', 'cans', 'jar', 'jars', 'pack', 'packs'
];

export default function ManualRecipeBuilderTab() {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<ManualRecipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Recipe form state
  const [recipeForm, setRecipeForm] = useState({
    name: '',
    description: '',
    mealType: 'DINNER',
    servings: 4,
    instructions: '',
    prepTime: 15,
    cookTime: 30,
    difficulty: 'MEDIUM',
    cuisine: 'AMERICAN',
    tags: '',
    photoUrl: ''
  });

  // Ingredient search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Ingredient[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(20);

  // AI search state
  const [aiSearchLoading, setAiSearchLoading] = useState(false);
  const [aiSearchError, setAiSearchError] = useState<string | null>(null);
  const [aiSearchResult, setAiSearchResult] = useState<any>(null);
  const [showAiResult, setShowAiResult] = useState(false);

  // Recipe ingredients state
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>([]);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [ingredientAmount, setIngredientAmount] = useState(1);
  const [ingredientUnit, setIngredientUnit] = useState('g');
  const [ingredientNotes, setIngredientNotes] = useState('');

  // Dialog states
  const [showRecipeDialog, setShowRecipeDialog] = useState(false);
  const [showIngredientDialog, setShowIngredientDialog] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<ManualRecipe | null>(null);

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch('/api/recipes?aiGenerated=false&limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Loaded manual recipes:', data.recipes);
        setRecipes(data.recipes || []);
      } else {
        setError('Failed to load recipes');
      }
    } catch (error) {
      console.error('Error loading recipes:', error);
      setError('Failed to load recipes');
    } finally {
      setLoading(false);
    }
  };

  const loadIngredients = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch(
        `/api/ingredients/search?q=${encodeURIComponent(searchTerm)}&page=${currentPage}&limit=${itemsPerPage}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.ingredients || []);
        setTotalPages(Math.ceil((data.total || 0) / itemsPerPage));
      }
    } catch (error) {
      console.error('Error searching ingredients:', error);
    } finally {
      setSearchLoading(false);
    }
  };

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
      const response = await fetch('/api/ingredients/ai-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          searchTerm: searchTerm.trim()
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

  const clearAiSearch = () => {
    setAiSearchResult(null);
    setAiSearchError(null);
    setShowAiResult(false);
  };

  const handleAddIngredient = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
    setIngredientAmount(1);
    setIngredientUnit('g');
    setIngredientNotes('');
    setShowIngredientDialog(true);
  };

  const handleSaveIngredient = () => {
    if (!selectedIngredient) return;

    const newIngredient: RecipeIngredient = {
      ingredient: selectedIngredient,
      amount: ingredientAmount,
      unit: ingredientUnit,
      notes: ingredientNotes.trim() || undefined
    };

    setRecipeIngredients(prev => [...prev, newIngredient]);
    setShowIngredientDialog(false);
    setSelectedIngredient(null);
  };

  const handleRemoveIngredient = (index: number) => {
    setRecipeIngredients(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveRecipe = async () => {
    if (!recipeForm.name.trim() || !recipeForm.instructions.trim()) {
      setError('Please fill in recipe name and instructions');
      return;
    }

    if (recipeIngredients.length === 0) {
      setError('Please add at least one ingredient');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const recipeData = {
        name: recipeForm.name.trim(),
        description: recipeForm.description.trim() || undefined,
        mealType: recipeForm.mealType,
        servings: recipeForm.servings,
        instructions: recipeForm.instructions.trim(),
        prepTime: recipeForm.prepTime || undefined,
        cookTime: recipeForm.cookTime || undefined,
        totalTime: (recipeForm.prepTime || 0) + (recipeForm.cookTime || 0),
        difficulty: recipeForm.difficulty,
        cuisine: recipeForm.cuisine,
        tags: recipeForm.tags.trim() || undefined,
        photoUrl: recipeForm.photoUrl.trim() || undefined,
        aiGenerated: false,
        ingredients: recipeIngredients.map((item, index) => ({
          ingredientId: item.ingredient.id,
          amount: item.amount,
          unit: item.unit,
          notes: item.notes,
          order: index + 1
        }))
      };

      const url = editingRecipe 
        ? `/api/recipes/${editingRecipe.id}`
        : '/api/recipes';

      const response = await fetch(url, {
        method: editingRecipe ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(recipeData)
      });

      if (response.ok) {
        setSuccess(editingRecipe ? 'Recipe updated successfully!' : 'Recipe created successfully!');
        setShowRecipeDialog(false);
        resetForm();
        loadRecipes();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save recipe');
      }
    } catch (error) {
      console.error('Error saving recipe:', error);
      setError('Failed to save recipe');
    } finally {
      setLoading(false);
    }
  };

  const handleEditRecipe = (recipe: ManualRecipe) => {
    setEditingRecipe(recipe);
    setRecipeForm({
      name: recipe.name,
      description: recipe.description || '',
      mealType: recipe.mealType,
      servings: recipe.servings,
      instructions: recipe.instructions,
      prepTime: recipe.prepTime || 15,
      cookTime: recipe.cookTime || 30,
      difficulty: recipe.difficulty || 'MEDIUM',
      cuisine: recipe.cuisine || 'AMERICAN',
      tags: recipe.tags || '',
      photoUrl: recipe.photoUrl || ''
    });
    setRecipeIngredients(recipe.ingredients);
    setShowRecipeDialog(true);
  };

  const handleDeleteRecipe = async (recipeId: string) => {
    if (!confirm('Are you sure you want to delete this recipe?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch(`/api/recipes/${recipeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setSuccess('Recipe deleted successfully!');
        loadRecipes();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete recipe');
      }
    } catch (error) {
      console.error('Error deleting recipe:', error);
      setError('Failed to delete recipe');
    }
  };

  const handleToggleFavorite = async (recipeId: string, currentFavorite: boolean) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch(`/api/recipes/${recipeId}/toggle-favorite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setRecipes(prev => prev.map(recipe => 
          recipe.id === recipeId 
            ? { ...recipe, isFavorite: !currentFavorite }
            : recipe
        ));
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const resetForm = () => {
    setRecipeForm({
      name: '',
      description: '',
      mealType: 'DINNER',
      servings: 4,
      instructions: '',
      prepTime: 15,
      cookTime: 30,
      difficulty: 'MEDIUM',
      cuisine: 'AMERICAN',
      tags: '',
      photoUrl: ''
    });
    setRecipeIngredients([]);
    setEditingRecipe(null);
  };

  const handleNewRecipe = () => {
    resetForm();
    setShowRecipeDialog(true);
  };

  useEffect(() => {
    if (searchTerm.trim()) {
      const timeoutId = setTimeout(() => {
        loadIngredients();
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm, currentPage]);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h2">
          Manual Recipe Builder
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleNewRecipe}
        >
          Create New Recipe
        </Button>
      </Box>

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

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {recipes.map((recipe) => (
            <Grid item xs={12} sm={6} md={4} key={recipe.id}>
              <Card>
                <CardHeader
                  title={recipe.name}
                  subheader={`${recipe.mealType} • ${recipe.servings} servings`}
                  action={
                    <IconButton
                      onClick={() => handleToggleFavorite(recipe.id, recipe.isFavorite)}
                    >
                      {recipe.isFavorite ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
                    </IconButton>
                  }
                />
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {recipe.description || 'No description'}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary">
                    {recipe.ingredients.length} ingredients
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary">
                    Prep: {recipe.prepTime || 0}min • Cook: {recipe.cookTime || 0}min
                  </Typography>

                  <Box mt={2} display="flex" gap={1}>
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => handleEditRecipe(recipe)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDeleteRecipe(recipe.id)}
                    >
                      Delete
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Recipe Dialog */}
      <Dialog 
        open={showRecipeDialog} 
        onClose={() => setShowRecipeDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingRecipe ? 'Edit Recipe' : 'Create New Recipe'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Recipe Name"
                value={recipeForm.name}
                onChange={(e) => setRecipeForm(prev => ({ ...prev, name: e.target.value }))}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Meal Type</InputLabel>
                <Select
                  value={recipeForm.mealType}
                  onChange={(e) => setRecipeForm(prev => ({ ...prev, mealType: e.target.value }))}
                  label="Meal Type"
                >
                  {MEAL_TYPES.map(type => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Servings"
                type="number"
                value={recipeForm.servings}
                onChange={(e) => setRecipeForm(prev => ({ ...prev, servings: parseInt(e.target.value) || 1 }))}
                fullWidth
                inputProps={{ min: 1, max: 20 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Difficulty</InputLabel>
                <Select
                  value={recipeForm.difficulty}
                  onChange={(e) => setRecipeForm(prev => ({ ...prev, difficulty: e.target.value }))}
                  label="Difficulty"
                >
                  {DIFFICULTY_LEVELS.map(level => (
                    <MenuItem key={level} value={level}>{level}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Prep Time (minutes)"
                type="number"
                value={recipeForm.prepTime}
                onChange={(e) => setRecipeForm(prev => ({ ...prev, prepTime: parseInt(e.target.value) || 0 }))}
                fullWidth
                inputProps={{ min: 0, max: 480 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Cook Time (minutes)"
                type="number"
                value={recipeForm.cookTime}
                onChange={(e) => setRecipeForm(prev => ({ ...prev, cookTime: parseInt(e.target.value) || 0 }))}
                fullWidth
                inputProps={{ min: 0, max: 480 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Cuisine</InputLabel>
                <Select
                  value={recipeForm.cuisine}
                  onChange={(e) => setRecipeForm(prev => ({ ...prev, cuisine: e.target.value }))}
                  label="Cuisine"
                >
                  {CUISINES.map(cuisine => (
                    <MenuItem key={cuisine} value={cuisine}>{cuisine.replace('_', ' ')}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Tags (comma separated)"
                value={recipeForm.tags}
                onChange={(e) => setRecipeForm(prev => ({ ...prev, tags: e.target.value }))}
                fullWidth
                placeholder="quick, healthy, vegetarian"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                value={recipeForm.description}
                onChange={(e) => setRecipeForm(prev => ({ ...prev, description: e.target.value }))}
                fullWidth
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Photo URL (optional)"
                value={recipeForm.photoUrl}
                onChange={(e) => setRecipeForm(prev => ({ ...prev, photoUrl: e.target.value }))}
                fullWidth
                placeholder="https://example.com/recipe-photo.jpg"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Instructions"
                value={recipeForm.instructions}
                onChange={(e) => setRecipeForm(prev => ({ ...prev, instructions: e.target.value }))}
                fullWidth
                multiline
                rows={6}
                required
                placeholder="1. First step...&#10;2. Second step...&#10;3. Continue with remaining steps..."
              />
            </Grid>

            {/* Ingredients Section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Ingredients ({recipeIngredients.length})
              </Typography>
              
              {/* Ingredient Search */}
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Add Ingredients
                </Typography>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Search ingredients"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      fullWidth
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            {searchLoading && <CircularProgress size={20} />}
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Button
                      variant="outlined"
                      startIcon={<AIIcon />}
                      onClick={handleAiSearch}
                      disabled={aiSearchLoading || !searchTerm.trim()}
                      fullWidth
                    >
                      {aiSearchLoading ? 'Searching...' : 'AI Best Match'}
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Button
                      variant="outlined"
                      onClick={clearAiSearch}
                      disabled={!showAiResult}
                      fullWidth
                    >
                      Clear AI
                    </Button>
                  </Grid>
                </Grid>

                {/* AI Search Results */}
                {showAiResult && aiSearchResult && (
                  <Box mt={2}>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      AI Recommendation: {aiSearchResult.explanation}
                    </Alert>
                    {aiSearchResult.ingredients && aiSearchResult.ingredients.length > 0 && (
                      <List dense>
                        {aiSearchResult.ingredients.map((ingredient: Ingredient) => (
                          <ListItem key={ingredient.id}>
                            <ListItemText
                              primary={ingredient.name}
                              secondary={`${ingredient.calories} cal • ${ingredient.protein}g protein • ${ingredient.carbs}g carbs • ${ingredient.fat}g fat`}
                            />
                            <ListItemSecondaryAction>
                              <Button
                                size="small"
                                startIcon={<AddIcon />}
                                onClick={() => handleAddIngredient(ingredient)}
                              >
                                Add
                              </Button>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                    )}
                  </Box>
                )}

                {/* Search Results */}
                {searchResults.length > 0 && !showAiResult && (
                  <Box mt={2}>
                    <List dense>
                      {searchResults.map((ingredient) => (
                        <ListItem key={ingredient.id}>
                          <ListItemText
                            primary={ingredient.name}
                            secondary={`${ingredient.calories} cal • ${ingredient.protein}g protein • ${ingredient.carbs}g carbs • ${ingredient.fat}g fat`}
                          />
                          <ListItemSecondaryAction>
                            <Button
                              size="small"
                              startIcon={<AddIcon />}
                              onClick={() => handleAddIngredient(ingredient)}
                            >
                              Add
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
                          size="small"
                        />
                      </Box>
                    )}
                  </Box>
                )}

                {/* AI Search Error */}
                {aiSearchError && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {aiSearchError}
                  </Alert>
                )}
              </Paper>

              {/* Current Ingredients */}
              {recipeIngredients.length > 0 && (
                <List dense>
                  {recipeIngredients.map((item, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={`${item.amount} ${item.unit} ${item.ingredient.name}`}
                        secondary={item.notes}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => handleRemoveIngredient(index)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRecipeDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveRecipe}
            variant="contained"
            disabled={loading || !recipeForm.name.trim() || !recipeForm.instructions.trim() || recipeIngredients.length === 0}
          >
            {loading ? <CircularProgress size={20} /> : (editingRecipe ? 'Update Recipe' : 'Create Recipe')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Ingredient Dialog */}
      <Dialog
        open={showIngredientDialog}
        onClose={() => setShowIngredientDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Ingredient</DialogTitle>
        <DialogContent>
          {selectedIngredient && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedIngredient.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {selectedIngredient.calories} cal • {selectedIngredient.protein}g protein • {selectedIngredient.carbs}g carbs • {selectedIngredient.fat}g fat
              </Typography>
              
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={6}>
                  <TextField
                    label="Amount"
                    type="number"
                    value={ingredientAmount}
                    onChange={(e) => setIngredientAmount(parseFloat(e.target.value) || 0)}
                    fullWidth
                    inputProps={{ min: 0, step: 0.1 }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Unit</InputLabel>
                    <Select
                      value={ingredientUnit}
                      onChange={(e) => setIngredientUnit(e.target.value)}
                      label="Unit"
                    >
                      {UNITS.map(unit => (
                        <MenuItem key={unit} value={unit}>{unit}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Notes (optional)"
                    value={ingredientNotes}
                    onChange={(e) => setIngredientNotes(e.target.value)}
                    fullWidth
                    placeholder="e.g., finely chopped, room temperature"
                  />
                </Grid>
              </Grid>
            </Box>
            )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowIngredientDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveIngredient} variant="contained">
            Add to Recipe
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 