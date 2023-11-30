import { Kysely, sql } from "kysely"

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("user")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn("email", "text", (col) => col.notNull().unique())
    .addColumn("password", "text")
    .addColumn("refreshToken", "text")
    .addColumn("refreshTokenExpiresAt", "timestamp")
    .addColumn("salt", "text")
    .addColumn("emailActivated", "boolean")
    .addColumn("emailActivateCode", "text")
    .addColumn("emailActivateCodeExpiresAt", "timestamp")
    .addColumn("passwordResetCode", "text")
    .addColumn("passwordResetCodeExpiresAt", "timestamp")
    .addColumn("createdAt", "timestamp", (col) => col.defaultTo(sql`NOW()`))
    .addColumn("updatedAt", "timestamp", (col) => col.defaultTo(sql`NOW()`))
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("todo").execute()
}
