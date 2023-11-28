import db from "@/l/dbconn"
import { JwtPayload, User } from "@/l/types"
import {
  createUserByEmail,
  deleteUserById,
  findUserByEmail,
  findUserById,
  generateJwt,
  generateRefreshToken,
  generateSalt,
  getUserObjectByEmail,
  getUserObjectById,
  hashPassword,
  updateRefreshToken,
  verifyAndDecodeJwt,
  verifyPassword,
  verifyRefreshToken,
} from "@/l/user"
import { delay } from "@/l/utility"

jest.mock("uuid", () => ({ v4: () => "0a613541-ba97-47f5-84e3-fdc35a09717c" }))

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
  const payload: JwtPayload = {
    userId: "abcd",
  }

  test("Test generateJwt() and verifyAndDecodeJwt() and JWT expiration", async () => {
    const jwt = generateJwt(payload)
    const decoded = verifyAndDecodeJwt(jwt) as JwtPayload
    expect(decoded.userId).toEqual(payload.userId)

    const expiresJwt = generateJwt(payload, 1)
    await delay(1100)
    const decodedExpiresJwt = verifyAndDecodeJwt(expiresJwt) as JwtPayload
    expect(decodedExpiresJwt).toBeUndefined()
  })
})

describe("Create user, find user, then delete", () => {
  const email = "test@example.com"
  const pwd = "temporary_password"
  let user: User | undefined

  beforeAll(async () => {
    const res = await createUserByEmail(email, pwd)
    expect(res).toBeTruthy()
    user = await getUserObjectByEmail(email)
    expect(user).toBeDefined()
  })

  afterAll(async () => {
    expect(user).toBeDefined()
    if (user) {
      const deleteRes = await deleteUserById(user.id)
      expect(deleteRes).toBeTruthy()
      const findRes = await findUserByEmail(email)
      expect(findRes).toBeUndefined()
    }
  })

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

      const { password, salt } = user
      expect(password).toBeDefined()
      expect(salt).toBeDefined()
      if (password && salt) {
        const verifiedPwd1 = verifyPassword(pwd, salt, password)
        expect(verifiedPwd1).toBeTruthy()
        const verifiedPwd2 = verifyPassword("anotherpwd", salt, password)
        expect(verifiedPwd2).toBeFalsy()
      }
    }
  })
})

describe("Generate refreshToken then update", () => {
  const email = "test@example.com"
  const pwd = "temporary_password"
  let user: User | undefined

  beforeAll(async () => {
    const res = await createUserByEmail(email, pwd)
    expect(res).toBeTruthy()
    user = await getUserObjectByEmail(email)
    expect(user).toBeDefined()
  })

  afterAll(async () => {
    expect(user).toBeDefined()
    if (user) {
      const deleteRes = await deleteUserById(user.id)
      expect(deleteRes).toBeTruthy()
    }
  })

  test("Test generateRefreshToken() and updateRefreshToken()", async () => {
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
    user = await getUserObjectByEmail(email)
    expect(user).toBeDefined()
    if (user) {
      expect(user.refreshToken).toBeDefined()
      if (user.refreshToken) {
        const verifyRes = await verifyRefreshToken(user.id, user.refreshToken)
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
})

afterAll(async () => {
  await db.destroy()
})
