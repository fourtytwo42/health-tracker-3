import { PrismaClient } from '@prisma/client';
import { seedUsdaIngredients } from './seed-usda-ingredients.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Seed USDA ingredients first
  console.log('\n=== Seeding USDA Ingredients ===');
  await seedUsdaIngredients();

  // Seed other data (users, system messages, etc.)
  console.log('\n=== Seeding Other Data ===');
  
  // Add your existing seeding logic here
  // For example:
  // await seedUsers();
  // await seedSystemMessages();
  // etc.

  console.log('\nDatabase seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 