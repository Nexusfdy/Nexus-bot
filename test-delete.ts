import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const del = await pool.query("DELETE FROM products WHERE id = 'test'");
  console.log("Deleted count:", del.rowCount);
  pool.end();
}
run().catch(console.error);
