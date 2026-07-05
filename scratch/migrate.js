const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_0YzwTWhcgfy2@ep-polished-sea-ahzftuk2-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
});

async function run() {
  console.log("Running migration...");
  try {
    // 1. Add price column to oil_supplies
    await pool.query(`
      ALTER TABLE oil_supplies 
      ADD COLUMN IF NOT EXISTS price DOUBLE PRECISION NOT NULL DEFAULT 0;
    `);
    console.log("Migration completed successfully.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await pool.end();
  }
}

run();
