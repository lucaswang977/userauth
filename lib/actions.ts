import envVariables from "@/l/env"
import { slogger } from "@/l/utility"
import * as jwt from "jsonwebtoken"

async function login(
  email: string,
  password: string,
): Promise<[boolean, string]> {
  slogger.info("try logging in with: %s(%s)", email, password)
  if (email === "test@gmail.com" && password === "abcdabcd") {
    const token = jwt.sign(
      { data: email, exp: Math.floor(Date.now() / 1000) + 5 * 60 },
      envVariables.JWT_SECRET,
    )

    return [true, token]
  }
  return [false, "Username or password invalid."]
}

export default login
