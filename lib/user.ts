import crypto from "crypto"
import db from "@/l/dbconn"
import envVariables from "@/l/env"
import { JwtPayload, User } from "@/l/types"
import * as Jwt from "jsonwebtoken"
import { v4 as uuidv4 } from "uuid"

export const generateSalt = () => crypto.randomBytes(16).toString("hex")

export const hashPassword = (password: string, salt: string) =>
  crypto.pbkdf2Sync(password, salt, 1000, 64, `sha512`).toString(`hex`)

export const verifyPassword = (password: string, salt: string, hash: string) =>
  hash === hashPassword(password, salt)

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

export const getUserObjectById = async (
  id: string,
): Promise<User | undefined> => {
  const res = await db
    .selectFrom("user")
    .selectAll()
    .where("id", "=", id)
    .execute()

  if (res.length > 0) {
    return res[0] as User
  }

  return undefined
}

export const verifyJwt = (jwt: string) => {
  try {
    const payload = Jwt.verify(jwt, envVariables.JWT_SECRET) as JwtPayload
    return payload
  } catch (err) {
    return undefined
  }
}

export const verifyRefreshToken = async (
  userId: string,
  refreshToken: string,
) => {
  const user = await getUserObjectById(userId)
  if (user) {
    if (
      refreshToken === user.refresh_token &&
      user.refresh_token_expires_at &&
      user.refresh_token_expires_at > new Date(Date.now())
    ) {
      return true
    }
  }

  return false
}

export const generateJwt = (payload: JwtPayload, expiresInMSec?: number) =>
  Jwt.sign(payload, envVariables.JWT_SECRET, {
    expiresIn: expiresInMSec || envVariables.JWT_EXPIRES_SECS * 1000,
  })

export const generateRefreshToken = () => {
  const refreshToken = uuidv4()
  const expiresAt = new Date(Date.now() + envVariables.JWT_REFRESH_EXPIRES_SECS)

  return { refreshToken, expiresAt }
}

export const updateRefreshToken = async (
  userId: string,
  refreshToken: string,
  expiresAt: Date,
): Promise<boolean> => {
  const res = await db
    .updateTable("user")
    .where("id", "=", userId)
    .set({
      refresh_token: refreshToken,
      refresh_token_expires_at: expiresAt,
    })
    .executeTakeFirst()

  if (res.numUpdatedRows > 0) return true

  return false
}
