import "server-only"

import { LoginResult } from "@/l/types"
import {
  createUserByEmail,
  generateActivationCode,
  generateJwt,
  generateRefreshToken,
  getUserObjectByEmail,
  removeUserActivationStatus,
  setUserActivationCode,
  updateRefreshToken,
  verifyPassword,
  verifyRefreshToken,
} from "@/l/user"

async function registerByEmailPwd(email: string, pwd: string) {
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
        // TODO: Send the activation email, remove the activationCode here
        return { result: true, activationCode }
      }
    }
  }

  return { result: false, reason: "User registration failed." }
}

async function activateEmailByCode(email: string, code: string) {
  const user = await getUserObjectByEmail(email)
  if (!user) {
    return { result: false, reason: "Email has not been registered yet." }
  }

  if (user.emailActivated) {
    return { result: false, reason: "Email has already been activated." }
  }

  if (user.emailActivateCode === code) {
    const activateRes = await removeUserActivationStatus(user.id)
    if (activateRes) {
      return { result: true }
    }
  }

  return { result: false, reason: "Email activation failed." }
}

// TODO: Add fingerprint for refreshToken
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
      const token = generateJwt({ userId: user.id })
      const { refreshToken, expiresAt } = generateRefreshToken()

      const res = await updateRefreshToken(id, refreshToken, expiresAt)
      if (res)
        return { result: true, token, refreshToken, refreshExpires: expiresAt }
    }
  }

  return { result: false, reason: "Username or password invalid." }
}

async function refreshJwt(
  userId: string,
  refreshToken: string,
): Promise<LoginResult> {
  const result = await verifyRefreshToken(userId, refreshToken)
  if (result) {
    const res = generateRefreshToken()
    await updateRefreshToken(userId, res.refreshToken, res.expiresAt)
    const token = generateJwt({ userId })

    return {
      result: true,
      token,
      refreshToken: res.refreshToken,
      refreshExpires: res.expiresAt,
    }
  }

  return { result: false, reason: "Refresh token verification failed." }
}

export { loginByEmailPwd, refreshJwt, registerByEmailPwd, activateEmailByCode }
