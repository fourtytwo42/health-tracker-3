const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkIngredients() {
  try {
    // Check bell peppers
    const bellPeppers = await prisma.ingredient.findMany({
      where: {
        name: {
          contains: 'peppers, sweet'
        }
      },
      select: {
        name: true,
        category: true
      }
    });
    
    console.log('Bell peppers found:');
    bellPeppers.forEach(p => console.log(`- ${p.name} (${p.category})`));
    
    // Check onions
    const onions = await prisma.ingredient.findMany({
      where: {
        name: {
          contains: 'onions'
        }
      },
      select: {
        name: true,
        category: true
      }
    });
    
    console.log('\nOnions found:');
    onions.forEach(o => console.log(`- ${o.name} (${o.category})`));
    
    // Check zucchini
    const zucchini = await prisma.ingredient.findMany({
      where: {
        name: {
          contains: 'zucchini'
        }
      },
      select: {
        name: true,
        category: true
      }
    });
    
    console.log('\nZucchini found:');
    zucchini.forEach(z => console.log(`- ${z.name} (${z.category})`));
    
    // Check tahini
    const tahini = await prisma.ingredient.findMany({
      where: {
        name: {
          contains: 'tahini'
        }
      },
      select: {
        name: true,
        category: true
      }
    });
    
    console.log('\nTahini found:');
    tahini.forEach(t => console.log(`- ${t.name} (${t.category})`));
    
    // Check greek yogurt
    const greekYogurt = await prisma.ingredient.findMany({
      where: {
        name: {
          contains: 'yogurt, greek'
        }
      },
      select: {
        name: true,
        category: true
      }
    });
    
    console.log('\nGreek yogurt found:');
    greekYogurt.forEach(y => console.log(`- ${y.name} (${y.category})`));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkIngredients(); 