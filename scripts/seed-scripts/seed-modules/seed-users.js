const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function seedUsers() {
  console.log('👥 Seeding users...');
  
  // Create admin user
  const adminPasswordHash = await bcrypt.hash('demo', 12);
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@example.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      profile: {
        create: {
          firstName: 'Admin',
          lastName: 'User',
          activityLevel: 'MODERATELY_ACTIVE',
          dietaryPreferences: JSON.stringify(['VEGETARIAN']),
          calorieTarget: 2000,
          proteinTarget: 150,
          carbTarget: 200,
          fatTarget: 65,
          fiberTarget: 25,
          privacySettings: JSON.stringify({ leaderboardVisible: true })
        }
      },
      leaderboard: {
        create: {
          totalPoints: 1250,
          rank: 1
        }
      }
    }
  });

  // Create demo user
  const demoPasswordHash = await bcrypt.hash('demo', 12);
  const demoUser = await prisma.user.upsert({
    where: { username: 'demo' },
    update: {},
    create: {
      username: 'demo',
      email: 'demo@example.com',
      passwordHash: demoPasswordHash,
      role: 'USER',
      profile: {
        create: {
          firstName: 'Demo',
          lastName: 'User',
          dateOfBirth: new Date('1990-01-01'),
          gender: 'OTHER',
          height: 175,
          weight: 70,
          targetWeight: 68,
          activityLevel: 'MODERATELY_ACTIVE',
          dietaryPreferences: JSON.stringify(['GLUTEN_FREE']),
          calorieTarget: 1800,
          proteinTarget: 120,
          carbTarget: 180,
          fatTarget: 60,
          fiberTarget: 25,
          privacySettings: JSON.stringify({ leaderboardVisible: true })
        }
      },
      leaderboard: {
        create: {
          totalPoints: 850,
          rank: 2
        }
      }
    }
  });

  // Create test user
  const testPasswordHash = await bcrypt.hash('test', 12);
  const testUser = await prisma.user.upsert({
    where: { username: 'test' },
    update: {},
    create: {
      username: 'test',
      email: 'test@example.com',
      passwordHash: testPasswordHash,
      role: 'USER',
      profile: {
        create: {
          firstName: 'Test',
          lastName: 'User',
          dateOfBirth: new Date('1985-05-15'),
          gender: 'MALE',
          height: 180,
          weight: 75,
          targetWeight: 72,
          activityLevel: 'VERY_ACTIVE',
          dietaryPreferences: JSON.stringify(['KETO']),
          calorieTarget: 2200,
          proteinTarget: 180,
          carbTarget: 50,
          fatTarget: 150,
          fiberTarget: 30,
          privacySettings: JSON.stringify({ leaderboardVisible: false })
        }
      },
      leaderboard: {
        create: {
          totalPoints: 650,
          rank: 3
        }
      }
    }
  });

  console.log(`✅ Created users: ${adminUser.username}, ${demoUser.username}, ${testUser.username}`);
  return { adminUser, demoUser, testUser };
}

async function seedUserDetails() {
  console.log('📋 Seeding user details...');
  
  const users = await prisma.user.findMany({
    include: { profile: true }
  });
  
  for (const user of users) {
    await prisma.profile.update({
      where: { userId: user.id },
      data: {
        // Health Metrics
        bodyFatPercentage: 15,
        muscleMass: 55,
        bmi: 24.2,
        bloodType: 'O+',
        
        // Medical Information
        allergies: JSON.stringify(['Peanuts', 'Shellfish']),
        medications: JSON.stringify(['Vitamin D', 'Omega-3']),
        medicalConditions: JSON.stringify(['Asthma']),
        disabilities: JSON.stringify(['Mild knee injury']),
        
        // Exercise & Mobility
        exerciseLimitations: JSON.stringify(['Avoid high impact on knees']),
        mobilityIssues: JSON.stringify(['Slight stiffness in morning']),
        injuryHistory: JSON.stringify(['ACL reconstruction 2018']),
        
        // Lifestyle
        sleepQuality: 'GOOD',
        stressLevel: 'MODERATE',
        smokingStatus: 'NEVER',
        alcoholConsumption: 'LIGHT',
        
        // Goals
        fitnessGoals: JSON.stringify(['Build muscle', 'Improve endurance']),
        dietaryGoals: JSON.stringify(['Increase protein', 'Reduce processed foods']),
        weightGoals: JSON.stringify(['Maintain current weight', 'Build muscle'])
      }
    });
  }
  
  console.log('✅ User details seeded successfully');
}

async function main() {
  try {
    await seedUsers();
    await seedUserDetails();
    console.log('🎉 User seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during user seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { seedUsers, seedUserDetails }; 