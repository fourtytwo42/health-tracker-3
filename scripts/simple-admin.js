const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

console.log('Starting admin user creation...');

const prisma = new PrismaClient();

async function main() {
  console.log('Checking for existing admin user...');
  
  const existingUser = await prisma.user.findUnique({
    where: { username: 'admin' }
  });

  if (existingUser) {
    console.log('Admin user already exists!');
    return;
  }

  console.log('Creating admin user...');
  
  const passwordHash = await bcrypt.hash('demo', 12);
  
  const adminUser = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@example.com',
      passwordHash: passwordHash,
      role: 'ADMIN'
    }
  });

  console.log('Admin user created successfully!');
  console.log('Username: admin');
  console.log('Password: demo');
  console.log('User ID:', adminUser.id);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect()); 