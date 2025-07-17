import { BaseService } from './BaseService';

export interface ReportParams {
  startDate?: Date;
  endDate?: Date;
  format?: 'json' | 'pdf' | 'docx';
  includeMeals?: boolean;
  includeActivities?: boolean;
  includeBiomarkers?: boolean;
  includeGoals?: boolean;
}

export class ReportService extends BaseService {
  async generateHealthReport(userId: string, params: ReportParams = {}) {
    try {
      const {
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        endDate = new Date(),
        format = 'json',
        includeMeals = true,
        includeActivities = true,
        includeBiomarkers = true,
        includeGoals = true,
      } = params;

      // Collect data from all services
      const reportData: any = {
        userId,
        generatedAt: new Date(),
        period: { startDate, endDate },
        summary: {},
      };

      // Get meals data
      if (includeMeals) {
        const meals = await this.prisma.meal.findMany({
          where: {
            userId,
            loggedAt: { gte: startDate, lte: endDate },
          },
          orderBy: { loggedAt: 'desc' },
        });
        reportData.meals = meals;
        reportData.summary.totalMeals = meals.length;
        reportData.summary.totalCalories = meals.reduce((sum, meal) => {
          const nutrition = meal.nutritionInfo as any;
          return sum + (nutrition?.calories || 0);
        }, 0);
      }

      // Get activities data
      if (includeActivities) {
        const activities = await this.prisma.activity.findMany({
          where: {
            userId,
            loggedAt: { gte: startDate, lte: endDate },
          },
          orderBy: { loggedAt: 'desc' },
        });
        reportData.activities = activities;
        reportData.summary.totalActivities = activities.length;
        reportData.summary.totalCaloriesBurned = activities.reduce((sum, activity) => 
          sum + (activity.calories || 0), 0
        );
      }

      // Get biomarkers data
      if (includeBiomarkers) {
        const biomarkers = await this.prisma.biomarker.findMany({
          where: {
            userId,
            loggedAt: { gte: startDate, lte: endDate },
          },
          orderBy: { loggedAt: 'desc' },
        });
        reportData.biomarkers = biomarkers;
        reportData.summary.totalBiomarkers = biomarkers.length;
      }

      // Get goals data
      if (includeGoals) {
        const goals = await this.prisma.goal.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        });
        reportData.goals = goals;
        reportData.summary.totalGoals = goals.length;
        reportData.summary.completedGoals = goals.filter(g => g.status === 'COMPLETED').length;
      }

      // Get leaderboard data
      const leaderboard = await this.prisma.leaderboardEntry.findUnique({
        where: { userId },
      });
      reportData.leaderboard = leaderboard;

      // Generate report based on format
      if (format === 'json') {
        return reportData;
      } else if (format === 'pdf') {
        // TODO: Implement PDF generation with Puppeteer
        return {
          ...reportData,
          downloadUrl: `/api/reports/download/${userId}/${Date.now()}.pdf`,
          format: 'pdf',
        };
      } else if (format === 'docx') {
        // TODO: Implement DOCX generation
        return {
          ...reportData,
          downloadUrl: `/api/reports/download/${userId}/${Date.now()}.docx`,
          format: 'docx',
        };
      }

      return reportData;
    } catch (error) {
      console.error('Error generating health report:', error);
      throw new Error('Failed to generate health report');
    }
  }

  async exportUserData(userId: string) {
    try {
      // GDPR-compliant data export
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
        },
      });

      return {
        exportedAt: new Date(),
        userData,
      };
    } catch (error) {
      console.error('Error exporting user data:', error);
      throw new Error('Failed to export user data');
    }
  }
} 