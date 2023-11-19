import { Kysely } from "kysely"

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("todo")
    .alterColumn("created_at", (bld) => bld.setDataType("timestamptz"))
    .alterColumn("updated_at", (bld) => bld.setDataType("timestamptz"))
    .execute()
}

/* eslint @typescript-eslint/no-unused-vars:off */
export async function down(_db: Kysely<any>): Promise<void> {
  // nothing to drop
}
