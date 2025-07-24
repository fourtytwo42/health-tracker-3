import { prisma } from '@/lib/prisma';

export interface RecipeIngredientInput {
  ingredientId?: string; // Optional for unavailable ingredients
  amount: number;
  unit: string;
  notes?: string;
  isOptional?: boolean;
  unavailable?: boolean; // New field for unavailable ingredients
}

export interface CreateRecipeInput {
  userId: string;
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
  isFavorite?: boolean;
  isPublic?: boolean;
  aiGenerated?: boolean;
  originalQuery?: string;
  ingredients: RecipeIngredientInput[];
  unavailableIngredients?: string[]; // Store names of unavailable ingredients
}

export interface RecipeWithNutrition {
  id: string;
  userId: string;
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
  createdAt: Date;
  updatedAt: Date;
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
  unavailableIngredients?: Array<{
    name: string;
    amount: number;
    unit: string;
    notes?: string;
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

export class RecipeService {
  async createRecipe(input: CreateRecipeInput): Promise<RecipeWithNutrition> {
    const { ingredients, unavailableIngredients, ...recipeData } = input;

    // Separate available and unavailable ingredients
    const availableIngredients = ingredients.filter(ing => !ing.unavailable);
    const unavailableIngredientData = ingredients.filter(ing => ing.unavailable).map(ing => ({
      name: ing.notes || 'Unknown ingredient',
      amount: ing.amount,
      unit: ing.unit,
      notes: ing.notes
    }));

    const recipe = await prisma.Recipe.create({
      data: {
        ...recipeData,
        tags: recipeData.tags ? JSON.stringify(recipeData.tags) : null,
        // Store unavailable ingredients in the description or create a separate field
        description: recipeData.description + (unavailableIngredientData.length > 0 
          ? `\n\nUnavailable ingredients (no nutrition data): ${unavailableIngredientData.map(ing => `${ing.amount}${ing.unit} ${ing.name}`).join(', ')}`
          : ''),
        ingredients: {
          create: availableIngredients.map((ing, index) => ({
            ingredientId: ing.ingredientId!,
            amount: ing.amount,
            unit: ing.unit,
            notes: ing.notes,
            isOptional: ing.isOptional || false,
            order: index
          }))
        }
      },
      include: {
        ingredients: {
          include: {
            ingredient: true
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    });

    // Add unavailable ingredients to the returned recipe
    const recipeWithNutrition = this.calculateNutrition(recipe);
    recipeWithNutrition.unavailableIngredients = unavailableIngredientData;

    return recipeWithNutrition;
  }

  async getRecipeById(id: string): Promise<RecipeWithNutrition | null> {
    const recipe = await prisma.Recipe.findUnique({
      where: { id },
      include: {
        ingredients: {
          include: {
            ingredient: true
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    });

    if (!recipe) return null;

    const recipeWithNutrition = this.calculateNutrition(recipe);
    
    // Parse unavailable ingredients from description if they exist
    if (recipe.description && recipe.description.includes('Unavailable ingredients (no nutrition data):')) {
      const lines = recipe.description.split('\n');
      const unavailableLine = lines.find(line => line.includes('Unavailable ingredients (no nutrition data):'));
      
      if (unavailableLine) {
        const ingredientsPart = unavailableLine.replace('Unavailable ingredients (no nutrition data):', '').trim();
        const ingredientStrings = ingredientsPart.split(', ');
        
        recipeWithNutrition.unavailableIngredients = ingredientStrings.map(ingStr => {
          // Parse "100g ingredient name" format
          const match = ingStr.match(/^(\d+(?:\.\d+)?)([a-zA-Z]+)\s+(.+)$/);
          if (match) {
            return {
              amount: parseFloat(match[1]),
              unit: match[2],
              name: match[3],
              notes: match[3]
            };
          }
          return {
            amount: 0,
            unit: 'g',
            name: ingStr,
            notes: ingStr
          };
        });
        
        // Remove the unavailable ingredients line from description
        recipeWithNutrition.description = lines
          .filter(line => !line.includes('Unavailable ingredients (no nutrition data):'))
          .join('\n')
          .trim();
      }
    }

    return recipeWithNutrition;
  }

  async getUserRecipes(
    userId: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
    mealType?: string,
    isFavorite?: boolean,
    aiGenerated?: boolean
  ): Promise<{
    recipes: RecipeWithNutrition[];
    total: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { originalQuery: { contains: search } }
      ];
    }

    if (mealType) {
      where.mealType = mealType;
    }

    if (isFavorite !== undefined) {
      where.isFavorite = isFavorite;
    }

    if (aiGenerated !== undefined) {
      where.aiGenerated = aiGenerated;
    }

    const [recipes, total] = await Promise.all([
      prisma.Recipe.findMany({
        where,
        include: {
          ingredients: {
            include: {
              ingredient: true
            },
            orderBy: {
              order: 'asc'
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.Recipe.count({ where })
    ]);

    const recipesWithNutrition = recipes.map(recipe => this.calculateNutrition(recipe));

    return {
      recipes: recipesWithNutrition,
      total,
      totalPages: Math.ceil(total / limit)
    };
  }

  async updateRecipe(id: string, input: Partial<CreateRecipeInput>): Promise<RecipeWithNutrition | null> {
    const { ingredients, unavailableIngredients, ...recipeData } = input;

    const updateData: any = { ...recipeData };
    if (recipeData.tags) {
      updateData.tags = JSON.stringify(recipeData.tags);
    }
    if (unavailableIngredients) {
      updateData.unavailableIngredients = JSON.stringify(unavailableIngredients);
    }

    const recipe = await prisma.Recipe.update({
      where: { id },
      data: updateData,
      include: {
        ingredients: {
          include: {
            ingredient: true
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    });

    return this.calculateNutrition(recipe);
  }

  async deleteRecipe(id: string, userId: string): Promise<boolean> {
    try {
      // First check if the recipe belongs to the user
      const recipe = await prisma.Recipe.findFirst({
        where: { id, userId }
      });

      if (!recipe) {
        return false; // Recipe not found or doesn't belong to user
      }

      // Delete the recipe (cascade will handle recipe_ingredients)
      await prisma.Recipe.delete({
        where: { id }
      });

      return true;
    } catch (error) {
      console.error('Error deleting recipe:', error);
      return false;
    }
  }

  async toggleFavorite(id: string): Promise<RecipeWithNutrition | null> {
    const recipe = await prisma.Recipe.findUnique({
      where: { id },
      include: {
        ingredients: {
          include: {
            ingredient: true
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    });

    if (!recipe) return null;

    const updatedRecipe = await prisma.Recipe.update({
      where: { id },
      data: { isFavorite: !recipe.isFavorite },
      include: {
        ingredients: {
          include: {
            ingredient: true
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    });

    return this.calculateNutrition(updatedRecipe);
  }

  async replaceIngredient(
    recipeId: string,
    ingredientId: string,
    newIngredientId: string,
    adjustAmount: boolean = true
  ): Promise<RecipeWithNutrition | null> {
    const recipe = await prisma.Recipe.findUnique({
      where: { id: recipeId },
      include: {
        ingredients: {
          include: {
            ingredient: true
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    });

    if (!recipe) return null;

    const oldIngredient = recipe.ingredients.find(ri => ri.ingredientId === ingredientId);
    if (!oldIngredient) return null;

    const newIngredient = await prisma.ingredient.findUnique({
      where: { id: newIngredientId }
    });

    if (!newIngredient) return null;

    // Calculate new amount if needed
    let newAmount = oldIngredient.amount;
    if (adjustAmount && oldIngredient.ingredient.calories > 0 && newIngredient.calories > 0) {
      // Adjust amount to maintain similar calorie content
      const calorieRatio = oldIngredient.ingredient.calories / newIngredient.calories;
      newAmount = oldIngredient.amount * calorieRatio;
    }

    await prisma.recipeIngredient.update({
      where: { id: oldIngredient.id },
      data: {
        ingredientId: newIngredientId,
        amount: newAmount
      }
    });

    return this.getRecipeById(recipeId);
  }

  private calculateNutrition(recipe: any): RecipeWithNutrition {
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalFiber = 0;
    let totalSugar = 0;

    recipe.ingredients.forEach((ri: any) => {
      const ingredient = ri.ingredient;
      const multiplier = ri.amount / 100; // Assuming nutrition values are per 100g

      totalCalories += ingredient.calories * multiplier;
      totalProtein += ingredient.protein * multiplier;
      totalCarbs += ingredient.carbs * multiplier;
      totalFat += ingredient.fat * multiplier;
      totalFiber += ingredient.fiber * multiplier;
      totalSugar += ingredient.sugar * multiplier;
    });

    return {
      ...recipe,
      tags: recipe.tags ? JSON.parse(recipe.tags) : [],
      unavailableIngredients: recipe.unavailableIngredients ? JSON.parse(recipe.unavailableIngredients) : [],
      nutrition: {
        totalCalories: Math.round(totalCalories),
        totalProtein: Math.round(totalProtein * 10) / 10,
        totalCarbs: Math.round(totalCarbs * 10) / 10,
        totalFat: Math.round(totalFat * 10) / 10,
        totalFiber: Math.round(totalFiber * 10) / 10,
        totalSugar: Math.round(totalSugar * 10) / 10,
        caloriesPerServing: Math.round(totalCalories / recipe.servings),
        proteinPerServing: Math.round((totalProtein / recipe.servings) * 10) / 10,
        carbsPerServing: Math.round((totalCarbs / recipe.servings) * 10) / 10,
        fatPerServing: Math.round((totalFat / recipe.servings) * 10) / 10,
        fiberPerServing: Math.round((totalFiber / recipe.servings) * 10) / 10,
        sugarPerServing: Math.round((totalSugar / recipe.servings) * 10) / 10
      }
    };
  }
} 