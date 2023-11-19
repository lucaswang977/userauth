import { Kysely } from "kysely"

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("todo")
    .alterColumn("priority", (bld) => bld.setDefault(0))
    .execute()
}

/* eslint @typescript-eslint/no-unused-vars:off */
export async function down(_db: Kysely<any>): Promise<void> {
  // nothing to drop
}
