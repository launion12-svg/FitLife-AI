import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import type { ProgressEntry, CompletedMealsLog, ActiveWorkoutSession } from '../types';

// Helper functions to interact with localStorage
const getFromStorage = <T,>(key: string, defaultValue: T): T => {
    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error(`Error reading from localStorage key “${key}”:`, error);
        return defaultValue;
    }
};

const saveToStorage = <T,>(key: string, value: T) => {
    try {
        const item = JSON.stringify(value);
        window.localStorage.setItem(key, item);
    } catch (error) {
        console.error(`Error saving to localStorage key “${key}”:`, error);
    }
};

interface UserDataContextType {
    // Progress
    progressEntries: ProgressEntry[];
    addProgressEntry: (entry: Omit<ProgressEntry, 'id' | 'date'>) => void;
    
    // Nutrition
    completedMeals: Record<string, CompletedMealsLog>; // { 'YYYY-MM-DD': { mealId: true } }
    toggleMealCompletion: (date: string, mealId: string) => void;

    // Workout
    activeWorkout: ActiveWorkoutSession | null;
    startWorkout: (workout: { id: string, name: string }) => ActiveWorkoutSession;
    updateActiveWorkout: (session: ActiveWorkoutSession) => void;
    finishWorkout: (session: ActiveWorkoutSession) => void;
    workoutHistory: ActiveWorkoutSession[];
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

export const UserDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [progressEntries, setProgressEntries] = useState<ProgressEntry[]>(() => getFromStorage('progressEntries', []));
    const [completedMeals, setCompletedMeals] = useState<Record<string, CompletedMealsLog>>(() => getFromStorage('completedMeals', {}));
    const [activeWorkout, setActiveWorkout] = useState<ActiveWorkoutSession | null>(() => getFromStorage('activeWorkout', null));
    const [workoutHistory, setWorkoutHistory] = useState<ActiveWorkoutSession[]>(() => getFromStorage('workoutHistory', []));

    useEffect(() => { saveToStorage('progressEntries', progressEntries) }, [progressEntries]);
    useEffect(() => { saveToStorage('completedMeals', completedMeals) }, [completedMeals]);
    useEffect(() => { saveToStorage('activeWorkout', activeWorkout) }, [activeWorkout]);
    useEffect(() => { saveToStorage('workoutHistory', workoutHistory) }, [workoutHistory]);

    const addProgressEntry = (entry: Omit<ProgressEntry, 'id' | 'date'>) => {
        const newEntry: ProgressEntry = {
            ...entry,
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
        };
        setProgressEntries(prev => [...prev, newEntry].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    };

    const toggleMealCompletion = (date: string, mealId: string) => {
        setCompletedMeals(prev => {
            const newLog = { ...prev };
            if (!newLog[date]) {
                newLog[date] = {};
            }
            newLog[date][mealId] = !newLog[date][mealId];
            return newLog;
        });
    };

    const startWorkout = (workout: { id: string, name: string }) => {
        const newSession: ActiveWorkoutSession = {
            id: crypto.randomUUID(),
            workoutId: workout.id,
            workoutName: workout.name,
            startTime: Date.now(),
            exerciseLogs: {},
        };
        setActiveWorkout(newSession);
        return newSession;
    };
    
    const updateActiveWorkout = (session: ActiveWorkoutSession) => {
        setActiveWorkout(session);
    };

    const finishWorkout = (session: ActiveWorkoutSession) => {
        const finishedSession = { ...session, endTime: Date.now() };
        setWorkoutHistory(prev => [finishedSession, ...prev]);
        setActiveWorkout(null);
    };


    return (
        <UserDataContext.Provider value={{
            progressEntries,
            addProgressEntry,
            completedMeals,
            toggleMealCompletion,
            activeWorkout,
            startWorkout,
            updateActiveWorkout,
            finishWorkout,
            workoutHistory,
        }}>
            {children}
        </UserDataContext.Provider>
    );
};

export const useUserData = (): UserDataContextType => {
    const context = useContext(UserDataContext);
    if (!context) {
        throw new Error('useUserData must be used within a UserDataProvider');
    }
    return context;
};
