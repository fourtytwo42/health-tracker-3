'use client';

import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  Collapse,
  Card,
  CardContent,
  Grid,
  Divider,
  Chip,
} from '@mui/material';
import { motion } from 'framer-motion';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import DeleteIcon from '@mui/icons-material/Delete';
import PrintIcon from '@mui/icons-material/Print';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useUserSettings } from '@/hooks/useUserSettings';
import { formatIngredientAmount } from '@/lib/utils/unitConversion';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

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

interface RecipeCardProps {
  recipe: Recipe;
  onToggleFavorite: (recipeId: string) => void;
  onDelete: (recipeId: string) => void;
  onPrint: (recipe: Recipe) => void;
}

/* ------------------------------------------------------------------ */
/*  Constants & Helpers                                               */
/* ------------------------------------------------------------------ */

const ALL_TABS = ['Instructions', 'Ingredients', 'Nutrition'] as const;
const TAB_W = 40;

const getMealTypeLetter = (mealType: string): string => {
  const type = mealType.toLowerCase();
  if (type.includes('breakfast')) return 'B';
  if (type.includes('lunch')) return 'L';
  if (type.includes('dinner')) return 'D';
  if (type.includes('snack')) return 'S';
  if (type.includes('dessert')) return 'D';
  return mealType.charAt(0).toUpperCase();
};

// clamp font size
const clampFont = (
  base: number,
  length: number,
  longThresh: number,
  veryLongThresh: number
): number =>
  length > veryLongThresh ? base * 0.8 : length > longThresh ? base * 0.9 : base;



/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function RecipeCard({
  recipe,
  onToggleFavorite,
  onDelete,
  onPrint,
}: RecipeCardProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const { settings } = useUserSettings();

  const [leftTabs, setLeftTabs] = useState<string[]>([...ALL_TABS]);
  const [rightTabs, setRightTabs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [expandedIngredients, setExpandedIngredients] = useState<Set<string>>(new Set());

  const cardHeight = isMobile ? 340 : isTablet ? 400 : 480;
  const cardWidth = cardHeight * 1.6;

  const fs = (b: number) =>
    `${b * (isMobile ? 0.8 : isTablet ? 0.9 : 1)}rem`;
  const spacing = (v: number) =>
    isMobile ? v * 0.6 : isTablet ? v * 0.8 : v;

  // Add null checks and default values
  const recipeName = recipe?.name || recipe?.title || 'Untitled Recipe';
  const recipeDescription = recipe?.description || '';
  const recipePhotoUrl = recipe?.photoUrl || recipe?.imageUrl;
  const recipeMealType = recipe?.mealType || 'UNKNOWN';
  const recipeServings = recipe?.servings || 1;
  const recipeNutrition = recipe?.nutrition || {
    caloriesPerServing: 0,
    proteinPerServing: 0,
    carbsPerServing: 0,
    fatPerServing: 0,
    fiberPerServing: 0,
    sugarPerServing: 0
  };

  // Show loading state if recipe data is not properly loaded
  if (!recipe) {
    return (
      <Box
        sx={{
          width: cardWidth,
          height: cardHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'grey.100',
          borderRadius: 3,
        }}
      >
        <Typography>Loading recipe...</Typography>
      </Box>
    );
  }

  const toggleIngredientDetails = useCallback((ingredientId: string) => {
    setExpandedIngredients(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ingredientId)) {
        newSet.delete(ingredientId);
      } else {
        newSet.add(ingredientId);
      }
      return newSet;
    });
  }, []);

  const handleTabClick = (tab: string) => {
    if (leftTabs.includes(tab)) {
      const idx = leftTabs.indexOf(tab);
      const moving = leftTabs.slice(idx);
      setLeftTabs(leftTabs.slice(0, idx));
      setRightTabs(prev => [...moving, ...prev]);
      setActiveTab(tab);
      return;
    }
    const idx = rightTabs.indexOf(tab);
    if (idx === rightTabs.length - 1) {
      setLeftTabs(prev => [...prev, ...rightTabs]);
      setRightTabs([]);
      setActiveTab(null);
      return;
    }
    const moveBack = rightTabs.slice(0, idx + 1);
    const newRight = rightTabs.slice(idx + 1);
    setLeftTabs(prev => [...prev, ...moveBack]);
    setRightTabs(newRight);
    setActiveTab(newRight.length ? newRight[newRight.length - 1] : null);
  };

  const isExpanded = activeTab !== null;
  const leftOffset = leftTabs.length * TAB_W;
  const rightOffset = rightTabs.length * TAB_W;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      style={{ width: cardWidth, height: cardHeight }}
    >
      <Box
        sx={{
          width: '100%',
          height: '100%',
          position: 'relative',
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: isHovered ? theme.shadows[8] : theme.shadows[4],
          transition: 'all 0.3s ease',
          cursor: 'pointer',
        }}
      >
        {/* Background */}
        <Box
          component="img"
          src={
            recipePhotoUrl ||
            'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNjY2NjY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iI2NjYyIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='
          }
          alt={recipeName}
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 1,
          }}
        />

        {/* Shade when expanded */}
        {isExpanded && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.4)',
              borderRadius: 3,
              zIndex: 2,
              pointerEvents: 'none',
            }}
          />
        )}

        {/* ---------- Tabs / Sliders ------------ */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            display: 'flex',
            zIndex: 50,
          }}
        >
          {leftTabs.map(tab => (
            <Box
              key={tab}
              sx={{
                width: TAB_W,
                height: '100%',
                background: 'rgba(0,0,0,0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                '&:hover': { background: 'rgba(0,0,0,0.8)' },
              }}
              onClick={() => handleTabClick(tab)}
            >
              <Typography
                sx={{
                  transform: 'rotate(-90deg)',
                  fontSize: '1.1rem',
                  color: '#fff',
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                }}
              >
                {tab}
              </Typography>
            </Box>
          ))}
        </Box>

        {rightTabs.length > 0 && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              right: 0,
              zIndex: 40,
            }}
          >
            {rightTabs.map((tab, idx) => (
              <Box
                key={tab}
                sx={{
                  position: 'absolute',
                  top: 0,
                  right: (rightTabs.length - 1 - idx) * TAB_W,
                  width: TAB_W,
                  height: '100%',
                  background: 'rgba(0,0,0,0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  '&:hover': { background: 'rgba(0,0,0,0.8)' },
                }}
                onClick={() => handleTabClick(tab)}
              >
                <Typography
                  sx={{
                    transform: 'rotate(90deg)',
                    fontSize: '1.1rem',
                    color: '#fff',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                  }}
                >
                  {tab}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        {/* --------------- Overlays -------------- */}
        {ALL_TABS.map(tabName => (
          <Box
            key={tabName}
            sx={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: leftOffset,
              right: rightOffset,
              display: activeTab === tabName ? 'flex' : 'none',
              alignItems: 'center',
              justifyContent: 'center',
              p: 2,
              zIndex: 25,
            }}
          >
            {/* Instructions */}
            {tabName === 'Instructions' && (
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  p: 2,
                }}
              >
                <Typography
                  sx={{
                    fontSize: fs(1.1),
                    fontWeight: 'bold',
                    color: '#fff',
                    mb: 2,
                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                  }}
                >
                  Instructions
                </Typography>
                <Box
                  sx={{
                    flex: 1,
                    width: '100%',
                    p: 1.5,
                    overflow: 'auto',
                    border: '2px solid rgba(255,255,255,0.7)',
                    borderRadius: 1,
                    background: 'rgba(255,255,255,0.1)',
                    '&::-webkit-scrollbar': { display: 'none' },
                  }}
                >
                  {recipe.instructions
                    ? recipe.instructions
                        .replace(/\. ?(Step)/g, '.\n\n$1')
                        .split(/\n+/)
                        .map((ln, i) => (
                          <Typography
                            key={i}
                            sx={{
                              fontSize: fs(0.85),
                              color: '#fff',
                              whiteSpace: 'pre-wrap',
                              lineHeight: 1.3,
                              textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                              mt: i ? 1 : 0,
                            }}
                          >
                            {ln.trim()}
                          </Typography>
                        ))
                    : (
                        <Typography
                          sx={{
                            fontSize: fs(0.85),
                            color: '#fff',
                            textAlign: 'center',
                            fontStyle: 'italic',
                          }}
                        >
                          No instructions available
                        </Typography>
                      )}
                </Box>
              </Box>
            )}

            {/* Ingredients */}
            {tabName === 'Ingredients' && (
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  p: 2,
                }}
              >
                <Typography
                  sx={{
                    fontSize: fs(1.1),
                    fontWeight: 'bold',
                    color: '#fff',
                    mb: 2,
                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                  }}
                >
                  Ingredients
                </Typography>
                <Box
                  sx={{
                    flex: 1,
                    width: '100%',
                    p: 1.5,
                    overflow: 'auto',
                    border: '2px solid rgba(255,255,255,0.7)',
                    borderRadius: 1,
                    background: 'rgba(255,255,255,0.1)',
                    '&::-webkit-scrollbar': { display: 'none' },
                  }}
                >
                  {(recipe.ingredients || []).map(ing => (
                    <Box key={ing.id}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          p: 0.5,
                          borderBottom: '1px solid rgba(255,255,255,0.3)',
                          cursor: 'pointer',
                          '&:hover': {
                            background: 'rgba(255,255,255,0.1)',
                          },
                        }}
                        onClick={() => toggleIngredientDetails(ing.id)}
                      >
                        <Typography
                          sx={{
                            color: '#fff',
                            fontWeight: 'bold',
                            fontSize: fs(0.85),
                          }}
                        >
                          {ing.notes || (ing.ingredient?.name || ing.name || 'Unknown ingredient')}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography
                            sx={{
                              color: 'rgba(255,255,255,0.8)',
                              fontSize: fs(0.85),
                            }}
                          >
                            {formatIngredientAmount(
                              ing.amount,
                              ing.unit,
                              ing.ingredient?.name || ing.name || 'Unknown ingredient',
                              settings.units.useMetricUnits
                            )}
                          </Typography>
                          <IconButton
                            size="small"
                            sx={{
                              color: 'rgba(255,255,255,0.7)',
                              p: 0.25,
                              '&:hover': { color: '#fff' },
                            }}
                          >
                            {expandedIngredients.has(ing.id) ? (
                              <ExpandLessIcon sx={{ fontSize: fs(0.8) }} />
                            ) : (
                              <ExpandMoreIcon sx={{ fontSize: fs(0.8) }} />
                            )}
                          </IconButton>
                        </Box>
                      </Box>
                      
                      <Collapse in={expandedIngredients.has(ing.id)}>
                        <Box
                          sx={{
                            p: 1,
                            background: 'rgba(0,0,0,0.3)',
                            borderBottom: '1px solid rgba(255,255,255,0.2)',
                          }}
                        >
                          <Grid container spacing={1}>
                            {/* Nutrition Info - Always shown */}
                            <Grid item xs={12}>
                              <Typography
                                sx={{
                                  color: '#fff',
                                  fontSize: fs(0.75),
                                  fontWeight: 'bold',
                                  mb: 0.5,
                                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                                }}
                              >
                                Nutrition:
                              </Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                <Chip
                                  label={`${Math.round(((ing.ingredient?.calories || ing.calories || 0) * ing.amount) / 100)} cal`}
                                  size="small"
                                  sx={{ 
                                    fontSize: fs(0.65), 
                                    height: '20px',
                                    color: '#fff',
                                    backgroundColor: 'rgba(255,255,255,0.2)',
                                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                                    '& .MuiChip-label': {
                                      color: '#fff',
                                      textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                                    }
                                  }}
                                />
                                <Chip
                                  label={`${Math.round(((ing.ingredient?.protein || ing.protein || 0) * ing.amount) / 100 * 10) / 10}g protein`}
                                  size="small"
                                  sx={{ 
                                    fontSize: fs(0.65), 
                                    height: '20px',
                                    color: '#fff',
                                    backgroundColor: 'rgba(255,255,255,0.2)',
                                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                                    '& .MuiChip-label': {
                                      color: '#fff',
                                      textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                                    }
                                  }}
                                />
                                <Chip
                                  label={`${Math.round(((ing.ingredient?.carbs || ing.carbs || 0) * ing.amount) / 100 * 10) / 10}g carbs`}
                                  size="small"
                                  sx={{ 
                                    fontSize: fs(0.65), 
                                    height: '20px',
                                    color: '#fff',
                                    backgroundColor: 'rgba(255,255,255,0.2)',
                                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                                    '& .MuiChip-label': {
                                      color: '#fff',
                                      textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                                    }
                                  }}
                                />
                                <Chip
                                  label={`${Math.round(((ing.ingredient?.fat || ing.fat || 0) * ing.amount) / 100 * 10) / 10}g fat`}
                                  size="small"
                                  sx={{ 
                                    fontSize: fs(0.65), 
                                    height: '20px',
                                    color: '#fff',
                                    backgroundColor: 'rgba(255,255,255,0.2)',
                                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                                    '& .MuiChip-label': {
                                      color: '#fff',
                                      textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                                    }
                                  }}
                                />
                                {(ing.ingredient?.fiber || ing.fiber || 0) > 0 && (
                                  <Chip
                                    label={`${Math.round(((ing.ingredient?.fiber || ing.fiber || 0) * ing.amount) / 100 * 10) / 10}g fiber`}
                                    size="small"
                                    sx={{ 
                                      fontSize: fs(0.65), 
                                      height: '20px',
                                      color: '#fff',
                                      backgroundColor: 'rgba(255,255,255,0.2)',
                                      textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                                      '& .MuiChip-label': {
                                        color: '#fff',
                                        textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                                      }
                                    }}
                                  />
                                )}
                              </Box>
                            </Grid>
                            
                            {/* Detailed Info - Only shown if setting is enabled */}
                            {settings.recipe.detailedIngredientInfo && (
                              <>
                                <Grid item xs={12}>
                                  <Divider sx={{ my: 0.5, borderColor: 'rgba(255,255,255,0.3)' }} />
                                </Grid>
                                <Grid item xs={6}>
                                  <Typography
                                    sx={{
                                      color: 'rgba(255,255,255,0.8)',
                                      fontSize: fs(0.7),
                                      fontWeight: 'bold',
                                    }}
                                  >
                                    Database Name:
                                  </Typography>
                                  <Typography
                                    sx={{
                                      color: '#fff',
                                      fontSize: fs(0.7),
                                    }}
                                  >
                                    {ing.ingredient?.name || ing.name || 'Unknown'}
                                  </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                  <Typography
                                    sx={{
                                      color: 'rgba(255,255,255,0.8)',
                                      fontSize: fs(0.7),
                                      fontWeight: 'bold',
                                    }}
                                  >
                                    Category:
                                  </Typography>
                                  <Typography
                                    sx={{
                                      color: '#fff',
                                      fontSize: fs(0.7),
                                    }}
                                  >
                                    {ing.ingredient?.category || 'N/A'}
                                  </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                  <Typography
                                    sx={{
                                      color: 'rgba(255,255,255,0.8)',
                                      fontSize: fs(0.7),
                                      fontWeight: 'bold',
                                    }}
                                  >
                                    Aisle:
                                  </Typography>
                                  <Typography
                                    sx={{
                                      color: '#fff',
                                      fontSize: fs(0.7),
                                    }}
                                  >
                                    {ing.ingredient?.aisle || 'N/A'}
                                  </Typography>
                                </Grid>
                                {ing.notes && (
                                  <Grid item xs={6}>
                                    <Typography
                                      sx={{
                                        color: 'rgba(255,255,255,0.8)',
                                        fontSize: fs(0.7),
                                        fontWeight: 'bold',
                                      }}
                                    >
                                      Notes:
                                    </Typography>
                                    <Typography
                                      sx={{
                                        color: '#fff',
                                        fontSize: fs(0.7),
                                      }}
                                    >
                                      {ing.notes}
                                    </Typography>
                                  </Grid>
                                )}
                              </>
                            )}
                          </Grid>
                        </Box>
                      </Collapse>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {/* Nutrition */}
            {tabName === 'Nutrition' && (
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  p: 2,
                }}
              >
                <Typography
                  sx={{
                    fontSize: fs(1.1),
                    fontWeight: 'bold',
                    color: '#fff',
                    mb: 0.5,
                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                  }}
                >
                  Nutrition Facts
                </Typography>
                <Typography sx={{ fontSize: fs(0.8), color: '#fff', mb: 2 }}>
                  {recipe.servings} serving{recipe.servings !== 1 ? 's' : ''}
                </Typography>
                <Box
                  sx={{
                    flex: 1,
                    width: '100%',
                    p: 1.5,
                    overflow: 'auto',
                    border: '2px solid rgba(255,255,255,0.7)',
                    borderRadius: 1,
                    background: 'rgba(255,255,255,0.1)',
                    '&::-webkit-scrollbar': { display: 'none' },
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid rgba(255,255,255,0.7)',
                      mb: 0.5,
                      pb: 0.5,
                    }}
                  >
                    <Typography sx={{ width: '40%' }} />
                    <Typography sx={{ width: '30%', fontSize: fs(0.75), color: '#fff' }}>
                      Per serv.
                    </Typography>
                    <Typography sx={{ width: '30%', fontSize: fs(0.75), color: '#fff' }}>
                      Total
                    </Typography>
                  </Box>
                  {[
                    ['Calories', recipe.nutrition.caloriesPerServing, recipe.nutrition.totalCalories],
                    ['Fat (g)', Math.round(recipe.nutrition.fatPerServing), Math.round(recipe.nutrition.totalFat)],
                    ['Carbs (g)', Math.round(recipe.nutrition.carbsPerServing), Math.round(recipe.nutrition.totalCarbs)],
                    ['Protein (g)', Math.round(recipe.nutrition.proteinPerServing), Math.round(recipe.nutrition.totalProtein)],
                    ['Fiber (g)', Math.round(recipe.nutrition.fiberPerServing), Math.round(recipe.nutrition.totalFiber)],
                    ['Sugar (g)', Math.round(recipe.nutrition.sugarPerServing), Math.round(recipe.nutrition.totalSugar)],
                  ].map(([label, per, total]) => (
                    <Box
                      key={label}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        borderBottom: '1px solid rgba(255,255,255,0.3)',
                        mb: 0.5,
                        pb: 0.5,
                      }}
                    >
                      <Typography
                        sx={{ width: '40%', fontSize: fs(0.8), fontWeight: 'bold', color: '#fff' }}
                      >
                        {label}
                      </Typography>
                      <Typography sx={{ width: '30%', fontSize: fs(0.8), color: '#fff', textAlign: 'right' }}>
                        {per}
                      </Typography>
                      <Typography sx={{ width: '30%', fontSize: fs(0.8), color: '#fff', textAlign: 'right' }}>
                        {total}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        ))}

        {/* Front face */}
        {!isExpanded && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              p: 2,
              pl: `${leftOffset + spacing(8)}px`,
              pr: `${rightOffset + spacing(2)}px`,
              zIndex: 30,
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontWeight: 'bold',
                  color: '#fff',
                  fontSize: fs(clampFont(1.4, recipeName.length, 30, 50)),
                  background: 'rgba(0,0,0,0.5)',
                  borderRadius: 2,
                  p: '6px 12px',
                  maxWidth: 'fit-content',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                }}
              >
                {recipeName}
              </Typography>

              {/* Recipe Badges */}
              <Box
                sx={{
                  display: 'flex',
                  gap: 1,
                  flexWrap: 'wrap',
                  mt: 1,
                }}
              >
                {/* Meal Type Badge */}
                <Chip
                  label={getMealTypeLetter(recipeMealType)}
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    color: '#333',
                    fontWeight: 'bold',
                    fontSize: '0.8rem',
                    height: '24px',
                    '& .MuiChip-label': {
                      px: 1,
                    },
                  }}
                />
                
                {/* Servings Badge */}
                <Chip
                  label={`${recipeServings} ${recipeServings === 1 ? 'serving' : 'servings'}`}
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(0,150,136,0.9)',
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: '0.75rem',
                    height: '24px',
                    '& .MuiChip-label': {
                      px: 1,
                    },
                  }}
                />
                
                              {/* Calories Badge */}
              <Chip
                label={`${Math.round(recipeNutrition.caloriesPerServing)} cal`}
                size="small"
                sx={{
                  backgroundColor: 'rgba(255,87,34,0.9)',
                  color: '#fff',
                  fontWeight: 'bold',
                  fontSize: '0.75rem',
                  height: '24px',
                  '& .MuiChip-label': {
                    px: 1,
                  },
                }}
              />
              </Box>
            </Box>

            {recipeDescription && (
              <Typography
                sx={{
                  fontSize: fs(clampFont(0.85, recipeDescription.length, 120, 200)),
                  color: '#fff',
                  background: 'rgba(0,0,0,0.4)',
                  borderRadius: 2,
                  p: '6px 10px',
                  lineHeight: 1.35,
                  maxWidth: '85%',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {recipeDescription}
              </Typography>
            )}
          </Box>
        )}

        {/* Action buttons (hide when expanded) */}
        {!isExpanded && (
          <Box
            sx={{
              position: 'absolute',
              top: isMobile ? '16px' : isTablet ? '20px' : '24px',
              right: spacing(2),
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              zIndex: 30,
            }}
          >
            {[
              {
                icon: recipe.isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />,
                onClick: () => onToggleFavorite(recipe.id),
                color: recipe.isFavorite ? '#FFD700' : '#fff',
                title: recipe.isFavorite ? 'Remove Favorite' : 'Add Favorite',
                isFavorite: true,
              },
              {
                icon: <PrintIcon />,
                onClick: () => onPrint(recipe),
                color: '#9E9E9E',
                title: 'Print Recipe',
                isFavorite: false,
              },
              {
                icon: <DeleteIcon />,
                onClick: () => onDelete(recipe.id),
                color: '#f44336',
                title: 'Delete Recipe',
                isFavorite: false,
              },
            ].map(({ icon, onClick, color, title, isFavorite }) => (
              <motion.div key={title} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Tooltip title={title}>
                  <IconButton
                    onClick={onClick}
                    sx={{
                      width: isMobile ? 32 : 40,
                      height: isMobile ? 32 : 40,
                      color,
                      filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.8))',
                      '&:hover': { 
                        background: 'rgba(255,255,255,0.1)',
                        color: color === '#FFD700' ? '#FFD700' : color === '#f44336' ? '#f44336' : '#fff',
                        filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.8))',
                      },
                      '& svg': {
                        filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.8))',
                      },
                    }}
                  >
                    {icon}
                  </IconButton>
                </Tooltip>
              </motion.div>
            ))}
          </Box>
        )}
      </Box>
    </motion.div>
  );
}
