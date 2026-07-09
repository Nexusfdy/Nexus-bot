import { pgPool, dbType } from '../core.js';
import { Product, Order, CustomCommand, BotConfig, ModLog, BotStats } from '../../types.js';

export const getAdminAuth = async (): Promise<{ password_hash?: string, reset_token?: string, reset_token_expiry?: number } | null> => {
    if (pgPool) {
      try {
        const res = await pgPool.query("SELECT * FROM admin_auth WHERE id = 'admin_auth' LIMIT 1");
        if (res.rows.length > 0) {
          const r = res.rows[0];
          return {
            password_hash: r.password_hash || undefined,
            reset_token: r.reset_token || undefined,
            reset_token_expiry: r.reset_token_expiry ? Number(r.reset_token_expiry) : undefined
          };
        }
        return null;
      } catch (err) {
        console.error('Postgres error in getAdminAuth:', err); return null;
      }
    }
    return null;
  };

export const updateAdminPassword = async (passwordHash: string): Promise<void> => {
    if (pgPool) {
      try {
        await pgPool.query(
          "INSERT INTO admin_auth (id, password_hash) VALUES ('admin_auth', $1) ON CONFLICT (id) DO UPDATE SET password_hash = $1",
          [passwordHash]
        );
      } catch (err) {
        console.error('Postgres error in updateAdminPassword:', err); throw err;
      }
    }
  };

export const setAdminResetToken = async (token: string, expiry: number): Promise<void> => {
    if (pgPool) {
      try {
        await pgPool.query(
          "INSERT INTO admin_auth (id, reset_token, reset_token_expiry) VALUES ('admin_auth', $1, $2) ON CONFLICT (id) DO UPDATE SET reset_token = $1, reset_token_expiry = $2",
          [token, expiry]
        );
      } catch (err) {
        console.error('Postgres error in setAdminResetToken:', err); throw err;
      }
    }
  };

export const clearAdminResetToken = async (): Promise<void> => {
    if (pgPool) {
      try {
        await pgPool.query(
          "UPDATE admin_auth SET reset_token = NULL, reset_token_expiry = NULL WHERE id = 'admin_auth'"
        );
      } catch (err) {
        console.error('Postgres error in clearAdminResetToken:', err); throw err;
      }
    }
  };