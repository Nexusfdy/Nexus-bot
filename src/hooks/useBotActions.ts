import { BotConfig, CustomCommand, ModLog, Order, Product } from "../types";

export function useBotActions(
  refreshAllData: () => Promise<void>,
  products: Product[],
  commands: CustomCommand[],
  config: BotConfig,
  stats: any,
  setConfirmModal: any,
  showToast: any
) {
  const handleAddProduct = async (prodData: Omit<Product, 'id' | 'createdAt'>) => {
    try {
      const generatedId = 'prod-' + Math.random().toString(36).substring(4);
      const newProduct: Product = { id: generatedId, ...prodData, createdAt: Date.now() };
      await fetch('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newProduct) });
      await refreshAllData();
    } catch (err) { console.error(err); }
  };

  const handleUpdateProduct = async (id: string, updatedFields: Partial<Product>) => {
    try {
      const existing = products.find(p => p.id === id);
      if (!existing) return;
      await fetch('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...existing, ...updatedFields }) });
      await refreshAllData();
    } catch (err) { console.error(err); }
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
          if (res.ok) { await refreshAllData(); showToast('Produk berhasil dihapus secara permanen!', 'success'); }
          else { showToast('Gagal menghapus produk.', 'error'); }
        } catch (err) { showToast('Terjadi kesalahan koneksi saat menghapus produk.', 'error'); }
        setConfirmModal((prev: any) => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleSaveBotConfig = async (updatedConfig: BotConfig) => {
    try {
      await fetch('/api/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedConfig) });
      await refreshAllData();
    } catch (err) { console.error(err); }
  };

  const handleAddCustomCommand = async (cmdData: Omit<CustomCommand, 'id' | 'usageCount'>) => {
    try {
      await fetch('/api/commands', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: 'cmd-' + cmdData.name, ...cmdData, usageCount: 0 }) });
      await refreshAllData();
    } catch (err) { console.error(err); }
  };

  const handleToggleCommand = async (id: string, active: boolean) => {
    try {
      const existing = commands.find(c => c.id === id);
      if (!existing) return;
      await fetch('/api/commands', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...existing, isActive: active }) });
      await refreshAllData();
    } catch (err) { console.error(err); }
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
          if (res.ok) { await refreshAllData(); showToast('Perintah kustom berhasil dihapus!', 'success'); }
          else { showToast('Gagal menghapus perintah kustom.', 'error'); }
        } catch (err) { showToast('Terjadi kesalahan koneksi saat menghapus perintah.', 'error'); }
        setConfirmModal((prev: any) => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleUpdateAutoModSettings = async (automod: BotConfig['autoMod']) => {
    try {
      await fetch('/api/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...config, autoMod: automod }) });
      await refreshAllData();
    } catch (err) { console.error(err); }
  };

  const handleTriggerWebhookTest = async (): Promise<boolean> => {
    if (!config.webhookUrl) return false;
    try {
      const res = await fetch('/api/webhook/simulate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl: config.webhookUrl, type: 'TRANSACTION_SUCCESS',
          payload: { orderId: 'ORD-TEST123A', productName: 'Discord Nitro Boost [TEST]', price: 49000, customerUsername: 'StoreTester_NPC' }
        })
      });
      return res.ok;
    } catch (err) { return false; }
  };

  const handleUpdateProductStockDirectly = async (productId: string, updatedStock: string[]) => {
    try {
      const existing = products.find(p => p.id === productId);
      if (!existing) return;
      await fetch('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...existing, stock: updatedStock }) });
      await refreshAllData();
    } catch (err) { console.error(err); }
  };

  const handleAddOrderDirectly = async (newOrder: Order) => {
    try {
      await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newOrder) });
      await refreshAllData();
    } catch (err) { console.error(err); }
  };

  const handleIncrementStatsDirectly = async (revenue: number, ordersCount: number, commandsRun: number, modActions: number) => {
    try {
      await fetch('/api/stats', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalRevenue: stats.totalRevenue + revenue,
          totalOrders: stats.totalOrders + ordersCount,
          commandsRun: stats.commandsRun + commandsRun,
          moderationActions: stats.moderationActions + modActions
        })
      });
      await refreshAllData();
    } catch (err) { console.error(err); }
  };

  const handleAddModLogDirectly = async (newLog: Omit<ModLog, 'id' | 'timestamp'>) => {
    try {
      await fetch('/api/mod_logs', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'mod-' + Math.random().toString(36).substring(4), timestamp: Date.now(), ...newLog })
      });
      await refreshAllData();
    } catch (err) { console.error(err); }
  };

  return {
    handleAddProduct, handleUpdateProduct, handleDeleteProduct,
    handleSaveBotConfig, handleAddCustomCommand, handleToggleCommand,
    handleDeleteCustomCommand, handleUpdateAutoModSettings, handleTriggerWebhookTest,
    handleUpdateProductStockDirectly, handleAddOrderDirectly, handleIncrementStatsDirectly,
    handleAddModLogDirectly
  };
}
