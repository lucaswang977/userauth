import { loginByEmailPwd } from "@/l/actions"
import { createUserByEmail, deleteUserById, findUserByEmail } from "@/l/user"

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

  it("Test logging in", async () => {
    const res = await loginByEmailPwd(email, pwd)
    expect(res.result).toBeTruthy()
    expect(res.token).toBeDefined()
    expect(res.refreshToken).toBeDefined()

    const failedRes = await loginByEmailPwd(email, "wrongpwd")
    expect(failedRes.result).toBeFalsy()
  })
})
