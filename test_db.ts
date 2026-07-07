import { dbService } from './src/db/db_service.ts';
async function run() {
  const c = await dbService.getConfig();
  console.log('Guild ID:', c.guildId);
  process.exit(0);
}
run();
