import { Client, GatewayIntentBits, ActivityType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { dbService } from "../src/db/db_service.ts";
import { BotConfig, Product, Order, CustomCommand, ModLog, BotStats } from "../src/types.ts";
import { discordState } from "./discordState.ts";
import { handleMessageCreate } from "./botFeatures/messageHandler.ts";

export async function initializeDiscordBot() {
  try {
    const config = await dbService.getConfig();
    
    // Check if there is an environment variable source override from AI Studio Secret settings
    const envToken = (
      process.env.DISCORD_TOKEN || 
      process.env.BOT_TOKEN || 
      process.env.DISCORD_BOT_TOKEN || 
      process.env.TOKEN
    )?.trim();

    let token = config.botToken?.trim();

    if (token === "NONE") {
      console.log("[Discord Bot] Bot Token is empty (explicitly cleared by the user). Awaiting user input inside Configuration Panel.");
      discordState.botStatus = "OFFLINE";
      discordState.botErrorLog = "Missing Bot Token";
      if (discordState.client) {
        console.log("[Discord Bot] Destroying active client instance as token was cleared...");
        try {
          await discordState.client.destroy();
        } catch (destroyErr) {
          console.error("[Discord Bot] Destroy error:", destroyErr);
        }
        discordState.client = null;
      }
      return;
    }

    if (!token && envToken) {
      console.log("[Discord Bot Audit] Bootstrapping bot token from System Environment Secrets...", envToken);
      token = envToken;
      config.botToken = envToken;
      await dbService.saveConfig(config);
    }

    if (!token) {
      console.log("[Discord Bot] Bot Token is empty. Awaiting user input inside Secrets or Configuration Panel.");
      discordState.botStatus = "OFFLINE";
      discordState.botErrorLog = "Missing Bot Token";
      if (discordState.client) {
        console.log("[Discord Bot] Destroying active client instance as token is empty...");
        try {
          await discordState.client.destroy();
        } catch (destroyErr) {
          console.error("[Discord Bot] Destroy error:", destroyErr);
        }
        discordState.client = null;
      }
      return;
    }

    if (discordState.client) {
      console.log("[Discord Bot] Destroying previous client instance...");
      try {
        await discordState.client.destroy();
      } catch (destroyErr) {
        console.error("[Discord Bot] Destroy error:", destroyErr);
      }
      discordState.client = null;
    }

    discordState.botStatus = "CONNECTING";
    discordState.botErrorLog = null;
    console.log("[Discord Bot] Attempting client login on Discord API Gateway...");

    const intentOptions = [
      {
        name: "Full Intents (Guilds, Messages, Members, Content)",
        intents: [ GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers ],
        warning: null
      },
      {
        name: "Standard Intents (No Guild Members)",
        intents: [ GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent ],
        warning: "Warning: 'Server Members Intent' dinonaktifkan di Developer Portal. Sinkronisasi nama/anggota dibatasi."
      },
      {
        name: "Basic Intents (No Privileged Intents)",
        intents: [ GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages ],
        warning: "Peringatan: 'Message Content' & 'Guild Members' dinonaktifkan di Discord Portal. Respons chat dinonaktifkan (Simulasi browser demo tetap berjalan penuh)."
      },
      {
        name: "Minimal Intents (Guilds only)",
        intents: [ GatewayIntentBits.Guilds ],
        warning: "Peringatan: Bot berjalan dalam mode minimal (Guilds saja). Aktifkan 'Privileged Gateway Intents' di Discord Dev Portal untuk fitur penuh."
      }
    ];

    let success = false;
    let fallbackWarning: string | null = null;
    let activeClient: Client | null = null;

    for (let i = 0; i < intentOptions.length; i++) {
        const option = intentOptions[i];
        console.log(`[Discord Bot] Trying login option ${i + 1}/${intentOptions.length}: ${option.name}...`);
        
        let client: Client | null = null;
        try {
          client = new Client({ intents: option.intents });
  
          client.on("error", (err: any) => {
            console.log(`[Discord Bot Client Option - info] Option #${i + 1} (${option.name}) connection event error:`, err?.message || err);
          });
  
          const currentClient = client;
  
          await new Promise<void>((resolve, reject) => {
            let hasSettled = false;
            const handleReady = () => { if (!hasSettled) { hasSettled = true; resolve(); } };
            const handleError = (err: any) => { if (!hasSettled) { hasSettled = true; reject(err); } };
  
            currentClient.once("ready", handleReady);
            currentClient.once("error", handleError);
  
            currentClient.login(token).then(() => {
                setTimeout(() => {
                  if (!hasSettled) {
                    if (currentClient.user) {
                      hasSettled = true; resolve();
                    } else {
                      hasSettled = true; reject(new Error("Login completed but client user is empty"));
                    }
                  }
                }, 1200);
              }).catch((loginErr) => {
                if (!hasSettled) { hasSettled = true; reject(loginErr); }
              });
  
            setTimeout(() => {
              if (!hasSettled) {
                hasSettled = true;
                if (currentClient.user) { resolve(); } else { reject(new Error("Login timeout")); }
              }
            }, 6000);
          });
  
          console.log(`[Discord Bot] Successful login using Option #${i + 1}: ${option.name}`);
          activeClient = currentClient;
          fallbackWarning = option.warning;
          success = true;
          break; 
        } catch (err: any) {
          const errMsg = String(err?.message || err || "").toLowerCase();
          const isInvalidToken = errMsg.includes("token") || errMsg.includes("invalid") || errMsg.includes("unauthorized") || errMsg.includes("credential") || errMsg.includes("not provided");
  
          if (client) { try { client.destroy(); } catch (e) { } }
  
          if (isInvalidToken) {
            console.log(`[Discord Bot] Invalid token detected. Aborting fallback options.`);
            throw err; 
          }
        }
      }
  
      if (!success || !activeClient) {
        throw new Error("Gagal melakukan login ke Discord dengan opsi kombinasi Intent apa pun. Mohon periksa validitas Token.");
      }
  
      discordState.client = activeClient;
      discordState.botStatus = "ONLINE";
      discordState.botErrorLog = fallbackWarning;
      discordState.joinedServersCount = discordState.client.guilds.cache.size;
  
      discordState.client.on("ready", async () => {
        if (!discordState.client) return;
        console.log(`[Discord Bot] Client ready callback: @${discordState.client.user?.tag}`);
        discordState.botStatus = "ONLINE";
        discordState.joinedServersCount = discordState.client.guilds.cache.size;
  
        await dbService.updateStats({ activeServers: discordState.joinedServersCount });
        applyBotPresence(discordState.client, config);
      });
  
      discordState.client.on("messageCreate", handleMessageCreate);
      
      discordState.client.on("interactionCreate", async (interaction) => {
        if (!interaction.isButton()) return;
        try {
          await interaction.reply({ 
            content: '🛠️ Fitur ini masih di tahap integrasi. Untuk fitur lengkap silahkan gunakan portal.',
            ephemeral: true 
          });
        } catch (e) {
          console.error(e);
        }
      });
  
      discordState.client.on("error", (err) => {
        console.error("[Discord Bot] Client Error Event:", err);
        discordState.botStatus = "ERROR";
        discordState.botErrorLog = err.message;
      });
  
      applyBotPresence(discordState.client, config);
  
    } catch (err: any) {
      console.log("[Discord Bot Info] Bot client is in connection-alert state:", err?.message || err);
      discordState.botStatus = "ERROR";
      discordState.botErrorLog = err.message ? err.message : (typeof err === "string" ? err : "Invalid Bot Token credentials.");
      discordState.client = null;
    }
  }

export function applyBotPresence(client: Client, config: BotConfig) {
    if (!client || !client.user) return;
    try {
      let actType = ActivityType.Watching;
      if (config.statusType === "PLAYING") actType = ActivityType.Playing;
      if (config.statusType === "STREAMING") actType = ActivityType.Streaming;
      if (config.statusType === "LISTENING") actType = ActivityType.Listening;
      if (config.statusType === "WATCHING") actType = ActivityType.Watching;
  
      client.user.setPresence({
        activities: [{ name: config.statusText || "Auto-Store Online", type: actType }],
        status: "online"
      });
      console.log(`[Discord Bot] Set presence activity: ${config.statusType} "${config.statusText}"`);
    } catch (err) {
      console.error("[Discord Bot] Fails setting client bot presence status:", err);
    }
}
