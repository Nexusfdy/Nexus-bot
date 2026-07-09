import { pgPool, dbType } from '../core.js';
import { Product, Order, CustomCommand, BotConfig, ModLog, BotStats } from '../../types.js';

export const getStats = async (): Promise<BotStats> => {
    if (pgPool) {
      try {
        const res = await pgPool.query("SELECT * FROM bot_stats WHERE id = 'core_stats' LIMIT 1");
        if (res.rows.length > 0) {
          const row = res.rows[0];
          return {
            totalRevenue: row.total_revenue,
            totalOrders: row.total_orders,
            totalProducts: row.total_products,
            activeServers: row.active_servers,
            commandsRun: row.commands_run,
            moderationActions: row.moderation_actions
          };
        }
      } catch (err) {
        console.error('Postgres error:', err); throw err;
      }
    }
    return readLocalFile().stats;
  };

export const updateStats = async (fields: Partial<BotStats>): Promise<void> => {
    if (pgPool) {
      try {
        // Construct dynamic update statements safely with parameterized values
        const keys = Object.keys(fields);
        if (keys.length > 0) {
          const assignments = keys.map((k, index) => {
            const dbCol = k.replace(/([A-Z])/g, '_$1').toLowerCase();
            return `${dbCol} = $${index + 1}`;
          }).join(', ');
          
          const values = keys.map(k => (fields as any)[k]);
          
          await pgPool.query(`UPDATE bot_stats SET ${assignments} WHERE id = 'core_stats'`, values);
          return;
        }
      } catch (err) {
        console.error('Postgres error:', err); throw err;
      }
    }
    const data = readLocalFile();
    data.stats = {
      ...data.stats,
      ...fields
    };
    writeLocalFile(data);
  };