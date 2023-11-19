import clsx, { ClassValue } from "clsx"
import pino from "pino"
import { twMerge } from "tailwind-merge"

const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

const delay = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

// For server logging output
const slogger = pino({
  name: "scaffold",
  level: "debug",
})

// For client/browser logging output
const clogger = pino({
  name: "scaffold",
  level: "trace",
})

export { cn, delay, slogger, clogger }
