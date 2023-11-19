import { Kysely, sql } from "kysely"

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("todo")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn("text", "text")
    .addColumn("finished", "boolean")
    .addColumn("created_at", "timestamp", (col) => col.defaultTo(sql`NOW()`))
    .addColumn("updated_at", "timestamp", (col) => col.defaultTo(sql`NOW()`))
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("todo").execute()
}
