import { Generated, Insertable, Selectable, Updateable } from "kysely"

export interface TodoTable {
  id: Generated<string>
  text: string
  finished: boolean
  priority: number
  created_at: Generated<Date>
  updated_at: Generated<Date>
}

export type Todo = Selectable<TodoTable>
export type NewTodo = Insertable<TodoTable>
export type UpdateTodo = Updateable<TodoTable>

export interface Database {
  todo: TodoTable
}
