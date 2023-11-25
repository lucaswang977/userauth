import crypto from "crypto"
import db from "@/l/dbconn"
import envVariables from "@/l/env"
import { User } from "@/l/types"
import * as jwt from "jsonwebtoken"
import { uuid } from "uuidv4"

export const generateSalt = () => crypto.randomBytes(16).toString("hex")

export const hashPassword = (password: string, salt: string) =>
  crypto.pbkdf2Sync(password, salt, 1000, 64, `sha512`).toString(`hex`)

export const verifyPassword = (password: string, salt: string, hash: string) =>
  hash === hashPassword(password, salt)

export const generateJwt = (payload: any) =>
  jwt.sign(payload, envVariables.JWT_SECRET, {
    expiresIn: envVariables.JWT_EXPIRES_SECS * 1000,
  })

export const createUserByEmail = async (
  email: string,
  pwd: string,
): Promise<boolean> => {
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

  if (res.numInsertedOrUpdatedRows) return true

  return false
}

export const deleteUserById = async (id: string): Promise<boolean> => {
  const res = await db.deleteFrom("user").where("user.id", "=", id).execute()
  if (res.length > 0) return true

  return false
}

export const findUserByEmail = async (
  email: string,
): Promise<User | undefined> => {
  const res = await db
    .selectFrom("user")
    .select(["id", "email"])
    .where("email", "=", email)
    .execute()

  if (res.length > 0) {
    return res[0] as User
  }

  return undefined
}

export const findUserById = async (id: string): Promise<User | undefined> => {
  const res = await db
    .selectFrom("user")
    .select(["id", "email"])
    .where("id", "=", id)
    .execute()

  if (res.length > 0) {
    return res[0] as User
  }

  return undefined
}

export const getUserObjectByEmail = async (
  email: string,
): Promise<User | undefined> => {
  const res = await db
    .selectFrom("user")
    .selectAll()
    .where("email", "=", email)
    .execute()

  if (res.length > 0) {
    return res[0] as User
  }

  return undefined
}

export const updateRefreshToken = async (
  userId: string,
): Promise<string | undefined> => {
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

  return undefined
}
