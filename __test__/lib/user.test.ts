import {
  createUserByEmail,
  deleteUserById,
  findUserByEmail,
  findUserById,
  generateSalt,
  getUserObjectByEmail,
  hashPassword,
  verifyPassword,
} from "@/l/user"

jest.mock("uuid", () => ({ v4: () => "0a613541-ba97-47f5-84e3-fdc35a09717c" }))

describe("Password hash test", () => {
  it("password hash and verify", async () => {
    const password = "this is a password string"
    const salt = generateSalt()
    const hash = hashPassword(password, salt)
    expect(verifyPassword(password, salt, hash)).toBeTruthy()
    expect(verifyPassword("abcd", salt, hash)).toBeFalsy()
  })
})

describe("User creation and deletion", () => {
  const email = "test@example.com"
  const pwd = "temporary_password"

  it("User creation and deletion", async () => {
    const res = await createUserByEmail(email, pwd)
    expect(res).toBeTruthy()

    const user = await findUserByEmail(email)
    expect(user).toBeDefined()
    if (user) {
      expect(user.email).toEqual(email)
      const aUser = await findUserById(user.id)
      expect(aUser).toBeDefined()
      if (aUser) expect(aUser.id).toEqual(user.id)
      const deleteRes = await deleteUserById(user.id)
      expect(deleteRes).toBeTruthy()
      const findRes = await findUserByEmail(email)
      expect(findRes).toBeUndefined()
    }
  })

  it("User creation with password then delete", async () => {
    const res = await createUserByEmail(email, pwd)
    expect(res).toBeTruthy()
    const user = await getUserObjectByEmail(email)
    expect(user).toBeDefined()
    if (user) {
      const { password, salt } = user
      expect(password).toBeDefined()
      expect(salt).toBeDefined()
      if (password && salt) {
        const verifiedPwd1 = verifyPassword(pwd, salt, password)
        expect(verifiedPwd1).toBeTruthy()
        const verifiedPwd2 = verifyPassword("anotherpwd", salt, password)
        expect(verifiedPwd2).toBeFalsy()
      }

      const deleteRes = await deleteUserById(user.id)
      expect(deleteRes).toBeTruthy()
    }
  })
})
