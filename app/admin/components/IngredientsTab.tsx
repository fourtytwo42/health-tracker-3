'use client';

import React from 'react';
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
  MenuItem
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

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
  setCsvImportDialogOpen: (open: boolean) => void;
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
  setCurrentPage,
  setCsvImportDialogOpen
}: IngredientsTabProps) {
  
  // Helper function to check if a nutrition value should be displayed
  const shouldShowNutritionValue = (value: number | null | undefined): boolean => {
    return value !== null && value !== undefined && value > 0;
  };

  // Helper function to format nutrition value
  const formatNutritionValue = (value: number | null | undefined, defaultValue: number = 0): number => {
    return value !== null && value !== undefined ? value : defaultValue;
  };
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Ingredients Management</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => setCsvImportDialogOpen(true)}
          >
            Import CSV
          </Button>
          <Button
            variant="outlined"
            onClick={async () => {
              try {
                const response = await fetch('/api/ingredients/example', {
                  headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
                });
                if (response.ok) {
                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'ingredients_example.csv';
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(url);
                  document.body.removeChild(a);
                }
              } catch (error) {
                console.error('Error downloading example CSV:', error);
              }
            }}
          >
            Download Example
          </Button>
          <Button
            variant="outlined"
            onClick={async () => {
              try {
                const response = await fetch('/api/ingredients/export', {
                  headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
                });
                if (response.ok) {
                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'ingredients.csv';
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(url);
                  document.body.removeChild(a);
                }
              } catch (error) {
                console.error('Error exporting ingredients:', error);
              }
            }}
          >
            Export All
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={async () => {
              if (!confirm('Are you sure you want to delete ALL ingredients? This action cannot be undone.')) return;
              
              try {
                const response = await fetch('/api/ingredients/delete-all', {
                  method: 'DELETE',
                  headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
                });
                if (response.ok) {
                  await loadIngredients(1, pageSize);
                } else {
                  const error = await response.json();
                  console.error(error.error || 'Failed to delete all ingredients');
                }
              } catch (error) {
                console.error('Failed to delete all ingredients');
              }
            }}
          >
            Delete All
          </Button>
          <Button
            variant="contained"
            onClick={() => openIngredientDialog()}
          >
            Add Ingredient
          </Button>
        </Box>
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

        {/* Filter Toggle */}
        <Box sx={{ mb: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setShowFilters(!showFilters)}
            size="small"
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </Box>

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
                  }}
                  size="small"
                >
                  Clear All Filters
                </Button>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Results Count */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Showing {ingredients.length} of {totalIngredients} ingredients
          </Typography>
        </Box>
      </Box>

      {ingredientsLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={2}>
          {ingredients.map((ingredient) => (
            <Grid item xs={12} md={6} lg={4} key={ingredient.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" component="div">
                      {ingredient.name}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => openIngredientDialog(ingredient)}
                        color="primary"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => deleteIngredient(ingredient.id)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                  
                  {ingredient.description && (
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {ingredient.description}
                    </Typography>
                  )}
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Serving:</strong> {ingredient.servingSize}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Calories:</strong> {formatNutritionValue(ingredient.calories)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Protein:</strong> {formatNutritionValue(ingredient.protein)}g
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Carbs:</strong> {formatNutritionValue(ingredient.carbs)}g
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Fat:</strong> {formatNutritionValue(ingredient.fat)}g
                    </Typography>
                  </Box>
                  
                  {(shouldShowNutritionValue(ingredient.fiber) || 
                    shouldShowNutritionValue(ingredient.sugar) || 
                    shouldShowNutritionValue(ingredient.sodium)) && (
                    <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                      {shouldShowNutritionValue(ingredient.fiber) && (
                        <Typography variant="body2" color="text.secondary">
                          <strong>Fiber:</strong> {ingredient.fiber}g
                        </Typography>
                      )}
                      {shouldShowNutritionValue(ingredient.sugar) && (
                        <Typography variant="body2" color="text.secondary">
                          <strong>Sugar:</strong> {ingredient.sugar}g
                        </Typography>
                      )}
                      {shouldShowNutritionValue(ingredient.sodium) && (
                        <Typography variant="body2" color="text.secondary">
                          <strong>Sodium:</strong> {ingredient.sodium}mg
                        </Typography>
                      )}
                    </Box>
                  )}
                  
                  {(shouldShowNutritionValue(ingredient.cholesterol) || 
                    shouldShowNutritionValue(ingredient.saturatedFat) || 
                    shouldShowNutritionValue(ingredient.monounsaturatedFat) || 
                    shouldShowNutritionValue(ingredient.polyunsaturatedFat)) && (
                    <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                      {shouldShowNutritionValue(ingredient.cholesterol) && (
                        <Typography variant="body2" color="text.secondary">
                          <strong>Cholesterol:</strong> {ingredient.cholesterol}mg
                        </Typography>
                      )}
                      {shouldShowNutritionValue(ingredient.saturatedFat) && (
                        <Typography variant="body2" color="text.secondary">
                          <strong>Sat Fat:</strong> {ingredient.saturatedFat}g
                        </Typography>
                      )}
                      {shouldShowNutritionValue(ingredient.monounsaturatedFat) && (
                        <Typography variant="body2" color="text.secondary">
                          <strong>Mono Fat:</strong> {ingredient.monounsaturatedFat}g
                        </Typography>
                      )}
                      {shouldShowNutritionValue(ingredient.polyunsaturatedFat) && (
                        <Typography variant="body2" color="text.secondary">
                          <strong>Poly Fat:</strong> {ingredient.polyunsaturatedFat}g
                        </Typography>
                      )}
                    </Box>
                  )}
                  
                  {(shouldShowNutritionValue(ingredient.netCarbs) || 
                    shouldShowNutritionValue(ingredient.glycemicIndex) || 
                    shouldShowNutritionValue(ingredient.glycemicLoad)) && (
                    <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                      {shouldShowNutritionValue(ingredient.netCarbs) && (
                        <Typography variant="body2" color="text.secondary">
                          <strong>Net Carbs:</strong> {ingredient.netCarbs}g
                        </Typography>
                      )}
                      {shouldShowNutritionValue(ingredient.glycemicIndex) && (
                        <Typography variant="body2" color="text.secondary">
                          <strong>GI:</strong> {ingredient.glycemicIndex}
                        </Typography>
                      )}
                      {shouldShowNutritionValue(ingredient.glycemicLoad) && (
                        <Typography variant="body2" color="text.secondary">
                          <strong>GL:</strong> {ingredient.glycemicLoad}
                        </Typography>
                      )}
                    </Box>
                  )}
                  
                  {(ingredient.dietaryFlags || ingredient.allergens) && (
                    <Box sx={{ mb: 1 }}>
                      {ingredient.dietaryFlags && (
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          <strong>Dietary:</strong> {ingredient.dietaryFlags}
                        </Typography>
                      )}
                      {ingredient.allergens && (
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          <strong>Allergens:</strong> {ingredient.allergens}
                        </Typography>
                      )}
                    </Box>
                  )}
                  
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    {ingredient.category && (
                      <Chip 
                        label={ingredient.category} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                    )}
                    {ingredient.aisle && (
                      <Chip 
                        label={ingredient.aisle} 
                        size="small" 
                        color="secondary" 
                        variant="outlined"
                      />
                    )}
                    <Chip 
                      label={ingredient.isActive ? 'Active' : 'Inactive'} 
                      size="small" 
                      color={ingredient.isActive ? 'success' : 'default'}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 2 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(event: any, page: number) => {
              setCurrentPage(page);
              loadIngredients(page, pageSize);
            }}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}
      
      {/* Page Size Selector */}
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mb: 2 }}>
        <Typography variant="body2">Items per page:</Typography>
        <Select
          value={pageSize}
          onChange={(e: any) => {
            const newSize = e.target.value as number;
            setPageSize(newSize);
            setCurrentPage(1);
            loadIngredients(1, newSize);
          }}
          size="small"
        >
          <MenuItem value={25}>25</MenuItem>
          <MenuItem value={50}>50</MenuItem>
          <MenuItem value={100}>100</MenuItem>
          <MenuItem value={200}>200</MenuItem>
        </Select>
        <Typography variant="body2" color="text.secondary">
          Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalIngredients)} of {totalIngredients} ingredients
        </Typography>
      </Box>
    </Box>
  );
} 