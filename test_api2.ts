import { dbService } from './src/db/db_service.ts';
async function test() {
  await dbService.updateServerConfig('test_guild', 'test_owner', { logChannelId: 'test_log' });
  const config = await dbService.getConfig();
  console.log("Config from dbService:", JSON.stringify(config, null, 2));
  process.exit(0);
}
test();
