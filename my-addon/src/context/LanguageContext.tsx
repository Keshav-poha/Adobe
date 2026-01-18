import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations } from '../i18n/translations';
import { Language, TranslationKey } from '../i18n/types';
import addOnUISdk from "https://express.adobe.com/static/add-on-sdk/sdk.js";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Map Adobe Express locales to our supported languages
const mapLocaleToLanguage = (locale: string): Language => {
  if (locale.startsWith('es')) return 'es';
  if (locale.startsWith('fr')) return 'fr';
  return 'en'; // Default fallback
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  // Detect user's default language from Adobe Express SDK on mount and listen for changes
  useEffect(() => {
    const initializeLanguage = async () => {
      try {
        await addOnUISdk.ready;
        
        // Always detect Adobe Express user locale first
        const userLocale = addOnUISdk.app.ui.locale;
        const detectedLang = mapLocaleToLanguage(userLocale);
        setLanguageState(detectedLang);

        // Listen for locale changes in Adobe Express
        (addOnUISdk.app as any).on('localechange', (data: any) => {
          const newLang = mapLocaleToLanguage(data.locale);
          setLanguageState(newLang);
        });
      } catch (error) {
        // Adobe Express SDK not available — fallback to saved language or English
        // Fallback to localStorage or English if SDK fails
        const saved = localStorage.getItem('pixelpluck-language') as Language;
        if (saved && translations[saved]) {
          setLanguageState(saved);
        } else {
          setLanguageState('en');
        }
      }
    };
    
    initializeLanguage();
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('pixelpluck-language', lang);
  };

  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
