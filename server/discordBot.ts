import { Client, GatewayIntentBits, ActivityType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, AttachmentBuilder, TextChannel, Options } from "discord.js";
import { dbService } from "../src/db/db_service.ts";
import { BotConfig, Product, Order, CustomCommand, ModLog, BotStats } from "../src/types.ts";
import { discordState, saveServerState } from "./discordState.ts";
import { handleMessageCreate, cleanupMessageHandlerTimeouts } from "./botFeatures/messageHandler.ts";
import { initLiveStockTimer, stopLiveStockTimer, updateLiveStock } from "./botFeatures/liveStock.ts";
import { runDeliveryRecovery } from "./botFeatures/deliveryRecovery.ts";

const activePurchases = new Map<string, number>();
const purchaseCooldowns = new Map<string, number>();
const COOLDOWN_MS = 5000; // 5 seconds
let cooldownCleanupInterval: NodeJS.Timeout | null = null;

export async function stopDiscordBot() {
  if (discordState.client) {
    stopLiveStockTimer();
    cleanupMessageHandlerTimeouts();
    discordState.client.destroy();
    discordState.client = null;
    discordState.botStatus = "OFFLINE";
    discordState.joinedServersCount = 0;
    saveServerState();
    console.log("[Discord Bot] Bot stopped manually.");
  }
  if (cooldownCleanupInterval) {
    clearInterval(cooldownCleanupInterval);
    cooldownCleanupInterval = null;
  }
}

export async function initializeDiscordBot() {
  try {
    const config = await dbService.getConfig();
    
    // Setup periodic cleanup to prevent memory leaks from Maps/Sets
    if (cooldownCleanupInterval) clearInterval(cooldownCleanupInterval);
    cooldownCleanupInterval = setInterval(() => {
        const now = Date.now();
        for (const [userId, timestamp] of purchaseCooldowns.entries()) {
            if (now - timestamp > COOLDOWN_MS * 2) {
                purchaseCooldowns.delete(userId);
            }
        }
        for (const [userId, timestamp] of activePurchases.entries()) {
            if (now - timestamp > 5 * 60000) { // 5 mins
                activePurchases.delete(userId);
            }
        }
    }, 60000); // Clean up every 1 minute

    
    let token = config.botToken?.trim();

    if (token === "NONE") {
      console.log("[Discord Bot] Bot Token is empty (explicitly cleared by the user). Awaiting user input inside Configuration Panel.");
      discordState.botStatus = "OFFLINE";
      discordState.botErrorLog = "Missing Bot Token";
      if (discordState.client) {
        console.log("[Discord Bot] Destroying active client instance as token was cleared...");
        try {
          await discordState.client.destroy();
          stopLiveStockTimer();
        } catch (destroyErr) {
          console.error("[Discord Bot] Destroy error:", destroyErr);
        }
        discordState.client = null;
      }
      return;
    }

    if (!token) {
      console.log("[Discord Bot] Bot Token is empty. Awaiting user input inside Configuration Panel.");
      discordState.botStatus = "OFFLINE";
      discordState.botErrorLog = "Missing Bot Token";
      if (discordState.client) {
        console.log("[Discord Bot] Destroying active client instance as token is empty...");
        try {
          await discordState.client.destroy();
          stopLiveStockTimer();
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
        stopLiveStockTimer();
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
          client = new Client({ 
            intents: option.intents,
            makeCache: Options.cacheWithLimits({
              MessageManager: 50, // Keep last 50 messages per channel
              PresenceManager: 0, // We don't use presences
              ThreadManager: 0, // We don't use threads
              GuildMemberManager: 200, // Limit members cache
              UserManager: 200, // Limit user cache
            })
          });
  
          client.on("error", (err: any) => {
            console.log(`[Discord Bot Client Option - info] Option #${i + 1} (${option.name}) connection event error:`, err?.message || err);
          });
  
          const currentClient = client;
  
          await new Promise<void>((resolve, reject) => {
            let hasSettled = false;
            let loginTimer1: NodeJS.Timeout;
            let loginTimer2: NodeJS.Timeout;

            const cleanup = () => {
              if (loginTimer1) clearTimeout(loginTimer1);
              if (loginTimer2) clearTimeout(loginTimer2);
            };

            const handleReady = () => { if (!hasSettled) { hasSettled = true; cleanup(); resolve(); } };
            const handleError = (err: any) => { if (!hasSettled) { hasSettled = true; cleanup(); reject(err); } };
  
            currentClient.once("ready", handleReady);
            currentClient.once("error", handleError);
  
            currentClient.login(token).then(() => {
                loginTimer1 = setTimeout(() => {
                  if (!hasSettled) {
                    if (currentClient.user) {
                      hasSettled = true; cleanup(); resolve();
                    } else {
                      hasSettled = true; cleanup(); reject(new Error("Login completed but client user is empty"));
                    }
                  }
                }, 1200);
              }).catch((loginErr) => {
                if (!hasSettled) { hasSettled = true; cleanup(); reject(loginErr); }
              });
  
            loginTimer2 = setTimeout(() => {
              if (!hasSettled) {
                hasSettled = true;
                cleanup();
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
      saveServerState();
  
      discordState.client.on("ready", async () => {
        if (!discordState.client) return;
        console.log(`[Discord Bot] Client ready callback: @${discordState.client.user?.tag}`);
        discordState.botStatus = "ONLINE";
        discordState.joinedServersCount = discordState.client.guilds.cache.size;
        saveServerState();
  
        await dbService.updateStats({ activeServers: discordState.joinedServersCount });
        applyBotPresence(discordState.client, config);
        initLiveStockTimer(discordState.client);
        
        // Delivery Recovery mechanism execution
        runDeliveryRecovery(discordState.client);
      });

      discordState.client.on("guildCreate", async (guild) => {
        if (!discordState.client) return;
        console.log(`[Discord Bot] Joined new guild: ${guild.name}`);
        discordState.joinedServersCount = discordState.client.guilds.cache.size;
        saveServerState();
        await dbService.updateStats({ activeServers: discordState.joinedServersCount });
      });

      discordState.client.on("guildDelete", async (guild) => {
        if (!discordState.client) return;
        console.log(`[Discord Bot] Left guild: ${guild.name}`);
        discordState.joinedServersCount = discordState.client.guilds.cache.size;
        saveServerState();
        await dbService.updateStats({ activeServers: discordState.joinedServersCount });
      });

      discordState.client.on("guildMemberAdd", async (member) => {
        const currentConfig = await dbService.getConfig();
        if (currentConfig.serverManagement?.welcomeChannelId) {
          try {
             const welcomeChannel = member.guild.channels.cache.find(c => c.name === currentConfig.serverManagement!.welcomeChannelId || c.id === currentConfig.serverManagement!.welcomeChannelId) as TextChannel;
             if (welcomeChannel) {
                const embed = new EmbedBuilder()
                  .setTitle('👋 Welcome!')
                  .setDescription(`Selamat datang <@${member.id}> di server **${member.guild.name}**!\nSemoga betah ya.`)
                  .setColor('#00FF00')
                  .setThumbnail(member.user.displayAvatarURL())
                  .setTimestamp();
                await welcomeChannel.send({ embeds: [embed] });
             }
          } catch (e) {
             console.error("[Discord Bot] Failed to send welcome message:", e);
          }
        }
      });

      discordState.client.on("guildMemberRemove", async (member) => {
        const currentConfig = await dbService.getConfig();
        if (currentConfig.serverManagement?.leaveChannelId || currentConfig.serverManagement?.welcomeChannelId) {
          try {
             const targetChannelId = currentConfig.serverManagement?.leaveChannelId || currentConfig.serverManagement?.welcomeChannelId;
             const leaveChannel = member.guild.channels.cache.find(c => c.name === targetChannelId || c.id === targetChannelId) as TextChannel;
             if (leaveChannel) {
                const embed = new EmbedBuilder()
                  .setTitle('👋 Sayonara')
                  .setDescription(`**${member.user.tag}** telah meninggalkan server.`)
                  .setColor('#FF0000')
                  .setTimestamp();
                await leaveChannel.send({ embeds: [embed] });
             }
          } catch (e) {
             console.error("[Discord Bot] Failed to send leave message:", e);
          }
        }
      });
  
      discordState.client.on("messageCreate", handleMessageCreate);
      
      discordState.client.on("interactionCreate", async (interaction) => {
        try {
          if (interaction.isButton()) {
            if (interaction.customId === 'refresh_live_stock') {
              await interaction.deferUpdate();
              await updateLiveStock(discordState.client!);
            } else if (interaction.customId === 'register_account') {
              const modal = new ModalBuilder()
                  .setCustomId('register_modal')
                  .setTitle('REGISTER ACCOUNTS');

              const inputName = new TextInputBuilder()
                  .setCustomId('account_name')
                  .setLabel('INPUT ACCOUNT NAME *')
                  .setStyle(TextInputStyle.Short)
                  .setPlaceholder("Input Account Name Make Sure It's Correct")
                  .setRequired(true);

              const confirmName = new TextInputBuilder()
                  .setCustomId('confirm_account_name')
                  .setLabel('CONFIRM ACCOUNT NAME *')
                  .setStyle(TextInputStyle.Short)
                  .setPlaceholder('Recheck Account Name')
                  .setRequired(true);

              const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(inputName);
              const secondActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(confirmName);

              modal.addComponents(firstActionRow, secondActionRow);
              await interaction.showModal(modal);
            } else if (interaction.customId === 'topup_qris') {
              await interaction.reply({ content: "💳 Silahkan hubungi admin atau gunakan perintah `/topup` untuk melakukan pengisian saldo.", ephemeral: true });
            } else if (interaction.customId === 'cek_saldo') {
              const user = await dbService.getUserByDiscordId(interaction.user.id);
              const balance = user ? user.balance : 0;
              await interaction.reply({ content: `💰 Saldo kamu saat ini: **Rp ${balance.toLocaleString('id-ID')}**. Lakukan topup untuk bertransaksi.`, ephemeral: true });
            } else if (interaction.customId === 'belanja_sekarang' || interaction.customId === 'buy_btn') {
              const modal = new ModalBuilder()
                  .setCustomId('buy_product_modal')
                  .setTitle('🛒 BELI PRODUK');

              const inputCode = new TextInputBuilder()
                  .setCustomId('product_code')
                  .setLabel('KODE PRODUK')
                  .setStyle(TextInputStyle.Short)
                  .setPlaceholder('Contoh: NIBB')
                  .setRequired(true);

              const inputQuantity = new TextInputBuilder()
                  .setCustomId('product_qty')
                  .setLabel('JUMLAH YANG DIBELI')
                  .setStyle(TextInputStyle.Short)
                  .setPlaceholder('1')
                  .setRequired(true);

              const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(inputCode);
              const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(inputQuantity);

              modal.addComponents(row1, row2);
              await interaction.showModal(modal);
            }
          } else if (interaction.isModalSubmit()) {
            if (interaction.customId === 'register_modal') {
                const accountName = interaction.fields.getTextInputValue('account_name');
                const confirmName = interaction.fields.getTextInputValue('confirm_account_name');
                if (accountName !== confirmName) {
                    await interaction.reply({ content: "❌ Account Name and Confirm Account Name do not match. Please try again.", ephemeral: true });
                } else {
                    await dbService.registerUser(interaction.user.id, accountName);
                    await interaction.reply({ content: `✅ Berhasil mendaftarkan akun **${accountName}**!\n\n_Note: Harap pastikan nama ini sama dengan nama saat donasi via Saweria._`, ephemeral: true });
                }
            } else if (interaction.customId === 'buy_product_modal') {
                if (activePurchases.has(interaction.user.id)) {
                    await interaction.reply({ content: `⏳ Transaksi sebelumnya sedang diproses, mohon bersabar dan jangan klik dua kali.`, ephemeral: true });
                    return;
                }

                const now = Date.now();
                const lastPurchase = purchaseCooldowns.get(interaction.user.id);
                if (lastPurchase && now - lastPurchase < COOLDOWN_MS) {
                    const remainingSec = Math.ceil((COOLDOWN_MS - (now - lastPurchase)) / 1000);
                    await interaction.reply({ content: `⏳ Mohon tunggu ${remainingSec} detik sebelum melakukan pembelian lagi.`, ephemeral: true });
                    return;
                }

                const code = interaction.fields.getTextInputValue('product_code');
                const qtyStr = interaction.fields.getTextInputValue('product_qty');
                const qty = parseInt(qtyStr, 10);

                if (isNaN(qty) || qty <= 0) {
                    await interaction.reply({ content: "❌ Jumlah yang dibeli harus berupa angka yang valid dan lebih dari 0.", ephemeral: true });
                    return;
                }

                activePurchases.set(interaction.user.id, Date.now());

                try {
                  const products = await dbService.getProducts();
                  const product = products.find(p => p.code?.toLowerCase() === code.toLowerCase() || p.id.toLowerCase() === code.toLowerCase());

                  if (!product) {
                      await interaction.reply({ content: `❌ Produk dengan kode **${code}** tidak ditemukan.`, ephemeral: true });
                      return;
                  }

                  const stockAvailable = product.stock?.length || 0;
                  if (qty > stockAvailable) {
                      await interaction.reply({ content: `❌ Stok tidak mencukupi. Hanya tersedia ${stockAvailable} item untuk produk ini.`, ephemeral: true });
                      return;
                  }

                  const user = await dbService.getUserByDiscordId(interaction.user.id);
                  const totalCost = product.price * qty;

                  if (!user) {
                      await interaction.reply({ content: `❌ Kamu belum terdaftar. Silahkan klik tombol **👤 Register** terlebih dahulu.`, ephemeral: true });
                      return;
                  }

                  if (user.balance < totalCost) {
                      await interaction.reply({ content: `❌ Saldo kamu tidak mencukupi. Total harga: **Rp ${totalCost.toLocaleString('id-ID')}**. Saldo kamu: **Rp ${user.balance.toLocaleString('id-ID')}**. Silahkan topup terlebih dahulu.`, ephemeral: true });
                      return;
                  }

                  // Process purchase transaction
                  const purchaseRes = await dbService.processPurchase(
                    interaction.user.id,
                    user.username || interaction.user.username,
                    product.id,
                    qty,
                    totalCost
                  );

                  if (!purchaseRes.success || !purchaseRes.stockItems || !purchaseRes.transactionId) {
                    await interaction.reply({ content: `❌ Transaksi gagal: ${purchaseRes.error}`, ephemeral: true });
                    return;
                  }

                  const stockItems = purchaseRes.stockItems;
                  const newBalance = purchaseRes.newBalance;
                  const txId = purchaseRes.transactionId;

                  // Try DM user
                  let dmSuccess = false;
                  try {
                    const itemsText = stockItems.join('\n');
                    const buffer = Buffer.from(itemsText, 'utf-8');
                    const attachment = new AttachmentBuilder(buffer, { name: `${product.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_items.txt` });
                    
                    const dmChannel = await interaction.user.createDM();
                    await dmChannel.send({
                      content: `Terima kasih telah membeli **${product.name}**!\n\nBerikut pesanan kamu terlampir pada file dibawah ini.\nSisa saldo kamu: **Rp ${(newBalance || 0).toLocaleString('id-ID')}**.`,
                      files: [attachment]
                    });
                    
                    dmSuccess = true;
                  } catch (err) {
                    console.error(`[DM Failed] Could not DM user ${interaction.user.id} for tx ${txId}:`, err);
                  }

                  if (dmSuccess) {
                    // Mark delivery success on DM successful sent
                    await dbService.markDeliverySuccess(txId);
                    
                    try {
                      await interaction.reply({ content: `✅ Berhasil membeli ${qty}x **${product.name}** seharga **Rp ${totalCost.toLocaleString('id-ID')}**. Silahkan cek DM (Direct Message) kamu untuk detail produk.`, ephemeral: true });
                    } catch (replyErr) {
                      console.error(`[Reply Failed] Could not reply to interaction for tx ${txId}:`, replyErr);
                    }
                  } else {
                    // Refund if DM fails
                    await dbService.refundPurchase(interaction.user.id, product.id, stockItems, totalCost, txId);
                    
                    try {
                      await interaction.reply({ content: `⚠️ Gagal mengirim pesan ke DM kamu (mungkin ditutup). Transaksi telah dibatalkan dan saldo dikembalikan otomatis. Pastikan DM terbuka lalu coba lagi.`, ephemeral: true });
                    } catch (replyErr) {
                      console.error(`[Reply Failed] Could not reply refund notice to interaction for tx ${txId}:`, replyErr);
                    }
                  }
                  purchaseCooldowns.set(interaction.user.id, Date.now());
                } finally {
                  activePurchases.delete(interaction.user.id);
                }
            }
          }
        } catch (e) {
          console.error("[Discord Bot] Interaction Error:", e);
        }
      });
  
      discordState.client.on("error", (err) => {
        console.error("[Discord Bot] Client Error Event:", err);
        discordState.botStatus = "ERROR";
        discordState.botErrorLog = err.message;
        saveServerState();
      });
  
      applyBotPresence(discordState.client, config);
      initLiveStockTimer(discordState.client);
  
    } catch (err: any) {
      console.log("[Discord Bot Info] Bot client is in connection-alert state:", err?.message || err);
      discordState.botStatus = "ERROR";
      discordState.botErrorLog = err.message ? err.message : (typeof err === "string" ? err : "Invalid Bot Token credentials.");
      discordState.client = null;
      saveServerState();
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
