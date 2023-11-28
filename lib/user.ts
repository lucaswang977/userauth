import "server-only"

import crypto from "crypto"
import db from "@/l/dbconn"
import envVariables from "@/l/env"
import { JwtPayload, User } from "@/l/types"
import * as Jwt from "jsonwebtoken"
import { cookies } from "next/headers"
import { v4 as uuidv4 } from "uuid"

export const generateSalt = () => crypto.randomBytes(16).toString("hex")

export const hashPassword = (password: string, salt: string) =>
  crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex")

export const verifyPassword = (password: string, salt: string, hash: string) =>
  hash === hashPassword(password, salt)

export const generateActivationCode = () =>
  crypto.randomBytes(20).toString("hex").substring(0, 6)

export const sha256 = (text: string) =>
  crypto.createHash("sha256").update(text).digest("hex")

export const generateFingerprint = () => {
  const fingerprint = crypto.randomBytes(64).toString("hex")
  const hashedFingerprint = sha256(fingerprint)
  return { fingerprint, hashedFingerprint }
}

export const verifyFingerprint = (fp: string, hashFp: string) =>
  sha256(fp) === hashFp

// https://github.com/vercel/next.js/issues/49259
export const setFingerprintCookie = (fp: string) => {
  // @ts-ignore
  cookies.set({
    name: "__Secure-Fgp",
    value: fp,
    path: "/",
    maxAge: 60 * 60 * 8,
    httpOnly: true,
  })
}

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

export const verifyAndDecodeJwt = (jwt: string) => {
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
      refreshToken === user.refreshToken &&
      user.refreshTokenExpiresAt &&
      user.refreshTokenExpiresAt > new Date(Date.now())
    ) {
      return true
    }
  }

  return false
}

export const generateJwt = (payload: JwtPayload, expiresInSec?: number) =>
  Jwt.sign(payload, envVariables.JWT_SECRET, {
    expiresIn: expiresInSec || envVariables.JWT_EXPIRES_SECS,
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
      refreshToken,
      refreshTokenExpiresAt: expiresAt,
    })
    .executeTakeFirst()

  if (res.numUpdatedRows > 0) return true

  return false
}

export const setUserActivationCode = async (
  userId: string,
  emailActivateCode: string,
) => {
  const res = await db
    .updateTable("user")
    .where("id", "=", userId)
    .set({
      emailActivateCode,
      emailActivated: false,
      emailActivateCodeExpiresAt: new Date(
        Date.now() + envVariables.EMAIL_ACTIVATE_EXPIRES_SECS,
      ),
    })
    .executeTakeFirst()

  if (res.numUpdatedRows > 0) return true

  return false
}

export const removeUserActivationStatus = async (userId: string) => {
  const res = await db
    .updateTable("user")
    .where("id", "=", userId)
    .set({
      emailActivateCode: undefined,
      emailActivated: true,
      emailActivateCodeExpiresAt: undefined,
    })
    .executeTakeFirst()

  if (res.numUpdatedRows > 0) return true

  return false
}
