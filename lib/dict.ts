const dictionaries = {
  en: () => import("../dictionaries/en.json").then((module) => module.default),
  ja: () => import("../dictionaries/ja.json").then((module) => module.default),
  zh: () => import("../dictionaries/zh.json").then((module) => module.default),
}

export type Locale = keyof typeof dictionaries

export const supportedLocales: string[] = Object.keys(dictionaries)
export const defaultLocale: Locale = "en"

export const getDictionary = async (locale: Locale) => dictionaries[locale]()
