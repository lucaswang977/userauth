import { defaultLocale, supportedLocales, type Locale } from "@/l/dict"
import { match } from "@formatjs/intl-localematcher"
import clsx, { ClassValue } from "clsx"
import Negotiator from "negotiator"
import pino from "pino"
import { twMerge } from "tailwind-merge"
import { v4 as uuidv4 } from "uuid"

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

export const delay = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

// For server logging output
export const slogger = pino({
  name: "scaffold",
  level: "debug",
})

// For client/browser logging output
export const clogger = pino({
  name: "scaffold",
  level: "trace",
})

export const getExtension = (filename: string) => {
  const i = filename.lastIndexOf(".")
  return i < 0 ? "" : filename.substring(i + 1)
}

export const generateUUID = () => uuidv4()

export const getCurrentLocale = (
  acceptLanguageHeader: string | null,
): Locale => {
  if (acceptLanguageHeader) {
    const languages = new Negotiator({
      headers: { "accept-language": acceptLanguageHeader },
    }).languages()

    return match(languages, supportedLocales, defaultLocale) as Locale
  }

  return defaultLocale
}
