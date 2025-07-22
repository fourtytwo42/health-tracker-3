'use client';

import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Chip,
  useTheme,
  useMediaQuery,
  Fade,
  Slide,
  Zoom
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Refresh as RefreshIcon,
  Print as PrintIcon,
  Delete as DeleteIcon,
  Restaurant as RestaurantIcon,
  Timer as TimerIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const [expandedInstructions, setExpandedInstructions] = useState(false);
  const [expandedIngredients, setExpandedIngredients] = useState(false);
  const [expandedNutrition, setExpandedNutrition] = useState(false);
  const [nutritionWasOnLeft, setNutritionWasOnLeft] = useState(false);
  const [nutritionShouldStayOnRight, setNutritionShouldStayOnRight] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Responsive sizing based on viewport
  const cardAspectRatio = isMobile ? 1.2 : isTablet ? 1.4 : 1.6; // width/height ratio
  const cardHeight = isMobile ? '280px' : isTablet ? '320px' : '360px';
  const cardWidth = `calc(${cardHeight} * ${cardAspectRatio})`;

  // Responsive typography scaling
  const getResponsiveFontSize = (baseSize: number, mobileRatio = 0.8, tabletRatio = 0.9) => {
    if (isMobile) return `${baseSize * mobileRatio}rem`;
    if (isTablet) return `${baseSize * tabletRatio}rem`;
    return `${baseSize}rem`;
  };

  // Responsive spacing
  const getResponsiveSpacing = (baseSpacing: number) => {
    if (isMobile) return baseSpacing * 0.6;
    if (isTablet) return baseSpacing * 0.8;
    return baseSpacing;
  };

  const toggleInstructionsExpansion = useCallback(() => {
    const newExpandedInstructions = !expandedInstructions;
    setExpandedInstructions(newExpandedInstructions);
    
    // If we're expanding instructions, collapse others
    if (newExpandedInstructions) {
      setExpandedIngredients(false);
      setExpandedNutrition(false);
      setNutritionWasOnLeft(false);
      setNutritionShouldStayOnRight(false);
    }
    // If we're collapsing instructions, don't collapse others (let them stay on right)
  }, [expandedInstructions]);

  const toggleIngredientsExpansion = useCallback(() => {
    // Check if Nutrition is currently on the left side
    const nutritionOnLeft = !expandedNutrition && !expandedInstructions;
    setNutritionWasOnLeft(nutritionOnLeft);
    
    setExpandedIngredients(!expandedIngredients);
    
    // If we're expanding ingredients
    if (!expandedIngredients) {
      // Only move Nutrition to right if it was on the left
      if (nutritionOnLeft) {
        setExpandedNutrition(true);
        setNutritionShouldStayOnRight(true);
      }
    } else {
      // If we're collapsing ingredients and Instructions is on right, also collapse Instructions
      if (expandedInstructions) {
        setExpandedInstructions(false);
      }
    }
  }, [expandedIngredients, expandedNutrition, expandedInstructions]);

  const toggleNutritionExpansion = useCallback(() => {
    setExpandedNutrition(!expandedNutrition);
    
    // If we're collapsing nutrition and all 3 are on right, collapse all
    if (expandedNutrition && expandedInstructions && expandedIngredients) {
      setExpandedInstructions(false);
      setExpandedIngredients(false);
      setNutritionShouldStayOnRight(false);
    }
  }, [expandedNutrition, expandedInstructions, expandedIngredients]);

  const formatIngredientAmount = (amount: number, unit: string, ingredientName: string): string => {
    const scaledAmount = amount * (recipe.scalingFactor || 1);
    
    // Handle special cases
    if (ingredientName.toLowerCase().includes('egg')) {
      return `${Math.round(scaledAmount)} egg${Math.round(scaledAmount) !== 1 ? 's' : ''}`;
    }

    // Convert grams to user-friendly units
    if (unit.toLowerCase() === 'g' || unit.toLowerCase() === 'gram') {
      if (scaledAmount >= 1000) {
        return `${Math.round(scaledAmount / 1000)} lb`;
      } else if (scaledAmount >= 28.35) {
        return `${Math.round(scaledAmount / 28.35)} oz`;
      } else if (scaledAmount >= 15) {
        return `${Math.round(scaledAmount / 15)} tbsp`;
      } else if (scaledAmount >= 5) {
        return `${Math.round(scaledAmount / 5)} tsp`;
      } else {
        return `${Math.round(scaledAmount)} g`;
      }
    }

    // Convert ml to cups/tablespoons
    if (unit.toLowerCase() === 'ml' || unit.toLowerCase() === 'milliliter') {
      if (scaledAmount >= 240) {
        return `${Math.round(scaledAmount / 240)} cup${Math.round(scaledAmount / 240) !== 1 ? 's' : ''}`;
      } else if (scaledAmount >= 15) {
        return `${Math.round(scaledAmount / 15)} tbsp`;
      } else if (scaledAmount >= 5) {
        return `${Math.round(scaledAmount / 5)} tsp`;
      } else {
        return `${Math.round(scaledAmount)} ml`;
      }
    }

    // Default case
    return `${Math.round(scaledAmount)} ${unit}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Box
        sx={{
          width: cardWidth,
          height: cardHeight,
          position: 'relative',
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: isHovered ? theme.shadows[8] : theme.shadows[4],
          transition: 'all 0.3s ease',
          cursor: 'pointer',
        }}
      >
        {/* Background Image */}
        <Box
          component="img"
          src={recipe.photoUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNjY2NjY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iI2NjYyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='}
          alt={recipe.name}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 1,
          }}
        />

        {/* Overlay Gradient */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%)',
            zIndex: 2,
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
            zIndex: 50,
            pointerEvents: 'auto'
          }}
        >
          {/* Instructions - On left only when not expanded AND not shown on right */}
          {!expandedInstructions && !(expandedInstructions) && (
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
                },
                pointerEvents: 'auto'
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
                  transform: 'rotate(-90deg)',
                  pointerEvents: 'none'
                }}
              >
                Instructions
              </Typography>
            </Box>
          )}

          {/* Ingredients - On left only when not expanded AND not shown on right */}
          {!expandedIngredients && !(expandedIngredients || expandedInstructions) && (
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
                },
                pointerEvents: 'auto'
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
                  transform: 'rotate(-90deg)',
                  pointerEvents: 'none'
                }}
              >
                Ingredients
              </Typography>
            </Box>
          )}

          {/* Nutrition - On left only when not expanded AND not shown on right */}
          {!expandedNutrition && !(expandedNutrition || expandedInstructions || expandedIngredients) && (
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
                },
                pointerEvents: 'auto'
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
                  transform: 'rotate(-90deg)',
                  pointerEvents: 'none'
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
              zIndex: 40,
              pointerEvents: 'auto'
            }}
          >
            {/* Instructions - On right when instructions is active */}
            {expandedInstructions && (
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
                  },
                  pointerEvents: 'auto'
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
                    transform: 'rotate(-90deg)',
                    pointerEvents: 'none'
                  }}
                >
                  Instructions
                </Typography>
              </Box>
            )}

            {/* Ingredients - On right when ingredients is active OR when instructions is active */}
            {(expandedIngredients || expandedInstructions) && (
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
                  },
                  pointerEvents: 'auto'
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
                    transform: 'rotate(-90deg)',
                    pointerEvents: 'none'
                  }}
                >
                  Ingredients
                </Typography>
              </Box>
            )}

            {/* Nutrition - On right when nutrition is active OR when instructions is active OR when ingredients is active OR when it should stay on right */}
            {(expandedNutrition || expandedInstructions || expandedIngredients || nutritionShouldStayOnRight) && (
              <Box
                sx={{
                  width: '40px',
                  height: '100%',
                  background: expandedNutrition ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'rgba(0, 0, 0, 0.8)'
                  },
                  pointerEvents: 'auto'
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
                    transform: 'rotate(-90deg)',
                    pointerEvents: 'none'
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
            zIndex: 10,
            pointerEvents: 'none'
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
            display: expandedInstructions && !expandedIngredients && !expandedNutrition ? 'flex' : 'none',
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
              sx={{
                fontSize: getResponsiveFontSize(1.1),
                fontWeight: 'bold',
                color: 'white',
                textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                mb: 2,
              }}
            >
              Instructions
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
              <Typography
                variant="body1"
                sx={{
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.2,
                  fontSize: getResponsiveFontSize(0.85),
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
            display: expandedIngredients && !expandedInstructions && !expandedNutrition ? 'flex' : 'none',
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
            <Typography
              variant="h6"
              sx={{
                fontSize: getResponsiveFontSize(1.1),
                fontWeight: 'bold',
                color: 'white',
                textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                mb: 2,
              }}
            >
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
                {recipe.ingredients.map((ingredient, index) => (
                  <Box key={ingredient.id} sx={{ 
                    p: 0.5, 
                    borderBottom: '1px solid rgba(255,255,255,0.3)',
                    '&:last-child': { borderBottom: 'none' }
                  }}>
                    <Typography sx={{ 
                      color: 'white', 
                      textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                      fontSize: getResponsiveFontSize(0.85),
                      fontWeight: 'bold'
                    }}>
                      {ingredient.notes || ingredient.ingredient.name}
                    </Typography>
                    <Typography sx={{ 
                      color: 'rgba(255,255,255,0.8)', 
                      fontSize: getResponsiveFontSize(0.75),
                      fontWeight: 'medium'
                    }}>
                      {formatIngredientAmount(ingredient.amount, ingredient.unit, ingredient.ingredient.name)}
                    </Typography>
                    {ingredient.notes && ingredient.notes !== ingredient.ingredient.name && (
                      <Typography sx={{ 
                        color: 'rgba(255,255,255,0.7)', 
                        fontSize: getResponsiveFontSize(0.7),
                        fontStyle: 'italic',
                        mt: 0.5
                      }}>
                        {ingredient.ingredient.name}
                      </Typography>
                    )}
                  </Box>
                ))}
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
            display: expandedNutrition && !expandedInstructions && !expandedIngredients ? 'flex' : 'none',
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
            <Typography
              variant="h6"
              sx={{
                fontSize: getResponsiveFontSize(1.1),
                fontWeight: 'bold',
                color: 'white',
                textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                mb: 2,
                textAlign: 'center',
              }}
            >
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
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: getResponsiveFontSize(0.8),
                    fontWeight: 'bold',
                    borderBottom: '2px solid white',
                    pb: 0.5,
                    mb: 1,
                    color: 'white',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.6)',
                  }}
                >
                  Serving Size: {recipe.servings} serving{recipe.servings > 1 ? 's' : ''}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: getResponsiveFontSize(1.1),
                    fontWeight: 'bold',
                    mb: 1,
                    color: 'white',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.6)',
                  }}
                >
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
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: getResponsiveFontSize(0.8),
                      fontWeight: 'bold',
                      color: 'white',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.6)',
                    }}
                  >
                    Calories
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: getResponsiveFontSize(0.8),
                      fontWeight: 'bold',
                      color: 'white',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.6)',
                    }}
                  >
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
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: getResponsiveFontSize(0.8),
                      color: 'white',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.6)',
                    }}
                  >
                    Total Fat
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: getResponsiveFontSize(0.8),
                      color: 'white',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.6)',
                    }}
                  >
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
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: getResponsiveFontSize(0.8),
                      color: 'white',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.6)',
                    }}
                  >
                    Total Carbohydrates
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: getResponsiveFontSize(0.8),
                      color: 'white',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.6)',
                    }}
                  >
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
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: getResponsiveFontSize(0.8),
                      color: 'white',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.6)',
                    }}
                  >
                    Protein
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: getResponsiveFontSize(0.8),
                      color: 'white',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.6)',
                    }}
                  >
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
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: getResponsiveFontSize(0.8),
                      color: 'white',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.6)',
                    }}
                  >
                    Fiber
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: getResponsiveFontSize(0.8),
                      color: 'white',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.6)',
                    }}
                  >
                    {Math.round(recipe.nutrition.fiberPerServing)}g
                  </Typography>
                </Box>
                
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  pb: 0.5
                }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: getResponsiveFontSize(0.8),
                      color: 'white',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.6)',
                    }}
                  >
                    Sugar
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: getResponsiveFontSize(0.8),
                      color: 'white',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.6)',
                    }}
                  >
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
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: 2,
              paddingLeft: 'calc(120px + 2rem)',
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
                  fontSize: getResponsiveFontSize(1.1),
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
                  fontSize: getResponsiveFontSize(0.85),
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
            top: getResponsiveSpacing(1),
            right: getResponsiveSpacing(1),
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            zIndex: 30
          }}
        >
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <IconButton
              onClick={() => onToggleFavorite(recipe.id)}
              sx={{
                width: isMobile ? '32px' : '40px',
                height: isMobile ? '32px' : '40px',
                backgroundColor: 'rgba(0,0,0,0.5)',
                color: recipe.isFavorite ? '#ff6b6b' : 'white',
                backdropFilter: 'blur(10px)',
                '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' },
              }}
            >
              {recipe.isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
            </IconButton>
          </motion.div>

          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Tooltip title="Regenerate Recipe">
              <IconButton
                onClick={() => onRegenerate(recipe.id)}
                sx={{
                  width: isMobile ? '32px' : '40px',
                  height: isMobile ? '32px' : '40px',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  backdropFilter: 'blur(10px)',
                  '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' },
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </motion.div>

          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Tooltip title="Print Recipe">
              <IconButton
                onClick={() => onPrint(recipe)}
                sx={{
                  width: isMobile ? '32px' : '40px',
                  height: isMobile ? '32px' : '40px',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  backdropFilter: 'blur(10px)',
                  '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' },
                }}
              >
                <PrintIcon />
              </IconButton>
            </Tooltip>
          </motion.div>

          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Tooltip title="Delete Recipe">
              <IconButton
                onClick={() => onDelete(recipe.id)}
                sx={{
                  width: isMobile ? '32px' : '40px',
                  height: isMobile ? '32px' : '40px',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  color: '#ff6b6b',
                  backdropFilter: 'blur(10px)',
                  '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' },
                }}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </motion.div>
        </Box>

        {/* Scaling Indicator */}
        {recipe.scalingFactor && recipe.scalingFactor !== 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Box
              sx={{
                position: 'absolute',
                bottom: getResponsiveSpacing(1),
                left: getResponsiveSpacing(1),
                right: getResponsiveSpacing(1),
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: 'white',
                padding: 1,
                borderRadius: 2,
                textAlign: 'center',
                fontSize: getResponsiveFontSize(0.7),
                backdropFilter: 'blur(10px)',
                zIndex: 4,
              }}
            >
              Recipe adjusted by {Math.round((recipe.scalingFactor - 1) * 100)}%
            </Box>
          </motion.div>
        )}
      </Box>
    </motion.div>
  );
} 