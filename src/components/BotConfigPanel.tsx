import React, { useState, useEffect } from 'react';
import { BotConfig } from '../types';
import BotProfileCard from './config/BotProfileCard';
import BotConfigForm from './config/BotConfigForm';
import WebhookSettings from './config/WebhookSettings';

interface BotConfigPanelProps {
  config: BotConfig;
  onSaveConfig: (updated: BotConfig) => Promise<void>;
  onTriggerWebhookTest: () => Promise<boolean>;
  botStatus: "ONLINE" | "CONNECTING" | "OFFLINE" | "ERROR";
  botOnline: boolean;
  botError: any;
  botUser?: any;
}

export default function BotConfigPanel({ 
  config, onSaveConfig, onTriggerWebhookTest, botStatus, botOnline, botError, botUser
}: BotConfigPanelProps) {
  
  const [prefix, setPrefix] = useState(config.prefix || '!');
  const [statusText, setStatusText] = useState(config.statusText || '');
  const [statusType, setStatusType] = useState<BotConfig['statusType']>(config.statusType || 'PLAYING');
  const [webhookUrl, setWebhookUrl] = useState(config.webhookUrl || '');
  const [autoClaimOnPayment, setAutoClaimOnPayment] = useState(config.autoClaimOnPayment !== false);
  const [greetingMessage, setGreetingMessage] = useState(config.greetingMessage || '');
  const [botToken, setBotToken] = useState((config.botToken && config.botToken !== 'NONE') ? config.botToken : '');

  const [isEditing, setIsEditing] = useState(!config.botToken || config.botToken === 'NONE');
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (!isDirty) {
      setPrefix(config.prefix || '!');
      setStatusText(config.statusText || '');
      setStatusType(config.statusType || 'PLAYING');
      setWebhookUrl(config.webhookUrl || '');
      setAutoClaimOnPayment(config.autoClaimOnPayment !== false);
      setGreetingMessage(config.greetingMessage || '');
      setBotToken((config.botToken && config.botToken !== 'NONE') ? config.botToken : '');
    }
  }, [config, isDirty]);

  useEffect(() => {
    if (!config.botToken || config.botToken === 'NONE') {
      setIsEditing(true);
    }
  }, [config.botToken]);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 fade-in">
      {!isEditing && config.botToken && config.botToken !== 'NONE' ? (
        <BotProfileCard 
          config={config} setIsEditing={setIsEditing} 
          botStatus={botStatus} botUser={botUser} botError={botError} 
          botToken={config.botToken} 
        />
      ) : (
        <BotConfigForm 
          config={config} onSaveConfig={onSaveConfig} setIsEditing={setIsEditing}
          botToken={botToken} setBotToken={setBotToken} prefix={prefix} setPrefix={setPrefix}
          statusText={statusText} setStatusText={setStatusText} statusType={statusType}
          setStatusType={setStatusType} webhookUrl={webhookUrl} setWebhookUrl={setWebhookUrl}
          autoClaimOnPayment={autoClaimOnPayment} setAutoClaimOnPayment={setAutoClaimOnPayment}
          greetingMessage={greetingMessage} setGreetingMessage={setGreetingMessage} setIsDirty={setIsDirty}
        />
      )}

      {isEditing && (
        <WebhookSettings 
          webhookUrl={webhookUrl} setWebhookUrl={setWebhookUrl} 
          greetingMessage={greetingMessage} setGreetingMessage={setGreetingMessage}
          onTriggerWebhookTest={onTriggerWebhookTest} setIsDirty={setIsDirty}
        />
      )}
    </div>
  );
}
