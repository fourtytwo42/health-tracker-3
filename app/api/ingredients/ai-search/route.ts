import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '../../../../lib/middleware/auth';
import { LLMRouter } from '../../../../lib/llmRouter';
import { IngredientService } from '../../../../lib/services/IngredientService';

const llmRouter = LLMRouter.getInstance();
const ingredientService = IngredientService.getInstance();

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchTerm, category, aisle, nutritionFilters } = await req.json();

    if (!searchTerm) {
      return NextResponse.json(
        { error: 'Search term is required' },
        { status: 400 }
      );
    }

    console.log(`AI Search: Analyzing "${searchTerm}" with all search results`);

    // Get ALL search results from the database (not just current page)
    const allSearchResults = await ingredientService.getIngredientsPaginated(
      1, // Start from page 1
      10000, // Get a very large number to get all results
      false, // includeInactive
      searchTerm,
      category,
      aisle,
      nutritionFilters
    );

    const ingredients = allSearchResults.ingredients;
    console.log(`AI Search: Found ${ingredients.length} total ingredients matching "${searchTerm}"`);

    if (ingredients.length === 0) {
      return NextResponse.json(
        { error: 'No ingredients found matching the search term' },
        { status: 404 }
      );
    }

    // Limit to top 20 results for AI analysis to reduce context size
    const topResults = ingredients.slice(0, 20);
    console.log(`AI Search: Using top ${topResults.length} results for AI analysis (reduced from ${ingredients.length})`);

    // Prepare the prompt for the AI
    const prompt = `You are an expert at matching ingredient search terms to the most appropriate ingredient from a database.

SEARCH TERM: "${searchTerm}"

AVAILABLE INGREDIENTS (top 20 results from ${ingredients.length} total):
${topResults.map((ingredient: any, index: number) => 
  `${index + 1}. ID: ${ingredient.id} - ${ingredient.name} (${ingredient.category || 'Unknown'}) - ${ingredient.description || 'No description'}`
).join('\n')}

TASK: Analyze the search term and the top 20 available ingredients. Return ONLY the single best matching ingredient as JSON.

CRITERIA for best match:
1. Exact name match (highest priority)
2. Contains all search words in any order
3. Most relevant category match
4. Closest semantic meaning
5. Most commonly used/recognizable ingredient

RESPONSE FORMAT: Return ONLY a JSON object with this exact structure:
{
  "bestMatch": {
    "id": "ingredient_id",
    "name": "ingredient_name",
    "description": "ingredient_description",
    "category": "ingredient_category",
    "aisle": "ingredient_aisle",
    "calories": number,
    "protein": number,
    "carbs": number,
    "fat": number,
    "fiber": number,
    "sugar": number,
    "sodium": number
  },
  "reasoning": "Brief explanation of why this ingredient is the best match"
}

IMPORTANT: Return ONLY the JSON object, no additional text or formatting.`;

    // Call the LLM to get the best match
    const response = await llmRouter.generateResponse({
      userId: req.user!.userId,
      prompt,
      tool: 'ai_ingredient_search',
      maxTokens: 1000,
      temperature: 0.1 // Low temperature for more consistent results
    });

    console.log('AI Response content:', response.content);

    // Parse the AI response
    let aiResult;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiResult = JSON.parse(jsonMatch[0]);
        console.log('Parsed AI result:', aiResult);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', response.content);
      return NextResponse.json(
        { error: 'Failed to parse AI response', content: response.content },
        { status: 500 }
      );
    }

    // Validate the AI response structure
    if (!aiResult.bestMatch || !aiResult.bestMatch.id) {
      console.error('Invalid AI response structure:', aiResult);
      return NextResponse.json(
        { error: 'Invalid AI response structure', result: aiResult },
        { status: 500 }
      );
    }

    console.log('AI selected ID:', aiResult.bestMatch.id);
    console.log('Available IDs:', ingredients.map(i => i.id));

    // Find the actual ingredient data from the original list
    const bestMatchIngredient = ingredients.find((ingredient: any) => 
      ingredient.id === aiResult.bestMatch.id
    );

    if (!bestMatchIngredient) {
      console.error('AI selected ingredient not found in original list');
      console.error('AI selected ID:', aiResult.bestMatch.id);
      console.error('Available ingredients:', ingredients.map(i => ({ id: i.id, name: i.name })));
      
      // Fallback: try to find by name if ID doesn't match
      const fallbackMatch = ingredients.find((ingredient: any) => 
        ingredient.name.toLowerCase() === aiResult.bestMatch.name.toLowerCase()
      );
      
      if (fallbackMatch) {
        console.log('Found fallback match by name:', fallbackMatch.name);
        return NextResponse.json({
          success: true,
          bestMatch: fallbackMatch,
          reasoning: aiResult.reasoning || 'AI selected this ingredient as the best match (found by name)',
          searchTerm,
          totalCandidates: ingredients.length,
          provider: response.provider,
          note: 'Matched by name due to ID mismatch'
        });
      }
      
      return NextResponse.json(
        { error: 'AI selected ingredient not found in original list', 
          selectedId: aiResult.bestMatch.id,
          selectedName: aiResult.bestMatch.name,
          availableIds: ingredients.map(i => i.id).slice(0, 10) // Show first 10 for debugging
        },
        { status: 500 }
      );
    }

    console.log('Successfully found matching ingredient:', bestMatchIngredient.name);

    return NextResponse.json({
      success: true,
      bestMatch: bestMatchIngredient,
      reasoning: aiResult.reasoning || 'AI selected this ingredient as the best match',
      searchTerm,
      totalCandidates: ingredients.length,
      provider: response.provider
    });

  } catch (error) {
    console.error('AI ingredient search error:', error);
    
    // Check if it's a specific LLM error
    if (error instanceof Error) {
      if (error.message.includes('No available LLM providers')) {
        return NextResponse.json(
          { error: 'No AI providers are currently available. Please check your LLM settings.' },
          { status: 503 }
        );
      }
      if (error.message.includes('All LLM providers failed')) {
        return NextResponse.json(
          { error: 'AI service is temporarily unavailable. Please try again later.' },
          { status: 503 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}); 