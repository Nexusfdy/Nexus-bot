import { pgPool, dbType } from '../core.js';
import { Product, Order, CustomCommand, BotConfig, ModLog, BotStats } from '../../types.js';

export const getCommands = async (): Promise<CustomCommand[]> => {
    if (pgPool) {
      try {
        const res = await pgPool.query('SELECT * FROM custom_commands ORDER BY name ASC');
        return res.rows.map(row => ({
          id: row.id,
          name: row.name,
          response: row.response,
          description: row.description || '',
          usageCount: row.usage_count,
          isActive: row.is_active
        }));
      } catch (err) {
        console.error('Postgres error:', err); throw err;
      }
    }
    return readLocalFile().commands;
  };

export const saveCommand = async (cmd: CustomCommand): Promise<void> => {
    if (pgPool) {
      try {
        await pgPool.query({
          text: `INSERT INTO custom_commands (id, name, response, description, usage_count, is_active)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 ON CONFLICT (name) DO UPDATE SET
                   response = $3, description = $4, is_active = $6`,
          values: [cmd.id, cmd.name, cmd.response, cmd.description, cmd.usageCount, cmd.isActive]
        });
        return;
      } catch (err) {
        console.error('Postgres error:', err); throw err;
      }
    }
    const data = readLocalFile();
    const existingIdx = data.commands.findIndex((c: CustomCommand) => c.id === cmd.id || c.name === cmd.name);
    if (existingIdx !== -1) {
      data.commands[existingIdx] = cmd;
    } else {
      data.commands.push(cmd);
    }
    writeLocalFile(data);
  };

export const deleteCommand = async (id: string): Promise<void> => {
    if (pgPool) {
      try {
        await pgPool.query('DELETE FROM custom_commands WHERE id = $1', [id]);
        return;
      } catch (err) {
        console.error('Postgres error:', err); throw err;
      }
    }
    const data = readLocalFile();
    if (!data.commands) data.commands = [];
    data.commands = data.commands.filter((c: CustomCommand) => c.id !== id);
    writeLocalFile(data);
  };