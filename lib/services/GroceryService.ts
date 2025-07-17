import { BaseService } from './BaseService';

export interface GroceryListOptions {
  includeSnacks?: boolean;
  format?: 'json' | 'pdf';
}

export interface GroceryItem {
  name: string;
  quantity: number;
  unit: string;
  aisle: string;
  checked: boolean;
}

export interface GroceryList {
  id: string;
  userId: string;
  items: GroceryItem[];
  totalItems: number;
  createdAt: Date;
  planIds: string[];
}

export class GroceryService extends BaseService {
  async generateGroceryList(
    userId: string,
    planIds: string[],
    options: GroceryListOptions = {}
  ): Promise<GroceryList> {
    try {
      const { includeSnacks = true, format = 'json' } = options;

      // For now, create a sample grocery list
      // TODO: Implement actual meal plan ingredient aggregation
      const allIngredients: Record<string, { quantity: number; unit: string; aisle: string }> = {
        'chicken breast': { quantity: 2, unit: 'lbs', aisle: 'Meat & Seafood' },
        'broccoli': { quantity: 1, unit: 'head', aisle: 'Produce' },
        'brown rice': { quantity: 1, unit: 'bag', aisle: 'Pantry' },
        'greek yogurt': { quantity: 2, unit: 'containers', aisle: 'Dairy & Eggs' },
      };

      // Convert to grocery items
      const items: GroceryItem[] = Object.entries(allIngredients).map(([name, data]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        quantity: data.quantity,
        unit: data.unit,
        aisle: data.aisle,
        checked: false,
      }));

      // Add snacks if requested
      if (includeSnacks) {
        const snackItems = await this.getDefaultSnacks();
        items.push(...snackItems);
      }

      // Save to database
      const groceryList = await this.prisma.groceryList.create({
        data: {
          userId,
          title: 'Grocery List',
          items: items as any,
          totalItems: items.length,
        },
      });

      // Award points for creating grocery list
      await this.awardPoints(userId, 'grocery_list_created', 5);

      return {
        id: groceryList.id,
        userId,
        items,
        totalItems: items.length,
        createdAt: groceryList.createdAt,
        planIds: planIds,
      };
    } catch (error) {
      console.error('Error generating grocery list:', error);
      throw new Error('Failed to generate grocery list');
    }
  }

  async getGroceryListHistory(userId: string, limit: number = 10): Promise<GroceryList[]> {
    try {
      const lists = await this.prisma.groceryList.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return lists.map(list => ({
        id: list.id,
        userId: list.userId,
        items: list.items as unknown as GroceryItem[],
        totalItems: list.totalItems,
        createdAt: list.createdAt,
        planIds: [],
      }));
    } catch (error) {
      console.error('Error fetching grocery list history:', error);
      throw new Error('Failed to fetch grocery list history');
    }
  }

  private async getAisleForIngredient(ingredientName: string): Promise<string> {
    try {
      const taxonomy = await this.prisma.ingredientTaxonomy.findFirst({
        where: {
          name: {
            contains: ingredientName.toLowerCase(),
            mode: 'insensitive',
          },
        },
      });

      return taxonomy?.aisle || 'Other';
    } catch (error) {
      return 'Other';
    }
  }

  private groupByAisle(items: GroceryItem[]): Record<string, GroceryItem[]> {
    return items.reduce((acc, item) => {
      if (!acc[item.aisle]) {
        acc[item.aisle] = [];
      }
      acc[item.aisle].push(item);
      return acc;
    }, {} as Record<string, GroceryItem[]>);
  }

  private async getDefaultSnacks(): Promise<GroceryItem[]> {
    return [
      { name: 'Apples', quantity: 6, unit: 'pieces', aisle: 'Produce', checked: false },
      { name: 'Carrots', quantity: 1, unit: 'bag', aisle: 'Produce', checked: false },
      { name: 'Hummus', quantity: 1, unit: 'container', aisle: 'Dairy & Eggs', checked: false },
      { name: 'Almonds', quantity: 1, unit: 'bag', aisle: 'Snacks', checked: false },
    ];
  }
} 