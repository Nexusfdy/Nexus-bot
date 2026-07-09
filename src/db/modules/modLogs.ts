import { pgPool, dbType } from '../core.js';
import { Product, Order, CustomCommand, BotConfig, ModLog, BotStats } from '../../types.js';

export const getModLogs = async (): Promise<ModLog[]> => {
    if (pgPool) {
      try {
        const res = await pgPool.query('SELECT * FROM mod_logs ORDER BY timestamp DESC');
        return res.rows.map(row => ({
          id: row.id,
          userId: row.user_id,
          username: row.username,
          action: row.action as any,
          reason: row.reason,
          timestamp: Number(row.timestamp)
        }));
      } catch (err) {
        console.error('Postgres error:', err); throw err;
      }
    }
    return readLocalFile().modLogs;
  };

export const saveModLog = async (log: ModLog): Promise<void> => {
    if (pgPool) {
      try {
        await pgPool.query({
          text: `INSERT INTO mod_logs (id, user_id, username, action, reason, timestamp)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
          values: [log.id, log.userId, log.username, log.action, log.reason, log.timestamp]
        });
        return;
      } catch (err) {
        console.error('Postgres error:', err); throw err;
      }
    }
    const data = readLocalFile();
    data.modLogs.unshift(log);
    writeLocalFile(data);
  };

export const clearModLogs = async (): Promise<void> => {
    if (pgPool) {
      try {
        await pgPool.query('DELETE FROM mod_logs');
        return;
      } catch (err) {
        console.error('Postgres error:', err); throw err;
      }
    }
    const data = readLocalFile();
    data.modLogs = [];
    writeLocalFile(data);
  };