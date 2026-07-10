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
    {
      name: "Add total_quantity to fuel_supplies",
      query: `ALTER TABLE fuel_supplies ADD COLUMN IF NOT EXISTS total_quantity DOUBLE PRECISION NOT NULL DEFAULT 0;`
    },
    {
      name: "Remove obsolete station_id/tank_id from fuel_supplies",
      query: `ALTER TABLE fuel_supplies DROP COLUMN IF EXISTS station_id, DROP COLUMN IF EXISTS tank_id;`
    },
    {
      name: "Create fuel_supply_distributions table if not exists",
      query: `
        CREATE TABLE IF NOT EXISTS fuel_supply_distributions (
          id SERIAL PRIMARY KEY,
          supply_id INTEGER NOT NULL REFERENCES fuel_supplies(id) ON DELETE CASCADE,
          station_id INTEGER NOT NULL REFERENCES stations(id),
          tank_id INTEGER NOT NULL REFERENCES tanks(id),
          quantity DOUBLE PRECISION NOT NULL,
          import_number INTEGER NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `
    },
    {
      name: "Add unit to oil_consumption_rates",
      query: `ALTER TABLE oil_consumption_rates ADD COLUMN IF NOT EXISTS unit TEXT NOT NULL DEFAULT 'عبوة';`
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
