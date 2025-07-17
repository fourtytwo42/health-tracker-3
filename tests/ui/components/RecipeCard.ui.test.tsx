import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { createElement } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { theme } from '@/styles/theme';

// Mock the RecipeCard component - we'll create this later
const RecipeCard = ({ title, kcal, protein, netCarbs, fat, ingredients, instructions }: any) => {
  return createElement('div', { 'data-testid': 'recipe-card' }, [
    createElement('h3', { key: 'title' }, title),
    createElement('div', { key: 'nutrition' }, [
      createElement('span', { key: 'kcal' }, `${kcal} kcal`),
      createElement('span', { key: 'protein' }, `Protein: ${protein}g`),
      createElement('span', { key: 'carbs' }, `Carbs: ${netCarbs}g`),
      createElement('span', { key: 'fat' }, `Fat: ${fat}g`),
    ]),
    createElement('ul', { key: 'ingredients' }, 
      ingredients.map((ingredient: string, index: number) => 
        createElement('li', { key: index }, ingredient)
      )
    ),
    createElement('ol', { key: 'instructions' },
      instructions.map((instruction: string, index: number) =>
        createElement('li', { key: index }, instruction)
      )
    ),
  ]);
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

describe('RecipeCard Component', () => {
  it('should render recipe card with all details', () => {
    const recipeData = {
      title: 'Grilled Salmon with Vegetables',
      kcal: 450,
      protein: 35,
      netCarbs: 15,
      fat: 25,
      ingredients: [
        'Salmon fillet (6 oz)',
        'Broccoli (1 cup)',
        'Olive oil (1 tbsp)',
        'Lemon (1/2)',
        'Garlic (2 cloves)',
      ],
      instructions: [
        'Preheat grill to medium-high heat',
        'Season salmon with salt and pepper',
        'Grill salmon for 4-5 minutes per side',
        'Steam broccoli until tender',
        'Serve with lemon wedges',
      ],
    };

    const { getByTestId, getByText } = render(
      <TestWrapper>
        <RecipeCard {...recipeData} />
      </TestWrapper>
    );

    expect(getByTestId('recipe-card')).toBeInTheDocument();
    expect(getByText('Grilled Salmon with Vegetables')).toBeInTheDocument();
    expect(getByText('450 kcal')).toBeInTheDocument();
    expect(getByText('Protein: 35g')).toBeInTheDocument();
    expect(getByText('Carbs: 15g')).toBeInTheDocument();
    expect(getByText('Fat: 25g')).toBeInTheDocument();
    
    // Check ingredients
    expect(getByText('Salmon fillet (6 oz)')).toBeInTheDocument();
    expect(getByText('Broccoli (1 cup)')).toBeInTheDocument();
    
    // Check instructions
    expect(getByText('Preheat grill to medium-high heat')).toBeInTheDocument();
    expect(getByText('Grill salmon for 4-5 minutes per side')).toBeInTheDocument();
  });

  it('should render recipe card with minimal data', () => {
    const minimalData = {
      title: 'Simple Salad',
      kcal: 150,
      protein: 8,
      netCarbs: 10,
      fat: 12,
      ingredients: ['Mixed greens', 'Olive oil'],
      instructions: ['Mix ingredients', 'Serve'],
    };

    const { getByTestId, getByText } = render(
      <TestWrapper>
        <RecipeCard {...minimalData} />
      </TestWrapper>
    );

    expect(getByTestId('recipe-card')).toBeInTheDocument();
    expect(getByText('Simple Salad')).toBeInTheDocument();
    expect(getByText('150 kcal')).toBeInTheDocument();
    expect(getByText('Mixed greens')).toBeInTheDocument();
    expect(getByText('Mix ingredients')).toBeInTheDocument();
  });

  it('should handle empty ingredients and instructions', () => {
    const emptyData = {
      title: 'Empty Recipe',
      kcal: 0,
      protein: 0,
      netCarbs: 0,
      fat: 0,
      ingredients: [],
      instructions: [],
    };

    const { getByTestId, getByText } = render(
      <TestWrapper>
        <RecipeCard {...emptyData} />
      </TestWrapper>
    );

    expect(getByTestId('recipe-card')).toBeInTheDocument();
    expect(getByText('Empty Recipe')).toBeInTheDocument();
    expect(getByText('0 kcal')).toBeInTheDocument();
  });
}); 