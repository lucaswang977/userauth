import type { Gendertype, User } from "@/l/dbgen"
import { Insertable, Selectable, Updateable } from "kysely"

export type UserType = Selectable<User>
export type InsertUserType = Insertable<User>
export type UpdateUserType = Updateable<User>

export type ServerActionType<T> = (...args: any[]) => Promise<T>

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

export type UserProfileType = {
  firstName?: string
  lastName?: string
  nickname?: string
  gender?: Gendertype
  avatarUrl?: string
}

export type UserExternalType = UserProfileType & {
  id: string
  email: string
}
