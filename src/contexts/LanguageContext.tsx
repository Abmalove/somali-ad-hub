import React, { createContext, useContext, useState } from 'react';

interface LanguageContextType {
  language: 'so' | 'en';
  setLanguage: (lang: 'so' | 'en') => void;
  t: (soText: string, enText: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<'so' | 'en'>('so');

  const t = (soText: string, enText: string) => {
    return language === 'so' ? soText : enText;
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
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};