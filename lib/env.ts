import { z } from "zod"

const envSchema = z.object({
  DATABASE_URL: z.string().trim().min(1),
  JWT_SECRET: z.string().trim().min(1),
  JWT_EXPIRES_SECS: z.preprocess(Number, z.number().default(300)),
  JWT_REFRESH_EXPIRES_SECS: z.preprocess(Number, z.number().default(3600)),
  EMAIL_ACTIVATE_EXPIRES_SECS: z.preprocess(Number, z.number().default(300)),
  EMAIL_SERVER: z.string().trim().min(1),
  EMAIL_FROM: z.string().trim().min(1),
  PASSWORD_RESET_CODE_EXPIRES_SECS: z.preprocess(
    Number,
    z.number().default(300),
  ),
  UPLOAD_RELATIVE_PATH: z.string().trim().default("upload"),
})

const envSchemaParser = envSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_SECS: process.env.JWT_EXPIRES_SECS,
  JWT_REFRESH_EXPIRES_SECS: process.env.JWT_REFRESH_EXPIRES_SECS,
  EMAIL_ACTIVATE_EXPIRES_SECS: process.env.EMAIL_ACTIVATE_EXPIRES_SECS,
  EMAIL_SERVER: process.env.EMAIL_SERVER,
  EMAIL_FROM: process.env.EMAIL_FROM,
  PASSWORD_RESET_CODE_EXPIRES_SECS:
    process.env.PASSWORD_RESET_CODE_EXPIRES_SECS,
  UPLOAD_RELATIVE_PATH: process.env.UPLOAD_RELATIVE_PATH,
})

if (!envSchemaParser.success) {
  throw new Error(envSchemaParser.error.toString())
}

const envVariables = envSchemaParser.data

export default envVariables
