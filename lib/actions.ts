import {
  generateJwt,
  getUserObjectByEmail,
  updateRefreshToken,
  verifyPassword,
} from "@/l/user"
import { slogger } from "@/l/utility"

export type LoginResult = {
  result: boolean
  reason?: string
  token?: string
  refreshToken?: string
}

async function loginByEmailPwd(
  email: string,
  pwd: string,
): Promise<LoginResult> {
  slogger.info("try logging in with: %s", email)
  const user = await getUserObjectByEmail(email)

  if (user) {
    const { salt, password } = user

    if (password && salt && verifyPassword(pwd, salt, password)) {
      const token = generateJwt({ user: user.id })
      const refreshToken = await updateRefreshToken(user.id)
      if (refreshToken) return { result: true, token, refreshToken }
    }
  }

  return { result: false, reason: "Username or password invalid." }
}

export default loginByEmailPwd
