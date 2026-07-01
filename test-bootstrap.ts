import { bootstrapTables } from './src/db/db_service.ts';
async function run() {
  try {
    await bootstrapTables();
    console.log("Bootstrap success");
  } catch (err) {
    console.error("Bootstrap error:", err);
  }
}
run();
