import React, { useState, useEffect, useRef } from 'react';
// FIX: Update import paths to point to files inside the 'src' directory.
import type { WorkoutPlan, DailyWorkout, Exercise, ActiveWorkoutSession, SetLog } from '../types';
import { generateSpeech, getExerciseSubstitution } from '../services/geminiService';
import { SpeakerIcon, ArrowPathIcon, CheckCircleIcon } from './icons/Icons';
import { LoadingSpinner } from './LoadingSpinner';
// FIX: Update import paths to point to files inside the 'src' directory.
import { useLanguage } from '../contexts/LanguageContext';
import { useUserData } from '../contexts/UserDataContext';

// Helper for TTS audio
const decode = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

async function decodeAudioData(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length;
    const buffer = ctx.createBuffer(1, frameCount, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) { channelData[i] = dataInt16[i] / 32768.0; }
    return buffer;
}


const ActiveWorkoutScreen: React.FC<{
    session: ActiveWorkoutSession;
    workout: DailyWorkout;
    onUpdateSession: (session: ActiveWorkoutSession) => void;
    onFinishWorkout: (session: ActiveWorkoutSession) => void;
    onUpdateExercise: (oldId: string, newExercise: Exercise) => void;
    onCancelWorkout: () => void;
}> = ({ session, workout, onUpdateSession, onFinishWorkout, onUpdateExercise, onCancelWorkout }) => {
    const { t, language } = useLanguage();
    const [currentSet, setCurrentSet] = useState<Record<string, { weight: string, reps: string }>>({});
    const [substitutingId, setSubstitutingId] = useState<string | null>(null);
    const [loadingSpeechId, setLoadingSpeechId] = useState<string | null>(null);
    const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);
    const audioCtxRef = useRef<AudioContext | null>(null);
    
    useEffect(() => {
        let timer: number;
        if (isConfirmingCancel) {
            timer = window.setTimeout(() => setIsConfirmingCancel(false), 4000);
        }
        return () => clearTimeout(timer);
    }, [isConfirmingCancel]);


    const handlePlaySpeech = async (exercise: Exercise) => {
        if (loadingSpeechId) return;

        setLoadingSpeechId(exercise.id);
        try {
            if (!audioCtxRef.current) {
                audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            const audioCtx = audioCtxRef.current;

            const textToSpeak = t('workout.ttsPrompt', {
                exercise: exercise.name,
                sets: exercise.sets,
                reps: exercise.reps,
                rest: exercise.rest,
                description: exercise.description,
            });

            const base64Audio = await generateSpeech(textToSpeak);
            const decodedData = decode(base64Audio);
            const buffer = await decodeAudioData(decodedData, audioCtx);

            const source = audioCtx.createBufferSource();
            source.buffer = buffer;
            source.connect(audioCtx.destination);
            source.start(0);

        } catch (error) {
            console.error("Failed to generate or play speech:", error);
        } finally {
            setLoadingSpeechId(null);
        }
    };


    const handleLogSet = (exerciseId: string, setIndex: number) => {
        const newLogs = { ...(session.exerciseLogs[exerciseId] || []) };
        newLogs[setIndex] = {
            weight: parseFloat(currentSet[exerciseId]?.weight || '0'),
            reps: parseInt(currentSet[exerciseId]?.reps || '0', 10),
            completed: true,
        };
        const updatedLogs = { ...session.exerciseLogs, [exerciseId]: Object.values(newLogs) };
        onUpdateSession({ ...session, exerciseLogs: updatedLogs });
    };

    const handleInputChange = (exerciseId: string, field: 'weight' | 'reps', value: string) => {
        setCurrentSet(prev => ({
            ...prev,
            [exerciseId]: { ...(prev[exerciseId] || { weight: '', reps: '' }), [field]: value }
        }));
    };

    const handleSubstitute = async (exercise: Exercise) => {
        setSubstitutingId(exercise.id);
        try {
            // Placeholder for equipment from user profile
            const newExercise = await getExerciseSubstitution(exercise, { workoutFocus: workout.focus, equipment: "Dumbbells, Bodyweight" }, language);
            onUpdateExercise(exercise.id, newExercise);
        } catch (error) {
            console.error("Failed to get substitution", error);
        } finally {
            setSubstitutingId(null);
        }
    };
    
    const handleFeedback = (feedback: 'easy'|'ideal'|'hard') => {
        onFinishWorkout({...session, feedback});
    };
    
    const handleCancelClick = () => {
        if (isConfirmingCancel) {
            onCancelWorkout();
        } else {
            setIsConfirmingCancel(true);
        }
    };


    const isWorkoutComplete = workout.exercises.every(ex => {
        const logs = session.exerciseLogs[ex.id] || [];
        const isWarmup = ex.name.toLowerCase().includes(t('workout.warmupLabel').toLowerCase());
        // Warmup exercises might not have standard sets (e.g., '2x10'), handle gracefully
        const numSets = isWarmup ? (ex.sets.split('x')[0] ? parseInt(ex.sets.split('x')[0], 10) : 1) : parseInt(ex.sets.split('-')[0], 10);
        return logs.filter(log => log.completed).length >= numSets;
    });

    return (
        <div className="bg-surface p-4 rounded-lg shadow-lg">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h2 className="text-2xl font-bold text-primary">{workout.focus}</h2>
                    <p className="text-sm text-on-surface-secondary">{workout.duration}</p>
                </div>
                <div className="flex gap-2">
                    {isConfirmingCancel && (
                         <button onClick={() => setIsConfirmingCancel(false)} className="bg-gray-600 text-on-surface px-3 py-2 rounded-lg text-xs font-bold hover:bg-gray-500">
                           {t('workout.goBack')}
                         </button>
                    )}
                    <button 
                        onClick={handleCancelClick} 
                        className={`text-white px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                            isConfirmingCancel ? 'bg-red-600 hover:bg-red-500' : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                    >
                        {isConfirmingCancel ? t('workout.confirmCancelAction') : t('workout.cancel')}
                    </button>
                </div>
            </div>
            {workout.exercises.map(ex => {
                const numSets = parseInt(ex.sets.split(/[-x]/)[0], 10) || 1;
                const exerciseLogs = session.exerciseLogs[ex.id] || [];
                const isWarmup = ex.name.toLowerCase().includes(t('workout.warmupLabel').toLowerCase());

                return (
                    <div key={ex.id} className="border-t border-gray-700 py-4">
                        <div className="flex justify-between items-start">
                           <div>
                             <div className="flex items-center gap-2">
                                <h4 className={`font-semibold text-lg ${isWarmup ? 'text-primary' : ''}`}>{ex.name}</h4>
                                <button onClick={() => handlePlaySpeech(ex)} disabled={!!loadingSpeechId} className="text-primary disabled:opacity-50">
                                    {loadingSpeechId === ex.id ? <LoadingSpinner size={5} /> : <SpeakerIcon className="w-5 h-5"/>}
                                </button>
                             </div>
                             <p className="text-sm text-on-surface-secondary">{ex.sets}x{ex.reps} | Rest: {ex.rest}</p>
                           </div>
                           <button onClick={() => handleSubstitute(ex)} disabled={!!substitutingId || isWarmup} className="p-2 rounded-full bg-primary/20 text-primary hover:bg-primary/40 disabled:opacity-50 shrink-0">
                             {substitutingId === ex.id ? <LoadingSpinner size={5} /> : <ArrowPathIcon className="w-5 h-5"/>}
                           </button>
                        </div>
                        <div className="space-y-2 mt-3">
                            {Array.from({ length: numSets }).map((_, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm">
                                    <span className="font-bold w-12">{t('workout.set')} {i+1}</span>
                                    {!isWarmup && <input type="number" placeholder="kg" onChange={e => handleInputChange(ex.id, 'weight', e.target.value)} defaultValue={exerciseLogs[i]?.weight || ''} disabled={exerciseLogs[i]?.completed} className="w-20 bg-background rounded p-1 text-center"/>}
                                    <input type="number" placeholder={t('workout.reps')} onChange={e => handleInputChange(ex.id, 'reps', e.target.value)} defaultValue={exerciseLogs[i]?.reps || ''} disabled={exerciseLogs[i]?.completed} className="w-20 bg-background rounded p-1 text-center"/>
                                    <button onClick={() => handleLogSet(ex.id, i)} disabled={exerciseLogs[i]?.completed} className="p-1 disabled:opacity-50">
                                        <CheckCircleIcon className={`w-6 h-6 ${exerciseLogs[i]?.completed ? 'text-primary' : 'text-gray-500'}`}/>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
             {isWorkoutComplete && (
                <div className="mt-6 text-center">
                    <h3 className="font-bold text-lg">{t('workout.workoutComplete')}</h3>
                    <p className="text-on-surface-secondary text-sm mb-3">{t('workout.howWasIt')}</p>
                    <div className="flex justify-center gap-2">
                        <button onClick={() => handleFeedback('easy')} className="bg-green-500/20 text-green-400 px-4 py-2 rounded-lg">{t('workout.easy')}</button>
                        <button onClick={() => handleFeedback('ideal')} className="bg-yellow-500/20 text-yellow-400 px-4 py-2 rounded-lg">{t('workout.ideal')}</button>
                        <button onClick={() => handleFeedback('hard')} className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg">{t('workout.hard')}</button>
                    </div>
                </div>
            )}
        </div>
    );
};

interface WorkoutProps {
    plan: WorkoutPlan;
    onUpdateWorkout: (plan: WorkoutPlan) => void;
}

export const Workout: React.FC<WorkoutProps> = ({ plan, onUpdateWorkout }) => {
    const { t, language } = useLanguage();
    const { activeWorkout, startWorkout, updateActiveWorkout, finishWorkout, cancelWorkout } = useUserData();

    const getToday = () => {
        const days = language === 'es' ? ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"] : ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        return days[new Date().getDay()];
    };
    const todaysWorkoutInfo = plan.schedule.find(p => p.day.toLowerCase() === getToday().toLowerCase());
    
    const handleStartWorkout = () => {
        if (todaysWorkoutInfo) {
            startWorkout({ id: todaysWorkoutInfo.id, name: todaysWorkoutInfo.focus });
        }
    };

    const handleUpdateExercise = (oldId: string, newExercise: Exercise) => {
        const newSchedule = plan.schedule.map(day => ({
            ...day,
            exercises: day.exercises.map(ex => ex.id === oldId ? newExercise : ex)
        }));
        onUpdateWorkout({ ...plan, schedule: newSchedule });
    };
    
    const activeWorkoutDetails = plan.schedule.find(w => w.id === activeWorkout?.workoutId);

    if (activeWorkout && activeWorkoutDetails) {
        return (
             <div className="p-4">
                 <ActiveWorkoutScreen 
                    session={activeWorkout} 
                    workout={activeWorkoutDetails}
                    onUpdateSession={updateActiveWorkout}
                    onFinishWorkout={finishWorkout}
                    onUpdateExercise={handleUpdateExercise}
                    onCancelWorkout={cancelWorkout}
                 />
            </div>
        )
    }

    return (
        <div className="p-4">
            <header className="mb-6">
                <h1 className="text-3xl font-bold">{t('workout.title')}</h1>
                <p className="text-on-surface-secondary">{plan.summary}</p>
            </header>

            {todaysWorkoutInfo ? (
                <div className="bg-surface p-4 rounded-lg shadow-lg">
                    <h2 className="text-xl font-bold text-primary">{todaysWorkoutInfo.day}: {todaysWorkoutInfo.focus}</h2>
                    <p className="text-sm text-on-surface-secondary mb-4">{todaysWorkoutInfo.duration}</p>
                    <button onClick={handleStartWorkout} className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-primary-focus">
                        {t('workout.startWorkout')}
                    </button>
                </div>
            ) : (
                 <div className="bg-surface p-4 rounded-lg shadow-lg text-center">
                    <h2 className="text-xl font-bold">{t('dashboard.restDay')}</h2>
                    <p className="text-on-surface-secondary">{t('workout.restDayMessage')}</p>
                </div>
            )}

            <details className="mt-6">
                <summary className="text-lg font-bold cursor-pointer text-primary">{t('workout.viewFullSchedule')}</summary>
                <div className="mt-4 space-y-4">
                    {plan.schedule.map((workoutDay, index) => (
                        <div key={index} className="bg-surface p-4 rounded-lg shadow-lg">
                            <h3 className="font-bold text-primary">{workoutDay.day}: {workoutDay.focus}</h3>
                            <ul className="text-sm text-on-surface-secondary list-disc list-inside">
                                {workoutDay.exercises.map(e => <li key={e.id}>{e.name}</li>)}
                            </ul>
                        </div>
                    ))}
                </div>
            </details>
        </div>
    );
};