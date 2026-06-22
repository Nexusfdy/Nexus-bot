import React, { useState, useRef, useEffect } from 'react';
import { Product, Order, CustomCommand, BotConfig, ModLog } from '../types';
import MessageItem from './simulator/MessageItem';
import ChannelList from './simulator/ChannelList';
import ChatInput from './simulator/ChatInput';
import SimulatorGuide from './simulator/SimulatorGuide';
import { useSimulatorChat } from './simulator/useSimulatorChat';

interface DiscordSimulatorProps {
  products: Product[];
  commands: CustomCommand[];
  config: BotConfig;
  onUpdateProductStock: (id: string, newStock: string[]) => Promise<void>;
  onAddOrder: (order: Order) => Promise<void>;
  onIncrementStats: (revenue: number, orders: number, commandsRun: number, modActions: number) => Promise<void>;
  onAddModLog: (log: Omit<ModLog, 'id' | 'timestamp'>) => Promise<void>;
  activeOrders: Order[];
  botUser?: any;
}

export default function DiscordSimulator({
  products, commands, config, onUpdateProductStock, onAddOrder,
  onIncrementStats, onAddModLog, activeOrders, botUser
}: DiscordSimulatorProps) {
  
  const channels = [
    { id: 'rules', name: 'rules-rules', cat: 'INFORMASI' },
    { id: 'bot-order', name: 'bot-order', cat: 'AUTO-STORE' },
    { id: 'chat-bebas', name: 'chat-bebas', cat: 'KOMUNITAS' },
    { id: 'moderation-logs', name: 'moderation-logs', cat: 'KEAMANAN' },
  ];

  const [activeChannel, setActiveChannel] = useState('bot-order');
  const [chatInputs, setChatInputs] = useState<Record<string, string>>({
    'rules': '', 'bot-order': '', 'chat-bebas': '', 'moderation-logs': ''
  });

  const { messages, setMessages, addMessageToChannel, handleSimulatePayment, submitMessage: hookSubmitMessage } = useSimulatorChat({
    products, commands, config, onUpdateProductStock, onAddOrder, onIncrementStats, onAddModLog, activeOrders
  });

  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, activeChannel]);

  const submitMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentInput = chatInputs[activeChannel]?.trim();
    if (!currentInput) return;

    setChatInputs(prev => ({ ...prev, [activeChannel]: '' }));
    
    await hookSubmitMessage(activeChannel, currentInput);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[80vh]">
      <SimulatorGuide 
        activeOrders={activeOrders} 
        handleSimulatePayment={handleSimulatePayment} 
        activeChannel={activeChannel} 
      />

      <div className="lg:col-span-3 bg-[#313338] rounded-2xl flex border border-slate-800 overflow-hidden shadow-2xl h-full">
        <ChannelList channels={channels} activeChannel={activeChannel} setActiveChannel={setActiveChannel} />
        
        <div className="flex-1 bg-[#313338] flex flex-col justify-between">
          <div className="h-12 border-b border-[#202225] flex items-center px-4 shrink-0 shadow-sm text-slate-300">
            <span className="font-bold text-white text-sm truncate uppercase tracking-widest pl-2">
              # {channels.find(c => c.id === activeChannel)?.name}
            </span>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-4 font-sans text-xs scroll-smooth text-slate-300" ref={chatContainerRef}>
            {messages[activeChannel]?.map((msg) => (
              <MessageItem key={msg.id} msg={msg} botUser={botUser} />
            ))}
          </div>

          <ChatInput 
            value={chatInputs[activeChannel] || ''} 
            onChange={(val) => setChatInputs(prev => ({ ...prev, [activeChannel]: val }))} 
            onSubmit={submitMessage} 
            channelName={channels.find(c => c.id === activeChannel)?.name || ''} 
          />
        </div>
      </div>
    </div>
  );
}
