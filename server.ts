import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { Client, GatewayIntentBits, ActivityType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { dbService } from "./src/db/db_service.ts";
import { BotConfig, Product, Order, CustomCommand, ModLog, BotStats } from "./src/types.ts";


const app = express();
const PORT = 3000;

// Prevent unhandled rejections and uncaught exceptions from crashing the process
process.on("unhandledRejection", (reason, promise) => {
  console.error("[Anti-Crash Safeguard] Unhandled Rejection at:", promise, "reason:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("[Anti-Crash Safeguard] Uncaught Exception thrown:", err);
});

app.use(express.json());

// In-Memory bot runtime state
let discordClient: Client | null = null;
let botStatus: "OFFLINE" | "CONNECTING" | "ONLINE" | "ERROR" = "OFFLINE";
let botErrorLog: string | null = null;
let botLatency: number = 0;
let joinedServersCount: number = 0;

// Initialize and login Discord Bot Client from database config
async function initializeDiscordBot() {
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

    // If token is explicitly marked as "NONE", treat it as cleared and do not reconcile with system env values
    if (token === "NONE") {
      console.log("[Discord Bot] Bot Token is empty (explicitly cleared by the user). Awaiting user input inside Configuration Panel.");
      botStatus = "OFFLINE";
      botErrorLog = "Missing Bot Token";
      if (discordClient) {
        console.log("[Discord Bot] Destroying active client instance as token was cleared...");
        try {
          await discordClient.destroy();
        } catch (destroyErr) {
          console.error("[Discord Bot] Destroy error:", destroyErr);
        }
        discordClient = null;
      }
      return;
    }

    // Only fallback to environment variable if the user hasn't configured a token in the DB yet
    if (!token && envToken) {
      console.log("[Discord Bot Audit] Bootstrapping bot token from System Environment Secrets...", envToken);
      token = envToken;
      config.botToken = envToken;
      await dbService.saveConfig(config);
    }

    if (!token) {
      console.log("[Discord Bot] Bot Token is empty. Awaiting user input inside Secrets or Configuration Panel.");
      botStatus = "OFFLINE";
      botErrorLog = "Missing Bot Token";
      if (discordClient) {
        console.log("[Discord Bot] Destroying active client instance as token is empty...");
        try {
          await discordClient.destroy();
        } catch (destroyErr) {
          console.error("[Discord Bot] Destroy error:", destroyErr);
        }
        discordClient = null;
      }
      return;
    }

    // If an existing client is active, clean it up first
    if (discordClient) {
      console.log("[Discord Bot] Destroying previous client instance...");
      try {
        await discordClient.destroy();
      } catch (destroyErr) {
        console.error("[Discord Bot] Destroy error:", destroyErr);
      }
      discordClient = null;
    }

    botStatus = "CONNECTING";
    botErrorLog = null;
    console.log("[Discord Bot] Attempting client login on Discord API Gateway...");

    // Intent fallback options from full privileged to non-privileged safe states
    const intentOptions = [
      {
        name: "Full Intents (Guilds, Messages, Members, Content)",
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.MessageContent,
          GatewayIntentBits.GuildMembers
        ],
        warning: null
      },
      {
        name: "Standard Intents (No Guild Members)",
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.MessageContent
        ],
        warning: "Warning: 'Server Members Intent' dinonaktifkan di Developer Portal. Sinkronisasi nama/anggota dibatasi."
      },
      {
        name: "Basic Intents (No Privileged Intents)",
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages
        ],
        warning: "Peringatan: 'Message Content' & 'Guild Members' dinonaktifkan di Discord Portal. Respons chat dinonaktifkan (Simulasi browser demo tetap berjalan penuh)."
      },
      {
        name: "Minimal Intents (Guilds only)",
        intents: [
          GatewayIntentBits.Guilds
        ],
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
        client = new Client({
          intents: option.intents
        });

        // Attach persistent listener to safely handle and swallow uncaught client errors during initialization and fallback tiers
        client.on("error", (err: any) => {
          console.log(`[Discord Bot Client Option - info] Option #${i + 1} (${option.name}) connection event error:`, err?.message || err);
        });

        const currentClient = client;

        // Wrap login in a promise with timeout to catch disallowed intents or connection timeout quickly
        await new Promise<void>((resolve, reject) => {
          let hasSettled = false;

          const handleReady = () => {
            if (!hasSettled) {
              hasSettled = true;
              resolve();
            }
          };

          const handleError = (err: any) => {
            if (!hasSettled) {
              hasSettled = true;
              reject(err);
            }
          };

          currentClient.once("ready", handleReady);
          currentClient.once("error", handleError);

          currentClient.login(token)
            .then(() => {
              // Wait short moment to confirm ready event fires or user can be fetched
              setTimeout(() => {
                if (!hasSettled) {
                  if (currentClient.user) {
                    hasSettled = true;
                    resolve();
                  } else {
                    // Settle as failure if client logged in but cannot fetch user details
                    hasSettled = true;
                    reject(new Error("Login completed but client user is empty"));
                  }
                }
              }, 1200);
            })
            .catch((loginErr) => {
              if (!hasSettled) {
                hasSettled = true;
                reject(loginErr);
              }
            });

          // Timeout the login tier validation to keep bootstrap latency low
          setTimeout(() => {
            if (!hasSettled) {
              hasSettled = true;
              if (currentClient.user) {
                resolve();
              } else {
                reject(new Error("Login timeout"));
              }
            }
          }, 6000);
        });

        // If we reach here, this login tier succeeded!
        console.log(`[Discord Bot] Successful login using Option #${i + 1}: ${option.name}`);
        activeClient = currentClient;
        fallbackWarning = option.warning;
        success = true;
        break; // Stop iterating through falling backs
      } catch (err: any) {
        // Safe check error messages
        const errMsg = String(err?.message || err || "").toLowerCase();
        const isInvalidToken = errMsg.includes("token") || errMsg.includes("invalid") || errMsg.includes("unauthorized") || errMsg.includes("credential") || errMsg.includes("not provided");

        if (client) {
          try {
            client.destroy();
          } catch (destroyErr) {
            // Safe ignore
          }
        }

        if (isInvalidToken) {
          console.log(`[Discord Bot] Invalid token detected: "${err.message || err}". Aborting fallback options to prevent lag.`);
          throw err; // Fail-fast and throw out of loop
        }

        console.log(`[Discord Bot Info] Opsi Login #${i + 1} (${option.name}) dilewati (Privileged gateway intents belum diaktifkan di portal developer: ${err.message || err}). Beralih otomatis ke opsi cadangan...`);
        // Fallback next
      }
    }

    if (!success || !activeClient) {
      throw new Error("Gagal melakukan login ke Discord dengan opsi kombinasi Intent apa pun. Mohon periksa validitas Token.");
    }

    discordClient = activeClient;
    botStatus = "ONLINE";
    botErrorLog = fallbackWarning;
    joinedServersCount = discordClient.guilds.cache.size;

    // Direct listener hooks
    discordClient.on("ready", async () => {
      if (!discordClient) return;
      console.log(`[Discord Bot] Client ready callback: @${discordClient.user?.tag}`);
      botStatus = "ONLINE";
      joinedServersCount = discordClient.guilds.cache.size;

      const stats = await dbService.getStats();
      await dbService.updateStats({ activeServers: joinedServersCount });

      applyBotPresence(discordClient, config);
    });

    discordClient.on("messageCreate", async (message) => {
      if (message.author.bot) return;

      const content = message.content?.trim() || "";
      if (!content) return; // Ignores empty messages (typical when MessageContent intent is disabled)

      const currentConfig = await dbService.getConfig();
      const prefix = currentConfig.prefix || "!";

      // ---- AUTO MODERATION LAYER ----
      const autoMod = currentConfig.autoMod;
      if (autoMod) {
        let violated = false;
        let violationReason = "";

        // Anti-link check
        if (autoMod.antiLink) {
          const urlRegex = /(https?:\/\/[^\s]+)/gi;
          if (urlRegex.test(content)) {
            violated = true;
            violationReason = "Mengirimkan link/tautan eksternal (Anti-Link Aktif)";
          }
        }

        // Banned words check
        if (autoMod.bannedWords && autoMod.bannedWords.length > 0 && !violated) {
          const lowerContent = content.toLowerCase();
          for (const word of autoMod.bannedWords) {
            if (word && lowerContent.includes(word.toLowerCase())) {
              violated = true;
              violationReason = `Mengirim pesan mengandung kata terlarang: "${word}"`;
              break;
            }
          }
        }

        if (violated) {
          try {
            await message.delete();
            const warnResponse = await message.channel.send(
              `⚠️ **Auto-Moderasi Nexus**: @${message.author.username}, pesan Anda dihapus. Alasan: ${violationReason}.`
            );
            setTimeout(() => { warnResponse.delete().catch(() => {}); }, 6000);

            const generatedLogId = "mod-" + Math.random().toString(36).substring(4);
            const newLog: ModLog = {
              id: generatedLogId,
              userId: message.author.id,
              username: message.author.username,
              action: "DELETE_MESSAGE",
              reason: violationReason,
              timestamp: Date.now()
            };
            await dbService.saveModLog(newLog);

            const stats = await dbService.getStats();
            await dbService.updateStats({ moderationActions: stats.moderationActions + 1 });
          } catch (modErr) {
            console.error("[Discord Bot] Failed executing auto-mod response action:", modErr);
          }
          return;
        }
      }

      // ---- CUSTOM COMMANDS LAYER ----
      if (content.startsWith(prefix)) {
        const cmdTrigger = content.slice(prefix.length).split(" ")[0].toLowerCase();
        const args = content.slice(prefix.length + cmdTrigger.length).trim().split(" ");

        if (cmdTrigger === "claim") {
          const orderId = args[0]?.trim();
          if (!orderId) {
            await message.reply(`❌ **Claim error**: Sila gunakan format \`${prefix}claim <ID_PEMESANAN>\``);
            return;
          }

          try {
            const orders = await dbService.getOrders();
            const foundOrder = orders.find(o => o.id.toLowerCase() === orderId.toLowerCase());

            if (!foundOrder) {
              await message.reply(`❌ **Claim Error**: ID Pemesanan \`${orderId}\` tidak terdaftar atau nihil dalam sistem.`);
              return;
            }

            if (foundOrder.status === "Claimed") {
              await message.reply(`⚠️ **Klaim redundansi**: Pesanan \`${orderId}\` sudah pernah diklaim sebelumnya.\nBarang claim: \`${foundOrder.claimedStockItem || "No Key"}\``);
              return;
            }

            const products = await dbService.getProducts();
            const product = products.find(p => p.id === foundOrder.productId);

            if (!product) {
              await message.reply("❌ **Error**: Produk untuk pemesanan ini sudah dihapus dari inventory admin.");
              return;
            }

            if (!product.stock || product.stock.length === 0) {
              await message.reply("❌ **Stok Kosong**: Mohon Maaf, stok produk ini sementara habis. Silakan infokan ke owner/admin toko.");
              return;
            }

            const claimItem = product.stock[0];
            const remainingStock = product.stock.slice(1);
            
            product.stock = remainingStock;
            await dbService.saveProduct(product);

            foundOrder.status = "Claimed";
            foundOrder.claimedStockItem = claimItem;
            foundOrder.claimedAt = Date.now();
            foundOrder.customerDiscordId = message.author.id;
            foundOrder.customerUsername = message.author.username;
            await dbService.saveOrder(foundOrder);

            try {
              const dmChannel = await message.author.createDM();
              await dmChannel.send(`🎉 **TERIMA KASIH TELAH BERBELANJA DI NEXUS CORESHOP!**\n\n📌 **Detail Pembelian**:\n- **No Order ID**: \`${foundOrder.id}\`\n- **Nama Produk**: **${foundOrder.productName}**\n- **Barang Digital / Lisensi Anda**:\n\`\`\`\n${claimItem}\n\`\`\`\n*Harapan kami Anda menyukai produk kami. Jangan sungkan menghubungi representatif developer kami jika ada kendala.*`);
              await message.reply(`✅ **Claim berhasil!** Berkas digital Anda berhasil dikirim ke personal messages DM Discord @${message.author.username}. Harap periksa Inbox DM Anda!`);
            } catch (dmErr) {
              await message.reply(`✅ **Klaim Sukses!** Berkas digital Anda: \`${claimItem}\` (Harap segera salin, dilarang disebarkan).`);
            }

            const stats = await dbService.getStats();
            await dbService.updateStats({
              totalRevenue: stats.totalRevenue + foundOrder.price,
              totalOrders: stats.totalOrders + 1
            });

          } catch (claimErr: any) {
            console.error("[Discord Bot] Error claiming item:", claimErr);
            await message.reply(`❌ Terjadi kesalahan fatal sewaktu klaim stok: ${claimErr.message}`);
          }
          return;
        }

        if (cmdTrigger === "help") {
          const customCommands = await dbService.getCommands();
          const activeCmds = customCommands.filter((c: any) => c.isActive).map((c: any) => `\`${prefix}${c.name}\``).join(", ");
          
          let helpMsg = `🤖 **Daftar Perintah ${discordClient?.user?.username || "Bot"}**\n\n`;
          helpMsg += `🔹 \`${prefix}claim <ID_PEMESANAN>\` - Mengklaim pesanan produk (jika sudah lunas)\n`;
          helpMsg += `🔹 \`${prefix}stock\` - Menampilkan Live Stock produk\n`;
          helpMsg += `🔹 \`${prefix}help\` - Menampilkan daftar pesan bantuan ini\n`;
          
          if (activeCmds) {
            helpMsg += `\n**✨ Perintah Tambahan Server:**\n${activeCmds}`;
          }
          
          try {
            await message.reply(helpMsg);
          } catch(e) {}
          return;
        }

        if (cmdTrigger === "stock" || cmdTrigger === "livestock") {
          try {
            const products = await dbService.getProducts();
            
            let description = `Last Update: <t:${Math.floor(Date.now() / 1000)}:R>\n------------------------------------------------\n`;
            
            if (products.length === 0) {
              description += "*Belum ada produk yang dijual saat ini.*";
            } else {
              products.forEach(p => {
                const stockAmt = p.stock && Array.isArray(p.stock) ? p.stock.length : 0;
                description += `👑 **${p.name}** 👑\n\n`;
                description += `• ${p.name} #📦|${(p.category || 'PRODUK').toUpperCase().replace(/\\s+/g, '-')}\n`;
                description += `➡ Code : **${p.id}**\n`;
                description += `➡ Stock : ${stockAmt > 0 ? stockAmt + ' 🟩' : '🟥'}\n`;
                description += `➡ Price : ${p.price.toLocaleString('id-ID')} 🔏\n`;
                description += `------------------------------------------------\n`;
              });
            }

            const stockEmbed = new EmbedBuilder()
              .setTitle('🎇 PRODUCT LIST 🎇')
              .setDescription(description)
              .setColor('#00ffff'); // cyan/aqua

            const row1 = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId('buy_btn')
                .setLabel('Buy')
                .setEmoji('🛒')
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId('growid_btn')
                .setLabel('Set GrowID')
                .setEmoji('📖')
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId('qris_btn')
                .setLabel('QRIS Deposit')
                .setEmoji('🪪')
                .setStyle(ButtonStyle.Secondary)
            );
            
            const row2 = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId('balance_btn')
                .setLabel('Balance')
                .setEmoji('💳')
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId('depo_world_btn')
                .setLabel('Deposit World')
                .setEmoji('🌍')
                .setStyle(ButtonStyle.Secondary)
            );

            await message.reply({ embeds: [stockEmbed], components: [row1 as any, row2 as any] });
          } catch(e: any) {
            console.error("[Discord Bot] Live stock error:", e);
            await message.reply("❌ Gagal memuat Live Stock: " + e.message);
          }
          return;
        }

        const customCommands = await dbService.getCommands();
        const matchedCmd = customCommands.find(c => c.name.toLowerCase() === cmdTrigger && c.isActive);

        if (matchedCmd) {
          try {
            await message.reply(matchedCmd.response);
            matchedCmd.usageCount += 1;
            await dbService.saveCommand(matchedCmd);

            const stats = await dbService.getStats();
            await dbService.updateStats({ commandsRun: stats.commandsRun + 1 });
          } catch (cmdErr) {
            console.error("[Discord Bot] Failed responding to custom commands trigger:", cmdErr);
          }
        }
      }
    });

    discordClient.on("interactionCreate", async (interaction) => {
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

    discordClient.on("error", (err) => {
      console.error("[Discord Bot] Client Error Event:", err);
      botStatus = "ERROR";
      botErrorLog = err.message;
    });

    // Run presence synchronization
    applyBotPresence(discordClient, config);

  } catch (err: any) {
    console.log("[Discord Bot Info] Bot client is in connection-alert state (waiting for a valid token):", err?.message || err);
    botStatus = "ERROR";
    botErrorLog = err.message ? err.message : (typeof err === "string" ? err : "Invalid Bot Token credentials.");
    discordClient = null;
  }
}

// Map Activity Type String helper
function applyBotPresence(client: Client, config: BotConfig) {
  if (!client.user) return;
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

// -------------------------------------------------------------
// REST API BACKEND PORTAL (Eliminated Firebase entirely!)
// -------------------------------------------------------------

// 1. Products CRUD API Portals
app.get("/api/products", async (req, res) => {
  try {
    const products = await dbService.getProducts();
    res.json(products);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/products", async (req, res) => {
  try {
    const freshProduct: Product = req.body;
    await dbService.saveProduct(freshProduct);
    
    // Recalculate stats total products count
    const productsList = await dbService.getProducts();
    await dbService.updateStats({ totalProducts: productsList.length });

    res.json({ success: true, product: freshProduct });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await dbService.deleteProduct(id);

    // Recalculate stats total products count
    const productsList = await dbService.getProducts();
    await dbService.updateStats({ totalProducts: productsList.length });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Custom Commands CRUD API Portals
app.get("/api/commands", async (req, res) => {
  try {
    const commands = await dbService.getCommands();
    res.json(commands);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/commands", async (req, res) => {
  try {
    const cmd: CustomCommand = req.body;
    await dbService.saveCommand(cmd);
    res.json({ success: true, command: cmd });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/commands/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await dbService.deleteCommand(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Configuration API Portals (saving, loading, hot testing)
app.get("/api/config", async (req, res) => {
  try {
    const config = await dbService.getConfig();
    res.json(config);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/config", async (req, res) => {
  try {
    const incoming: BotConfig = req.body;
    
    // Explicitly flag empty or cleared tokens as 'NONE' to denote intentional deletion
    if (incoming.botToken === undefined || incoming.botToken === null || incoming.botToken.trim() === "") {
      incoming.botToken = "NONE";
    }
    
    // Check if token changed to trigger hot reinitialization
    const currentConfig = await dbService.getConfig();
    const tokenChanged = (currentConfig.botToken || "").trim() !== (incoming.botToken || "").trim();

    await dbService.saveConfig(incoming);

    // Hot apply presence if bot client is active and token didn't change
    if (discordClient && botStatus === "ONLINE" && !tokenChanged) {
      applyBotPresence(discordClient, incoming);
    } else if (tokenChanged) {
      console.log("[Discord Bot] Bot token was updated. Re-initializing Discord Bot Client...");
      // Re-initialize bot client asynchronously so it doesn't block response
      initializeDiscordBot().catch(err => {
        console.log("[Discord Bot] Async reload notification:", err?.message || err);
      });
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Statistics API Portals
app.get("/api/stats", async (req, res) => {
  try {
    const stats = await dbService.getStats();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/stats", async (req, res) => {
  try {
    const changes: Partial<BotStats> = req.body;
    await dbService.updateStats(changes);
    const updated = await dbService.getStats();
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Orders API Portals
app.get("/api/orders", async (req, res) => {
  try {
    const orders = await dbService.getOrders();
    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/orders", async (req, res) => {
  try {
    const orderItem: Order = req.body;
    await dbService.saveOrder(orderItem);
    res.json({ success: true, order: orderItem });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Moderation Logs Portal
app.get("/api/mod_logs", async (req, res) => {
  try {
    const logs = await dbService.getModLogs();
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/mod_logs", async (req, res) => {
  try {
    const logItem: ModLog = req.body;
    await dbService.saveModLog(logItem);
    res.json({ success: true, log: logItem });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Bot Connection Control endpoints (Status query, manual restart trigger!)
app.get("/api/bot/status", async (req, res) => {
  // Compute direct dynamic heartbeats
  const ping = discordClient?.ws.ping || 0;
  
  res.json({
    status: botStatus,
    dbEngine: dbService.getEngine(),
    error: botErrorLog,
    ping: ping,
    guildsCount: joinedServersCount,
    botUser: discordClient?.user ? {
      tag: discordClient.user.tag,
      id: discordClient.user.id,
      avatar: discordClient.user.displayAvatarURL()
    } : null
  });
});

app.post("/api/bot/restart", async (req, res) => {
  console.log("[Discord Bot Restart Request received via Dashboard admin]");
  try {
    await initializeDiscordBot();
    const ping = discordClient?.ws.ping || 0;
    
    res.json({
      success: true,
      status: botStatus,
      guildsCount: joinedServersCount,
      ping: ping,
      error: botErrorLog
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Discord Webhook simulation (Proxies outbound requests to Discord Webhooks to bypass CORS)
app.post("/api/webhook/simulate", async (req, res) => {
  const { webhookUrl, payload } = req.body;
  if (!webhookUrl) {
    return res.status(400).json({ error: "Webhook URL is required" });
  }

  try {
    const discordPayload = {
      username: "NEXUS CORESHOP LOGGER",
      avatar_url: "https://images.unsplash.com/photo-1614680376593-902f74fa0d41?w=100&auto=format&fit=crop&q=60",
      embeds: [
        {
          title: "🔔 TRANSAKSI TOKO BARU SELESAI!",
          description: `Sistem otomatis berhasil mencatatkan transaksi terverifikasi.`,
          color: 3066993,
          fields: [
            {
              name: "🛒 ID Pemesanan (Order ID)",
              value: `\`${payload.orderId || "ORD-TESTPAYMENT"}\``,
              inline: true
            },
            {
              name: "👤 Akun Pembeli",
              value: `@${payload.customerUsername || "StoreTester_NPC"}`,
              inline: true
            },
            {
              name: "📦 Produk Digital",
              value: payload.productName || "Discord Nitro Premium [TEST]",
              inline: false
            },
            {
              name: "💰 Jumlah Nilai Pembayaran",
              value: `Rp ${(payload.price || 0).toLocaleString("id-ID")}`,
              inline: true
            },
            {
              name: "🚀 Status Penyerahan",
              value: "✅ INSTANTLY ON-QUEUE / READY TO CLAIM",
              inline: true
            }
          ],
          footer: {
            text: "Nexus Auto-Store Log Generator Service"
          },
          timestamp: new Date().toISOString()
        }
      ]
    };

    console.log("Dispatching Discord Webhook simulation to URL:", webhookUrl);
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(discordPayload)
    });

    if (response.ok) {
      return res.json({ success: true, message: "Payload successfully dispatched." });
    } else {
      const errorText = await response.text();
      return res.status(502).json({ error: `Discord rejected webhook call: ${errorText}` });
    }
  } catch (err: any) {
    console.error("Error dispatching discord webhook:", err);
    return res.json({ success: true, simulated: true, error: err.message });
  }
});

// Health endpoint checks
app.post("/api/reset-db", async (req, res) => {
  try {
    const { mode } = req.body; // 'clear' or 'restore'
    await dbService.clearAllData(mode || 'clear');
    res.json({ 
      success: true, 
      message: mode === 'restore' 
        ? "Seluruh data demo/mock default berhasil dimuat ulang ke database!" 
        : "Seluruh data berhasil dihapus dan dikosongkan!" 
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "alive", timestamp: Date.now() });
});

// Vite integration middleware for development OR asset delivery on production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite Middleware.");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode.");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express and Vite Server running on http://localhost:${PORT}`);
    
    // Auto initiate bot on startup!
    initializeDiscordBot().catch((e) => {
      console.log("[Discord Bot Info] Handled auto-start trigger on boot. Awaiting token configuration details...", e?.message || e);
    });
  });
}

startServer().catch((err) => {
  console.error("Fatal boot failure inside custom Express server: ", err);
});
