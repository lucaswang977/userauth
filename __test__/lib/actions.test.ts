import {
  activateUserByActivationCode,
  changePassword,
  changeProfile,
  loginByEmailPwd,
  refreshJwt,
  registerNotActivatedUserByEmailPwd,
  resetPasswordWithEmail,
  resetPasswordWithResetCode,
} from "@/l/actions"
import db from "@/l/dbconn"
import { Gendertype } from "@/l/dbgen"
import { JwtPayload } from "@/l/types"
import {
  deleteUserByEmail,
  getUserObjectByEmail,
  verifyPassword,
} from "@/l/user"
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
let passwordResetCode: string | undefined

jest.mock("nodemailer", () => {
  const originalModule = jest.requireActual("nodemailer")

  return {
    ...originalModule,
    createTransport: () => ({
      sendMail: (obj: { to: string; text: string }) => {
        // TODO: Match pattern should be more flexible
        const matchActivationCode = obj.text.match(
          /(?:This is your one time activation code: )(\w+)/,
        )
        activationCode = matchActivationCode
          ? matchActivationCode[1]
          : undefined

        const matchPasswordResetCode = obj.text.match(
          /(?:You can click here to reset your password: )https:\/\/(\w+)/,
        )

        passwordResetCode = matchPasswordResetCode
          ? matchPasswordResetCode[1]
          : undefined
        return { accepted: [obj.to] }
      },
    }),
  }
})

const email = "test@example.com"
const pwd = "temporary_password"
const newPwd = "new_password"
let currentToken: string | undefined

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
      currentToken = token

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

        currentToken = refreshRes.token
      }
    }
  })
})

describe("User change password action", () => {
  test("Test changePassword()", async () => {
    expect(currentToken).toBeDefined()
    if (currentToken) {
      const updateRes = await changePassword(currentToken, pwd, newPwd)
      expect(updateRes.result).toBeTruthy()

      const updateAgainRes = await changePassword(currentToken, pwd, newPwd)
      expect(updateAgainRes.result).toBeFalsy()
    }
  })

  test("Test resetPassword()", async () => {
    const resetRes = await resetPasswordWithEmail(email)
    expect(resetRes.result).toBeTruthy()

    expect(passwordResetCode).toBeTruthy()

    if (passwordResetCode) {
      const updateRes = await resetPasswordWithResetCode(
        email,
        passwordResetCode,
        pwd,
      )
      expect(updateRes.result).toBeTruthy()

      const user = await getUserObjectByEmail(email)
      expect(user).toBeDefined()
      if (user && user.salt && user.password) {
        const verifyRes = verifyPassword(pwd, user.salt, user.password)
        expect(verifyRes).toBeTruthy()
      }
    }
  })
})

describe("User change profile action", () => {
  test("Test changeProfile()", async () => {
    expect(currentToken).toBeDefined()
    const nickname = "Billy Jean"
    const gender: Gendertype = "man"

    if (currentToken) {
      const oldUser = await getUserObjectByEmail(email)
      expect(oldUser).toBeDefined()

      const updateRes = await changeProfile(currentToken, {
        nickname,
        gender,
      })
      expect(updateRes.result).toBeTruthy()

      const user = await getUserObjectByEmail(email)
      expect(user).toBeDefined()
      expect(user?.nickname).toEqual(nickname)
      expect(user?.gender).toEqual(gender)
      if (user && oldUser && user.updatedAt && oldUser.updatedAt)
        expect(
          user.updatedAt.getTime() > oldUser.updatedAt.getTime(),
        ).toBeTruthy()
    }
  })
})
