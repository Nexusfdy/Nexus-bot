import { Router } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { dbService } from "../src/db/db_service.ts";
import { Product, CustomCommand, BotConfig, BotStats, ModLog, Order } from "../src/types.ts";
import { discordState } from "./discordState.ts";
import { initializeDiscordBot, applyBotPresence } from "./discordBot.ts";
import { updateLiveStock } from "./botFeatures/liveStock.ts";
import { requireAuth, generateToken, ADMIN_PASSWORD } from "./auth.ts";

export const apiRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per `window` (here, per 15 minutes)
  message: { error: "Terlalu banyak percobaan login, coba lagi setelah 15 menit" },
  standardHeaders: true,
  legacyHeaders: false,
});

apiRouter.post("/auth/login", loginLimiter, (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    const token = generateToken();
    res.json({ success: true, token });
  } else {
    res.status(401).json({ error: "Invalid password" });
  }
});

apiRouter.use(requireAuth);

// 1. Products CRUD API Portals
apiRouter.get("/products", async (req, res) => {
  try {
    const products = await dbService.getProducts();
    res.json(products);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

const productSchema = z.object({
  id: z.string().optional(),
  code: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  price: z.number().min(0, "Price must be non-negative"),
  description: z.string().optional(),
  type: z.enum(['License Key', 'Download Link', 'Accounts']),
  stock: z.array(z.string()),
  category: z.string().optional(),
  imageUrl: z.string().optional(),
  createdAt: z.number().optional()
});

apiRouter.post("/products", async (req, res) => {
  try {
    const freshProduct = productSchema.parse(req.body) as unknown as Product;
    await dbService.saveProduct(freshProduct);
    const productsList = await dbService.getProducts();
    await dbService.updateStats({ totalProducts: productsList.length });
    if (discordState.client) updateLiveStock(discordState.client);
    res.json({ success: true, product: freshProduct });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: (err as any).errors });
    }
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[API] Attempting to delete product with ID: ${id}`);
    await dbService.deleteProduct(id);
    const productsList = await dbService.getProducts();
    await dbService.updateStats({ totalProducts: productsList.length });
    if (discordState.client) updateLiveStock(discordState.client);
    console.log(`[API] Successfully deleted product with ID: ${id}`);
    res.json({ success: true });
  } catch (err: any) {
    console.error(`[API] Delete product error for ID ${req.params.id}:`, err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// 2. Custom Commands CRUD API Portals
apiRouter.get("/commands", async (req, res) => {
  try {
    const commands = await dbService.getCommands();
    res.json(commands);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

const commandSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  response: z.string().min(1, "Response text is required"),
  isActive: z.boolean().optional(),
  usageCount: z.number().optional()
});

apiRouter.post("/commands", async (req, res) => {
  try {
    const cmd = commandSchema.parse(req.body) as unknown as CustomCommand;
    await dbService.saveCommand(cmd);
    res.json({ success: true, command: cmd });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: (err as any).errors });
    }
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete("/commands/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await dbService.deleteCommand(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Configuration API Portals
apiRouter.get("/config", async (req, res) => {
  try {
    const config = await dbService.getConfig();
    res.json(config);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

const configSchema = z.object({
  botToken: z.string().optional(),
  clientId: z.string().optional(),
  guildId: z.string().optional(),
  prefix: z.string().optional(),
  welcomeChannel: z.string().optional(),
  logChannel: z.string().optional(),
  statusText: z.string().optional(),
  statusType: z.enum(['PLAYING', 'STREAMING', 'LISTENING', 'WATCHING']).optional(),
  webhookUrl: z.string().optional(),
  autoClaimOnPayment: z.boolean().optional(),
  greetingMessage: z.string().optional(),
  liveStockChannel: z.string().optional(),
  depositWebhookChannelId: z.string().optional(),
  ownerId: z.string().optional(),
  serverManagement: z.any().optional(),
  autoMod: z.object({
    antiLink: z.boolean(),
    antiSpam: z.boolean(),
    warnLimit: z.number(),
    bannedWords: z.array(z.string())
  }).optional(),
  embedColor: z.string().optional()
}).passthrough();

apiRouter.post("/config", async (req, res) => {
  try {
    const incoming = configSchema.parse(req.body) as unknown as BotConfig;
    if (incoming.botToken === undefined || incoming.botToken === null || incoming.botToken.trim() === "") {
      incoming.botToken = "NONE";
    }
    const currentConfig = await dbService.getConfig();
    const tokenChanged = (currentConfig.botToken || "").trim() !== (incoming.botToken || "").trim();

    await dbService.saveConfig(incoming);

    if (discordState.client && discordState.botStatus === "ONLINE" && !tokenChanged) {
      applyBotPresence(discordState.client, incoming);
      updateLiveStock(discordState.client);
    } else if (tokenChanged) {
      console.log("[Discord Bot] Bot token was updated. Re-initializing Discord Bot Client...");
      initializeDiscordBot().catch(err => {
        console.log("[Discord Bot] Async reload notification:", err?.message || err);
      });
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.patch("/config/:section", async (req, res) => {
  try {
    const { section } = req.params;
    const body = req.body;
    
    // We should get the existing config first to trigger any necessary discord state changes
    const currentConfig = await dbService.getConfig();
    
    if (section === 'general') {
      await dbService.updateGeneralConfig(
        body.prefix !== undefined ? body.prefix : currentConfig.prefix,
        body.statusText !== undefined ? body.statusText : currentConfig.statusText,
        body.statusType !== undefined ? body.statusType : currentConfig.statusType
      );
    } else if (section === 'discord') {
      const incomingToken = body.botToken === undefined || body.botToken === null || body.botToken.trim() === "" ? "NONE" : body.botToken;
      await dbService.updateDiscordConfig(incomingToken);
      
      const tokenChanged = (currentConfig.botToken || "").trim() !== incomingToken.trim();
      if (tokenChanged) {
        console.log("[Discord Bot] Bot token was updated. Re-initializing Discord Bot Client...");
        initializeDiscordBot().catch(err => {
          console.log("[Discord Bot] Async reload notification:", err?.message || err);
        });
      }
    } else if (section === 'livestock') {
      await dbService.updateLiveStockConfig(
        body.guildId !== undefined ? body.guildId : (currentConfig.guildId || ''),
        body.liveStockChannel !== undefined ? body.liveStockChannel : (currentConfig.liveStockChannel || '')
      );
    } else if (section === 'saweria') {
      await dbService.updateSaweriaConfig(
        body.depositWebhookChannelId !== undefined ? body.depositWebhookChannelId : (currentConfig.depositWebhookChannelId || '')
      );
    } else if (section === 'features') {
      await dbService.updateFeaturesConfig(
        body.webhookUrl !== undefined ? body.webhookUrl : (currentConfig.webhookUrl || ''),
        body.autoClaimOnPayment !== undefined ? body.autoClaimOnPayment : currentConfig.autoClaimOnPayment,
        body.greetingMessage !== undefined ? body.greetingMessage : (currentConfig.greetingMessage || '')
      );
    } else if (section === 'server') {
      await dbService.updateServerConfig(
        body.guildId !== undefined ? body.guildId : (currentConfig.guildId || ''),
        body.ownerId !== undefined ? body.ownerId : (currentConfig.ownerId || ''),
        body.serverManagement !== undefined ? body.serverManagement : currentConfig.serverManagement
      );
    } else if (section === 'security') {
      await dbService.updateSecurityConfig(
        body.autoMod?.antiLink !== undefined ? body.autoMod.antiLink : currentConfig.autoMod.antiLink,
        body.autoMod?.antiSpam !== undefined ? body.autoMod.antiSpam : currentConfig.autoMod.antiSpam,
        body.autoMod?.warnLimit !== undefined ? body.autoMod.warnLimit : currentConfig.autoMod.warnLimit,
        body.autoMod?.bannedWords !== undefined ? body.autoMod.bannedWords : currentConfig.autoMod.bannedWords
      );
    } else {
      return res.status(400).json({ error: "Invalid section" });
    }

    if (section === 'general' || section === 'features') {
      if (discordState.client && discordState.botStatus === "ONLINE") {
        const newConfig = await dbService.getConfig();
        applyBotPresence(discordState.client, newConfig);
      }
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Users API Portals
apiRouter.get("/users", async (req, res) => {
  try {
    const users = await dbService.getUsers();
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post("/users/balance", async (req, res) => {
  try {
    const { discordId, amount } = req.body;
    if (!discordId || typeof amount !== 'number') {
      return res.status(400).json({ error: 'discordId and amount are required' });
    }
    await dbService.updateUserBalance(discordId, amount);
    const updatedUser = await dbService.getUserByDiscordId(discordId);
    
    // Internal Record of Transaction
    if (updatedUser) {
      await dbService.saveTransaction({
        id: `tx_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        userId: updatedUser.discordId,
        username: updatedUser.accountName,
        amount: amount,
        type: amount > 0 ? 'DEPOSIT' : 'REFUND',
        description: `Manual balance update by admin`,
        timestamp: Date.now()
      });
    }

    res.json({ success: true, user: updatedUser });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Transactions
apiRouter.get("/transactions", async (req, res) => {
  try {
    const transactions = await dbService.getTransactions();
    res.json(transactions);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Statistics API Portals
apiRouter.get("/stats", async (req, res) => {
  try {
    const stats = await dbService.getStats();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post("/stats", async (req, res) => {
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
apiRouter.get("/orders", async (req, res) => {
  try {
    const orders = await dbService.getOrders();
    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

const orderSchema = z.object({
  id: z.string().optional(),
  productId: z.string(),
  productName: z.string(),
  price: z.number(),
  customerDiscordId: z.string(),
  customerUsername: z.string(),
  status: z.enum(['Pending', 'Success', 'Claimed', 'Failed']),
  transactionId: z.string().optional(),
  claimedStockItem: z.string().optional(),
  claimedAt: z.number().optional(),
  createdAt: z.number().optional()
});

apiRouter.post("/orders", async (req, res) => {
  try {
    const orderItem = orderSchema.parse(req.body) as Order;
    await dbService.saveOrder(orderItem);

    // Internal Record of Transaction for new orders or status changes
    if (orderItem.status === 'Success' || orderItem.status === 'Claimed') {
      await dbService.saveTransaction({
        id: `tx_${orderItem.id}`,
        userId: orderItem.customerDiscordId,
        username: orderItem.customerUsername,
        amount: orderItem.price,
        type: 'PURCHASE',
        description: `Purchased product: ${orderItem.productName}`,
        timestamp: Date.now()
      });
    }

    res.json({ success: true, order: orderItem });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: (err as any).errors });
    }
    res.status(500).json({ error: err.message });
  }
});

// 6. Moderation Logs Portal
apiRouter.get("/mod_logs", async (req, res) => {
  try {
    const logs = await dbService.getModLogs();
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post("/mod_logs", async (req, res) => {
  try {
    const logItem: ModLog = req.body;
    await dbService.saveModLog(logItem);
    res.json({ success: true, log: logItem });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete("/mod_logs", async (req, res) => {
  try {
    await dbService.clearModLogs();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Bot Connection Control endpoints
apiRouter.get("/bot/status", async (req, res) => {
  const ping = discordState.client?.ws.ping || 0;
  res.json({
    status: discordState.botStatus,
    dbEngine: dbService.getEngine(),
    error: discordState.botErrorLog,
    ping: ping,
    guildsCount: discordState.joinedServersCount,
    botUser: discordState.client?.user ? {
      tag: discordState.client.user.tag,
      id: discordState.client.user.id,
      avatar: discordState.client.user.displayAvatarURL()
    } : null
  });
});

apiRouter.get("/bot/guilds", async (req, res) => {
  if (!discordState.client || !discordState.client.isReady()) {
    return res.status(503).json({ error: "Bot is not ready or offline" });
  }

  try {
    const guilds: { id: string; name: string }[] = [];
    discordState.client.guilds.cache.forEach(guild => {
      guilds.push({ id: guild.id, name: guild.name });
    });
    res.json(guilds);
  } catch (error: any) {
    console.error("Failed to fetch guilds:", error);
    res.status(500).json({ error: error.message });
  }
});

apiRouter.get("/bot/guilds/:guildId/channels", async (req, res) => {
  if (!discordState.client || !discordState.client.isReady()) {
    return res.status(503).json({ error: "Bot is not ready or offline" });
  }
  
  const { guildId } = req.params;

  try {
    const guild = discordState.client.guilds.cache.get(guildId);
    if (!guild) {
      return res.status(404).json({ error: "Guild not found" });
    }
    
    const channels: { id: string; name: string }[] = [];
    guild.channels.cache.forEach(channel => {
      // Hanya ambil channel bertipe teks (0 = GuildText, 5 = GuildAnnouncement, 15 = GuildForum) dll
      if (channel.isTextBased()) {
        channels.push({ 
          id: channel.id, 
          name: channel.name 
        });
      }
    });
    res.json(channels);
  } catch (error: any) {
    console.error("Failed to fetch channels:", error);
    res.status(500).json({ error: error.message });
  }
});

apiRouter.post("/bot/restart", async (req, res) => {
  console.log("[Discord Bot Restart Request received via Dashboard admin]");
  try {
    await initializeDiscordBot();
    const ping = discordState.client?.ws.ping || 0;
    res.json({
      success: true,
      status: discordState.botStatus,
      guildsCount: discordState.joinedServersCount,
      ping: ping,
      error: discordState.botErrorLog
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post("/webhook/simulate", async (req, res) => {
  const { webhookUrl, payload } = req.body;
  if (!webhookUrl) return res.status(400).json({ error: "Webhook URL is required" });

  if (!webhookUrl.startsWith("https://discord.com/api/webhooks/")) {
    return res.status(400).json({ error: "Invalid Webhook URL. Only official Discord webhooks are allowed." });
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
            { name: "🛒 ID Pemesanan (Order ID)", value: `\`${payload.orderId || "ORD-TESTPAYMENT"}\``, inline: true },
            { name: "👤 Akun Pembeli", value: `@${payload.customerUsername || "StoreTester_NPC"}`, inline: true },
            { name: "📦 Produk Digital", value: payload.productName || "Discord Nitro Premium [TEST]", inline: false },
            { name: "💰 Jumlah Nilai Pembayaran", value: `Rp ${(payload.price || 0).toLocaleString("id-ID")}`, inline: true },
            { name: "🚀 Status Penyerahan", value: "✅ INSTANTLY ON-QUEUE / READY TO CLAIM", inline: true }
          ],
          footer: { text: "Nexus Auto-Store Log Generator Service" },
          timestamp: new Date().toISOString()
        }
      ]
    };
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(discordPayload)
    });
    if (response.ok) return res.json({ success: true, message: "Payload successfully dispatched." });
    const errorText = await response.text();
    return res.status(502).json({ error: `Discord rejected webhook call: ${errorText}` });
  } catch (err: any) {
    return res.json({ success: true, simulated: true, error: err.message });
  }
});

apiRouter.post("/reset-db", async (req, res) => {
  try {
    const { mode } = req.body;
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

apiRouter.get("/debug-log", async (req, res) => {
  try {
    const logs = await dbService.getModLogs();
    res.json({ success: true, logs });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.post("/trigger-live-stock", async (req, res) => {
  try {
    if (discordState.client && discordState.botStatus === "ONLINE") {
      updateLiveStock(discordState.client);
      res.json({ success: true, message: "Pemicu manual berhasil dikirim ke Service Live Stock." });
    } else {
      res.status(400).json({ error: "Bot tidak online." });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.get("/health", (req, res) => {
  res.json({ status: "alive", timestamp: Date.now() });
});
