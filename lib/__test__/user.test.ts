import db from "@/l/dbconn"
import { JwtPayload, UserType } from "@/l/types"
import {
  clearPasswordResetCode,
  createUserByEmail,
  decodeAndVerifyJwt,
  deleteUserByEmail,
  findUserById,
  generateFingerprint,
  generateJwt,
  generatePasswordResetCode,
  generateRefreshToken,
  generateSalt,
  getUserObjectByEmail,
  getUserObjectById,
  hashPassword,
  updatePassword,
  updatePasswordResetCode,
  updateRefreshToken,
  verifyFingerprint,
  verifyPassword,
  verifyPasswordResetCode,
  verifyRefreshToken,
} from "@/l/user"
import { delay } from "@/l/utility"

jest.mock("uuid", () => ({ v4: () => "0a613541-ba97-47f5-84e3-fdc35a09717c" }))

const email = "test@example.com"
const pwd = "temporary_password"
let user: UserType | undefined

beforeAll(async () => {
  await deleteUserByEmail(email)
})

beforeEach(async () => {
  const res = await createUserByEmail(email, pwd)
  expect(res).toBeTruthy()
  user = await getUserObjectByEmail(email)
  expect(user).toBeDefined()
})

afterEach(async () => {
  await deleteUserByEmail(email)
})

afterAll(async () => {
  await db.destroy()
})

describe("Password hashing", () => {
  test("Test generateSalt() and hashPassword()", async () => {
    const password = "this is a password string"
    const salt = generateSalt()
    const hash = hashPassword(password, salt)
    expect(verifyPassword(password, salt, hash)).toBeTruthy()
    expect(verifyPassword("abcd", salt, hash)).toBeFalsy()
  })
})

describe("Jwt verification & refresh", () => {
  const { fingerprint, hashedFingerprint } = generateFingerprint()
  const payload: JwtPayload = {
    userId: "abcd",
    hashedFingerprint,
  }

  test("Test generateJwt() and verifyAndDecodeJwt() and JWT expiration", async () => {
    const jwt = generateJwt(payload)
    const decoded = decodeAndVerifyJwt(jwt) as JwtPayload
    expect(decoded.userId).toEqual(payload.userId)

    const expiresJwt = generateJwt(payload, 1)
    await delay(1100)
    const decodedExpiresJwt = decodeAndVerifyJwt(expiresJwt) as JwtPayload
    expect(decodedExpiresJwt).toBeUndefined()
  })

  test("Test verifyFingerprint()", () => {
    expect(verifyFingerprint(fingerprint, hashedFingerprint)).toBeTruthy()
  })
})

describe("Create user, find user, then delete", () => {
  test("Test findUserByEmail() / findUserById()", async () => {
    expect(user).toBeDefined()
    if (user) {
      expect(user.email).toEqual(email)
      const aUser = await findUserById(user.id)
      expect(aUser).toBeDefined()
      if (aUser) expect(aUser.id).toEqual(user.id)
    }
  })

  test("Test getUserObjectByEmail() / getUserObjectById() and verifyPassword()", async () => {
    expect(user).toBeDefined()
    if (user) {
      const aUser = await getUserObjectById(user.id)
      expect(aUser).toBeDefined()
      expect(aUser).toEqual(user)

      const { password, passwordSalt } = user
      expect(password).toBeDefined()
      expect(passwordSalt).toBeDefined()
      if (password && passwordSalt) {
        const verifiedPwd1 = verifyPassword(pwd, passwordSalt, password)
        expect(verifiedPwd1).toBeTruthy()
        const verifiedPwd2 = verifyPassword(
          "anotherpwd",
          passwordSalt,
          password,
        )
        expect(verifiedPwd2).toBeFalsy()
      }
    }
  })
})

describe("Generate refreshToken then update", () => {
  test("Test generateRefreshToken() and updateRefreshToken()", async () => {
    expect(user).toBeDefined()
    if (user) {
      const { refreshToken, expiresAt } = generateRefreshToken()
      // mocked uuid
      expect(refreshToken).toEqual("0a613541-ba97-47f5-84e3-fdc35a09717c")
      const diff = expiresAt.getTime() - Date.now()
      expect(diff).toBeGreaterThan(0)

      const updateRes = await updateRefreshToken(
        user.id,
        refreshToken,
        expiresAt,
      )
      expect(updateRes).toBeTruthy()
    }
  })

  test("Test verifyRefreshToken() with expiration", async () => {
    expect(user).toBeDefined()
    if (user) {
      expect(user.refreshToken).toBeDefined()
      if (user.refreshToken) {
        const verifyRes = await verifyRefreshToken(user.refreshToken, user.id)
        expect(verifyRes).toBeTruthy()

        const updateRes = await updateRefreshToken(
          user.id,
          user.refreshToken,
          new Date(Date.now()),
        )

        expect(updateRes).toBeTruthy()

        const verifyAgainRes = await verifyRefreshToken(
          user.id,
          user.refreshToken,
        )
        expect(verifyAgainRes).toBeFalsy()
      }
    }
  })

  test("Test updatePassword()", async () => {
    expect(user).toBeDefined()
    const newPwdStr = "new_password"
    if (user) {
      const oldHashedPwd = user.password
      expect(oldHashedPwd).toBeDefined()
      const oldSalt = user.passwordSalt
      expect(oldSalt).toBeDefined()

      const updateRes = await updatePassword(user.id, newPwdStr)
      expect(updateRes).toBeTruthy()

      const newUser = await getUserObjectById(user.id)
      expect(newUser).toBeDefined()
      if (newUser) {
        const newHashedPwd = newUser.password
        expect(newHashedPwd).toBeDefined()
        expect(oldHashedPwd !== newHashedPwd).toBeTruthy()
        const newSalt = newUser.passwordSalt
        expect(newSalt).toBeDefined()
        expect(oldSalt !== newSalt).toBeTruthy()
        if (newHashedPwd && newSalt) {
          const verifyRes = verifyPassword(newPwdStr, newSalt, newHashedPwd)
          expect(verifyRes).toBeTruthy()
        }
      }
    }
  })

  test("Test resetPassword()", async () => {
    const resetCode = generatePasswordResetCode()
    expect(resetCode.length > 64)

    expect(user).toBeDefined()
    if (user) {
      const updateRes = await updatePasswordResetCode(user.id, resetCode)
      expect(updateRes).toBeTruthy()

      const verifyRes = await verifyPasswordResetCode(user.id, resetCode)
      expect(verifyRes).toBeTruthy()

      const clearRes = await clearPasswordResetCode(user.id)
      expect(clearRes).toBeTruthy()
    }
  })
})
