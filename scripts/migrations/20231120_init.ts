import { Kysely, sql } from "kysely"

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("user")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn("email", "text", (col) => col.notNull().unique())
    .addColumn("password", "text")
    .addColumn("refresh_token", "text")
    .addColumn("refresh_token_expires_at", "timestamp")
    .addColumn("salt", "text")
    .addColumn("created_at", "timestamp", (col) => col.defaultTo(sql`NOW()`))
    .addColumn("updated_at", "timestamp", (col) => col.defaultTo(sql`NOW()`))
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("todo").execute()
}
