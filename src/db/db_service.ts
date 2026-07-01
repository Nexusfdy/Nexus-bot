import path from 'path';
import { Pool } from 'pg';
import { Product, Order, CustomCommand, BotConfig, ModLog, BotStats } from '../types.ts';

// Dynamic Database Credentials from Environment
const DATABASE_URL = process.env.DATABASE_URL;
const POSTGRES_HOST = process.env.POSTGRES_HOST || process.env.SQL_HOST;
const POSTGRES_PORT = process.env.POSTGRES_PORT ? parseInt(process.env.POSTGRES_PORT, 10) : 5432;
const POSTGRES_USER = process.env.POSTGRES_USER || process.env.SQL_USER;
const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD || process.env.SQL_PASSWORD;
const POSTGRES_DATABASE = process.env.POSTGRES_DATABASE || process.env.POSTGRES_DB || process.env.SQL_DB_NAME;

let pgPool: Pool | null = null;
let dbType: 'PostgreSQL' | 'Local JSON File' = 'Local JSON File';

// Initialize Postgres Pool if credentials or connection URL exists
if (DATABASE_URL || (POSTGRES_HOST && POSTGRES_DATABASE && POSTGRES_USER)) {
  try {
    if (DATABASE_URL) {
      // Connect using full connection URL (ideal for Supabase, Neon, etc.)
      const isLocalhost = DATABASE_URL.includes('localhost') || DATABASE_URL.includes('127.0.0.1');
      pgPool = new Pool({
        connectionString: DATABASE_URL,
        ssl: isLocalhost ? false : { rejectUnauthorized: false },
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });
    } else {
      // Connect using individual credentials
      pgPool = new Pool({
        host: POSTGRES_HOST,
        port: POSTGRES_PORT,
        database: POSTGRES_DATABASE,
        user: POSTGRES_USER,
        password: POSTGRES_PASSWORD,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });
    }
    
    pgPool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client:', err);
    });

    dbType = 'PostgreSQL';
    console.log('PostgreSQL client pool initialized. Verifying presence of tables...');
  } catch (err) {
    console.error('Failed to initialize PostgreSQL client Pool, falling back to JSON:', err);
    pgPool = null;
    dbType = 'Local JSON File';
  }
} else {
  console.log('PostgreSQL environment variables missing. Operating in Local JSON File mode.');
  dbType = 'Local JSON File';
}

// Default initial data for seeding
const defaultConfig: BotConfig = {
  prefix: '!',
  statusText: 'Auto-Store | /buy',
  statusType: 'WATCHING',
  webhookUrl: '',
  autoClaimOnPayment: true,
  greetingMessage: 'Selamat datang di Premium Store!',
  autoMod: {
    antiLink: true,
    antiSpam: true,
    warnLimit: 3,
    bannedWords: ['scam', 'cheat', 'hack', 'free-nitro']
  },
  botToken: ''
};

const defaultStats: BotStats = {
  totalRevenue: 0,
  totalOrders: 0,
  totalProducts: 0,
  activeServers: 0,
  commandsRun: 0,
  moderationActions: 0
};

const defaultProducts: Product[] = [];

const defaultCommands: CustomCommand[] = [];

const defaultOrders: Order[] = [];

const defaultModLogs: ModLog[] = [];

// Seed databases
export async function bootstrapTables() {
  if (dbType === 'PostgreSQL' && pgPool) {
    try {
      const client = await pgPool.connect();
      try {
        console.log('[PostgreSQL] Creating tables if not exist...');
        await client.query(`
          CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            code TEXT,
            name TEXT NOT NULL,
            price INTEGER NOT NULL,
            description TEXT,
            type TEXT NOT NULL,
            stock TEXT[],
            category TEXT,
            image_url TEXT,
            created_at BIGINT NOT NULL
          );
          
          CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            product_id TEXT NOT NULL,
            product_name TEXT NOT NULL,
            price INTEGER NOT NULL,
            customer_discord_id TEXT,
            customer_username TEXT,
            status TEXT NOT NULL,
            claimed_stock_item TEXT,
            claimed_at BIGINT,
            transaction_id TEXT NOT NULL,
            created_at BIGINT NOT NULL
          );
          
          CREATE TABLE IF NOT EXISTS custom_commands (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            response TEXT NOT NULL,
            description TEXT,
            usage_count INTEGER NOT NULL DEFAULT 0,
            is_active BOOLEAN NOT NULL DEFAULT TRUE
          );
          
          CREATE TABLE IF NOT EXISTS bot_config (
            id TEXT PRIMARY KEY,
            prefix TEXT NOT NULL,
            status_text TEXT,
            status_type TEXT NOT NULL,
            webhook_url TEXT,
            auto_claim_on_payment BOOLEAN NOT NULL,
            greeting_message TEXT,
            live_stock_channel TEXT,
            anti_link BOOLEAN NOT NULL,
            anti_spam BOOLEAN NOT NULL,
            warn_limit INTEGER NOT NULL,
            banned_words TEXT[],
            bot_token TEXT,
            owner_id TEXT,
            server_management JSONB
          );
          
          CREATE TABLE IF NOT EXISTS mod_logs (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            username TEXT NOT NULL,
            action TEXT NOT NULL,
            reason TEXT NOT NULL,
            timestamp BIGINT NOT NULL
          );
          
          CREATE TABLE IF NOT EXISTS bot_stats (
            id TEXT PRIMARY KEY,
            total_revenue INTEGER NOT NULL DEFAULT 0,
            total_orders INTEGER NOT NULL DEFAULT 0,
            total_products INTEGER NOT NULL DEFAULT 0,
            active_servers INTEGER NOT NULL DEFAULT 0,
            commands_run INTEGER NOT NULL DEFAULT 0,
            moderation_actions INTEGER NOT NULL DEFAULT 0
          );
          
          CREATE TABLE IF NOT EXISTS users (
            discord_id TEXT PRIMARY KEY,
            account_name TEXT UNIQUE NOT NULL,
            balance INTEGER NOT NULL DEFAULT 0,
            created_at BIGINT NOT NULL
          );
          
          CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            username TEXT NOT NULL,
            amount INTEGER NOT NULL,
            type TEXT NOT NULL,
            description TEXT,
            timestamp BIGINT NOT NULL
          );

          CREATE TABLE IF NOT EXISTS purchased_items (
            transaction_id TEXT PRIMARY KEY REFERENCES transactions(id),
            user_id TEXT NOT NULL,
            product_name TEXT NOT NULL,
            items JSONB,
            delivery_status TEXT DEFAULT 'PENDING_DELIVERY'
          );
          CREATE TABLE IF NOT EXISTS processed_webhooks (
            message_id TEXT PRIMARY KEY,
            processed_at BIGINT NOT NULL
          );
        `);
        console.log('[PostgreSQL] Tables checked/created successfully.');

        // Dynamic migration queries to ensure newly added columns exist in legacy PostgreSQL tables.
        console.log('[PostgreSQL] Running incremental migrations...');
        await client.query(`
          ALTER TABLE bot_config ADD COLUMN IF NOT EXISTS bot_token TEXT;
          ALTER TABLE bot_config ADD COLUMN IF NOT EXISTS live_stock_channel TEXT;
          ALTER TABLE bot_config ADD COLUMN IF NOT EXISTS live_stock_message_id TEXT;
          ALTER TABLE bot_config ADD COLUMN IF NOT EXISTS owner_id TEXT;
          ALTER TABLE bot_config ADD COLUMN IF NOT EXISTS server_management JSONB;
          ALTER TABLE bot_config ADD COLUMN IF NOT EXISTS saweria_webhook_channel_id TEXT;
          ALTER TABLE bot_config ADD COLUMN IF NOT EXISTS deposit_webhook_channel_id TEXT;
          ALTER TABLE bot_config ADD COLUMN IF NOT EXISTS guild_id TEXT;
          ALTER TABLE products ADD COLUMN IF NOT EXISTS code TEXT;
        `);
        console.log('[PostgreSQL] Incremental migrations completed successfully.');

        // Seed Default Bot Settings if empty
        const configCheck = await client.query(`SELECT COUNT(*) FROM bot_config`);
        if (parseInt(configCheck.rows[0].count) === 0) {
          console.log('[PostgreSQL] Seeding default bot credentials...');
          await client.query({
            text: `INSERT INTO bot_config (id, prefix, status_text, status_type, webhook_url, auto_claim_on_payment, greeting_message, live_stock_channel, live_stock_message_id, anti_link, anti_spam, warn_limit, banned_words, bot_token, owner_id, server_management) 
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
            values: [
              'bot_settings',
              defaultConfig.prefix,
              defaultConfig.statusText,
              defaultConfig.statusType,
              defaultConfig.webhookUrl,
              defaultConfig.autoClaimOnPayment,
              defaultConfig.greetingMessage,
              defaultConfig.liveStockChannel || '',
              defaultConfig.liveStockMessageId || '',
              defaultConfig.autoMod.antiLink,
              defaultConfig.autoMod.antiSpam,
              defaultConfig.autoMod.warnLimit,
              defaultConfig.autoMod.bannedWords,
              defaultConfig.botToken || '',
              defaultConfig.ownerId || '',
              defaultConfig.serverManagement ? JSON.stringify(defaultConfig.serverManagement) : null
            ]
          });
        }

        // Seed Default Stats
        const statsCheck = await client.query(`SELECT COUNT(*) FROM bot_stats`);
        if (parseInt(statsCheck.rows[0].count) === 0) {
          await client.query({
            text: `INSERT INTO bot_stats (id, total_revenue, total_orders, total_products, active_servers, commands_run, moderation_actions) 
                   VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            values: [
              'core_stats',
              defaultStats.totalRevenue,
              defaultStats.totalOrders,
              defaultStats.totalProducts,
              defaultStats.activeServers,
              defaultStats.commandsRun,
              defaultStats.moderationActions
            ]
          });
        }

        // Seed Products if empty
        const prodCheck = await client.query(`SELECT COUNT(*) FROM products`);
        if (parseInt(prodCheck.rows[0].count) === 0) {
          for (const item of defaultProducts) {
            await client.query({
              text: `INSERT INTO products (id, name, price, description, type, stock, category, image_url, created_at) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
              values: [item.id, item.name, item.price, item.description, item.type, item.stock, item.category, item.imageUrl || '', item.createdAt]
            });
          }
        }

        // Seed Custom Commands if empty
        const cmdCheck = await client.query(`SELECT COUNT(*) FROM custom_commands`);
        if (parseInt(cmdCheck.rows[0].count) === 0) {
          for (const cmd of defaultCommands) {
            await client.query({
              text: `INSERT INTO custom_commands (id, name, response, description, usage_count, is_active) 
                     VALUES ($1, $2, $3, $4, $5, $6)`,
              values: [cmd.id, cmd.name, cmd.response, cmd.description, cmd.usageCount, cmd.isActive]
            });
          }
        }

        // Seed Orders if empty
        const ordCheck = await client.query(`SELECT COUNT(*) FROM orders`);
        if (parseInt(ordCheck.rows[0].count) === 0) {
          for (const ord of defaultOrders) {
            await client.query({
              text: `INSERT INTO orders (id, product_id, product_name, price, customer_discord_id, customer_username, status, claimed_stock_item, claimed_at, transaction_id, created_at) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
              values: [ord.id, ord.productId, ord.productName, ord.price, ord.customerDiscordId || '', ord.customerUsername || '', ord.status, ord.claimedStockItem || '', ord.claimedAt || null, ord.transactionId, ord.createdAt]
            });
            if (ord.status === 'Success' || ord.status === 'Claimed') {
              await client.query({
                text: `INSERT INTO transactions (id, user_id, username, amount, type, description, timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING`,
                values: [`tx_${ord.id}`, ord.customerDiscordId || '', ord.customerUsername || '', ord.price, 'PURCHASE', `Purchased product: ${ord.productName}`, ord.createdAt]
              });
            }
          }
        }

        // Seed Mod Logs if empty
        const modCheck = await client.query(`SELECT COUNT(*) FROM mod_logs`);
        if (parseInt(modCheck.rows[0].count) === 0) {
          for (const log of defaultModLogs) {
            await client.query({
              text: `INSERT INTO mod_logs (id, user_id, username, action, reason, timestamp) 
                     VALUES ($1, $2, $3, $4, $5, $6)`,
              values: [log.id, log.userId, log.username, log.action, log.reason, log.timestamp]
            });
          }
        }

      } finally {
        client.release();
      }
    } catch (e) {
      console.error('[PostgreSQL] Failed to execute setup query. Pivoting to Local File Storage.', e);
      dbType = 'Local JSON File';
      pgPool = null;
    }
  }
}

// Perform instant setup on import
bootstrapTables().catch(err => {
  console.error('[DB Service] Error bootstrapping databases:', err);
});

// JSON File Local Methods
function readLocalFile(): any {
  throw new Error("PostgreSQL connection is required. Local fallback is disabled.");
}

function writeLocalFile(data: any) {
  throw new Error("PostgreSQL connection is required. Local fallback is disabled.");
}

// Unified export API wrapper
export const dbService = {
  getEngine: () => dbType,

  // Products
  getProducts: async (): Promise<Product[]> => {
    if (pgPool) {
      try {
        const res = await pgPool.query('SELECT * FROM products ORDER BY created_at DESC');
        return res.rows.map(row => ({
          id: row.id,
          code: row.code || '',
          name: row.name,
          price: row.price,
          description: row.description || '',
          type: row.type as any,
          stock: row.stock || [],
          category: row.category || '',
          imageUrl: row.image_url || '',
          createdAt: Number(row.created_at)
        }));
      } catch (err) {
        console.error('Postgres error:', err); throw err;
      }
    }
    return readLocalFile().products;
  },

  saveProduct: async (prod: Product): Promise<void> => {
    if (pgPool) {
      try {
        await pgPool.query({
          text: `INSERT INTO products (id, code, name, price, description, type, stock, category, image_url, created_at)
                 VALUES ($1, $10, $2, $3, $4, $5, $6, $7, $8, $9)
                 ON CONFLICT (id) DO UPDATE SET
                   code = $10, name = $2, price = $3, description = $4, type = $5, stock = $6, category = $7, image_url = $8`,
          values: [prod.id, prod.name, prod.price, prod.description, prod.type, prod.stock, prod.category, prod.imageUrl || '', prod.createdAt, prod.code || '']
        });
        return;
      } catch (err) {
        console.error('Postgres error:', err); throw err;
      }
    }
    const data = readLocalFile();
    const existingIdx = data.products.findIndex((p: Product) => p.id === prod.id);
    if (existingIdx !== -1) {
      data.products[existingIdx] = prod;
    } else {
      data.products.unshift(prod);
    }
    writeLocalFile(data);
  },

  deleteProduct: async (id: string): Promise<void> => {
    if (pgPool) {
      try {
        await pgPool.query('DELETE FROM products WHERE id = $1', [id]);
        return;
      } catch (err) {
        console.error('Postgres error:', err); throw err;
      }
    }
    const data = readLocalFile();
    if (!data.products) data.products = [];
    data.products = data.products.filter((p: Product) => p.id !== id);
    writeLocalFile(data);
  },

  // Commands
  getCommands: async (): Promise<CustomCommand[]> => {
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
  },

  saveCommand: async (cmd: CustomCommand): Promise<void> => {
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
  },

  deleteCommand: async (id: string): Promise<void> => {
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
  },

  // Config Core
  getConfig: async (): Promise<BotConfig> => {
    let config: any = null;
    if (pgPool) {
      try {
        const res = await pgPool.query("SELECT * FROM bot_config WHERE id = 'bot_settings' LIMIT 1");
        if (res.rows.length > 0) {
          const row = res.rows[0];
          config = {
            prefix: row.prefix,
            statusText: row.status_text || '',
            statusType: row.status_type as any,
            webhookUrl: row.webhook_url || '',
            autoClaimOnPayment: row.auto_claim_on_payment,
            greetingMessage: row.greeting_message || '',
            liveStockChannel: row.live_stock_channel || '',
            liveStockMessageId: row.live_stock_message_id || '',
            autoMod: {
              antiLink: !!row.anti_link,
              antiSpam: !!row.anti_spam,
              warnLimit: row.warn_limit,
              bannedWords: row.banned_words || []
            },
            botToken: row.bot_token || '',
            guildId: row.guild_id || '',
            ownerId: row.owner_id || '',
            serverManagement: row.server_management ? (typeof row.server_management === 'string' ? JSON.parse(row.server_management) : row.server_management) : undefined,
            depositWebhookChannelId: row.deposit_webhook_channel_id || ''
          };
        }
      } catch (err) {
        console.error('Postgres error:', err); throw err;
      }
    }
    if (!config) {
      config = readLocalFile().config;
    }
    // Guarantee defaults for properties to prevent crashes
    if (!config) config = { ...defaultConfig };
    if (!config.prefix) config.prefix = '!';
    if (!config.autoMod) {
      config.autoMod = {
        antiLink: false,
        antiSpam: false,
        warnLimit: 3,
        bannedWords: []
      };
    } else {
      if (typeof config.autoMod.antiLink !== 'boolean') config.autoMod.antiLink = false;
      if (typeof config.autoMod.antiSpam !== 'boolean') config.autoMod.antiSpam = false;
      if (typeof config.autoMod.warnLimit !== 'number') config.autoMod.warnLimit = 3;
      if (!Array.isArray(config.autoMod.bannedWords)) config.autoMod.bannedWords = [];
    }
    return config as BotConfig;
  },

  saveConfig: async (config: BotConfig): Promise<void> => {
    // Ensure nested properties are never null/undefined
    if (!config) config = { ...defaultConfig };
    if (!config.prefix) config.prefix = '!';
    if (!config.autoMod) {
      config.autoMod = {
        antiLink: false,
        antiSpam: false,
        warnLimit: 3,
        bannedWords: []
      };
    } else {
      if (typeof config.autoMod.antiLink !== 'boolean') config.autoMod.antiLink = false;
      if (typeof config.autoMod.antiSpam !== 'boolean') config.autoMod.antiSpam = false;
      if (typeof config.autoMod.warnLimit !== 'number') config.autoMod.warnLimit = 3;
      if (!Array.isArray(config.autoMod.bannedWords)) config.autoMod.bannedWords = [];
    }

    if (pgPool) {
      try {
        await pgPool.query({
          text: `INSERT INTO bot_config (id, prefix, status_text, status_type, webhook_url, auto_claim_on_payment, greeting_message, live_stock_channel, live_stock_message_id, anti_link, anti_spam, warn_limit, banned_words, bot_token, owner_id, server_management, deposit_webhook_channel_id, guild_id)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
                 ON CONFLICT (id) DO UPDATE SET
                   prefix = $2, status_text = $3, status_type = $4, webhook_url = $5, auto_claim_on_payment = $6,
                   greeting_message = $7, live_stock_channel = $8, live_stock_message_id = $9, anti_link = $10, anti_spam = $11, warn_limit = $12, banned_words = $13, bot_token = $14, owner_id = $15, server_management = $16, deposit_webhook_channel_id = $17, guild_id = $18`,
          values: [
            'bot_settings',
            config.prefix,
            config.statusText || '',
            config.statusType || 'WATCHING',
            config.webhookUrl || '',
            config.autoClaimOnPayment || false,
            config.greetingMessage || '',
            config.liveStockChannel || '',
            config.liveStockMessageId || '',
            config.autoMod.antiLink,
            config.autoMod.antiSpam,
            config.autoMod.warnLimit,
            config.autoMod.bannedWords,
            config.botToken || '',
            config.ownerId || '',
            config.serverManagement ? JSON.stringify(config.serverManagement) : null,
            config.depositWebhookChannelId || '',
            config.guildId || ''
          ]
        });
        return;
      } catch (err) {
        console.error('Postgres error:', err); throw err;
      }
    }
    const data = readLocalFile();
    data.config = config;
    writeLocalFile(data);
  },

  updateGeneralConfig: async (prefix: string, statusText: string, statusType: string): Promise<void> => {
    if (pgPool) {
      try {
        await pgPool.query(
          "UPDATE bot_config SET prefix = $1, status_text = $2, status_type = $3 WHERE id = 'bot_settings'",
          [prefix, statusText, statusType]
        );
        return;
      } catch (err) { console.error('Postgres error:', err); throw err; }
    }
    const data = readLocalFile();
    if (!data.config) data.config = { ...defaultConfig };
    data.config.prefix = prefix;
    data.config.statusText = statusText;
    data.config.statusType = statusType;
    writeLocalFile(data);
  },

  updateDiscordConfig: async (botToken: string): Promise<void> => {
    if (pgPool) {
      try {
        await pgPool.query(
          "UPDATE bot_config SET bot_token = $1 WHERE id = 'bot_settings'",
          [botToken]
        );
        return;
      } catch (err) { console.error('Postgres error:', err); throw err; }
    }
    const data = readLocalFile();
    if (!data.config) data.config = { ...defaultConfig };
    data.config.botToken = botToken;
    writeLocalFile(data);
  },

  updateLiveStockConfig: async (guildId: string, liveStockChannel: string): Promise<void> => {
    if (pgPool) {
      try {
        await pgPool.query(
          "UPDATE bot_config SET guild_id = $1, live_stock_channel = $2 WHERE id = 'bot_settings'",
          [guildId, liveStockChannel]
        );
        return;
      } catch (err) { console.error('Postgres error:', err); throw err; }
    }
    const data = readLocalFile();
    if (!data.config) data.config = { ...defaultConfig };
    data.config.guildId = guildId;
    data.config.liveStockChannel = liveStockChannel;
    writeLocalFile(data);
  },

  updateLiveStockMessageId: async (liveStockMessageId: string): Promise<void> => {
    if (pgPool) {
      try {
        await pgPool.query(
          "UPDATE bot_config SET live_stock_message_id = $1 WHERE id = 'bot_settings'",
          [liveStockMessageId]
        );
        return;
      } catch (err) { console.error('Postgres error:', err); throw err; }
    }
    const data = readLocalFile();
    if (!data.config) data.config = { ...defaultConfig };
    data.config.liveStockMessageId = liveStockMessageId;
    writeLocalFile(data);
  },

  updateSaweriaConfig: async (depositWebhookChannelId: string): Promise<void> => {
    if (pgPool) {
      try {
        await pgPool.query(
          "UPDATE bot_config SET deposit_webhook_channel_id = $1 WHERE id = 'bot_settings'",
          [depositWebhookChannelId]
        );
        return;
      } catch (err) { console.error('Postgres error:', err); throw err; }
    }
    const data = readLocalFile();
    if (!data.config) data.config = { ...defaultConfig };
    data.config.depositWebhookChannelId = depositWebhookChannelId;
    writeLocalFile(data);
  },

  updateSecurityConfig: async (antiLink: boolean, antiSpam: boolean, warnLimit: number, bannedWords: string[]): Promise<void> => {
    if (pgPool) {
      try {
        await pgPool.query(
          "UPDATE bot_config SET anti_link = $1, anti_spam = $2, warn_limit = $3, banned_words = $4 WHERE id = 'bot_settings'",
          [antiLink, antiSpam, warnLimit, bannedWords]
        );
        return;
      } catch (err) { console.error('Postgres error:', err); throw err; }
    }
    const data = readLocalFile();
    if (!data.config) data.config = { ...defaultConfig };
    if (!data.config.autoMod) data.config.autoMod = { antiLink: false, antiSpam: false, warnLimit: 3, bannedWords: [] };
    data.config.autoMod.antiLink = antiLink;
    data.config.autoMod.antiSpam = antiSpam;
    data.config.autoMod.warnLimit = warnLimit;
    data.config.autoMod.bannedWords = bannedWords;
    writeLocalFile(data);
  },

  updateFeaturesConfig: async (webhookUrl: string, autoClaimOnPayment: boolean, greetingMessage: string): Promise<void> => {
    if (pgPool) {
      try {
        await pgPool.query(
          "UPDATE bot_config SET webhook_url = $1, auto_claim_on_payment = $2, greeting_message = $3 WHERE id = 'bot_settings'",
          [webhookUrl, autoClaimOnPayment, greetingMessage]
        );
        return;
      } catch (err) { console.error('Postgres error:', err); throw err; }
    }
    const data = readLocalFile();
    if (!data.config) data.config = { ...defaultConfig };
    data.config.webhookUrl = webhookUrl;
    data.config.autoClaimOnPayment = autoClaimOnPayment;
    data.config.greetingMessage = greetingMessage;
    writeLocalFile(data);
  },

  updateServerConfig: async (guildId: string, ownerId: string, serverManagement: any): Promise<void> => {
    if (pgPool) {
      try {
        await pgPool.query(
          "UPDATE bot_config SET guild_id = $1, owner_id = $2, server_management = $3 WHERE id = 'bot_settings'",
          [guildId, ownerId, serverManagement ? JSON.stringify(serverManagement) : null]
        );
        return;
      } catch (err) { console.error('Postgres error:', err); throw err; }
    }
    const data = readLocalFile();
    if (!data.config) data.config = { ...defaultConfig };
    data.config.guildId = guildId;
    data.config.ownerId = ownerId;
    data.config.serverManagement = serverManagement;
    writeLocalFile(data);
  },

  // Stats
  getStats: async (): Promise<BotStats> => {
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
  },

  updateStats: async (fields: Partial<BotStats>): Promise<void> => {
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
  },

  // Orders
  getOrders: async (): Promise<Order[]> => {
    if (pgPool) {
      try {
        const res = await pgPool.query('SELECT * FROM orders ORDER BY created_at DESC');
        return res.rows.map(row => ({
          id: row.id,
          productId: row.product_id,
          productName: row.product_name,
          price: row.price,
          customerDiscordId: row.customer_discord_id || '',
          customerUsername: row.customer_username || '',
          status: row.status as any,
          claimedStockItem: row.claimed_stock_item || '',
          claimedAt: row.claimed_at ? Number(row.claimed_at) : undefined,
          transactionId: row.transaction_id,
          createdAt: Number(row.created_at)
        }));
      } catch (err) {
        console.error('Postgres error:', err); throw err;
      }
    }
    return readLocalFile().orders;
  },

  saveOrder: async (ord: Order): Promise<void> => {
    if (pgPool) {
      try {
        await pgPool.query({
          text: `INSERT INTO orders (id, product_id, product_name, price, customer_discord_id, customer_username, status, claimed_stock_item, claimed_at, transaction_id, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                 ON CONFLICT (id) DO UPDATE SET
                   status = $7, claimed_stock_item = $8, claimed_at = $9`,
          values: [ord.id, ord.productId, ord.productName, ord.price, ord.customerDiscordId || '', ord.customerUsername || '', ord.status, ord.claimedStockItem || '', ord.claimedAt || null, ord.transactionId, ord.createdAt]
        });
        return;
      } catch (err) {
        console.error('Postgres error:', err); throw err;
      }
    }
    const data = readLocalFile();
    const existingIdx = data.orders.findIndex((o: Order) => o.id === ord.id);
    if (existingIdx !== -1) {
      data.orders[existingIdx] = ord;
    } else {
      data.orders.unshift(ord);
    }
    writeLocalFile(data);
  },

  // Mod Logs
  getModLogs: async (): Promise<ModLog[]> => {
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
  },

  saveModLog: async (log: ModLog): Promise<void> => {
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
  },

  clearModLogs: async (): Promise<void> => {
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
  },

  clearAllData: async (mode: 'clear' | 'restore' = 'clear'): Promise<void> => {
    if (pgPool) {
      try {
        await pgPool.query('TRUNCATE TABLE products CASCADE');
        await pgPool.query('TRUNCATE TABLE orders CASCADE');
        await pgPool.query('TRUNCATE TABLE custom_commands CASCADE');
        await pgPool.query('TRUNCATE TABLE mod_logs CASCADE');
        
        if (mode === 'clear') {
          await pgPool.query(`UPDATE bot_stats SET 
            total_revenue = 0, 
            total_orders = 0, 
            total_products = 0, 
            active_servers = 0, 
            commands_run = 0, 
            moderation_actions = 0 
            WHERE id = 'core_stats'`);
        } else {
          // Restore stats to initial default values
          await pgPool.query(`UPDATE bot_stats SET 
            total_revenue = ${defaultStats.totalRevenue}, 
            total_orders = ${defaultStats.totalOrders}, 
            total_products = ${defaultStats.totalProducts}, 
            active_servers = ${defaultStats.activeServers}, 
            commands_run = ${defaultStats.commandsRun}, 
            moderation_actions = ${defaultStats.moderationActions} 
            WHERE id = 'core_stats'`);

          // Seed default products
          for (const item of defaultProducts) {
            await pgPool.query({
              text: `INSERT INTO products (id, name, price, description, type, stock, category, image_url, created_at) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
              values: [item.id, item.name, item.price, item.description, item.type, item.stock, item.category, item.imageUrl || '', item.createdAt]
            });
          }

          // Seed default custom commands
          for (const cmd of defaultCommands) {
            await pgPool.query({
              text: `INSERT INTO custom_commands (id, name, response, description, usage_count, is_active) 
                     VALUES ($1, $2, $3, $4, $5, $6)`,
              values: [cmd.id, cmd.name, cmd.response, cmd.description, cmd.usageCount, cmd.isActive]
            });
          }

          // Seed default orders
          for (const ord of defaultOrders) {
            await pgPool.query({
              text: `INSERT INTO orders (id, product_id, product_name, price, customer_discord_id, customer_username, status, claimed_stock_item, claimed_at, transaction_id, created_at) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
              values: [ord.id, ord.productId, ord.productName, ord.price, ord.customerDiscordId || '', ord.customerUsername || '', ord.status, ord.claimedStockItem || '', ord.claimedAt || null, ord.transactionId, ord.createdAt]
            });
            if (ord.status === 'Success' || ord.status === 'Claimed') {
              await pgPool.query({
                text: `INSERT INTO transactions (id, user_id, username, amount, type, description, timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING`,
                values: [`tx_${ord.id}`, ord.customerDiscordId || '', ord.customerUsername || '', ord.price, 'PURCHASE', `Purchased product: ${ord.productName}`, ord.createdAt]
              });
            }
          }

          // Seed default mod logs
          for (const log of defaultModLogs) {
            await pgPool.query({
              text: `INSERT INTO mod_logs (id, user_id, username, action, reason, timestamp) 
                     VALUES ($1, $2, $3, $4, $5, $6)`,
              values: [log.id, log.userId, log.username, log.action, log.reason, log.timestamp]
            });
          }
        }
        return;
      } catch (err) {
        console.error('Postgres error:', err); throw err;
      }
    }
    const data = readLocalFile();
    if (mode === 'clear') {
      data.products = [];
      data.orders = [];
      data.commands = [];
      data.modLogs = [];
      data.users = [];
      data.stats = {
        totalRevenue: 0,
        totalOrders: 0,
        totalProducts: 0,
        activeServers: 0,
        commandsRun: 0,
        moderationActions: 0
      };
    } else {
      data.products = [...defaultProducts];
      data.orders = [...defaultOrders];
      data.commands = [...defaultCommands];
      data.modLogs = [...defaultModLogs];
      data.users = [];
      data.stats = { ...defaultStats };
    }
    writeLocalFile(data);
  },

  processPurchase: async (userId: string, username: string, productId: string, qty: number, totalCost: number): Promise<{ success: boolean; stockItems?: string[]; error?: string; transactionId?: string; newBalance?: number }> => {
    if (!pgPool) {
      return { success: false, error: "Database not connected. PostgreSQL is required for safe transactions." };
    }

    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');

      // 1. Lock the user row and check balance
      const userRes = await client.query('SELECT balance FROM users WHERE discord_id = $1 FOR UPDATE', [userId]);
      if (userRes.rows.length === 0) {
        throw new Error("User not found");
      }
      const currentBalance = userRes.rows[0].balance;
      if (currentBalance < totalCost) {
        throw new Error("Saldo tidak mencukupi");
      }

      // 2. Lock the product row, check stock and perform atomic update
      const productRes = await client.query(`
        WITH old_data AS (
          SELECT name, stock[1:$1] AS claimed_items, array_length(stock, 1) AS stock_len
          FROM products 
          WHERE id = $2 FOR UPDATE
        )
        UPDATE products 
        SET stock = stock[($1 + 1):array_upper(stock, 1)] 
        WHERE id = $2 AND (SELECT stock_len FROM old_data) >= $1
        RETURNING (SELECT name FROM old_data) AS name, (SELECT claimed_items FROM old_data) AS claimed_items;
      `, [qty, productId]);

      if (productRes.rows.length === 0) {
        throw new Error("Produk tidak ditemukan atau stok tidak cukup. Silahkan kurangi jumlah atau pilih produk lain.");
      }
      
      const product = productRes.rows[0];
      const claimedStockItems = product.claimed_items || [];
      if (claimedStockItems.length < qty) {
        throw new Error("Stok produk tidak cukup. Silahkan kurangi jumlah atau pilih produk lain.");
      }

      // 5. Update User Balance
      const newBalance = currentBalance - totalCost;
      await client.query('UPDATE users SET balance = $1 WHERE discord_id = $2', [newBalance, userId]);

      // 6. Record Transaction
      const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      await client.query(`
        INSERT INTO transactions (id, user_id, username, amount, type, description, timestamp)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [txId, userId, username, totalCost, 'PURCHASE', `Pembelian produk: ${qty}x ${product.name}`, Date.now()]);

      // 6.5 Record Purchased Items for Delivery Recovery
      await client.query(`
        INSERT INTO purchased_items (transaction_id, user_id, product_name, items, delivery_status)
        VALUES ($1, $2, $3, $4, 'PENDING_DELIVERY')
      `, [txId, userId, product.name, JSON.stringify(claimedStockItems)]);

      // 7. Update Stats (Optional, increment orders)
      await client.query(`
        UPDATE bot_stats SET 
        total_orders = total_orders + 1,
        total_revenue = total_revenue + $1
        WHERE id = 'core_stats'
      `, [totalCost]);

      await client.query('COMMIT');

      return { success: true, stockItems: claimedStockItems, transactionId: txId, newBalance };
    } catch (err: any) {
      await client.query('ROLLBACK');
      console.error('Purchase transaction failed:', err);
      return { success: false, error: err.message || "Gagal memproses pembelian" };
    } finally {
      client.release();
    }
  },

  processTopup: async (messageId: string, accountName: string, amount: number): Promise<{ success: boolean; error?: string; userId?: string }> => {
    if (!pgPool) return { success: false, error: "Database not connected." };
    
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');
      
      const checkRes = await client.query('SELECT message_id FROM processed_webhooks WHERE message_id = $1 FOR UPDATE', [messageId]);
      if (checkRes.rows.length > 0) {
        throw new Error("Message already processed");
      }
      
      await client.query('INSERT INTO processed_webhooks (message_id, processed_at) VALUES ($1, $2)', [messageId, Date.now()]);
      
      const userRes = await client.query('SELECT discord_id, balance FROM users WHERE LOWER(account_name) = LOWER($1) FOR UPDATE', [accountName]);
      if (userRes.rows.length === 0) {
        throw new Error(`User with account name **${accountName}** not found`);
      }
      
      const user = userRes.rows[0];
      const newBalance = user.balance + amount;
      
      await client.query('UPDATE users SET balance = $1 WHERE discord_id = $2', [newBalance, user.discord_id]);
      
      const txId = `topup_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      await client.query(`
        INSERT INTO transactions (id, user_id, username, amount, type, description, timestamp)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [txId, user.discord_id, accountName, amount, 'TOPUP', `Topup via Saweria: Rp ${amount.toLocaleString('id-ID')}`, Date.now()]);
      
      await client.query('COMMIT');
      return { success: true, userId: user.discord_id };
    } catch (err: any) {
      await client.query('ROLLBACK');
      console.error('Topup transaction failed:', err);
      return { success: false, error: err.message };
    } finally {
      client.release();
    }
  },

  processClaim: async (orderId: string, userId: string, username: string): Promise<{ success: boolean; claimItem?: string; orderDetails?: Order; error?: string }> => {
    if (!pgPool) {
      return { success: false, error: "Database not connected. PostgreSQL is required for safe transactions." };
    }

    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');

      // 1. Lock the order row
      const orderRes = await client.query('SELECT * FROM orders WHERE LOWER(id) = LOWER($1) FOR UPDATE', [orderId]);
      if (orderRes.rows.length === 0) {
        throw new Error(`ID Pemesanan \`${orderId}\` tidak terdaftar atau nihil dalam sistem.`);
      }
      
      const orderRow = orderRes.rows[0];
      if (orderRow.status === 'Claimed') {
        if (orderRow.customer_discord_id && orderRow.customer_discord_id !== userId) {
          throw new Error(`Pesanan \`${orderId}\` sudah diklaim oleh pengguna lain.`);
        }
        throw new Error(`Pesanan \`${orderId}\` sudah pernah diklaim sebelumnya. Silakan cek riwayat DM Anda dari bot, atau hubungi Admin jika Anda kehilangan produk.`);
      }

      // 2. Lock the product row and perform atomic stock update
      const productRes = await client.query(`
        WITH old_data AS (
          SELECT stock[1:1] AS claimed_items, array_length(stock, 1) AS stock_len
          FROM products 
          WHERE id = $1 FOR UPDATE
        )
        UPDATE products 
        SET stock = stock[2:array_upper(stock, 1)] 
        WHERE id = $1 AND (SELECT stock_len FROM old_data) > 0
        RETURNING (SELECT claimed_items FROM old_data) AS claimed_items;
      `, [orderRow.product_id]);

      if (productRes.rows.length === 0) {
        throw new Error('Produk untuk pemesanan ini tidak ditemukan atau stok sementara habis. Silakan infokan ke owner/admin toko.');
      }
      
      const claimedItems = productRes.rows[0].claimed_items || [];
      if (claimedItems.length === 0) {
        throw new Error('Stok produk ini sementara habis. Silakan infokan ke owner/admin toko.');
      }

      const claimItem = claimedItems[0];

      // 5. Update Order
      const now = Date.now();
      await client.query(`
        UPDATE orders 
        SET status = 'Claimed', claimed_stock_item = $1, claimed_at = $2, customer_discord_id = $3, customer_username = $4
        WHERE id = $5
      `, [claimItem, now, userId, username, orderRow.id]);

      // 6. Update Stats
      await client.query(`
        UPDATE bot_stats SET 
        total_orders = total_orders + 1,
        total_revenue = total_revenue + $1
        WHERE id = 'core_stats'
      `, [orderRow.price]);

      await client.query('COMMIT');

      const orderDetails: Order = {
        id: orderRow.id,
        productId: orderRow.product_id,
        productName: orderRow.product_name,
        price: orderRow.price,
        status: 'Claimed',
        claimedStockItem: claimItem,
        claimedAt: now,
        customerDiscordId: userId,
        customerUsername: username,
        transactionId: orderRow.transaction_id,
        createdAt: Number(orderRow.created_at)
      };

      return { success: true, claimItem, orderDetails };
    } catch (err: any) {
      await client.query('ROLLBACK');
      console.error('Claim transaction failed:', err);
      return { success: false, error: err.message };
    } finally {
      client.release();
    }
  },

  refundPurchase: async (userId: string, productId: string, stockItems: string[], totalCost: number, originalTxId?: string): Promise<void> => {
    if (!pgPool) return;
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');
      
      // Update User Balance (Lock users first)
      await client.query('UPDATE users SET balance = balance + $1 WHERE discord_id = $2', [totalCost, userId]);

      // Update Product Stock (Lock products second)
      await client.query(`
        UPDATE products 
        SET stock = array_cat($1::text[], stock) 
        WHERE id = $2
      `, [stockItems, productId]);
      
      // Refund log
      const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      await client.query(`
        INSERT INTO transactions (id, user_id, username, amount, type, description, timestamp)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [txId, userId, 'System', totalCost, 'REFUND', `Pengembalian dana produk gagal DM`, Date.now()]);
      
      // Update delivery status of failed order to prevent recovery loops
      if (originalTxId) {
        await client.query(`
          UPDATE purchased_items 
          SET delivery_status = 'REFUNDED' 
          WHERE transaction_id = $1
        `, [originalTxId]);
      } else {
        await client.query(`
          UPDATE purchased_items 
          SET delivery_status = 'REFUNDED' 
          WHERE user_id = $1 AND delivery_status = 'PENDING_DELIVERY' AND product_name = (SELECT name FROM products WHERE id = $2)
        `, [userId, productId]);
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Refund transaction failed:', err);
    } finally {
      client.release();
    }
  },

  getUsers: async (): Promise<any[]> => {
    if (pgPool) {
      try {
        const res = await pgPool.query('SELECT * FROM users ORDER BY created_at DESC');
        return res.rows.map(row => ({
          discordId: row.discord_id,
          accountName: row.account_name,
          balance: row.balance,
          createdAt: Number(row.created_at)
        }));
      } catch (err) {
        console.error('Postgres error:', err); throw err;
      }
    }
    const data = readLocalFile();
    return data.users || [];
  },

  getUserByDiscordId: async (discordId: string): Promise<any | null> => {
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
  },

  registerUser: async (discordId: string, accountName: string): Promise<void> => {
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
  },

  updateUserBalance: async (discordId: string, amount: number): Promise<void> => {
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
  },

  getTransactions: async (): Promise<any[]> => {
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
  },

  saveTransaction: async (tx: any): Promise<void> => {
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
  },

  markDeliverySuccess: async (transactionId: string): Promise<void> => {
    if (pgPool) {
      try {
        await pgPool.query("UPDATE purchased_items SET delivery_status = 'DELIVERED' WHERE transaction_id = $1", [transactionId]);
      } catch (err) {
        console.error('Postgres error:', err); throw err;
      }
    }
  },

  getPendingDeliveries: async (): Promise<{ transactionId: string; userId: string; productName: string; items: string[] }[]> => {
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
  }
};
