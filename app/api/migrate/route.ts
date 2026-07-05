import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

export async function GET() {
  const results: string[] = []
  const errors: string[] = []

  const migrations = [
    {
      name: "Add price to oil_supplies",
      query: `ALTER TABLE oil_supplies ADD COLUMN IF NOT EXISTS price DOUBLE PRECISION NOT NULL DEFAULT 0;`
    },
    {
      name: "Make userId nullable in oil_supplies",
      query: `ALTER TABLE oil_supplies ALTER COLUMN "userId" DROP NOT NULL;`
    },
    {
      name: "Create audit_log table if not exists",
      query: `
        CREATE TABLE IF NOT EXISTS audit_log (
          id SERIAL PRIMARY KEY,
          "userId" TEXT,
          user_name TEXT,
          action TEXT NOT NULL,
          table_name TEXT,
          record_id TEXT,
          before_data JSONB,
          after_data JSONB,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `
    },
  ]

  for (const migration of migrations) {
    try {
      await db.execute(sql.raw(migration.query))
      results.push(`✓ ${migration.name}`)
    } catch (err: any) {
      errors.push(`✗ ${migration.name}: ${err.message}`)
    }
  }

  return NextResponse.json({
    success: errors.length === 0,
    results,
    errors
  })
}
