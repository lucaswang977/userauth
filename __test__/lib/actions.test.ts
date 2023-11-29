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

let activationCode: string | undefined
jest.mock("nodemailer", () => {
  const originalModule = jest.requireActual("nodemailer")

  return {
    ...originalModule,
    createTransport: () => ({
      sendMail: (obj: { to: string; text: string }) => {
        const match = obj.text.match(
          /(?:This is your one time activation code: )(\w+)/,
        )
        activationCode = match ? match[1] : undefined
        return { accepted: [obj.to] }
      },
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

describe("User register and activate action", () => {
  test("Test register() and activate()", async () => {
    const registerRes = await registerNotActivatedUserByEmailPwd(email, pwd)
    expect(registerRes.result).toBeTruthy()

    expect(activationCode).toBeDefined()
    if (activationCode) {
      const activateRes = await activateUserByActivationCode(
        email,
        activationCode,
      )
      expect(activateRes.result).toBeTruthy()
    }
  })
})

describe("User login action", () => {
  test("Test loginByEmailPwd()", async () => {
    const { result, token, refreshToken } = await loginByEmailPwd(email, pwd)
    expect(result).toBeTruthy()
    expect(token).toBeDefined()
    expect(refreshToken).toBeDefined()
    if (token) {
      const decoded = Jwt.decode(token) as Jwt.JwtPayload
      if (decoded) {
        if (decoded.exp) expect(decoded.exp * 1000).toBeGreaterThan(Date.now())
        const { userId } = decoded as JwtPayload
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
