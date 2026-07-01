import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const p = await pool.query(`SELECT * FROM products`);
  console.log("Products:", p.rows);
  pool.end();
}
run().catch(console.error);
