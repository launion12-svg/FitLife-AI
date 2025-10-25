

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export const GeneratingPlan: React.FC = () => {
    const { t } = useLanguage();
    const [progress, setProgress] = useState(0);
    const [statusIndex, setStatusIndex] = useState(0);

    const statusMessages = [
        t('generatingPlan.status1'),
        t('generatingPlan.status2'),
        t('generatingPlan.status3'),
        t('generatingPlan.status4'),
        t('generatingPlan.status5'),
        t('generatingPlan.status6'),
    ];

    useEffect(() => {
        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 95) {
                    clearInterval(progressInterval);
                    return 95; // Stop just before 100 to show it's waiting for finalization
                }
                return prev + 1;
            });
        }, 500); // ~50 seconds to reach 100%

        const statusInterval = setInterval(() => {
            setStatusIndex(prev => (prev + 1) % statusMessages.length);
        }, 3000);

        return () => {
            clearInterval(progressInterval);
            clearInterval(statusInterval);
        };
    }, [statusMessages.length]);

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-background p-4">
            <div className="w-full max-w-md text-center">
                <h1 className="text-3xl font-bold text-primary mb-2 animate-pulse">{t('generatingPlan.title')}</h1>
                <p className="text-on-surface-secondary mb-8">{t('generatingPlan.subtitle')}</p>

                <div className="w-full bg-surface rounded-full h-4 mb-4 overflow-hidden">
                    <div
                        className="bg-primary h-4 rounded-full transition-all duration-500 ease-linear"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>

                <p className="text-lg text-on-surface font-semibold h-8">
                    {statusMessages[statusIndex]}
                </p>
            </div>
        </div>
    );
};