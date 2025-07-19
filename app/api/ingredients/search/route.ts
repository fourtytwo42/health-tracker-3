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
    // Change 'ies' to 'y' (e.g., berries -> berry)
    const singular = word.slice(0, -3) + 'y';
    variations.push(singular.toLowerCase());
    variations.push(normalizeText(singular));
  } else if (word.endsWith('y') && !word.endsWith('ay') && !word.endsWith('ey') && !word.endsWith('oy') && !word.endsWith('uy')) {
    // Change 'y' to 'ies' (e.g., berry -> berries)
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
  nutritionFilters: { [key: string]: { min?: number; max?: number; operator?: string; value?: number } };
} {
  const searchTerms: string[] = [];
  const exactPhrases: string[] = [];
  const exclusions: string[] = [];
  const categoryFilters: string[] = [];
  const nutritionFilters: { [key: string]: { min?: number; max?: number; operator?: string; value?: number } } = {};

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

  // Extract nutrition filters (calories:100-200, protein:>10, etc.)
  const nutritionRegex = /(\w+):([><]?\d+(?:-\d+)?)/g;
  while ((match = nutritionRegex.exec(processedQuery)) !== null) {
    const field = match[1];
    const value = match[2];
    
    if (value.includes('-')) {
      const [min, max] = value.split('-').map(Number);
      nutritionFilters[field] = { min, max };
    } else if (value.startsWith('>')) {
      nutritionFilters[field] = { min: Number(value.slice(1)) };
    } else if (value.startsWith('<')) {
      nutritionFilters[field] = { max: Number(value.slice(1)) };
    } else {
      nutritionFilters[field] = { value: Number(value) };
    }
  }
  processedQuery = processedQuery.replace(/\w+:[><]?\d+(?:-\d+)?/g, '');

  // Remaining words are search terms
  const remainingTerms = processedQuery.trim().split(/\s+/).filter(term => term.length > 0);
  searchTerms.push(...remainingTerms);

  return {
    searchTerms,
    exactPhrases,
    exclusions,
    categoryFilters,
    nutritionFilters
  };
}

// Helper function to check if ingredient matches search criteria
function matchesSearchCriteria(
  ingredient: any, 
  searchTerms: string[], 
  exactPhrases: string[], 
  exclusions: string[],
  nutritionFilters: { [key: string]: { min?: number; max?: number; operator?: string; value?: number } }
): boolean {
  const nameLower = ingredient.name.toLowerCase();
  const nameNormalized = normalizeText(ingredient.name);

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
    const phraseLower = phrase.toLowerCase();
    const phraseNormalized = normalizeText(phrase);
    
    // Check if the phrase appears in the name (case-insensitive)
    const nameLower = ingredient.name.toLowerCase();
    const nameNormalized = normalizeText(ingredient.name);
    
    if (!nameLower.includes(phraseLower) && !nameNormalized.includes(phraseNormalized)) {
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

  // Check nutrition filters
  for (const [field, filter] of Object.entries(nutritionFilters)) {
    const value = ingredient[field];
    if (value === undefined || value === null) continue;

    if (filter.min !== undefined && value < filter.min) return false;
    if (filter.max !== undefined && value > filter.max) return false;
    if (filter.value !== undefined && value !== filter.value) return false;
  }

  return true;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const aisle = searchParams.get('aisle');
    const loadCategories = searchParams.get('loadCategories') === 'true';
    const loadAisles = searchParams.get('loadAisles') === 'true';

    // If loading categories or aisles, return all ingredients
    if (loadCategories || loadAisles) {
      const ingredients = await portablePrisma.ingredient.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          category: true,
          aisle: true,
          calories: true,
          protein: true,
          carbs: true,
          fat: true,
          fiber: true,
          sugar: true
        },
        take: 1000,
        orderBy: { name: 'asc' }
      });

      return NextResponse.json({ ingredients });
    }

    // For regular search, require at least 2 characters
    if (query.length < 2) {
      return NextResponse.json({ ingredients: [] });
    }

    // Parse the query for advanced search operators
    const { searchTerms, exactPhrases, exclusions, categoryFilters, nutritionFilters } = parseSearchQuery(query);
    
    // If no search terms and no other filters, return empty
    if (searchTerms.length === 0 && exactPhrases.length === 0 && categoryFilters.length === 0 && Object.keys(nutritionFilters).length === 0) {
      return NextResponse.json({ ingredients: [] });
    }

    // Build where clause for SQLite (no mode: insensitive support)
    const whereClause: any = {
      isActive: true
    };

    // For multiple words, get all ingredients and filter in JavaScript
    // This ensures case-insensitive matching and proper word variation handling
    if (searchTerms.length > 0) {
      // Use the first search term for initial database filtering to reduce results
      // Also search for normalized version (without apostrophes)
      const firstTerm = searchTerms[0];
      const normalizedTerm = normalizeText(firstTerm);
      
      whereClause.OR = [
        { name: { contains: firstTerm } },
        { name: { contains: normalizedTerm } }
      ];
    }

    // Handle category filters from URL params and search query
    const allCategoryFilters = [...(category ? [category] : []), ...categoryFilters];
    if (allCategoryFilters.length > 0) {
      whereClause.category = {
        in: allCategoryFilters
      };
    }

    if (aisle) {
      whereClause.aisle = aisle;
    }

    const ingredients = await portablePrisma.ingredient.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        category: true,
        aisle: true,
        calories: true,
        protein: true,
        carbs: true,
        fat: true,
        fiber: true,
        sugar: true
      },
      take: limit * 15, // Get more results to filter from since we're doing more sophisticated filtering
      orderBy: {
        name: 'asc'
      }
    });

    // Apply sophisticated filtering for multiple words and word variations
    const filteredIngredients = ingredients
      .filter(ingredient => matchesSearchCriteria(ingredient, searchTerms, exactPhrases, exclusions, nutritionFilters))
      .slice(0, limit); // Limit the final results

    return NextResponse.json({ ingredients: filteredIngredients });
  } catch (error) {
    console.error('Error searching ingredients:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 