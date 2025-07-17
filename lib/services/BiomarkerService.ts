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
    const validatedData = BiomarkerLogSchema.parse(biomarkerData);
    
    // Validate value ranges based on type
    this.validateBiomarkerValue(validatedData.type, validatedData.value);
    
    try {
      const biomarker = await this.prisma.biomarker.create({
        data: {
          userId,
          type: validatedData.type,
          value: validatedData.value,
          unit: validatedData.unit,
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
      throw new Error('Failed to log biomarker');
    }
  }

  async getBiomarkerTrends(userId: string, type: string, daysBack: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    try {
      const biomarkers = await this.prisma.biomarker.findMany({
        where: {
          userId,
          type: type as any,
          loggedAt: {
            gte: startDate,
          },
        },
        orderBy: {
          loggedAt: 'asc',
        },
      });

      // Calculate trends
      const trends = this.calculateTrends(biomarkers);

      return {
        data: biomarkers,
        trends,
      };
    } catch (error) {
      console.error('Error fetching biomarker trends:', error);
      throw new Error('Failed to fetch biomarker trends');
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

  private calculateBiomarkerPoints(biomarker: z.infer<typeof BiomarkerLogSchema>): number {
    let basePoints = 3;

    // Bonus for photo upload
    if (biomarker.photoUrl) {
      basePoints += 2;
    }

    // Bonus for notes
    if (biomarker.notes && biomarker.notes.length > 0) {
      basePoints += 1;
    }

    // Bonus for certain biomarker types
    switch (biomarker.type) {
      case 'WEIGHT':
        basePoints += 2; // Weight tracking is important
        break;
      case 'BLOOD_PRESSURE_SYSTOLIC':
      case 'BLOOD_PRESSURE_DIASTOLIC':
        basePoints += 3; // Blood pressure is critical
        break;
      case 'GLUCOSE':
        basePoints += 3; // Glucose is critical
        break;
    }

    return basePoints;
  }

  private calculateTrends(biomarkers: any[]) {
    if (biomarkers.length < 2) {
      return {
        trend: 'insufficient_data',
        change: 0,
        changePercent: 0,
      };
    }

    const first = biomarkers[0];
    const last = biomarkers[biomarkers.length - 1];
    const change = last.value - first.value;
    const changePercent = (change / first.value) * 10;

    let trend = 'stable';
    if (changePercent > 5) {
      trend = 'increasing';
    } else if (changePercent < -5) {
      trend = 'decreasing';
    }

    return {
      trend,
      change,
      changePercent,
      dataPoints: biomarkers.length,
    };
  }
} 