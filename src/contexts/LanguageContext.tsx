

import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { locales } from '../locales';

type Language = 'en' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, replacements?: {[key: string]: string | number}) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('es'); // Default to Spanish

  const t = useCallback((key: string, replacements: {[key: string]: string | number} = {}): string => {
    const keys = key.split('.');
    let result: any = locales[language];
    for (const k of keys) {
      result = result?.[k];
      if (result === undefined) {
        // Fallback to English if key not found in current language
        let fallbackResult: any = locales.en;
        for (const fk of keys) {
          fallbackResult = fallbackResult?.[fk];
        }
        if (fallbackResult === undefined) return key;
        result = fallbackResult;
        break; // Found in fallback, no need to continue
      }
    }

    let resultString = result || key;

    // Handle replacements for dynamic values
    Object.keys(replacements).forEach(rKey => {
        const regex = new RegExp(`{${rKey}}`, 'g');
        resultString = resultString.replace(regex, String(replacements[rKey]));
    });


    return resultString;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
