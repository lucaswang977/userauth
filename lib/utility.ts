import clsx, { ClassValue } from "clsx"
import pino from "pino"
import { twMerge } from "tailwind-merge"

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
