import db from "@/l/dbconn"
import envVariables from "@/l/env"
import { slogger } from "@/l/utility"
import * as jwt from "jsonwebtoken"

export type LoginResult = {
  result: boolean
  reason?: string
  token?: string
  refreshToken?: string
}

async function loginByEmailPwd(
  email: string,
  password: string,
): Promise<LoginResult> {
  slogger.info("try logging in with: %s(%s)", email, password)
  const result = await db
    .selectFrom("user")
    .where("email", "=", email)
    .where("password", "=", password)
    .execute()

  if (result.length === 1) {
    const token = jwt.sign(
      {
        user: email,
        exp: Math.floor(Date.now() / 1000) + envVariables.JWT_EXPIRES_SECS,
      },
      envVariables.JWT_SECRET,
    )

    return { result: true, token, refreshToken: "" }
  }
  return { result: false, reason: "Username or password invalid." }
}

export default loginByEmailPwd
