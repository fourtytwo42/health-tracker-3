import { BaseService } from './BaseService';
import { LLMRouter } from '../llmRouter';
import { SystemMessageService } from './SystemMessageService';
import { z } from 'zod';
const ActivityLogSchema = z.object({
  name: z.string(),
  type: z.enum(['CARDIO', 'STRENGTH', 'FLEXIBILITY', 'SPORTS', 'WALKING', 'RUNNING', 'CYCLING', 'SWIMMING', 'YOGA', 'PILATES', 'OTHER']),
  duration: z.number().min(1).max(480),
  intensity: z.enum(['LIGHT', 'MODERATE', 'VIGOROUS']),
  calories: z.number().min(0).max(2000),
  notes: z.string().optional(),
  loggedAt: z.string().optional(),
});

export class ActivityService extends BaseService {
  private llmRouter: LLMRouter;
  private systemMessageService: SystemMessageService;

  constructor() {
    super();
    this.llmRouter = LLMRouter.getInstance();
    this.systemMessageService = new SystemMessageService();
  }

  async generateActivityPlan(
    userId: string,
    span: 'daily' | 'weekly' | 'monthly',
    targetCalories: number,
    preferences?: string
  ) {
    // Get prompt from system messages
    let prompt = await this.systemMessageService.getMessageContent('prompts.activity_plan_generation');
    
    if (!prompt) {
      // Fallback to default prompt
      prompt = `Generate a {span} activity plan for a user targeting {targetCalories} calories per day. 
Preferences: {preferences}
    
Return a JSON object with this structure:
{
  "days": [
    {
      "date": "YYYY-MM-DD",
      "activities": [
        {
          "type": "CARDIO|STRENGTH|FLEXIBILITY|SPORTS|WALKING|RUNNING|CYCLING|SWIMMING|YOGA|PILATES|OTHER",
          "name": "Activity name",
          "duration": 30,
          "intensity": "LIGHT|MODERATE|VIGOROUS",
          "calories": 150,
          "description": "Brief description"
        }
      ],
      "totalCalories": 30
    }
  ]
}`;
    }

    // Replace placeholders with actual values
    const formattedPrompt = prompt
      .replace('{span}', span)
      .replace('{targetCalories}', targetCalories.toString())
      .replace('{preferences}', preferences || 'none specified');

    try {
      const response = await this.llmRouter.generateResponse({
        prompt: formattedPrompt,
        userId,
        tool: 'generate_activity_plan',
        args: { span, targetCalories, preferences }
      });
      const planData = JSON.parse(response.content);
      
      // Calculate start and end dates based on span
      const startDate = new Date();
      const endDate = new Date();
      if (span === 'weekly') {
        endDate.setDate(endDate.getDate() + 7);
      } else if (span === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else {
        endDate.setDate(endDate.getDate() + 1);
      }
      
      // Store the plan
      const plan = await this.prisma.activityPlan.create({
        data: {
          userId,
          title: `${span.charAt(0).toUpperCase() + span.slice(1)} Activity Plan`,
          description: `Generated activity plan targeting ${targetCalories} calories per day`,
          startDate,
          endDate,
          planData,
          totalCalories: targetCalories,
          isActive: true,
        },
      });

      // Award points for plan generation
      await this.awardPoints(userId, 'activity_plan_generated', 10);

      return {
        planId: plan.id,
        ...planData,
      };
    } catch (error) {
      console.error('Error generating activity plan:', error);
      throw new Error('Failed to generate activity plan');
    }
  }

  async logActivity(userId: string, activityData: z.infer<typeof ActivityLogSchema>) {
    const validatedData = ActivityLogSchema.parse(activityData);
    
    try {
      const activity = await this.prisma.activity.create({
        data: {
          userId,
          name: validatedData.name,
          type: validatedData.type,
          duration: validatedData.duration,
          intensity: validatedData.intensity,
          calories: validatedData.calories,
          notes: validatedData.notes,
          loggedAt: validatedData.loggedAt ? new Date(validatedData.loggedAt) : new Date(),
        },
      });

      // Award points based on activity type and duration
      const points = this.calculateActivityPoints(validatedData);
      await this.awardPoints(userId, 'activity_logged', points);

      return activity;
    } catch (error) {
      console.error('Error logging activity:', error);
      throw new Error('Failed to log activity');
    }
  }

  async getActivityHistory(userId: string, daysBack: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    try {
      const activities = await this.prisma.activity.findMany({
        where: {
          userId,
          loggedAt: {
            gte: startDate,
          },
        },
        orderBy: {
          loggedAt: 'desc',
        },
      });

      return activities;
    } catch (error) {
      console.error('Error fetching activity history:', error);
      throw new Error('Failed to fetch activity history');
    }
  }

  async getActivityById(activityId: string) {
    try {
      const activity = await this.prisma.activity.findUnique({
        where: { id: activityId },
      });

      if (!activity) {
        throw new Error('Activity not found');
      }

      return activity;
    } catch (error) {
      console.error('Error fetching activity:', error);
      throw new Error('Failed to fetch activity');
    }
  }

  private calculateActivityPoints(activity: z.infer<typeof ActivityLogSchema>): number {
    let basePoints = 5;

    // Bonus for duration
    if (activity.duration >= 60) basePoints += 5;
    if (activity.duration >= 120) basePoints += 5;

    // Bonus for intensity
    if (activity.intensity === 'VIGOROUS') basePoints += 3;
    else if (activity.intensity === 'MODERATE') basePoints += 2;

    // Bonus for calories burned
    if (activity.calories >= 300) basePoints += 3;
    if (activity.calories >= 500) basePoints += 2;

    return basePoints;
  }
} 