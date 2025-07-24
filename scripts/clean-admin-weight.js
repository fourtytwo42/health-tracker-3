const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanAdminWeight() {
  console.log('🧹 Cleaning admin user weight biomarkers...');
  
  try {
    // First, let's find the admin user
    const adminUser = await prisma.user.findUnique({
      where: { username: 'admin' },
      select: { id: true, username: true }
    });

    if (!adminUser) {
      console.log('❌ Admin user not found!');
      return;
    }

    console.log(`✅ Found admin user: ${adminUser.username} (ID: ${adminUser.id})`);

    // Count existing weight biomarkers for admin
    const weightBiomarkersCount = await prisma.biomarker.count({
      where: {
        userId: adminUser.id,
        type: 'WEIGHT'
      }
    });

    console.log(`📊 Found ${weightBiomarkersCount} weight biomarkers for admin user`);

    if (weightBiomarkersCount === 0) {
      console.log('✅ No weight biomarkers to remove!');
      return;
    }

    // Show some sample weight entries before deletion
    const sampleWeightEntries = await prisma.biomarker.findMany({
      where: {
        userId: adminUser.id,
        type: 'WEIGHT'
      },
      select: {
        id: true,
        value: true,
        unit: true,
        loggedAt: true
      },
      take: 5,
      orderBy: { loggedAt: 'desc' }
    });

    console.log('\n📋 Sample weight entries to be removed:');
    sampleWeightEntries.forEach(entry => {
      console.log(`  - ${entry.value} ${entry.unit} (${entry.loggedAt.toLocaleDateString()})`);
    });

    if (weightBiomarkersCount > 5) {
      console.log(`  ... and ${weightBiomarkersCount - 5} more entries`);
    }

    // Delete all weight biomarkers for admin user
    const deleteResult = await prisma.biomarker.deleteMany({
      where: {
        userId: adminUser.id,
        type: 'WEIGHT'
      }
    });

    console.log(`\n✅ Successfully removed ${deleteResult.count} weight biomarkers for admin user`);
    console.log('🎉 Admin user weight data has been cleaned!');

  } catch (error) {
    console.error('❌ Error cleaning admin weight biomarkers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
cleanAdminWeight()
  .then(() => {
    console.log('\n🏁 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  }); 