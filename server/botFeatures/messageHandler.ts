import { Message, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GuildMember } from "discord.js";
import { dbService } from "../../src/db/db_service.ts";
import { ModLog } from "../../src/types.ts";
import { discordState } from "../discordState.ts";
import { updateLiveStock } from "./liveStock.ts";

const activeTimeouts = new Set<NodeJS.Timeout>();

const userStrikes = new Map<string, { count: number, resetAt: number }>();
const userSpamWindow = new Map<string, number[]>();

let gcCounter = 0;
const GC_THRESHOLD = 500;

const runGarbageCollection = () => {
  const now = Date.now();
  for (const [userId, strikes] of userStrikes.entries()) {
    if (strikes.resetAt < now) {
      userStrikes.delete(userId);
    }
  }
  for (const [userId, msgs] of userSpamWindow.entries()) {
    const validMsgs = msgs.filter(t => now - t < 3000);
    if (validMsgs.length === 0) {
      userSpamWindow.delete(userId);
    } else {
      userSpamWindow.set(userId, validMsgs);
    }
  }
};

export const cleanupMessageHandlerTimeouts = () => {
  for (const timer of activeTimeouts) {
    clearTimeout(timer);
  }
  activeTimeouts.clear();
  userStrikes.clear();
  userSpamWindow.clear();
};

const handleViolation = async (message: Message, reason: string, warnLimit: number) => {
  const userId = message.author.id;
  const username = message.author.username;
  
  // Strike Logic with 24-hour expiration
  let strikes = userStrikes.get(userId);
  if (!strikes || strikes.resetAt < Date.now()) {
    strikes = { count: 0, resetAt: Date.now() + 24 * 60 * 60 * 1000 };
  }
  strikes.count += 1;
  userStrikes.set(userId, strikes);

  try {
    await message.delete().catch(() => {});
    
    const warnResponse = await message.channel.send(
      `⚠️ **Auto-Moderasi**: <@${userId}>, pesan Anda dihapus. Alasan: ${reason}. (Peringatan ${strikes.count}/${warnLimit})`
    );
    const timer = setTimeout(() => { 
      warnResponse.delete().catch(() => {});
      activeTimeouts.delete(timer);
    }, 6000);
    activeTimeouts.add(timer);

    const generatedLogId = "mod-" + Math.random().toString(36).substring(4);
    const newLog: ModLog = {
      id: generatedLogId,
      userId: userId,
      username: username,
      action: "DELETE_MESSAGE & STRIKE",
      reason: reason,
      timestamp: Date.now()
    };
    await dbService.saveModLog(newLog);

    const stats = await dbService.getStats();
    await dbService.updateStats({ moderationActions: stats.moderationActions + 1 });

    if (strikes.count >= warnLimit) {
      strikes.count = 0; // reset immediately to prevent duplicate timeout API calls
      userStrikes.set(userId, strikes);

      if (message.member && message.member.moderatable) {
        await message.member.timeout(60 * 60 * 1000, `Mencapai limit pelanggaran AutoMod (${warnLimit} peringatan)`);
        
        await dbService.saveModLog({
          id: "mod-" + Math.random().toString(36).substring(4),
          userId: userId,
          username: username,
          action: "TIMEOUT",
          reason: `AutoMod limit reached (${warnLimit} peringatan)`,
          timestamp: Date.now()
        });
        
        await message.channel.send(`🚫 **AutoMod Action**: Member **${username}** telah di-timeout karena mengulangi pelanggaran (limit tercapai).`);
      }
    }
  } catch (modErr) {
    console.error("[Discord Bot] Failed executing auto-mod response action:", modErr);
  }
};

export const handleMessageCreate = async (message: Message) => {
  // Lazy GC check to prevent memory leak
  gcCounter++;
  if (gcCounter > GC_THRESHOLD) {
    runGarbageCollection();
    gcCounter = 0;
  }

  const currentConfig = await dbService.getConfig();

  // Saweria Webhook Listener MVP
  if (message.webhookId && currentConfig.depositWebhookChannelId && message.channel.id === currentConfig.depositWebhookChannelId) {
    // Saweria Webhook messages contain the donation details usually in an embed or raw text
    // "Nama Donatur just donated Rp10,000"
    let contentToParse = message.content || "";
    if (message.embeds && message.embeds.length > 0) {
      const embed = message.embeds[0];
      contentToParse += `\n${embed.title || ""}\n${embed.description || ""}`;
    }

    // Strip markdown bold and italic for easier regex matching
    contentToParse = contentToParse.replace(/\*/g, '').replace(/_/g, '');

    const saweriaMatch = contentToParse.match(/(.*?)\s+just\s+donated\s+(?:Rp|IDR)\s*([\d.,]+)/i) 
      || contentToParse.match(/(.*?)\s+telah\s+berdonasi\s+sebesar\s+(?:Rp|IDR)\s*([\d.,]+)/i) 
      || contentToParse.match(/(.*?)\s+berdonasi\s+(?:Rp|IDR)\s*([\d.,]+)/i);

    if (saweriaMatch) {
      const donorName = saweriaMatch[1].trim();
      const amountStr = saweriaMatch[2].replace(/[^\d]/g, ''); // bersihkan titik/koma
      const amount = parseInt(amountStr, 10);
      
      if (!isNaN(amount) && amount > 0) {
        try {
          const topupRes = await dbService.processTopup(message.id, donorName, amount);
          if (topupRes.success) {
            await message.reply(`✅ **Auto-Topup Success!** Saldo untuk user **${donorName}** (ID: ${topupRes.userId}) telah ditambahkan sebesar **Rp ${amount.toLocaleString('id-ID')}**.`);
          } else if (topupRes.error === "Message already processed") {
            // Already processed, ignore
          } else {
            await message.reply(`⚠️ **Auto-Topup Failed!** Gagal menambahkan saldo untuk **${donorName}**: ${topupRes.error}`);
          }
        } catch (err: any) {
          console.error("Failed to process Saweria Topup:", err);
        }
      }
    }
    return; // Don't process command if it's a webhook
  }

  if (message.author.bot) return;

  const content = message.content?.trim() || "";
  if (!content) return; 

  const prefix = currentConfig.prefix || "!";

  // ---- AUTO MODERATION LAYER ----
  const autoMod = currentConfig.autoMod;
  const isOwner = currentConfig.ownerId && message.author.id === currentConfig.ownerId;
  
  if (autoMod && !isOwner) {
    let violated = false;
    let violationReason = "";

    // 1. Anti-Spam Check (Sliding Window 3 seconds, max 5 messages)
    if (autoMod.antiSpam) {
      const now = Date.now();
      const spamWindow = 3000;
      let userMsgs = userSpamWindow.get(message.author.id) || [];
      userMsgs = userMsgs.filter(t => now - t < spamWindow);
      userMsgs.push(now);
      userSpamWindow.set(message.author.id, userMsgs);

      if (userMsgs.length > 5) {
        violated = true;
        violationReason = "Spamming (mengirim terlalu banyak pesan dalam waktu singkat)";
      }
    }

    if (autoMod.antiLink && !violated) {
      const urlRegex = /(https?:\/\/[^\s]+)/gi;
      if (urlRegex.test(content)) {
        violated = true;
        violationReason = "Mengirimkan link/tautan eksternal (Anti-Link Aktif)";
      }
    }

    if (autoMod.bannedWords && autoMod.bannedWords.length > 0 && !violated) {
      const lowerContent = content.toLowerCase();
      for (const word of autoMod.bannedWords) {
        if (word && lowerContent.includes(word.toLowerCase())) {
          violated = true;
          violationReason = `Mengirim pesan mengandung kata terlarang: "${word}"`;
          break;
        }
      }
    }

    if (violated) {
      await handleViolation(message, violationReason, autoMod.warnLimit || 3);
      return;
    }
  }

  // ---- CUSTOM COMMANDS LAYER ----
  if (content.startsWith(prefix)) {
    const cmdTrigger = content.slice(prefix.length).split(" ")[0].toLowerCase();
    const args = content.slice(prefix.length + cmdTrigger.length).trim().split(" ");

    if (cmdTrigger === "claim") {
      const orderId = args[0]?.trim();
      if (!orderId) {
        await message.reply(`❌ **Claim error**: Sila gunakan format \`${prefix}claim <ID_PEMESANAN>\``);
        return;
      }

      try {
        const claimRes = await dbService.processClaim(orderId, message.author.id, message.author.username);

        if (!claimRes.success || !claimRes.claimItem || !claimRes.orderDetails) {
          await message.reply(`❌ **Claim Error**: ${claimRes.error || "Gagal memproses klaim."}`);
          return;
        }

        const claimItem = claimRes.claimItem;
        const foundOrder = claimRes.orderDetails;

        try {
          const dmChannel = await message.author.createDM();
          await dmChannel.send(`🎉 **TERIMA KASIH TELAH BERBELANJA DI NEXUS CORESHOP!**\n\n📌 **Detail Pembelian**:\n- **No Order ID**: \`${foundOrder.id}\`\n- **Nama Produk**: **${foundOrder.productName}**\n- **Barang Digital / Lisensi Anda**:\n\`\`\`\n${claimItem}\n\`\`\`\n*Harapan kami Anda menyukai produk kami. Jangan sungkan menghubungi representatif developer kami jika ada kendala.*`);
          await message.reply(`✅ **Claim berhasil!** Berkas digital Anda berhasil dikirim ke personal messages DM Discord @${message.author.username}. Harap periksa Inbox DM Anda!`);
        } catch (dmErr) {
          await message.reply(`✅ **Klaim berhasil diproses!** Namun, bot gagal mengirim produk ke DM karena pengaturan privasi Discord Anda.\nSilakan **Izinkan Pesan Langsung (Allow Direct Messages)** dari server ini, lalu hubungi Admin untuk meminta pengiriman ulang produk Anda.`);
        }
        
        if (discordState.client) {
            updateLiveStock(discordState.client);
        }

      } catch (claimErr: any) {
        console.error("[Discord Bot] Error claiming item:", claimErr);
        await message.reply(`❌ Terjadi kesalahan fatal sewaktu klaim stok: ${claimErr.message}`);
      }
      return;
    }

    if (cmdTrigger === "help") {
      const customCommands = await dbService.getCommands();
      const activeCmds = customCommands.filter((c: any) => c.isActive).map((c: any) => `\`${prefix}${c.name}\``).join(", ");
      
      let helpMsg = `🤖 **Daftar Perintah ${discordState.client?.user?.username || "Bot"}**\n\n`;
      helpMsg += `🔹 \`${prefix}claim <ID_PEMESANAN>\` - Mengklaim pesanan produk (jika sudah lunas)\n`;
      helpMsg += `🔹 \`${prefix}stock\` - Menampilkan Live Stock produk\n`;
      helpMsg += `🔹 \`${prefix}help\` - Menampilkan daftar pesan bantuan ini\n`;
      
      if (activeCmds) {
        helpMsg += `\n**✨ Perintah Tambahan Server:**\n${activeCmds}`;
      }
      
      try {
        await message.reply(helpMsg);
      } catch(e) {}
      return;
    }

    if (cmdTrigger === "stock" || cmdTrigger === "livestock") {
      try {
        const products = await dbService.getProducts();
        
        let description = `Last Update: <t:${Math.floor(Date.now() / 1000)}:R>\n------------------------------------------------\n`;
        
        if (products.length === 0) {
          description += "*Belum ada produk yang dijual saat ini.*";
        } else {
          products.forEach(p => {
            const stockAmt = p.stock && Array.isArray(p.stock) ? p.stock.length : 0;
            description += `👑 **${p.name}** 👑\n\n`;
            description += `• ${p.name} #📦|${(p.category || 'PRODUK').toUpperCase().replace(/\s+/g, '-')}\n`;
            description += `➡ Code : **${p.id}**\n`;
            description += `➡ Stock : ${stockAmt > 0 ? stockAmt + ' 🟩' : '🟥'}\n`;
            description += `➡ Price : ${p.price.toLocaleString('id-ID')} 🔏\n`;
            description += `------------------------------------------------\n`;
          });
        }

        const stockEmbed = new EmbedBuilder()
          .setTitle('🎇 PRODUCT LIST 🎇')
          .setDescription(description)
          .setColor('#00ffff'); 

        const row1 = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('buy_btn')
            .setLabel('Buy')
            .setEmoji('🛒')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('growid_btn')
            .setLabel('Set GrowID')
            .setEmoji('📖')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('qris_btn')
            .setLabel('QRIS Deposit')
            .setEmoji('🪪')
            .setStyle(ButtonStyle.Secondary)
        );
        
        const row2 = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('balance_btn')
            .setLabel('Balance')
            .setEmoji('💳')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('depo_world_btn')
            .setLabel('Deposit World')
            .setEmoji('🌍')
            .setStyle(ButtonStyle.Secondary)
        );

        await message.reply({ embeds: [stockEmbed], components: [row1 as any, row2 as any] });
      } catch(e: any) {
        console.error("[Discord Bot] Live stock error:", e);
        await message.reply("❌ Gagal memuat Live Stock: " + e.message);
      }
      return;
      }

    const customCommands = await dbService.getCommands();
    const matchedCmd = customCommands.find(c => c.name.toLowerCase() === cmdTrigger && c.isActive);

    if (matchedCmd) {
      try {
        await message.reply(matchedCmd.response);
        matchedCmd.usageCount += 1;
        await dbService.saveCommand(matchedCmd);

        const stats = await dbService.getStats();
        await dbService.updateStats({ commandsRun: stats.commandsRun + 1 });
      } catch (cmdErr) {
        console.error("[Discord Bot] Failed responding to custom commands trigger:", cmdErr);
      }
    }
  }
};
