import { pgPool, dbType } from '../core.js';
import { Product, Order, CustomCommand, BotConfig, ModLog, BotStats } from '../../types.js';

export const getUsers = async (): Promise<any[]> => {
    if (pgPool) {
      try {
        const res = await pgPool.query('SELECT * FROM users ORDER BY created_at DESC');
        return res.rows.map(row => ({
          discordId: row.discord_id,
          accountName: row.account_name,
          balance: row.balance,
          createdAt: Number(row.created_at),
          isUnlimited: row.is_unlimited,
          filePath: row.file_path
        }));
      } catch (err) {
        console.error('Postgres error:', err); throw err;
      }
    }
    const data = readLocalFile();
    return data.users || [];
  };

export const getUserByDiscordId = async (discordId: string): Promise<any | null> => {
    if (pgPool) {
      try {
        const res = await pgPool.query('SELECT * FROM users WHERE discord_id = $1', [discordId]);
        if (res.rows.length > 0) {
          return {
            discordId: res.rows[0].discord_id,
            accountName: res.rows[0].account_name,
            balance: res.rows[0].balance,
            createdAt: Number(res.rows[0].created_at)
          };
        }
        return null;
      } catch (err) {
        console.error('Postgres error:', err); throw err;
      }
    }
    const data = readLocalFile();
    return data.users?.find((u: any) => u.discordId === discordId) || null;
  };

export const registerUser = async (discordId: string, accountName: string): Promise<void> => {
    const createdAt = Date.now();
    if (pgPool) {
      try {
        await pgPool.query(`
          INSERT INTO users (discord_id, account_name, balance, created_at)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (discord_id) DO UPDATE SET account_name = EXCLUDED.account_name
        `, [discordId, accountName, 0, createdAt]);
        return;
      } catch (err) {
        console.error('Postgres error:', err); throw err;
        throw err;
      }
    }
    const data = readLocalFile();
    if (!data.users) data.users = [];
    const idx = data.users.findIndex((u: any) => u.discordId === discordId);
    if (idx >= 0) {
      data.users[idx].accountName = accountName;
    } else {
      data.users.push({ discordId, accountName, balance: 0, createdAt });
    }
    writeLocalFile(data);
  };

export const updateUserBalance = async (discordId: string, amount: number): Promise<void> => {
    if (pgPool) {
      try {
        await pgPool.query('UPDATE users SET balance = balance + $1 WHERE discord_id = $2', [amount, discordId]);
        return;
      } catch (err) {
        console.error('Postgres error:', err); throw err;
      }
    }
    const data = readLocalFile();
    if (!data.users) return;
    const user = data.users.find((u: any) => u.discordId === discordId);
    if (user) {
      user.balance += amount;
      writeLocalFile(data);
    }
  };