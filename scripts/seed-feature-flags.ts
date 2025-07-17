import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedFeatureFlags() {
  console.log('🌱 Seeding feature flags and settings...');

  try {
    // Default feature flags
    const featureFlags = [
      {
        key: 'leaderboard',
        name: 'Leaderboard System',
        description: 'Enable gamification and leaderboard features',
        enabled: true,
        rolloutPercentage: 100
      },
      {
        key: 'grocery_pdf',
        name: 'Grocery List PDF Export',
        description: 'Enable PDF export for grocery lists',
        enabled: true,
        rolloutPercentage: 100
      },
      {
        key: 'biomarker_photos',
        name: 'Biomarker Photo Upload',
        description: 'Enable photo upload for biomarker logging',
        enabled: true,
        rolloutPercentage: 100
      },
      {
        key: 'advanced_analytics',
        name: 'Advanced Analytics',
        description: 'Enable advanced health analytics and insights',
        enabled: false,
        rolloutPercentage: 25
      },
      {
        key: 'social_features',
        name: 'Social Features',
        description: 'Enable social sharing and community features',
        enabled: false,
        rolloutPercentage: 0
      },
      {
        key: 'ai_coaching',
        name: 'AI Coaching',
        description: 'Enable AI-powered coaching and recommendations',
        enabled: true,
        rolloutPercentage: 50
      },
      {
        key: 'meal_planning_v2',
        name: 'Enhanced Meal Planning',
        description: 'Enable enhanced meal planning with dietary restrictions',
        enabled: false,
        rolloutPercentage: 10
      }
    ];

    // Default settings
    const settings = [
      {
        key: 'llm_router_latency_weight',
        value: '0.7',
        description: 'Weight for latency in LLM provider selection (0-1)'
      },
      {
        key: 'llm_router_cost_weight',
        value: '0.3',
        description: 'Weight for cost in LLM provider selection (0-1)'
      },
      {
        key: 'llm_router_providers',
        value: JSON.stringify({
          ollama: { enabled: true, priority: 1 },
          groq: { enabled: true, priority: 2 },
          openai: { enabled: true, priority: 3 },
          anthropic: { enabled: true, priority: 4 },
          aws: { enabled: false, priority: 5 },
          azure: { enabled: false, priority: 6 }
        }),
        description: 'LLM provider configuration'
      },
      {
        key: 'max_meal_plans_per_user',
        value: '10',
        description: 'Maximum number of meal plans a user can have active'
      },
      {
        key: 'max_goals_per_user',
        value: '5',
        description: 'Maximum number of active goals per user'
      },
      {
        key: 'leaderboard_points_meal',
        value: '10',
        description: 'Points awarded for logging a meal'
      },
      {
        key: 'leaderboard_points_activity',
        value: '15',
        description: 'Points awarded for logging an activity'
      },
      {
        key: 'leaderboard_points_biomarker',
        value: '5',
        description: 'Points awarded for logging a biomarker'
      },
      {
        key: 'leaderboard_points_weight_loss',
        value: '50',
        description: 'Points awarded per kg of weight loss'
      },
      {
        key: 'cache_ttl_minutes',
        value: '300',
        description: 'Cache TTL in minutes for feature flags and settings'
      },
      {
        key: 'max_photo_size_mb',
        value: '5',
        description: 'Maximum photo file size in MB for biomarker uploads'
      },
      {
        key: 'default_calorie_target',
        value: '2000',
        description: 'Default daily calorie target for new users'
      },
      {
        key: 'default_protein_target',
        value: '150',
        description: 'Default daily protein target in grams for new users'
      },
      {
        key: 'default_carb_target',
        value: '200',
        description: 'Default daily carb target in grams for new users'
      },
      {
        key: 'default_fat_target',
        value: '65',
        description: 'Default daily fat target in grams for new users'
      },
      {
        key: 'default_fiber_target',
        value: '25',
        description: 'Default daily fiber target in grams for new users'
      }
    ];

    // Upsert feature flags
    for (const flag of featureFlags) {
      await prisma.featureFlag.upsert({
        where: { key: flag.key },
        update: {
          name: flag.name,
          description: flag.description,
          enabled: flag.enabled,
          rolloutPercentage: flag.rolloutPercentage,
          updatedAt: new Date()
        },
        create: flag
      });
      console.log(`✅ Feature flag "${flag.name}" upserted`);
    }

    // Upsert settings
    for (const setting of settings) {
      await prisma.setting.upsert({
        where: { key: setting.key },
        update: {
          value: setting.value,
          description: setting.description,
          updatedAt: new Date()
        },
        create: setting
      });
      console.log(`✅ Setting "${setting.key}" upserted`);
    }

    console.log('🎉 Feature flags and settings seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding feature flags and settings:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedFeatureFlags()
  .then(() => {
    console.log('✅ Seed completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }); 