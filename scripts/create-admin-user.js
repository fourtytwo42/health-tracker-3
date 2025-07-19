const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createAdminUser() {
  console.log('Script starting...');
  try {
    console.log('Creating admin user...');
    
    // Check if admin user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username: 'admin' }
    });

    if (existingUser) {
      console.log('Admin user already exists!');
      return;
    }

    // Hash the password
    const passwordHash = await bcrypt.hash('demo', 10);

    // Create admin user
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

  } catch (error) {
    console.error('Error creating admin user:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser(); 