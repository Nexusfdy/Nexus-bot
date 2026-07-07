
export interface StoreUIConfig {
  storeName: string;
  storeDescription: string;
  storeFooter: string;
  storeColor: string;
  storeThumbnail: string;
  storeBanner: string;
  emptyStockMessage: string;

  paymentProvider: string;
  paymentUrl: string;
  paymentTitle: string;
  paymentDescription: string;
  paymentButtonText: string;

  liveStockTitle: string;
  liveStockDescription: string;
  liveStockFooter: string;
  showLastUpdate: boolean;
  stockAvailableEmoji: string;
  stockEmptyEmoji: string;

  registerButtonText: string;
  topupButtonText: string;
  balanceButtonText: string;
  buyButtonText: string;
}

export interface Transaction {
  id: string;
  userId: string;
  username: string;
  amount: number;
  type: 'DEPOSIT' | 'PURCHASE' | 'REFUND';
  description: string;
  timestamp: number;
}

export interface User {
  discordId: string;
  accountName: string;
  balance: number;
  createdAt: number;
  isUnlimited?: boolean;
  filePath?: string;
}

export interface Product {
  id: string;
  code?: string;
  name: string;
  price: number;
  description: string;
  type: 'License Key' | 'Download Link' | 'Accounts' | 'File' | 'Source Code' | string;
  stock: string[]; // List of stock items, e.g. ["KEY-123", "KEY-456"]
  category: string;
  imageUrl?: string;
  createdAt: number;
  isUnlimited?: boolean;
  filePath?: string;
}

export interface Order {
  id: string;
  productId: string;
  productName: string;
  price: number;
  customerDiscordId: string;
  customerUsername: string;
  status: 'Pending' | 'Success' | 'Claimed' | 'Failed';
  claimedStockItem?: string; // The license key delivered
  claimedAt?: number;
  transactionId: string;
  createdAt: number;
  isUnlimited?: boolean;
  filePath?: string;
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
  guildId?: string; // New field for active Discord Server
  depositWebhookChannelId?: string; // New field for Saweria Topup
  autoClaimOnPayment: boolean;
  greetingMessage: string;
  liveStockChannel?: string; // New field
  liveStockMessageId?: string; // The ID of the live stock message
  autoMod: AutoModSettings;
  uiConfig?: StoreUIConfig;
  botToken?: string;
  ownerId?: string; // Discord ID of the bot owner
  serverManagement?: {
    welcomeChannelId?: string;
    logChannelId?: string;
    leaveChannelId?: string;
    buyerRoleId?: string;
  };
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



export const defaultUIConfig: StoreUIConfig = {
  storeName: "🤖 NIXS PREMIUM STORE",
  storeDescription: "Selamat datang di NIXS Store! Kami menyediakan berbagai produk digital terbaik dengan sistem otomatis 24/7.",
  storeFooter: "Nixs Store System • Auto Update",
  storeColor: "#2b2d31",
  storeThumbnail: "",
  storeBanner: "",
  emptyStockMessage: "⚠️ **Belum ada produk saat ini.**\n*Silakan cek kembali nanti.*",

  paymentProvider: "saweria",
  paymentUrl: "https://saweria.co/",
  paymentTitle: "💳 Top Up Saldo",
  paymentDescription: "Silakan melakukan donasi melalui {provider}.\n\nGunakan nama akun Discord yang sudah terdaftar agar saldo otomatis masuk.\n\nSetelah pembayaran berhasil, saldo biasanya masuk dalam beberapa detik.\nJika lebih dari 1 menit belum masuk silakan hubungi admin.",
  paymentButtonText: "🌐 Buka {provider}",

  liveStockTitle: "🤖 NIXS PREMIUM STORE",
  liveStockDescription: "Selamat datang di NIXS Store! Kami menyediakan berbagai produk digital terbaik dengan sistem otomatis 24/7.",
  liveStockFooter: "Nixs Store System • Auto Update",
  showLastUpdate: true,
  stockAvailableEmoji: "✅",
  stockEmptyEmoji: "🔴",

  registerButtonText: "👤 Register",
  topupButtonText: "💳 Top Up Saldo",
  balanceButtonText: "💰 Saldo",
  buyButtonText: "🛒 Beli"
};
