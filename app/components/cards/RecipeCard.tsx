'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  Restaurant as RestaurantIcon,
  SwapHoriz as SwapIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

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

interface Ingredient {
  id?: string;
  name: string;
  amount: number;
  unit: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  unavailable?: boolean;
  originalAmount?: number;
  scalingFactor?: number;
  category?: string;
  aisle?: string;
  servingSize?: string;
}

interface RecipeCardProps {
  id?: string;
  title: string;
  description?: string;
  mealType?: string;
  servings?: number;
  kcal?: number;
  protein?: number;
  netCarbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  ingredients?: Ingredient[];
  unavailableIngredients?: Array<{
    name: string;
    amount: number;
    unit: string;
    notes?: string;
  }>;
  instructions?: string[];
  prepTime?: number;
  cookTime?: number;
  totalTime?: number;
  difficulty?: string;
  cuisine?: string;
  tags?: string[];
  status?: string;
  aiGenerated?: boolean;
  originalQuery?: string;
  scalingApplied?: boolean;
  targetCalories?: number;
  onQuickReply?: (value: string) => void;
}

export default function RecipeCard({
  id: recipeId,
  title,
  description,
  mealType,
  servings,
  kcal,
  protein,
  netCarbs,
  fat,
  fiber,
  sugar,
  sodium,
  ingredients = [],
  unavailableIngredients = [],
  instructions = [],
  prepTime,
  cookTime,
  totalTime,
  difficulty,
  cuisine,
  tags,
  status,
  aiGenerated,
  originalQuery,
  scalingApplied,
  targetCalories,
  onQuickReply,
}: RecipeCardProps) {
  const [alternativeDialogOpen, setAlternativeDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [alternativeQuery, setAlternativeQuery] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleAlternativeClick = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
    setAlternativeQuery(`Find alternative for ${ingredient.name}`);
    setAlternativeDialogOpen(true);
  };

  const handleFindAlternative = () => {
    if (selectedIngredient && onQuickReply) {
      // Trigger the MCP tool through the chat system with proper format
      const toolCall = `find_ingredient_alternative ${selectedIngredient.name} ${alternativeQuery}`;
      onQuickReply(toolCall);
      setAlternativeDialogOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!recipeId) return;
    
    setDeleting(true);
    try {
      const response = await fetch(`/api/recipes/${recipeId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Trigger a refresh or callback to remove the recipe from the list
        if (onQuickReply) {
          onQuickReply('Recipe deleted successfully');
        }
        setDeleteDialogOpen(false);
      } else {
        const error = await response.json();
        console.error('Failed to delete recipe:', error);
        alert('Failed to delete recipe. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting recipe:', error);
      alert('Error deleting recipe. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const formatTime = (minutes?: number) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <>
      <Card sx={{ maxWidth: 600, mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <RestaurantIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" component="h3" sx={{ flexGrow: 1 }}>
              {title}
            </Typography>
            {recipeId && (
              <IconButton
                size="small"
                color="error"
                onClick={() => setDeleteDialogOpen(true)}
                sx={{ ml: 1 }}
              >
                <DeleteIcon />
              </IconButton>
            )}
            {aiGenerated && (
              <Chip 
                label="AI Generated" 
                size="small" 
                color="secondary" 
                sx={{ ml: 1 }}
              />
            )}
          </Box>

          {description && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {description}
            </Typography>
          )}

          {/* Recipe Meta Info */}
          <Box sx={{ mb: 2 }}>
            <Grid container spacing={1}>
              {mealType && (
                <Grid item>
                  <Chip label={mealType} size="small" variant="outlined" />
                </Grid>
              )}
              {servings && (
                <Grid item>
                  <Chip label={`${servings} servings`} size="small" variant="outlined" />
                </Grid>
              )}
              {cuisine && (
                <Grid item>
                  <Chip label={cuisine} size="small" variant="outlined" />
                </Grid>
              )}
              {difficulty && (
                <Grid item>
                  <Chip 
                    label={difficulty} 
                    size="small" 
                    color={difficulty === 'Easy' ? 'success' : difficulty === 'Medium' ? 'warning' : 'error'}
                  />
                </Grid>
              )}
            </Grid>
          </Box>

          {/* Nutrition Info */}
          {(kcal || protein || netCarbs || fat || fiber || sugar || sodium) && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Nutrition (per serving)
              </Typography>
              <Grid container spacing={1}>
                {kcal && (
                  <Grid item>
                    <Chip label={`${kcal} kcal`} size="small" variant="outlined" />
                  </Grid>
                )}
                {protein && (
                  <Grid item>
                    <Chip label={`${protein}g protein`} size="small" variant="outlined" />
                  </Grid>
                )}
                {netCarbs && (
                  <Grid item>
                    <Chip label={`${netCarbs}g carbs`} size="small" variant="outlined" />
                  </Grid>
                )}
                {fat && (
                  <Grid item>
                    <Chip label={`${fat}g fat`} size="small" variant="outlined" />
                  </Grid>
                )}
                {fiber && (
                  <Grid item>
                    <Chip label={`${fiber}g fiber`} size="small" variant="outlined" />
                  </Grid>
                )}
                {sugar && (
                  <Grid item>
                    <Chip label={`${sugar}g sugar`} size="small" variant="outlined" />
                  </Grid>
                )}
                {sodium && (
                  <Grid item>
                    <Chip label={`${sodium}mg sodium`} size="small" variant="outlined" />
                  </Grid>
                )}
              </Grid>
            </Box>
          )}

          {/* Recipe Details */}
          {(prepTime || cookTime || totalTime) && (
            <Box sx={{ mb: 2 }}>
              <Grid container spacing={2}>
                {prepTime && (
                  <Grid item>
                    <Typography variant="body2" color="text.secondary">
                      Prep: {formatTime(prepTime)}
                    </Typography>
                  </Grid>
                )}
                {cookTime && (
                  <Grid item>
                    <Typography variant="body2" color="text.secondary">
                      Cook: {formatTime(cookTime)}
                    </Typography>
                  </Grid>
                )}
                {totalTime && (
                  <Grid item>
                    <Typography variant="body2" color="text.secondary">
                      Total: {formatTime(totalTime)}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}

          {/* Ingredients */}
          {ingredients.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Ingredients
                {scalingApplied && (
                  <Chip 
                    label={`Scaled to ${targetCalories} cal`} 
                    size="small" 
                    color="info" 
                    variant="outlined"
                    sx={{ ml: 1 }}
                  />
                )}
              </Typography>
              <List dense>
                {ingredients.map((ingredient, index) => (
                  <ListItem key={index} sx={{ py: 0.5 }}>
                    <ListItemText 
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: ingredient.unavailable ? 'text.disabled' : 'text.primary',
                                fontStyle: ingredient.unavailable ? 'italic' : 'normal'
                              }}
                            >
                              {ingredient.amount} {ingredient.unit} {ingredient.name}
                              {ingredient.unavailable && (
                                <Chip 
                                  label="No nutrition data" 
                                  size="small" 
                                  color="warning" 
                                  variant="outlined"
                                  sx={{ ml: 1 }}
                                />
                              )}
                              {ingredient.scalingFactor && ingredient.scalingFactor !== 1 && (
                                <Chip 
                                  label={`${ingredient.scalingFactor.toFixed(1)}x`} 
                                  size="small" 
                                  color="info" 
                                  variant="outlined"
                                  sx={{ ml: 1 }}
                                />
                              )}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                              {convertToCups(ingredient.amount, ingredient.unit) && (
                                <Typography variant="body2" color="text.secondary">
                                  ({convertToCups(ingredient.amount, ingredient.unit)})
                                </Typography>
                              )}
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
                            </Box>
                            {ingredient.originalAmount && ingredient.originalAmount !== ingredient.amount && (
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                                Originally: {ingredient.originalAmount} {ingredient.unit}
                              </Typography>
                            )}
                          </Box>
                          {!ingredient.unavailable && (
                            <Button
                              size="small"
                              startIcon={<SwapIcon />}
                              onClick={() => handleAlternativeClick(ingredient)}
                              sx={{ minWidth: 'auto', p: 0.5 }}
                            >
                              Alternative
                            </Button>
                          )}
                        </Box>
                      }
                      secondary={
                        !ingredient.unavailable && (ingredient.calories || ingredient.protein || ingredient.carbs || ingredient.fat || ingredient.fiber || ingredient.sugar || ingredient.sodium) && (
                          <Box sx={{ mt: 0.5 }}>
                            <Grid container spacing={1}>
                              {ingredient.calories && (
                                <Grid item>
                                  <Chip label={`${ingredient.calories} cal`} size="small" variant="outlined" />
                                </Grid>
                              )}
                              {ingredient.protein && (
                                <Grid item>
                                  <Chip label={`${ingredient.protein}g protein`} size="small" variant="outlined" />
                                </Grid>
                              )}
                              {ingredient.carbs && (
                                <Grid item>
                                  <Chip label={`${ingredient.carbs}g carbs`} size="small" variant="outlined" />
                                </Grid>
                              )}
                              {ingredient.fat && (
                                <Grid item>
                                  <Chip label={`${ingredient.fat}g fat`} size="small" variant="outlined" />
                                </Grid>
                              )}
                              {ingredient.fiber && (
                                <Grid item>
                                  <Chip label={`${ingredient.fiber}g fiber`} size="small" variant="outlined" />
                                </Grid>
                              )}
                              {ingredient.sugar && (
                                <Grid item>
                                  <Chip label={`${ingredient.sugar}g sugar`} size="small" variant="outlined" />
                                </Grid>
                              )}
                              {ingredient.sodium && (
                                <Grid item>
                                  <Chip label={`${ingredient.sodium}mg sodium`} size="small" variant="outlined" />
                                </Grid>
                              )}
                            </Grid>
                          </Box>
                        )
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {/* Unavailable Ingredients */}
          {unavailableIngredients.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Unavailable Ingredients
              </Typography>
              <List dense>
                {unavailableIngredients.map((ingredient, index) => (
                  <ListItem key={index} sx={{ py: 0.5 }}>
                    <ListItemText 
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: 'text.disabled',
                                fontStyle: 'italic'
                              }}
                            >
                              {ingredient.amount} {ingredient.unit} {ingredient.name}
                              {ingredient.notes && (
                                <Chip 
                                  label={`(${ingredient.notes})`} 
                                  size="small" 
                                  color="warning" 
                                  variant="outlined"
                                  sx={{ ml: 1 }}
                                />
                              )}
                            </Typography>
                            {convertToCups(ingredient.amount, ingredient.unit) && (
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                ({convertToCups(ingredient.amount, ingredient.unit)})
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {/* Instructions */}
          {instructions.length > 0 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Instructions
              </Typography>
              <List dense>
                {instructions.map((instruction, index) => (
                  <ListItem key={index} sx={{ py: 0.5 }}>
                    <ListItemText 
                      primary={`${index + 1}. ${instruction}`}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {/* Tags */}
          {tags && tags.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={1}>
                {tags.map((tag, index) => (
                  <Grid item key={index}>
                    <Chip label={tag} size="small" variant="outlined" />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Alternative Ingredient Dialog */}
      <Dialog open={alternativeDialogOpen} onClose={() => setAlternativeDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Find Alternative for {selectedIngredient?.name}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            What kind of alternative are you looking for? (e.g., "lower calorie", "gluten-free", "vegan")
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Alternative requirements"
            value={alternativeQuery}
            onChange={(e) => setAlternativeQuery(e.target.value)}
            placeholder="e.g., Find a lower calorie alternative for chicken breast"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAlternativeDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleFindAlternative} variant="contained">
            Find Alternative
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Delete Recipe
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Are you sure you want to delete "{title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button 
            onClick={handleDelete} 
            variant="contained" 
            color="error"
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
} 