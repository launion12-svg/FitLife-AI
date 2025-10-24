
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  const buttonClasses = (lang: 'en' | 'es') => 
    `px-3 py-1 text-sm font-bold rounded-md transition-colors ${
      language === lang 
        ? 'bg-primary text-white' 
        : 'bg-surface text-on-surface-secondary hover:bg-gray-600'
    }`;

  return (
    <div className="absolute top-4 right-4 z-50 flex space-x-2 bg-surface p-1 rounded-lg shadow-lg">
      <button onClick={() => setLanguage('en')} className={buttonClasses('en')}>
        EN
      </button>
      <button onClick={() => setLanguage('es')} className={buttonClasses('es')}>
        ES
      </button>
    </div>
  );
};
