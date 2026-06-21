import React, { useState, useRef, useEffect } from 'react';
import { 
  Terminal, 
  Send, 
  Hash, 
  Users, 
  Bell, 
  Pin, 
  Search, 
  HelpCircle, 
  PlusCircle, 
  Volume2, 
  ShieldCheck, 
  Check, 
  Copy,
  Info,
  Gift
} from 'lucide-react';
import { Product, Order, CustomCommand, BotConfig, ModLog, BotStats } from '../types';

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

interface DiscordMsg {
  id: string;
  author: {
    username: string;
    avatarUrl?: string;
    isBot: boolean;
    roleColor?: string;
  };
  content: string;
  timestamp: Date;
  embed?: {
    title?: string;
    description?: string;
    color?: string; // Hex eg "#5865F2"
    fields?: Array<{ name: string; value: string; inline?: boolean }>;
    footer?: string;
  };
  isSystem?: boolean;
}

export default function DiscordSimulator({
  products,
  commands,
  config,
  onUpdateProductStock,
  onAddOrder,
  onIncrementStats,
  onAddModLog,
  activeOrders,
  botUser
}: DiscordSimulatorProps) {
  
  // Channels
  const channels = [
    { id: 'rules', name: 'rules-rules', cat: 'INFORMASI' },
    { id: 'bot-order', name: 'bot-order', cat: 'AUTO-STORE' },
    { id: 'chat-bebas', name: 'chat-bebas', cat: 'KOMUNITAS' },
    { id: 'moderation-logs', name: 'moderation-logs', cat: 'KEAMANAN' },
  ];

  const [activeChannel, setActiveChannel] = useState('bot-order');
  const [chatInputs, setChatInputs] = useState<Record<string, string>>({
    'rules': '',
    'bot-order': '',
    'chat-bebas': '',
    'moderation-logs': ''
  });

  const [messages, setMessages] = useState<Record<string, DiscordMsg[]>>({
    'rules': [
      {
        id: 'r1',
        author: { username: 'System', isBot: true, roleColor: 'text-indigo-400' },
        content: '👋 Selamat datang di server Discord Store!',
        timestamp: new Date(),
        isSystem: true
      },
      {
        id: 'r2',
        author: { username: 'NEXUS Bot', isBot: true, roleColor: 'text-discord-blurple' },
        content: '',
        timestamp: new Date(),
        embed: {
          title: '📌 PERATURAN & INFORMASI SERVICE',
          description: '1. Dilarang melakukan tuduhan palsu tanpa bukti video / claim receipt.\n2. Proses klaim wajib menyertakan kode Order ID.\n3. Harap hubungi Admin jika terjadi gangguan sistem.\n\n*Gunakan `/buy` di channel #bot-order untuk memulai pemesanan otomatis!*',
          color: '#5865F2'
        }
      }
    ],
    'bot-order': [
      {
        id: 'b1',
        author: { username: 'NEXUS Bot', isBot: true, roleColor: 'text-discord-blurple' },
        content: '',
        timestamp: new Date(),
        embed: {
          title: '🤖 NEXUS AUTO-STORE SERVICES',
          description: 'Gunakan perintah slash berikut untuk berbelanja secara instan:\n\n' +
                       '📁 `/stock` : Menampilkan katalog produk ter-update & jumlah stok cadangan\n' +
                       '🛒 `/buy [id-produk]` : Memulai pesanan & pemrosesan kode qris bayar\n' +
                       '🔑 `/claim [order-id]` : Mengklaim serial key / akun privat setelah pembayaran transfer selesai\n' +
                       '❓ `/help` : Menampilkan daftar perintah kustom & bantuan sistem',
          color: '#5865F2'
        }
      }
    ],
    'chat-bebas': [
      {
        id: 'c1',
        author: { username: 'ryuzaki_kun', isBot: false },
        content: 'Halo gaes! Ada yang sudah beli Nitro Boost di sini? Apakah aman?',
        timestamp: new Date(Date.now() - 600000)
      },
      {
        id: 'c2',
        author: { username: 'natsu_dragneel', isBot: false },
        content: 'Sudah bro, tadi beli Spotify premium 3 bulan langsung dapet login infonya otomatis lewat Command `/claim`. Instan abis beneran!',
        timestamp: new Date(Date.now() - 300000)
      }
    ],
    'moderation-logs': [
      {
        id: 'm1',
        author: { username: 'AutoMod Log', isBot: true, roleColor: 'text-rose-400' },
        content: '',
        timestamp: new Date(),
        embed: {
          title: '🛡️ SECURE PORT STATUS: ON',
          description: 'Sistem auto-mod aktif menyaring konten tautan mencurigakan & kata kasar.',
          color: '#f23f43'
        }
      }
    ]
  });

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Scroll to bottom on message updates
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, activeChannel]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const addMessageToChannel = (channelId: string, msg: Omit<DiscordMsg, 'id' | 'timestamp'>) => {
    const newMsg: DiscordMsg = {
      ...msg,
      id: Math.random().toString(36).substring(7),
      timestamp: new Date()
    };
    setMessages(prev => ({
      ...prev,
      [channelId]: [...(prev[channelId] || []), newMsg]
    }));
  };

  const handleInputChange = (val: string) => {
    setChatInputs(prev => ({
      ...prev,
      [activeChannel]: val
    }));
  };

  const submitMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentInput = chatInputs[activeChannel]?.trim();
    if (!currentInput) return;

    // Clear input
    setChatInputs(prev => ({
      ...prev,
      [activeChannel]: ''
    }));

    // Identify sender
    const sender = 'Member_Toko';

    // 1. Post original user message
    addMessageToChannel(activeChannel, {
      author: { username: sender, isBot: false },
      content: currentInput
    });

    // 2. Automod check (ONLY in chat-bebas / community channels)
    if (activeChannel === 'chat-bebas') {
      let isViolated = false;
      let reason = '';
      let action: 'DELETE_MESSAGE' | 'WARN' = 'DELETE_MESSAGE';

      // Anti-word filter verification
      const lowerInput = currentInput.toLowerCase();
      const detectedWords = config.autoMod.bannedWords.filter(word => lowerInput.includes(word));
      
      if (detectedWords.length > 0) {
        isViolated = true;
        reason = `Menggunakan kata kasar terlarang [${detectedWords.join(', ')}]`;
        action = 'DELETE_MESSAGE';
      }

      // Anti-link verification
      else if (config.autoMod.antiLink && /(https?:\/\/|www\.)[^\s]+/gi.test(currentInput)) {
        isViolated = true;
        reason = 'Mengirimkan tautan URL eksternal (Anti-Link ON)';
        action = 'DELETE_MESSAGE';
      }

      if (isViolated) {
        // Delete message delay representation
        setTimeout(async () => {
          // Send toxic strike alert & remove text from GUI message list
          setMessages(prev => {
            const list = prev['chat-bebas'] || [];
            // replace last item with deleted string
            const updatedList = [...list];
            if (updatedList.length > 0) {
              const lastIdx = updatedList.length - 1;
              updatedList[lastIdx] = {
                ...updatedList[lastIdx],
                content: `🗑️ *[Pesan ini dihapus oleh AutoMod karena: ${reason}]*`
              };
            }
            return {
              ...prev,
              'chat-bebas': updatedList
            };
          });

          // Post warning reply
          addMessageToChannel('chat-bebas', {
            author: { username: 'NEXUS Bot', isBot: true, roleColor: 'text-discord-red' },
            content: `🛡️ Peringatan untuk **@${sender}**!`,
            embed: {
              title: '⚠️ DETEKSI PELANGGARAN AUTOMOD',
              description: `Pesan Anda di-take down otomatis.\n\n` +
                           `**Pelanggar:** @${sender}\n` +
                           `**Alasan:** ${reason}\n` +
                           `**Hukuman:** Penghapusan Pesan & Strike +1 / ${config.autoMod.warnLimit}`,
              color: '#f23f43'
            }
          });

          // Post to security-log channel!
          addMessageToChannel('moderation-logs', {
            author: { username: 'AutoMod Logger', isBot: true, roleColor: 'text-rose-400' },
            content: '',
            embed: {
              title: '🚨 AUTOMOD TRIPPED ALARM',
              description: `**Pelaku:** @${sender}\n` +
                           `**Konten:** "${currentInput}"\n` +
                           `**Tindakan:** ${action} (Pesan Dihapus)\n` +
                           `**Alasan:** ${reason}`,
              color: '#f23f43'
            }
          });

          // Increment global stats & add to Mod history documents
          await onIncrementStats(0, 0, 0, 1);
          await onAddModLog({
            userId: 'user-77881',
            username: sender,
            action: action,
            reason: reason
          });
        }, 1000);

        return; // Halt further triggers
      }
    }

    // 3. Command processor (If input starts with /)
    if (currentInput.startsWith('/')) {
      await onIncrementStats(0, 0, 1, 0); // Increment command stats

      const parts = currentInput.split(' ');
      const rawCmd = parts[0].substring(1).toLowerCase();
      const arg = parts.slice(1).join(' ').trim();

      // Check default slash commands
      if (rawCmd === 'stock') {
        setTimeout(() => {
          const embedFields = products.map(p => ({
            name: p.name,
            value: `• Price: **Rp ${p.price.toLocaleString('id-ID')}**\n• Stock: **${p.stock?.length || 0} items**\n• Tipe: *${p.type}*\n• ID: \`${p.id}\``,
            inline: false
          }));

          addMessageToChannel(activeChannel, {
            author: { username: 'NEXUS Bot', isBot: true, roleColor: 'text-discord-blurple' },
            content: 'Berikut status persediaan digital stock di database pusat:',
            embed: {
              title: '📦 STOCK PORTAL REALTIME',
              fields: embedFields.length > 0 ? embedFields : [{ name: 'Stok Kosong', value: 'Belum ada produk terdaftar' }],
              color: '#23a55a'
            }
          });
        }, 600);
      } 
      
      else if (rawCmd === 'buy') {
        if (!arg) {
          setTimeout(() => {
            addMessageToChannel(activeChannel, {
              author: { username: 'NEXUS Bot', isBot: true, roleColor: 'text-discord-red' },
              content: '❌ **Sintaks Salah!**\nSertakan ID produk.\nContoh: \`/buy prod-nitro-1m\`'
            });
          }, 450);
          return;
        }

        const matchedProduct = products.find(p => p.id === arg);
        if (!matchedProduct) {
          setTimeout(() => {
            addMessageToChannel(activeChannel, {
              author: { username: 'NEXUS Bot', isBot: true, roleColor: 'text-discord-red' },
              content: `❌ **Gagal!**\nProduk dengan ID \`${arg}\` tidak terdaftar. Gunakan \`/stock\` untuk cek list ID produk.`
            });
          }, 500);
          return;
        }

        // Generate purchase ORD simulation
        const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000).toString(16).toUpperCase();
        const txId = 'TX-' + Math.random().toString(36).substring(4).toUpperCase();

        setTimeout(() => {
          addMessageToChannel(activeChannel, {
            author: { username: 'NEXUS Bot', isBot: true, roleColor: 'text-discord-blurple' },
            content: `⏳ Menyiapkan invoice digital QRIS pembayaran untuk **@${sender}**...`
          });
        }, 300);

        setTimeout(() => {
          addMessageToChannel(activeChannel, {
            author: { username: 'NEXUS Bot', isBot: true, roleColor: 'text-discord-blurple' },
            content: '',
            embed: {
              title: '💳 PROSES TRANSAKSI QRIS SATU-KALI-BAYAR',
              description: `Pindai QRIS di bawah ini untuk membeli **${matchedProduct.name}**.\n\n` +
                           `💰 **Total Tagihan:** **Rp ${matchedProduct.price.toLocaleString('id-ID')}**\n` +
                           `📦 **ID Pemesanan:** \`${orderId}\`\n` +
                           `🔐 **Kode Referensi:** \`${txId}\`\n\n` +
                           `*Tekan tombol [SIMULASI BAYAR] di kanan bawah simulator atau ketik /pay untuk mensimulasikan transfer masuk!*`,
              color: '#f0b232',
              footer: 'Nexus Payment Coordinator System'
            }
          });

          // Save pending order
          const newOrder: Order = {
            id: orderId,
            productId: matchedProduct.id,
            productName: matchedProduct.name,
            price: matchedProduct.price,
            customerDiscordId: '381927387123',
            customerUsername: sender,
            status: 'Pending',
            transactionId: txId,
            createdAt: Date.now()
          };
          onAddOrder(newOrder);

        }, 1000);
      }

      else if (rawCmd === 'claim') {
        if (!arg) {
          setTimeout(() => {
            addMessageToChannel(activeChannel, {
              author: { username: 'NEXUS Bot', isBot: true, roleColor: 'text-discord-red' },
              content: '❌ **Sintaks Salah!**\nSertakan Order ID Anda.\nContoh: \`/claim ORD-ABCXYZ\`'
            });
          }, 300);
          return;
        }

        const matchedOrder = activeOrders.find(o => o.id === arg);
        if (!matchedOrder) {
          setTimeout(() => {
            addMessageToChannel(activeChannel, {
              author: { username: 'NEXUS Bot', isBot: true, roleColor: 'text-discord-red' },
              content: `❌ **Gagal!**\nOrder ID \`${arg}\` tidak terdaftar atau pembayaran belum divalidasi.`
            });
          }, 450);
          return;
        }

        if (matchedOrder.status === 'Claimed') {
          setTimeout(() => {
            addMessageToChannel(activeChannel, {
              author: { username: 'NEXUS Bot', isBot: true, roleColor: 'text-discord-red' },
              content: `❌ **Peringatan!**\nOrder \`${arg}\` sudah pernah diklaim sebelumnya!`
            });
          }, 450);
          return;
        }

        // Fetch product and dispatch stock item
        const matchedProduct = products.find(p => p.id === matchedOrder.productId);
        if (!matchedProduct) {
          setTimeout(() => {
            addMessageToChannel(activeChannel, {
              author: { username: 'NEXUS Bot', isBot: true, roleColor: 'text-discord-red' },
              content: '❌ Produk tersebut tidak lagi didukung di server kami!'
            });
          }, 400);
          return;
        }

        if (!matchedProduct.stock || matchedProduct.stock.length === 0) {
          setTimeout(() => {
            addMessageToChannel(activeChannel, {
              author: { username: 'NEXUS Bot', isBot: true, roleColor: 'text-discord-red' },
              content: '',
              embed: {
                title: '⚠️ PRODUK KEHABISAN STOK CADANGAN',
                description: `Pemesanan \`${arg}\` berhasil divalidasi, namun stok digital kunci kosong. Harap ping Admin untuk pengisian ulang manual segera.`,
                color: '#f23f43'
              }
            });
          }, 500);
          return;
        }

        // Disburse stock item
        const deliveredKey = matchedProduct.stock[0];
        const updatedStockList = matchedProduct.stock.slice(1);

        // Update database
        await onUpdateProductStock(matchedProduct.id, updatedStockList);
        
        // update stats revenue and counter
        await onIncrementStats(matchedOrder.price, 1, 0, 0);

        // Edit internal order model of that matching ID
        matchedOrder.status = 'Claimed';
        matchedOrder.claimedStockItem = deliveredKey;
        matchedOrder.claimedAt = Date.now();
        await onAddOrder(matchedOrder); // Overwrite / Save status

        setTimeout(() => {
          addMessageToChannel(activeChannel, {
            author: { username: 'NEXUS Bot', isBot: true, roleColor: 'text-discord-green' },
            content: '',
            embed: {
              title: '🔑 PENGIRIMAN DIGITAL SUKSES!',
              description: `Terima kasih atas pesanan Anda. Berikut detail item digital Anda:\n\n` +
                           `📦 **Item Name:** ${matchedOrder.productName}\n` +
                           `🎫 **Order ID:** \`${matchedOrder.id}\`\n` +
                           `🔓 **Kunci / Akun Lisensi:**\n\`\`\`\n${deliveredKey}\n\`\`\`\n\n` +
                           `*Kode di atas bersifat rahasia. Jangan sebar di publik chat!*`,
              color: '#23a55a'
            }
          });
        }, 800);
      }

      else if (rawCmd === 'help') {
        setTimeout(() => {
          const customCmdLines = commands
            .filter(c => c.isActive)
            .map(c => `• \`!${c.name}\` atau \`/${c.name}\` : ${c.description}`)
            .join('\n');

          addMessageToChannel(activeChannel, {
            author: { username: 'NEXUS Bot', isBot: true, roleColor: 'text-discord-blurple' },
            content: '',
            embed: {
              title: '📘 DAFTAR COMMAND TERSEDIA',
              description: `**Core Store Commands:**\n` +
                           `• \`/stock\` - Cek stock ter-update\n` +
                           `• \`/buy [id-produk]\` - Buat Tagihan QRIS\n` +
                           `• \`/claim [order-id]\` - Klaim lisensi digital setelah memesan\n\n` +
                           `**Custom Server Commands:**\n` + 
                           (customCmdLines || '*Tidak ada perintah kustom aktif.*'),
              color: '#5865F2'
            }
          });
        }, 500);
      }

      // Check in CustomCommands database
      else {
        const matchedCustom = commands.find(c => c.name === rawCmd && c.isActive);
        if (matchedCustom) {
          setTimeout(() => {
            addMessageToChannel(activeChannel, {
              author: { username: 'NEXUS Bot', isBot: true, roleColor: 'text-discord-blurple' },
              content: matchedCustom.response
            });

            // Increment usage statistical metrics
            matchedCustom.usageCount = (matchedCustom.usageCount || 0) + 1;
            // Trigger background stats update if desired or keep client-only counter
          }, 450);
        } else {
          setTimeout(() => {
            addMessageToChannel(activeChannel, {
              author: { username: 'NEXUS Bot', isBot: true, roleColor: 'text-discord-red' },
              content: `❌ Perintah \`/${rawCmd}\` tidak dapat diidentifikasi.`
            });
          }, 300);
        }
      }
    }
  };

  const handleSimulatePayment = async () => {
    // Find first pending order
    const pendingOrder = activeOrders.find(o => o.status === 'Pending');
    if (!pendingOrder) {
      addMessageToChannel(activeChannel, {
        author: { username: 'Nexus Logger', isBot: true, roleColor: 'text-amber-400' },
        content: '⚠️ Tidak ada tagihan tertunda (Pending/Unpaid) di sistem simulator. Silakan ketik perintah `/buy [id-produk]` terlebih dahulu untuk membuat pesanan baru!',
      });
      return;
    }

    pendingOrder.status = 'Success';
    await onAddOrder(pendingOrder); // update status to success in base state

    addMessageToChannel(activeChannel, {
      author: { username: 'Nexus Logger', isBot: true, roleColor: 'text-emerald-400' },
      content: '',
      embed: {
        title: '✅ PEMBAYARAN DISETUJUI & DIVALIDASI',
        description: `Penerimaan dana berlisensi ID: \`${pendingOrder.transactionId}\` telah terverifikasi!\n\n` +
                     `👤 **Pelanggan:** @${pendingOrder.customerUsername}\n` +
                     `🗳️ **Order ID:** \`${pendingOrder.id}\`\n\n` +
                     `Ketik \`/claim ${pendingOrder.id}\` di bawah ini untuk mengambil serial key secara otomatis sekarang!`,
        color: '#23a55a'
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[80vh]">
      
      {/* Simulation sidebar controller info */}
      <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-xl">
        <div className="space-y-4">
          <h2 className="text-sm font-bold font-display text-white flex items-center gap-1.5">
            <Terminal className="text-amber-400 w-4.5 h-4.5" />
            <span>Panduan Simulator Bot</span>
          </h2>
          <div className="text-[11px] text-slate-400 leading-normal space-y-3">
            <p>
              Gunakan simulator interaktif di samping kanan untuk menguji fungsionalitas pengiriman otomatis dan sensor auto moderasi.
            </p>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-850 font-mono space-y-2 text-slate-300">
              <span className="text-indigo-400 font-semibold block">COBA UTAS BERIKUT:</span>
              <ul className="space-y-1">
                <li>1. Ketik <span className="text-slate-100 font-bold">/stock</span></li>
                <li>2. Ketik <span className="text-slate-100 font-bold">/buy prod-nitro-1m</span></li>
                <li>3. Klik tombol <span className="text-emerald-400 font-bold">SIMULASI QRIS DITERIMA</span> di bawah</li>
                <li>4. Ketik <span className="text-slate-100 font-bold">/claim [ORDER_ID]</span></li>
              </ul>
            </div>
            
            <div className="p-3 bg-rose-950/10 rounded-xl border border-rose-900/10 font-mono space-y-1.5 text-slate-300">
              <span className="text-rose-400 font-semibold block">PENGUJIAN MODERASI:</span>
              <p>Masuk ke channel <strong className="text-slate-100">#chat-bebas</strong>, ketik kata sembarang seperti "anjing" atau taruh link url. Lihat respon instan bot!</p>
            </div>
          </div>
        </div>

        {/* Big simulator triggers */}
        <div className="space-y-2.5 pt-4 border-t border-slate-850">
          <button
            onClick={handleSimulatePayment}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all shrink-0"
          >
            <Check className="w-4 h-4" />
            <span>Simulasi QRIS Diterima</span>
          </button>
          
          <div className="p-3 bg-slate-950/45 rounded-lg border border-slate-850 text-center">
            <span className="text-[10px] text-slate-500 font-mono block">Order ID Menunggu Klaim:</span>
            <div className="flex items-center justify-center gap-1.5 mt-1 font-mono text-xs font-bold text-slate-200">
              {activeOrders.find(o => o.status === 'Success') ? (
                <>
                  <span>{activeOrders.find(o => o.status === 'Success')?.id}</span>
                  <button
                    onClick={() => copyToClipboard(activeOrders.find(o => o.status === 'Success')?.id || '', 'ord-active')}
                    className="p-1 hover:bg-slate-900 text-slate-400 hover:text-white rounded"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  {copiedId === 'ord-active' && <span className="text-[9px] text-emerald-400">Copied!</span>}
                </>
              ) : (
                <span className="text-slate-500 italic">None</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Actual discord graphic screen */}
      <div className="lg:col-span-3 bg-[#313338] rounded-2xl flex border border-slate-800 overflow-hidden shadow-2xl h-full">
        {/* Discord channels sidebar list (Darker background) */}
        <div className="hidden md:flex w-60 bg-[#2b2d31] flex-col justify-between shrink-0 select-none text-slate-400 text-xs font-medium border-r border-[#202225]">
          <div>
            {/* Header guild title */}
            <div className="h-12 border-b border-[#202225] flex items-center justify-between px-4 font-bold text-white tracking-wide">
              <h3>⭐ NEXUS PREMIUM</h3>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-4 ring-[#2b2d31]" />
            </div>

            {/* list rows groups */}
            <div className="p-3 space-y-4">
              <div>
                <span className="px-1 text-[10px] font-bold text-[#949ba4] uppercase tracking-wider block mb-1">
                  INFORMASI PORTAL
                </span>
                <button
                  onClick={() => setActiveChannel('rules')}
                  className={`w-full px-2 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                    activeChannel === 'rules' ? 'bg-[#35373c] text-white' : 'hover:bg-[#35373c]/40 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-1.5">
                    <Hash className="w-4 h-4 text-[#80848e]" />
                    <span>rules-rules</span>
                  </div>
                </button>
              </div>

              <div>
                <span className="px-1 text-[10px] font-bold text-[#949ba4] uppercase tracking-wider block mb-1">
                  AUTO-STORE CORESHOP
                </span>
                <button
                  onClick={() => setActiveChannel('bot-order')}
                  className={`w-full px-2 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                    activeChannel === 'bot-order' ? 'bg-[#35373c] text-white' : 'hover:bg-[#35373c]/40 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-1.5">
                    <Hash className="w-4 h-4 text-[#80848e]" />
                    <span>bot-order</span>
                  </div>
                </button>
              </div>

              <div>
                <span className="px-1 text-[10px] font-bold text-[#949ba4] uppercase tracking-wider block mb-1">
                  KOMUNITAS
                </span>
                <button
                  onClick={() => setActiveChannel('chat-bebas')}
                  className={`w-full px-2 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                    activeChannel === 'chat-bebas' ? 'bg-[#35373c] text-white' : 'hover:bg-[#35373c]/40 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-1.5">
                    <Hash className="w-4 h-4 text-[#80848e]" />
                    <span>chat-bebas</span>
                  </div>
                </button>
              </div>

              <div>
                <span className="px-1 text-[10px] font-bold text-[#949ba4] uppercase tracking-wider block mb-1">
                  LOG KEAMANAN
                </span>
                <button
                  onClick={() => setActiveChannel('moderation-logs')}
                  className={`w-full px-2 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                    activeChannel === 'moderation-logs' ? 'bg-[#35373c] text-white' : 'hover:bg-[#35373c]/40 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-1.5">
                    <Hash className="w-4 h-4 text-[#80848e]" />
                    <span>moderation-logs</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Dummy Bottom User banner profile */}
          <div className="h-14 bg-[#232428] px-3 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-indigo-500 font-bold flex items-center justify-center text-xs text-white">
                  M
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute bottom-0 right-0 border-2 border-[#232428]" />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-white text-[11px] block truncate">Member_Toko</span>
                <span className="text-[9px] text-[#949ba4] block">#0001</span>
              </div>
            </div>
          </div>
        </div>

        {/* Discord Chat Area panel */}
        <div className="flex-1 bg-[#313338] flex flex-col justify-between">
          {/* Header channel bar */}
          <div className="h-12 border-b border-[#202225] flex items-center justify-between px-4 shrink-0 shadow-sm text-slate-300">
            <div className="flex items-center space-x-2 min-w-0">
              <Hash className="w-5 h-5 text-slate-500 shrink-0" />
              {/* Dropdown for mobile */}
              <div className="md:hidden">
                <select
                  value={activeChannel}
                  onChange={(e) => setActiveChannel(e.target.value)}
                  className="bg-[#2b2d31] text-white font-bold text-xs rounded border border-slate-700 py-1 px-2 focus:outline-none"
                >
                  {channels.map(c => (
                    <option key={c.id} value={c.id}>#{c.name}</option>
                  ))}
                </select>
              </div>
              
              {/* Static text for desktop */}
              <span className="hidden md:inline font-bold text-white text-sm truncate">
                {channels.find(c => c.id === activeChannel)?.name}
              </span>
              
              <span className="hidden sm:inline text-xs text-slate-400 border-l border-slate-700 pl-2">
                Simulasi interaksi Discord
              </span>
            </div>
            <div className="flex items-center space-x-3 text-slate-400">
              <Bell className="w-4.5 h-4.5 hover:text-white cursor-pointer" />
              <Pin className="w-4.5 h-4.5 hover:text-white cursor-pointer" />
              <Users className="w-4.5 h-4.5 hover:text-white cursor-pointer" />
            </div>
          </div>

          {/* Message history layout */}
          <div 
            className="flex-1 p-4 overflow-y-auto space-y-4 font-sans text-xs scroll-smooth text-slate-300"
            ref={chatContainerRef}
          >
            {messages[activeChannel]?.map((msg) => {
              const displayName = (msg.author.isBot && botUser?.tag) ? botUser.tag : msg.author.username;
              return (
                <div key={msg.id} className="flex items-start space-x-3 group hover:bg-[#2e3035]/25 p-1 -mx-2 px-2 rounded-md transition-colors">
                  {/* Custom Avatar logo representation */}
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

                  {/* Render simulated Embed Box if present */}
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

                      {/* Fields display */}
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
            })}
          </div>

          {/* Bottom input form block panel */}
          <div className="p-4 shrink-0 bg-[#313338]">
            <form onSubmit={submitMessage} className="relative">
              <input
                type="text"
                value={chatInputs[activeChannel] || ''}
                onChange={e => handleInputChange(e.target.value)}
                placeholder={`Ketik pesan ke #${channels.find(c => c.id === activeChannel)?.name} (Gunakan / untuk commands)`}
                className="w-full bg-[#383a40] border border-transparent rounded-lg px-4 py-3 pl-11 text-xs text-[#dbdee1] placeholder-[#80848e] focus:outline-none focus:ring-0 select-text"
              />
              <div className="absolute left-3 top-3 text-[#b5bac1] hover:text-white cursor-pointer">
                <PlusCircle className="w-5 h-5" />
              </div>
              <button 
                type="submit"
                className="absolute right-3 top-2 px-2.5 py-1.5 bg-[#4e5058] hover:bg-[#5865F2] text-white rounded text-[10px] font-bold"
              >
                KIRIM
              </button>
            </form>
            <div className="flex items-center justify-between text-[10px] text-[#949ba4] font-semibold mt-1 px-1">
              <span>Gunakan <strong className="text-slate-300 font-bold">/help</strong> atau <strong className="text-slate-300 font-bold">/stock</strong> untuk memulai belanja</span>
              <span>Online Latency: 4ms</span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
