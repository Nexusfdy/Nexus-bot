import { Message, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { dbService } from "../../src/db/db_service.ts";
import { ModLog } from "../../src/types.ts";
import { discordState } from "../discordState.ts";

export const handleMessageCreate = async (message: Message) => {
  if (message.author.bot) return;

  const content = message.content?.trim() || "";
  if (!content) return; 

  const currentConfig = await dbService.getConfig();
  const prefix = currentConfig.prefix || "!";

  // ---- AUTO MODERATION LAYER ----
  const autoMod = currentConfig.autoMod;
  if (autoMod) {
    let violated = false;
    let violationReason = "";

    if (autoMod.antiLink) {
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
      try {
        await message.delete();
        const warnResponse = await message.channel.send(
          `⚠️ **Auto-Moderasi Nexus**: @${message.author.username}, pesan Anda dihapus. Alasan: ${violationReason}.`
        );
        setTimeout(() => { warnResponse.delete().catch(() => {}); }, 6000);

        const generatedLogId = "mod-" + Math.random().toString(36).substring(4);
        const newLog: ModLog = {
          id: generatedLogId,
          userId: message.author.id,
          username: message.author.username,
          action: "DELETE_MESSAGE",
          reason: violationReason,
          timestamp: Date.now()
        };
        await dbService.saveModLog(newLog);

        const stats = await dbService.getStats();
        await dbService.updateStats({ moderationActions: stats.moderationActions + 1 });
      } catch (modErr) {
        console.error("[Discord Bot] Failed executing auto-mod response action:", modErr);
      }
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
        const orders = await dbService.getOrders();
        const foundOrder = orders.find(o => o.id.toLowerCase() === orderId.toLowerCase());

        if (!foundOrder) {
          await message.reply(`❌ **Claim Error**: ID Pemesanan \`${orderId}\` tidak terdaftar atau nihil dalam sistem.`);
          return;
        }

        if (foundOrder.status === "Claimed") {
          await message.reply(`⚠️ **Klaim redundansi**: Pesanan \`${orderId}\` sudah pernah diklaim sebelumnya.\nBarang claim: \`${foundOrder.claimedStockItem || "No Key"}\``);
          return;
        }

        const products = await dbService.getProducts();
        const product = products.find(p => p.id === foundOrder.productId);

        if (!product) {
          await message.reply("❌ **Error**: Produk untuk pemesanan ini sudah dihapus dari inventory admin.");
          return;
        }

        if (!product.stock || product.stock.length === 0) {
          await message.reply("❌ **Stok Kosong**: Mohon Maaf, stok produk ini sementara habis. Silakan infokan ke owner/admin toko.");
          return;
        }

        const claimItem = product.stock[0];
        const remainingStock = product.stock.slice(1);
        
        product.stock = remainingStock;
        await dbService.saveProduct(product);

        foundOrder.status = "Claimed";
        foundOrder.claimedStockItem = claimItem;
        foundOrder.claimedAt = Date.now();
        foundOrder.customerDiscordId = message.author.id;
        foundOrder.customerUsername = message.author.username;
        await dbService.saveOrder(foundOrder);

        try {
          const dmChannel = await message.author.createDM();
          await dmChannel.send(`🎉 **TERIMA KASIH TELAH BERBELANJA DI NEXUS CORESHOP!**\n\n📌 **Detail Pembelian**:\n- **No Order ID**: \`${foundOrder.id}\`\n- **Nama Produk**: **${foundOrder.productName}**\n- **Barang Digital / Lisensi Anda**:\n\`\`\`\n${claimItem}\n\`\`\`\n*Harapan kami Anda menyukai produk kami. Jangan sungkan menghubungi representatif developer kami jika ada kendala.*`);
          await message.reply(`✅ **Claim berhasil!** Berkas digital Anda berhasil dikirim ke personal messages DM Discord @${message.author.username}. Harap periksa Inbox DM Anda!`);
        } catch (dmErr) {
          await message.reply(`✅ **Klaim Sukses!** Berkas digital Anda: \`${claimItem}\` (Harap segera salin, dilarang disebarkan).`);
        }

        const stats = await dbService.getStats();
        await dbService.updateStats({
          totalRevenue: stats.totalRevenue + foundOrder.price,
          totalOrders: stats.totalOrders + 1
        });

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
