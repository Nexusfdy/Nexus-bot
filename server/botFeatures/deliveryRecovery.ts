import { Client, AttachmentBuilder } from "discord.js";
import { dbService } from "../../src/db/db_service.ts";

export async function runDeliveryRecovery(client: Client) {
  console.log("[Delivery Recovery] Memeriksa pesanan yang tertunda (PENDING_DELIVERY)...");
  try {
    const pending = await dbService.getPendingDeliveries();
    if (pending.length === 0) {
      console.log("[Delivery Recovery] Tidak ada pesanan tertunda.");
      return;
    }

    console.log(`[Delivery Recovery] Ditemukan ${pending.length} pesanan tertunda. Memulai pengiriman ulang...`);

    for (const order of pending) {
      try {
        const user = await client.users.fetch(order.userId);
        const dmChannel = await user.createDM();
        const itemsText = order.items.join('\n');
        const buffer = Buffer.from(itemsText, 'utf-8');
        const attachment = new AttachmentBuilder(buffer, { name: `${order.productName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_items_recovery.txt` });
        
        await dmChannel.send({
          content: `📦 **[RECOVERY]** Berikut adalah pesanan kamu yang tertunda sebelumnya untuk produk **${order.productName}**:`,
          files: [attachment]
        });
        
        await dbService.markDeliverySuccess(order.transactionId);
        console.log(`[Delivery Recovery] Berhasil mengirim pesanan ${order.transactionId} ke user ${order.userId}.`);
      } catch (err) {
        console.error(`[Delivery Recovery] Gagal mengirim DM ke user ${order.userId} untuk transaksi ${order.transactionId}. DM mungkin masih tertutup.`);
      }
    }
  } catch (err) {
    console.error("[Delivery Recovery] Terjadi kesalahan saat menjalankan proses recovery:", err);
  }
}
