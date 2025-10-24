import React, { useState } from 'react';
import type { UserProfile } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
  error: string | null;
  initialProfile?: UserProfile | null;
}

const equipmentOptions = [
    { key: 'dumbbells', value: 'Dumbbells' },
    { key: 'resistanceBands', value: 'Resistance Bands' },
    { key: 'kettlebell', value: 'Kettlebell' },
    { key: 'pullUpBar', value: 'Pull-up Bar' },
    { key: 'stationaryBike', value: 'Stationary Bike' },
    { key: 'treadmill', value: 'Treadmill' },
    { key: 'outdoorCardio', value: 'Outdoor Cardio (Running/Cycling)' },
];

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];


export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, error, initialProfile }) => {
  const { t, language } = useLanguage();
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<UserProfile>(initialProfile ?? {
    gender: 'Female',
    age: 30,
    weight: 70,
    height: 165,
    activityLevel: 'Sedentary',
    goal: 'Lose Weight',
    workoutLocation: 'Gym',
    workoutDays: [],
    equipment: [],
    measurements: {},
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: name === 'age' || name === 'weight' || name === 'height'
               ? parseInt(value, 10) 
               : value,
    }));
  };
  
  const handleMeasurementsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      measurements: {
        ...prev.measurements,
        [name]: value ? parseInt(value, 10) : undefined,
      }
    }));
  };

  const handleEquipmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setProfile(prev => {
        const currentEquipment = prev.equipment || [];
        if (checked) {
            return { ...prev, equipment: [...currentEquipment.filter(item => item !== 'None'), value] };
        } else {
            return { ...prev, equipment: currentEquipment.filter(item => item !== value) };
        }
    });
  };
  
  const handleDayToggle = (day: string) => {
    setProfile(prev => {
        const currentDays = prev.workoutDays || [];
        if (currentDays.includes(day)) {
            return { ...prev, workoutDays: currentDays.filter(d => d !== day) };
        } else {
            // Respecting the original 3-6 day limit from the slider
            if (currentDays.length >= 6) return prev; 
            return { ...prev, workoutDays: [...currentDays, day] };
        }
    });
  };


  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(profile);
  };
  
  const dayNameMapping: Record<string, string> = {
    'Monday': t('days.monday'),
    'Tuesday': t('days.tuesday'),
    'Wednesday': t('days.wednesday'),
    'Thursday': t('days.thursday'),
    'Friday': t('days.friday'),
    'Saturday': t('days.saturday'),
    'Sunday': t('days.sunday'),
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div>
            <h2 className="text-2xl font-bold text-center text-primary mb-6">{t('onboarding.aboutYou')}</h2>
            <div className="space-y-4">
              <label className="block">
                <span className="text-on-surface-secondary">{t('onboarding.gender')}</span>
                <select name="gender" value={profile.gender} onChange={handleChange} className="mt-1 block w-full bg-surface border border-gray-600 rounded-md p-2 focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50">
                  <option value="Female">{t('onboarding.female')}</option>
                  <option value="Male">{t('onboarding.male')}</option>
                  <option value="Other">{t('onboarding.other')}</option>
                </select>
              </label>
              <label className="block">
                <span className="text-on-surface-secondary">{t('onboarding.age')}</span>
                <input type="number" name="age" value={profile.age} onChange={handleChange} className="mt-1 block w-full bg-surface border border-gray-600 rounded-md p-2" />
              </label>
            </div>
            <button onClick={nextStep} className="mt-8 w-full bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-focus transition-colors">{t('onboarding.next')}</button>
          </div>
        );
      case 2:
        return (
          <div>
            <h2 className="text-2xl font-bold text-center text-primary mb-6">{t('onboarding.yourBody')}</h2>
            <div className="space-y-4">
              <label className="block">
                <span className="text-on-surface-secondary">{t('onboarding.weight')} (kg)</span>
                <input type="number" name="weight" value={profile.weight} onChange={handleChange} className="mt-1 block w-full bg-surface border border-gray-600 rounded-md p-2" />
              </label>
              <label className="block">
                <span className="text-on-surface-secondary">{t('onboarding.height')} (cm)</span>
                <input type="number" name="height" value={profile.height} onChange={handleChange} className="mt-1 block w-full bg-surface border border-gray-600 rounded-md p-2" />
              </label>
            </div>
            <div className="flex justify-between mt-8">
              <button onClick={prevStep} className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-500">{t('onboarding.back')}</button>
              <button onClick={nextStep} className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-focus">{t('onboarding.next')}</button>
            </div>
          </div>
        );
       case 3:
        return (
            <div>
                <h2 className="text-2xl font-bold text-center text-primary mb-2">{t('onboarding.yourMeasurements')}</h2>
                <p className="text-center text-sm text-on-surface-secondary mb-6">{t('onboarding.measurementsSubtitle')}</p>
                <div className="space-y-4">
                    <label className="block">
                        <span className="text-on-surface-secondary">{t('onboarding.chest')}</span>
                        <input type="number" name="chest" value={profile.measurements?.chest || ''} onChange={handleMeasurementsChange} className="mt-1 block w-full bg-surface border border-gray-600 rounded-md p-2" />
                    </label>
                    <label className="block">
                        <span className="text-on-surface-secondary">{t('onboarding.waist')}</span>
                        <input type="number" name="waist" value={profile.measurements?.waist || ''} onChange={handleMeasurementsChange} className="mt-1 block w-full bg-surface border border-gray-600 rounded-md p-2" />
                    </label>
                    <label className="block">
                        <span className="text-on-surface-secondary">{t('onboarding.hips')}</span>
                        <input type="number" name="hips" value={profile.measurements?.hips || ''} onChange={handleMeasurementsChange} className="mt-1 block w-full bg-surface border border-gray-600 rounded-md p-2" />
                    </label>
                </div>
                <div className="flex justify-between mt-8">
                    <button onClick={prevStep} className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-500">{t('onboarding.back')}</button>
                    <button onClick={nextStep} className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-focus">{t('onboarding.next')}</button>
                </div>
            </div>
        );
      case 4:
        return (
          <div>
            <h2 className="text-2xl font-bold text-center text-primary mb-6">{t('onboarding.yourLifestyle')}</h2>
            <div className="space-y-4">
              <label className="block">
                <span className="text-on-surface-secondary">{t('onboarding.activityLevel')}</span>
                <select name="activityLevel" value={profile.activityLevel} onChange={handleChange} className="mt-1 block w-full bg-surface border border-gray-600 rounded-md p-2">
                  <option value="Sedentary">{t('onboarding.sedentary')}</option>
                  <option value="Lightly Active">{t('onboarding.lightlyActive')}</option>
                  <option value="Moderately Active">{t('onboarding.moderatelyActive')}</option>
                  <option value="Very Active">{t('onboarding.veryActive')}</option>
                </select>
              </label>
              <label className="block">
                <span className="text-on-surface-secondary">{t('onboarding.primaryGoal')}</span>
                <select name="goal" value={profile.goal} onChange={handleChange} className="mt-1 block w-full bg-surface border border-gray-600 rounded-md p-2">
                  <option value="Lose Weight">{t('onboarding.loseWeight')}</option>
                  <option value="Gain Muscle">{t('onboarding.gainMuscle')}</option>
                  <option value="Body Recomposition">{t('onboarding.bodyRecomposition')}</option>
                  <option value="Maintain Health">{t('onboarding.maintainHealth')}</option>
                </select>
              </label>
            </div>
            <div className="flex justify-between mt-8">
              <button onClick={prevStep} className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-500">{t('onboarding.back')}</button>
              <button onClick={nextStep} className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-focus">{t('onboarding.next')}</button>
            </div>
          </div>
        );
      case 5:
        return (
          <div>
            <h2 className="text-2xl font-bold text-center text-primary mb-6">{t('onboarding.yourTraining')}</h2>
            <div className="space-y-4">
              <label className="block">
                <span className="text-on-surface-secondary">{t('onboarding.workoutLocation')}</span>
                <select name="workoutLocation" value={profile.workoutLocation} onChange={handleChange} className="mt-1 block w-full bg-surface border border-gray-600 rounded-md p-2">
                  <option value="Gym">{t('onboarding.gym')}</option>
                  <option value="Home">{t('onboarding.home')}</option>
                </select>
              </label>

             {profile.workoutLocation === 'Home' && (
                <div className="pt-4">
                  <span className="text-on-surface-secondary">{t('onboarding.homeEquipmentTitle')}</span>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2 text-sm">
                    {equipmentOptions.map(opt => (
                        <label key={opt.key} className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                value={opt.value}
                                checked={profile.equipment?.includes(opt.value)}
                                onChange={handleEquipmentChange}
                                className="rounded bg-gray-700 border-gray-600 text-primary focus:ring-primary focus:ring-offset-surface"
                            />
                            <span className="text-on-surface">{t(`onboarding.${opt.key}`)}</span>
                        </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="block pt-4">
                <span className="text-on-surface-secondary">{t('onboarding.workoutDays')}</span>
                 <div className="grid grid-cols-4 gap-2 mt-2">
                    {daysOfWeek.map(day => {
                        const isSelected = profile.workoutDays.includes(dayNameMapping[day]);
                        return (
                             <button
                                key={day}
                                onClick={() => handleDayToggle(dayNameMapping[day])}
                                className={`py-2 px-1 text-sm rounded-lg transition-colors border ${
                                    isSelected 
                                        ? 'bg-primary border-primary text-white font-bold' 
                                        : 'bg-background border-gray-600 hover:bg-gray-700'
                                }`}
                             >
                                {t(`daysShort.${day.toLowerCase()}`)}
                             </button>
                        )
                    })}
                 </div>
                 <div className="text-center text-on-surface-secondary mt-2 text-sm">
                    {t('onboarding.daysSelected', { count: profile.workoutDays.length })}
                 </div>
              </div>
            </div>
            <div className="flex justify-between mt-8">
              <button onClick={prevStep} className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-500">{t('onboarding.back')}</button>
              <button 
                onClick={handleSubmit} 
                disabled={profile.workoutDays.length < 3}
                className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-focus disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
              >
                {t('onboarding.generatePlan')}
               </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md mx-auto bg-surface rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center mb-2">{t('onboarding.welcomeTitle')} <span className="text-primary">FitLife AI</span></h1>
        <p className="text-center text-on-surface-secondary mb-8">{t('onboarding.welcomeSubtitle')}</p>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        {renderStep()}
        <div className="w-full bg-gray-700 rounded-full h-1.5 mt-8">
            <div className="bg-primary h-1.5 rounded-full" style={{ width: `${(step / 5) * 100}%` }}></div>
        </div>
      </div>
    </div>
  );
};