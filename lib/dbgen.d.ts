import type { ColumnType } from "kysely"

export type Gendertype = "man" | "nonbinary" | "nottosay" | "woman"

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>

export type Timestamp = ColumnType<Date, Date | string, Date | string>

export interface User {
  avatarUrl: string | null
  createdAt: Generated<Timestamp | null>
  email: string
  emailActivateCode: string | null
  emailActivateCodeExpiresAt: Timestamp | null
  emailActivated: boolean | null
  firstName: string | null
  gender: Gendertype | null
  id: Generated<string>
  lastName: string | null
  nickname: string | null
  password: string | null
  passwordResetCode: string | null
  passwordResetCodeExpiresAt: Timestamp | null
  passwordSalt: string | null
  refreshToken: string | null
  refreshTokenExpiresAt: Timestamp | null
  updatedAt: Generated<Timestamp | null>
}

export interface DB {
  user: User
}
