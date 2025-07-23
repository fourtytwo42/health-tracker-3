'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useUserSettings } from '@/hooks/useUserSettings';
import { formatIngredientAmount } from '@/lib/utils/unitConversion';

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
}



export default function PrintRecipePage() {
  const searchParams = useSearchParams();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);

  // Get user settings
  const { settings: userSettings } = useUserSettings();

  useEffect(() => {
    const recipeId = searchParams.get('id');
    if (!recipeId) return;

    const fetchRecipe = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`/api/recipes/${recipeId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setRecipe(data);
        }
      } catch (error) {
        console.error('Error fetching recipe:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [searchParams]);

  // Update document title when recipe is loaded
  useEffect(() => {
    if (recipe) {
      document.title = `${recipe.name} - Recipe Card`;
    } else {
      document.title = 'Recipe Card';
    }
  }, [recipe]);

  // Calculate daily values (based on 2000 calorie diet)
  const dailyValues = {
    calories: 2000,
    protein: 50, // 50g per day
    carbs: 275, // 275g per day
    fat: 55, // 55g per day
    fiber: 28, // 28g per day
    sugar: 50 // 50g per day
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        Loading recipe...
      </div>
    );
  }

  if (!recipe) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        Recipe not found
      </div>
    );
  }

  return (
    <div style={{ 
      fontFamily: 'Arial, sans-serif',
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh'
    }}>
      {/* Print Button */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '20px',
        padding: '10px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <button 
          onClick={() => window.print()}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          🖨️ Print Recipe Card
        </button>
      </div>

      {/* Recipe Cards Container */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '20px',
        alignItems: 'center'
      }}>
        {/* Front of Recipe Card */}
        <div style={{
          width: '100%',
          maxWidth: '600px',
          height: '400px',
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          border: '2px solid #333',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Recipe Header with Meta Info */}
          <div style={{ marginBottom: '15px' }}>
            {/* Title and Meta Info Row */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              {/* Left Meta Info */}
              <div style={{
                textAlign: 'center',
                padding: '4px 8px',
                backgroundColor: '#f8f9fa',
                borderRadius: '6px',
                border: '1px solid #dee2e6',
                minWidth: '80px'
              }}>
                <div style={{ fontSize: '8px', color: '#6c757d', fontWeight: 'bold' }}>MEAL TYPE</div>
                <div style={{ fontSize: '12px', color: '#333', fontWeight: 'bold' }}>{recipe.mealType}</div>
              </div>
              
              {/* Title */}
              <h1 style={{ 
                fontSize: '16px', 
                margin: '0',
                color: '#333',
                fontWeight: 'bold',
                textAlign: 'center',
                flex: '1',
                padding: '0 15px',
                lineHeight: '1.1',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {recipe.name}
              </h1>
              
              {/* Right Meta Info */}
              <div style={{
                display: 'flex',
                gap: '8px'
              }}>
                <div style={{
                  textAlign: 'center',
                  padding: '4px 8px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                  border: '1px solid #dee2e6',
                  minWidth: '60px'
                }}>
                  <div style={{ fontSize: '8px', color: '#6c757d', fontWeight: 'bold' }}>SERVINGS</div>
                  <div style={{ fontSize: '12px', color: '#333', fontWeight: 'bold' }}>{recipe.servings}</div>
                </div>

              </div>
            </div>
            
            {/* Nutrition Summary */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '8px',
              flexWrap: 'wrap'
            }}>
              <div style={{
                textAlign: 'center',
                padding: '2px 4px',
                backgroundColor: '#e8f5e8',
                borderRadius: '3px',
                border: '1px solid #c3e6c3',
                minWidth: '40px'
              }}>
                <div style={{ fontSize: '6px', color: '#2d5a2d', fontWeight: 'bold', lineHeight: '1' }}>CAL</div>
                <div style={{ fontSize: '9px', color: '#333', fontWeight: 'bold', lineHeight: '1' }}>{Math.round(recipe.nutrition.totalCalories)}</div>
              </div>
              <div style={{
                textAlign: 'center',
                padding: '2px 4px',
                backgroundColor: '#fff3cd',
                borderRadius: '3px',
                border: '1px solid #ffeaa7',
                minWidth: '40px'
              }}>
                <div style={{ fontSize: '6px', color: '#856404', fontWeight: 'bold', lineHeight: '1' }}>FAT</div>
                <div style={{ fontSize: '9px', color: '#333', fontWeight: 'bold', lineHeight: '1' }}>{Math.round(recipe.nutrition.totalFat)}g</div>
              </div>
              <div style={{
                textAlign: 'center',
                padding: '2px 4px',
                backgroundColor: '#d1ecf1',
                borderRadius: '3px',
                border: '1px solid #bee5eb',
                minWidth: '40px'
              }}>
                <div style={{ fontSize: '6px', color: '#0c5460', fontWeight: 'bold', lineHeight: '1' }}>PRO</div>
                <div style={{ fontSize: '9px', color: '#333', fontWeight: 'bold', lineHeight: '1' }}>{Math.round(recipe.nutrition.totalProtein)}g</div>
              </div>
              <div style={{
                textAlign: 'center',
                padding: '2px 4px',
                backgroundColor: '#f8d7da',
                borderRadius: '3px',
                border: '1px solid #f5c6cb',
                minWidth: '40px'
              }}>
                <div style={{ fontSize: '6px', color: '#721c24', fontWeight: 'bold', lineHeight: '1' }}>CARB</div>
                <div style={{ fontSize: '9px', color: '#333', fontWeight: 'bold', lineHeight: '1' }}>{Math.round(recipe.nutrition.totalCarbs)}g</div>
              </div>
              <div style={{
                textAlign: 'center',
                padding: '2px 4px',
                backgroundColor: '#d4edda',
                borderRadius: '3px',
                border: '1px solid #c3e6cb',
                minWidth: '40px'
              }}>
                <div style={{ fontSize: '6px', color: '#155724', fontWeight: 'bold', lineHeight: '1' }}>FIB</div>
                <div style={{ fontSize: '9px', color: '#333', fontWeight: 'bold', lineHeight: '1' }}>{Math.round(recipe.nutrition.totalFiber)}g</div>
              </div>
              <div style={{
                textAlign: 'center',
                padding: '2px 4px',
                backgroundColor: '#e2e3e5',
                borderRadius: '3px',
                border: '1px solid #d6d8db',
                minWidth: '40px'
              }}>
                <div style={{ fontSize: '6px', color: '#383d41', fontWeight: 'bold', lineHeight: '1' }}>SUG</div>
                <div style={{ fontSize: '9px', color: '#333', fontWeight: 'bold', lineHeight: '1' }}>{Math.round(recipe.nutrition.totalSugar)}g</div>
              </div>
            </div>
            
            {/* Description */}
            {recipe.description && (
              <p style={{ 
                fontSize: '8px', 
                color: '#666', 
                margin: '0',
                fontStyle: 'italic',
                textAlign: 'center',
                lineHeight: '1.1'
              }}>
                {recipe.description}
              </p>
            )}
          </div>

          {/* Content Sections */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            {/* Top Row: Ingredients and Instructions Side by Side */}
            <div style={{ display: 'flex', gap: '15px', marginBottom: '10px' }}>
              {/* Ingredients Section - Left */}
              <div style={{ width: '35%', display: 'flex', flexDirection: 'column' }}>
                <h2 style={{ 
                  fontSize: '12px', 
                  margin: '0 0 6px 0',
                  color: '#333',
                  borderBottom: '2px solid #333',
                  paddingBottom: '2px'
                }}>
                  Ingredients
                </h2>
                <div style={{ fontSize: '9px', lineHeight: '1.1', flex: 1, overflow: 'auto' }}>
                  {recipe.ingredients.map(ri => (
                    <div key={ri.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '2px 0',
                      borderBottom: '1px dotted #ccc'
                    }}>
                      <span style={{ flex: '1' }}>{ri.notes || ri.ingredient.name}</span>
                      <span style={{ 
                        fontWeight: 'bold', 
                        marginLeft: '8px',
                        color: '#333'
                      }}>
                        {formatIngredientAmount(ri.amount, ri.unit, ri.ingredient.name, userSettings.units.useMetricUnits)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Instructions Section - Right */}
              <div style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
                <h2 style={{ 
                  fontSize: '12px', 
                  margin: '0 0 6px 0',
                  color: '#333',
                  borderBottom: '2px solid #333',
                  paddingBottom: '2px'
                }}>
                  Instructions
                </h2>
                <div style={{ fontSize: '9px', lineHeight: '1.1', flex: 1, overflow: 'auto' }}>
                  {recipe.instructions.split('\n').map((line, index) => {
                    const stepMatch = line.match(/^(\s*)(Step\s+\d+:?)(\s*)(.*)/i);
                    if (stepMatch) {
                      const [, leadingSpace, stepNumber, trailingSpace, stepText] = stepMatch;
                      return (
                        <div key={index} style={{ marginBottom: '3px' }}>
                          <span style={{ fontWeight: 'bold', color: '#333' }}>{stepNumber}</span>
                          {trailingSpace}{stepText}
                        </div>
                      );
                    }
                    return line ? (
                      <div key={index} style={{ marginBottom: '3px' }}>{line}</div>
                    ) : null;
                  })}
                </div>
              </div>
            </div>

            {/* Bottom Row: Instructions can expand to full width if needed */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '9px', lineHeight: '1.1', overflow: 'auto' }}>
                {/* This area can be used for overflow instructions if needed */}
              </div>
            </div>
          </div>
        </div>

        {/* Back of Recipe Card */}
        <div style={{
          width: '100%',
          maxWidth: '600px',
          height: '400px',
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          border: '2px solid #333',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Background Image */}
          {recipe.photoUrl && (
            <img
              src={recipe.photoUrl}
              alt={recipe.name}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: 1,
                zIndex: 1
              }}
            />
          )}

          {/* Content Overlay */}
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Recipe Title */}
            <h1 style={{ 
              fontSize: '24px', 
              margin: '0 0 15px 0',
              color: 'white',
              fontWeight: 'bold',
              textAlign: 'center',
              borderBottom: '2px solid white',
              paddingBottom: '5px',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              lineHeight: '1.1',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {recipe.name}
            </h1>

                        {/* Nutrition Sections */}
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', overflow: 'hidden' }}>
              {/* Main Nutrition Facts */}
              <div style={{ 
                width: '35%',
                backgroundColor: 'rgba(248, 249, 250, 0.7)',
                padding: '15px',
                borderRadius: '8px',
                border: '2px solid #333',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: '300px',
                alignSelf: 'flex-start'
              }}>
                <h3 style={{ 
                  fontSize: '14px', 
                  margin: '0 0 10px 0',
                  color: '#333',
                  textAlign: 'center',
                  borderBottom: '1px solid #333',
                  paddingBottom: '3px'
                }}>
                  Nutrition Facts
                </h3>
                <div style={{ overflow: 'auto' }}>
                  <table style={{ width: '100%', fontSize: '10px', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr style={{ borderBottom: '2px solid #333', fontWeight: 'bold' }}>
                        <td colSpan={2}>Serves {recipe.servings}</td>
                      </tr>
                      <tr style={{ borderBottom: '2px solid #333', fontWeight: 'bold' }}>
                        <td colSpan={2}>Calories</td>
                        <td style={{ textAlign: 'right' }}>{Math.round(recipe.nutrition.caloriesPerServing)}</td>
                        <td style={{ textAlign: 'right' }}>{Math.round(recipe.nutrition.totalCalories)}</td>
                      </tr>
                      <tr>
                        <th colSpan={2}></th>
                        <th style={{ textAlign: 'center' }}>Serving</th>
                        <th style={{ textAlign: 'center' }}>Total</th>
                        <th style={{ textAlign: 'center' }}>Daily</th>
                      </tr>
                                          <tr>
                        <td colSpan={2}>Total Fat</td>
                        <td style={{ textAlign: 'right' }}>{Math.round(recipe.nutrition.fatPerServing)}g</td>
                        <td style={{ textAlign: 'right' }}>{Math.round(recipe.nutrition.totalFat)}g</td>
                        <td style={{ textAlign: 'right', fontSize: '8px' }}>
                          {Math.round((recipe.nutrition.fatPerServing / dailyValues.fat) * 100)}%
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={2}>Protein</td>
                        <td style={{ textAlign: 'right' }}>{Math.round(recipe.nutrition.proteinPerServing)}g</td>
                        <td style={{ textAlign: 'right' }}>{Math.round(recipe.nutrition.totalProtein)}g</td>
                        <td style={{ textAlign: 'right', fontSize: '8px' }}>
                          {Math.round((recipe.nutrition.proteinPerServing / dailyValues.protein) * 100)}%
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={2}>Total Carbohydrates</td>
                        <td style={{ textAlign: 'right' }}>{Math.round(recipe.nutrition.carbsPerServing)}g</td>
                        <td style={{ textAlign: 'right' }}>{Math.round(recipe.nutrition.totalCarbs)}g</td>
                        <td style={{ textAlign: 'right', fontSize: '8px' }}>
                          {Math.round((recipe.nutrition.carbsPerServing / dailyValues.carbs) * 100)}%
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={2}>Dietary Fiber</td>
                        <td style={{ textAlign: 'right' }}>{Math.round(recipe.nutrition.fiberPerServing)}g</td>
                        <td style={{ textAlign: 'right' }}>{Math.round(recipe.nutrition.totalFiber)}g</td>
                        <td style={{ textAlign: 'right', fontSize: '8px' }}>
                          {Math.round((recipe.nutrition.fiberPerServing / dailyValues.fiber) * 100)}%
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={2}>Total Sugars</td>
                        <td style={{ textAlign: 'right' }}>{Math.round(recipe.nutrition.sugarPerServing)}g</td>
                        <td style={{ textAlign: 'right' }}>{Math.round(recipe.nutrition.totalSugar)}g</td>
                        <td style={{ textAlign: 'right', fontSize: '8px' }}>
                          {Math.round((recipe.nutrition.sugarPerServing / dailyValues.sugar) * 100)}%
                        </td>
                      </tr>
                  </tbody>
                </table>
                </div>
              </div>

              {/* Per Ingredient Breakdown */}
              <div style={{ 
                flex: '1',
                backgroundColor: 'rgba(249, 249, 249, 0.7)',
                padding: '15px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: '300px',
                alignSelf: 'flex-start'
              }}>
                <h3 style={{ 
                  fontSize: '12px', 
                  margin: '0 0 10px 0',
                  color: '#333',
                  textAlign: 'center',
                  borderBottom: '1px solid #ccc',
                  paddingBottom: '3px'
                }}>
                  Per Ingredient Breakdown
                </h3>
                <div style={{ overflow: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f0f0f0' }}>
                        <th style={{ padding: '2px', textAlign: 'left', borderBottom: '1px solid #ccc', fontSize: '7px' }}>Ingredient</th>
                        <th style={{ padding: '2px', textAlign: 'left', borderBottom: '1px solid #ccc', fontSize: '7px' }}>Amount</th>
                        <th style={{ padding: '2px', textAlign: 'right', borderBottom: '1px solid #ccc', fontSize: '7px' }}>Calories</th>
                        <th style={{ padding: '2px', textAlign: 'right', borderBottom: '1px solid #ccc', fontSize: '7px' }}>Protein</th>
                        <th style={{ padding: '2px', textAlign: 'right', borderBottom: '1px solid #ccc', fontSize: '7px' }}>Carbs</th>
                        <th style={{ padding: '2px', textAlign: 'right', borderBottom: '1px solid #ccc', fontSize: '7px' }}>Fat</th>
                        <th style={{ padding: '2px', textAlign: 'right', borderBottom: '1px solid #ccc', fontSize: '7px' }}>Fiber</th>
                        <th style={{ padding: '2px', textAlign: 'right', borderBottom: '1px solid #ccc', fontSize: '7px' }}>Sugar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recipe.ingredients.map(ri => {
                        const multiplier = ri.amount / 100; // Assuming nutrition values are per 100g
                        const calories = Math.round(ri.ingredient.calories * multiplier);
                        const protein = Math.round(ri.ingredient.protein * multiplier);
                        const carbs = Math.round(ri.ingredient.carbs * multiplier);
                        const fat = Math.round(ri.ingredient.fat * multiplier);
                        const fiber = Math.round(ri.ingredient.fiber * multiplier);
                        const sugar = Math.round(ri.ingredient.sugar * multiplier);
                        
                        return (
                          <tr key={ri.id} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '1px', fontSize: '7px' }}>{ri.notes || ri.ingredient.name}</td>
                            <td style={{ padding: '1px', fontSize: '7px' }}>{formatIngredientAmount(ri.amount, ri.unit, ri.ingredient.name, userSettings.units.useMetricUnits)}</td>
                            <td style={{ padding: '1px', fontSize: '7px', textAlign: 'right' }}>{calories}</td>
                            <td style={{ padding: '1px', fontSize: '7px', textAlign: 'right' }}>{protein}g</td>
                            <td style={{ padding: '1px', fontSize: '7px', textAlign: 'right' }}>{carbs}g</td>
                            <td style={{ padding: '1px', fontSize: '7px', textAlign: 'right' }}>{fat}g</td>
                            <td style={{ padding: '1px', fontSize: '7px', textAlign: 'right' }}>{fiber}g</td>
                            <td style={{ padding: '1px', fontSize: '7px', textAlign: 'right' }}>{sugar}g</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          body { 
            margin: 0; 
            padding: 0; 
            background: white;
          }
          
          /* Hide print button when printing */
          button {
            display: none !important;
          }
          
          /* Ensure cards print properly */
          div {
            break-inside: avoid;
          }
          
          /* Adjust spacing for print */
          .recipe-card {
            margin-bottom: 20px;
            page-break-after: always;
          }
        }
      `}</style>
    </div>
  );
} 