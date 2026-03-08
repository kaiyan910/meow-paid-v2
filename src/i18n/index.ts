/**
 * i18n configuration — initializes i18next with react-i18next.
 * Import this module once in main.tsx before rendering the app.
 *
 * Language priority: localStorage > browser setting > fallback (en).
 */
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import zh from "./locales/zh.json";

const STORAGE_KEY = "explorer-lang";
const SUPPORTED_LANGS = ["en", "zh"] as const;

/** Resolves the initial language from localStorage or browser settings. */
function resolveLanguage(): string {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (
    stored &&
    SUPPORTED_LANGS.includes(stored as (typeof SUPPORTED_LANGS)[number])
  ) {
    return stored;
  }

  const browserLang = navigator.language.split("-")[0];
  if (
    SUPPORTED_LANGS.includes(browserLang as (typeof SUPPORTED_LANGS)[number])
  ) {
    return browserLang;
  }

  return "en";
}

const resources = {
  en: { translation: en },
  zh: { translation: zh },
} as const;

void i18n.use(initReactI18next).init({
  resources,
  lng: resolveLanguage(),
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

/** Changes the language and persists to localStorage. */
export function changeLanguage(lang: string) {
  void i18n.changeLanguage(lang);
  localStorage.setItem(STORAGE_KEY, lang);
}

export { STORAGE_KEY, SUPPORTED_LANGS };
export default i18n;
