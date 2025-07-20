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
      // If there's a search term, use smart search
      if (search && search.trim()) {
        return this.getExercisesWithSmartSearch(page, pageSize, includeInactive, search, category, intensity, metRange);
      }

      // Otherwise use regular pagination
      const where: any = includeInactive ? {} : { isActive: true };
      
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

  private async getExercisesWithSmartSearch(
    page = 1,
    pageSize = 50,
    includeInactive = false,
    search: string,
    category?: string,
    intensity?: string,
    metRange?: { min?: number; max?: number }
  ) {
    try {
      // First, try to find exercises that contain ALL search words
      const queryWords = search.toLowerCase().trim().split(/[\s,]+/).filter(word => word.length > 0);
      
      const where: any = includeInactive ? {} : { isActive: true };
      
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

      // Build search conditions for all words
      const searchConditions = queryWords.map(word => ({
        OR: [
          { activity: { contains: word } },
          { description: { contains: word } },
          { category: { contains: word } }
        ]
      }));

      // First, try to find exercises that contain ALL search words
      let allExercises = await prisma.exercise.findMany({
        where: {
          ...where,
          AND: searchConditions
        },
        orderBy: { activity: 'asc' },
        take: 1000,
      });

      // If we don't have enough results, also include exercises that contain ANY of the search words
      if (allExercises.length < 50) {
        const partialMatches = await prisma.exercise.findMany({
          where: {
            ...where,
            OR: [
              { activity: { contains: search } },
              { description: { contains: search } },
              { category: { contains: search } }
            ]
          },
          orderBy: { activity: 'asc' },
          take: 2000,
        });

        // Combine and deduplicate
        const combined = [...allExercises];
        const existingIds = new Set(allExercises.map(e => e.id));
        
        for (const exercise of partialMatches) {
          if (!existingIds.has(exercise.id)) {
            combined.push(exercise);
          }
        }
        
        allExercises = combined;
      }

      // Use smart search on the found exercises
      const searchResults = this.smartSearch(allExercises, search);
      
      // Apply pagination to search results
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedResults = searchResults.slice(startIndex, endIndex);
      
      return {
        exercises: paginatedResults,
        pagination: {
          page,
          pageSize,
          totalCount: searchResults.length,
          totalPages: Math.ceil(searchResults.length / pageSize),
          hasNextPage: endIndex < searchResults.length,
          hasPreviousPage: page > 1,
        }
      };
    } catch (error) {
      console.error('Error fetching exercises with smart search:', error);
      throw new Error('Failed to fetch exercises');
    }
  }

  // Smart search implementation for exercises
  private smartSearch(exercises: any[], query: string): any[] {
    const queryLower = query.toLowerCase().trim();
    
    // Normalize query: remove apostrophes and split into words
    const normalizedQuery = queryLower.replace(/[''`´]/g, '');
    const queryWords = normalizedQuery.split(/[\s,]+/).filter(word => word.length > 0);
    
    const results = exercises.map(exercise => {
      const activityLower = exercise.activity.toLowerCase();
      const descriptionLower = exercise.description.toLowerCase();
      const categoryLower = exercise.category?.toLowerCase() || '';
      const normalizedActivity = activityLower.replace(/[''`´]/g, '');
      const normalizedDescription = descriptionLower.replace(/[''`´]/g, '');
      const normalizedCategory = categoryLower.replace(/[''`´]/g, '');
      
      // Calculate relevance score
      let score = 0;
      let matchedWords = 0;
      let allWordsPresent = true;
      
      // Check each query word against the exercise fields
      for (const queryWord of queryWords) {
        const activityScore = this.calculateWordScore(normalizedActivity, queryWord);
        const descriptionScore = this.calculateWordScore(normalizedDescription, queryWord) * 0.5; // Lower weight for description
        const categoryScore = this.calculateWordScore(normalizedCategory, queryWord) * 0.3; // Lower weight for category
        
        const wordScore = Math.max(activityScore, descriptionScore, categoryScore);
        if (wordScore > 0) {
          score += wordScore;
          matchedWords++;
        } else {
          allWordsPresent = false;
        }
      }
      
      // Only include if at least one word matched
      if (matchedWords === 0) {
        return null;
      }
      
      // Major bonus for matching all words (this should be the highest priority)
      if (allWordsPresent) {
        score += 10000;
        
        // Extra bonus if the words appear together in sequence in activity name
        const wordsTogether = queryWords.every((word, index) => {
          if (index === 0) return true;
          const prevWord = queryWords[index - 1];
          const combined = `${prevWord} ${word}`;
          return normalizedActivity.includes(combined);
        });
        
        if (wordsTogether) {
          score += 5000;
        }
      }
      
      // Bonus for exact match in activity
      if (normalizedActivity === normalizedQuery) {
        score += 20000;
      }
      
      // Bonus for starts with in activity
      if (normalizedActivity.startsWith(normalizedQuery)) {
        score += 15000;
      }
      
      // Bonus for contains the full query in activity
      if (normalizedActivity.includes(normalizedQuery)) {
        score += 12000;
      }
      
      return {
        ...exercise,
        _searchScore: score,
        _matchedWords: matchedWords,
        _allWordsPresent: allWordsPresent
      };
    }).filter(Boolean);
    
    // Sort by relevance score (highest first)
    return results.sort((a, b) => {
      if (a._searchScore !== b._searchScore) {
        return b._searchScore - a._searchScore;
      }
      // If scores are equal, prioritize exercises with all words present
      if (a._allWordsPresent !== b._allWordsPresent) {
        return b._allWordsPresent ? 1 : -1;
      }
      // If still equal, sort by activity name
      return a.activity.localeCompare(b.activity);
    });
  }

  // Calculate word score for exercise search
  private calculateWordScore(normalizedText: string, queryWord: string): number {
    if (!normalizedText || !queryWord) return 0;
    
    // Exact word match (highest score)
    if (normalizedText.includes(queryWord)) {
      return 1000;
    }
    
    // Check for singular/plural variations
    const singular = this.getSingular(queryWord);
    const plural = this.getPlural(queryWord);
    
    if (singular && normalizedText.includes(singular)) {
      return 800;
    }
    
    if (plural && normalizedText.includes(plural)) {
      return 800;
    }
    
    // Check for partial matches (substring)
    if (normalizedText.includes(queryWord.substring(0, Math.max(3, queryWord.length - 1)))) {
      return 400;
    }
    
    return 0;
  }

  // Get singular form of a word
  private getSingular(word: string): string | null {
    if (word.endsWith('ies')) {
      return word.slice(0, -3) + 'y';
    }
    if (word.endsWith('s') && word.length > 3) {
      return word.slice(0, -1);
    }
    return null;
  }

  // Get plural form of a word
  private getPlural(word: string): string | null {
    if (word.endsWith('y')) {
      return word.slice(0, -1) + 'ies';
    }
    if (!word.endsWith('s')) {
      return word + 's';
    }
    return null;
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