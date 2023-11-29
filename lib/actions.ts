// https://hasura.io/blog/best-practices-of-using-jwt-with-graphql/

import "server-only"

import { JwtPayload, LoginResult } from "@/l/types"
import {
  createUserByEmail,
  decodeWithoutVerifyJwt,
  generateActivationCode,
  generateFingerprint,
  generateJwt,
  generateRefreshToken,
  getFingprintCookie,
  getUserObjectByEmail,
  removeUserActivationStatus,
  sendActivationCodeByMail,
  setFingerprintCookie,
  setUserActivationCode,
  updateRefreshToken,
  verifyFingerprint,
  verifyPassword,
  verifyRefreshToken,
} from "@/l/user"

async function registerNotActivatedUserByEmailPwd(email: string, pwd: string) {
  const user = await getUserObjectByEmail(email)
  if (user) {
    return { result: false, reason: "Email already registered." }
  }

  const createRes = await createUserByEmail(email, pwd)
  if (createRes) {
    const newUser = await getUserObjectByEmail(email)
    if (newUser) {
      const activationCode = generateActivationCode()
      const activateRes = await setUserActivationCode(
        newUser.id,
        activationCode,
      )
      if (activateRes) {
        const res = await sendActivationCodeByMail(email, activationCode)
        return { result: res }
      }
    }
  }

  return { result: false, reason: "User registration failed." }
}

async function activateUserByActivationCode(email: string, code: string) {
  const user = await getUserObjectByEmail(email)
  if (!user) {
    return { result: false, reason: "Email has not been registered yet." }
  }

  if (user.emailActivated) {
    return { result: false, reason: "Email has already been activated." }
  }

  if (user.emailActivateCode?.toLowerCase() === code.toLowerCase()) {
    const activateRes = await removeUserActivationStatus(user.id)
    if (activateRes) {
      return { result: true }
    }
  }

  return { result: false, reason: "Email activation failed." }
}

async function loginByEmailPwd(
  email: string,
  pwd: string,
): Promise<LoginResult> {
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

async function refreshJwt(
  refreshToken: string,
  token: string,
): Promise<LoginResult> {
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

export {
  loginByEmailPwd,
  refreshJwt,
  registerNotActivatedUserByEmailPwd,
  activateUserByActivationCode,
}
