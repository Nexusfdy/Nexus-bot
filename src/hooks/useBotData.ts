import { useState, useEffect } from "react";
import { Product, CustomCommand, BotConfig, BotStats, Order, ModLog, DiscordBotUser } from "../types";

export function useBotData() {
  const [botOnline, setBotOnline] = useState(false);
  const [botStatus, setBotStatus] = useState<"ONLINE" | "CONNECTING" | "OFFLINE" | "ERROR">("OFFLINE");
  const [botError, setBotError] = useState<string | null>(null);
  const [botUser, setBotUser] = useState<DiscordBotUser | null>(null);
  const [dbEngine, setDbEngine] = useState<string>("Local JSON File");

  const [products, setProducts] = useState<Product[]>([]);
  const [commands, setCommands] = useState<CustomCommand[]>([]);
  const [config, setConfig] = useState<BotConfig>({
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
      bannedWords: []
    },
    botToken: ''
  });
  const [stats, setStats] = useState<BotStats>({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    activeServers: 0,
    commandsRun: 0,
    moderationActions: 0
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [modLogs, setModLogs] = useState<ModLog[]>([]);

  const safeFetchJson = async (url: string) => {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) return null;
      return await res.json();
    } catch (err) {
      return null;
    }
  };

  const refreshAllData = async () => {
    const [prodData, cmdData, configData, statsData, ordersData, modData, statusData] = await Promise.all([
      safeFetchJson('/api/products'),
      safeFetchJson('/api/commands'),
      safeFetchJson('/api/config'),
      safeFetchJson('/api/stats'),
      safeFetchJson('/api/orders'),
      safeFetchJson('/api/mod_logs'),
      safeFetchJson('/api/bot/status')
    ]);

    if (prodData) setProducts(prodData);
    if (cmdData) setCommands(cmdData);
    if (configData) setConfig(configData);
    if (statsData) setStats(statsData);
    if (ordersData) setOrders(ordersData);
    if (modData) setModLogs(modData);

    if (statusData) {
      setBotStatus(statusData.status);
      setBotOnline(statusData.status === "ONLINE");
      setDbEngine(statusData.dbEngine);
      setBotError(statusData.error);
      if (statusData.botUser) {
        setBotUser({
          ...statusData.botUser,
          ping: statusData.ping,
          guildsCount: statusData.guildsCount
        });
      } else {
        setBotUser(null);
      }
    }
  };

  useEffect(() => {
    refreshAllData();
    const interval = setInterval(refreshAllData, 3500);
    return () => clearInterval(interval);
  }, []);

  return {
    botOnline, botStatus, botError, botUser, dbEngine,
    products, setProducts, commands, setCommands,
    config, setConfig, stats, setStats, orders, setOrders,
    modLogs, setModLogs, refreshAllData
  };
}
