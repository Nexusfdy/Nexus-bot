import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { CustomCommand } from '../types';
import CreateCommandModal from './commands/CreateCommandModal';
import CommandsLeaderboard from './commands/CommandsLeaderboard';
import CommandList from './commands/CommandList';

interface CustomCommandsPanelProps {
  commands: CustomCommand[];
  onAddCommand: (cmd: Omit<CustomCommand, 'id' | 'usageCount'>) => Promise<void>;
  onToggleCommand: (id: string, active: boolean) => Promise<void>;
  onDeleteCommand: (id: string) => Promise<void>;
}

export default function CustomCommandsPanel({ 
  commands, 
  onAddCommand, 
  onToggleCommand, 
  onDeleteCommand 
}: CustomCommandsPanelProps) {
  
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="space-y-6">
      {/* Upper header */}
      <div className="flex items-center justify-between" id="commands-header">
        <div>
          <h1 className="text-xl font-bold font-display text-white">Kustomisasi Perintah (Custom Commands)</h1>
          <p className="text-xs text-slate-400">Buat perintah baru secara dinamis. Hasilnya langsung bisa dipakai di Discord via prefix atau slash commands!</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Perintah Baru</span>
        </button>
      </div>

      <CommandsLeaderboard commands={commands} />

      <CommandList 
        commands={commands} 
        onToggleCommand={onToggleCommand} 
        onDeleteCommand={onDeleteCommand} 
      />

      {showModal && (
        <CreateCommandModal 
          onClose={() => setShowModal(false)} 
          onAddCommand={onAddCommand} 
        />
      )}
    </div>
  );
}
