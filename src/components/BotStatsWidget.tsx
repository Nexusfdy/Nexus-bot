import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  ShoppingBag, 
  Layers, 
  Activity, 
  DollarSign, 
  Users, 
  ShieldAlert, 
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame
} from 'lucide-react';
import { BotStats, Order, ModLog } from '../types';

interface BotStatsWidgetProps {
  stats: BotStats;
  orders: Order[];
  modLogs: ModLog[];
}

export default function BotStatsWidget({ stats, orders, modLogs }: BotStatsWidgetProps) {
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num);
  };

  const statCards = [
    { 
      label: 'Pendapatan Total', 
      value: formatIDR(stats.totalRevenue), 
      sub: 'Penjualan bot tersinkronisasi', 
      icon: DollarSign, 
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
    },
    { 
      label: 'Total Pesanan / Transaksi', 
      value: stats.totalOrders.toString() + ' Transaksi', 
      sub: 'Klaim instant di-deliver', 
      icon: ShoppingBag, 
      color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' 
    },
    { 
      label: 'Server Discord Aktif', 
      value: stats.activeServers.toString() + ' Server', 
      sub: 'Server store & moderasi', 
      icon: Users, 
      color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
    },
    { 
      label: 'Automod Strikes & Warns', 
      value: stats.moderationActions.toString() + ' Kasus', 
      sub: 'Ditindak bot secara otomatis', 
      icon: ShieldAlert, 
      color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
    },
  ];

  // Prepare custom SVG micro-chart data points for revenue trend
  // Let's create a beautiful SVG area chart based on last few orders
  const svgRevenuePoints = useMemo(() => {
    let points = [0, 0, 0, 0, 0, 0, 0];
    if (orders && orders.length > 0) {
      const sorted = [...orders].sort((a, b) => a.createdAt - b.createdAt);
      let cumulative = 0;
      const lengthDiff = Math.max(0, 7 - sorted.length);
      for (let i = 0; i < 7; i++) {
        if (i < lengthDiff) {
          points[i] = 0;
        } else {
          const orderIdx = i - lengthDiff;
          if (sorted[orderIdx]) {
            cumulative += sorted[orderIdx].price;
          }
          points[i] = cumulative;
        }
      }
    } else {
      points = [0, 0, 0, 0, 0, 0, 0];
    }

    const width = 500;
    const height = 120;
    const padding = 15;
    
    const xStep = (width - padding * 2) / (points.length - 1);
    const maxVal = Math.max(...points) || 100000;
    const minVal = Math.min(...points);
    const valRange = maxVal - minVal || 100000;

    const coordinates = points.map((p, i) => {
      const x = padding + i * xStep;
      // Invert Y direction since 0 is top
      const y = height - padding - ((p - minVal) / valRange) * (height - padding * 2);
      return { x, y };
    });

    const pathData = coordinates.reduce((acc, coord, idx) => {
      return acc + (idx === 0 ? `M ${coord.x} ${coord.y}` : ` L ${coord.x} ${coord.y}`);
    }, '');

    const areaData = pathData + ` L ${coordinates[coordinates.length - 1].x} ${height - padding} L ${coordinates[0].x} ${height - padding} Z`;

    return { pathData, areaData, coordinates };
  }, [orders]);

  return (
    <div className="space-y-6">
      {/* Upper Grid Card Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4" id="stats-grid">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div 
              key={idx} 
              className={`p-6 bg-slate-900 border ${card.color} rounded-2xl flex items-center justify-between shadow-xl backdrop-blur-md hover:scale-[1.02] transition-transform duration-350`}
            >
              <div className="space-y-2">
                <span className="text-xs text-slate-400 block font-medium uppercase font-display tracking-widest">{card.label}</span>
                <h3 className="text-2xl font-bold font-display text-white tracking-tight">{card.value}</h3>
                <p className="text-[11px] text-slate-400 font-medium">{card.sub}</p>
              </div>
              <div className={`p-3 rounded-xl ${card.color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid Charts & Recent logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Custom Interactive SVG Chart (Left & Center) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-md font-semibold text-white font-display">Grafik Tren Penjualan & Klaim Toko</h2>
              <p className="text-xs text-slate-400">Statistik performa Auto-Store dalam seminggu terakhir</p>
            </div>
            <div className="flex items-center space-x-2 bg-slate-950/60 p-1.5 rounded-lg border border-slate-800 text-xs text-slate-300 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
              <span>Siklus Penjualan (IDR)</span>
            </div>
          </div>

          <div className="relative w-full bg-slate-950/40 rounded-xl p-4 border border-slate-800/50">
            {/* Custom SVG Line Area Graph */}
            <svg className="w-full h-36" viewBox="0 0 500 120" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              
              {/* Inner Grid Lines */}
              <line x1="0" y1="15" x2="500" y2="15" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3,3" />
              <line x1="0" y1="52" x2="500" y2="52" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3,3" />
              <line x1="0" y1="90" x2="500" y2="90" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3,3" />

              {/* Area path */}
              <path d={svgRevenuePoints.areaData} fill="url(#chartGrad)" />

              {/* Line path */}
              <path d={svgRevenuePoints.pathData} fill="none" stroke="#6366f1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />

              {/* Coordinates dots */}
              {svgRevenuePoints.coordinates.map((coord, idx) => (
                <g key={idx}>
                  <circle cx={coord.x} cy={coord.y} r="3.5" fill="#1e1f22" stroke="#6366f1" strokeWidth="1.5" />
                  <circle cx={coord.x} cy={coord.y} r="8" fill="#6366f1" fillOpacity="0.1" className="hover:fill-opacity-30 cursor-pointer transition-all" />
                </g>
              ))}
            </svg>

            {/* Custom Grid labels */}
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-2 px-1">
              <span>Senin</span>
              <span>Selasa</span>
              <span>Rabu</span>
              <span>Kamis</span>
              <span>Jumat</span>
              <span>Sabtu</span>
              <span>Minggu (Hari Ini)</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-800/60 text-center">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-mono">Pesanan Terjawab</div>
              <div className="text-base font-bold text-emerald-400">100%</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-mono">Kecepatan Klaim</div>
              <div className="text-base font-bold text-indigo-400">&lt; 0.8s</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-mono">Command Success Rate</div>
              <div className="text-base font-bold text-blue-400">99.8%</div>
            </div>
          </div>
        </div>

        {/* Recent Transactions & Mod Alerts Logs (Right panel) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-md font-semibold text-white font-display">Aktivitas Real-time</h2>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-indigo-500/15 text-indigo-400 animate-pulse">
                • LOGS
              </span>
            </div>

            {/* Scroller logs list */}
            <div className="space-y-3 max-h-[290px] overflow-y-auto pr-1">
              {orders.slice(0, 4).map((order) => (
                <div key={order.id} className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/40 flex items-start gap-2.5">
                  <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                    order.status === 'Claimed' 
                      ? 'bg-emerald-500/10 text-emerald-400' 
                      : 'bg-amber-500/10 text-amber-400'
                  }`}>
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-200 truncate">{order.customerUsername}</span>
                      <span className="text-[9px] font-mono text-slate-500">
                        {new Date(order.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Membeli <span className="text-indigo-400 font-medium">{order.productName}</span> — status: <span className="font-medium text-emerald-400">{order.status}</span>
                    </p>
                    <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-900 font-mono text-[9px] text-slate-500">
                      <span>ID: {order.id}</span>
                      <span>{formatIDR(order.price)}</span>
                    </div>
                  </div>
                </div>
              ))}

              {modLogs.length > 0 ? (
                modLogs.slice(0, 3).map((log) => (
                  <div key={log.id} className="p-3 bg-rose-950/10 rounded-xl border border-rose-900/10 flex items-start gap-2.5">
                    <div className="p-1.5 rounded-lg shrink-0 mt-0.5 bg-rose-500/10 text-rose-400">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-rose-300 truncate">AutoMod: @{log.username}</span>
                        <span className="text-[9px] font-mono text-slate-500">
                          {new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Tindakan: <span className="text-rose-400 font-medium">{log.action}</span> - {log.reason}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-500">
                  Belum ada log moderasi yang dilaporkan.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>Dukungan Webhook: OK</span>
            <span className="text-indigo-400 hover:underline cursor-pointer flex items-center gap-1">
              Selengkapnya <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
