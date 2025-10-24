
import React from 'react';
import type { UserProfile, Plan, DailyNutrition, DailyWorkout } from '../types';
import { PlateIcon, DumbbellIcon, TargetIcon } from './icons/Icons';
import { useLanguage } from '../contexts/LanguageContext';

interface DashboardProps {
  userProfile: UserProfile;
  plan: Plan;
}

const getToday = (language: 'en' | 'es'): string => {
    const daysEn = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const daysEs = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const days = language === 'es' ? daysEs : daysEn;
    return days[new Date().getDay()];
}

export const Dashboard: React.FC<DashboardProps> = ({ userProfile, plan }) => {
    const { t, language } = useLanguage();
    const today = getToday(language);
    
    // Normalize day names for matching
    const todaysNutrition = plan.nutritionPlan.dailyPlans.find(p => p.day.toLowerCase() === today.toLowerCase());
    const todaysWorkout = plan.workoutPlan.schedule.find(p => p.day.toLowerCase() === today.toLowerCase());

    const goalMapping: { [key: string]: string } = {
        "Lose Weight": t('dashboard.loseWeight'),
        "Gain Muscle": t('dashboard.gainMuscle'),
        "Body Recomposition": t('dashboard.bodyRecomposition'),
        "Maintain Health": t('dashboard.maintainHealth'),
    };

    const translatedGoal = goalMapping[userProfile.goal] || userProfile.goal;

    return (
        <div className="p-4 space-y-6">
            <header>
                <h1 className="text-3xl font-bold">{t('dashboard.hello')}</h1>
                <p className="text-on-surface-secondary">{t('dashboard.planFor')} {today}.</p>
            </header>

            <div className="bg-surface p-4 rounded-lg shadow-lg">
                <div className="flex items-center space-x-3 mb-3">
                    <TargetIcon className="w-6 h-6 text-primary"/>
                    <h2 className="text-xl font-bold">{t('dashboard.yourGoal')}: {translatedGoal}</h2>
                </div>
                <p className="text-on-surface-secondary text-sm">{plan.nutritionPlan.summary}</p>
                <p className="text-on-surface-secondary text-sm mt-2">{plan.workoutPlan.summary}</p>
            </div>

            {todaysNutrition && (
                <div className="bg-surface p-4 rounded-lg shadow-lg">
                    <div className="flex items-center space-x-3 mb-3">
                        <PlateIcon className="w-6 h-6 text-primary"/>
                        <h2 className="text-xl font-bold">{t('dashboard.todaysNutrition')}</h2>
                    </div>
                    <div className="flex justify-around text-center">
                        <div>
                            <p className="text-2xl font-bold text-primary">{todaysNutrition.totalCalories}</p>
                            <p className="text-sm text-on-surface-secondary">{t('dashboard.calories')}</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-primary">{todaysNutrition.totalProtein}g</p>
                            <p className="text-sm text-on-surface-secondary">{t('dashboard.protein')}</p>
                        </div>
                    </div>
                    <div className="mt-4 space-y-2 text-sm">
                        {todaysNutrition.meals.map(meal => (
                            <div key={meal.name} className="flex justify-between">
                                <span className="font-semibold">{meal.time}</span>
                                <span className="text-on-surface-secondary">{meal.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {todaysWorkout ? (
                <div className="bg-surface p-4 rounded-lg shadow-lg">
                    <div className="flex items-center space-x-3 mb-3">
                        <DumbbellIcon className="w-6 h-6 text-primary"/>
                        <h2 className="text-xl font-bold">{t('dashboard.todaysWorkout')}</h2>
                    </div>
                    <p className="text-lg font-semibold text-primary">{todaysWorkout.focus}</p>
                    <p className="text-sm text-on-surface-secondary mb-3">{todaysWorkout.duration}</p>
                    <ul className="list-disc list-inside text-on-surface-secondary text-sm space-y-1">
                        {todaysWorkout.exercises.slice(0, 3).map(ex => (
                            <li key={ex.name}>{ex.name}: {ex.sets}x{ex.reps}</li>
                        ))}
                         {todaysWorkout.exercises.length > 3 && <li>{t('dashboard.andMore')}</li>}
                    </ul>
                </div>
            ) : (
                <div className="bg-surface p-4 rounded-lg shadow-lg text-center">
                    <h2 className="text-xl font-bold">{t('dashboard.restDay')}!</h2>
                    <p className="text-on-surface-secondary">{t('dashboard.restDayMessage')}</p>
                </div>
            )}
        </div>
    );
};