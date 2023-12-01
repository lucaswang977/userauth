import { DB } from "@/l/dbgen"
import envVariables from "@/l/env"
// import { slogger } from "@/l/utility"
import { Kysely, PostgresDialect } from "kysely"
import { Pool } from "pg"

const dialect = new PostgresDialect({
  pool: new Pool({
    connectionString: envVariables.DATABASE_URL,
    max: 10,
  }),
})

const db = new Kysely<DB>({
  dialect,
  // log(event) {
  //   if (event.level === "query") {
  //     slogger.info(event.query.sql)
  //     slogger.info(event.query.parameters)
  //   }
  // },
})

export default db
