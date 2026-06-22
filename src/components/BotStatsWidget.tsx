import React from 'react';
import { BotStats, Order, ModLog } from '../types';
import StatCards from './stats/StatCards';
import RevenueChart from './stats/RevenueChart';
import ActivityFeed from './stats/ActivityFeed';

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

  return (
    <div className="space-y-6">
      <StatCards stats={stats} formatIDR={formatIDR} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RevenueChart orders={orders} />
        <ActivityFeed orders={orders} modLogs={modLogs} formatIDR={formatIDR} />
      </div>
    </div>
  );
}
