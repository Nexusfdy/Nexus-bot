import {
  getAdminAuth,
  updateAdminPassword,
  setAdminResetToken,
  clearAdminResetToken
} from './modules/admin.js';
import {
  getCommands,
  saveCommand,
  deleteCommand
} from './modules/commands.js';
import {
  getConfig,
  saveConfig,
  updateUIConfig,
  updateGeneralConfig,
  updateDiscordConfig,
  updateLiveStockConfig,
  updateLiveStockMessageId,
  updateSaweriaConfig,
  updateSecurityConfig,
  updateFeaturesConfig,
  updateServerConfig
} from './modules/config.js';
import {
  getPendingDeliveries
} from './modules/deliveries.js';
import {
  processPurchase
} from './modules/misc.js';
import {
  getModLogs,
  saveModLog,
  clearModLogs
} from './modules/modLogs.js';
import {
  getOrders,
  saveOrder
} from './modules/orders.js';
import {
  getProducts,
  saveProduct,
  deleteProduct
} from './modules/products.js';
import {
  getStats,
  updateStats
} from './modules/stats.js';
import {
  clearAllData,
  processTopup,
  processClaim,
  refundPurchase
} from './modules/system.js';
import {
  getTransactions,
  saveTransaction,
  markDeliverySuccess
} from './modules/transactions.js';
import {
  getUsers,
  getUserByDiscordId,
  registerUser,
  updateUserBalance
} from './modules/users.js';

import { dbType, bootstrapTables } from './core.js';

export { bootstrapTables };

export const dbService = {
  getEngine: () => dbType,
  getAdminAuth,
  updateAdminPassword,
  setAdminResetToken,
  clearAdminResetToken,
  getCommands,
  saveCommand,
  deleteCommand,
  getConfig,
  saveConfig,
  updateUIConfig,
  updateGeneralConfig,
  updateDiscordConfig,
  updateLiveStockConfig,
  updateLiveStockMessageId,
  updateSaweriaConfig,
  updateSecurityConfig,
  updateFeaturesConfig,
  updateServerConfig,
  getPendingDeliveries,
  processPurchase,
  getModLogs,
  saveModLog,
  clearModLogs,
  getOrders,
  saveOrder,
  getProducts,
  saveProduct,
  deleteProduct,
  getStats,
  updateStats,
  clearAllData,
  processTopup,
  processClaim,
  refundPurchase,
  getTransactions,
  saveTransaction,
  markDeliverySuccess,
  getUsers,
  getUserByDiscordId,
  registerUser,
  updateUserBalance
};
