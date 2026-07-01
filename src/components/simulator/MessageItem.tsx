import React from 'react';
import { DiscordMsg } from './types';

interface MessageItemProps {
  msg: DiscordMsg;
  botUser?: any;
}

export default function MessageItem({ msg, botUser }: MessageItemProps & { key?: React.Key }) {
  const displayName = (msg.author.isBot && botUser?.tag) ? botUser.tag : msg.author.username;

  return (
    <div className="flex items-start space-x-3 group hover:bg-[#2e3035]/25 p-1 -mx-2 px-2 rounded-md transition-colors">
      <div className="shrink-0 pt-0.5">
        {msg.author.isBot && botUser?.avatar ? (
          <img 
            src={botUser.avatar} 
            alt={displayName} 
            referrerPolicy="no-referrer"
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white select-none ${
            msg.author.isBot ? 'bg-indigo-600' : 'bg-slate-700 animate-pulse'
          }`}>
            {displayName && displayName[0] ? displayName[0].toUpperCase() : "U"}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline space-x-2">
          <span className={`font-semibold hover:underline cursor-pointer ${msg.author.roleColor || 'text-white'}`}>
            {displayName}
          </span>
          {msg.author.isBot && (
            <span className="bg-[#5865f2] text-white font-bold text-[8px] px-1 py-0.25 rounded transform shrink-0 tracking-wide">
              BOT
            </span>
          )}
          <span className="text-[10px] text-slate-500">
            Hari ini pukul {msg.timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {msg.content && (
          <p className="mt-1 text-[#dbdee1] leading-relaxed break-words whitespace-pre-wrap selection:bg-indigo-500/35">
            {msg.content}
          </p>
        )}

        {msg.embed && (
          <div 
            className="mt-2 border-l-4 rounded bg-[#2b2d31] p-4 max-w-md shadow-md space-y-3"
            style={{ borderLeftColor: msg.embed.color || '#5865F2' }}
          >
            {msg.embed.title && (
              <h4 className="font-bold text-white text-[13px] leading-tight font-display">
                {msg.embed.title}
              </h4>
            )}
            {msg.embed.description && (
              <p className="text-slate-300 leading-normal whitespace-pre-wrap break-words">
                {msg.embed.description}
              </p>
            )}

            {msg.embed.fields && msg.embed.fields.length > 0 && (
              <div className="grid grid-cols-1 gap-2.5 mt-2">
                {msg.embed.fields.map((f, fi) => (
                  <div key={fi} className="text-xs">
                    <span className="font-semibold text-white block mb-1">{f.name}</span>
                    <div className="text-slate-300 whitespace-pre-wrap">{f.value}</div>
                  </div>
                ))}
              </div>
            )}

            {msg.embed.footer && (
              <div className="text-[9px] text-slate-500 uppercase font-semibold font-mono border-t border-[#35373c]/50 pt-2">
                {msg.embed.footer}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
