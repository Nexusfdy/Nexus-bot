import { Router } from "express";
import { dbService } from "../src/db/db_service.ts";
import { Product, CustomCommand, BotConfig, BotStats, ModLog, Order } from "../src/types.ts";
import { discordState } from "./discordState.ts";
import { initializeDiscordBot, applyBotPresence } from "./discordBot.ts";

export const apiRouter = Router();

// 1. Products CRUD API Portals
apiRouter.get("/products", async (req, res) => {
  try {
    const products = await dbService.getProducts();
    res.json(products);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post("/products", async (req, res) => {
  try {
    const freshProduct: Product = req.body;
    await dbService.saveProduct(freshProduct);
    const productsList = await dbService.getProducts();
    await dbService.updateStats({ totalProducts: productsList.length });
    res.json({ success: true, product: freshProduct });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await dbService.deleteProduct(id);
    const productsList = await dbService.getProducts();
    await dbService.updateStats({ totalProducts: productsList.length });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
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

apiRouter.post("/commands", async (req, res) => {
  try {
    const cmd: CustomCommand = req.body;
    await dbService.saveCommand(cmd);
    res.json({ success: true, command: cmd });
  } catch (err: any) {
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

apiRouter.post("/config", async (req, res) => {
  try {
    const incoming: BotConfig = req.body;
    if (incoming.botToken === undefined || incoming.botToken === null || incoming.botToken.trim() === "") {
      incoming.botToken = "NONE";
    }
    const currentConfig = await dbService.getConfig();
    const tokenChanged = (currentConfig.botToken || "").trim() !== (incoming.botToken || "").trim();

    await dbService.saveConfig(incoming);

    if (discordState.client && discordState.botStatus === "ONLINE" && !tokenChanged) {
      applyBotPresence(discordState.client, incoming);
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

apiRouter.post("/orders", async (req, res) => {
  try {
    const orderItem: Order = req.body;
    await dbService.saveOrder(orderItem);
    res.json({ success: true, order: orderItem });
  } catch (err: any) {
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

apiRouter.get("/health", (req, res) => {
  res.json({ status: "alive", timestamp: Date.now() });
});
