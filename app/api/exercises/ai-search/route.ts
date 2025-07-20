import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '../../../../lib/middleware/auth';
import { LLMRouter } from '../../../../lib/llmRouter';
import { ExerciseService } from '../../../../lib/services/ExerciseService';

const llmRouter = LLMRouter.getInstance();
const exerciseService = ExerciseService.getInstance();

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchTerm, category, intensity, metRange } = await req.json();

    if (!searchTerm) {
      return NextResponse.json(
        { error: 'Search term is required' },
        { status: 400 }
      );
    }

    console.log(`AI Exercise Search: Analyzing "${searchTerm}" with all search results`);

    // Get ALL search results from the database (not just current page)
    const allSearchResults = await exerciseService.getExercisesPaginated(
      1, // Start from page 1
      10000, // Get a very large number to get all results
      false, // includeInactive
      searchTerm,
      category,
      intensity,
      metRange
    );

    const exercises = allSearchResults.exercises;
    console.log(`AI Exercise Search: Found ${exercises.length} total exercises matching "${searchTerm}"`);

    if (exercises.length === 0) {
      return NextResponse.json(
        { error: 'No exercises found matching the search term' },
        { status: 404 }
      );
    }

    // Limit to top 20 results for AI analysis to reduce context size
    const topResults = exercises.slice(0, 20);
    console.log(`AI Exercise Search: Using top ${topResults.length} results for AI analysis (reduced from ${exercises.length})`);

    // Prepare the prompt for the AI
    const prompt = `You are an expert at matching exercise search terms to the most appropriate exercise from a database.

SEARCH TERM: "${searchTerm}"

AVAILABLE EXERCISES (top 20 results from ${exercises.length} total):
${topResults.map((exercise: any, index: number) => 
  `${index + 1}. ID: ${exercise.id} - ${exercise.activity} (${exercise.category || 'Unknown'}) - ${exercise.description} - MET: ${exercise.met} - Intensity: ${exercise.intensity}`
).join('\n')}

TASK: Analyze the search term and the top 20 available exercises. Return ONLY the single best matching exercise as JSON.

CRITERIA for best match:
1. Exact activity name match (highest priority)
2. Contains all search words in any order
3. Most relevant category match
4. Closest semantic meaning
5. Most commonly used/recognizable exercise
6. Appropriate intensity level for the search term

RESPONSE FORMAT: Return ONLY a JSON object with this exact structure:
{
  "bestMatch": {
    "id": "exercise_id",
    "activity": "exercise_activity",
    "description": "exercise_description",
    "category": "exercise_category",
    "intensity": "exercise_intensity",
    "met": number,
    "code": "exercise_code"
  },
  "reasoning": "Brief explanation of why this exercise is the best match"
}

IMPORTANT: Return ONLY the JSON object, no additional text or formatting.`;

    // Call the LLM to get the best match
    const response = await llmRouter.generateResponse({
      userId: req.user!.userId,
      prompt,
      tool: 'ai_exercise_search',
      maxTokens: 1000,
      temperature: 0.1 // Low temperature for more consistent results
    });

    console.log('AI Exercise Response content:', response.content);

    // Parse the AI response
    let aiResult;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiResult = JSON.parse(jsonMatch[0]);
        console.log('Parsed AI exercise result:', aiResult);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI exercise response:', response.content);
      return NextResponse.json(
        { error: 'Failed to parse AI response', content: response.content },
        { status: 500 }
      );
    }

    // Validate the AI response structure
    if (!aiResult.bestMatch || !aiResult.bestMatch.id) {
      console.error('Invalid AI exercise response structure:', aiResult);
      return NextResponse.json(
        { error: 'Invalid AI response structure', result: aiResult },
        { status: 500 }
      );
    }

    console.log('AI selected exercise ID:', aiResult.bestMatch.id);
    console.log('Available exercise IDs:', exercises.map(e => e.id));

    // Find the actual exercise data from the original list
    const bestMatchExercise = exercises.find((exercise: any) => 
      exercise.id === aiResult.bestMatch.id
    );

    if (!bestMatchExercise) {
      console.error('AI selected exercise not found in original list');
      console.error('AI selected ID:', aiResult.bestMatch.id);
      console.error('Available exercises:', exercises.map(e => ({ id: e.id, activity: e.activity })));
      
      // Fallback: try to find by activity name if ID doesn't match
      const fallbackMatch = exercises.find((exercise: any) => 
        exercise.activity.toLowerCase() === aiResult.bestMatch.activity.toLowerCase()
      );
      
      if (fallbackMatch) {
        console.log('Found fallback match by activity name:', fallbackMatch.activity);
        return NextResponse.json({
          success: true,
          bestMatch: fallbackMatch,
          reasoning: aiResult.reasoning || 'AI selected this exercise as the best match (found by activity name)',
          searchTerm,
          totalCandidates: topResults.length, // Show actual number analyzed (20)
          totalFound: exercises.length, // Show total found for reference
          provider: response.provider,
          note: 'Matched by activity name due to ID mismatch'
        });
      }
      
      return NextResponse.json(
        { error: 'AI selected exercise not found in original list', 
          selectedId: aiResult.bestMatch.id,
          selectedActivity: aiResult.bestMatch.activity,
          availableIds: exercises.map(e => e.id).slice(0, 10) // Show first 10 for debugging
        },
        { status: 500 }
      );
    }

    console.log('Successfully found matching exercise:', bestMatchExercise.activity);

    return NextResponse.json({
      success: true,
      bestMatch: bestMatchExercise,
      reasoning: aiResult.reasoning || 'AI selected this exercise as the best match',
      searchTerm,
      totalCandidates: topResults.length, // Show actual number analyzed (20)
      totalFound: exercises.length, // Show total found for reference
      provider: response.provider
    });

  } catch (error) {
    console.error('AI exercise search error:', error);
    
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