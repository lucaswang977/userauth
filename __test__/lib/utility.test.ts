import { generateSalt, hashPassword, verifyPassword } from "@/l/utility"

describe("Password hash test", () => {
  it("password hash and verify", async () => {
    const password = "this is a password string"
    const salt = generateSalt()
    const hash = hashPassword(password, salt)
    expect(verifyPassword(hash, password, salt))
  })
})
