import React, { useState } from 'react';
import { AutoModSettings, ModLog } from '../types';
import AutoModToggles from './automod/AutoModToggles';
import ModLogList from './automod/ModLogList';
import BannedWordsSettings from './automod/BannedWordsSettings';

interface AutoModPanelProps {
  settings: AutoModSettings;
  onUpdateSettings: (updated: AutoModSettings) => Promise<void>;
  modLogs: ModLog[];
  onClearLogs: () => Promise<void>;
}

export default function AutoModPanel({ settings, onUpdateSettings, modLogs, onClearLogs }: AutoModPanelProps) {
  const [savingWord, setSavingWord] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleAntiLink = async () => {
    await onUpdateSettings({ ...settings, antiLink: !settings.antiLink });
  };

  const toggleAntiSpam = async () => {
    await onUpdateSettings({ ...settings, antiSpam: !settings.antiSpam });
  };

  const handleUpdateWarnLimit = async (limit: number) => {
    await onUpdateSettings({ ...settings, warnLimit: limit });
  };

  const handleAddWord = async (newWord: string): Promise<boolean> => {
    const word = newWord.trim().toLowerCase();
    if (!word) return false;
    if (settings.bannedWords.includes(word)) {
      setError('Kata ini sudah masuk daftar hitam!');
      return false;
    }
    
    setSavingWord(true);
    const updatedWords = [...settings.bannedWords, word];
    await onUpdateSettings({ ...settings, bannedWords: updatedWords });
    setError(null);
    setSavingWord(false);
    return true;
  };

  const handleRemoveWord = async (word: string) => {
    const updatedWords = settings.bannedWords.filter(w => w !== word);
    await onUpdateSettings({ ...settings, bannedWords: updatedWords });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between" id="automod-header">
        <div>
          <h1 className="text-xl font-bold font-display text-white">Sistem Keamanan & Auto Moderasi (Auto-Mod)</h1>
          <p className="text-xs text-slate-400">Proteksi server otomatis dari tautan link ilegal, pelaku spamming, dan penggunaan kata-kata toxic</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <AutoModToggles 
            settings={settings} 
            toggleAntiLink={toggleAntiLink} 
            toggleAntiSpam={toggleAntiSpam} 
            handleUpdateWarnLimit={handleUpdateWarnLimit} 
          />
          <ModLogList modLogs={modLogs} onClearLogs={onClearLogs} />
        </div>

        <BannedWordsSettings 
          settings={settings} 
          handleAddWord={handleAddWord} 
          handleRemoveWord={handleRemoveWord} 
          savingWord={savingWord} 
          error={error} 
        />
      </div>
    </div>
  );
}
