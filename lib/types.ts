import { Generated, Insertable, Selectable, Updateable } from "kysely"

export interface UserTable {
  id: Generated<string>
  email: string
  password?: string
  salt?: string
  firstName?: string
  lastName?: string
  refreshToken?: string
  refreshTokenExpiresAt?: Date
  emailActivated?: boolean
  emailActivateCode?: string
  emailActivateCodeExpiresAt?: Date
  passwordResetCode?: string
  passwordResetCodeExpiresAt?: Date
  createdAt?: Generated<Date>
  updatedAt?: Generated<Date>
}

export type User = Selectable<UserTable>
export type NewUser = Insertable<UserTable>
export type UpdateUser = Updateable<UserTable>

export interface Database {
  user: UserTable
}

export type ActionResult =
  | {
      result: true
      reason?: string
    }
  | {
      result: false
      reason: string
    }

export type LoginResult = ActionResult & {
  token?: string
  refreshToken?: string
  refreshExpires?: Date
}

export type JwtPayload = {
  userId: string
  hashedFingerprint: string
}
