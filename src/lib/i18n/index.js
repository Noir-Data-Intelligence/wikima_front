// i18next configuration (PT / EN).
//
// For now it loads the legacy flat dictionaries under the default `translation`
// namespace so every existing t('some_key') call keeps working. As pages are
// migrated, strings move into per-domain namespaces (common, nav, dashboard…).

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { translations } from './legacy-resources';

export const SUPPORTED_LANGUAGES = ['pt', 'en'];
export const LANGUAGE_STORAGE_KEY = 'wikima_language';

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        pt: { translation: translations.pt },
        en: { translation: translations.en },
      },
      fallbackLng: 'en',
      supportedLngs: SUPPORTED_LANGUAGES,
      load: 'languageOnly', // pt-PT -> pt
      interpolation: { escapeValue: false },
      detection: {
        order: ['localStorage', 'navigator'],
        lookupLocalStorage: LANGUAGE_STORAGE_KEY,
        caches: ['localStorage'],
      },
      react: { useSuspense: false },
      returnNull: false,
    });
}

export default i18n;
