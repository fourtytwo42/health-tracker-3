import { BaseService } from './BaseService';
import { z } from 'zod';

const BiomarkerLogSchema = z.object({
  type: z.enum(['WEIGHT', 'BLOOD_PRESSURE_SYSTOLIC', 'BLOOD_PRESSURE_DIASTOLIC', 'GLUCOSE', 'KETONES', 'HEART_RATE', 'BODY_FAT', 'MUSCLE_MASS', 'WATER_PERCENTAGE', 'BMI']),
  value: z.number(),
  unit: z.string(),
  photoUrl: z.string().optional(),
  notes: z.string().optional(),
  loggedAt: z.string().optional(),
});

export class BiomarkerService extends BaseService {
  async logBiomarker(userId: string, biomarkerData: z.infer<typeof BiomarkerLogSchema>) {
    try {
      const validatedData = BiomarkerLogSchema.parse(biomarkerData);
    
      // Convert American units to metric for storage
      let convertedValue = validatedData.value;
      let convertedUnit = validatedData.unit;
      
      if (validatedData.type === 'WEIGHT' && validatedData.unit.toLowerCase().includes('lb')) {
        // Convert pounds to kg for storage
        convertedValue = Math.round(validatedData.value / 2.20462 * 10) / 10;
        convertedUnit = 'kg';
      }
      
      // Validate value ranges based on type (using metric values)
      this.validateBiomarkerValue(validatedData.type, convertedValue);
      
      const biomarker = await this.prisma.biomarker.create({
        data: {
          userId,
          type: validatedData.type,
          value: convertedValue,
          unit: convertedUnit,
          photoUrl: validatedData.photoUrl,
          notes: validatedData.notes,
          loggedAt: validatedData.loggedAt ? new Date(validatedData.loggedAt) : new Date(),
        },
      });

      // Award points for logging biomarkers
      const points = this.calculateBiomarkerPoints(validatedData);
      await this.awardPoints(userId, 'biomarker_logged', points);

      return biomarker;
    } catch (error) {
      console.error('Error logging biomarker:', error);
      if (error instanceof z.ZodError) {
        throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
      }
      throw new Error('Failed to log biomarker');
    }
  }

  async getBiomarkerHistory(userId: string, type?: string, daysBack: number = 30) {
    try {
      const whereClause: any = {
        userId,
        loggedAt: {
          gte: new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)
        }
      };

      if (type) {
        whereClause.type = type;
      }

      const biomarkers = await this.prisma.biomarker.findMany({
        where: whereClause,
        orderBy: {
          loggedAt: 'desc'
        }
      });

      // Convert metric values back to American units for display
      return biomarkers.map(biomarker => {
        if (biomarker.type === 'WEIGHT' && biomarker.unit === 'kg') {
          return {
            ...biomarker,
            displayValue: Math.round(biomarker.value * 2.20462),
            displayUnit: 'lbs'
          };
        }
        return biomarker;
      });
    } catch (error) {
      console.error('Error getting biomarker history:', error);
      throw new Error('Failed to get biomarker history');
    }
  }

  async getBiomarkerTrends(userId: string, type: string, daysBack: number = 30) {
    try {
      const biomarkers = await this.getBiomarkerHistory(userId, type, daysBack);
      
      if (biomarkers.length === 0) {
        return {
          trend: 'stable',
          change: 0,
          average: 0,
          min: 0,
          max: 0
        };
      }

      const values = biomarkers.map(b => b.displayValue || b.value);
      const sortedValues = values.sort((a, b) => a - b);
      
      const average = values.reduce((sum, val) => sum + val, 0) / values.length;
      const min = sortedValues[0];
      const max = sortedValues[sortedValues.length - 1];
      
      // Calculate trend
      const recentValues = values.slice(0, Math.min(7, values.length));
      const olderValues = values.slice(-Math.min(7, values.length));
      
      const recentAvg = recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length;
      const olderAvg = olderValues.reduce((sum, val) => sum + val, 0) / olderValues.length;
      
      const change = recentAvg - olderAvg;
      const percentChange = (change / olderAvg) * 100;
      
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (Math.abs(percentChange) > 2) {
        trend = percentChange > 0 ? 'up' : 'down';
      }

      return {
        trend,
        change: Math.round(change * 10) / 10,
        percentChange: Math.round(percentChange * 10) / 10,
        average: Math.round(average * 10) / 10,
        min: Math.round(min * 10) / 10,
        max: Math.round(max * 10) / 10,
        unit: biomarkers[0].displayUnit || biomarkers[0].unit
      };
    } catch (error) {
      console.error('Error getting biomarker trends:', error);
      throw new Error('Failed to get biomarker trends');
    }
  }

  async getBiomarkerById(biomarkerId: string) {
    try {
      const biomarker = await this.prisma.biomarker.findUnique({
        where: { id: biomarkerId },
      });

      if (!biomarker) {
        throw new Error('Biomarker not found');
      }

      return biomarker;
    } catch (error) {
      console.error('Error fetching biomarker:', error);
      throw new Error('Failed to fetch biomarker');
    }
  }

  async getLatestBiomarkers(userId: string) {
    try {
      const biomarkers = await this.prisma.biomarker.findMany({
        where: { userId },
        orderBy: {
          loggedAt: 'desc',
        },
        take: 10,
      });

      // Group by type and get latest for each
      const latestByType = biomarkers.reduce((acc, biomarker) => {
        if (!acc[biomarker.type] || acc[biomarker.type].loggedAt < biomarker.loggedAt) {
          acc[biomarker.type] = biomarker;
        }
        return acc;
      }, {} as Record<string, any>);

      return Object.values(latestByType);
    } catch (error) {
      console.error('Error fetching latest biomarkers:', error);
      throw new Error('Failed to fetch latest biomarkers');
    }
  }

  private calculateBiomarkerPoints(biomarkerData: z.infer<typeof BiomarkerLogSchema>): number {
    // Award points based on biomarker type and frequency
    const basePoints = 10;
    
    switch (biomarkerData.type) {
      case 'WEIGHT':
        return basePoints;
      case 'BLOOD_PRESSURE_SYSTOLIC':
      case 'BLOOD_PRESSURE_DIASTOLIC':
        return basePoints * 2;
      case 'GLUCOSE':
        return basePoints * 3;
      case 'BMI':
        return basePoints;
      default:
        return basePoints;
    }
  }

  private validateBiomarkerValue(type: string, value: number): void {
    switch (type) {
      case 'BLOOD_PRESSURE_SYSTOLIC':
        if (value < 70 || value > 200) {
          throw new Error('Systolic blood pressure must be between 70-200mmHg');
        }
        break;
      case 'BLOOD_PRESSURE_DIASTOLIC':
        if (value < 40 || value > 130) {
          throw new Error('Diastolic blood pressure must be between 40-130mmHg');
        }
        break;
      case 'GLUCOSE':
        if (value < 0 || value > 500) {
          throw new Error('Glucose must be between 0-500g/dL');
        }
        break;
      case 'KETONES':
        if (value < 0 || value > 10) {
          throw new Error('Ketones must be between 0-10 mmol/L');
        }
        break;
      case 'HEART_RATE':
        if (value < 30 || value > 200) {
          throw new Error('Heart rate must be between 30-200 bpm');
        }
        break;
      case 'BODY_FAT':
        if (value < 0 || value > 50) {
          throw new Error('Body fat must be between 0-50%');
        }
        break;
      case 'MUSCLE_MASS':
        if (value < 0 || value > 100) {
          throw new Error('Muscle mass must be between 0-100%');
        }
        break;
      case 'WATER_PERCENTAGE':
        if (value < 0 || value > 100) {
          throw new Error('Water percentage must be between 0-100%');
        }
        break;
      case 'BMI':
        if (value < 10 || value > 60) {
          throw new Error('BMI must be between 10-60');
        }
        break;
      case 'WEIGHT':
        if (value < 20 || value > 500) {
          throw new Error('Weight must be between 20-500kg');
        }
        break;
    }
  }
} 