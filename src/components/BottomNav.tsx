

import React from 'react';
import type { AppScreen } from '../types';
import { HomeIcon, PlateIcon, DumbbellIcon, MessageIcon, SparklesIcon, ChartBarIcon } from './icons/Icons';
import { useLanguage } from '../contexts/LanguageContext';

interface BottomNavProps {
  currentScreen: AppScreen;
  setCurrentScreen: (screen: AppScreen) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentScreen, setCurrentScreen }) => {
  const { t } = useLanguage();

  const navItems = [
    { name: 'dashboard', label: t('nav.dashboard'), icon: HomeIcon },
    { name: 'nutrition', label: t('nav.nutrition'), icon: PlateIcon },
    { name: 'workout', label: t('nav.workout'), icon: DumbbellIcon },
    { name: 'progress', label: t('nav.progress'), icon: ChartBarIcon },
    { name: 'chatbot', label: t('nav.chat'), icon: MessageIcon },
    { name: 'explore', label: t('nav.explore'), icon: SparklesIcon },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-gray-700 shadow-lg">
      <div className="flex justify-around max-w-lg mx-auto">
        {navItems.map((item) => (
          <button
            key={item.name}
            onClick={() => setCurrentScreen(item.name as AppScreen)}
            className={`flex flex-col items-center justify-center w-full pt-2 pb-1 text-xs transition-colors duration-200 ${
              currentScreen === item.name
                ? 'text-primary'
                : 'text-on-surface-secondary hover:text-on-surface'
            }`}
          >
            <item.icon className="h-6 w-6 mb-1" />
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};
