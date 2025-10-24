

import React, { useState, useRef } from 'react';
// FIX: Update import paths to point to files inside the 'src' directory.
import type { NutritionPlan, DailyNutrition } from '../src/types';
import { analyzeImage } from '../src/services/geminiService';
import { CameraIcon } from './icons/Icons';
import { LoadingSpinner } from './LoadingSpinner';
// FIX: Update import paths to point to files inside the 'src' directory.
import { useLanguage } from '../src/contexts/LanguageContext';
import { useUserData } from '../src/contexts/UserDataContext';

const getTodayDateString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
};

const MealCard: React.FC<{ dayPlan: DailyNutrition }> = ({ dayPlan }) => {
    const { t } = useLanguage();
    const { completedMeals, toggleMealCompletion } = useUserData();
    const date = getTodayDateString();
    const dailyLog = completedMeals[date] || {};

    return (
        <div className="bg-surface p-4 rounded-lg shadow-lg mb-4">
            <h3 className="text-lg font-bold text-primary">{dayPlan.day}</h3>
            <p className="text-sm text-on-surface-secondary mb-3">
                {dayPlan.totalCalories} kcal | {dayPlan.totalProtein}g {t('nutrition.protein')}
            </p>
            {dayPlan.meals.map((meal) => (
                <div key={meal.id} className="border-t border-gray-700 py-2 flex items-center">
                    <input 
                        type="checkbox"
                        id={`meal-${meal.id}`}
                        checked={!!dailyLog[meal.id]}
                        onChange={() => toggleMealCompletion(date, meal.id)}
                        className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-primary focus:ring-primary focus:ring-offset-surface mr-3"
                    />
                    <label htmlFor={`meal-${meal.id}`} className="flex-1">
                        <p className="font-semibold">{meal.time}: {meal.name}</p>
                        <p className="text-xs text-on-surface-secondary">{meal.ingredients.join(', ')}</p>
                    </label>
                </div>
            ))}
        </div>
    );
};


export const Nutrition: React.FC<{ plan: NutritionPlan }> = ({ plan }) => {
    const { t } = useLanguage();
    const [analysisResult, setAnalysisResult] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);

        try {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64String = (reader.result as string).split(',')[1];
                const prompt = t('nutrition.analysisPrompt');
                const result = await analyzeImage(base64String, file.type, prompt);
                setAnalysisResult(result);
            };
            reader.readAsDataURL(file);
        } catch (e) {
            console.error(e);
            setError(t('nutrition.analysisError'));
        } finally {
            setIsLoading(false);
        }
    };
    
    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="p-4">
            <header className="mb-6">
                <h1 className="text-3xl font-bold">{t('nutrition.title')}</h1>
                <p className="text-on-surface-secondary">{plan.summary}</p>
            </header>

            <div className="bg-surface p-4 rounded-lg shadow-lg mb-6">
                <h2 className="text-xl font-bold mb-3 text-primary">{t('nutrition.analyzeMeal')}</h2>
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    className="hidden"
                />
                <button 
                    onClick={triggerFileInput}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-focus transition-colors disabled:bg-gray-500"
                >
                    <CameraIcon className="w-5 h-5 mr-2" />
                    {isLoading ? t('nutrition.analyzing') : t('nutrition.uploadButton')}
                </button>
                {isLoading && <div className="mt-4 flex justify-center"><LoadingSpinner /></div>}
                {error && <p className="text-red-500 mt-2">{error}</p>}
                {analysisResult && (
                    <div className="mt-4 p-4 bg-background rounded-md prose prose-invert max-w-none">
                        <pre className="whitespace-pre-wrap font-sans text-on-surface">{analysisResult}</pre>
                    </div>
                )}
            </div>
            
            <div>
                <h2 className="text-2xl font-bold mb-3">{t('nutrition.weeklyPlan')}</h2>
                {plan.dailyPlans.map((dayPlan, index) => (
                    <MealCard key={index} dayPlan={dayPlan} />
                ))}
            </div>
        </div>
    );
};