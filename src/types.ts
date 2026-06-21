export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  type: 'License Key' | 'Download Link' | 'Accounts';
  stock: string[]; // List of stock items, e.g. ["KEY-123", "KEY-456"]
  category: string;
  imageUrl?: string;
  createdAt: number;
}

export interface Order {
  id: string;
  productId: string;
  productName: string;
  price: number;
  customerDiscordId: string;
  customerUsername: string;
  status: 'Pending' | 'Success' | 'Claimed';
  claimedStockItem?: string; // The license key delivered
  claimedAt?: number;
  transactionId: string;
  createdAt: number;
}

export interface CustomCommand {
  id: string;
  name: string; // e.g. "rules"
  response: string; // e.g. "Silakan baca peraturan..."
  description: string;
  usageCount: number;
  isActive: boolean;
}

export interface AutoModSettings {
  antiLink: boolean;
  antiSpam: boolean;
  warnLimit: number;
  bannedWords: string[];
}

export interface BotConfig {
  prefix: string;
  statusText: string;
  statusType: 'PLAYING' | 'STREAMING' | 'LISTENING' | 'WATCHING';
  webhookUrl: string;
  autoClaimOnPayment: boolean;
  greetingMessage: string;
  autoMod: AutoModSettings;
  botToken?: string;
}

export interface ModLog {
  id: string;
  userId: string;
  username: string;
  action: 'WARN' | 'MUTE' | 'KICK' | 'BAN' | 'DELETE_MESSAGE';
  reason: string;
  timestamp: number;
}

export interface BotStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  activeServers: number;
  commandsRun: number;
  moderationActions: number;
}

export interface DiscordBotUser {
  tag: string;
  id: string;
  avatar: string | null;
  ping?: number;
  guildsCount?: number;
}

