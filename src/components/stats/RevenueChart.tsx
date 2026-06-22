import React, { useMemo } from 'react';
import { Order } from '../../types';

interface RevenueChartProps {
  orders: Order[];
}

export default function RevenueChart({ orders }: RevenueChartProps) {
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
  );
}
