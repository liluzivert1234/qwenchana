// src/i18n.ts

import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en/translation.json";
import tl from "./locales/tl/translation.json";

const resources = {
  en: {
    translation: en,
  },
  tl: {
    translation: tl,
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
  // Optional: Setting keySeparator to false allows you to use dots in your translation keys
  // keySeparator: false,
});

export default i18n;
