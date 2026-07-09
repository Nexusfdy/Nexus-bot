import { pgPool, dbType } from '../core.js';
import { Product, Order, CustomCommand, BotConfig, ModLog, BotStats } from '../../types.js';

export const clearAllData = async (mode: 'clear' | 'restore' = 'clear'): Promise<void> => {
    if (pgPool) {
      try {
        await pgPool.query('TRUNCATE TABLE products CASCADE');
        await pgPool.query('TRUNCATE TABLE orders CASCADE');
        await pgPool.query('TRUNCATE TABLE custom_commands CASCADE');
        await pgPool.query('TRUNCATE TABLE mod_logs CASCADE');
        
        if (mode === 'clear') {
          await pgPool.query(`UPDATE bot_stats SET 
            total_revenue = 0, 
            total_orders = 0, 
            total_products = 0, 
            active_servers = 0, 
            commands_run = 0, 
            moderation_actions = 0 
            WHERE id = 'core_stats'`);
        } else {
          // Restore stats to initial default values
          await pgPool.query(`UPDATE bot_stats SET 
            total_revenue = ${defaultStats.totalRevenue}, 
            total_orders = ${defaultStats.totalOrders}, 
            total_products = ${defaultStats.totalProducts}, 
            active_servers = ${defaultStats.activeServers}, 
            commands_run = ${defaultStats.commandsRun}, 
            moderation_actions = ${defaultStats.moderationActions} 
            WHERE id = 'core_stats'`);

          // Seed default products
          for (const item of defaultProducts) {
            await pgPool.query({
              text: `INSERT INTO products (id, name, price, description, type, stock, category, image_url, created_at) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
              values: [item.id, item.name, item.price, item.description, item.type, item.stock, item.category, item.imageUrl || '', item.createdAt]
            });
          }

          // Seed default custom commands
          for (const cmd of defaultCommands) {
            await pgPool.query({
              text: `INSERT INTO custom_commands (id, name, response, description, usage_count, is_active) 
                     VALUES ($1, $2, $3, $4, $5, $6)`,
              values: [cmd.id, cmd.name, cmd.response, cmd.description, cmd.usageCount, cmd.isActive]
            });
          }

          // Seed default orders
          for (const ord of defaultOrders) {
            await pgPool.query({
              text: `INSERT INTO orders (id, product_id, product_name, price, customer_discord_id, customer_username, status, claimed_stock_item, claimed_at, transaction_id, created_at) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
              values: [ord.id, ord.productId, ord.productName, ord.price, ord.customerDiscordId || '', ord.customerUsername || '', ord.status, ord.claimedStockItem || '', ord.claimedAt || null, ord.transactionId, ord.createdAt]
            });
            if (ord.status === 'Success' || ord.status === 'Claimed') {
              await pgPool.query({
                text: `INSERT INTO transactions (id, user_id, username, amount, type, description, timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING`,
                values: [`tx_${ord.id}`, ord.customerDiscordId || '', ord.customerUsername || '', ord.price, 'PURCHASE', `Purchased product: ${ord.productName}`, ord.createdAt]
              });
            }
          }

          // Seed default mod logs
          for (const log of defaultModLogs) {
            await pgPool.query({
              text: `INSERT INTO mod_logs (id, user_id, username, action, reason, timestamp) 
                     VALUES ($1, $2, $3, $4, $5, $6)`,
              values: [log.id, log.userId, log.username, log.action, log.reason, log.timestamp]
            });
          }
        }
        return;
      } catch (err) {
        console.error('Postgres error:', err); throw err;
      }
    }
    const data = readLocalFile();
    if (mode === 'clear') {
      data.products = [];
      data.orders = [];
      data.commands = [];
      data.modLogs = [];
      data.users = [];
      data.stats = {
        totalRevenue: 0,
        totalOrders: 0,
        totalProducts: 0,
        activeServers: 0,
        commandsRun: 0,
        moderationActions: 0
      };
    } else {
      data.products = [...defaultProducts];
      data.orders = [...defaultOrders];
      data.commands = [...defaultCommands];
      data.modLogs = [...defaultModLogs];
      data.users = [];
      data.stats = { ...defaultStats };
    }
    writeLocalFile(data);
  };

export const processTopup = async (messageId: string, accountName: string, amount: number): Promise<{ success: boolean; error?: string; userId?: string }> => {
    if (!pgPool) return { success: false, error: "Database not connected." };
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');
      
      const userRes = await client.query('SELECT * FROM users WHERE account_name = $1 FOR UPDATE', [accountName]);
      if (userRes.rows.length === 0) {
        throw new Error("User not found with that account name");
      }
      const user = userRes.rows[0];
      const newBalance = user.balance + amount;
      
      await client.query('UPDATE users SET balance = $1 WHERE discord_id = $2', [newBalance, user.discord_id]);
      
      const txId = `topup_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      await client.query(`
        INSERT INTO transactions (id, user_id, username, amount, type, description, timestamp)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [txId, user.discord_id, accountName, amount, 'TOPUP', `Topup via Saweria: Rp ${amount.toLocaleString('id-ID')}`, Date.now()]);
      
      await client.query('COMMIT');
      return { success: true, userId: user.discord_id };
    } catch (err: any) {
      await client.query('ROLLBACK');
      console.error('Topup transaction failed:', err);
      return { success: false, error: err.message };
    } finally {
      client.release();
    }
  };

export const processClaim = async (orderId: string, userId: string, username: string): Promise<{ success: boolean; claimItem?: string; orderDetails?: any; error?: string }> => {
    if (!pgPool) return { success: false, error: "Database not connected." };

    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');

      const orderRes = await client.query('SELECT * FROM orders WHERE id = $1 FOR UPDATE', [orderId]);
      if (orderRes.rows.length === 0) throw new Error('Pesanan tidak ditemukan.');
      const orderRow = orderRes.rows[0];

      if (orderRow.status === 'Claimed') {
        throw new Error('Pesanan sudah diklaim sebelumnya.');
      }

      const checkProductRes = await client.query('SELECT is_unlimited, file_path, name FROM products WHERE id = $1 FOR UPDATE', [orderRow.product_id]);
      if (checkProductRes.rows.length === 0) throw new Error('Produk untuk pemesanan ini tidak ditemukan.');
      const pData = checkProductRes.rows[0];
      let claimItem = '';
      if (pData.is_unlimited) {
         claimItem = `[FILE_ATTACHMENT]:${pData.file_path}`;
      } else {
        const productRes = await client.query(`
          WITH old_data AS (
            SELECT stock[1:1] AS claimed_items, array_length(stock, 1) AS stock_len
            FROM products 
            WHERE id = $1 FOR UPDATE
          )
          UPDATE products 
          SET stock = stock[2:array_upper(stock, 1)] 
          WHERE id = $1 AND (SELECT stock_len FROM old_data) > 0
          RETURNING (SELECT claimed_items FROM old_data) AS claimed_items;
        `, [orderRow.product_id]);

        if (productRes.rows.length === 0) throw new Error('Produk untuk pemesanan ini tidak ditemukan atau stok sementara habis.');
        
        const claimedItems = productRes.rows[0].claimed_items || [];
        if (claimedItems.length === 0) throw new Error('Stok produk ini sementara habis.');
        claimItem = claimedItems[0];
      }

      const now = Date.now();
      await client.query(`
        UPDATE orders 
        SET status = 'Claimed', claimed_stock_item = $1, claimed_at = $2, customer_discord_id = $3, customer_username = $4
        WHERE id = $5
      `, [claimItem, now, userId, username, orderRow.id]);

      await client.query(`
        UPDATE bot_stats SET 
        total_orders = total_orders + 1,
        total_revenue = total_revenue + $1
        WHERE id = 'core_stats'
      `, [orderRow.price]);

      await client.query('COMMIT');

      const orderDetails: any = {
        id: orderRow.id,
        productId: orderRow.product_id,
        productName: orderRow.product_name,
        price: orderRow.price,
        status: 'Claimed',
        claimedStockItem: claimItem,
        claimedAt: now,
        customerDiscordId: userId,
        customerUsername: username,
        transactionId: orderRow.transaction_id,
        createdAt: Number(orderRow.created_at)
      };

      return { success: true, claimItem, orderDetails };
    } catch (err: any) {
      await client.query('ROLLBACK');
      return { success: false, error: err.message };
    } finally {
      client.release();
    }
  };

export const refundPurchase = async (userId: string, productId: string, stockItems: string[], totalCost: number, originalTxId?: string): Promise<void> => {
    if (!pgPool) return;
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');
      
      // Update User Balance (Lock users first)
      await client.query('UPDATE users SET balance = balance + $1 WHERE discord_id = $2', [totalCost, userId]);

      // Update Product Stock (Lock products second)
            if (stockItems && stockItems.length > 0 && stockItems[0].startsWith('[FILE_ATTACHMENT]:')) {
        // No stock to return for unlimited products
      } else {
        await client.query(`
          UPDATE products 
          SET stock = array_cat($1::text[], stock) 
          WHERE id = $2
        `, [stockItems, productId]);
      }
      
      // Refund log
      const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      await client.query(`
        INSERT INTO transactions (id, user_id, username, amount, type, description, timestamp)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [txId, userId, 'System', totalCost, 'REFUND', `Pengembalian dana produk gagal DM`, Date.now()]);
      
      // Update delivery status of failed order to prevent recovery loops
      if (originalTxId) {
        await client.query(`
          UPDATE purchased_items 
          SET delivery_status = 'REFUNDED' 
          WHERE transaction_id = $1
        `, [originalTxId]);
      } else {
        await client.query(`
          UPDATE purchased_items 
          SET delivery_status = 'REFUNDED' 
          WHERE user_id = $1 AND delivery_status = 'PENDING_DELIVERY' AND product_name = (SELECT name FROM products WHERE id = $2)
        `, [userId, productId]);
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Refund transaction failed:', err);
    } finally {
      client.release();
    }
  };