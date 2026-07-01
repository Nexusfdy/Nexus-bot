import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const res = await pool.query("SELECT id, length(id) FROM products");
  console.log(res.rows);
  pool.end();
}
run().catch(console.error);
