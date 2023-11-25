import { Generated, Insertable, Selectable, Updateable } from "kysely"

export interface UserTable {
  id: Generated<string>
  email: string
  password?: string
  salt?: string
  first_name?: string
  last_name?: string
  refresh_token?: string
  refresh_token_expires_at?: Date
  created_at?: Generated<Date>
  updated_at?: Generated<Date>
}

export type User = Selectable<UserTable>
export type NewUser = Insertable<UserTable>
export type UpdateUser = Updateable<UserTable>

export interface Database {
  user: UserTable
}
