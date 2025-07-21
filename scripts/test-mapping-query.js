const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testMappingQuery() {
  try {
    console.log('Testing the exact database mapping query used in recipe generation...\n');
    
    const testIngredients = ['Salt', 'Pepper', 'salt', 'pepper'];
    
    for (const ingredientName of testIngredients) {
      console.log(`\n🔍 Testing query for "${ingredientName}":`);
      
      const dbMapping = await prisma.ingredientMapping.findFirst({
        where: {
          OR: [
            { keyword: ingredientName },
            { keyword: ingredientName.toLowerCase() }
          ],
          isActive: true
        },
        include: {
          ingredient: true
        }
      });
      
      console.log(`  Result: ${dbMapping ? `FOUND → ${dbMapping.ingredient.name}` : 'NOT FOUND'}`);
      
      if (dbMapping) {
        console.log(`  Mapping details: keyword="${dbMapping.keyword}", isActive=${dbMapping.isActive}`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testMappingQuery(); 