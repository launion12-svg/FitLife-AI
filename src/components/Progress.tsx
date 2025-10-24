
import React, { useState } from 'react';
import { useUserData } from '../contexts/UserDataContext';
import { useLanguage } from '../contexts/LanguageContext';
import type { ProgressEntry } from '../types';
import { PlusCircleIcon, PhotographIcon, XCircleIcon, ClockIcon, InformationCircleIcon } from './icons/Icons';
import { LoadingSpinner } from './LoadingSpinner';

const LineChart: React.FC<{ data: ProgressEntry[] }> = ({ data }) => {
    const weightData = data.filter(d => typeof d.weight === 'number' && d.weight > 0);
    if (weightData.length < 2) {
        return <div className="text-center text-on-surface-secondary py-10">{useLanguage().t('progress.chartNotEnoughData')}</div>;
    }
    
    const PADDING = 40;
    const WIDTH = 500;
    const HEIGHT = 200;

    const maxWeight = Math.max(...weightData.map(d => d.weight!));
    const minWeight = Math.min(...weightData.map(d => d.weight!));
    const firstDate = new Date(weightData[0].date).getTime();
    const lastDate = new Date(weightData[weightData.length - 1].date).getTime();
    
    const getX = (date: string) => {
        const time = new Date(date).getTime();
        const domain = lastDate - firstDate;
        if (domain === 0) return PADDING;
        return ((time - firstDate) / domain) * (WIDTH - PADDING * 2) + PADDING;
    }
    
    const getY = (weight: number) => {
        const range = maxWeight - minWeight;
        if (range === 0) return HEIGHT / 2;
        return HEIGHT - (((weight - minWeight) / range) * (HEIGHT - PADDING * 2) + PADDING);
    }
    
    const path = weightData.map((d, i) => {
        const x = getX(d.date);
        const y = getY(d.weight!);
        return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
    }).join(' ');

    return (
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-auto">
            {/* Y-Axis labels */}
            <text x="5" y={getY(maxWeight) + 5} className="text-xs fill-current text-on-surface-secondary">{maxWeight.toFixed(1)}</text>
            <text x="5" y={getY(minWeight) + 5} className="text-xs fill-current text-on-surface-secondary">{minWeight.toFixed(1)}</text>

            {/* X-Axis labels */}
            <text x={getX(weightData[0].date)} y={HEIGHT - 5} className="text-xs fill-current text-on-surface-secondary text-anchor-middle">{new Date(weightData[0].date).toLocaleDateString()}</text>
            <text x={getX(weightData[weightData.length-1].date)} y={HEIGHT - 5} textAnchor="end" className="text-xs fill-current text-on-surface-secondary">{new Date(weightData[weightData.length-1].date).toLocaleDateString()}</text>
            
            <path d={path} stroke="currentColor" strokeWidth="2" fill="none" className="text-primary"/>
            {weightData.map((d, i) => (
                <circle key={i} cx={getX(d.date)} cy={getY(d.weight!)} r="3" fill="currentColor" className="text-primary" />
            ))}
        </svg>
    );
}

const ProgressReminder: React.FC = () => {
    const { t, language } = useLanguage();
    const { progressEntries } = useUserData();
    
    if (progressEntries.length === 0) {
        return (
            <div className="bg-primary/20 p-4 rounded-lg shadow-lg flex items-start gap-4">
                <ClockIcon className="w-8 h-8 text-primary shrink-0 mt-1"/>
                <div>
                    <h3 className="font-bold text-on-surface">{t('progress.reminderTitle')}</h3>
                    <p className="text-sm text-on-surface-secondary">{t('progress.noEntriesPrompt')}</p>
                </div>
            </div>
        );
    }

    const lastEntry = progressEntries[progressEntries.length - 1];
    const lastDate = new Date(lastEntry.date);
    const today = new Date();
    
    // Resetting time to compare dates only
    lastDate.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    
    const diffTime = today.getTime() - lastDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays >= 7) {
         return (
            <div className="bg-yellow-500/20 text-yellow-300 p-4 rounded-lg shadow-lg flex items-start gap-4">
                <ClockIcon className="w-8 h-8 text-yellow-400 shrink-0 mt-1"/>
                <div>
                    <h3 className="font-bold">{t('progress.reminderTitle')}</h3>
                    <p className="text-sm">{t('progress.logNowPrompt')}</p>
                </div>
            </div>
        );
    }

    let daysAgoText = '';
    if (diffDays === 0) {
        daysAgoText = t('progress.today');
    } else if (diffDays === 1) {
        daysAgoText = t('progress.daysAgo_one');
    } else {
        daysAgoText = t('progress.daysAgo', { count: diffDays });
    }

    const nextDate = new Date(lastEntry.date);
    nextDate.setDate(nextDate.getDate() + 7);
    const formattedNextDate = nextDate.toLocaleDateString(language, { weekday: 'long', month: 'long', day: 'numeric' });

    return (
         <div className="bg-surface p-4 rounded-lg shadow-lg flex items-start gap-4">
            <ClockIcon className="w-8 h-8 text-on-surface-secondary shrink-0 mt-1"/>
            <div>
                 <h3 className="font-bold text-on-surface-secondary">{t('progress.reminderTitle')}</h3>
                 <p className="text-sm text-on-surface">{t('progress.logSuccessMessage', { daysAgoText: daysAgoText, nextDate: formattedNextDate })}</p>
            </div>
        </div>
    );
};


export const Progress: React.FC = () => {
    const { t } = useLanguage();
    const { progressEntries, addProgressEntry } = useUserData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newEntry, setNewEntry] = useState<{weight?: number, measurements?: { chest?: number; waist?: number; hips?: number }, photo?: string}>({});
    const [isPhotoLoading, setIsPhotoLoading] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === 'weight' || name === 'chest' || name === 'waist' || name === 'hips') {
            const numValue = value ? parseFloat(value) : undefined;
             if (name === 'weight') {
                setNewEntry(prev => ({...prev, weight: numValue}));
            } else {
                setNewEntry(prev => ({ ...prev, measurements: { ...prev.measurements, [name]: numValue }}));
            }
        }
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        setIsPhotoLoading(true);
        const reader = new FileReader();
        reader.onloadend = () => {
            setNewEntry(prev => ({ ...prev, photo: reader.result as string }));
            setIsPhotoLoading(false);
        };
        reader.onerror = () => {
             console.error("Error reading file");
             setIsPhotoLoading(false);
        }
        reader.readAsDataURL(file);
    };

    const handleSubmit = () => {
        if (Object.keys(newEntry).length > 0) {
            addProgressEntry(newEntry);
        }
        setNewEntry({});
        setIsModalOpen(false);
    };

    const progressPhotos = progressEntries.filter(e => e.photo).reverse();

    return (
        <div className="p-4 space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">{t('progress.title')}</h1>
                    <p className="text-on-surface-secondary">{t('progress.subtitle')}</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="bg-primary p-2 rounded-full text-white shadow-lg hover:bg-primary-focus">
                    <PlusCircleIcon className="w-8 h-8"/>
                </button>
            </header>
            
            <ProgressReminder />

            <div className="bg-surface p-4 rounded-lg shadow-lg">
                <h2 className="text-xl font-bold mb-2">{t('progress.weightChartTitle')}</h2>
                <LineChart data={progressEntries} />
            </div>
            
            <div className="bg-surface p-4 rounded-lg shadow-lg">
                <div className="flex items-center space-x-3 mb-2">
                    <InformationCircleIcon className="w-6 h-6 text-primary" />
                    <h2 className="text-xl font-bold">{t('progress.progressTipsTitle')}</h2>
                </div>
                <ul className="list-disc list-inside space-y-1 text-sm text-on-surface-secondary">
                    <li>{t('progress.progressTip1')}</li>
                    <li>{t('progress.progressTip2')}</li>
                    <li>{t('progress.progressTip3')}</li>
                    <li>{t('progress.progressTip4')}</li>
                </ul>
            </div>

            <div className="bg-surface p-4 rounded-lg shadow-lg">
                <h2 className="text-xl font-bold mb-2">{t('progress.photoGalleryTitle')}</h2>
                {progressPhotos.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                        {progressPhotos.map(entry => (
                            <div key={entry.id} className="relative">
                                <img src={entry.photo} alt={`Progress from ${new Date(entry.date).toLocaleDateString()}`} className="rounded-lg object-cover aspect-square"/>
                                <p className="absolute bottom-0 left-0 bg-black/50 text-white text-xs px-1 rounded-br-lg rounded-tl-lg">{new Date(entry.date).toLocaleDateString()}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-on-surface-secondary text-center py-4">{t('progress.noPhotos')}</p>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-surface rounded-lg shadow-xl p-6 w-full max-w-sm space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold">{t('progress.modalTitle')}</h2>
                            <button onClick={() => setIsModalOpen(false)}><XCircleIcon className="w-6 h-6 text-on-surface-secondary"/></button>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-on-surface-secondary">{t('progress.weightLabel')} (kg)</label>
                            <input type="number" name="weight" step="0.1" onChange={handleInputChange} className="mt-1 block w-full bg-background border border-gray-600 rounded-md p-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-on-surface-secondary">{t('progress.measurementsLabel')}</label>
                            <div className="grid grid-cols-3 gap-2 mt-1">
                                <input type="number" name="chest" placeholder={t('progress.chest')} onChange={handleInputChange} className="block w-full bg-background border border-gray-600 rounded-md p-2" />
                                <input type="number" name="waist" placeholder={t('progress.waist')} onChange={handleInputChange} className="block w-full bg-background border border-gray-600 rounded-md p-2" />
                                <input type="number" name="hips" placeholder={t('progress.hips')} onChange={handleInputChange} className="block w-full bg-background border border-gray-600 rounded-md p-2" />
                            </div>
                        </div>

                        <div>
                             <label className="w-full cursor-pointer flex items-center justify-center gap-2 bg-background border border-gray-600 text-on-surface-secondary font-bold py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors">
                                 {isPhotoLoading ? <LoadingSpinner size={5}/> : <PhotographIcon className="w-5 h-5"/>}
                                 {newEntry.photo ? t('progress.photoAdded') : t('progress.addPhoto')}
                                 <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                            </label>
                            <p className="text-xs text-on-surface-secondary mt-1 text-center">{t('progress.storageWarning')}</p>
                        </div>

                        <button onClick={handleSubmit} className="w-full bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-focus transition-colors">{t('progress.logButton')}</button>
                    </div>
                </div>
            )}
        </div>
    );
};
