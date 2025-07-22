'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  Slider,
  Paper,
  IconButton,
  Chip,
  CircularProgress,
  Pagination,
  Select,
  MenuItem,
  Alert,
  Collapse
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, SmartToy as AIIcon, Link as LinkIcon } from '@mui/icons-material';

interface Ingredient {
  id: string;
  name: string;
  description?: string;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  cholesterol?: number;
  saturatedFat?: number;
  monounsaturatedFat?: number;
  polyunsaturatedFat?: number;
  transFat?: number;
  netCarbs?: number;
  glycemicIndex?: number;
  glycemicLoad?: number;
  dietaryFlags?: string;
  allergens?: string;
  category?: string;
  aisle?: string;
  isActive: boolean;
}

interface IngredientsTabProps {
  ingredients: Ingredient[];
  ingredientsLoading: boolean;
  currentPage: number;
  pageSize: number;
  totalIngredients: number;
  totalPages: number;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  ingredientCategoryFilter: string;
  setIngredientCategoryFilter: (filter: string) => void;
  ingredientAisleFilter: string;
  setIngredientAisleFilter: (filter: string) => void;
  calorieRange: number[];
  setCalorieRange: (range: number[]) => void;
  proteinRange: number[];
  setProteinRange: (range: number[]) => void;
  carbRange: number[];
  setCarbRange: (range: number[]) => void;
  fatRange: number[];
  setFatRange: (range: number[]) => void;
  fiberRange: number[];
  setFiberRange: (range: number[]) => void;
  sodiumRange: number[];
  setSodiumRange: (range: number[]) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  categories: string[];
  aisles: string[];
  comprehensiveCategories: string[];
  openIngredientDialog: (ingredient?: Ingredient) => void;
  deleteIngredient: (id: string) => Promise<void>;
  loadIngredients: (page: number, size: number) => Promise<void>;
  setPageSize: (size: number) => void;
  setCurrentPage: (page: number) => void;
}

export default function IngredientsTab({
  ingredients,
  ingredientsLoading,
  currentPage,
  pageSize,
  totalIngredients,
  totalPages,
  searchTerm,
  setSearchTerm,
  ingredientCategoryFilter,
  setIngredientCategoryFilter,
  ingredientAisleFilter,
  setIngredientAisleFilter,
  calorieRange,
  setCalorieRange,
  proteinRange,
  setProteinRange,
  carbRange,
  setCarbRange,
  fatRange,
  setFatRange,
  fiberRange,
  setFiberRange,
  sodiumRange,
  setSodiumRange,
  showFilters,
  setShowFilters,
  categories,
  aisles,
  comprehensiveCategories,
  openIngredientDialog,
  deleteIngredient,
  loadIngredients,
  setPageSize,
  setCurrentPage
}: IngredientsTabProps) {
  
  // AI Search state
  const [aiSearchLoading, setAiSearchLoading] = useState(false);
  const [aiSearchResult, setAiSearchResult] = useState<any>(null);
  const [aiSearchError, setAiSearchError] = useState<string | null>(null);
  const [showAiResult, setShowAiResult] = useState(false);

  // Helper function to check if a nutrition value should be displayed
  const shouldShowNutritionValue = (value: number | null | undefined): boolean => {
    return value !== null && value !== undefined && value > 0;
  };

  // Helper function to format nutrition value
  const formatNutritionValue = (value: number | null | undefined, defaultValue: number = 0): number => {
    return value !== null && value !== undefined ? value : defaultValue;
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
      if (fiberRange[0] > 0 || fiberRange[1] < 100) {
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
          category: ingredientCategoryFilter || undefined,
          aisle: ingredientAisleFilter || undefined,
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

  // Add ingredient mapping
  const addIngredientMapping = async (ingredientId: string, ingredientName: string) => {
    if (!searchTerm.trim()) {
      alert('Please enter a search term first');
      return;
    }

    try {
      const response = await fetch('/api/ingredients/mappings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          keyword: searchTerm.trim(),
          ingredientId: ingredientId,
          isActive: true
        })
      });

      const result = await response.json();
      if (result.success) {
        alert(`Mapping created: "${searchTerm}" → "${ingredientName}"`);
      } else {
        alert('Failed to create mapping: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error creating mapping:', error);
      alert('Failed to create mapping');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Ingredients Management</Typography>
        <Button
          variant="contained"
          onClick={() => openIngredientDialog()}
        >
          Add Ingredient
        </Button>
      </Box>

      {/* Search and Filter Section */}
      <Box sx={{ mb: 3 }}>
        {/* Search Bar */}
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            label="Search ingredients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, description, category, or aisle..."
            variant="outlined"
            size="small"
          />
        </Box>

        {/* Filter and AI Search Toggle */}
        <Box sx={{ mb: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button
            variant="outlined"
            onClick={() => setShowFilters(!showFilters)}
            size="small"
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          
          {/* AI Search Button */}
          <Button
            variant="outlined"
            color="primary"
            startIcon={aiSearchLoading ? <CircularProgress size={16} /> : <AIIcon />}
            onClick={handleAiSearch}
            disabled={aiSearchLoading || !searchTerm.trim()}
            size="small"
          >
            {aiSearchLoading ? 'AI Analyzing...' : 'AI Best Match'}
          </Button>

          {/* Clear AI Results Button */}
          {showAiResult && (
            <Button
              variant="outlined"
              color="secondary"
              onClick={clearAiSearch}
              size="small"
            >
              Clear AI Result
            </Button>
          )}
        </Box>

        {/* AI Search Error */}
        {aiSearchError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setAiSearchError(null)}>
            {aiSearchError}
          </Alert>
        )}

        {/* AI Search Result */}
        <Collapse in={showAiResult}>
          {aiSearchResult && (
            <Paper sx={{ p: 2, mb: 2, backgroundColor: '#f8f9fa', border: '2px solid #1976d2' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Typography variant="h6" color="primary">
                  🤖 AI Best Match
                </Typography>
                <Chip 
                  label={`Analyzed ${aiSearchResult.totalCandidates} ingredients`} 
                  size="small" 
                  color="info" 
                />
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
                "{aiSearchResult.reasoning}"
              </Typography>

              {/* AI Selected Ingredient Card */}
              <Card sx={{ backgroundColor: 'white' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" component="div">
                      {aiSearchResult.bestMatch.name}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => addIngredientMapping(aiSearchResult.bestMatch.id, aiSearchResult.bestMatch.name)}
                        title={`Map "${searchTerm}" to ${aiSearchResult.bestMatch.name}`}
                      >
                        <LinkIcon fontSize="small" />
                      </IconButton>
                      <Chip 
                        label={aiSearchResult.bestMatch.category || 'Unknown'} 
                        size="small" 
                        color="primary" 
                      />
                      <Chip 
                        label={aiSearchResult.bestMatch.aisle || 'Unknown'} 
                        size="small" 
                        color="secondary" 
                      />
                    </Box>
                  </Box>
                  
                  {aiSearchResult.bestMatch.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {aiSearchResult.bestMatch.description}
                    </Typography>
                  )}

                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Serving:</strong> {aiSearchResult.bestMatch.servingSize}
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2">
                        <strong>Calories:</strong> {formatNutritionValue(aiSearchResult.bestMatch.calories)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2">
                        <strong>Protein:</strong> {formatNutritionValue(aiSearchResult.bestMatch.protein)}g
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2">
                        <strong>Carbs:</strong> {formatNutritionValue(aiSearchResult.bestMatch.carbs)}g
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2">
                        <strong>Fat:</strong> {formatNutritionValue(aiSearchResult.bestMatch.fat)}g
                      </Typography>
                    </Grid>
                    {shouldShowNutritionValue(aiSearchResult.bestMatch.fiber) && (
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2">
                          <strong>Fiber:</strong> {formatNutritionValue(aiSearchResult.bestMatch.fiber)}g
                        </Typography>
                      </Grid>
                    )}
                    {shouldShowNutritionValue(aiSearchResult.bestMatch.sugar) && (
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2">
                          <strong>Sugar:</strong> {formatNutritionValue(aiSearchResult.bestMatch.sugar)}g
                        </Typography>
                      </Grid>
                    )}
                    {shouldShowNutritionValue(aiSearchResult.bestMatch.sodium) && (
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2">
                          <strong>Sodium:</strong> {formatNutritionValue(aiSearchResult.bestMatch.sodium)}mg
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </Paper>
          )}
        </Collapse>

        {/* Filter Panel */}
        {showFilters && (
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Filters
            </Typography>
            
            <Grid container spacing={2}>
              {/* Category Filter */}
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Category"
                  value={ingredientCategoryFilter}
                  onChange={(e) => setIngredientCategoryFilter(e.target.value)}
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
                  value={ingredientAisleFilter}
                  onChange={(e) => setIngredientAisleFilter(e.target.value)}
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

              {/* Clear Filters */}
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setSearchTerm('');
                    setIngredientCategoryFilter('');
                    setIngredientAisleFilter('');
                    setCalorieRange([0, 1000]);
                    setProteinRange([0, 100]);
                    setCarbRange([0, 100]);
                    setFatRange([0, 100]);
                    setFiberRange([0, 50]);
                    setSodiumRange([0, 2000]);
                    clearAiSearch();
                  }}
                >
                  Clear All Filters
                </Button>
              </Grid>
            </Grid>
          </Paper>
        )}
      </Box>

      {/* Results Section */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            {showAiResult ? 'AI Selected Result' : `Showing ${ingredients.length} of ${totalIngredients} ingredients`}
          </Typography>
          
          {/* Page Size Selector */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2">Items per page:</Typography>
            <Select
              value={pageSize}
              onChange={(e) => setPageSize(e.target.value as number)}
              size="small"
              sx={{ minWidth: 80 }}
            >
              <MenuItem value={25}>25</MenuItem>
              <MenuItem value={50}>50</MenuItem>
              <MenuItem value={100}>100</MenuItem>
            </Select>
          </Box>
        </Box>

        {/* Loading State */}
        {ingredientsLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Ingredients Grid */}
        {!ingredientsLoading && !showAiResult && (
          <Grid container spacing={2}>
            {ingredients.map((ingredient) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={ingredient.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="h6" component="div" sx={{ fontSize: '1rem', lineHeight: 1.2 }}>
                        {ingredient.name}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => addIngredientMapping(ingredient.id, ingredient.name)}
                          title={`Map "${searchTerm}" to ${ingredient.name}`}
                        >
                          <LinkIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => openIngredientDialog(ingredient)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => deleteIngredient(ingredient.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                    
                    {ingredient.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {ingredient.description}
                      </Typography>
                    )}

                    <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                      {ingredient.category && (
                        <Chip label={ingredient.category} size="small" color="primary" />
                      )}
                      {ingredient.aisle && (
                        <Chip label={ingredient.aisle} size="small" color="secondary" />
                      )}
                      <Chip 
                        label={ingredient.isActive ? 'Active' : 'Inactive'} 
                        size="small" 
                        color={ingredient.isActive ? 'success' : 'default'} 
                      />
                    </Box>

                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Serving:</strong> {ingredient.servingSize}
                    </Typography>

                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          <strong>Calories:</strong> {formatNutritionValue(ingredient.calories)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          <strong>Protein:</strong> {formatNutritionValue(ingredient.protein)}g
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          <strong>Carbs:</strong> {formatNutritionValue(ingredient.carbs)}g
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          <strong>Fat:</strong> {formatNutritionValue(ingredient.fat)}g
                        </Typography>
                      </Grid>
                      {shouldShowNutritionValue(ingredient.fiber) && (
                        <Grid item xs={6}>
                          <Typography variant="body2">
                            <strong>Fiber:</strong> {formatNutritionValue(ingredient.fiber)}g
                          </Typography>
                        </Grid>
                      )}
                      {shouldShowNutritionValue(ingredient.sugar) && (
                        <Grid item xs={6}>
                          <Typography variant="body2">
                            <strong>Sugar:</strong> {formatNutritionValue(ingredient.sugar)}g
                          </Typography>
                        </Grid>
                      )}
                      {shouldShowNutritionValue(ingredient.sodium) && (
                        <Grid item xs={6}>
                          <Typography variant="body2">
                            <strong>Sodium:</strong> {formatNutritionValue(ingredient.sodium)}mg
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Pagination */}
        {!ingredientsLoading && !showAiResult && totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={(_, page) => setCurrentPage(page)}
              color="primary"
            />
          </Box>
        )}
      </Box>
    </Box>
  );
} 