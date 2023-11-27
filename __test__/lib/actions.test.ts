import { loginByEmailPwd, refreshJwt } from "@/l/actions"
import { JwtPayload } from "@/l/types"
import { createUserByEmail, deleteUserById, findUserByEmail } from "@/l/user"
import { delay } from "@/l/utility"
import { jwtDecode } from "jwt-decode"

jest.mock("uuid", () => ({ v4: () => "0a613541-ba97-47f5-84e3-fdc35a09717c" }))

describe("User login action", () => {
  const email = "test@example.com"
  const pwd = "temporary_password"
  let userId: string | undefined

  beforeAll(async () => {
    const res = await createUserByEmail(email, pwd)
    expect(res).toBeTruthy()
    if (res) {
      const user = await findUserByEmail(email)
      expect(user).toBeDefined()
      if (user) userId = user.id
    }
  })

  afterAll(async () => {
    expect(userId).toBeDefined()
    if (userId) {
      const res = await deleteUserById(userId)
      expect(res).toBeTruthy()
    }
  })
  // FIX: Fix the testing logic after we added email activation process

  test("Test loginByEmailPwd()", async () => {
    const { result, token, refreshToken } = await loginByEmailPwd(email, pwd)
    expect(result).toBeTruthy()
    expect(token).toBeDefined()
    expect(refreshToken).toBeDefined()
    if (token) {
      const decoded = jwtDecode(token)
      if (decoded && decoded.exp)
        expect(decoded.exp * 1000).toBeGreaterThan(Date.now())
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
      const decoded = jwtDecode(token)
      const refreshRes = await refreshJwt(
        (decoded as JwtPayload).userId,
        refreshToken,
      )

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
