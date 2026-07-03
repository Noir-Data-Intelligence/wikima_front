// Compatibility shim.
//
// The real i18n engine is now react-i18next (see src/lib/i18n). This file keeps
// the old API — useLanguage() -> { language, setLanguage, t, toggleLanguage } and
// <LanguageProvider> — so the ~75 existing consumers keep working unchanged while
// pages migrate to useTranslation() directly.

import React from 'react';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';

export const useLanguage = () => {
  const { t, i18n } = useTranslation();
  const language = (i18n.language || 'en').startsWith('pt') ? 'pt' : 'en';
  const setLanguage = (lng) => i18n.changeLanguage(lng);
  const toggleLanguage = () => i18n.changeLanguage(language === 'pt' ? 'en' : 'pt');
  return { language, setLanguage, t, toggleLanguage };
};

// Kept for API compatibility — i18n is global, so this is just a passthrough.
export const LanguageProvider = ({ children }) => <>{children}</>;

export default LanguageProvider;
