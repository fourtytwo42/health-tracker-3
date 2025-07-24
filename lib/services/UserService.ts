import { BaseService } from './BaseService';
import { z } from 'zod';

const UpdateProfileSchema = z.object({
  // Basic Information
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  dateOfBirth: z.string().optional(), // ISO date string
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
  
  // Health Metrics
  height: z.number().min(50).max(300).optional(), // in cm
  weight: z.number().min(20).max(500).optional(), // in kg
  targetWeight: z.number().min(20).max(500).optional(), // in kg
  bodyFatPercentage: z.number().min(0).max(100).optional(),
  muscleMass: z.number().min(0).max(500).optional(), // in kg
  bmi: z.number().min(10).max(100).optional(),
  bloodType: z.string().optional(),
  
  // Medical Information
  allergies: z.string().optional(),
  medications: z.string().optional(),
  medicalConditions: z.string().optional(),
  disabilities: z.string().optional(),
  
  // Exercise & Mobility
  exerciseLimitations: z.string().optional(),
  mobilityIssues: z.string().optional(),
  injuryHistory: z.string().optional(),
  activityLevel: z.enum(['SEDENTARY', 'LIGHTLY_ACTIVE', 'MODERATELY_ACTIVE', 'VERY_ACTIVE', 'EXTREMELY_ACTIVE']).optional(),
  
  // Lifestyle
  sleepQuality: z.string().optional(),
  stressLevel: z.string().optional(),
  smokingStatus: z.string().optional(),
  alcoholConsumption: z.string().optional(),
  
  // Goals
  fitnessGoals: z.string().optional(),
  dietaryGoals: z.string().optional(),
  weightGoals: z.string().optional(),
  
  // Nutrition
  dietaryPreferences: z.array(z.string()).optional(),
  calorieTarget: z.number().min(500).max(5000).optional(),
  proteinTarget: z.number().min(0).max(500).optional(), // in grams
  carbTarget: z.number().min(0).max(1000).optional(), // in grams
  fatTarget: z.number().min(0).max(200).optional(), // in grams
  fiberTarget: z.number().min(0).max(100).optional(), // in grams
  
  // Settings
  privacySettings: z.object({
    showInLeaderboard: z.boolean().optional(),
    shareProgress: z.boolean().optional(),
    allowNotifications: z.boolean().optional(),
  }).optional(),
});

export class UserService extends BaseService {
  async getUserProfile(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: true,
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Parse JSON strings back to objects/arrays
      if (user.profile) {
        try {
          if (user.profile.dietaryPreferences) {
            user.profile.dietaryPreferences = JSON.parse(user.profile.dietaryPreferences);
          }
          if (user.profile.privacySettings) {
            user.profile.privacySettings = JSON.parse(user.profile.privacySettings);
          }
        } catch (parseError) {
          console.error('Error parsing profile JSON fields:', parseError);
        }
      }

      return user;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw new Error('Failed to fetch user profile');
    }
  }

  async updateUserProfile(userId: string, profileData: z.infer<typeof UpdateProfileSchema>) {
    const validatedData = UpdateProfileSchema.parse(profileData);
    
    try {
      // Prepare data for database
      const dbData = {
        ...validatedData,
        dateOfBirth: validatedData.dateOfBirth ? new Date(validatedData.dateOfBirth) : undefined,
        // Convert arrays to JSON strings for storage
        dietaryPreferences: validatedData.dietaryPreferences ? JSON.stringify(validatedData.dietaryPreferences) : undefined,
        privacySettings: validatedData.privacySettings ? JSON.stringify(validatedData.privacySettings) : undefined,
      };

      // Check if profile exists
      const existingProfile = await this.prisma.profile.findUnique({
        where: { userId },
      });

      if (existingProfile) {
        // Update existing profile
        const updatedProfile = await this.prisma.profile.update({
          where: { userId },
          data: dbData,
        });
        return updatedProfile;
      } else {
        // Create new profile
        const newProfile = await this.prisma.profile.create({
          data: {
            userId,
            ...dbData,
          },
        });
        return newProfile;
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw new Error('Failed to update user profile');
    }
  }

  async getUserStats(userId: string) {
    try {
      const mealCount = await this.prisma.meal.count({
        where: { userId },
      });

      const activityCount = await this.prisma.activity.count({
        where: { userId },
      });

      const biomarkerCount = await this.prisma.biomarker.count({
        where: { userId },
      });

      const goalCount = await this.prisma.goal.count({
        where: { userId },
      });

      const completedGoalCount = await this.prisma.goal.count({
        where: {
          userId,
          status: 'COMPLETED',
        },
      });

      const leaderboardEntry = await this.prisma.leaderboardEntry.findUnique({
        where: { userId },
      });

      return {
        mealsLogged: mealCount,
        activitiesLogged: activityCount,
        biomarkersLogged: biomarkerCount,
        totalGoals: goalCount,
        completedGoals: completedGoalCount,
        totalPoints: leaderboardEntry?.totalPoints || 0,
        rank: leaderboardEntry?.rank || null,
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw new Error('Failed to fetch user stats');
    }
  }

  async getUserDashboard(userId: string) {
    try {
      const [profile, stats, recentMeals, recentActivities, recentBiomarkers, activeGoals] = await Promise.all([
        this.getUserProfile(userId),
        this.getUserStats(userId),
        this.prisma.meal.findMany({
          where: { userId },
          take: 5,
          orderBy: {
            loggedAt: 'desc',
          },
        }),
        this.prisma.activity.findMany({
          where: { userId },
          take: 5,
          orderBy: {
            loggedAt: 'desc',
          },
        }),
        this.prisma.biomarker.findMany({
          where: { userId },
          take: 5,
          orderBy: {
            loggedAt: 'desc',
          },
        }),
        this.prisma.goal.findMany({
          where: {
            userId,
            status: 'ACTIVE',
          },
          take: 5,
          orderBy: {
            createdAt: 'desc',
          },
        }),
      ]);

      return {
        profile,
        stats,
        recentMeals,
        recentActivities,
        recentBiomarkers,
        activeGoals,
      };
    } catch (error) {
      console.error('Error fetching user dashboard:', error);
      throw new Error('Failed to fetch user dashboard');
    }
  }

  async deleteUserAccount(userId: string) {
    try {
      // Delete all user data (cascade will handle related records)
      await this.prisma.user.delete({
        where: { id: userId },
      });

      return { success: true, message: 'Account deleted successfully' };
    } catch (error) {
      console.error('Error deleting user account:', error);
      throw new Error('Failed to delete user account');
    }
  }

  async exportUserData(userId: string) {
    try {
      const userData = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: true,
          meals: true,
          activities: true,
          biomarkers: true,
          goals: true,
          leaderboard: true,
          mealPlans: true,
          activityPlans: true,
          groceryLists: true,
          reports: true,
        },
      });

      if (!userData) {
        throw new Error('User not found');
      }

      return {
        exportDate: new Date().toISOString(),
        userData,
      };
    } catch (error) {
      console.error('Error exporting user data:', error);
      throw new Error('Failed to export user data');
    }
  }
} 