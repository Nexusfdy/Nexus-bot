import { Client, TextChannel, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { dbService } from "../../src/db/db_service.ts";
import path from "path";

let liveStockInterval: NodeJS.Timeout | null = null;

export async function initLiveStockTimer(client: Client) {
  if (liveStockInterval) {
    clearInterval(liveStockInterval);
  }

  // Update immediately, then every 1 minute
  updateLiveStock(client);
  liveStockInterval = setInterval(() => {
    updateLiveStock(client);
  }, 60000);
}

export async function stopLiveStockTimer() {
    if (liveStockInterval) {
        clearInterval(liveStockInterval);
        liveStockInterval = null;
    }
}

export async function updateLiveStock(client: Client) {
  try {
    const config = await dbService.getConfig();
    if (!config.liveStockChannel) {
        console.log("[Discord Bot] liveStockChannel is not configured, skipping live stock update.");
        return;
    }

    let targetChannel: TextChannel | null = null;
    
    try {
        // Try getting it by ID first
        const chan = await client.channels.fetch(config.liveStockChannel);
        if (chan && chan.isTextBased()) {
            targetChannel = chan as TextChannel;
            console.log(`[Discord Bot] Found live stock channel by ID: ${chan.id}`);
        }
    } catch (err) {
        // Fallback to searching by name for backward compatibility
        const channelName = config.liveStockChannel.replace(/^#/, '');
        console.log(`[Discord Bot] Attempting to find live stock channel by name: ${channelName}`);
        for (const guild of client.guilds.cache.values()) {
            let chan = guild.channels.cache.find(c => c.name === channelName && c.isTextBased());
            if (!chan) {
                chan = guild.channels.cache.find(c => c.name.includes(channelName) && c.isTextBased());
            }
            if (chan) {
                targetChannel = chan as TextChannel;
                console.log(`[Discord Bot] Found matching channel with ID: ${chan.id} in guild ${guild.name}`);
                break;
            }
        }
    }

    if (!targetChannel) {
        console.log(`[Discord Bot] Target channel ${config.liveStockChannel} not found.`);
        return;
    }

    const products = await dbService.getProducts();
    const availableProducts = products.filter(p => (p.stock?.length || 0) > 0);
    
    const embed = new EmbedBuilder()
      .setTitle("🤖 Nixs Store")
      .setColor("#00FF00")
      .setFooter({ text: "AutoStore by GUE NDIRI | " + new Date().toLocaleString() })
      .setTimestamp();

    if (products.length === 0) {
        embed.setDescription("👑 **Terakhir Update:** " + `<t:${Math.floor(Date.now() / 1000)}:R>\n\n` +
          "Daftar Produk Kami\n" + "⚠️ **Belum ada produk saat ini.**");
    } else {
        let stockList = products.map(p => {
            const count = p.stock?.length || 0;
            const stockStatus = count > 0 ? `✅ In Stock (${count})` : `❌ Out of Stock (0)`;
            return `📦 **${p.name}**\n- Kode: ${p.id.substring(0, 4).toUpperCase()}\n- Harga: **Rp${p.price.toLocaleString('id-ID')}**\n- Stok: ${stockStatus}`;
        }).join('\n\n');
        
        const descriptionText = `👑 **Terakhir Update:** <t:${Math.floor(Date.now() / 1000)}:R>\n\n**Daftar Produk Kami**\n${stockList}`;
        embed.setDescription(descriptionText.length > 4000 ? descriptionText.substring(0, 4000) + '...\n*(Terpotong, terlalu banyak item)*' : descriptionText);
    }

  const row1 = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('register_account')
        .setLabel('👤 Register')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('topup_qris')
        .setLabel('💳 Topup QRIS')
        .setStyle(ButtonStyle.Success)
    );

  const row2 = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('cek_saldo')
        .setLabel('💰 Saldo')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('belanja_sekarang')
        .setLabel('🛒 Beli')
        .setStyle(ButtonStyle.Danger)
    );

  let oldMessageId = config.liveStockMessageId || null;
  
  if (!oldMessageId) {
      try {
          console.log(`[Discord Bot] Fetching messages in channel ${targetChannel.name} to find old live stock message...`);
          const messages = await targetChannel.messages.fetch({ limit: 100 });
          
          // Find all bot messages that look like live stock
          const botMsgs = messages.filter(m => m.author.id === client.user?.id && m.embeds.length > 0 && (m.embeds[0].title === "🤖 Nixs Store" || m.embeds[0].title === "📊 NEXUS LIVE STOCK"));
          
          if (botMsgs.size > 0) {
              // Get the newest one to edit
              const newestMsg = botMsgs.first();
              if (newestMsg) {
                  oldMessageId = newestMsg.id;
                  console.log(`[Discord Bot] Found old live stock message: ${oldMessageId}`);
                  
                  // Delete duplicates to keep only one active
                  if (botMsgs.size > 1) {
                      console.log(`[Discord Bot] Found ${botMsgs.size - 1} duplicate live stock messages, cleaning them up...`);
                      for (const [id, msg] of botMsgs) {
                          if (id !== newestMsg.id) {
                              try { await msg.delete(); } catch(e) {}
                          }
                      }
                  }
              }
          } else {
              console.log(`[Discord Bot] No old live stock message found.`);
          }
      } catch (fetchErr) {
          console.error(`[Discord Bot] Error fetching messages for live stock:`, fetchErr);
      }
  }

  let successMsg: any = null;
  if (oldMessageId) {
      try {
          const msgToEdit = await targetChannel.messages.fetch(oldMessageId);
          if (msgToEdit) {
              successMsg = await msgToEdit.edit({ embeds: [embed], components: [row1, row2] });
              console.log(`[Discord Bot] Successfully updated live stock message ${oldMessageId}!`);
          }
      } catch(err) {
          console.log("[Discord Bot] Cached/Found message no longer exists or cannot edit, sending a new one.");
          oldMessageId = null;
      }
  } 
  
  if (!oldMessageId) {
      // Also ensure we cleanup any possible older messages before sending a new one if it was lost from cache
      try {
          const messages = await targetChannel.messages.fetch({ limit: 50 });
          const botMsgs = messages.filter(m => m.author.id === client.user?.id && m.embeds.length > 0 && (m.embeds[0].title === "🤖 Nixs Store" || m.embeds[0].title === "📊 NEXUS LIVE STOCK"));
          for (const [id, msg] of botMsgs) {
              try { await msg.delete(); } catch(e) {}
          }
      } catch(e) {}
      
      successMsg = await targetChannel.send({ embeds: [embed], components: [row1, row2] });
      console.log(`[Discord Bot] Successfully sent new live stock message!`);
  }

  if (successMsg && successMsg.id !== config.liveStockMessageId) {
      console.log(`[Discord Bot] Updating liveStockMessageId in database: ${successMsg.id}`);
      config.liveStockMessageId = successMsg.id;
      await dbService.updateLiveStockMessageId(successMsg.id);
  }
} catch (error: any) {
  console.error("[Discord Bot] Failed to update live stock:", error);
}
}
