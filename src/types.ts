
export type AppScreen = 'dashboard' | 'nutrition' | 'workout' | 'chatbot' | 'explore' | 'progress';

export interface UserProfile {
  gender: string;
  age: number;
  weight: number;
  height: number;
  activityLevel: string;
  goal: string;
  workoutLocation: string;
  workoutDays: string[];
  equipment?: string[];
  measurements?: {
    chest?: number;
    waist?: number;
    hips?: number;
  };
}

export interface Meal {
  id: string;
  name: string;
  time: string;
  calories: number;
  protein: number;
  recipe: string[];
  ingredients: string[];
}

export interface DailyNutrition {
  day: string;
  totalCalories: number;
  totalProtein: number;
  meals: Meal[];
}

export interface Exercise {
  id: string;
  name: string;
  sets: string;
  reps: string;
  rest: string;
  description: string;
}

export interface DailyWorkout {
  id: string;
  day: string;
  focus: string;
  duration: string;
  exercises: Exercise[];
}

export interface NutritionPlan {
  summary: string;
  dailyPlans: DailyNutrition[];
}

export interface WorkoutPlan {
  summary: string;
  schedule: DailyWorkout[];
}

export interface Plan {
  nutritionPlan: NutritionPlan;
  workoutPlan: WorkoutPlan;
}

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

// --- New Tracking Types ---

export interface ProgressEntry {
  id: string;
  date: string; // ISO String
  weight?: number;
  measurements?: {
    chest?: number;
    waist?: number;
    hips?: number;
  };
  photo?: string; // base64 string
}

// key is meal.id
export type CompletedMealsLog = Record<string, boolean>;

export interface SetLog {
  weight: number;
  reps: number;
  completed: boolean;
}

// key is exercise.id
export type ExerciseLog = Record<string, SetLog[]>;

export interface ActiveWorkoutSession {
    id: string; // unique id for the session
    workoutId: string; // id of the DailyWorkout from the plan
    workoutName: string;
    startTime: number; // timestamp
    endTime?: number;
    exerciseLogs: ExerciseLog;
    feedback?: 'easy' | 'ideal' | 'hard';
}

export type UpdateMealHandler = (
    day: string,
    mealName: string,
    oldIngredient: string,
    newIngredient: string,
    newMealName?: string
) => boolean;
