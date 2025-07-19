import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { portablePrisma } from '../prisma';

// Use portable database for ingredients
const prisma = portablePrisma;

export interface IngredientData {
  name: string;
  description?: string;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  cholesterol?: number;
  saturatedFat?: number;
  monounsaturatedFat?: number;
  polyunsaturatedFat?: number;
  transFat?: number;
  netCarbs?: number;
  glycemicIndex?: number;
  glycemicLoad?: number;
  dietaryFlags?: string;
  allergens?: string;
  category?: string;
  aisle?: string;
}

export interface IngredientCreateInput extends IngredientData {
  isActive?: boolean;
}

export interface IngredientUpdateInput extends Partial<IngredientData> {
  isActive?: boolean;
}

export class IngredientService {
  private static instance: IngredientService;

  private constructor() {}

  static getInstance(): IngredientService {
    if (!IngredientService.instance) {
      IngredientService.instance = new IngredientService();
    }
    return IngredientService.instance;
  }

  async createIngredient(data: IngredientCreateInput) {
    try {
      const ingredient = await prisma.ingredient.create({
        data: {
          name: data.name,
          description: data.description,
          servingSize: data.servingSize,
          calories: data.calories,
          protein: data.protein,
          carbs: data.carbs,
          fat: data.fat,
          fiber: data.fiber,
          sugar: data.sugar,
          sodium: data.sodium,
          cholesterol: data.cholesterol,
          saturatedFat: data.saturatedFat,
          monounsaturatedFat: data.monounsaturatedFat,
          polyunsaturatedFat: data.polyunsaturatedFat,
          transFat: data.transFat,
          netCarbs: data.netCarbs,
          glycemicIndex: data.glycemicIndex,
          glycemicLoad: data.glycemicLoad,
          dietaryFlags: data.dietaryFlags,
          allergens: data.allergens,
          category: data.category,
          aisle: data.aisle,
          isActive: data.isActive ?? true,
        },
      });
      return ingredient;
    } catch (error) {
      console.error('Error creating ingredient:', error);
      throw new Error('Failed to create ingredient');
    }
  }

  async getIngredient(id: string) {
    try {
      const ingredient = await prisma.ingredient.findUnique({
        where: { id },
      });
      return ingredient;
    } catch (error) {
      console.error('Error fetching ingredient:', error);
      throw new Error('Failed to fetch ingredient');
    }
  }

  async getAllIngredients(includeInactive = false) {
    try {
      const where = includeInactive ? {} : { isActive: true };
      const ingredients = await prisma.ingredient.findMany({
        where,
        orderBy: { name: 'asc' },
      });
      return ingredients;
    } catch (error) {
      console.error('Error fetching ingredients:', error);
      throw new Error('Failed to fetch ingredients');
    }
  }

  async getIngredientsPaginated(
    page = 1,
    pageSize = 50,
    includeInactive = false,
    search?: string,
    category?: string,
    aisle?: string,
    nutritionFilters?: {
      calories?: { min?: number; max?: number };
      protein?: { min?: number; max?: number };
      carbs?: { min?: number; max?: number };
      fat?: { min?: number; max?: number };
      fiber?: { min?: number; max?: number };
      sodium?: { min?: number; max?: number };
    }
  ) {
    try {
      const where: any = includeInactive ? {} : { isActive: true };
      
      // Add search filter
      if (search) {
        where.OR = [
          { name: { contains: search } },
          { description: { contains: search } },
          { category: { contains: search } },
        ];
      }
      
      // Add category filter
      if (category) {
        where.category = category;
      }
      
      // Add aisle filter
      if (aisle) {
        where.aisle = aisle;
      }

      // Add nutrition range filters
      if (nutritionFilters) {
        if (nutritionFilters.calories) {
          if (nutritionFilters.calories.min !== undefined) {
            where.calories = { ...where.calories, gte: nutritionFilters.calories.min };
          }
          if (nutritionFilters.calories.max !== undefined) {
            where.calories = { ...where.calories, lte: nutritionFilters.calories.max };
          }
        }

        if (nutritionFilters.protein) {
          if (nutritionFilters.protein.min !== undefined) {
            where.protein = { ...where.protein, gte: nutritionFilters.protein.min };
          }
          if (nutritionFilters.protein.max !== undefined) {
            where.protein = { ...where.protein, lte: nutritionFilters.protein.max };
          }
        }

        if (nutritionFilters.carbs) {
          if (nutritionFilters.carbs.min !== undefined) {
            where.carbs = { ...where.carbs, gte: nutritionFilters.carbs.min };
          }
          if (nutritionFilters.carbs.max !== undefined) {
            where.carbs = { ...where.carbs, lte: nutritionFilters.carbs.max };
          }
        }

        if (nutritionFilters.fat) {
          if (nutritionFilters.fat.min !== undefined) {
            where.fat = { ...where.fat, gte: nutritionFilters.fat.min };
          }
          if (nutritionFilters.fat.max !== undefined) {
            where.fat = { ...where.fat, lte: nutritionFilters.fat.max };
          }
        }

        if (nutritionFilters.fiber) {
          if (nutritionFilters.fiber.min !== undefined) {
            where.fiber = { ...where.fiber, gte: nutritionFilters.fiber.min };
          }
          if (nutritionFilters.fiber.max !== undefined) {
            where.fiber = { ...where.fiber, lte: nutritionFilters.fiber.max };
          }
        }

        if (nutritionFilters.sodium) {
          if (nutritionFilters.sodium.min !== undefined) {
            where.sodium = { ...where.sodium, gte: nutritionFilters.sodium.min };
          }
          if (nutritionFilters.sodium.max !== undefined) {
            where.sodium = { ...where.sodium, lte: nutritionFilters.sodium.max };
          }
        }
      }

      const skip = (page - 1) * pageSize;
      
      const [ingredients, totalCount] = await Promise.all([
        prisma.ingredient.findMany({
          where,
          orderBy: { name: 'asc' },
          skip,
          take: pageSize,
        }),
        prisma.ingredient.count({ where })
      ]);

      return {
        ingredients,
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages: Math.ceil(totalCount / pageSize),
          hasNextPage: page < Math.ceil(totalCount / pageSize),
          hasPreviousPage: page > 1,
        }
      };
    } catch (error) {
      console.error('Error fetching paginated ingredients:', error);
      throw new Error('Failed to fetch ingredients');
    }
  }

  async updateIngredient(id: string, data: IngredientUpdateInput) {
    try {
      const ingredient = await prisma.ingredient.update({
        where: { id },
        data,
      });
      return ingredient;
    } catch (error) {
      console.error('Error updating ingredient:', error);
      throw new Error('Failed to update ingredient');
    }
  }

  async deleteIngredient(id: string) {
    try {
      await prisma.ingredient.delete({
        where: { id },
      });
      return { success: true };
    } catch (error) {
      console.error('Error deleting ingredient:', error);
      throw new Error('Failed to delete ingredient');
    }
  }

  async deleteAllIngredients() {
    try {
      await prisma.ingredient.deleteMany({});
      return { success: true, count: 0 };
    } catch (error) {
      console.error('Error deleting all ingredients:', error);
      throw new Error('Failed to delete all ingredients');
    }
  }

  async searchIngredients(query: string, limit = 10) {
    try {
      const ingredients = await prisma.ingredient.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { description: { contains: query } },
            { category: { contains: query } },
          ],
          isActive: true,
        },
        take: limit,
        orderBy: { name: 'asc' },
      });
      return ingredients;
    } catch (error) {
      console.error('Error searching ingredients:', error);
      throw new Error('Failed to search ingredients');
    }
  }

  async importFromCSV(csvData: string) {
    try {
      const records = parse(csvData, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      const results = {
        success: 0,
        failed: 0,
        errors: [] as string[],
      };

      for (const record of records as any[]) {
        try {
          // Validate required fields
          if (!record.name || !record.servingSize || !record.calories || !record.protein || !record.carbs || !record.fat) {
            results.failed++;
            results.errors.push(`Row ${results.success + results.failed}: Missing required fields`);
            continue;
          }

          // Convert numeric fields
          const ingredientData: IngredientCreateInput = {
            name: record.name.trim(),
            description: record.description?.trim(),
            servingSize: record.servingSize.trim(),
            calories: parseFloat(record.calories),
            protein: parseFloat(record.protein),
            carbs: parseFloat(record.carbs),
            fat: parseFloat(record.fat),
            fiber: record.fiber ? parseFloat(record.fiber) : undefined,
            sugar: record.sugar ? parseFloat(record.sugar) : undefined,
            sodium: record.sodium ? parseFloat(record.sodium) : undefined,
            cholesterol: record.cholesterol ? parseFloat(record.cholesterol) : undefined,
            saturatedFat: record.saturatedFat ? parseFloat(record.saturatedFat) : undefined,
            monounsaturatedFat: record.monounsaturatedFat ? parseFloat(record.monounsaturatedFat) : undefined,
            polyunsaturatedFat: record.polyunsaturatedFat ? parseFloat(record.polyunsaturatedFat) : undefined,
            transFat: record.transFat ? parseFloat(record.transFat) : undefined,
            netCarbs: record.netCarbs ? parseFloat(record.netCarbs) : undefined,
            glycemicIndex: record.glycemicIndex ? parseFloat(record.glycemicIndex) : undefined,
            glycemicLoad: record.glycemicLoad ? parseFloat(record.glycemicLoad) : undefined,
            dietaryFlags: record.dietaryFlags?.trim(),
            allergens: record.allergens?.trim(),
            category: record.category?.trim(),
            aisle: record.aisle?.trim(),
          };

          // Validate numeric values
          if (isNaN(ingredientData.calories) || isNaN(ingredientData.protein) || isNaN(ingredientData.carbs) || isNaN(ingredientData.fat)) {
            results.failed++;
            results.errors.push(`Row ${results.success + results.failed}: Invalid numeric values`);
            continue;
          }

          await this.createIngredient(ingredientData);
          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push(`Row ${results.success + results.failed}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return results;
    } catch (error) {
      console.error('Error importing CSV:', error);
      throw new Error('Failed to import CSV data');
    }
  }

  async exportToCSV() {
    try {
      const ingredients = await this.getAllIngredients(true);
      
      const csvData = stringify(ingredients, {
        header: true,
        columns: [
          'name',
          'description',
          'servingSize',
          'calories',
          'protein',
          'carbs',
          'fat',
          'fiber',
          'sugar',
          'sodium',
          'cholesterol',
          'saturatedFat',
          'monounsaturatedFat',
          'polyunsaturatedFat',
          'transFat',
          'netCarbs',
          'glycemicIndex',
          'glycemicLoad',
          'dietaryFlags',
          'allergens',
          'category',
          'aisle',
          'isActive',
          'createdAt',
          'updatedAt'
        ],
      });

      return csvData;
    } catch (error) {
      console.error('Error exporting CSV:', error);
      throw new Error('Failed to export CSV data');
    }
  }

  async getExampleCSV() {
    const exampleData = [
      {
        name: 'Chicken Breast',
        description: 'Boneless, skinless chicken breast',
        servingSize: '100g',
        calories: '165',
        protein: '31',
        carbs: '0',
        fat: '3.6',
        fiber: '0',
        sugar: '0',
        sodium: '74',
        cholesterol: '85',
        saturatedFat: '1.1',
        monounsaturatedFat: '1.2',
        polyunsaturatedFat: '0.8',
        transFat: '0',
        netCarbs: '0',
        glycemicIndex: '0',
        glycemicLoad: '0',
        dietaryFlags: 'High Protein, Low Carb',
        allergens: 'None',
        category: 'Proteins - Poultry (chicken, turkey, duck)',
        aisle: 'meat'
      },
      {
        name: 'Broccoli',
        description: 'Fresh broccoli florets',
        servingSize: '100g',
        calories: '34',
        protein: '2.8',
        carbs: '7',
        fat: '0.4',
        fiber: '2.6',
        sugar: '1.5',
        sodium: '33',
        cholesterol: '0',
        saturatedFat: '0.1',
        monounsaturatedFat: '0.1',
        polyunsaturatedFat: '0.2',
        transFat: '0',
        netCarbs: '4.4',
        glycemicIndex: '15',
        glycemicLoad: '1',
        dietaryFlags: 'Vegan, Gluten-Free, Low Calorie',
        allergens: 'None',
        category: 'Vegetables - Cruciferous (broccoli, cauliflower)',
        aisle: 'produce'
      },
      {
        name: 'Brown Rice',
        description: 'Cooked brown rice',
        servingSize: '100g',
        calories: '111',
        protein: '2.6',
        carbs: '23',
        fat: '0.9',
        fiber: '1.8',
        sugar: '0.4',
        sodium: '5',
        cholesterol: '0',
        saturatedFat: '0.2',
        monounsaturatedFat: '0.3',
        polyunsaturatedFat: '0.3',
        transFat: '0',
        netCarbs: '21.2',
        glycemicIndex: '55',
        glycemicLoad: '18',
        dietaryFlags: 'Vegan, Gluten-Free',
        allergens: 'None',
        category: 'Grains & Starches - Whole Grains (brown rice, quinoa)',
        aisle: 'pantry'
      }
    ];

    return stringify(exampleData, {
      header: true,
      columns: [
        'name',
        'description',
        'servingSize',
        'calories',
        'protein',
        'carbs',
        'fat',
        'fiber',
        'sugar',
        'sodium',
        'cholesterol',
        'saturatedFat',
        'monounsaturatedFat',
        'polyunsaturatedFat',
        'transFat',
        'netCarbs',
        'glycemicIndex',
        'glycemicLoad',
        'dietaryFlags',
        'allergens',
        'category',
        'aisle'
      ],
    });
  }

  async getCategories() {
    try {
      const categories = await prisma.ingredient.findMany({
        select: { category: true },
        where: { category: { not: null } },
        distinct: ['category'],
        orderBy: { category: 'asc' },
      });
      return categories.map(c => c.category).filter(Boolean);
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw new Error('Failed to fetch categories');
    }
  }

  async getAisles() {
    try {
      const aisles = await prisma.ingredient.findMany({
        select: { aisle: true },
        where: { aisle: { not: null } },
        distinct: ['aisle'],
        orderBy: { aisle: 'asc' },
      });
      return aisles.map(a => a.aisle).filter(Boolean);
    } catch (error) {
      console.error('Error fetching aisles:', error);
      throw new Error('Failed to fetch aisles');
    }
  }

  async getComprehensiveCategories() {
    return [
      // Proteins
      'Proteins - Meats (beef, pork, lamb, game)',
      'Proteins - Poultry (chicken, turkey, duck)',
      'Proteins - Seafood (fish, shellfish)',
      'Proteins - Eggs',
      'Proteins - Plant Proteins (tofu, tempeh, seitan)',
      
      // Vegetables
      'Vegetables - Leafy Greens (spinach, kale)',
      'Vegetables - Cruciferous (broccoli, cauliflower)',
      'Vegetables - Root (carrots, beets, potatoes)',
      'Vegetables - Alliums (onion, garlic)',
      'Vegetables - Nightshades (tomato, eggplant, pepper)',
      'Vegetables - Gourds & Squashes',
      
      // Fruits
      'Fruits - Berries',
      'Fruits - Citrus',
      'Fruits - Stone Fruits',
      'Fruits - Pomes (apple, pear)',
      'Fruits - Tropical (mango, pineapple)',
      'Fruits - Melons',
      
      // Grains & Starches
      'Grains & Starches - Whole Grains (brown rice, quinoa)',
      'Grains & Starches - Refined Grains (white rice, pasta)',
      'Grains & Starches - Ancient Grains (farro, spelt)',
      'Grains & Starches - Tubers & Root Starches (potato, cassava)',
      
      // Legumes & Pulses
      'Legumes & Pulses - Beans (black, kidney, navy)',
      'Legumes & Pulses - Lentils, Peas, Chickpeas',
      
      // Dairy & Alternatives
      'Dairy & Alternatives - Milk, Yogurt, Cheese, Butter',
      'Dairy & Alternatives - Plant Milks & Cheeses',
      
      // Nuts & Seeds
      'Nuts & Seeds - Tree Nuts, Peanuts',
      'Nuts & Seeds - Seeds (chia, flax, sunflower)',
      
      // Fats & Oils
      'Fats & Oils - Cooking Oils (olive, avocado)',
      'Fats & Oils - Animal Fats (lard, tallow)',
      
      // Condiments & Sauces
      'Condiments & Sauces - Mustards, Ketchups, Hot Sauces',
      'Condiments & Sauces - Marinades & Dressings',
      
      // Herbs & Spices
      'Herbs & Spices - Fresh Herbs (basil, cilantro)',
      'Herbs & Spices - Dried Spices & Blends',
      
      // Beverages
      'Beverages - Water, Tea, Coffee',
      'Beverages - Juices, Sodas, Alcohol',
      
      // Sweets & Snacks
      'Sweets & Snacks - Chocolate, Candy',
      'Sweets & Snacks - Chips, Crackers, Granola Bars',
      
      // Pantry & Canned Goods
      'Pantry & Canned Goods - Canned Vegetables, Beans',
      'Pantry & Canned Goods - Stocks & Broths, Vinegars',
      
      // Frozen Foods
      'Frozen Foods - Vegetables, Fruits, Prepared Meals',
      
      // Bakery
      'Bakery - Breads, Tortillas, Pastries'
    ];
  }
}

export default IngredientService; 