'use client';

import React from 'react';
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
} from '@mui/material';
import { Restaurant as RestaurantIcon } from '@mui/icons-material';

interface RecipeCardProps {
  title: string;
  kcal?: number;
  protein?: number;
  netCarbs?: number;
  fat?: number;
  ingredients?: string[];
  instructions?: string[];
  prepTime?: string;
  cookTime?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
}

export default function RecipeCard({
  title,
  kcal,
  protein,
  netCarbs,
  fat,
  ingredients = [],
  instructions = [],
  prepTime,
  cookTime,
  difficulty,
}: RecipeCardProps) {
  return (
    <Card sx={{ maxWidth: 600, mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <RestaurantIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" component="h3">
            {title}
          </Typography>
        </Box>

        {/* Nutrition Info */}
        {(kcal || protein || netCarbs || fat) && (
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
            </Grid>
          </Box>
        )}

        {/* Recipe Details */}
        {(prepTime || cookTime || difficulty) && (
          <Box sx={{ mb: 2 }}>
            <Grid container spacing={2}>
              {prepTime && (
                <Grid item>
                  <Typography variant="body2" color="text.secondary">
                    Prep: {prepTime}
                  </Typography>
                </Grid>
              )}
              {cookTime && (
                <Grid item>
                  <Typography variant="body2" color="text.secondary">
                    Cook: {cookTime}
                  </Typography>
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
        )}

        {/* Ingredients */}
        {ingredients.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Ingredients
            </Typography>
            <List dense>
              {ingredients.map((ingredient, index) => (
                <ListItem key={index} sx={{ py: 0.5 }}>
                  <ListItemText 
                    primary={ingredient}
                    primaryTypographyProps={{ variant: 'body2' }}
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
      </CardContent>
    </Card>
  );
} 