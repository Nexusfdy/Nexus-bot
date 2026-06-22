import React from 'react';
import BotStatusCard from './sidebar/BotStatusCard';
import SidebarHeader from './sidebar/SidebarHeader';
import SidebarMenu from './sidebar/SidebarMenu';
import SidebarFooter from './sidebar/SidebarFooter';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  botOnline: boolean;
  botStatus: "ONLINE" | "CONNECTING" | "OFFLINE" | "ERROR";
  botError: any;
  dbEngine: string;
  onRestartBot: () => void;
  restarting: boolean;
  isOpen: boolean;
  onClose: () => void;
  botUser?: any;
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  botOnline, 
  botStatus,
  botError,
  dbEngine,
  onRestartBot, 
  restarting,
  isOpen,
  onClose,
  botUser
}: SidebarProps) {
  
  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    onClose();
  };

  return (
    <aside 
      className={`w-80 bg-slate-900 border-r border-slate-800 flex flex-col justify-between h-screen fixed top-0 left-0 z-40 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`} 
      id="sidebar-container"
    >
      <div>
        <SidebarHeader onClose={onClose} />

        <BotStatusCard 
          botOnline={botOnline} 
          botStatus={botStatus} 
          botError={botError} 
          botUser={botUser} 
          restarting={restarting} 
          onRestartBot={onRestartBot} 
        />

        <SidebarMenu activeTab={activeTab} handleTabClick={handleTabClick} />
      </div>

      <SidebarFooter dbEngine={dbEngine} />
    </aside>
  );
}
