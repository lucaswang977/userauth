import {
  createUserByEmail,
  deleteUserById,
  findUserByEmail,
  generateSalt,
  hashPassword,
  verifyPassword,
} from "@/l/user"

jest.mock("uuid", () => ({ v4: () => "0a613541-ba97-47f5-84e3-fdc35a09717c" }))

describe("Password hash test", () => {
  it("password hash and verify", async () => {
    const password = "this is a password string"
    const salt = generateSalt()
    const hash = hashPassword(password, salt)
    console.log(salt, hash)
    expect(verifyPassword(hash, password, salt)).toBeTruthy()
    expect(verifyPassword(hash, "abcd", salt)).toBeFalsy()
  })
})

describe("User creation and deletion", () => {
  const email = "test@example.com"

  it("User creation and deletion", async () => {
    const res = await createUserByEmail(email, "password")
    expect(res).toBeDefined()

    if (res) {
      expect(res.id).toBeDefined()
      const user = await findUserByEmail(email)
      expect(user).toBeDefined()
      if (user) {
        expect(user.id).toBe(res.id)
        const deleteRes = await deleteUserById(res.id)
        expect(deleteRes).toBeTruthy()
        const findRes = await findUserByEmail(email)
        expect(findRes).toBeUndefined()
      }
    }
  })
})
