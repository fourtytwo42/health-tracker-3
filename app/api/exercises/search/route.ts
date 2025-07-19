import { NextRequest, NextResponse } from 'next/server';
import { portablePrisma } from '@/lib/prisma';

// Helper function to normalize text for search (remove special characters, lowercase)
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[''`´]/g, '') // Remove apostrophes and similar characters
    .replace(/[^\w\s]/g, ' ') // Replace other special chars with spaces
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

// Helper function to get word variations (singular/plural + fuzzy matching)
function getWordVariations(word: string): string[] {
  const variations = [word.toLowerCase()];
  const normalized = normalizeText(word);
  
  // Add normalized version
  if (normalized !== word.toLowerCase()) {
    variations.push(normalized);
  }
  
  // Handle plurals - remove 's' to get singular
  if (word.endsWith('s')) {
    variations.push(word.slice(0, -1).toLowerCase());
    variations.push(normalizeText(word.slice(0, -1)));
  }
  
  // Handle singular - add 's' to get plural
  if (!word.endsWith('s')) {
    variations.push(word.toLowerCase() + 's');
    variations.push(normalizeText(word.toLowerCase() + 's'));
  }
  
  // Handle common plural patterns
  if (word.endsWith('ies')) {
    // Change 'ies' to 'y' (e.g., activities -> activity)
    const singular = word.slice(0, -3) + 'y';
    variations.push(singular.toLowerCase());
    variations.push(normalizeText(singular));
  } else if (word.endsWith('y') && !word.endsWith('ay') && !word.endsWith('ey') && !word.endsWith('oy') && !word.endsWith('uy')) {
    // Change 'y' to 'ies' (e.g., activity -> activities)
    const plural = word.slice(0, -1) + 'ies';
    variations.push(plural.toLowerCase());
    variations.push(normalizeText(plural));
  }
  
  // Fuzzy matching for common typos (Levenshtein distance of 1-2)
  if (word.length > 2) {
    // Common letter swaps and additions
    const fuzzyVariations = [
      word.replace(/ie/g, 'ei'), // receive vs recieve
      word.replace(/ei/g, 'ie'), // believe vs beleive
      word.replace(/ph/g, 'f'),  // phone vs fone
      word.replace(/f/g, 'ph'),  // fone vs phone
      word.replace(/ck/g, 'k'),  // back vs bak
      word.replace(/k/g, 'ck'),  // bak vs back
    ];
    
    fuzzyVariations.forEach(variation => {
      if (variation !== word) {
        variations.push(variation.toLowerCase());
        variations.push(normalizeText(variation));
      }
    });
  }
  
  return Array.from(new Set(variations)); // Remove duplicates
}

// Parse advanced search query with operators
function parseSearchQuery(query: string): {
  searchTerms: string[];
  exactPhrases: string[];
  exclusions: string[];
  categoryFilters: string[];
  intensityFilters: string[];
  metFilters: { min?: number; max?: number; operator?: string; value?: number };
} {
  const searchTerms: string[] = [];
  const exactPhrases: string[] = [];
  const exclusions: string[] = [];
  const categoryFilters: string[] = [];
  const intensityFilters: string[] = [];
  const metFilters: { min?: number; max?: number; operator?: string; value?: number } = {};

  // Extract exact phrases (quoted text)
  const phraseRegex = /"([^"]+)"/g;
  let match;
  while ((match = phraseRegex.exec(query)) !== null) {
    exactPhrases.push(match[1]);
  }
  
  // Remove quotes from query for further processing
  let processedQuery = query.replace(/"[^"]+"/g, '');

  // Extract exclusions (terms starting with -)
  const exclusionRegex = /\s-(\w+)/g;
  while ((match = exclusionRegex.exec(processedQuery)) !== null) {
    exclusions.push(match[1]);
  }
  processedQuery = processedQuery.replace(/\s-\w+/g, '');

  // Extract category filters (category:value)
  const categoryRegex = /category:(\w+)/g;
  while ((match = categoryRegex.exec(processedQuery)) !== null) {
    categoryFilters.push(match[1]);
  }
  processedQuery = processedQuery.replace(/category:\w+/g, '');

  // Extract intensity filters (intensity:value)
  const intensityRegex = /intensity:(\w+)/g;
  while ((match = intensityRegex.exec(processedQuery)) !== null) {
    intensityFilters.push(match[1]);
  }
  processedQuery = processedQuery.replace(/intensity:\w+/g, '');

  // Extract MET filters (met:3-6, met:>5, etc.)
  const metRegex = /met:([><]?\d+(?:-\d+)?)/g;
  while ((match = metRegex.exec(processedQuery)) !== null) {
    const value = match[1];
    
    if (value.includes('-')) {
      const [min, max] = value.split('-').map(Number);
      metFilters.min = min;
      metFilters.max = max;
    } else if (value.startsWith('>')) {
      metFilters.min = Number(value.slice(1));
    } else if (value.startsWith('<')) {
      metFilters.max = Number(value.slice(1));
    } else {
      metFilters.value = Number(value);
    }
  }
  processedQuery = processedQuery.replace(/met:[><]?\d+(?:-\d+)?/g, '');

  // Remaining words are search terms
  const remainingTerms = processedQuery.trim().split(/\s+/).filter(term => term.length > 0);
  searchTerms.push(...remainingTerms);

  return {
    searchTerms,
    exactPhrases,
    exclusions,
    categoryFilters,
    intensityFilters,
    metFilters
  };
}

// Helper function to check if exercise matches search criteria
function matchesSearchCriteria(
  exercise: any, 
  searchTerms: string[], 
  exactPhrases: string[], 
  exclusions: string[],
  metFilters: { min?: number; max?: number; operator?: string; value?: number }
): boolean {
  const nameLower = exercise.activity.toLowerCase();
  const nameNormalized = normalizeText(exercise.activity);

  // Check exclusions first
  for (const exclusion of exclusions) {
    const exclusionVariations = getWordVariations(exclusion);
    if (exclusionVariations.some(variation => 
      nameLower.includes(variation) || nameNormalized.includes(variation)
    )) {
      return false;
    }
  }

  // Check exact phrases
  for (const phrase of exactPhrases) {
    if (!nameLower.includes(phrase.toLowerCase()) && !nameNormalized.includes(normalizeText(phrase))) {
      return false;
    }
  }

  // Check search terms (AND logic)
  for (const term of searchTerms) {
    const termVariations = getWordVariations(term);
    if (!termVariations.some(variation => 
      nameLower.includes(variation) || nameNormalized.includes(variation)
    )) {
      return false;
    }
  }

  // Check MET filters
  if (metFilters.min !== undefined && exercise.met < metFilters.min) return false;
  if (metFilters.max !== undefined && exercise.met > metFilters.max) return false;
  if (metFilters.value !== undefined && exercise.met !== metFilters.value) return false;

  return true;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const intensity = searchParams.get('intensity');
    const loadCategories = searchParams.get('loadCategories') === 'true';
    const loadIntensities = searchParams.get('loadIntensities') === 'true';

    // If loading categories or intensities, return all exercises
    if (loadCategories || loadIntensities) {
      const exercises = await portablePrisma.exercise.findMany({
        where: { isActive: true },
        select: {
          id: true,
          activity: true,
          code: true,
          met: true,
          description: true,
          category: true,
          intensity: true
        },
        take: 1000,
        orderBy: { activity: 'asc' }
      });

      return NextResponse.json({ exercises });
    }

    // For regular search, require at least 2 characters
    if (query.length < 2) {
      return NextResponse.json({ exercises: [] });
    }

    // Parse the query for advanced search operators
    const { searchTerms, exactPhrases, exclusions, categoryFilters, intensityFilters, metFilters } = parseSearchQuery(query);
    
    // If no search terms and no other filters, return empty
    if (searchTerms.length === 0 && exactPhrases.length === 0 && categoryFilters.length === 0 && intensityFilters.length === 0 && Object.keys(metFilters).length === 0) {
      return NextResponse.json({ exercises: [] });
    }

    // Build where clause for SQLite (no mode: insensitive support)
    const whereClause: any = {
      isActive: true
    };

    // For multiple words, get all ingredients and filter in JavaScript
    // This ensures case-insensitive matching and proper word variation handling
    if (searchTerms.length > 0) {
      // Use the first search term for initial database filtering to reduce results
      whereClause.activity = {
        contains: searchTerms[0]
      };
    }

    // Handle category filters from URL params and search query
    const allCategoryFilters = [...(category ? [category] : []), ...categoryFilters];
    if (allCategoryFilters.length > 0) {
      whereClause.category = {
        in: allCategoryFilters
      };
    }

    // Handle intensity filters from URL params and search query
    const allIntensityFilters = [...(intensity ? [intensity] : []), ...intensityFilters];
    if (allIntensityFilters.length > 0) {
      whereClause.intensity = {
        in: allIntensityFilters
      };
    }

    const exercises = await portablePrisma.exercise.findMany({
      where: whereClause,
      select: {
        id: true,
        activity: true,
        code: true,
        met: true,
        description: true,
        category: true,
        intensity: true
      },
      take: limit * 3, // Get more results to filter from since we're doing more sophisticated filtering
      orderBy: {
        activity: 'asc'
      }
    });

    // Apply sophisticated filtering for multiple words and word variations
    const filteredExercises = exercises
      .filter((exercise: any) => matchesSearchCriteria(exercise, searchTerms, exactPhrases, exclusions, metFilters))
      .slice(0, limit); // Limit the final results

    return NextResponse.json({ exercises: filteredExercises });
  } catch (error) {
    console.error('Error searching exercises:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 