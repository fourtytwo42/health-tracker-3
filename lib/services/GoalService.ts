import { BaseService } from './BaseService';
import { z } from 'zod';

const CreateGoalSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().optional(),
  type: z.enum(['WEIGHT_LOSS', 'WEIGHT_GAIN', 'MUSCLE_GAIN', 'ENDURANCE', 'STRENGTH', 'FLEXIBILITY', 'NUTRITION', 'SLEEP', 'STRESS_REDUCTION', 'OTHER']),
  targetValue: z.number().optional(),
  unit: z.string().optional(),
  deadline: z.string().optional(), // ISO date string
});

const UpdateGoalSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().optional(),
  targetValue: z.number().optional(),
  currentValue: z.number().optional(),
  unit: z.string().optional(),
  deadline: z.string().optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED', 'PAUSED']).optional(),
});

export class GoalService extends BaseService {
  async createGoal(userId: string, goalData: z.infer<typeof CreateGoalSchema>) {
    const validatedData = CreateGoalSchema.parse(goalData);
    
    try {
      const goal = await this.prisma.goal.create({
        data: {
          userId,
          title: validatedData.title,
          description: validatedData.description,
          type: validatedData.type,
          targetValue: validatedData.targetValue,
          unit: validatedData.unit,
          deadline: validatedData.deadline ? new Date(validatedData.deadline) : null,
          status: 'ACTIVE',
        },
      });

      // Award points for creating a goal
      await this.awardPoints(userId, 'goal_created', 5);
      return goal;
    } catch (error) {
      console.error('Error creating goal:', error);
      throw new Error('Failed to create goal');
    }
  }

  async updateGoal(goalId: string, userId: string, updateData: z.infer<typeof UpdateGoalSchema>) {
    const validatedData = UpdateGoalSchema.parse(updateData);
    
    try {
      const goal = await this.prisma.goal.update({
        where: {
          id: goalId,
          userId, // Ensure user owns the goal
        },
        data: {
          ...validatedData,
          deadline: validatedData.deadline ? new Date(validatedData.deadline) : undefined,
        },
      });

      // Award points for updating progress
      if (validatedData.currentValue !== undefined) {
        await this.awardPoints(userId, 'goal_progress_updated', 2);
      }

      return goal;
    } catch (error) {
      console.error('Error updating goal:', error);
      throw new Error('Failed to update goal');
    }
  }

  async getGoalById(goalId: string, userId: string) {
    try {
      const goal = await this.prisma.goal.findFirst({
        where: {
          id: goalId,
          userId,
        },
      });

      if (!goal) {
        throw new Error('Goal not found');
      }

      return goal;
    } catch (error) {
      console.error('Error fetching goal:', error);
      throw new Error('Failed to fetch goal');
    }
  }

  async getUserGoals(userId: string, status?: string) {
    try {
      const whereClause: any = { userId };
      if (status) {
        whereClause.status = status;
      }

      const goals = await this.prisma.goal.findMany({
        where: whereClause,
        orderBy: [
          { createdAt: 'desc' },
        ],
      });

      return goals;
    } catch (error) {
      console.error('Error fetching user goals:', error);
      throw new Error('Failed to fetch user goals');
    }
  }

  async completeGoal(goalId: string, userId: string) {
    try {
      const goal = await this.prisma.goal.update({
        where: {
          id: goalId,
          userId,
        },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      // Award points for completing a goal
      await this.awardPoints(userId, 'goal_completed', 20);
      return goal;
    } catch (error) {
      console.error('Error completing goal:', error);
      throw new Error('Failed to complete goal');
    }
  }

  async getGoalProgress(goalId: string, userId: string) {
    try {
      const goal = await this.prisma.goal.findFirst({
        where: {
          id: goalId,
          userId,
        },
      });

      if (!goal) {
        throw new Error('Goal not found');
      }

      if (!goal.targetValue || !goal.currentValue) {
        return {
          goal,
          progress: 0,
          percentage: 0,
          remaining: null,
        };
      }

      const progress = goal.currentValue;
      const percentage = Math.min((progress / goal.targetValue) * 100, 100);
      const remaining = goal.targetValue - progress;

      return {
        goal,
        progress,
        percentage: Math.round(percentage),
        remaining: remaining > 0 ? remaining : 0,
      };
    } catch (error) {
      console.error('Error calculating goal progress:', error);
      throw new Error('Failed to calculate goal progress');
    }
  }

  async getGoalsByType(userId: string, type: string) {
    try {
      const goals = await this.prisma.goal.findMany({
        where: {
          userId,
          type: type as any,
        },
        orderBy: [
          { createdAt: 'desc' },
        ],
      });

      return goals;
    } catch (error) {
      console.error('Error fetching goals by type:', error);
      throw new Error('Failed to fetch goals by type');
    }
  }

  async getGoalStats(userId: string) {
    try {
      const totalGoals = await this.prisma.goal.count({
        where: { userId },
      });

      const completedGoals = await this.prisma.goal.count({
        where: {
          userId,
          status: 'COMPLETED',
        },
      });

      const activeGoals = await this.prisma.goal.count({
        where: {
          userId,
          status: 'ACTIVE',
        },
      });

      const completionRate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

      return {
        totalGoals,
        completedGoals,
        activeGoals,
        completionRate: Math.round(completionRate),
      };
    } catch (error) {
      console.error('Error fetching goal stats:', error);
      throw new Error('Failed to fetch goal stats');
    }
  }
} 