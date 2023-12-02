import { Kysely, sql } from "kysely"

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createType("gendertype")
    .asEnum(["man", "woman", "nonbinary", "nottosay"])
    .execute()

  await db.schema
    .createTable("user")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn("email", "text", (col) => col.notNull().unique())
    .addColumn("emailActivated", "boolean")
    .addColumn("emailActivateCode", "text")
    .addColumn("emailActivateCodeExpiresAt", "timestamp")
    .addColumn("password", "text")
    .addColumn("passwordSalt", "text")
    .addColumn("passwordResetCode", "text")
    .addColumn("passwordResetCodeExpiresAt", "timestamp")
    .addColumn("firstName", "text")
    .addColumn("lastName", "text")
    .addColumn("nickname", "text")
    .addColumn("gender", sql`gendertype`)
    .addColumn("avatarUrl", "text")
    .addColumn("refreshToken", "text")
    .addColumn("refreshTokenExpiresAt", "timestamp")
    .addColumn("createdAt", "timestamp", (col) => col.defaultTo(sql`NOW()`))
    .addColumn("updatedAt", "timestamp", (col) => col.defaultTo(sql`NOW()`))
    .execute()

  await db.schema
    .createIndex("user_email_refreshtoken_index")
    .on("user")
    .column("email")
    .column("refreshToken")
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("todo").execute()
}
