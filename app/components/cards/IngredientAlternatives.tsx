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
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  SwapHoriz as SwapIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';

interface Alternative {
  name: string;
  reason: string;
  adjustments: string;
  nutrition: string;
}

interface IngredientAlternativesProps {
  originalIngredient: string;
  requirements: string;
  alternatives: Alternative[];
  message: string;
}

export default function IngredientAlternatives({
  originalIngredient,
  requirements,
  alternatives,
  message,
}: IngredientAlternativesProps) {
  return (
    <Card sx={{ maxWidth: 600, mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <SwapIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" component="h3">
            Alternatives for {originalIngredient}
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {message}
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Chip 
            label={`Requirements: ${requirements}`} 
            size="small" 
            color="secondary" 
            variant="outlined"
          />
        </Box>

        <Typography variant="subtitle2" gutterBottom>
          Alternative Ingredients
        </Typography>

        <List>
          {alternatives.map((alternative, index) => (
            <React.Fragment key={index}>
              <ListItem sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 2 }}>
                <Box sx={{ width: '100%', mb: 1 }}>
                  <Typography variant="h6" color="primary">
                    {alternative.name}
                  </Typography>
                </Box>
                
                <Grid container spacing={2} sx={{ width: '100%' }}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Why it works:
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {alternative.reason}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Adjustments needed:
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {alternative.adjustments}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Nutritional differences:
                    </Typography>
                    <Typography variant="body2">
                      {alternative.nutrition}
                    </Typography>
                  </Grid>
                </Grid>
              </ListItem>
              {index < alternatives.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>

        {alternatives.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="body2" color="text.secondary">
              No alternatives found. Try adjusting your requirements.
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
} 