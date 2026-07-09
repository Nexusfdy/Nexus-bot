import { pgPool, dbType } from '../core.js';
import { Product, Order, CustomCommand, BotConfig, ModLog, BotStats } from '../../types.js';

export const getConfig = async (): Promise<BotConfig> => {
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
            uiConfig: row.ui_config ? (typeof row.ui_config === 'string' ? JSON.parse(row.ui_config) : row.ui_config) : undefined,
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
  };

export const saveConfig = async (config: BotConfig): Promise<void> => {
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
  };

export const updateUIConfig = async (uiConfig: any): Promise<void> => {
    if (pgPool) {
      await pgPool.query(
        "UPDATE bot_config SET ui_config = $1 WHERE id = 'bot_settings'",
        [JSON.stringify(uiConfig)]
      );
    }
  };

export const updateGeneralConfig = async (prefix: string, statusText: string, statusType: string): Promise<void> => {
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
  };

export const updateDiscordConfig = async (botToken: string): Promise<void> => {
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
  };

export const updateLiveStockConfig = async (guildId: string, liveStockChannel: string): Promise<void> => {
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
  };

export const updateLiveStockMessageId = async (liveStockMessageId: string): Promise<void> => {
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
  };

export const updateSaweriaConfig = async (depositWebhookChannelId: string): Promise<void> => {
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
  };

export const updateSecurityConfig = async (antiLink: boolean, antiSpam: boolean, warnLimit: number, bannedWords: string[]): Promise<void> => {
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
  };

export const updateFeaturesConfig = async (webhookUrl: string, autoClaimOnPayment: boolean, greetingMessage: string): Promise<void> => {
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
  };

export const updateServerConfig = async (guildId: string, ownerId: string, serverManagement: any): Promise<void> => {
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
  };