'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Print as PrintIcon,
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
  scalingFactor?: number;
}

interface RecipeCardProps {
  recipe: Recipe;
  onToggleFavorite: (recipeId: string) => void;
  onRegenerate: (recipeId: string) => void;
  onDelete: (recipeId: string) => void;
  onPrint: (recipe: Recipe) => void;
  onReplaceIngredient: (recipeId: string, ingredientId: string, newIngredientId: string) => void;
  onAdjustNutrition: (recipeId: string) => void;
  onIngredientPreference: (ingredientId: string, preference: 'like' | 'dislike' | 'allergy' | 'intolerance') => void;
}

export default function RecipeCard({ 
  recipe, 
  onToggleFavorite, 
  onRegenerate, 
  onDelete, 
  onPrint,
}: RecipeCardProps) {
  const [expandedNutrition, setExpandedNutrition] = useState(false);
  const [expandedIngredients, setExpandedIngredients] = useState(false);
  const [expandedInstructions, setExpandedInstructions] = useState(false);

  const toggleNutritionExpansion = () => {
    setExpandedNutrition(!expandedNutrition);
    setExpandedIngredients(false);
    setExpandedInstructions(false);
  };

  const toggleIngredientsExpansion = () => {
    setExpandedIngredients(!expandedIngredients);
    setExpandedNutrition(false);
    setExpandedInstructions(false);
  };

  const toggleInstructionsExpansion = () => {
    setExpandedInstructions(!expandedInstructions);
    setExpandedNutrition(false);
    setExpandedIngredients(false);
  };

  return (
    <Box sx={{ 
      width: '710px',
      flexShrink: 0
    }}>
      <Box sx={{ 
        position: 'relative',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        margin: '8px'
      }}>
        {/* Image and Navigation Section */}
        <Box sx={{ position: 'relative' }}>
          <Box sx={{ 
            position: 'relative',
            lineHeight: 0,
            fontSize: 0
          }}>
            {recipe.photoUrl ? (
              <img
                src={recipe.photoUrl}
                alt={recipe.name}
                style={{
                  width: '710px',
                  height: '420px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  display: 'block'
                }}
              />
            ) : (
              <Box
                sx={{
                  width: '710px',
                  height: '420px',
                  backgroundColor: '#808080',
                  borderRadius: '8px',
                  display: 'block'
                }}
              />
            )}
            
            {/* Book-style Navigation - Left Side */}
            <Box
              sx={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                display: 'flex',
                flexDirection: 'row',
                zIndex: 25
              }}
            >
              {/* Instructions - Always on left */}
              <Box
                sx={{
                  width: '40px',
                  height: '100%',
                  background: expandedInstructions ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'rgba(0, 0, 0, 0.8)'
                  }
                }}
                onClick={toggleInstructionsExpansion}
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

              {/* Ingredients - On left when neither ingredients nor nutrition is active */}
              {(!expandedIngredients && !expandedNutrition) && (
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
                  onClick={toggleIngredientsExpansion}
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

              {/* Nutrition - On left when neither ingredients nor nutrition is active */}
              {(!expandedIngredients && !expandedNutrition) && (
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
                  onClick={toggleNutritionExpansion}
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
            {(expandedNutrition || expandedIngredients || expandedInstructions) && (
              <Box
                sx={{
                  position: 'absolute',
                  right: 0,
                  top: 0,
                  bottom: 0,
                  display: 'flex',
                  flexDirection: 'row',
                  zIndex: 20
                }}
              >
                {/* Ingredients - On right when ingredients or nutrition is active */}
                {(expandedIngredients || expandedNutrition) && (
                  <Box
                    sx={{
                      width: '40px',
                      height: '100%',
                      background: expandedIngredients ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.7)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        background: 'rgba(0, 0, 0, 0.8)'
                      }
                    }}
                    onClick={toggleIngredientsExpansion}
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

                {/* Nutrition - On right when nutrition is active */}
                {expandedNutrition && (
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
                    onClick={toggleNutritionExpansion}
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
                background: (expandedNutrition || expandedIngredients || expandedInstructions) ? 'rgba(0, 0, 0, 0.4)' : 'transparent',
                transition: 'background 0.3s ease',
                borderRadius: '8px',
                zIndex: 15
              }}
            />

            {/* Instructions Content Overlay */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: expandedInstructions ? 0 : '-100%',
                right: 0,
                bottom: 0,
                display: expandedInstructions ? 'flex' : 'none',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 2,
                paddingLeft: expandedInstructions ? 'calc(40px + 2rem)' : '0px',
                transition: 'left 0.3s ease',
                zIndex: 25
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
                <Typography 
                  variant="h6" 
                  gutterBottom 
                  sx={{ 
                    fontWeight: 'bold',
                    fontSize: '1.2rem',
                    mb: 0.5,
                    color: 'white',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.9)',
                    textAlign: 'center'
                  }}
                >
                  Instructions
                </Typography>
                <Box
                  sx={{
                    border: '2px solid rgba(255,255,255,0.7)',
                    borderRadius: 1,
                    overflow: 'auto',
                    width: '100%',
                    maxWidth: '100%',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    maxHeight: '220px',
                    alignSelf: 'center',
                    p: 1.5,
                    '&::-webkit-scrollbar': {
                      display: 'none'
                    },
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.2,
                      fontSize: '0.85rem',
                      color: 'white',
                      textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)'
                    }}
                    dangerouslySetInnerHTML={{
                      __html: recipe.instructions
                        .split('\n')
                        .map(line => `<div>${line}</div>`)
                        .join('')
                    }}
                  />
                </Box>
              </Box>
            </Box>

            {/* Ingredients Content Overlay */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: expandedIngredients ? 0 : '-100%',
                right: 0,
                bottom: 0,
                display: expandedIngredients ? 'flex' : 'none',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 2,
                paddingLeft: expandedIngredients ? 'calc(40px + 2rem)' : '0px',
                transition: 'left 0.3s ease',
                zIndex: 25
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
                <Typography variant="h6" gutterBottom sx={{ 
                  fontWeight: 'bold',
                  fontSize: '1.3rem',
                  mb: 0.5,
                  color: 'white',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.9)',
                  textAlign: 'center'
                }}>
                  Ingredients
                </Typography>
                
                <Box sx={{ 
                  border: '2px solid rgba(255,255,255,0.7)',
                  borderRadius: 1,
                  overflow: 'auto',
                  width: '100%',
                  maxWidth: '100%',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  maxHeight: '220px',
                  alignSelf: 'center',
                  p: 1.5,
                  '&::-webkit-scrollbar': {
                    display: 'none'
                  },
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none'
                }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {recipe.ingredients.map((ingredient, index) => {
                      const scaledAmount = ingredient.amount * (recipe.scalingFactor || 1);
                      const displayAmount = `${Math.round(scaledAmount)} ${ingredient.unit}`;
                      
                      return (
                        <Box key={ingredient.id} sx={{ 
                          p: 0.5, 
                          borderBottom: '1px solid rgba(255,255,255,0.3)',
                          '&:last-child': { borderBottom: 'none' }
                        }}>
                          <Typography sx={{ 
                            color: 'white', 
                            textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                            fontSize: '0.85rem',
                            fontWeight: 'bold'
                          }}>
                            {ingredient.notes || ingredient.ingredient.name}
                          </Typography>
                          <Typography sx={{ 
                            color: 'rgba(255,255,255,0.8)', 
                            fontSize: '0.75rem',
                            fontWeight: 'medium'
                          }}>
                            {displayAmount}
                          </Typography>
                          {ingredient.notes && ingredient.notes !== ingredient.ingredient.name && (
                            <Typography sx={{ 
                              color: 'rgba(255,255,255,0.7)', 
                              fontSize: '0.7rem',
                              fontStyle: 'italic',
                              mt: 0.5
                            }}>
                              {ingredient.ingredient.name}
                            </Typography>
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* Nutrition Content Overlay */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: expandedNutrition ? 0 : '-100%',
                right: 0,
                bottom: 0,
                display: expandedNutrition ? 'flex' : 'none',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 2,
                paddingLeft: expandedNutrition ? 'calc(40px + 2rem)' : '0px',
                transition: 'left 0.3s ease',
                zIndex: 25
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
                <Typography variant="h6" gutterBottom sx={{ 
                  fontWeight: 'bold',
                  fontSize: '1.3rem',
                  mb: 0.5,
                  color: 'white',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.9)',
                  textAlign: 'center'
                }}>
                  Nutrition Facts
                </Typography>
                
                <Box sx={{ 
                  border: '2px solid rgba(255,255,255,0.7)',
                  borderRadius: 1,
                  overflow: 'auto',
                  width: '100%',
                  maxWidth: '100%',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  maxHeight: '220px',
                  alignSelf: 'center',
                  p: 1.5,
                  '&::-webkit-scrollbar': {
                    display: 'none'
                  },
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none'
                }}>
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

            {/* Recipe Information Overlay - Shows when no columns are active */}
            {!expandedInstructions && !expandedIngredients && !expandedNutrition && (
              <Box
                sx={{
                  position: 'absolute',
                  left: '120px',
                  right: 0,
                  top: 0,
                  bottom: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: 2,
                  zIndex: 30,
                  pointerEvents: 'auto'
                }}
              >
                {/* Recipe Title */}
                <Box>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 'bold',
                      color: 'white',
                      textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                      fontSize: '1.1rem',
                      lineHeight: 1.2,
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      borderRadius: 2,
                      padding: 1.2,
                      backdropFilter: 'blur(5px)',
                    }}
                  >
                    {recipe.name}
                  </Typography>
                </Box>

                {/* Description */}
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'white',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                      lineHeight: 1.4,
                      fontSize: '0.85rem',
                      fontStyle: 'italic',
                      backgroundColor: 'rgba(0, 0, 0, 0.4)',
                      borderRadius: 2,
                      padding: 1.5,
                      backdropFilter: 'blur(5px)'
                    }}
                  >
                    {recipe.description || 'A delicious and nutritious recipe perfect for any meal.'}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Action Buttons */}
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                zIndex: 30
              }}
            >
              <IconButton
                onClick={() => onToggleFavorite(recipe.id)}
                sx={{
                  padding: 1,
                  fontSize: '1.5rem',
                  backdropFilter: 'blur(5px)',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  color: recipe.isFavorite ? '#ff6b6b' : 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  }
                }}
              >
                {recipe.isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
              </IconButton>

              <Tooltip title="Regenerate Recipe">
                <IconButton
                  onClick={() => onRegenerate(recipe.id)}
                  sx={{
                    padding: 1,
                    fontSize: '1.5rem',
                    backdropFilter: 'blur(5px)',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    }
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title="Print Recipe">
                <IconButton
                  onClick={() => onPrint(recipe)}
                  sx={{
                    padding: 1,
                    fontSize: '1.5rem',
                    backdropFilter: 'blur(5px)',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    }
                  }}
                >
                  <PrintIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title="Delete Recipe">
                <IconButton
                  onClick={() => onDelete(recipe.id)}
                  sx={{
                    padding: 1,
                    fontSize: '1.5rem',
                    backdropFilter: 'blur(5px)',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    color: '#ff6b6b',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    }
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>

        {/* Show adjustment indicator if recipe has been adjusted */}
        {recipe.scalingFactor && recipe.scalingFactor !== 1 && (
          <Alert severity="info" sx={{ 
            position: 'absolute',
            bottom: 8,
            left: 8,
            right: 8,
            zIndex: 30,
            fontSize: '0.8rem'
          }}>
            Recipe adjusted by {Math.round((recipe.scalingFactor - 1) * 100)}%
          </Alert>
        )}
      </Box>
    </Box>
  );
} 