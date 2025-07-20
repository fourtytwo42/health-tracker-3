import Fuse from 'fuse.js';

// Fuse.js configuration for ingredients
const ingredientFuseOptions = {
  keys: [
    { name: 'name', weight: 1.0 },
    { name: 'category', weight: 0.7 },
    { name: 'aisle', weight: 0.5 }
  ],
  threshold: 0.4, // Slightly more lenient threshold
  distance: 100, // Maximum distance for fuzzy matching
  includeScore: true,
  includeMatches: true,
  minMatchCharLength: 2,
  ignoreLocation: true,
  useExtendedSearch: true
};

// Fuse.js configuration for exercises
const exerciseFuseOptions = {
  keys: [
    { name: 'activity', weight: 1.0 },
    { name: 'category', weight: 0.7 },
    { name: 'intensity', weight: 0.5 },
    { name: 'description', weight: 0.3 }
  ],
  threshold: 0.3,
  distance: 100,
  includeScore: true,
  includeMatches: true,
  minMatchCharLength: 2,
  ignoreLocation: true,
  useExtendedSearch: true
};

// Normalize text for better matching (handle apostrophes, special characters)
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[''`´]/g, '') // Remove apostrophes and similar characters
    .replace(/[^\w\s]/g, ' ') // Replace other special chars with spaces
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

// Generate search variations for better matching
function generateSearchVariations(query: string): string[] {
  const normalized = normalizeText(query);
  const words = normalized.split(/\s+/).filter(word => word.length > 0);
  
  if (words.length <= 1) {
    return [normalized];
  }
  
  const variations: string[] = [normalized];
  
  // Add reversed word order
  const reversed = words.reverse().join(' ');
  if (reversed !== normalized) {
    variations.push(reversed);
  }
  
  // Add variations with common separators
  variations.push(words.join(', '));
  variations.push(words.join(' and '));
  
  // Add partial matches (first word only)
  if (words.length > 1) {
    variations.push(words[0]);
  }
  
  return variations;
}

// Parse search query for advanced operators
export function parseSearchQuery(query: string): {
  searchTerms: string[];
  exactPhrases: string[];
  exclusions: string[];
  categoryFilters: string[];
  nutritionFilters: { [key: string]: { min?: number; max?: number; operator?: string; value?: number } };
  metFilters: { min?: number; max?: number; operator?: string; value?: number };
} {
  const searchTerms: string[] = [];
  const exactPhrases: string[] = [];
  const exclusions: string[] = [];
  const categoryFilters: string[] = [];
  const nutritionFilters: { [key: string]: { min?: number; max?: number; operator?: string; value?: number } } = {};
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

  // Extract nutrition filters (calories:100-200, protein:>10, etc.)
  const nutritionRegex = /(\w+):([><]?\d+(?:-\d+)?)/g;
  while ((match = nutritionRegex.exec(processedQuery)) !== null) {
    const field = match[1];
    const value = match[2];
    
    if (field === 'met') {
      // Handle MET filters for exercises
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
    } else {
      // Handle nutrition filters for ingredients
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
    nutritionFilters,
    metFilters
  };
}

// Search ingredients using Fuse.js with improved matching
export function searchIngredients(
  ingredients: any[], 
  query: string, 
  limit: number = 20
): any[] {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const { searchTerms, exactPhrases, exclusions, categoryFilters, nutritionFilters } = parseSearchQuery(query);
  
  // Create Fuse instance with normalized text and search variations
  const normalizedIngredients = ingredients.map(ingredient => ({
    ...ingredient,
    normalizedName: normalizeText(ingredient.name),
    normalizedCategory: normalizeText(ingredient.category || ''),
    normalizedAisle: normalizeText(ingredient.aisle || ''),
    // Add search variations for better matching
    searchVariations: generateSearchVariations(ingredient.name)
  }));

  const fuseOptions = {
    ...ingredientFuseOptions,
    keys: [
      { name: 'name', weight: 1.0 },
      { name: 'normalizedName', weight: 0.9 },
      { name: 'searchVariations', weight: 0.8 }, // Add weight to search variations
      { name: 'category', weight: 0.7 },
      { name: 'normalizedCategory', weight: 0.6 },
      { name: 'aisle', weight: 0.5 },
      { name: 'normalizedAisle', weight: 0.4 }
    ]
  };
  
  const fuse = new Fuse(normalizedIngredients, fuseOptions);
  
  let results: any[] = [];
  
  // Handle exact phrases first
  for (const phrase of exactPhrases) {
    const phraseResults = fuse.search(phrase);
    results.push(...phraseResults.map(r => r.item));
  }
  
  // Handle search terms with variations
  if (searchTerms.length > 0) {
    const searchQuery = searchTerms.join(' ');
    const searchVariations = generateSearchVariations(searchQuery);
    
    // Search with each variation
    for (const variation of searchVariations) {
      const termResults = fuse.search(variation);
      results.push(...termResults.map(r => r.item));
    }
  }
  
  // Remove duplicates and sort by relevance
  const uniqueResults = Array.from(new Map(results.map(item => [item.id, item])).values());
  
  // Apply filters
  const filteredResults = uniqueResults.filter(ingredient => {
    // Check exclusions
    for (const exclusion of exclusions) {
      const nameLower = ingredient.name.toLowerCase();
      const normalizedName = ingredient.normalizedName;
      if (nameLower.includes(exclusion.toLowerCase()) || normalizedName.includes(normalizeText(exclusion))) {
        return false;
      }
    }
    
    // Check category filters
    if (categoryFilters.length > 0) {
      const ingredientCategory = ingredient.category?.toLowerCase();
      const normalizedCategory = ingredient.normalizedCategory;
      if (!categoryFilters.some(cat => {
        const normalizedCat = normalizeText(cat);
        return ingredientCategory?.includes(cat.toLowerCase()) || 
               normalizedCategory.includes(normalizedCat);
      })) {
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
  });
  
  // Sort by relevance (exact matches first, then partial matches)
  const sortedResults = filteredResults.sort((a, b) => {
    const queryLower = query.toLowerCase();
    const aNameLower = a.name.toLowerCase();
    const bNameLower = b.name.toLowerCase();
    
    // Exact matches get highest priority
    const aExact = aNameLower === queryLower;
    const bExact = bNameLower === queryLower;
    
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;
    
    // Starts with matches get second priority
    const aStartsWith = aNameLower.startsWith(queryLower);
    const bStartsWith = bNameLower.startsWith(queryLower);
    
    if (aStartsWith && !bStartsWith) return -1;
    if (!aStartsWith && bStartsWith) return 1;
    
    // Contains matches get third priority
    const aContains = aNameLower.includes(queryLower);
    const bContains = bNameLower.includes(queryLower);
    
    if (aContains && !bContains) return -1;
    if (!aContains && bContains) return 1;
    
    // Finally, sort alphabetically
    return aNameLower.localeCompare(bNameLower);
  });
  
  return sortedResults.slice(0, limit);
}

// Flexible search function that handles word order variations
export function searchIngredientsFlexible(
  ingredients: any[], 
  query: string, 
  limit: number = 20
): any[] {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const queryLower = query.toLowerCase().trim();
  const queryWords = queryLower.split(/\s+/).filter(word => word.length > 0);
  
  const results = ingredients.filter(ingredient => {
    const nameLower = ingredient.name.toLowerCase();
    
    // Exact match
    if (nameLower === queryLower) return true;
    
    // Contains match
    if (nameLower.includes(queryLower)) return true;
    
    // Word order variations (for multi-word queries)
    if (queryWords.length > 1) {
      // Check if all query words are present in the ingredient name
      const nameWords = nameLower.split(/\s+/);
      return queryWords.every(queryWord => 
        nameWords.some(nameWord => nameWord.includes(queryWord))
      );
    }
    
    // Single word - check if it's contained in the name
    return nameLower.includes(queryWords[0]);
  });

  // Sort by relevance
  const sortedResults = results.sort((a, b) => {
    const aNameLower = a.name.toLowerCase();
    const bNameLower = b.name.toLowerCase();
    
    // Exact matches get highest priority
    const aExact = aNameLower === queryLower;
    const bExact = bNameLower === queryLower;
    
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;
    
    // Starts with matches get second priority
    const aStartsWith = aNameLower.startsWith(queryLower);
    const bStartsWith = bNameLower.startsWith(queryLower);
    
    if (aStartsWith && !bStartsWith) return -1;
    if (!aStartsWith && bStartsWith) return 1;
    
    // Contains matches get third priority
    const aContains = aNameLower.includes(queryLower);
    const bContains = bNameLower.includes(queryLower);
    
    if (aContains && !bContains) return -1;
    if (!aContains && bContains) return 1;
    
    // Finally, sort alphabetically
    return aNameLower.localeCompare(bNameLower);
  });
  
  return sortedResults.slice(0, limit);
}

// Search exercises using Fuse.js
export function searchExercises(
  exercises: any[], 
  query: string, 
  limit: number = 20
): any[] {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const { searchTerms, exactPhrases, exclusions, categoryFilters, metFilters } = parseSearchQuery(query);
  
  // Create Fuse instance with normalized text
  const normalizedExercises = exercises.map(exercise => ({
    ...exercise,
    normalizedActivity: normalizeText(exercise.activity),
    normalizedCategory: normalizeText(exercise.category || ''),
    normalizedIntensity: normalizeText(exercise.intensity || '')
  }));

  const fuseOptions = {
    ...exerciseFuseOptions,
    keys: [
      { name: 'activity', weight: 1.0 },
      { name: 'normalizedActivity', weight: 0.9 },
      { name: 'category', weight: 0.7 },
      { name: 'normalizedCategory', weight: 0.6 },
      { name: 'intensity', weight: 0.5 },
      { name: 'normalizedIntensity', weight: 0.4 },
      { name: 'description', weight: 0.3 }
    ]
  };
  
  const fuse = new Fuse(normalizedExercises, fuseOptions);
  
  let results: any[] = [];
  
  // Handle exact phrases first
  for (const phrase of exactPhrases) {
    const phraseResults = fuse.search(phrase);
    results.push(...phraseResults.map(r => r.item));
  }
  
  // Handle search terms
  if (searchTerms.length > 0) {
    const searchQuery = searchTerms.join(' ');
    const termResults = fuse.search(searchQuery);
    results.push(...termResults.map(r => r.item));
  }
  
  // Remove duplicates
  results = Array.from(new Map(results.map(item => [item.id, item])).values());
  
  // Apply filters
  results = results.filter(exercise => {
    // Check exclusions
    for (const exclusion of exclusions) {
      const nameLower = exercise.activity.toLowerCase();
      const normalizedName = exercise.normalizedActivity;
      if (nameLower.includes(exclusion.toLowerCase()) || normalizedName.includes(normalizeText(exclusion))) {
        return false;
      }
    }
    
    // Check category filters
    if (categoryFilters.length > 0) {
      const exerciseCategory = exercise.category?.toLowerCase();
      const normalizedCategory = exercise.normalizedCategory;
      if (!categoryFilters.some(cat => {
        const normalizedCat = normalizeText(cat);
        return exerciseCategory?.includes(cat.toLowerCase()) || 
               normalizedCategory.includes(normalizedCat);
      })) {
        return false;
      }
    }
    
    // Check MET filters
    if (metFilters.min !== undefined && exercise.met < metFilters.min) return false;
    if (metFilters.max !== undefined && exercise.met > metFilters.max) return false;
    if (metFilters.value !== undefined && exercise.met !== metFilters.value) return false;
    
    return true;
  });
  
  return results.slice(0, limit);
}

// Get search suggestions based on recent searches and popular terms
export function getSearchSuggestions(
  items: any[], 
  query: string, 
  maxSuggestions: number = 5
): string[] {
  if (!query || query.trim().length < 1) {
    return [];
  }

  const fuse = new Fuse(items, {
    keys: ['name', 'activity'],
    threshold: 0.4,
    distance: 50,
    includeScore: true
  });

  const results = fuse.search(query);
  const suggestions = results
    .slice(0, maxSuggestions)
    .map(result => result.item.name || result.item.activity)
    .filter(Boolean);

  return Array.from(new Set(suggestions));
} 