// References:
// - https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html
// - https://hasura.io/blog/best-practices-of-using-jwt-with-graphql/

import "server-only"

import {
  JwtPayload,
  LoginResult,
  ServerActionType,
  UserProfileType,
} from "@/l/types"
import {
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

const registerNotActivatedUserByEmailPwd: ServerActionType = async (
  email: string,
  pwd: string,
) => {
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

const activateUserByActivationCode: ServerActionType = async (
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

const loginByEmailPwd = async (
  email: string,
  pwd: string,
): Promise<LoginResult> => {
  const user = await getUserObjectByEmail(email)

  if (user) {
    const { id, salt, password, emailActivated } = user

    if (password && salt && verifyPassword(pwd, salt, password)) {
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

const refreshJwt: ServerActionType = async (
  refreshToken: string,
  token: string,
) => {
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

const changePassword: ServerActionType = async (
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
        userObj.salt &&
        userObj.password === hashPassword(oldPwd, userObj.salt)
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

const resetPasswordWithEmail: ServerActionType = async (email: string) => {
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

const resetPasswordWithResetCode: ServerActionType = async (
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

const changeProfile: ServerActionType = async (
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

export {
  loginByEmailPwd,
  refreshJwt,
  registerNotActivatedUserByEmailPwd,
  activateUserByActivationCode,
  changePassword,
  resetPasswordWithEmail,
  resetPasswordWithResetCode,
  changeProfile,
}
