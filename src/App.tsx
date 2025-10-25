
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Onboarding } from './components/Onboarding';
import { Dashboard } from './components/Dashboard';
import { Nutrition } from './components/Nutrition';
import { Workout } from './components/Workout';
import { Chatbot } from './components/Chatbot';
import { Explore } from './components/Explore';
import { Progress } from './components/Progress';
import { BottomNav } from './components/BottomNav';
import type { AppScreen, UserProfile, Plan, DailyNutrition, Meal, WorkoutPlan, ChatMessage } from './types';
import { generateInitialPlan } from './services/geminiService';
import { GeneratingPlan } from './components/GeneratingPlan';
import { useLanguage } from './contexts/LanguageContext';
import { LanguageSwitcher } from './components/LanguageSwitcher';

/**
 * Data Migration: Ensures old plan data structures are compatible with new code.
 * This function checks for the existence of unique IDs on meals and exercises,
 * which were added in a later version. If they are missing, it adds them.
 * This prevents app crashes and data loss for existing users.
 */
const migratePlanData = (plan: Plan): Plan => {
  let planModified = false;

  // Check workoutPlan
  if (plan.workoutPlan?.schedule) {
    plan.workoutPlan.schedule.forEach(day => {
      if (!day.id) {
        day.id = crypto.randomUUID();
        planModified = true;
      }
      day.exercises.forEach(ex => {
        if (!ex.id) {
          ex.id = crypto.randomUUID();
          planModified = true;
        }
      });
    });
  }

  // Check nutritionPlan
  if (plan.nutritionPlan?.dailyPlans) {
    plan.nutritionPlan.dailyPlans.forEach(day => {
      day.meals.forEach(meal => {
        if (!meal.id) {
          meal.id = crypto.randomUUID();
          planModified = true;
        }
      });
    });
  }
  
  if (planModified) {
    console.log("User plan data migrated to the latest version.");
  }

  return plan;
};


const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('dashboard');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    const savedProfile = localStorage.getItem('userProfile');
    return savedProfile ? JSON.parse(savedProfile) : null;
  });
  const [plan, setPlan] = useState<Plan | null>(() => {
    const savedPlanString = localStorage.getItem('plan');
    if (!savedPlanString) {
      return null;
    }
    try {
      const savedPlan = JSON.parse(savedPlanString);
      // Run migration to ensure compatibility with new versions
      return migratePlanData(savedPlan);
    } catch (error) {
      console.error("Failed to parse or migrate user plan. Clearing invalid data.", error);
      localStorage.removeItem('plan');
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const { language, t } = useLanguage();

  useEffect(() => {
    if (userProfile) {
      localStorage.setItem('userProfile', JSON.stringify(userProfile));
    }
    if (plan) {
      localStorage.setItem('plan', JSON.stringify(plan));
    }
  }, [userProfile, plan]);

  const handleOnboardingComplete = useCallback(async (profile: UserProfile) => {
    setIsLoading(true);
    setError(null);
    try {
      setUserProfile(profile);
      const generatedPlan = await generateInitialPlan(profile, language);
      
      if (!generatedPlan) {
        throw new Error("AI returned an empty plan.");
      }

      // Add unique IDs for tracking, with robust checks to prevent crashes from malformed data.
      
      // Defensively process workout plan
      if (Array.isArray(generatedPlan.workoutPlan?.schedule)) {
        generatedPlan.workoutPlan.schedule.forEach(day => {
          if (day) {
            day.id = crypto.randomUUID();
            if (Array.isArray(day.exercises)) {
              day.exercises.forEach(ex => {
                if (ex) {
                  ex.id = crypto.randomUUID();
                }
              });
            } else {
              day.exercises = []; // Sanitize missing exercises array
            }
          }
        });
      }
      
      // Defensively process nutrition plan
      if (Array.isArray(generatedPlan.nutritionPlan?.dailyPlans)) {
        generatedPlan.nutritionPlan.dailyPlans.forEach(day => {
          if (day) {
            if (Array.isArray(day.meals)) {
              day.meals.forEach(meal => {
                if (meal) {
                  meal.id = crypto.randomUUID();
                }
              });
            } else {
              day.meals = []; // Sanitize missing meals array
            }
          }
        });
      }

      setPlan(generatedPlan);
    } catch (e) {
      console.error(e);
      if (e instanceof Error && e.message.includes('API_CALL_TIMEOUT')) {
          setError(t('app.generationTimeoutError'));
      } else {
          setError(t('app.generationError'));
      }
      // Do NOT clear user profile on failure, so they can retry.
    } finally {
      setIsLoading(false);
    }
  }, [language, t]);

  const handleUpdateMeal = useCallback((
    day: string,
    mealName: string,
    oldIngredient: string,
    newIngredient: string,
    newMealName?: string
  ): boolean => {
    if (!plan) return false;

    let success = false;
    const newPlan = JSON.parse(JSON.stringify(plan)); // Deep copy

    const dayPlan = newPlan.nutritionPlan.dailyPlans.find(
        (p: DailyNutrition) => p.day.toLowerCase() === day.toLowerCase()
    );

    if (dayPlan) {
        const meal = dayPlan.meals.find(
            (m: Meal) => m.name.toLowerCase() === mealName.toLowerCase()
        );

        if (meal) {
            const ingredientIndex = meal.ingredients.findIndex(
                (i: string) => i.toLowerCase().includes(oldIngredient.toLowerCase())
            );

            if (ingredientIndex > -1) {
                const originalIngredient = meal.ingredients[ingredientIndex];
                meal.ingredients[ingredientIndex] = newIngredient;
                
                meal.recipe = meal.recipe.map((step: string) => 
                    step.replace(new RegExp(originalIngredient, 'gi'), newIngredient)
                );

                if (newMealName) {
                    meal.name = newMealName;
                } else {
                    meal.name = meal.name.replace(new RegExp(originalIngredient, 'gi'), newIngredient);
                }
                
                success = true;
                setPlan(newPlan);
            }
        }
    }
    
    if (!success) {
        console.warn('Failed to update meal:', { day, mealName, oldIngredient });
    }

    return success;
  }, [plan]);

  const handleUpdateWorkout = useCallback((workoutPlan: WorkoutPlan) => {
    setPlan(prev => {
        if (!prev) return null;
        return { ...prev, workoutPlan };
    });
  }, []);


  const renderScreen = () => {
    if (!userProfile || !plan) {
      if (isLoading) {
        return <GeneratingPlan />;
      }
      return <Onboarding onComplete={handleOnboardingComplete} error={error} initialProfile={userProfile} />;
    }

    switch (currentScreen) {
      case 'dashboard':
        return <Dashboard userProfile={userProfile} plan={plan} />;
      case 'nutrition':
        return <Nutrition plan={plan.nutritionPlan} />;
      case 'workout':
        return <Workout plan={plan.workoutPlan} onUpdateWorkout={handleUpdateWorkout} />;
      case 'chatbot':
        return <Chatbot nutritionPlan={plan.nutritionPlan} onUpdateMeal={handleUpdateMeal} messages={chatHistory} setMessages={setChatHistory} />;
      case 'explore':
        return <Explore />;
      case 'progress':
        return <Progress />;
      default:
        return <Dashboard userProfile={userProfile} plan={plan} />;
    }
  };

  const showNav = userProfile && plan && !isLoading;

  return (
    <div className="min-h-screen bg-background text-on-surface">
      {!showNav && <LanguageSwitcher />}
      <main className={`pb-20 ${(!showNav || currentScreen === 'chatbot') ? 'h-screen' : ''}`}>
        {renderScreen()}
      </main>
      {showNav && (
        <BottomNav currentScreen={currentScreen} setCurrentScreen={setCurrentScreen} />
      )}
    </div>
  );
};

export default App;
