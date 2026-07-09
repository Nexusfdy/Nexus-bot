import { pgPool, dbType } from '../core.js';
import { Product, Order, CustomCommand, BotConfig, ModLog, BotStats } from '../../types.js';

export const getTransactions = async (): Promise<any[]> => {
    if (pgPool) {
      try {
        const res = await pgPool.query('SELECT * FROM transactions ORDER BY timestamp DESC LIMIT 100');
        return res.rows.map(r => ({
          id: r.id,
          userId: r.user_id,
          username: r.username,
          amount: r.amount,
          type: r.type,
          description: r.description,
          timestamp: Number(r.timestamp)
        }));
      } catch (err) {
        console.error('Postgres error:', err); throw err;
      }
    }
    const data = readLocalFile();
    return (data.transactions || []).sort((a: any, b: any) => b.timestamp - a.timestamp);
  };

export const saveTransaction = async (tx: any): Promise<void> => {
    if (pgPool) {
      try {
        await pgPool.query(`
          INSERT INTO transactions (id, user_id, username, amount, type, description, timestamp)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO NOTHING
        `, [tx.id, tx.userId, tx.username, tx.amount, tx.type, tx.description, tx.timestamp]);
        return;
      } catch (err) {
        console.error('Postgres error:', err); throw err;
      }
    }
    const data = readLocalFile();
    if (!data.transactions) data.transactions = [];
    data.transactions.push(tx);
    writeLocalFile(data);
  };

export const markDeliverySuccess = async (transactionId: string): Promise<void> => {
    if (pgPool) {
      try {
        await pgPool.query("UPDATE purchased_items SET delivery_status = 'DELIVERED' WHERE transaction_id = $1", [transactionId]);
      } catch (err) {
        console.error('Postgres error:', err); throw err;
      }
    }
  };