import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import BotStatsWidget from './components/BotStatsWidget';
import ProductForm from './components/ProductForm';
import BotConfigPanel from './components/BotConfigPanel';
import CustomCommandsPanel from './components/CustomCommandsPanel';
import AutoModPanel from './components/AutoModPanel';
import DiscordSimulator from './components/DiscordSimulator';
import TransactionsTable from './components/TransactionsTable';
import LedgerTransactions from './components/ledger/LedgerTransactions';
import UserManagement from './components/users/UserManagement';
import { Terminal, Menu } from 'lucide-react';
import ConfirmModal from './components/common/ConfirmModal';
import ToastContainer, { Toast } from './components/common/ToastContainer';
import { useBotData } from './hooks/useBotData';
import { useBotActions } from './hooks/useBotActions';
import { fetchWithAuth as fetch } from './lib/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [restarting, setRestarting] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean; title: string; message: string;
    confirmText?: string; cancelText?: string;
    onConfirm: () => void; variant?: 'danger' | 'warning' | 'info';
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const [toasts, setToasts] = useState<Toast[]>([]);

  const timersRef = React.useRef<NodeJS.Timeout[]>([]);

  React.useEffect(() => {
    return () => {
      timersRef.current.forEach(timer => clearTimeout(timer));
    };
  }, []);

  const safeSetTimeout = (cb: () => void, ms: number) => {
    const timer = setTimeout(() => {
      cb();
      timersRef.current = timersRef.current.filter(t => t !== timer);
    }, ms);
    timersRef.current.push(timer);
    return timer;
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    safeSetTimeout(() => { setToasts(prev => prev.filter(t => t.id !== id)); }, 4500);
  };

  const {
    botOnline, botStatus, botError, botUser, dbEngine,
    products, commands, config, stats, orders, modLogs, refreshAllData, isDataLoaded
  } = useBotData();

  const botActions = useBotActions(refreshAllData, products, commands, config, stats, setConfirmModal, showToast);

  const handleClearModLogs = async () => {
    try {
      await fetch('/api/mod_logs', { method: 'DELETE' });
      await refreshAllData();
      showToast('Log Auto-Mod berhasil dikosongkan', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal mengosongkan log', 'error');
    }
  };

  const handleRestartBot = async () => {
    setRestarting(true);
    try {
      await fetch('/api/bot/restart', { method: 'POST' });
      await refreshAllData();
    } catch (err) { console.warn(err); } finally { safeSetTimeout(() => setRestarting(false), 2000); }
  };

  const handleManualMarkSuccess = async (orderId: string) => {
    try {
      const existing = orders.find(o => o.id === orderId);
      if (!existing) return;
      await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...existing, status: 'Success' }) });
      await refreshAllData();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="flex flex-col lg:flex-row bg-[#0b0f19] text-slate-100 min-h-screen">
      <div className="lg:hidden flex items-center justify-between bg-slate-900 border-b border-slate-800 px-4 py-3 sticky top-0 z-30">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Terminal className="text-white w-5 h-5" />
          </div>
          <div><h1 className="font-display font-medium text-sm text-white tracking-tight">NEXUS Panel</h1></div>
        </div>
        <button onClick={() => setIsSidebarOpen(true)} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors border border-slate-700">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {isSidebarOpen && <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-30 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}

      <Sidebar 
        activeTab={activeTab} setActiveTab={setActiveTab} botOnline={botOnline}
        botStatus={botStatus} botError={botError} dbEngine={dbEngine}
        onRestartBot={handleRestartBot} restarting={restarting} isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)} botUser={botUser}
      />

      <main className="flex-1 ml-0 lg:ml-80 min-h-screen p-4 sm:p-6 lg:p-8 transition-all overflow-x-hidden" id="dashboard-main-view">
        <div id="tab-outlet-container" className="pt-2">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <BotStatsWidget stats={stats} orders={orders} modLogs={modLogs} />
              <TransactionsTable orders={orders} onMarkSuccess={handleManualMarkSuccess} />
            </div>
          )}
          {activeTab === 'products' && (
            <ProductForm 
              products={products} onAddProduct={botActions.handleAddProduct}
              onUpdateProduct={botActions.handleUpdateProduct} onDeleteProduct={botActions.handleDeleteProduct}
            />
          )}
          {activeTab === 'users' && (
            <UserManagement />
          )}
          {activeTab === 'transactions' && (
            <LedgerTransactions />
          )}
          {activeTab === 'config' && (
            isDataLoaded ? (
              <BotConfigPanel 
                config={config} onSaveConfig={botActions.handleSaveBotConfig}
                onUpdatePartialConfig={botActions.handleUpdatePartialConfig}
                onTriggerWebhookTest={botActions.handleTriggerWebhookTest} botStatus={botStatus}
                botOnline={botOnline} botError={botError} botUser={botUser}
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-20 text-slate-400">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 mb-4"></div>
                <p>Loading configuration...</p>
              </div>
            )
          )}
          {activeTab === 'custom-commands' && (
            <CustomCommandsPanel 
              commands={commands} onAddCommand={botActions.handleAddCustomCommand}
              onToggleCommand={botActions.handleToggleCommand} onDeleteCommand={botActions.handleDeleteCustomCommand}
            />
          )}
          {activeTab === 'automod' && (
            <AutoModPanel 
              settings={config.autoMod} onUpdateSettings={botActions.handleUpdateAutoModSettings}
              modLogs={modLogs} onClearLogs={handleClearModLogs}
            />
          )}
          {activeTab === 'simulator' && (
            <DiscordSimulator 
              products={products} commands={commands} config={config}
              onUpdateProductStock={botActions.handleUpdateProductStockDirectly} onAddOrder={botActions.handleAddOrderDirectly}
              onIncrementStats={botActions.handleIncrementStatsDirectly} onAddModLog={botActions.handleAddModLogDirectly}
              activeOrders={orders} botUser={botUser}
            />
          )}
        </div>
      </main>

      {confirmModal.isOpen && (
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={confirmModal.confirmText}
          cancelText={confirmModal.cancelText}
          variant={confirmModal.variant}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts(prev => prev.filter(x => x.id !== id))} />
    </div>
  );
}
