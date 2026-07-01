import { useState, useEffect } from "react";
import { Product, CustomCommand, BotConfig, BotStats, Order, ModLog, DiscordBotUser } from "../types";
import { safeFetchJsonWithAuth } from "../lib/api";

export function useBotData() {
  const [botOnline, setBotOnline] = useState(false);
  const [botStatus, setBotStatus] = useState<"ONLINE" | "CONNECTING" | "OFFLINE" | "ERROR">("OFFLINE");
  const [botError, setBotError] = useState<string | null>(null);
  const [botUser, setBotUser] = useState<DiscordBotUser | null>(null);
  const [dbEngine, setDbEngine] = useState<string>("Local JSON File");
  const [isDataLoaded, setIsDataLoaded] = useState(false);

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

  const refreshAllData = async () => {
    const [prodData, cmdData, configData, statsData, ordersData, modData, statusData] = await Promise.all([
      safeFetchJsonWithAuth('/api/products'),
      safeFetchJsonWithAuth('/api/commands'),
      safeFetchJsonWithAuth('/api/config'),
      safeFetchJsonWithAuth('/api/stats'),
      safeFetchJsonWithAuth('/api/orders'),
      safeFetchJsonWithAuth('/api/mod_logs'),
      safeFetchJsonWithAuth('/api/bot/status')
    ]);

    if (Array.isArray(prodData)) setProducts(prodData);
    if (Array.isArray(cmdData)) setCommands(cmdData);
    if (configData && !Array.isArray(configData)) {
      setConfig(configData);
    }
    if (statsData && !Array.isArray(statsData)) {
      if (statusData && statusData.guildsCount !== undefined) {
        statsData.activeServers = statusData.guildsCount;
      }
      setStats(statsData);
    }
    if (Array.isArray(ordersData)) setOrders(ordersData);
    if (Array.isArray(modData)) setModLogs(modData);

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
    
    setIsDataLoaded(true);
  };

  useEffect(() => {
    refreshAllData();
    const interval = setInterval(refreshAllData, 15000);
    return () => clearInterval(interval);
  }, []);

  return {
    botOnline, botStatus, botError, botUser, dbEngine,
    products, setProducts, commands, setCommands,
    config, setConfig, stats, setStats, orders, setOrders,
    modLogs, setModLogs, refreshAllData, isDataLoaded
  };
}
