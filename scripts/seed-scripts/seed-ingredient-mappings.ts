import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ingredientMappings = [
  // Salt and variants
  { keyword: 'salt', ingredientName: 'salt, table, iodized' },
  { keyword: 'Salt', ingredientName: 'salt, table, iodized' },
  { keyword: 'SALT', ingredientName: 'salt, table, iodized' },
  { keyword: 'table salt', ingredientName: 'salt, table, iodized' },
  { keyword: 'sea salt', ingredientName: 'salt, table, iodized' },
  { keyword: 'kosher salt', ingredientName: 'salt, table, iodized' },
  
  // Pepper and variants
  { keyword: 'pepper', ingredientName: 'spices, pepper, black' },
  { keyword: 'Pepper', ingredientName: 'spices, pepper, black' },
  { keyword: 'PEPPER', ingredientName: 'spices, pepper, black' },
  { keyword: 'black pepper', ingredientName: 'spices, pepper, black' },
  { keyword: 'Black Pepper', ingredientName: 'spices, pepper, black' },
  { keyword: 'BLACK PEPPER', ingredientName: 'spices, pepper, black' },
  { keyword: 'ground black pepper', ingredientName: 'spices, pepper, black' },
  { keyword: 'fresh ground black pepper', ingredientName: 'spices, pepper, black' },
  
  // Salt and Pepper combinations
  { keyword: 'salt and pepper', ingredientName: 'salt, table, iodized' },
  { keyword: 'Salt and Pepper', ingredientName: 'salt, table, iodized' },
  { keyword: 'SALT AND PEPPER', ingredientName: 'salt, table, iodized' },
  
  // Wine variants
  { keyword: 'white wine', ingredientName: 'beverages, wine, table, white' },
  { keyword: 'White Wine', ingredientName: 'beverages, wine, table, white' },
  { keyword: 'WHITE WINE', ingredientName: 'beverages, wine, table, white' },
  { keyword: 'red wine', ingredientName: 'alcoholic beverage, wine, table, red' },
  { keyword: 'Red Wine', ingredientName: 'alcoholic beverage, wine, table, red' },
  { keyword: 'RED WINE', ingredientName: 'alcoholic beverage, wine, table, red' },
  { keyword: 'wine', ingredientName: 'alcoholic beverage, wine, table, red' },
  { keyword: 'Wine', ingredientName: 'alcoholic beverage, wine, table, red' },
  { keyword: 'WINE', ingredientName: 'alcoholic beverage, wine, table, red' },
  
  // Pork variants
  { keyword: 'pork chops', ingredientName: 'pork, fresh, loin, center loin (chops), bone-in, separable lean and fat, raw' },
  { keyword: 'Pork Chops', ingredientName: 'pork, fresh, loin, center loin (chops), bone-in, separable lean and fat, raw' },
  { keyword: 'PORK CHOPS', ingredientName: 'pork, fresh, loin, center loin (chops), bone-in, separable lean and fat, raw' },
  
  // Herbs and spices
  { keyword: 'thyme', ingredientName: 'spices, thyme, dried' },
  { keyword: 'Thyme', ingredientName: 'spices, thyme, dried' },
  { keyword: 'THYME', ingredientName: 'spices, thyme, dried' },
  { keyword: 'fresh thyme', ingredientName: 'spices, thyme, dried' },
  { keyword: 'rosemary', ingredientName: 'spices, rosemary, dried' },
  { keyword: 'Rosemary', ingredientName: 'spices, rosemary, dried' },
  { keyword: 'ROSEMARY', ingredientName: 'spices, rosemary, dried' },
  { keyword: 'fresh rosemary', ingredientName: 'spices, rosemary, dried' },
  
  // Citrus
  { keyword: 'lemon', ingredientName: 'lemon juice, raw' },
  { keyword: 'Lemon', ingredientName: 'lemon juice, raw' },
  { keyword: 'LEMON', ingredientName: 'lemon juice, raw' },
  
  // Ginger
  { keyword: 'ginger paste', ingredientName: 'ginger root, raw' },
  { keyword: 'ginger', ingredientName: 'ginger root, raw' },
  { keyword: 'fresh ginger', ingredientName: 'ginger root, raw' },
  
  // Beef variants
  { keyword: 'beef strips', ingredientName: 'beef, loin, top loin steak, boneless, lip off, separable lean only, trimmed to 0" fat, select, raw' },
  { keyword: 'beef strip', ingredientName: 'beef, loin, top loin steak, boneless, lip off, separable lean only, trimmed to 0" fat, select, raw' },
  { keyword: 'beef', ingredientName: 'beef, ground, 80% lean meat / 20% fat, raw' },
  { keyword: 'beef striploin', ingredientName: 'beef, loin, top loin steak, boneless, lip off, separable lean only, trimmed to 0" fat, select, raw' },
  { keyword: 'beef steak', ingredientName: 'beef, raw' },
  { keyword: 'strip steak', ingredientName: 'beef, grass-fed, strip steaks, lean only, raw' },
  { keyword: 'steak', ingredientName: 'beef, grass-fed, strip steaks, lean only, raw' },
  { keyword: 'ground beef', ingredientName: 'beef, ground, 80% lean meat / 20% fat, raw' },
  
  // Noodles and pasta
  { keyword: 'egg noodles', ingredientName: 'noodles, egg, cooked, enriched, with added salt' },
  { keyword: 'noodles', ingredientName: 'noodles, egg, cooked, enriched, with added salt' },
  
  // Cheese variants
  { keyword: 'parmesan cheese', ingredientName: 'cheese, parmesan, grated' },
  { keyword: 'parmesan', ingredientName: 'cheese, parmesan, grated' },
  { keyword: 'cheddar cheese', ingredientName: 'cheese, cheddar' },
  { keyword: 'Cheddar Cheese', ingredientName: 'cheese, cheddar' },
  { keyword: 'cheddar', ingredientName: 'cheese, cheddar' },
  { keyword: 'cheese', ingredientName: 'cheese, cheddar' },
  { keyword: 'cream cheese', ingredientName: 'cheese, cream' },
  
  // Cream variants
  { keyword: 'heavy cream', ingredientName: 'cream, fluid, heavy whipping' },
  { keyword: 'whipping cream', ingredientName: 'cream, fluid, heavy whipping' },
  { keyword: 'whipped cream', ingredientName: 'cream, whipped, cream topping, pressurized' },
  { keyword: 'sour cream', ingredientName: 'cream, sour, cultured' },
  
  // Vegetables
  { keyword: 'zucchini', ingredientName: 'squash, summer, green, zucchini, includes skin, raw' },
  { keyword: 'onions', ingredientName: 'onions, red, raw' },
  { keyword: 'Onions', ingredientName: 'onions, red, raw' },
  { keyword: 'onion', ingredientName: 'onions, red, raw' },
  { keyword: 'spinach', ingredientName: 'spinach, baby' },
  { keyword: 'Spinach', ingredientName: 'spinach, baby' },
  { keyword: 'mushrooms', ingredientName: 'mushrooms, white, raw' },
  { keyword: 'button mushrooms', ingredientName: 'mushrooms, white button' },
  { keyword: 'mushroom', ingredientName: 'mushrooms, white, raw' },
  { keyword: 'bell peppers', ingredientName: 'peppers, sweet, green, raw' },
  { keyword: 'Bell Peppers', ingredientName: 'peppers, sweet, green, raw' },
  { keyword: 'bell pepper', ingredientName: 'peppers, sweet, green, raw' },
  { keyword: 'broccoli', ingredientName: 'broccoli, raw' },
  { keyword: 'tomato', ingredientName: 'tomatoes, red, ripe, raw, year round average' },
  { keyword: 'tomatoes', ingredientName: 'tomatoes, red, ripe, raw, year round average' },
  
  // Dairy and fats
  { keyword: 'butter', ingredientName: 'butter, salted' },
  { keyword: 'unsalted butter', ingredientName: 'butter, stick, unsalted' },
  { keyword: 'unsalted butter, melted', ingredientName: 'butter, stick, unsalted' },
  
  // Fish
  { keyword: 'salmon', ingredientName: 'fish, salmon, pink, raw' },
  { keyword: 'salmon fillets', ingredientName: 'fish, salmon, raw' },
  
  // Grains
  { keyword: 'quinoa', ingredientName: 'quinoa, cooked' },
  
  // Herbs and spices
  { keyword: 'dill', ingredientName: 'spices, dill weed, dried' },
  
  // Meat
  { keyword: 'bacon', ingredientName: 'pork, bacon, rendered fat, cooked' },
  
  // Bread variants
  { keyword: 'whole wheat bread', ingredientName: 'bread, whole-wheat, commercially prepared' },
  { keyword: 'bread', ingredientName: 'bread, whole-wheat, commercially prepared' },
  { keyword: 'white bread', ingredientName: 'bread, white, commercially prepared' },
  { keyword: 'sourdough bread', ingredientName: 'bread, white, commercially prepared' },
  
  // Potatoes
  { keyword: 'mashed potatoes', ingredientName: 'potatoes, mashed, home-prepared, whole milk and butter added' },
  
  // Beverages
  { keyword: 'almond milk', ingredientName: 'beverages, almond milk, unsweetened, shelf stable' },
  
  // Sweeteners
  { keyword: 'granulated sugar', ingredientName: 'sugars, granulated' },
  { keyword: 'sugar', ingredientName: 'sugars, granulated' },
  { keyword: 'brown sugar', ingredientName: 'sugars, brown' },
  { keyword: 'light brown sugar', ingredientName: 'sugars, brown' },
  { keyword: 'dark brown sugar', ingredientName: 'sugars, brown' },
  { keyword: 'maple syrup', ingredientName: 'syrups, maple' },
  
  // Eggs
  { keyword: 'large eggs', ingredientName: 'eggs, grade a, large, egg white' },
  { keyword: 'eggs', ingredientName: 'eggs, grade a, large, egg white' },
  
  // Dairy
  { keyword: 'buttermilk', ingredientName: 'buttermilk, low fat' },
  { keyword: 'greek yogurt', ingredientName: 'yogurt, greek, plain, nonfat' },
  
  // Nuts
  { keyword: 'pecans', ingredientName: 'nuts, pecans, halves, raw' },
  
  // Extracts and flavorings
  { keyword: 'pure vanilla extract', ingredientName: 'vanilla extract' },
  { keyword: 'vanilla extract', ingredientName: 'vanilla extract' },
  
  // Chocolate
  { keyword: 'cocoa powder', ingredientName: 'cocoa, dry powder, unsweetened' },
  { keyword: 'unsweetened cocoa powder', ingredientName: 'cocoa, dry powder, unsweetened' },
  { keyword: 'chocolate chips', ingredientName: 'chocolate, dark, 45-59% cacao solids' },
  { keyword: 'dark chocolate chips', ingredientName: 'chocolate, dark, 45-59% cacao solids' },
  
  // Ice cream
  { keyword: 'vanilla ice cream', ingredientName: 'ice creams, vanilla' },
  { keyword: 'ice cream', ingredientName: 'ice creams, vanilla' },
  
  // Tortillas
  { keyword: 'large flour tortillas', ingredientName: 'tortillas, ready-to-bake or -fry, flour' },
  { keyword: 'whole wheat tortillas', ingredientName: 'tortillas, ready-to-bake or -fry, corn, without added salt' },
  
  // Sauces
  { keyword: 'salsa', ingredientName: 'sauce, salsa, ready-to-serve' },
  
  // Flour
  { keyword: 'flour', ingredientName: 'flour, wheat, all-purpose, enriched, bleached' },
  { keyword: 'all-purpose flour', ingredientName: 'flour, wheat, all-purpose, enriched, bleached' },
  
  // Chicken
  { keyword: 'boneless chicken breast', ingredientName: 'chicken, broiler or fryers, breast, skinless, boneless, meat only, cooked, braised' },
  { keyword: 'chicken breast', ingredientName: 'chicken, broiler or fryers, breast, skinless, boneless, meat only, cooked, braised' },
  
  // Seasonings
  { keyword: 'fajita seasoning', ingredientName: 'spices, poultry seasoning' },
  
  // Oils and fats
  { keyword: 'olive oil', ingredientName: 'olive oil' },
  { keyword: 'tahini', ingredientName: 'tahini' },
  
  // Garlic
  { keyword: 'garlic', ingredientName: 'garlic, raw' },
  { keyword: 'lemon juice', ingredientName: 'lemon juice, 100%, ns as to form' },
];

async function seedIngredientMappings() {
  console.log('🌱 Seeding ingredient mappings...');
  
  let createdCount = 0;
  let skippedCount = 0;
  
  for (const mapping of ingredientMappings) {
    try {
      // Find the ingredient by name
      const ingredient = await prisma.ingredient.findFirst({
        where: { name: mapping.ingredientName, isActive: true }
      });
      
      if (!ingredient) {
        console.log(`⚠️  Ingredient not found: ${mapping.ingredientName}`);
        skippedCount++;
        continue;
      }
      
      // Check if mapping already exists
      const existingMapping = await prisma.ingredientMapping.findUnique({
        where: { keyword: mapping.keyword }
      });
      
      if (existingMapping) {
        console.log(`⏭️  Mapping already exists: ${mapping.keyword} → ${mapping.ingredientName}`);
        skippedCount++;
        continue;
      }
      
      // Create the mapping
      await prisma.ingredientMapping.create({
        data: {
          keyword: mapping.keyword,
          ingredientId: ingredient.id
        }
      });
      
      console.log(`✅ Created mapping: ${mapping.keyword} → ${mapping.ingredientName}`);
      createdCount++;
      
    } catch (error) {
      console.error(`❌ Error creating mapping for ${mapping.keyword}:`, error);
      skippedCount++;
    }
  }
  
  console.log(`\n🎉 Seeding complete!`);
  console.log(`✅ Created: ${createdCount} mappings`);
  console.log(`⏭️  Skipped: ${skippedCount} mappings`);
}

async function main() {
  try {
    await seedIngredientMappings();
  } catch (error) {
    console.error('❌ Error seeding ingredient mappings:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 