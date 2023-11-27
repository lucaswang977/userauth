import envVariables from "@/l/env"
import { Database } from "@/l/types"
// import { slogger } from "@/l/utility"
import { Kysely, PostgresDialect } from "kysely"
import { Pool } from "pg"

const dialect = new PostgresDialect({
  pool: new Pool({
    database: envVariables.PG_DB,
    host: envVariables.PG_HOST,
    user: envVariables.PG_USER,
    port: envVariables.PG_PORT,
    password: envVariables.PG_PASSWORD,
    max: 10,
  }),
})

const db = new Kysely<Database>({
  dialect,
  // log(event) {
  //   if (event.level === "query") {
  //     slogger.info(event.query.sql)
  //     slogger.info(event.query.parameters)
  //   }
  // },
})

export default db
