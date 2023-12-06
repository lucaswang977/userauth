// References:
// - https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html
// - https://hasura.io/blog/best-practices-of-using-jwt-with-graphql/

import "server-only"

import { mkdirSync } from "fs"
import { writeFile } from "fs/promises"
import {
  ActionResult,
  JwtPayload,
  LoginResult,
  ServerActionType,
  UserProfileType,
} from "@/l/types"
import {
  clearRefreshToken,
  clearUserActivationStatus,
  createUserByEmail,
  decodeAndVerifyJwt,
  decodeWithoutVerifyJwt,
  generateActivationCode,
  generateFingerprint,
  generateJwt,
  generatePasswordResetCode,
  generateRefreshToken,
  getFingprintCookie,
  getUserObjectByEmail,
  getUserObjectById,
  hashPassword,
  sendActivationCodeByMail,
  sendPasswordResetLinkByMail,
  setFingerprintCookie,
  updatePassword,
  updatePasswordResetCode,
  updateRefreshToken,
  updateUserActivationCode,
  updateUserProfile,
  verifyFingerprint,
  verifyPassword,
  verifyPasswordResetCode,
  verifyRefreshToken,
} from "@/l/user"

import envVariables from "./env"
import { generateUUID, getExtension } from "./utility"

const registerNotActivatedUserByEmailPwd: ServerActionType<
  ActionResult
> = async (email: string, pwd: string) => {
  const user = await getUserObjectByEmail(email)
  if (user) {
    return { result: false, reason: "Email already registered." }
  }

  const createRes = await createUserByEmail(email, pwd)
  if (createRes) {
    const newUser = await getUserObjectByEmail(email)
    if (newUser) {
      const activationCode = generateActivationCode()
      const activateRes = await updateUserActivationCode(
        newUser.id,
        activationCode,
      )
      if (activateRes) {
        const res = await sendActivationCodeByMail(email, activationCode)
        if (res) return { result: true }
        return { result: false, reason: "Send activation mail failed." }
      }
    }
  }

  return { result: false, reason: "User registration failed." }
}

const activateUserByActivationCode: ServerActionType<ActionResult> = async (
  email: string,
  code: string,
) => {
  const user = await getUserObjectByEmail(email)
  if (!user) {
    return { result: false, reason: "Email has not been registered yet." }
  }

  if (user.emailActivated) {
    return { result: false, reason: "Email has already been activated." }
  }

  if (user.emailActivateCode?.toLowerCase() === code.toLowerCase()) {
    const activateRes = await clearUserActivationStatus(user.id)
    if (activateRes) {
      return { result: true }
    }
  }

  return { result: false, reason: "Email activation failed." }
}

const loginByEmailPwd: ServerActionType<LoginResult> = async (
  email: string,
  pwd: string,
) => {
  const user = await getUserObjectByEmail(email)

  if (user) {
    const { id, passwordSalt, password, emailActivated } = user

    if (
      password &&
      passwordSalt &&
      verifyPassword(pwd, passwordSalt, password)
    ) {
      if (!emailActivated) {
        return { result: false, reason: "User not activated yet." }
      }

      // Save fingerprint in cookie and hashed one in the token
      const { fingerprint, hashedFingerprint } = generateFingerprint()
      setFingerprintCookie(fingerprint)
      const token = generateJwt({
        userId: user.id,
        hashedFingerprint,
      })

      const { refreshToken, expiresAt } = generateRefreshToken()
      const res = await updateRefreshToken(id, refreshToken, expiresAt)
      if (res)
        return { result: true, token, refreshToken, refreshExpires: expiresAt }
    }
  }

  return { result: false, reason: "Username or password invalid." }
}

const refreshJwt = async (
  refreshToken: string,
  token: string,
): Promise<LoginResult> => {
  // No need to check JWT's expiration, we just extract the data
  const decoded = decodeWithoutVerifyJwt(token)
  if (decoded) {
    const { userId, hashedFingerprint } = decoded as JwtPayload

    // Check the fingerprint from cookie and the hashed one saved in the token
    const cookieFingerprint = getFingprintCookie()
    if (cookieFingerprint) {
      const fingerprintVerifyRes = verifyFingerprint(
        cookieFingerprint,
        hashedFingerprint,
      )

      // Check the refreshToken from db
      const refreshTokenVerifyRes = await verifyRefreshToken(
        refreshToken,
        userId,
      )
      if (refreshTokenVerifyRes && fingerprintVerifyRes) {
        const res = generateRefreshToken()
        await updateRefreshToken(userId, res.refreshToken, res.expiresAt)

        const fp = generateFingerprint()
        setFingerprintCookie(fp.fingerprint)
        const newToken = generateJwt({
          userId,
          hashedFingerprint: fp.hashedFingerprint,
        })
        return {
          result: true,
          token: newToken,
          refreshToken: res.refreshToken,
          refreshExpires: res.expiresAt,
        }
      }
    }
  }

  return { result: false, reason: "Refresh token verification failed." }
}

const changePassword: ServerActionType<ActionResult> = async (
  token: string,
  oldPwd: string,
  newPwd: string,
) => {
  const cookieFingerprint = getFingprintCookie()
  const decodedJwt = decodeAndVerifyJwt(token) as JwtPayload
  if (cookieFingerprint && decodedJwt) {
    const res = verifyFingerprint(
      cookieFingerprint,
      decodedJwt.hashedFingerprint,
    )
    if (res) {
      const userObj = await getUserObjectById(decodedJwt.userId)
      if (
        userObj &&
        userObj.passwordSalt &&
        userObj.password === hashPassword(oldPwd, userObj.passwordSalt)
      ) {
        const updateRes = await updatePassword(decodedJwt.userId, newPwd)
        if (updateRes) return { result: true }
      } else {
        return { result: false, reason: "Old password is incorrect." }
      }
    }
  }

  return { result: false, reason: "Change password failed." }
}

const resetPasswordWithEmail: ServerActionType<ActionResult> = async (
  email: string,
) => {
  const userObj = await getUserObjectByEmail(email)

  if (userObj) {
    const resetCode = generatePasswordResetCode()
    // TODO: To create a valid link for resetting password
    const link = `https://${resetCode}`
    const updateRes = await updatePasswordResetCode(userObj.id, resetCode)
    if (updateRes) {
      const res = await sendPasswordResetLinkByMail(userObj.id, link)
      if (res) return { result: true }
      return { result: false, reason: "Send password reset email failed." }
    }
    return { result: false, reason: "Password reset failed." }
  }
  return { result: false, reason: "Email not found." }
}

const resetPasswordWithResetCode: ServerActionType<ActionResult> = async (
  email: string,
  resetCode: string,
  newPwd: string,
) => {
  const userObj = await getUserObjectByEmail(email)

  if (userObj) {
    const verifyRes = await verifyPasswordResetCode(userObj.id, resetCode)
    if (verifyRes) {
      const res = await updatePassword(userObj.id, newPwd)
      if (res) return { result: true }
      return { result: false, reason: "Update password failed." }
    }
  }
  return { result: false, reason: "Email not found." }
}

const changeProfile: ServerActionType<ActionResult> = async (
  token: string,
  profile: UserProfileType,
) => {
  const cookieFingerprint = getFingprintCookie()
  const decodedJwt = decodeAndVerifyJwt(token) as JwtPayload
  if (cookieFingerprint && decodedJwt) {
    const res = verifyFingerprint(
      cookieFingerprint,
      decodedJwt.hashedFingerprint,
    )
    if (res) {
      const userObj = await getUserObjectById(decodedJwt.userId)
      if (userObj) {
        const updateRes = await updateUserProfile(decodedJwt.userId, profile)
        if (updateRes) return { result: true }
      }
    }
  }

  return { result: false, reason: "Change profile failed." }
}

// Revoke the refresh token, so all the loggin in devices will be forced
// to re-login
const logoutAll: ServerActionType<ActionResult> = async (token: string) => {
  const cookieFingerprint = getFingprintCookie()
  const decodedJwt = decodeAndVerifyJwt(token) as JwtPayload
  if (cookieFingerprint && decodedJwt) {
    const res = verifyFingerprint(
      cookieFingerprint,
      decodedJwt.hashedFingerprint,
    )
    if (res) {
      const userObj = await getUserObjectById(decodedJwt.userId)
      if (userObj) {
        const updateRes = await clearRefreshToken(decodedJwt.userId)
        if (updateRes) return { result: true }
      }
    }
  }

  return { result: false, reason: "Logout failed." }
}

const uploadAvatarImage: ServerActionType<
  ActionResult & { url?: string }
> = async (token: string, fileInFormData: FormData) => {
  const cookieFingerprint = getFingprintCookie()
  const decodedJwt = decodeAndVerifyJwt(token) as JwtPayload
  if (cookieFingerprint && decodedJwt) {
    const res = verifyFingerprint(
      cookieFingerprint,
      decodedJwt.hashedFingerprint,
    )
    if (res) {
      const userObj = await getUserObjectById(decodedJwt.userId)
      if (userObj) {
        const file = fileInFormData.get("file") as File
        const filename = `${generateUUID()}.${getExtension(file.name)}`
        const buffer = await file.arrayBuffer()
        const uploadPath = `public/${envVariables.UPLOAD_RELATIVE_PATH}`
        try {
          mkdirSync(uploadPath)
        } catch (err) {
          if ((err as { code: string }).code !== "EEXIST")
            return { result: false, reason: "Internal error." }
        }
        await writeFile(`${uploadPath}/${filename}`, Buffer.from(buffer))
        return {
          result: true,
          url: `/${envVariables.UPLOAD_RELATIVE_PATH}/${filename}`,
        }
      }
    }
  }

  return { result: false, reason: "Upload failed." }
}

export {
  loginByEmailPwd,
  refreshJwt,
  registerNotActivatedUserByEmailPwd,
  activateUserByActivationCode,
  changePassword,
  resetPasswordWithEmail,
  resetPasswordWithResetCode,
  changeProfile,
  uploadAvatarImage,
  logoutAll,
}
