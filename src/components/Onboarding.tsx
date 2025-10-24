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
  const { t } = useLanguage();
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
            if (currentDays.length >= 6) return prev; 
            return { ...prev, workoutDays: [...currentDays, day] };
        }
    });
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

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 5) {
      onComplete(profile);
    } else {
      nextStep();
    }
  };

  const renderStepContent = () => {
    switch(step) {
      case 1:
        return (
          <>
            <div className="section-title">{t('onboarding.aboutYou')}</div>
            <div className="form-group">
                <label htmlFor="gender">{t('onboarding.gender')}</label>
                <select id="gender" name="gender" value={profile.gender} onChange={handleChange} required>
                    <option value="Female">{t('onboarding.female')}</option>
                    <option value="Male">{t('onboarding.male')}</option>
                    <option value="Other">{t('onboarding.other')}</option>
                </select>
            </div>
            <div className="form-group">
                <label htmlFor="age">{t('onboarding.age')}</label>
                <input type="number" id="age" name="age" value={profile.age} onChange={handleChange} placeholder={t('onboarding.age')} min="15" max="100" required />
            </div>
          </>
        );
      case 2:
        return (
            <>
                <div className="section-title">{t('onboarding.yourBody')}</div>
                <div className="form-group">
                    <label htmlFor="weight">{t('onboarding.weight')} (kg)</label>
                    <input type="number" id="weight" name="weight" value={profile.weight} onChange={handleChange} placeholder="70" required />
                </div>
                <div className="form-group">
                    <label htmlFor="height">{t('onboarding.height')} (cm)</label>
                    <input type="number" id="height" name="height" value={profile.height} onChange={handleChange} placeholder="165" required />
                </div>
            </>
        );
      case 3:
          return (
              <>
                  <div className="section-title">{t('onboarding.yourMeasurements')}</div>
                  <p className="text-center text-sm text-on-surface-secondary -mt-4 mb-6">{t('onboarding.measurementsSubtitle')}</p>
                  <div className="form-group">
                      <label htmlFor="chest">{t('onboarding.chest')}</label>
                      <input type="number" name="chest" id="chest" value={profile.measurements?.chest || ''} onChange={handleMeasurementsChange} />
                  </div>
                  <div className="form-group">
                      <label htmlFor="waist">{t('onboarding.waist')}</label>
                      <input type="number" name="waist" id="waist" value={profile.measurements?.waist || ''} onChange={handleMeasurementsChange} />
                  </div>
                  <div className="form-group">
                      <label htmlFor="hips">{t('onboarding.hips')}</label>
                      <input type="number" name="hips" id="hips" value={profile.measurements?.hips || ''} onChange={handleMeasurementsChange} />
                  </div>
              </>
          );
      case 4:
        return (
            <>
                <div className="section-title">{t('onboarding.yourLifestyle')}</div>
                <div className="form-group">
                    <label htmlFor="activityLevel">{t('onboarding.activityLevel')}</label>
                    <select id="activityLevel" name="activityLevel" value={profile.activityLevel} onChange={handleChange}>
                        <option value="Sedentary">{t('onboarding.sedentary')}</option>
                        <option value="Lightly Active">{t('onboarding.lightlyActive')}</option>
                        <option value="Moderately Active">{t('onboarding.moderatelyActive')}</option>
                        <option value="Very Active">{t('onboarding.veryActive')}</option>
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor="goal">{t('onboarding.primaryGoal')}</label>
                    <select id="goal" name="goal" value={profile.goal} onChange={handleChange}>
                        <option value="Lose Weight">{t('onboarding.loseWeight')}</option>
                        <option value="Gain Muscle">{t('onboarding.gainMuscle')}</option>
                        <option value="Body Recomposition">{t('onboarding.bodyRecomposition')}</option>
                        <option value="Maintain Health">{t('onboarding.maintainHealth')}</option>
                    </select>
                </div>
            </>
        );
      case 5:
        return (
            <>
                <div className="section-title">{t('onboarding.yourTraining')}</div>
                <div className="form-group">
                    <label htmlFor="workoutLocation">{t('onboarding.workoutLocation')}</label>
                    <select name="workoutLocation" id="workoutLocation" value={profile.workoutLocation} onChange={handleChange}>
                        <option value="Gym">{t('onboarding.gym')}</option>
                        <option value="Home">{t('onboarding.home')}</option>
                    </select>
                </div>
                {profile.workoutLocation === 'Home' && (
                    <div className="form-group">
                        <label>{t('onboarding.homeEquipmentTitle')}</label>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2 text-sm">
                            {equipmentOptions.map(opt => (
                                <label key={opt.key} className="flex items-center space-x-2 font-normal normal-case tracking-normal">
                                    <input type="checkbox" value={opt.value} checked={profile.equipment?.includes(opt.value)} onChange={handleEquipmentChange}
                                        className="!w-4 !h-4 rounded bg-gray-700 border-gray-600 text-primary focus:ring-primary focus:ring-offset-surface"
                                    />
                                    <span className="text-on-surface">{t(`onboarding.${opt.key}`)}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}
                <div className="form-group">
                    <label>{t('onboarding.workoutDays')}</label>
                    <div className="grid grid-cols-4 gap-2 mt-2">
                        {daysOfWeek.map(day => (
                            <button type="button" key={day} onClick={() => handleDayToggle(dayNameMapping[day])}
                                className={`py-2 px-1 text-sm rounded-lg transition-colors border ${
                                    profile.workoutDays.includes(dayNameMapping[day])
                                        ? 'bg-primary border-primary text-white font-bold'
                                        : 'bg-background border-gray-600 hover:bg-gray-700'
                                }`}
                            >
                                {t(`daysShort.${day.toLowerCase()}`)}
                            </button>
                        ))}
                    </div>
                    <p className="text-center text-on-surface-secondary mt-2 text-sm">{t('onboarding.daysSelected', { count: profile.workoutDays.length })}</p>
                </div>
            </>
        );
      default: return null;
    }
  }

  return (
    <div className="onboarding-root">
        <div className="bg-animation">
            <div className="particle"></div>
            <div className="particle"></div>
            <div className="particle"></div>
        </div>

        <div className="container">
            <div className="deco-circle deco-circle-1"></div>
            <div className="deco-circle deco-circle-2"></div>
            <div className="icon-decoration icon-dumbbell">💪</div>
            <div className="icon-decoration icon-apple">🍎</div>

            <div className="header">
                <div className="logo">FitLife AI</div>
                <div className="welcome-text">{t('onboarding.welcomeTitle')}</div>
                <div className="subtitle">{t('onboarding.welcomeSubtitle')}</div>
            </div>

            {error && <p className="text-red-500 text-center mb-4">{error}</p>}

            <form onSubmit={handleFormSubmit}>
                {renderStepContent()}
                
                <div className="flex items-center gap-4 mt-8">
                    {step > 1 && (
                        <button type="button" onClick={prevStep} className="btn-secondary">
                            {t('onboarding.back')}
                        </button>
                    )}
                    <button type="submit" className="btn-primary" style={{flexGrow: 1}} disabled={step === 5 && profile.workoutDays.length < 3}>
                        {step === 5 ? t('onboarding.generatePlan') : `${t('onboarding.next')} →`}
                    </button>
                </div>

                <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${(step / 5) * 100}%` }}></div>
                </div>
            </form>
        </div>
    </div>
  );
};
