import crypto from "crypto"
import db from "@/l/dbconn"
import envVariables from "@/l/env"
import { User } from "@/l/types"
import * as jwt from "jsonwebtoken"
import { uuid } from "uuidv4"

export const generateSalt = () => crypto.randomBytes(16).toString("hex")

export const hashPassword = (password: string, salt: string) =>
  crypto.pbkdf2Sync(password, salt, 1000, 64, `sha512`).toString(`hex`)

export const verifyPassword = (password: string, hash: string, salt: string) =>
  hash === hashPassword(password, salt)

export const generateJwt = (payload: any) =>
  jwt.sign(payload, envVariables.JWT_SECRET, {
    expiresIn: envVariables.JWT_EXPIRES_SECS * 1000,
  })

export const createUserByEmail = async (email: string, pwd: string) => {
  const salt = generateSalt()
  const password = hashPassword(pwd, salt)
  const res = await db
    .insertInto("user")
    .values({
      email,
      password,
      salt,
    })
    .executeTakeFirst()

  if (res.numInsertedOrUpdatedRows) {
    const user = (await db
      .selectFrom("user")
      .where("email", "=", email)
      .executeTakeFirst()) as User
    if (user) return { id: user.id }
  }

  return undefined
}

export const deleteUserById = async (id: string) => {
  const res = await db
    .deleteFrom("user")
    .where("user.id", "=", id)
    .executeTakeFirst()
  if (res.numDeletedRows) return true

  return false
}

export const findUserByEmail = async (email: string) => {
  const res = (await db
    .selectFrom("user")
    .where("email", "=", email)
    .execute()) as User[]

  if (res.length > 0) {
    return res[0]
  }

  return undefined
}

export const updateRefreshToken = async (userId: string) => {
  const refreshToken = uuid()
  const expiresAt = new Date(Date.now() + envVariables.JWT_REFRESH_EXPIRES_SECS)

  const res = await db
    .updateTable("user")
    .where("id", "=", userId)
    .set({
      refresh_token: refreshToken,
      refresh_token_expires_at: expiresAt,
    })
    .executeTakeFirst()

  if (res.numUpdatedRows > 0) return refreshToken

  return null
}
