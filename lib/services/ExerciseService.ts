import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import { prisma } from '../prisma';

// Use main database for exercises

export interface ExerciseData {
  activity: string;
  code: string;
  met: number;
  description: string;
  category?: string;
  intensity?: string;
}

export interface ExerciseCreateInput extends ExerciseData {
  isActive?: boolean;
}

export interface ExerciseUpdateInput extends Partial<ExerciseData> {
  isActive?: boolean;
}

export class ExerciseService {
  private static instance: ExerciseService;

  private constructor() {}

  static getInstance(): ExerciseService {
    if (!ExerciseService.instance) {
      ExerciseService.instance = new ExerciseService();
    }
    return ExerciseService.instance;
  }

  async createExercise(data: ExerciseCreateInput) {
    try {
      const exercise = await prisma.exercise.create({
        data: {
          activity: data.activity,
          code: data.code,
          met: data.met,
          description: data.description,
          category: data.category,
          intensity: data.intensity || 'MODERATE',
          isActive: data.isActive ?? true,
        },
      });
      return exercise;
    } catch (error) {
      console.error('Error creating exercise:', error);
      throw new Error('Failed to create exercise');
    }
  }

  async getExercise(id: string) {
    try {
      const exercise = await prisma.exercise.findUnique({
        where: { id },
      });
      return exercise;
    } catch (error) {
      console.error('Error fetching exercise:', error);
      throw new Error('Failed to fetch exercise');
    }
  }

  async getAllExercises(includeInactive = false) {
    try {
      const where = includeInactive ? {} : { isActive: true };
      const exercises = await prisma.exercise.findMany({
        where,
        orderBy: { activity: 'asc' },
      });
      return exercises;
    } catch (error) {
      console.error('Error fetching exercises:', error);
      throw new Error('Failed to fetch exercises');
    }
  }

  async getExercisesPaginated(
    page = 1,
    pageSize = 50,
    includeInactive = false,
    search?: string,
    category?: string,
    intensity?: string,
    metRange?: { min?: number; max?: number }
  ) {
    try {
      const where: any = includeInactive ? {} : { isActive: true };
      
      // Add search filter
      if (search) {
        where.OR = [
          { activity: { contains: search } },
          { description: { contains: search } },
          { category: { contains: search } },
        ];
      }
      
      // Add category filter
      if (category) {
        where.category = category;
      }

      // Add intensity filter
      if (intensity) {
        where.intensity = intensity;
      }

      // Add MET range filter
      if (metRange) {
        if (metRange.min !== undefined) {
          where.met = { ...where.met, gte: metRange.min };
        }
        if (metRange.max !== undefined) {
          where.met = { ...where.met, lte: metRange.max };
        }
      }

      const skip = (page - 1) * pageSize;
      
      const [exercises, totalCount] = await Promise.all([
        prisma.exercise.findMany({
          where,
          orderBy: { activity: 'asc' },
          skip,
          take: pageSize,
        }),
        prisma.exercise.count({ where })
      ]);

      return {
        exercises,
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages: Math.ceil(totalCount / pageSize),
          hasNextPage: page < Math.ceil(totalCount / pageSize),
          hasPreviousPage: page > 1,
        }
      };
    } catch (error) {
      console.error('Error fetching paginated exercises:', error);
      throw new Error('Failed to fetch exercises');
    }
  }

  async updateExercise(id: string, data: ExerciseUpdateInput) {
    try {
      const exercise = await prisma.exercise.update({
        where: { id },
        data,
      });
      return exercise;
    } catch (error) {
      console.error('Error updating exercise:', error);
      throw new Error('Failed to update exercise');
    }
  }

  async deleteExercise(id: string) {
    try {
      await prisma.exercise.delete({
        where: { id },
      });
      return { success: true };
    } catch (error) {
      console.error('Error deleting exercise:', error);
      throw new Error('Failed to delete exercise');
    }
  }

  async deleteAllExercises() {
    try {
      await prisma.exercise.deleteMany({});
      return { success: true, count: 0 };
    } catch (error) {
      console.error('Error deleting all exercises:', error);
      throw new Error('Failed to delete all exercises');
    }
  }

  async searchExercises(query: string, limit = 10) {
    try {
      const exercises = await prisma.exercise.findMany({
        where: {
          OR: [
            { activity: { contains: query } },
            { description: { contains: query } },
            { category: { contains: query } },
          ],
          isActive: true,
        },
        take: limit,
        orderBy: { activity: 'asc' },
      });
      return exercises;
    } catch (error) {
      console.error('Error searching exercises:', error);
      throw new Error('Failed to search exercises');
    }
  }

  async importFromCSV(csvData: string) {
    try {
      const records = parse(csvData, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      const results = {
        success: 0,
        failed: 0,
        errors: [] as string[],
      };

      for (const record of records as any[]) {
        try {
          // Validate required fields
          if (!record.Actvtity || !record.Code || !record.MET || !record.Description) {
            results.failed++;
            results.errors.push(`Row ${results.success + results.failed}: Missing required fields`);
            continue;
          }

          // Convert numeric fields
          const exerciseData: ExerciseCreateInput = {
            activity: record.Actvtity.trim(),
            code: record.Code.trim(),
            met: parseFloat(record.MET),
            description: record.Description.trim(),
            category: record.Actvtity.trim(), // Use activity as category
            intensity: this.getIntensityFromMET(parseFloat(record.MET)),
          };

          // Validate numeric values
          if (isNaN(exerciseData.met)) {
            results.failed++;
            results.errors.push(`Row ${results.success + results.failed}: Invalid MET value`);
            continue;
          }

          await this.createExercise(exerciseData);
          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push(`Row ${results.success + results.failed}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return results;
    } catch (error) {
      console.error('Error importing CSV:', error);
      throw new Error('Failed to import CSV data');
    }
  }

  private getIntensityFromMET(met: number): string {
    if (met < 3.0) return 'LIGHT';
    if (met < 6.0) return 'MODERATE';
    return 'VIGOROUS';
  }

  async getCategories() {
    try {
      const categories = await prisma.exercise.findMany({
        select: { category: true },
        where: { category: { not: null } },
        distinct: ['category'],
      });
      return categories.map(c => c.category).filter(Boolean) as string[];
    } catch (error) {
      console.error('Error fetching exercise categories:', error);
      throw new Error('Failed to fetch exercise categories');
    }
  }

  async getIntensities() {
    try {
      const intensities = await prisma.exercise.findMany({
        select: { intensity: true },
        where: { intensity: { not: null } },
        distinct: ['intensity'],
      });
      return intensities.map(i => i.intensity).filter(Boolean) as string[];
    } catch (error) {
      console.error('Error fetching exercise intensities:', error);
      throw new Error('Failed to fetch exercise intensities');
    }
  }

  async getMETRange() {
    try {
      const result = await prisma.exercise.aggregate({
        _min: { met: true },
        _max: { met: true },
      });
      return {
        min: result._min.met || 0,
        max: result._max.met || 0,
      };
    } catch (error) {
      console.error('Error fetching MET range:', error);
      throw new Error('Failed to fetch MET range');
    }
  }
} 