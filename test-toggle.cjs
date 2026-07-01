const { Pool } = require('pg');
require('dotenv').config();

async function test() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL || process.env.SQL_CONN_STRING });
  try {
    const r1 = await pool.query("SELECT anti_link, anti_spam FROM bot_config WHERE id = 'bot_settings'");
    console.log("Before:", r1.rows[0]);

    await pool.query(
      "UPDATE bot_config SET anti_link = $1, anti_spam = $2, warn_limit = $3, banned_words = $4 WHERE id = 'bot_settings'",
      [true, true, 3, ['badword1']]
    );

    const r2 = await pool.query("SELECT anti_link, anti_spam, banned_words FROM bot_config WHERE id = 'bot_settings'");
    console.log("After:", r2.rows[0]);
  } catch(e) {
    console.error("Error:", e);
  } finally {
    pool.end();
  }
}
test();
