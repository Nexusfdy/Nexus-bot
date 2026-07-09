import { Pool } from 'pg';
import { BotConfig, BotStats } from '../types.js';

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

const defaultProducts = [];
const defaultOrders = [];
const defaultCommands = [];
const defaultModLogs = [];

// Dynamic Database Credentials from Environment
const DATABASE_URL = process.env.DATABASE_URL;
const POSTGRES_HOST = process.env.POSTGRES_HOST || process.env.SQL_HOST;
const POSTGRES_PORT = process.env.POSTGRES_PORT ? parseInt(process.env.POSTGRES_PORT, 10) : 5432;
const POSTGRES_USER = process.env.POSTGRES_USER || process.env.SQL_USER;
const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD || process.env.SQL_PASSWORD;
const POSTGRES_DATABASE = process.env.POSTGRES_DATABASE || process.env.POSTGRES_DB || process.env.SQL_DB_NAME;

export let pgPool: Pool | null = null;
export let dbType: 'PostgreSQL' | 'Local JSON File' = 'Local JSON File';

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
    dbType = 'Local JSON File';
  }
} else {
  console.log('PostgreSQL environment variables missing. Operating in Local JSON File mode.');
  dbType = 'Local JSON File';
}

export async function bootstrapTables() {
  if (!pgPool) {
    return;
  }
  try {
    const client = await pgPool.connect();
    try {
      console.log('[PostgreSQL] Checking and establishing database schema...');
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
          created_at BIGINT NOT NULL,
          is_unlimited BOOLEAN DEFAULT FALSE,
          file_path TEXT
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
          transaction_id TEXT,
          created_at BIGINT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS custom_commands (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          response TEXT NOT NULL,
          description TEXT,
          usage_count INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT TRUE
        );
        CREATE TABLE IF NOT EXISTS bot_config (
          id TEXT PRIMARY KEY,
          prefix TEXT NOT NULL,
          status_text TEXT NOT NULL,
          status_type TEXT NOT NULL,
          webhook_url TEXT,
          auto_claim_on_payment BOOLEAN DEFAULT TRUE,
          greeting_message TEXT,
          live_stock_channel TEXT,
          live_stock_message_id TEXT,
          anti_link BOOLEAN DEFAULT TRUE,
          anti_spam BOOLEAN DEFAULT TRUE,
          warn_limit INTEGER DEFAULT 3,
          banned_words JSONB,
          bot_token TEXT,
          owner_id TEXT,
          server_management JSONB,
          saweria_webhook_channel_id TEXT,
          deposit_webhook_channel_id TEXT,
          guild_id TEXT,
          ui_config JSONB
        );
        CREATE TABLE IF NOT EXISTS mod_logs (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          username TEXT NOT NULL,
          action TEXT NOT NULL,
          reason TEXT,
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
        CREATE TABLE IF NOT EXISTS admin_auth (
          id TEXT PRIMARY KEY,
          password_hash TEXT,
          reset_token TEXT,
          reset_token_expiry BIGINT
        );
      `);

      console.log('[PostgreSQL] Tables checked/created successfully.');
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
        ALTER TABLE products ADD COLUMN IF NOT EXISTS is_unlimited BOOLEAN DEFAULT FALSE;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS file_path TEXT;
        ALTER TABLE bot_config ADD COLUMN IF NOT EXISTS ui_config JSONB;
      `);

      console.log('[PostgreSQL] Incremental migrations completed successfully.');

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
            JSON.stringify(defaultConfig.autoMod.bannedWords),
            defaultConfig.botToken || '',
            defaultConfig.ownerId || '',
            defaultConfig.serverManagement ? JSON.stringify(defaultConfig.serverManagement) : null
          ]
        });
      }

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

    } finally {
      client.release();
    }
  } catch (e) {
    console.error('[PostgreSQL] Failed to execute setup query. Pivoting to Local File Storage.', e);
    dbType = 'Local JSON File';
    pgPool = null;
  }
}

// Perform instant setup on import
bootstrapTables().catch(err => {
  console.error('[DB Service] Error bootstrapping databases:', err);
});
