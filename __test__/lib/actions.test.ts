import {
  activateUserByActivationCode,
  loginByEmailPwd,
  refreshJwt,
  registerNotActivatedUserByEmailPwd,
} from "@/l/actions"
import db from "@/l/dbconn"
import { JwtPayload } from "@/l/types"
import { deleteUserByEmail } from "@/l/user"
import { delay } from "@/l/utility"
import * as Jwt from "jsonwebtoken"

jest.mock("uuid", () => ({ v4: () => "0a613541-ba97-47f5-84e3-fdc35a09717c" }))

// Mock cookies setting and getting for passing the fingerprint testing
let fingerprint: string
jest.mock("next/headers", () => {
  const originalModule = jest.requireActual("next/headers")
  return {
    ...originalModule,
    cookies: () => ({
      set: (obj: { name: string; value: string }) => {
        fingerprint = obj.value
      },
      get: () => ({ value: fingerprint }),
    }),
  }
})

const email = "test@example.com"
const pwd = "temporary_password"

beforeAll(async () => {
  await deleteUserByEmail(email)
})

afterAll(async () => {
  await deleteUserByEmail(email)
  await db.destroy()
})

describe("User login action", () => {
  let userId: string | undefined

  test("Test register() and activate()", async () => {
    const registerRes = await registerNotActivatedUserByEmailPwd(email, pwd)
    expect(registerRes.result).toBeTruthy()

    // TODO: Depending on activationCode included in response
    const code = registerRes.activationCode
    expect(code).toBeDefined()
    if (code) {
      const activateRes = await activateUserByActivationCode(email, code)
      expect(activateRes.result).toBeTruthy()
    }
  })

  test("Test loginByEmailPwd()", async () => {
    const { result, token, refreshToken } = await loginByEmailPwd(email, pwd)
    expect(result).toBeTruthy()
    expect(token).toBeDefined()
    expect(refreshToken).toBeDefined()
    if (token) {
      const decoded = Jwt.decode(token) as Jwt.JwtPayload
      if (decoded) {
        if (decoded.exp) expect(decoded.exp * 1000).toBeGreaterThan(Date.now())
        userId = (decoded as JwtPayload).userId
        expect(userId).toBeDefined()
      }
    }
    const failedRes = await loginByEmailPwd(email, "wrongpwd")
    expect(failedRes.result).toBeFalsy()
  })

  test("Test refreshJwt()", async () => {
    const { result, token, refreshToken, refreshExpires } =
      await loginByEmailPwd(email, pwd)
    expect(result).toBeTruthy()
    expect(token).toBeDefined()
    expect(refreshToken).toBeDefined()
    expect(refreshExpires?.getTime()).toBeGreaterThan(0)

    await delay(500)
    if (token && refreshToken) {
      const refreshRes = await refreshJwt(refreshToken, token)

      expect(refreshRes.result).toBeTruthy()
      expect(refreshRes.token).toBeDefined()
      expect(refreshRes.refreshToken).toBeDefined()
      if (refreshExpires && refreshRes.refreshExpires) {
        expect(
          refreshRes.refreshExpires.getTime() - refreshExpires.getTime(),
        ).toBeGreaterThan(500)
      }
    }
  })
})
