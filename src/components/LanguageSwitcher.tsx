import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="language-switch">
      <button 
        onClick={() => setLanguage('en')} 
        className={`lang-btn ${language === 'en' ? 'active' : ''}`}
        aria-label="Switch to English"
      >
        EN
      </button>
      <button 
        onClick={() => setLanguage('es')} 
        className={`lang-btn ${language === 'es' ? 'active' : ''}`}
        aria-label="Cambiar a Español"
      >
        ES
      </button>
    </div>
  );
};