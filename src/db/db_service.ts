import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { Product, Order, CustomCommand, BotConfig, ModLog, BotStats } from '../types.ts';

// Dynamic Database Credentials from Environment
const DATABASE_URL = process.env.DATABASE_URL || process.env.SQL_CONN_STRING;
const SQL_HOST = process.env.SQL_HOST;
const SQL_DB_NAME = process.env.SQL_DB_NAME;
const SQL_USER = process.env.SQL_USER;
const SQL_PASSWORD = process.env.SQL_PASSWORD;

let pgPool: Pool | null = null;
let dbType: 'PostgreSQL' | 'Local JSON File' = 'Local JSON File';

// Initialize Postgres Pool if credentials or connection URL exists
if (DATABASE_URL || (SQL_HOST && SQL_DB_NAME && SQL_USER)) {
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
        host: SQL_HOST,
        database: SQL_DB_NAME,
        user: SQL_USER,
        password: SQL_PASSWORD,
        port: 5432,
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

// Local JSON file path for fallback persistence
const LOCAL_DB_PATH = path.join(process.cwd(), 'src', 'db', 'local_db.json');

// Ensure parent folder exists
const dbDir = path.dirname(LOCAL_DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
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
async function bootstrapTables() {
  if (dbType === 'PostgreSQL' && pgPool) {
    try {
      const client = await pgPool.connect();
      try {
        console.log('[PostgreSQL] Creating tables if not exist...');
        await client.query(`
          CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
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
            anti_link BOOLEAN NOT NULL,
            anti_spam BOOLEAN NOT NULL,
            warn_limit INTEGER NOT NULL,
            banned_words TEXT[],
            bot_token TEXT
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
        `);
        console.log('[PostgreSQL] Tables checked/created successfully.');

        // Dynamic migration queries to ensure newly added columns exist in legacy PostgreSQL tables.
        console.log('[PostgreSQL] Running incremental migrations...');
        await client.query(`
          ALTER TABLE bot_config ADD COLUMN IF NOT EXISTS bot_token TEXT;
        `);
        console.log('[PostgreSQL] Incremental migrations completed successfully.');

        // Seed Default Bot Settings if empty
        const configCheck = await client.query(`SELECT COUNT(*) FROM bot_config`);
        if (parseInt(configCheck.rows[0].count) === 0) {
          console.log('[PostgreSQL] Seeding default bot credentials...');
          await client.query({
            text: `INSERT INTO bot_config (id, prefix, status_text, status_type, webhook_url, auto_claim_on_payment, greeting_message, anti_link, anti_spam, warn_limit, banned_words, bot_token) 
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            values: [
              'bot_settings',
              defaultConfig.prefix,
              defaultConfig.statusText,
              defaultConfig.statusType,
              defaultConfig.webhookUrl,
              defaultConfig.autoClaimOnPayment,
              defaultConfig.greetingMessage,
              defaultConfig.autoMod.antiLink,
              defaultConfig.autoMod.antiSpam,
              defaultConfig.autoMod.warnLimit,
              defaultConfig.autoMod.bannedWords,
              defaultConfig.botToken || ''
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

  // Ensure file exists for Local storage
  if (!fs.existsSync(LOCAL_DB_PATH)) {
    console.log('[Local File DB] Database file empty/absent. Creating new seed database.');
    const initialData = {
      config: defaultConfig,
      stats: defaultStats,
      products: defaultProducts,
      commands: defaultCommands,
      orders: defaultOrders,
      modLogs: defaultModLogs
    };
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(initialData, null, 2), 'utf-8');
  }
}

// Perform instant setup on import
bootstrapTables().catch(err => {
  console.error('[DB Service] Error bootstrapping databases:', err);
});

// JSON File Local Methods
function readLocalFile(): any {
  try {
    if (fs.existsSync(LOCAL_DB_PATH)) {
      const txt = fs.readFileSync(LOCAL_DB_PATH, 'utf-8');
      return JSON.parse(txt);
    }
  } catch (err) {
    console.error('Failed reading local database JSON disk:', err);
  }
  return {
    config: defaultConfig,
    stats: defaultStats,
    products: defaultProducts,
    commands: defaultCommands,
    orders: defaultOrders,
    modLogs: defaultModLogs
  };
}

function writeLocalFile(data: any) {
  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed writing local database JSON disk:', err);
  }
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
        console.error('Postgres products load failed, returning disk fallback:', err);
      }
    }
    return readLocalFile().products;
  },

  saveProduct: async (prod: Product): Promise<void> => {
    if (pgPool) {
      try {
        await pgPool.query({
          text: `INSERT INTO products (id, name, price, description, type, stock, category, image_url, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                 ON CONFLICT (id) DO UPDATE SET
                   name = $2, price = $3, description = $4, type = $5, stock = $6, category = $7, image_url = $8`,
          values: [prod.id, prod.name, prod.price, prod.description, prod.type, prod.stock, prod.category, prod.imageUrl || '', prod.createdAt]
        });
        return;
      } catch (err) {
        console.error('Postgres saveProduct failed:', err);
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
        console.error('Postgres deleteProduct failed:', err);
      }
    }
    const data = readLocalFile();
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
        console.error('Postgres commands load failed:', err);
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
        console.error('Postgres saveCommand failed:', err);
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
        console.error('Postgres deleteCommand failed:', err);
      }
    }
    const data = readLocalFile();
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
            autoMod: {
              antiLink: !!row.anti_link,
              antiSpam: !!row.anti_spam,
              warnLimit: row.warn_limit,
              bannedWords: row.banned_words || []
            },
            botToken: row.bot_token || ''
          };
        }
      } catch (err) {
        console.error('Postgres getConfig load failed:', err);
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
          text: `INSERT INTO bot_config (id, prefix, status_text, status_type, webhook_url, auto_claim_on_payment, greeting_message, anti_link, anti_spam, warn_limit, banned_words, bot_token)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                 ON CONFLICT (id) DO UPDATE SET
                   prefix = $2, status_text = $3, status_type = $4, webhook_url = $5, auto_claim_on_payment = $6,
                   greeting_message = $7, anti_link = $8, anti_spam = $9, warn_limit = $10, banned_words = $11, bot_token = $12`,
          values: [
            'bot_settings',
            config.prefix,
            config.statusText || '',
            config.statusType || 'WATCHING',
            config.webhookUrl || '',
            config.autoClaimOnPayment || false,
            config.greetingMessage || '',
            config.autoMod.antiLink,
            config.autoMod.antiSpam,
            config.autoMod.warnLimit,
            config.autoMod.bannedWords,
            config.botToken || ''
          ]
        });
        return;
      } catch (err) {
        console.error('Postgres saveConfig failed:', err);
      }
    }
    const data = readLocalFile();
    data.config = config;
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
        console.error('Postgres getStats failed:', err);
      }
    }
    return readLocalFile().stats;
  },

  updateStats: async (fields: Partial<BotStats>): Promise<void> => {
    if (pgPool) {
      try {
        // Construct custom dynamic increment set statements
        const keys = Object.keys(fields);
        if (keys.length > 0) {
          const assignments = keys.map((k) => {
            const dbCol = k.replace(/([A-Z])/g, '_$1').toLowerCase();
            return `${dbCol} = ${(fields as any)[k]}`; // Numeric values updated
          }).join(', ');
          
          await pgPool.query(`UPDATE bot_stats SET ${assignments} WHERE id = 'core_stats'`);
          return;
        }
      } catch (err) {
        console.error('Postgres updateStats failed:', err);
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
        console.error('Postgres getOrders failed:', err);
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
        console.error('Postgres saveOrder failed:', err);
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
        console.error('Postgres getModLogs failed:', err);
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
        console.error('Postgres saveModLog failed:', err);
      }
    }
    const data = readLocalFile();
    data.modLogs.unshift(log);
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
        console.error('Postgres clearAllData failed:', err);
      }
    }
    const data = readLocalFile();
    if (mode === 'clear') {
      data.products = [];
      data.orders = [];
      data.commands = [];
      data.modLogs = [];
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
      data.stats = { ...defaultStats };
    }
    writeLocalFile(data);
  }
};
