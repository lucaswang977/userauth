import { Kysely } from "kysely"

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("user")
    .addColumn("refresh_token", "text")
    .execute()
}

export async function down(_db: Kysely<any>): Promise<void> {
  // Nothing to drop
}
