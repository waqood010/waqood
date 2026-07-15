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
      name: "Add startup_balance to tanks",
      query: `ALTER TABLE tanks ADD COLUMN IF NOT EXISTS startup_balance DOUBLE PRECISION NOT NULL DEFAULT 0;`
    },
    {
      name: "Initialize startup_balance from existing current_balance",
      query: `UPDATE tanks SET startup_balance = current_balance WHERE startup_balance = 0;`
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
    {
      name: "Add aggregate_unit to oils",
      query: `ALTER TABLE oils ADD COLUMN IF NOT EXISTS aggregate_unit TEXT;`
    },
    {
      name: "Add aggregate_unit_quantity to oils",
      query: `ALTER TABLE oils ADD COLUMN IF NOT EXISTS aggregate_unit_quantity DOUBLE PRECISION NOT NULL DEFAULT 0;`
    },
    {
      name: "Add unit_price to oils",
      query: `ALTER TABLE oils ADD COLUMN IF NOT EXISTS unit_price DOUBLE PRECISION NOT NULL DEFAULT 0;`
    },
    {
      name: "Add contract_number to oil_supplies",
      query: `ALTER TABLE oil_supplies ADD COLUMN IF NOT EXISTS contract_number TEXT;`
    },
    {
      name: "Create oil_sample_analyses table",
      query: `
        CREATE TABLE IF NOT EXISTS oil_sample_analyses (
          id SERIAL PRIMARY KEY,
          oil_id INTEGER NOT NULL REFERENCES oils(id),
          analysis_number TEXT NOT NULL,
          analysis_date TIMESTAMP NOT NULL DEFAULT NOW(),
          result_date TIMESTAMP,
          status TEXT NOT NULL DEFAULT 'review',
          cost DOUBLE PRECISION NOT NULL DEFAULT 0,
          notes TEXT,
          "userId" TEXT NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `
    },
    {
      name: "Create tasks table",
      query: `
        CREATE TABLE IF NOT EXISTS tasks (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          due_date TIMESTAMP NOT NULL,
          repeat_frequency TEXT NOT NULL DEFAULT 'once',
          reminder_offset_days INTEGER NOT NULL DEFAULT 1,
          reminder_interval_hours INTEGER NOT NULL DEFAULT 24,
          next_reminder_at TIMESTAMP NOT NULL DEFAULT NOW(),
          status TEXT NOT NULL DEFAULT 'pending',
          is_read BOOLEAN NOT NULL DEFAULT FALSE,
          "userId" TEXT NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `
    },
    {
      name: "Add related_task_id to alerts",
      query: `ALTER TABLE alerts ADD COLUMN IF NOT EXISTS related_task_id INTEGER;`
    },
    {
      name: "Add next_refill_date to oil_consumption_rates",
      query: `ALTER TABLE oil_consumption_rates ADD COLUMN IF NOT EXISTS next_refill_date TIMESTAMP;`
    },
    {
      name: "Add status to oil_transactions",
      query: `ALTER TABLE oil_transactions ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved';`
    },
    {
      name: "Add rejection_reason to oil_transactions",
      query: `ALTER TABLE oil_transactions ADD COLUMN IF NOT EXISTS rejection_reason TEXT;`
    },
    {
      name: "Add rejected_by to oil_transactions",
      query: `ALTER TABLE oil_transactions ADD COLUMN IF NOT EXISTS rejected_by TEXT;`
    },
    {
      name: "Add rejected_at to oil_transactions",
      query: `ALTER TABLE oil_transactions ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP;`
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
