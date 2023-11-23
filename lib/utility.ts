import crypto from "crypto"
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

export const generateSalt = () => crypto.randomBytes(16).toString("hex")

export const hashPassword = (password: string, salt: string) =>
  crypto.pbkdf2Sync(password, salt, 1000, 64, `sha512`).toString(`hex`)

export const verifyPassword = (password: string, hash: string, salt: string) =>
  hash === crypto.pbkdf2Sync(password, salt, 1000, 64, `sha512`).toString(`hex`)
