'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { authenticatedFetch } from '@/lib/utils/apiClient';

interface Exercise {
  id: string;
  activity: string;
  code: string;
  met: number;
  description?: string;
  category?: string;
  intensity?: string;
  imageUrl?: string;
}

interface WorkoutExercise {
  id: string;
  exerciseId: string;
  sets: number;
  reps?: number;
  duration?: number; // seconds
  restPeriod: number; // seconds
  order: number;
  notes?: string;
  exercise: Exercise;
}

interface Workout {
  id: string;
  name: string;
  description?: string;
  category: string;
  difficulty: string;
  duration: number; // seconds
  totalCalories?: number;
  targetMuscleGroups?: string[];
  equipment?: string[];
  instructions?: string[];
  photoUrl?: string;
  isFavorite: boolean;
  isPublic: boolean;
  aiGenerated: boolean;
  originalQuery?: string;
  createdAt: string;
  updatedAt: string;
  exercises: WorkoutExercise[];
  virtualExercises?: string;
}

export default function PrintWorkoutPage() {
  const searchParams = useSearchParams();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const workoutId = searchParams.get('id');
    if (!workoutId) return;

    const fetchWorkout = async () => {
      try {
        const response = await authenticatedFetch(`/api/workouts/${workoutId}`);
        
        if (response.ok) {
          const data = await response.json();
          setWorkout(data.workout || data);
        }
      } catch (error) {
        console.error('Error fetching workout:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkout();
  }, [searchParams]);

  // Update document title when workout is loaded
  useEffect(() => {
    if (workout) {
      document.title = `${workout.name} - Workout Print`;
    } else {
      document.title = 'Workout Print';
    }
  }, [workout]);

  const formatDuration = (duration: number) => {
    const minutes = Math.floor(duration / 60);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatExerciseDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toUpperCase()) {
      case 'BEGINNER':
        return '#4caf50';
      case 'INTERMEDIATE':
        return '#ff9800';
      case 'ADVANCED':
        return '#f44336';
      default:
        return '#757575';
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        Loading workout...
      </div>
    );
  }

  if (!workout) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        Workout not found
      </div>
    );
  }

  // Get exercises - the API has already processed them into the exercises field
  let exercisesWithImages: (WorkoutExercise | any)[] = [];
  if (workout.exercises && Array.isArray(workout.exercises)) {
    exercisesWithImages = workout.exercises;
  }

  return (
    <div className="print-container" style={{ 
      fontFamily: 'Arial, sans-serif',
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '20px',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh'
    }}>
      {/* Print Button */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '20px',
        padding: '10px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <button 
          onClick={() => window.print()}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          🖨️ Print Workout
        </button>
      </div>

      {/* Exercise Grid - Main workout image on the left, exercises next to it */}
      <div className="print-grid" style={{
        width: '100%',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '15px',
        marginTop: '20px'
      }}>
        {/* Main Workout Image - First in the grid */}
        <div className="print-card" style={{
          width: '100%',
          aspectRatio: '3 / 4',
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #333',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Background Image with Gradient Overlay */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: workout.photoUrl
              ? `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.6)), url(${workout.photoUrl})`
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            zIndex: 1
          }} />

          {/* Content Overlay */}
          <div style={{ 
            position: 'relative', 
            zIndex: 2, 
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            color: 'white',
            padding: '16px'
          }}>
            {/* Top Section - Category and Spacing */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              {/* Category Chip */}
              <div style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                backdropFilter: 'blur(10px)',
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '10px',
                fontWeight: 'bold',
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                {workout.category}
              </div>
              {/* Empty space for balance */}
              <div style={{ width: '40px' }} />
            </div>

            {/* Bottom Section - Title, Description, Stats */}
            <div>
              {/* Workout Title */}
              <h2 style={{ 
                fontSize: '16px', 
                margin: '0 0 8px 0',
                color: 'white',
                fontWeight: 600,
                lineHeight: '1.2',
                textShadow: '0 2px 4px rgba(0,0,0,0.5)'
              }}>
                {workout.name}
              </h2>
              
              {/* Description */}
              {workout.description && (
                <div style={{
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '4px',
                  padding: '8px',
                  marginBottom: '8px'
                }}>
                  <div style={{
                    fontSize: '11px',
                    lineHeight: '1.3',
                    color: 'white',
                    textShadow: '0 1px 2px rgba(0,0,0,0.8)'
                  }}>
                    {workout.description}
                  </div>
                </div>
              )}
              
              {/* Time and Calories */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '12px' }}>⏱️</span>
                  <span style={{ fontSize: '11px' }}>
                    {Math.round(workout.duration / 60)}m
                  </span>
                </div>
                
                {workout.totalCalories && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '12px' }}>🔥</span>
                    <span style={{ fontSize: '11px' }}>
                      ~{workout.totalCalories} cal
                    </span>
                  </div>
                )}
                
                {/* Difficulty Chip */}
                <div style={{
                  backgroundColor: workout.difficulty === 'BEGINNER' ? 'rgba(76, 175, 80, 0.8)' : 
                                  workout.difficulty === 'INTERMEDIATE' ? 'rgba(255, 152, 0, 0.8)' : 
                                  'rgba(244, 67, 54, 0.8)',
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '8px',
                  fontSize: '9px',
                  fontWeight: 'bold'
                }}>
                  {workout.difficulty}
                </div>
              </div>

              {/* Target Muscle Groups */}
              {workout.targetMuscleGroups && workout.targetMuscleGroups.length > 0 && (
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {workout.targetMuscleGroups.map((muscle, index) => (
                    <div
                      key={index}
                      style={{
                        fontSize: '9px',
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        color: 'white',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        padding: '2px 6px',
                        borderRadius: '8px'
                      }}
                    >
                      {muscle}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Exercise Cards */}
        {Array.isArray(exercisesWithImages) && exercisesWithImages.length > 0 ? (
          exercisesWithImages.map((exercise, index) => (
            <div key={exercise.id || index} className="print-card" style={{
              width: '100%',
              aspectRatio: '3 / 4',
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '15px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: '1px solid #333',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Background Image */}
              {(exercise.imageUrl || exercise.exercise?.imageUrl) && (
                <img
                  src={exercise.imageUrl || exercise.exercise?.imageUrl}
                  alt={exercise.exercise?.activity || exercise.name || 'Exercise'}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: 1,
                    zIndex: 1
                  }}
                />
              )}

              {/* Content Overlay */}
              <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Top section - Calories on left, sets/reps on right, exercise name centered */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  {/* Left side - Calories */}
                  {exercise.calories && (
                    <div style={{
                      textAlign: 'center',
                      padding: '3px 6px',
                      backgroundColor: 'rgba(40, 167, 69, 0.6)',
                      borderRadius: '4px',
                      display: 'inline-block'
                    }}>
                      <div style={{ fontSize: '6px', color: 'white', fontWeight: 'bold' }}>CALORIES</div>
                      <div style={{ fontSize: '10px', color: 'white', fontWeight: 'bold' }}>{Math.round(exercise.calories)}</div>
                    </div>
                  )}
                  
                  {/* Exercise name - Centered */}
                  <h3 style={{ 
                    fontSize: '14px', 
                    margin: '0',
                    color: 'white',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    padding: '6px 10px',
                    display: 'inline-block',
                    lineHeight: '1.1',
                    flex: '1',
                    marginLeft: '10px',
                    marginRight: '10px',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                    wordWrap: 'break-word',
                    hyphens: 'auto',
                    minHeight: '20px'
                  }}>
                    {exercise.exercise?.activity || exercise.name || 'Exercise'}
                  </h3>
                  
                  {/* Right side - Sets and Reps */}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {exercise.duration ? (
                      <div style={{
                        textAlign: 'center',
                        padding: '3px 6px',
                        backgroundColor: 'rgba(52, 152, 219, 0.6)',
                        borderRadius: '4px',
                        display: 'inline-block'
                      }}>
                        <div style={{ fontSize: '6px', color: 'white', fontWeight: 'bold' }}>TIME</div>
                        <div style={{ fontSize: '10px', color: 'white', fontWeight: 'bold' }}>
                          {formatExerciseDuration(exercise.duration)}
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{
                          textAlign: 'center',
                          padding: '3px 6px',
                          backgroundColor: 'rgba(231, 76, 60, 0.6)',
                          borderRadius: '4px',
                          display: 'inline-block'
                        }}>
                          <div style={{ fontSize: '6px', color: 'white', fontWeight: 'bold' }}>SETS</div>
                          <div style={{ fontSize: '10px', color: 'white', fontWeight: 'bold' }}>
                            {exercise.sets}
                          </div>
                        </div>
                        {exercise.reps && (
                          <div style={{
                            textAlign: 'center',
                            padding: '3px 6px',
                            backgroundColor: 'rgba(155, 89, 182, 0.6)',
                            borderRadius: '4px',
                            display: 'inline-block'
                          }}>
                            <div style={{ fontSize: '6px', color: 'white', fontWeight: 'bold' }}>REPS</div>
                            <div style={{ fontSize: '10px', color: 'white', fontWeight: 'bold' }}>
                              {exercise.reps}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>



                {/* Bottom section - Combined instructions and notes */}
                <div style={{ marginTop: 'auto' }}>
                  {((exercise.description || exercise.exercise?.description) || exercise.notes) && (
                    <div style={{ 
                      backgroundColor: 'rgba(0,0,0,0.25)',
                      padding: '8px',
                      borderRadius: '4px'
                    }}>
                      <h4 style={{ 
                        fontSize: '10px', 
                        margin: '0 0 4px 0',
                        color: 'white',
                        borderBottom: '1px solid white',
                        paddingBottom: '2px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span>Instructions</span>
                        {!exercise.exercise?.activity?.toLowerCase().includes('cool') && 
                         !exercise.exercise?.activity?.toLowerCase().includes('cooldown') && 
                         !exercise.name?.toLowerCase().includes('cool') && 
                         !exercise.name?.toLowerCase().includes('cooldown') && (
                          <span style={{ 
                            fontSize: '9px', 
                            color: 'rgba(255,255,255,0.8)', 
                            fontStyle: 'italic'
                          }}>
                            +{Math.round(exercise.restPeriod / 60)} minute Rest
                          </span>
                        )}
                      </h4>
                      <div style={{ 
                        fontSize: '11px', 
                        color: 'white', 
                        lineHeight: '1.2',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                      }}>
                        {(exercise.description || exercise.exercise?.description) && (
                          <div style={{ marginBottom: exercise.notes ? '8px' : '0' }}>
                            {exercise.description || exercise.exercise?.description}
                          </div>
                        )}
                        {exercise.notes && (
                          <div style={{ marginBottom: '8px' }}>
                            {exercise.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{
            width: '100%',
            height: '200px',
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            border: '2px solid #333',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <p style={{ fontSize: '16px', color: '#666', textAlign: 'center' }}>
              No exercises found for this workout.
            </p>
          </div>
        )}
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          body { 
            margin: 0; 
            padding: 0; 
            background: white;
          }
          
          /* Hide print button when printing */
          button {
            display: none !important;
          }
          
          /* Ensure cards print properly */
          div {
            break-inside: avoid;
          }
          
          /* Force all content to fit on one page */
          .print-container {
            page-break-inside: avoid;
            page-break-after: avoid;
          }
          
          /* Reduce margins and spacing for print */
          .print-container > div {
            margin: 5px !important;
            padding: 10px !important;
          }
          
          /* Make grid more compact for print */
          .print-grid {
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)) !important;
            gap: 10px !important;
          }
          
          /* Adjust card sizes for print */
          .print-card {
            aspect-ratio: 4 / 5 !important;
            padding: 10px !important;
          }
        }
      `}</style>
    </div>
  );
} 