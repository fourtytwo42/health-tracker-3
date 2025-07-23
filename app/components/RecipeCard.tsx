'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { motion } from 'framer-motion';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import DeleteIcon from '@mui/icons-material/Delete';
import PrintIcon from '@mui/icons-material/Print';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

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
  onDelete: (recipeId: string) => void;
  onPrint: (recipe: Recipe) => void;
}

/* ------------------------------------------------------------------ */
/*  Constants & Helpers                                               */
/* ------------------------------------------------------------------ */

const ALL_TABS = ['Instructions', 'Ingredients', 'Nutrition'] as const;

const clampFont = (
  base: number,
  length: number,
  longThresh: number,
  veryLongThresh: number
): number => {
  if (length > veryLongThresh) return base * 0.8;
  if (length > longThresh) return base * 0.9;
  return base;
};

const formatIngredientAmount = (
  amount: number,
  unit: string,
  name: string
): string => {
  const scaled = amount;
  if (name.toLowerCase().includes('egg')) {
    return `${Math.round(scaled)} egg${Math.round(scaled) !== 1 ? 's' : ''}`;
  }
  const u = unit.toLowerCase();
  if (u === 'g' || u === 'gram') {
    if (scaled >= 1000) return `${Math.round(scaled / 1000)} lb`;
    if (scaled >= 28.35) return `${Math.round(scaled / 28.35)} oz`;
    if (scaled >= 15) return `${Math.round(scaled / 15)} tbsp`;
    if (scaled >= 5) return `${Math.round(scaled / 5)} tsp`;
    return `${Math.round(scaled)} g`;
  }
  if (u === 'ml' || u === 'milliliter') {
    if (scaled >= 240)
      return `${Math.round(scaled / 240)} cup${Math.round(scaled / 240) !== 1 ? 's' : ''}`;
    if (scaled >= 15) return `${Math.round(scaled / 15)} tbsp`;
    if (scaled >= 5) return `${Math.round(scaled / 5)} tsp`;
    return `${Math.round(scaled)} ml`;
  }
  return `${Math.round(scaled)} ${unit}`;
};

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

  const [leftTabs, setLeftTabs] = useState<string[]>([...ALL_TABS]);
  const [rightTabs, setRightTabs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const cardHeight = isMobile ? 340 : isTablet ? 400 : 480;
  const cardWidth = cardHeight * 1.6;

  const fs = (base: number, mob = 0.8, tab = 0.9) =>
    `${base * (isMobile ? mob : isTablet ? tab : 1)}rem`;
  const spacing = (v: number) =>
    isMobile ? v * 0.6 : isTablet ? v * 0.8 : v;

  const handleTabClick = (tab: string) => {
    /* ---------------- LEFT‑SIDE CLICK: open tab ---------------- */
    if (leftTabs.includes(tab)) {
      const idx = leftTabs.indexOf(tab);
      const moving = leftTabs.slice(idx); // tab + anything after it
      setLeftTabs(leftTabs.slice(0, idx));
      setRightTabs(prev => [...moving, ...prev]);
      setActiveTab(tab);
      return;
    }

    /* ---------------- RIGHT‑SIDE CLICK: close tab -------------- */
    const idx = rightTabs.indexOf(tab);

    // If it was the right‑most tab, close everything
    if (idx === rightTabs.length - 1) {
      setLeftTabs(prev => [...prev, ...rightTabs]);
      setRightTabs([]);
      setActiveTab(null);
      return;
    }

    // Otherwise move the clicked tab (and any to its left) back
    const moveBack = rightTabs.slice(0, idx + 1);
    const newRight = rightTabs.slice(idx + 1);
    setLeftTabs(prev => [...prev, ...moveBack]);
    setRightTabs(newRight);
    setActiveTab(newRight.length ? newRight[newRight.length - 1] : null); // hide closed tab
  };

  const isExpanded = activeTab !== null;

  /* ------------------------------------------------------------------ */
  /*  JSX                                                               */
  /* ------------------------------------------------------------------ */

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
            recipe.photoUrl ||
            'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNjY2NjY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iI2NjYyIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='
          }
          alt={recipe.name}
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

        {/* Left tabs */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            display: 'flex',
            flexDirection: 'row',
            zIndex: 50,
          }}
        >
          {leftTabs.map(tab => (
            <Box
              key={tab}
              sx={{
                width: 40,
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
                variant="caption"
                sx={{
                  color: '#fff',
                  fontWeight: 'bold',
                  fontSize: '0.7rem',
                  transform: 'rotate(-90deg)',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                }}
              >
                {tab}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Right tabs */}
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
                  right: (rightTabs.length - 1 - idx) * 40,
                  width: 40,
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
                  variant="caption"
                  sx={{
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: '0.7rem',
                    transform: 'rotate(-90deg)',
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

        {/* Overlays */}
        {ALL_TABS.map(overlay => (
          <Box
            key={overlay}
            sx={{
              position: 'absolute',
              inset: 0,
              left: activeTab === overlay ? 0 : '-100%',
              display: activeTab === overlay ? 'flex' : 'none',
              alignItems: 'center',
              justifyContent: 'center',
              p: 2,
              pl: 'calc(40px + 2rem)',
              transition: 'left 0.3s ease',
              zIndex: 25,
            }}
          >
            {/* Instructions */}
            {overlay === 'Instructions' && (
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
                  variant="h6"
                  sx={{
                    fontSize: fs(1.1),
                    fontWeight: 'bold',
                    color: '#fff',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                    mb: 2,
                  }}
                >
                  Instructions
                </Typography>
                <Box
                  sx={{
                    width: '100%',
                    maxHeight: 260,
                    overflow: 'auto',
                    p: 1.5,
                    border: '2px solid rgba(255,255,255,0.7)',
                    borderRadius: 1,
                    background: 'rgba(255,255,255,0.1)',
                    '&::-webkit-scrollbar': { display: 'none' },
                    scrollbarWidth: 'none',
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.2,
                      fontSize: fs(0.85),
                      color: '#fff',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                    }}
                    dangerouslySetInnerHTML={{
                      __html: recipe.instructions
                        .split('\n')
                        .map(l => `<div>${l}</div>`)
                        .join(''),
                    }}
                  />
                </Box>
              </Box>
            )}

            {/* Ingredients */}
            {overlay === 'Ingredients' && (
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
                  variant="h6"
                  sx={{
                    fontSize: fs(1.1),
                    fontWeight: 'bold',
                    color: '#fff',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                    mb: 2,
                  }}
                >
                  Ingredients
                </Typography>
                <Box
                  sx={{
                    width: '100%',
                    maxHeight: 260,
                    overflow: 'auto',
                    p: 1.5,
                    border: '2px solid rgba(255,255,255,0.7)',
                    borderRadius: 1,
                    background: 'rgba(255,255,255,0.1)',
                    '&::-webkit-scrollbar': { display: 'none' },
                    scrollbarWidth: 'none',
                  }}
                >
                  {recipe.ingredients.map(ing => (
                    <Box
                      key={ing.id}
                      sx={{
                        p: 0.5,
                        borderBottom: '1px solid rgba(255,255,255,0.3)',
                        '&:last-child': { borderBottom: 'none' },
                      }}
                    >
                      <Typography
                        sx={{
                          color: '#fff',
                          fontSize: fs(0.85),
                          fontWeight: 'bold',
                        }}
                      >
                        {ing.notes || ing.ingredient.name}
                      </Typography>
                      <Typography
                        sx={{
                          color: 'rgba(255,255,255,0.8)',
                          fontSize: fs(0.75),
                        }}
                      >
                        {formatIngredientAmount(
                          ing.amount,
                          ing.unit,
                          ing.ingredient.name
                        )}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {/* Nutrition */}
            {overlay === 'Nutrition' && (
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
                  variant="h6"
                  sx={{
                    fontSize: fs(1.1),
                    fontWeight: 'bold',
                    color: '#fff',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                    mb: 2,
                  }}
                >
                  Nutrition Facts
                </Typography>
                <Box
                  sx={{
                    width: '100%',
                    maxHeight: 260,
                    overflow: 'auto',
                    p: 1.5,
                    border: '2px solid rgba(255,255,255,0.7)',
                    borderRadius: 1,
                    background: 'rgba(255,255,255,0.1)',
                    '&::-webkit-scrollbar': { display: 'none' },
                    scrollbarWidth: 'none',
                  }}
                >
                  {[
                    ['Calories', recipe.nutrition.caloriesPerServing],
                    ['Fat', `${Math.round(recipe.nutrition.fatPerServing)}g`],
                    ['Carbs', `${Math.round(recipe.nutrition.carbsPerServing)}g`],
                    ['Protein', `${Math.round(recipe.nutrition.proteinPerServing)}g`],
                    ['Fiber', `${Math.round(recipe.nutrition.fiberPerServing)}g`],
                  ].map(([label, val]) => (
                    <Box
                      key={label}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        borderBottom: '1px solid rgba(255,255,255,0.7)',
                        pb: 0.5,
                        mb: 0.5,
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: fs(0.8),
                          fontWeight: 'bold',
                          color: '#fff',
                        }}
                      >
                        {label}
                      </Typography>
                      <Typography sx={{ fontSize: fs(0.8), color: '#fff' }}>
                        {val}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        ))}

        {/* Front page info */}
        {!isExpanded && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              p: 2,
              pl: 'calc(120px + 2rem)',
              zIndex: 30,
            }}
          >
            <Typography
              variant="h5"
              sx={{
                fontWeight: 'bold',
                color: '#fff',
                fontSize: fs(clampFont(1.1, recipe.name.length, 30, 50)),
                background: 'rgba(0,0,0,0.5)',
                borderRadius: 2,
                p: '4px 8px',
                lineHeight: 1.2,
                maxWidth: '85%',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {recipe.name}
            </Typography>

            {recipe.description && (
              <Typography
                variant="body2"
                sx={{
                  color: '#fff',
                  fontSize: fs(clampFont(0.85, recipe.description.length, 120, 200)),
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
                {recipe.description}
              </Typography>
            )}
          </Box>
        )}

        {/* Action buttons */}
        <Box
          sx={{
            position: 'absolute',
            top: spacing(1),
            right: spacing(1),
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
              color: recipe.isFavorite ? '#ff6b6b' : '#fff',
              title: recipe.isFavorite ? 'Remove Favorite' : 'Add Favorite',
            },
            {
              icon: <PrintIcon />,
              onClick: () => onPrint(recipe),
              color: '#fff',
              title: 'Print Recipe',
            },
            {
              icon: <DeleteIcon />,
              onClick: () => onDelete(recipe.id),
              color: '#fff',
              title: 'Delete Recipe',
            },
          ].map(({ icon, onClick, color, title }) => (
            <motion.div key={title} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Tooltip title={title}>
                <IconButton
                  onClick={onClick}
                  sx={{
                    width: isMobile ? 32 : 40,
                    height: isMobile ? 32 : 40,
                    background: 'rgba(0,0,0,0.5)',
                    color,
                    backdropFilter: 'blur(10px)',
                    '&:hover': { background: 'rgba(0,0,0,0.7)' },
                  }}
                >
                  {icon}
                </IconButton>
              </Tooltip>
            </motion.div>
          ))}
        </Box>
      </Box>
    </motion.div>
  );
}
