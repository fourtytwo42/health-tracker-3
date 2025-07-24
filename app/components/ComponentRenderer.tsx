'use client';

import React from 'react';
import { Box } from '@mui/material';
import RecipeCard from './RecipeCard';
import WorkoutCard from '../../components/WorkoutCard';
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
  WorkoutCard,
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
      {component.quickReplies && component.quickReplies.length > 0 && onQuickReply && (
        <QuickReplies 
          replies={component.quickReplies} 
          onReply={onQuickReply}
        />
      )}
    </Box>
  );
} 