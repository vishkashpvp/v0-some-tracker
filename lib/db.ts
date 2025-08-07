import { neon } from "@neondatabase/serverless"

// Ensure DATABASE_URL is set, otherwise throw an error early
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set.")
}

const sql = neon(process.env.DATABASE_URL)

export { sql }
