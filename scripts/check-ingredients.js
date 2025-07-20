const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkIngredients() {
  console.log('Checking ingredient nutrition data...\n');

  // Check potatoes
  const potatoes = await prisma.ingredient.findMany({
    where: { name: { contains: 'potato' } },
    take: 3
  });
  console.log('Potatoes found:', potatoes.length);
  potatoes.forEach(p => {
    console.log(`- ${p.name}: ${p.calories} cal, ${p.protein}g protein, ${p.carbs}g carbs, ${p.fat}g fat`);
  });

  // Check brussels sprouts
  const brussels = await prisma.ingredient.findMany({
    where: { name: { contains: 'brussels' } },
    take: 3
  });
  console.log('\nBrussels sprouts found:', brussels.length);
  brussels.forEach(b => {
    console.log(`- ${b.name}: ${b.calories} cal, ${b.protein}g protein, ${b.carbs}g carbs, ${b.fat}g fat`);
  });

  // Check chicken
  const chicken = await prisma.ingredient.findMany({
    where: { name: { contains: 'chicken' } },
    take: 3
  });
  console.log('\nChicken found:', chicken.length);
  chicken.forEach(c => {
    console.log(`- ${c.name}: ${c.calories} cal, ${c.protein}g protein, ${c.carbs}g carbs, ${c.fat}g fat`);
  });

  // Check some ingredients with 0 calories
  const zeroCal = await prisma.ingredient.findMany({
    where: { calories: 0 },
    take: 5
  });
  console.log('\nIngredients with 0 calories (first 5):');
  zeroCal.forEach(z => {
    console.log(`- ${z.name}: ${z.calories} cal`);
  });

  await prisma.$disconnect();
}

checkIngredients().catch(console.error); 