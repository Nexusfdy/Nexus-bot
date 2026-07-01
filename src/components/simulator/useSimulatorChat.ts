import { useState, useCallback, useEffect, useRef } from 'react';
import { DiscordMsg } from './types';
import { Product, Order, CustomCommand, BotConfig, ModLog } from '../../types';

interface UseSimulatorChatProps {
  products: Product[];
  commands: CustomCommand[];
  config: BotConfig;
  onUpdateProductStock: (id: string, newStock: string[]) => Promise<void>;
  onAddOrder: (order: Order) => Promise<void>;
  onIncrementStats: (revenue: number, orders: number, commandsRun: number, modActions: number) => Promise<void>;
  onAddModLog: (log: Omit<ModLog, 'id' | 'timestamp'>) => Promise<void>;
  activeOrders: Order[];
}

export function useSimulatorChat({
  products, commands, config, onUpdateProductStock, onAddOrder,
  onIncrementStats, onAddModLog, activeOrders
}: UseSimulatorChatProps) {
  
  const [messages, setMessages] = useState<Record<string, DiscordMsg[]>>({
    'rules': [
      { id: 'r1', author: { username: 'System', isBot: true, roleColor: 'text-indigo-400' }, content: '👋 Selamat datang di server Discord Store!', timestamp: new Date(), isSystem: true },
      { id: 'r2', author: { username: 'NEXUS Bot', isBot: true, roleColor: 'text-discord-blurple' }, content: '', timestamp: new Date(), embed: { title: '📌 PERATURAN & INFORMASI SERVICE', description: '1. Dilarang melakukan tuduhan palsu tanpa bukti video / claim receipt.\n2. Proses klaim wajib menyertakan kode Order ID.\n3. Harap hubungi Admin jika terjadi gangguan sistem.\n\n*Gunakan `/buy` di channel #bot-order untuk memulai pemesanan otomatis!*', color: '#5865F2' } }
    ],
    'bot-order': [
      { id: 'b1', author: { username: 'NEXUS Bot', isBot: true, roleColor: 'text-discord-blurple' }, content: '', timestamp: new Date(), embed: { title: '🤖 NEXUS AUTO-STORE SERVICES', description: 'Gunakan perintah slash berikut untuk berbelanja secara instan:\n\n📁 `/stock` : Menampilkan katalog produk ter-update & jumlah stok cadangan\n🛒 `/buy [id-produk]` : Memulai pesanan & pemrosesan kode qris bayar\n🔑 `/claim [order-id]` : Mengklaim serial key / akun privat setelah pembayaran transfer selesai\n❓ `/help` : Menampilkan daftar perintah kustom & bantuan sistem', color: '#5865F2' } }
    ],
    'chat-bebas': [
      { id: 'c1', author: { username: 'ryuzaki_kun', isBot: false }, content: 'Halo gaes! Ada yang sudah beli Nitro Boost di sini? Apakah aman?', timestamp: new Date(Date.now() - 600000) },
      { id: 'c2', author: { username: 'natsu_dragneel', isBot: false }, content: 'Sudah bro, tadi beli Spotify premium 3 bulan langsung dapet login infonya otomatis lewat Command `/claim`. Instan abis beneran!', timestamp: new Date(Date.now() - 300000) }
    ],
    'moderation-logs': [
      { id: 'm1', author: { username: 'AutoMod Log', isBot: true, roleColor: 'text-rose-400' }, content: '', timestamp: new Date(), embed: { title: '🛡️ SECURE PORT STATUS: ON', description: 'Sistem auto-mod aktif menyaring konten tautan mencurigakan & kata kasar.', color: '#f23f43' } }
    ],
    'live-stock': []
  });

  const timersRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach(timer => clearTimeout(timer));
    };
  }, []);

  const safeSetTimeout = useCallback((cb: () => void, ms: number) => {
    const timer = setTimeout(() => {
      cb();
      timersRef.current = timersRef.current.filter(t => t !== timer);
    }, ms);
    timersRef.current.push(timer);
    return timer;
  }, []);

  const addMessageToChannel = useCallback((channelId: string, msg: Omit<DiscordMsg, 'id' | 'timestamp'>) => {
    const newMsg: DiscordMsg = {
      ...msg,
      id: Math.random().toString(36).substring(7),
      timestamp: new Date()
    };
    setMessages(prev => ({ ...prev, [channelId]: [...(prev[channelId] || []), newMsg] }));
  }, []);

  useEffect(() => {
    if (!config.liveStockChannel) return;
    const channelId = config.liveStockChannel; 

    const renderLiveStock = () => {
      let desc = "👑 **Terakhir Update:** Just now\n\n**Daftar Produk Kami**\n⚠️ **Belum ada produk saat ini.**";
      if (products.length > 0) {
        const stockList = products.map(p => {
            const count = p.stock?.length || 0;
            const stockStatus = count > 0 ? `✅ In Stock (${count})` : `❌ Out of Stock (0)`;
            return `📦 **${p.name}**\n- Kode: ${p.id.substring(0, 4).toUpperCase()}\n- Harga: **Rp${p.price.toLocaleString('id-ID')}**\n- Stok: ${stockStatus}`;
        }).join('\n\n');
        desc = `👑 **Terakhir Update:** Just now\n\n**Daftar Produk Kami**\n${stockList}`;
      }

      setMessages(prev => {
        const updated = { ...prev };
        let channelMsgs = updated[channelId] || [];
        // Replace previous live stock message if exists
        channelMsgs = channelMsgs.filter(m => !(m.embed?.title === "🤖 Nixs Store"));
        channelMsgs.push({
          id: Math.random().toString(36).substring(7),
          timestamp: new Date(),
          author: { username: 'NEXUS Bot', isBot: true, roleColor: 'text-discord-blurple' },
          content: '',
          embed: {
            title: "🤖 Nixs Store",
            description: desc,
            color: '#00FF00',
            footer: 'AutoStore by GUE NDIRI | ' + new Date().toLocaleString()
          }
        });
        updated[channelId] = channelMsgs;
        return updated;
      });
    };

    renderLiveStock();
    const iv = setInterval(renderLiveStock, 60000);
    return () => clearInterval(iv);
  }, [config.liveStockChannel, products]);

  const handleSimulatePayment = async (activeChannel: string) => {
    const pendingOrder = activeOrders.find(o => o.status === 'Pending');
    if (!pendingOrder) {
      addMessageToChannel(activeChannel, {
        author: { username: 'Nexus Logger', isBot: true, roleColor: 'text-amber-400' },
        content: '⚠️ Tidak ada tagihan tertunda (Pending/Unpaid) di sistem simulator. Silakan ketik perintah `/buy [id-produk]` terlebih dahulu untuk membuat pesanan baru!'
      });
      return;
    }

    pendingOrder.status = 'Success';
    await onAddOrder(pendingOrder);

    addMessageToChannel(activeChannel, {
      author: { username: 'Nexus Logger', isBot: true, roleColor: 'text-emerald-400' },
      content: '',
      embed: {
        title: '✅ PEMBAYARAN DISETUJUI & DIVALIDASI',
        description: `Penerimaan dana berlisensi ID: \`${pendingOrder.transactionId}\` telah terverifikasi!\n\n👤 **Pelanggan:** @${pendingOrder.customerUsername}\n🗳️ **Order ID:** \`${pendingOrder.id}\`\n\nKetik \`/claim ${pendingOrder.id}\` di bawah ini untuk mengambil serial key secara otomatis sekarang!`,
        color: '#23a55a'
      }
    });
  };

  const submitMessage = async (activeChannel: string, currentInput: string) => {
    const sender = 'Member_Toko';

    addMessageToChannel(activeChannel, { author: { username: sender, isBot: false }, content: currentInput });

    if (activeChannel === 'chat-bebas') {
      let isViolated = false;
      let reason = '';
      let action: 'DELETE_MESSAGE' | 'WARN' = 'DELETE_MESSAGE';

      const lowerInput = currentInput.toLowerCase();
      const detectedWords = config.autoMod.bannedWords.filter(word => lowerInput.includes(word));
      
      if (detectedWords.length > 0) {
        isViolated = true;
        reason = `Menggunakan kata kasar terlarang [${detectedWords.join(', ')}]`;
      } else if (config.autoMod.antiLink && /(https?:\/\/|www\.)[^\s]+/gi.test(currentInput)) {
        isViolated = true;
        reason = 'Mengirimkan tautan URL eksternal (Anti-Link ON)';
      }

      if (isViolated) {
        safeSetTimeout(async () => {
          setMessages(prev => {
            const list = prev['chat-bebas'] || [];
            const updatedList = [...list];
            if (updatedList.length > 0) {
              const lastIdx = updatedList.length - 1;
              updatedList[lastIdx] = { ...updatedList[lastIdx], content: `🗑️ *[Pesan ini dihapus oleh AutoMod karena: ${reason}]*` };
            }
            return { ...prev, 'chat-bebas': updatedList };
          });

          addMessageToChannel('chat-bebas', {
            author: { username: 'NEXUS Bot', isBot: true, roleColor: 'text-discord-red' },
            content: `🛡️ Peringatan untuk **@${sender}**!`,
            embed: { title: '⚠️ DETEKSI PELANGGARAN AUTOMOD', description: `Pesan Anda di-take down otomatis.\n\n**Pelanggar:** @${sender}\n**Alasan:** ${reason}\n**Hukuman:** Penghapusan Pesan`, color: '#f23f43' }
          });

          addMessageToChannel('moderation-logs', {
            author: { username: 'AutoMod Logger', isBot: true, roleColor: 'text-rose-400' },
            content: '',
            embed: { title: '🚨 AUTOMOD TRIPPED ALARM', description: `**Pelaku:** @${sender}\n**Konten:** "${currentInput}"\n**Tindakan:** ${action} (Pesan Dihapus)\n**Alasan:** ${reason}`, color: '#f23f43' }
          });

          await onIncrementStats(0, 0, 0, 1);
          await onAddModLog({ userId: 'user-77881', username: sender, action, reason });
        }, 1000);
        return;
      }
    }

    if (currentInput.startsWith('/')) {
      await onIncrementStats(0, 0, 1, 0);
      const parts = currentInput.split(' ');
      const rawCmd = parts[0].substring(1).toLowerCase();
      const arg = parts.slice(1).join(' ').trim();

      if (rawCmd === 'stock') {
        safeSetTimeout(() => {
          const embedFields = products.map(p => ({
            name: p.name, value: `• Price: **Rp ${p.price.toLocaleString('id-ID')}**\n• Stock: **${p.stock?.length || 0} items**\n• Tipe: *${p.type}*\n• ID: \`${p.id}\``, inline: false
          }));
          addMessageToChannel(activeChannel, {
            author: { username: 'NEXUS Bot', isBot: true, roleColor: 'text-discord-blurple' },
            content: 'Berikut status persediaan digital stock di database pusat:',
            embed: { title: '📦 STOCK PORTAL REALTIME', fields: embedFields.length > 0 ? embedFields : [{ name: 'Stok Kosong', value: 'Belum ada produk terdaftar' }], color: '#23a55a' }
          });
        }, 600);
      } else if (rawCmd === 'buy') {
        if (!arg) {
          safeSetTimeout(() => addMessageToChannel(activeChannel, { author: { username: 'NEXUS Bot', isBot: true, roleColor: 'text-discord-red' }, content: '❌ **Sintaks Salah!**\nSertakan ID produk.\nContoh: `/buy prod-nitro-1m`' }), 450);
          return;
        }
        const matchedProduct = products.find(p => p.id === arg);
        if (!matchedProduct) {
          safeSetTimeout(() => addMessageToChannel(activeChannel, { author: { username: 'NEXUS Bot', isBot: true, roleColor: 'text-discord-red' }, content: `❌ **Gagal!**\nProduk dengan ID \`${arg}\` tidak terdaftar. Gunakan \`/stock\` untuk cek list ID produk.` }), 500);
          return;
        }
        const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000).toString(16).toUpperCase();
        const txId = 'TX-' + Math.random().toString(36).substring(4).toUpperCase();
        safeSetTimeout(() => addMessageToChannel(activeChannel, { author: { username: 'NEXUS Bot', isBot: true, roleColor: 'text-discord-blurple' }, content: `⏳ Menyiapkan invoice digital QRIS pembayaran untuk **@${sender}**...` }), 300);
        safeSetTimeout(() => {
          addMessageToChannel(activeChannel, {
            author: { username: 'NEXUS Bot', isBot: true, roleColor: 'text-discord-blurple' },
            content: '',
            embed: { title: '💳 PROSES TRANSAKSI QRIS SATU-KALI-BAYAR', description: `Pindai QRIS di bawah ini untuk membeli **${matchedProduct.name}**.\n\n💰 **Total Tagihan:** **Rp ${matchedProduct.price.toLocaleString('id-ID')}**\n📦 **ID Pemesanan:** \`${orderId}\`\n🔐 **Kode Referensi:** \`${txId}\`\n\n*Tekan tombol [SIMULASI BAYAR] di kanan bawah simulator atau ketik /pay untuk mensimulasikan transfer masuk!*`, color: '#f0b232', footer: 'Nexus Payment Coordinator System' }
          });
          onAddOrder({ id: orderId, productId: matchedProduct.id, productName: matchedProduct.name, price: matchedProduct.price, customerDiscordId: '381927387123', customerUsername: sender, status: 'Pending', transactionId: txId, createdAt: Date.now() });
        }, 1000);
      } else if (rawCmd === 'claim') {
        if (!arg) {
          safeSetTimeout(() => addMessageToChannel(activeChannel, { author: { username: 'NEXUS Bot', isBot: true, roleColor: 'text-discord-red' }, content: '❌ **Sintaks Salah!**\nSertakan Order ID Anda.\nContoh: `/claim ORD-ABCXYZ`' }), 300);
          return;
        }
        const matchedOrder = activeOrders.find(o => o.id === arg);
        if (!matchedOrder) {
           safeSetTimeout(() => addMessageToChannel(activeChannel, { author: { username: 'NEXUS Bot', isBot: true, roleColor: 'text-discord-red' }, content: `❌ **Gagal!**\nOrder ID \`${arg}\` tidak terdaftar atau pembayaran belum divalidasi.` }), 450);
           return;
        }
        if (matchedOrder.status === 'Claimed') {
           safeSetTimeout(() => addMessageToChannel(activeChannel, { author: { username: 'NEXUS Bot', isBot: true, roleColor: 'text-discord-red' }, content: `❌ **Peringatan!**\nOrder \`${arg}\` sudah pernah diklaim sebelumnya!` }), 450);
           return;
        }
        const matchedProduct = products.find(p => p.id === matchedOrder.productId);
        if (!matchedProduct) {
          safeSetTimeout(() => addMessageToChannel(activeChannel, { author: { username: 'NEXUS Bot', isBot: true, roleColor: 'text-discord-red' }, content: '❌ Produk tersebut tidak lagi didukung di server kami!' }), 400);
          return;
        }
        if (!matchedProduct.stock || matchedProduct.stock.length === 0) {
          safeSetTimeout(() => addMessageToChannel(activeChannel, { author: { username: 'NEXUS Bot', isBot: true, roleColor: 'text-discord-red' }, content: '', embed: { title: '⚠️ PRODUK KEHABISAN STOK CADANGAN', description: `Pemesanan \`${arg}\` berhasil divalidasi, namun stok digital kunci kosong. Harap ping Admin untuk pengisian ulang manual segera.`, color: '#f23f43' } }), 500);
          return;
        }
        const deliveredKey = matchedProduct.stock[0];
        const updatedStockList = matchedProduct.stock.slice(1);
        await onUpdateProductStock(matchedProduct.id, updatedStockList);
        await onIncrementStats(matchedOrder.price, 1, 0, 0);

        matchedOrder.status = 'Claimed';
        matchedOrder.claimedStockItem = deliveredKey;
        matchedOrder.claimedAt = Date.now();
        await onAddOrder(matchedOrder);

        safeSetTimeout(() => addMessageToChannel(activeChannel, { author: { username: 'NEXUS Bot', isBot: true, roleColor: 'text-discord-green' }, content: '', embed: { title: '🔑 PENGIRIMAN DIGITAL SUKSES!', description: `Terima kasih atas pesanan Anda. Berikut detail item digital Anda:\n\n📦 **Item Name:** ${matchedOrder.productName}\n🎫 **Order ID:** \`${matchedOrder.id}\`\n🔓 **Kunci / Akun Lisensi:**\n\`\`\`\n${deliveredKey}\n\`\`\`\n\n*Kode di atas bersifat rahasia. Jangan sebar di publik chat!*`, color: '#23a55a' } }), 800);
      } else if (rawCmd === 'help') {
        safeSetTimeout(() => {
          const customCmdLines = commands.filter(c => c.isActive).map(c => `• \`!${c.name}\` atau \`/${c.name}\` : ${c.description}`).join('\n');
          addMessageToChannel(activeChannel, { author: { username: 'NEXUS Bot', isBot: true, roleColor: 'text-discord-blurple' }, content: '', embed: { title: '📘 DAFTAR COMMAND TERSEDIA', description: `**Core Store Commands:**\n• \`/stock\` - Cek stock ter-update\n• \`/buy [id-produk]\` - Buat Tagihan QRIS\n• \`/claim [order-id]\` - Klaim lisensi digital setelah memesan\n\n**Custom Server Commands:**\n` + (customCmdLines || '*Tidak ada perintah kustom aktif.*'), color: '#5865F2' } });
        }, 500);
      } else {
        const matchedCustom = commands.find(c => c.name === rawCmd && c.isActive);
        if (matchedCustom) {
          safeSetTimeout(() => {
            addMessageToChannel(activeChannel, { author: { username: 'NEXUS Bot', isBot: true, roleColor: 'text-discord-blurple' }, content: matchedCustom.response });
            matchedCustom.usageCount = (matchedCustom.usageCount || 0) + 1;
          }, 450);
        } else {
          safeSetTimeout(() => addMessageToChannel(activeChannel, { author: { username: 'NEXUS Bot', isBot: true, roleColor: 'text-discord-red' }, content: `❌ Perintah \`/${rawCmd}\` tidak dapat diidentifikasi.` }), 300);
        }
      }
    }
  };

  return { messages, setMessages, addMessageToChannel, handleSimulatePayment, submitMessage };
}
