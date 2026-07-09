import { pgPool, dbType } from '../core.js';
import { Product, Order, CustomCommand, BotConfig, ModLog, BotStats } from '../../types.js';

export const getOrders = async (): Promise<Order[]> => {
    if (pgPool) {
      try {
        const query = `
          SELECT 
            id, product_id, product_name, price, customer_discord_id, 
            customer_username, status, claimed_stock_item, claimed_at, 
            transaction_id, created_at,
            FALSE as is_unlimited, NULL as file_path
          FROM orders
          UNION ALL
          SELECT 
            pi.transaction_id as id, 
            'balance_purchase' as product_id, 
            pi.product_name, 
            t.amount as price, 
            t.user_id as customer_discord_id, 
            t.username as customer_username, 
            CASE WHEN pi.delivery_status = 'DELIVERED' THEN 'Claimed' ELSE 'Success' END as status, 
            pi.items::text as claimed_stock_item, 
            t.timestamp as claimed_at, 
            pi.transaction_id as transaction_id, 
            t.timestamp as created_at,
            FALSE as is_unlimited,
            NULL as file_path
          FROM purchased_items pi
          JOIN transactions t ON pi.transaction_id = t.id
          WHERE pi.transaction_id NOT IN (SELECT transaction_id FROM orders WHERE transaction_id IS NOT NULL)
          ORDER BY created_at DESC
        `;
        const res = await pgPool.query(query);
        return res.rows.map(row => ({
          id: row.id,
          productId: row.product_id,
          productName: row.product_name,
          price: row.price,
          customerDiscordId: row.customer_discord_id || '',
          customerUsername: row.customer_username || '',
          status: row.status as any,
          claimedStockItem: row.claimed_stock_item || '',
          claimedAt: row.claimed_at ? Number(row.claimed_at) : undefined,
          transactionId: row.transaction_id,
          createdAt: Number(row.created_at),
          isUnlimited: row.is_unlimited,
          filePath: row.file_path
        }));
      } catch (err) {
        console.error('Postgres error:', err); throw err;
      }
    }
    return readLocalFile().orders;
  };

export const saveOrder = async (ord: Order): Promise<void> => {
    if (pgPool) {
      try {
        await pgPool.query({
          text: `INSERT INTO orders (id, product_id, product_name, price, customer_discord_id, customer_username, status, claimed_stock_item, claimed_at, transaction_id, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                 ON CONFLICT (id) DO UPDATE SET
                   status = $7, claimed_stock_item = $8, claimed_at = $9`,
          values: [ord.id, ord.productId, ord.productName, ord.price, ord.customerDiscordId || '', ord.customerUsername || '', ord.status, ord.claimedStockItem || '', ord.claimedAt || null, ord.transactionId, ord.createdAt]
        });
        return;
      } catch (err) {
        console.error('Postgres error:', err); throw err;
      }
    }
    const data = readLocalFile();
    const existingIdx = data.orders.findIndex((o: Order) => o.id === ord.id);
    if (existingIdx !== -1) {
      data.orders[existingIdx] = ord;
    } else {
      data.orders.unshift(ord);
    }
    writeLocalFile(data);
  };