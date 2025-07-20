const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPepper() {
  try {
    const spices = await prisma.ingredient.findMany({
      where: {
        name: {
          contains: 'spices'
        }
      },
      select: {
        name: true
      }
    });
    
    console.log('Spices ingredients found:');
    spices.forEach(s => console.log(`- ${s.name}`));
    
    const pepper = await prisma.ingredient.findMany({
      where: {
        name: {
          contains: 'pepper'
        }
      },
      select: {
        name: true
      }
    });
    
    console.log('\nPepper ingredients found:');
    pepper.forEach(p => console.log(`- ${p.name}`));
    
    const black = await prisma.ingredient.findMany({
      where: {
        name: {
          contains: 'black'
        }
      },
      select: {
        name: true
      }
    });
    
    console.log('\nBlack ingredients found:');
    black.forEach(b => console.log(`- ${b.name}`));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPepper(); 