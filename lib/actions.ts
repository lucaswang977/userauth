import { JwtPayload, LoginResult } from "@/l/types"
import {
  generateJwt,
  generateRefreshToken,
  getUserObjectByEmail,
  updateRefreshToken,
  verifyPassword,
  verifyRefreshToken,
} from "@/l/user"

// TODO: Email registration with verification code

// TODO: Add fingerprint for refreshToken
async function loginByEmailPwd(
  email: string,
  pwd: string,
): Promise<LoginResult> {
  const user = await getUserObjectByEmail(email)

  if (user) {
    const { id, salt, password } = user

    if (password && salt && verifyPassword(pwd, salt, password)) {
      const token = generateJwt({ userId: user.id })
      const { refreshToken, expiresAt } = generateRefreshToken()

      const res = await updateRefreshToken(id, refreshToken, expiresAt)
      if (res) return { result: true, token, refreshToken }
    }
  }

  return { result: false, reason: "Username or password invalid." }
}

// TODO: Refresh JWT with refreshToken
async function refreshJwt(
  payload: JwtPayload,
  userId: string,
  refreshToken: string,
) {
  const result = await verifyRefreshToken(userId, refreshToken)
  if (result) {
    const res = generateRefreshToken()
    await updateRefreshToken(userId, res.refreshToken, res.expiresAt)
    const token = generateJwt(payload)

    return { token }
  }

  return undefined
}

export { loginByEmailPwd, refreshJwt }
