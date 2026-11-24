import { createInstance } from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import zh from "./locales/zh.json";

const STORAGE_KEY = "explorer-lang";
const i18n = createInstance();

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, zh: { translation: zh } },
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

/** Restores the saved language after hydration, then falls back to the browser preference. */
export function initializeBrowserLanguage() {
  let language = window.navigator.language.split("-")[0];
  try {
    language = window.localStorage.getItem(STORAGE_KEY) ?? language;
  } catch {
    // Some browsers block storage when privacy restrictions are enabled.
  }
  applyLanguage(language === "zh" ? "zh" : "en");
}

function applyLanguage(lang: "en" | "zh") {
  void i18n.changeLanguage(lang);
  document.documentElement.lang = lang === "zh" ? "zh-Hant" : "en";
}

/** Changes the interface language and remembers it on this device. */
export function changeLanguage(lang: string) {
  if (lang !== "en" && lang !== "zh") return;
  applyLanguage(lang);
  try {
    window.localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // The current page can still use the selected language.
  }
}

export default i18n;
