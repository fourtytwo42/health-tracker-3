'use client';

import React from 'react';
import { Box } from '@mui/material';
import RecipeCard from './cards/RecipeCard';
import PlanSummary from './cards/PlanSummary';
import LeaderboardSnippet from './cards/LeaderboardSnippet';
import GroceryListCard from './cards/GroceryListCard';
import GoalBadge from './cards/GoalBadge';
import BiomarkerChart from './cards/BiomarkerChart';
import MealCard from './cards/MealCard';
import IngredientAlternatives from './cards/IngredientAlternatives';
import NutritionLabel from './cards/NutritionLabel';
import QuickReplies from './QuickReplies';

export interface ComponentJson {
  type: string;
  props: Record<string, any>;
  id?: string;
  quickReplies?: Array<{ label: string; value: string }>;
}

interface ComponentRendererProps {
  component: ComponentJson;
  onQuickReply?: (value: string) => void;
}

const componentRegistry: Record<string, React.ComponentType<any>> = {
  RecipeCard,
  PlanSummary,
  LeaderboardSnippet,
  GroceryListCard,
  GoalBadge,
  BiomarkerChart,
  MealCard,
  IngredientAlternatives,
  NutritionLabel,
};

export default function ComponentRenderer({ component, onQuickReply }: ComponentRendererProps) {
  const Component = componentRegistry[component.type];

  if (!Component) {
    console.warn(`Unknown component type: ${component.type}`);
    return (
      <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1, border: '1px solid grey.300' }}>
        <pre style={{ margin: 0, fontSize: '12px', color: 'grey.600' }}>
          {JSON.stringify(component, null, 2)}
        </pre>
      </Box>
    );
  }

  return (
    <Box sx={{ my: 1 }}>
      <Component {...component.props} onQuickReply={onQuickReply} />
      {component.quickReplies && component.quickReplies.length > 0 && (
        <QuickReplies 
          replies={component.quickReplies} 
          onReply={onQuickReply}
        />
      )}
    </Box>
  );
} 