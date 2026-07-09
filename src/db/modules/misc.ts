import { pgPool, dbType } from '../core.js';
import { Product, Order, CustomCommand, BotConfig, ModLog, BotStats } from '../../types.js';

export const processPurchase = async (userId: string, username: string, productId: string, qty: number, totalCost: number): Promise<{ success: boolean; stockItems?: string[]; error?: string; transactionId?: string; newBalance?: number }> => {
    if (!pgPool) {
      return { success: false, error: "Database not connected." };
    }

    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');

      const userRes = await client.query('SELECT balance FROM users WHERE discord_id = $1 FOR UPDATE', [userId]);
      if (userRes.rows.length === 0) throw new Error("User not found");
      const currentBalance = userRes.rows[0].balance;
      if (currentBalance < totalCost) throw new Error("Saldo tidak mencukupi");

      const checkProductRes = await client.query('SELECT is_unlimited, file_path, name FROM products WHERE id = $1 FOR UPDATE', [productId]);
      if (checkProductRes.rows.length === 0) throw new Error("Produk tidak ditemukan.");
      
      const pData = checkProductRes.rows[0];
      let product = { name: pData.name };
      let claimedStockItems = [];
      
      if (pData.is_unlimited) {
        for (let i = 0; i < qty; i++) {
           claimedStockItems.push(`[FILE_ATTACHMENT]:${pData.file_path}`);
        }
      } else {
         const productRes = await client.query(`
          WITH old_data AS (
            SELECT name, stock[1:$1] AS claimed_items, array_length(stock, 1) AS stock_len
            FROM products 
            WHERE id = $2 FOR UPDATE
          )
          UPDATE products 
          SET stock = stock[($1 + 1):array_upper(stock, 1)] 
          WHERE id = $2 AND (SELECT stock_len FROM old_data) >= $1
          RETURNING (SELECT name FROM old_data) AS name, (SELECT claimed_items FROM old_data) AS claimed_items;
        `, [qty, productId]);

        if (productRes.rows.length === 0) {
          throw new Error("Produk tidak ditemukan atau stok tidak cukup. Silahkan kurangi jumlah atau pilih produk lain.");
        }
        
        const row = productRes.rows[0];
        product = { name: row.name };
        claimedStockItems = row.claimed_items || [];
        if (claimedStockItems.length < qty) {
          throw new Error("Stok produk tidak cukup. Silahkan kurangi jumlah atau pilih produk lain.");
        }
      }

      const newBalance = currentBalance - totalCost;
      await client.query('UPDATE users SET balance = $1 WHERE discord_id = $2', [newBalance, userId]);

      const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      await client.query(`
        INSERT INTO transactions (id, user_id, username, amount, type, description, timestamp)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [txId, userId, username, totalCost, 'PURCHASE', `Pembelian produk: ${qty}x ${product.name}`, Date.now()]);

      await client.query(`
        INSERT INTO purchased_items (transaction_id, user_id, product_name, items, delivery_status)
        VALUES ($1, $2, $3, $4, 'PENDING_DELIVERY')
      `, [txId, userId, product.name, JSON.stringify(claimedStockItems)]);

      await client.query(`
        UPDATE bot_stats SET 
        total_orders = total_orders + 1,
        total_revenue = total_revenue + $1
        WHERE id = 'core_stats'
      `, [totalCost]);

      await client.query('COMMIT');
      return { success: true, stockItems: claimedStockItems, transactionId: txId, newBalance };
    } catch (err: any) {
      await client.query('ROLLBACK');
      return { success: false, error: err.message || "Gagal memproses pembelian" };
    } finally {
      client.release();
    }
  };