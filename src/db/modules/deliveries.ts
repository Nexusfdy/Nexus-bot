import { pgPool, dbType } from '../core.js';
import { Product, Order, CustomCommand, BotConfig, ModLog, BotStats } from '../../types.js';

export const getPendingDeliveries = async (): Promise<{ transactionId: string; userId: string; productName: string; items: string[] }[]> => {
    if (pgPool) {
      try {
        const res = await pgPool.query("SELECT transaction_id, user_id, product_name, items FROM purchased_items WHERE delivery_status = 'PENDING_DELIVERY'");
        return res.rows.map(row => ({
          transactionId: row.transaction_id,
          userId: row.user_id,
          productName: row.product_name,
          items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items
        }));
      } catch (err) {
        console.error('Postgres error:', err); throw err;
        return [];
      }
    }
    return [];
  };