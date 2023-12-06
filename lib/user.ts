import "server-only"

import crypto from "crypto"
import db from "@/l/dbconn"
import envVariables from "@/l/env"
import {
  JwtPayload,
  UpdateUserType,
  UserExternalType,
  UserProfileType,
  UserType,
} from "@/l/types"
import * as Jwt from "jsonwebtoken"
import { cookies } from "next/headers"
import * as nodemailer from "nodemailer"

import { generateUUID } from "./utility"

export const generateSalt = () => crypto.randomBytes(16).toString("hex")

export const hashPassword = (password: string, salt: string) =>
  crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex")

export const verifyPassword = (password: string, salt: string, hash: string) =>
  hash === hashPassword(password, salt)

export const generateActivationCode = () =>
  crypto.randomBytes(32).toString("hex").substring(0, 6)

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
  cookies().set({
    name: "__Secure-Fgp",
    value: fp,
    path: "/",
    maxAge: 60 * 60 * 8,
    httpOnly: true,
  })
}

export const getFingprintCookie = () => {
  const res = cookies().get("__Secure-Fgp")
  return res ? res.value : undefined
}

export const generatePasswordResetCode = () =>
  crypto.randomBytes(64).toString("hex")

export const createUserByEmail = async (
  email: string,
  pwd: string,
): Promise<boolean> => {
  const passwordSalt = generateSalt()
  const password = hashPassword(pwd, passwordSalt)
  const res = await db
    .insertInto("user")
    .values({
      email,
      password,
      passwordSalt,
    })
    .executeTakeFirst()

  if (res.numInsertedOrUpdatedRows) return true

  return false
}

export const deleteUserById = async (id: string): Promise<boolean> => {
  const res = await db.deleteFrom("user").where("id", "=", id).execute()
  if (res.length > 0) return true

  return false
}

export const deleteUserByEmail = async (email: string): Promise<boolean> => {
  const res = await db.deleteFrom("user").where("email", "=", email).execute()
  if (res.length > 0) return true

  return false
}

export const findUserByEmail = async (
  email: string,
): Promise<UserExternalType | undefined> => {
  const res = await db
    .selectFrom("user")
    .select(["id", "email"])
    .where("email", "=", email)
    .execute()

  if (res.length > 0) {
    return res[0] as UserExternalType
  }

  return undefined
}

export const findUserById = async (
  id: string,
): Promise<UserExternalType | undefined> => {
  const res = await db
    .selectFrom("user")
    .select(["id", "email"])
    .where("id", "=", id)
    .execute()

  if (res.length > 0) {
    return res[0] as UserExternalType
  }

  return undefined
}

export const getUserObjectByEmail = async (
  email: string,
): Promise<UserType | undefined> => {
  const res = await db
    .selectFrom("user")
    .selectAll()
    .where("email", "=", email)
    .execute()

  if (res.length > 0) {
    return res[0]
  }

  return undefined
}

export const getUserObjectById = async (
  id: string,
): Promise<UserType | undefined> => {
  const res = await db
    .selectFrom("user")
    .selectAll()
    .where("id", "=", id)
    .execute()

  if (res.length > 0) {
    return res[0]
  }

  return undefined
}

export const getUserObjectByRefreshToken = async (
  refreshToken: string,
): Promise<UserType | undefined> => {
  const res = await db
    .selectFrom("user")
    .selectAll()
    .where("refreshToken", "=", refreshToken)
    .execute()

  if (res.length > 0) {
    return res[0]
  }

  return undefined
}

export const decodeAndVerifyJwt = (jwt: string) => {
  try {
    const payload = Jwt.verify(jwt, envVariables.JWT_SECRET) as JwtPayload
    return payload
  } catch (err) {
    return undefined
  }
}

export const decodeWithoutVerifyJwt = (jwt: string) => Jwt.decode(jwt)

export const verifyRefreshToken = async (
  refreshToken: string,
  userId: string,
) => {
  const user = await getUserObjectByRefreshToken(refreshToken)
  if (user) {
    if (
      refreshToken === user.refreshToken &&
      userId === user.id &&
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
  const refreshToken = generateUUID()
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
      updatedAt: new Date(),
    })
    .executeTakeFirst()

  if (res.numUpdatedRows > 0) return true

  return false
}

export const clearRefreshToken = async (userId: string): Promise<boolean> => {
  const res = await db
    .updateTable("user")
    .where("id", "=", userId)
    .set({
      refreshToken: null,
      refreshTokenExpiresAt: null,
      updatedAt: new Date(),
    })
    .executeTakeFirst()

  if (res.numUpdatedRows > 0) return true

  return false
}

export const updateUserActivationCode = async (
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
      updatedAt: new Date(),
    })
    .executeTakeFirst()

  if (res.numUpdatedRows > 0) return true

  return false
}

export const clearUserActivationStatus = async (userId: string) => {
  const res = await db
    .updateTable("user")
    .where("id", "=", userId)
    .set({
      emailActivateCode: undefined,
      emailActivated: true,
      emailActivateCodeExpiresAt: undefined,
      updatedAt: new Date(),
    })
    .executeTakeFirst()

  if (res.numUpdatedRows > 0) return true

  return false
}

export const sendActivationCodeByMail = async (email: string, code: string) => {
  const transporter = nodemailer.createTransport(envVariables.EMAIL_SERVER)
  const res = await transporter.sendMail({
    from: envVariables.EMAIL_FROM,
    to: email,
    subject: "One Time Activation Code",
    text: `This is your one time activation code: ${code.toUpperCase()}`,
    html: `<p>This is your one time activation code: <b>${code.toUpperCase()}</b></p>`,
  })

  if (res.accepted.length > 0) return true

  return false
}

export const updatePassword = async (
  userId: string,
  password: string,
): Promise<boolean> => {
  const passwordSalt = generateSalt()
  const hashedPwd = hashPassword(password, passwordSalt)

  const res = await db
    .updateTable("user")
    .where("id", "=", userId)
    .set({
      password: hashedPwd,
      passwordSalt,
      updatedAt: new Date(),
    })
    .executeTakeFirst()

  if (res.numUpdatedRows > 0) return true

  return false
}

export const updatePasswordResetCode = async (
  userId: string,
  resetCode: string,
) => {
  const res = await db
    .updateTable("user")
    .where("id", "=", userId)
    .set({
      passwordResetCode: resetCode,
      passwordResetCodeExpiresAt: new Date(
        Date.now() + envVariables.PASSWORD_RESET_CODE_EXPIRES_SECS,
      ),
      updatedAt: new Date(),
    })
    .executeTakeFirst()

  if (res.numUpdatedRows > 0) return true

  return false
}

export const sendPasswordResetLinkByMail = async (
  email: string,
  link: string,
) => {
  const transporter = nodemailer.createTransport(envVariables.EMAIL_SERVER)
  const res = await transporter.sendMail({
    from: envVariables.EMAIL_FROM,
    to: email,
    subject: "Password Reset Link",
    text: `You can click here to reset your password: ${link}`,
    html: `<p>You can click here to reset your password: <a href="${link}">Reset Password</a></p>`,
  })

  if (res.accepted.length > 0) return true

  return false
}

export const verifyPasswordResetCode = async (
  userId: string,
  resetCode: string,
) => {
  const userObj = await getUserObjectById(userId)
  if (
    userObj &&
    userObj.passwordResetCode &&
    resetCode === userObj.passwordResetCode &&
    userObj.passwordResetCodeExpiresAt &&
    userObj.passwordResetCodeExpiresAt.getTime() > Date.now()
  ) {
    return true
  }

  return false
}

export const clearPasswordResetCode = async (userId: string) => {
  const res = await db
    .updateTable("user")
    .where("id", "=", userId)
    .set({
      passwordResetCode: "",
      passwordResetCodeExpiresAt: undefined,
      // TODO: Find a way to update the updatedAt more elegantly
      updatedAt: new Date(),
    })
    .executeTakeFirst()

  if (res.numUpdatedRows > 0) return true

  return false
}

export const updateUserProfile = async (
  userId: string,
  profile: UserProfileType,
) => {
  const userObj = await getUserObjectById(userId)

  if (userObj) {
    const dbQuery = db.updateTable("user").where("id", "=", userId)
    const updateObj: UpdateUserType = {
      updatedAt: new Date(),
    }

    if (profile.gender && profile.gender !== userObj.gender)
      updateObj.gender = profile.gender

    if (profile.nickname && profile.nickname !== userObj.nickname)
      updateObj.nickname = profile.nickname

    if (profile.firstName && profile.firstName !== userObj.firstName)
      updateObj.firstName = profile.firstName

    if (profile.lastName && profile.lastName !== userObj.lastName)
      updateObj.lastName = profile.lastName

    if (profile.avatarUrl && profile.avatarUrl !== userObj.avatarUrl)
      updateObj.avatarUrl = profile.avatarUrl

    const res = await dbQuery.set(updateObj).executeTakeFirst()
    if (res.numUpdatedRows > 0) return true
  }

  return false
}
