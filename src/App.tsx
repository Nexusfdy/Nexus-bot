import React, { useState, useEffect } from 'react';
import { 
  Product, 
  Order, 
  CustomCommand, 
  BotConfig, 
  BotStats, 
  ModLog,
  DiscordBotUser
} from './types';
import Sidebar from './components/Sidebar';
import BotStatsWidget from './components/BotStatsWidget';
import ProductForm from './components/ProductForm';
import BotConfigPanel from './components/BotConfigPanel';
import CustomCommandsPanel from './components/CustomCommandsPanel';
import AutoModPanel from './components/AutoModPanel';
import DiscordSimulator from './components/DiscordSimulator';
import TransactionsTable from './components/TransactionsTable';
import { Sparkles, Terminal, Menu } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [botOnline, setBotOnline] = useState(false);
  const [botStatus, setBotStatus] = useState<"ONLINE" | "CONNECTING" | "OFFLINE" | "ERROR">("OFFLINE");
  const [botError, setBotError] = useState<string | null>(null);
  const [botUser, setBotUser] = useState<DiscordBotUser | null>(null);
  const [dbEngine, setDbEngine] = useState<string>("Local JSON File");
  const [restarting, setRestarting] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Custom Modal & Toast States replacing window.confirm and alert to bypass iframe sandbox restrictions
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    variant?: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const [toasts, setToasts] = useState<{
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
  }[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  // Core database state synchronized in real-time
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
    totalRevenue: 245000,
    totalOrders: 5,
    totalProducts: 3,
    activeServers: 1,
    commandsRun: 42,
    moderationActions: 2
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [modLogs, setModLogs] = useState<ModLog[]>([]);

  // 1. Initial Seeding and continuous real-time synchronization
  const safeFetchJson = async (url: string) => {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.warn(`[API Info] Endpoint ${url} returned status: ${res.status}`);
        return null;
      }
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        console.warn(`[API Info] Endpoint ${url} returned non-JSON Content-Type: "${contentType}". Skipping parse.`);
        return null;
      }
      return await res.json();
    } catch (err) {
      // Quietly log with console.log/info to avoid triggering build platform error alerts during server restarts
      console.log(`[API Connection Info] Web request to ${url} is waiting for server boot...`);
      return null;
    }
  };

  const refreshAllData = async () => {
    // Products
    const prodData = await safeFetchJson('/api/products');
    if (prodData) {
      setProducts(prodData);
    }

    // Commands
    const cmdData = await safeFetchJson('/api/commands');
    if (cmdData) {
      setCommands(cmdData);
    }

    // Config
    const configData = await safeFetchJson('/api/config');
    if (configData) {
      setConfig(configData);
    }

    // Stats
    const statsData = await safeFetchJson('/api/stats');
    if (statsData) {
      setStats(statsData);
    }

    // Orders
    const ordersData = await safeFetchJson('/api/orders');
    if (ordersData) {
      setOrders(ordersData);
    }

    // Mod Logs
    const modData = await safeFetchJson('/api/mod_logs');
    if (modData) {
      setModLogs(modData);
    }

    // Live Bot Status
    const statusData = await safeFetchJson('/api/bot/status');
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

    // Lightweight polling interval to mimic live updates (syncs instantly with Discord chatbot activity!)
    const interval = setInterval(refreshAllData, 4500);
    return () => clearInterval(interval);
  }, []);

  // 2. Database Action handlers
  const handleAddProduct = async (prodData: Omit<Product, 'id' | 'createdAt'>) => {
    try {
      const generatedId = 'prod-' + Math.random().toString(36).substring(4);
      const newProduct: Product = {
        id: generatedId,
        ...prodData,
        createdAt: Date.now()
      };
      
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
      });
      await refreshAllData();
    } catch (err) {
      console.error('Error adding product: ', err);
    }
  };

  const handleUpdateProduct = async (id: string, updatedFields: Partial<Product>) => {
    try {
      const existing = products.find(p => p.id === id);
      if (!existing) return;
      
      const updated = { ...existing, ...updatedFields };
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      await refreshAllData();
    } catch (err) {
      console.error('Error updating product: ', err);
    }
  };

  const handleDeleteProduct = async (id: string): Promise<void> => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Produk',
      message: 'Apakah Anda yakin ingin menghapus produk ini? Semua data stok terkait produk ini akan dihapus secara permanen.',
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
          if (res.ok) {
            await refreshAllData();
            showToast('Produk berhasil dihapus secara permanen!', 'success');
          } else {
            showToast('Gagal menghapus produk.', 'error');
          }
        } catch (err) {
          console.error('Error deleting product: ', err);
          showToast('Terjadi kesalahan koneksi saat menghapus produk.', 'error');
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleSaveBotConfig = async (updatedConfig: BotConfig) => {
    try {
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedConfig)
      });
      await refreshAllData();
    } catch (err) {
      console.error('Error saving bot config: ', err);
    }
  };

  const handleAddCustomCommand = async (cmdData: Omit<CustomCommand, 'id' | 'usageCount'>) => {
    try {
      const id = 'cmd-' + cmdData.name;
      const newCmd: CustomCommand = {
        id,
        ...cmdData,
        usageCount: 0
      };
      await fetch('/api/commands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCmd)
      });
      await refreshAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleCommand = async (id: string, active: boolean) => {
    try {
      const existing = commands.find(c => c.id === id);
      if (!existing) return;
      const updated = { ...existing, isActive: active };
      await fetch('/api/commands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      await refreshAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCustomCommand = async (id: string): Promise<void> => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Perintah Kustom',
      message: 'Apakah Anda yakin ingin menghapus perintah ini dari daftar bot Discord?',
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/commands/${id}`, { method: 'DELETE' });
          if (res.ok) {
            await refreshAllData();
            showToast('Perintah kustom berhasil dihapus!', 'success');
          } else {
            showToast('Gagal menghapus perintah kustom.', 'error');
          }
        } catch (err) {
          console.error(err);
          showToast('Terjadi kesalahan koneksi saat menghapus perintah.', 'error');
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleUpdateAutoModSettings = async (automod: BotConfig['autoMod']) => {
    try {
      const updated = { ...config, autoMod: automod };
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      await refreshAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTriggerWebhookTest = async (): Promise<boolean> => {
    if (!config.webhookUrl) return false;
    try {
      console.log('Sending webhook test payload to:', config.webhookUrl);
      const res = await fetch('/api/webhook/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl: config.webhookUrl,
          type: 'TRANSACTION_SUCCESS',
          payload: {
            orderId: 'ORD-TEST123A',
            productName: 'Discord Nitro Boost [TEST]',
            price: 49000,
            customerUsername: 'StoreTester_NPC'
          }
        })
      });
      return res.ok;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleUpdateProductStockDirectly = async (productId: string, updatedStock: string[]) => {
    try {
      const existing = products.find(p => p.id === productId);
      if (!existing) return;
      const updated = { ...existing, stock: updatedStock };
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      await refreshAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddOrderDirectly = async (newOrder: Order) => {
    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder)
      });
      await refreshAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleIncrementStatsDirectly = async (revenue: number, ordersCount: number, commandsRun: number, modActions: number) => {
    try {
      await fetch('/api/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalRevenue: stats.totalRevenue + revenue,
          totalOrders: stats.totalOrders + ordersCount,
          commandsRun: stats.commandsRun + commandsRun,
          moderationActions: stats.moderationActions + modActions
        })
      });
      await refreshAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddModLogDirectly = async (newLog: Omit<ModLog, 'id' | 'timestamp'>) => {
    try {
      const generatedId = 'mod-' + Math.random().toString(36).substring(4);
      const logItem: ModLog = {
        id: generatedId,
        ...newLog,
        timestamp: Date.now()
      };
      await fetch('/api/mod_logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logItem)
      });
      await refreshAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearModLogs = async () => {
    console.log('Pruning logs requested');
  };

  const handleRestartBot = async () => {
    setRestarting(true);
    try {
      const res = await fetch('/api/bot/restart', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setBotStatus(data.status);
        setBotOnline(data.status === "ONLINE");
        setBotError(data.error);
      }
    } catch (err) {
      console.warn("Failed signaling bot restart to back-end container daemon:", err);
    } finally {
      setTimeout(() => setRestarting(false), 2000);
    }
  };

  const handleManualMarkSuccess = async (orderId: string) => {
    try {
      const existing = orders.find(o => o.id === orderId);
      if (!existing) return;
      const updated = { ...existing, status: 'Success' as const };
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      await refreshAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetDatabase = (mode: 'clear' | 'restore') => {
    const title = mode === 'clear' ? 'Kosongkan Database' : 'Muat Ulang Demo Default';
    const message = mode === 'clear'
      ? "Apakah Anda yakin ingin MENGOSONGKAN seluruh isi database? Semua produk, pesanan, kustom perintah, dan log auto-mod akan dihapus bersih (statistik akan disetel ulang ke angka 0)."
      : "Apakah Anda yakin ingin MEMULIHKAN data demo default? Tindakan ini akan menghapus data saat ini dan memuat ulang produk, pesanan, perintah, serta log simulasi default bawaan toko.";

    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmText: mode === 'clear' ? 'Ya, Kosongkan' : 'Ya, Muat Ulang',
      cancelText: 'Batal',
      variant: mode === 'clear' ? 'danger' : 'info',
      onConfirm: async () => {
        try {
          const res = await fetch('/api/reset-db', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode })
          });
          const data = await res.json();
          if (res.ok) {
            showToast(data.message || "Operasi reset database berhasil diselesaikan!", "success");
            await refreshAllData();
          } else {
            showToast(`Gagal: ${data.error || "Gagal melakukan operasi"}`, "error");
          }
        } catch (err: any) {
          console.error(err);
          showToast(`Koneksi error: ${err.message || "Gagal menghubungi server"}`, "error");
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  return (
    <div className="flex flex-col lg:flex-row bg-[#0b0f19] text-slate-100 min-h-screen">
      
      {/* Mobile Top Navbar */}
      <div className="lg:hidden flex items-center justify-between bg-slate-900 border-b border-slate-800 px-4 py-3 sticky top-0 z-30">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Terminal className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display font-medium text-sm text-white tracking-tight">NEXUS Panel</h1>
          </div>
        </div>
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors border border-slate-700"
          aria-label="Buka Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Sidebar Backdrop Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 1. Sidebar Panel */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        botOnline={botOnline}
        botStatus={botStatus}
        botError={botError}
        dbEngine={dbEngine}
        onRestartBot={handleRestartBot}
        restarting={restarting}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        botUser={botUser}
      />

      {/* 2. Main Content Frame (Responsive layout padding and responsive margins) */}
      <main className="flex-1 ml-0 lg:ml-80 min-h-screen p-4 sm:p-6 lg:p-8 transition-all overflow-x-hidden" id="dashboard-main-view">
        
        {/* Dynamic header welcome */}
        <div id="tab-outlet-container" className="pt-2">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <BotStatsWidget 
                stats={stats} 
                orders={orders} 
                modLogs={modLogs} 
              />
              <TransactionsTable 
                orders={orders} 
                onMarkSuccess={handleManualMarkSuccess}
              />
            </div>
          )}

          {activeTab === 'products' && (
            <ProductForm 
              products={products}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
            />
          )}

          {activeTab === 'config' && (
            <BotConfigPanel 
              config={config}
              onSaveConfig={handleSaveBotConfig}
              onTriggerWebhookTest={handleTriggerWebhookTest}
              botStatus={botStatus}
              botOnline={botOnline}
              botError={botError}
              botUser={botUser}
            />
          )}

          {activeTab === 'custom-commands' && (
            <CustomCommandsPanel 
              commands={commands}
              onAddCommand={handleAddCustomCommand}
              onToggleCommand={handleToggleCommand}
              onDeleteCommand={handleDeleteCustomCommand}
            />
          )}

          {activeTab === 'automod' && (
            <AutoModPanel 
              settings={config.autoMod}
              onUpdateSettings={handleUpdateAutoModSettings}
              modLogs={modLogs}
              onClearLogs={handleClearModLogs}
            />
          )}

          {activeTab === 'simulator' && (
            <DiscordSimulator 
              products={products}
              commands={commands}
              config={config}
              onUpdateProductStock={handleUpdateProductStockDirectly}
              onAddOrder={handleAddOrderDirectly}
              onIncrementStats={handleIncrementStatsDirectly}
              onAddModLog={handleAddModLogDirectly}
              activeOrders={orders}
              botUser={botUser}
            />
          )}
        </div>
      </main>

      {/* Custom Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity duration-300">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl transition-all">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg shrink-0 ${
                  confirmModal.variant === 'danger' ? 'bg-rose-500/10 text-rose-400' :
                  confirmModal.variant === 'warning' ? 'bg-amber-500/10 text-amber-400' :
                  'bg-indigo-500/10 text-indigo-400'
                }`}>
                  <span className="text-base font-bold">⚠️</span>
                </div>
                <h3 className="text-sm font-bold text-white font-display uppercase tracking-wider">
                  {confirmModal.title}
                </h3>
              </div>
              
              <p className="text-xs text-slate-300 leading-relaxed">
                {confirmModal.message}
              </p>
            </div>
            
            <div className="flex items-center justify-end gap-3 p-4 bg-slate-950/60 border-t border-slate-850">
              <button
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs rounded-xl transition-all cursor-pointer"
              >
                {confirmModal.cancelText || 'Batal'}
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className={`px-4 py-2 font-semibold text-xs rounded-xl transition-all text-white cursor-pointer ${
                  confirmModal.variant === 'danger' ? 'bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-950/20' :
                  confirmModal.variant === 'warning' ? 'bg-amber-600 hover:bg-amber-500 shadow-lg shadow-amber-950/20' :
                  'bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-950/20'
                }`}
              >
                {confirmModal.confirmText || 'Konfirmasi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notifications stack */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl transition-all duration-300 ${
              t.type === 'success' ? 'bg-emerald-950/95 border-emerald-500/30 text-emerald-200' :
              t.type === 'error' ? 'bg-rose-950/95 border-rose-500/30 text-rose-200' :
              'bg-indigo-950/95 border-indigo-500/30 text-indigo-200'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {t.type === 'success' && <span className="text-emerald-400 font-bold">✓</span>}
              {t.type === 'error' && <span className="text-rose-400 font-bold">⚠</span>}
              {t.type === 'info' && <span className="text-indigo-400 font-bold">ℹ</span>}
            </div>
            <div className="flex-1 text-xs font-semibold leading-normal">{t.message}</div>
            <button
              onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
              className="text-slate-400 hover:text-white shrink-0 text-xs focus:outline-none cursor-pointer"
            >
              ×
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}
