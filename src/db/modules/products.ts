import { pgPool, dbType } from '../core.js';
import { Product, Order, CustomCommand, BotConfig, ModLog, BotStats } from '../../types.js';

export const getProducts = async (): Promise<Product[]> => {
    if (pgPool) {
      try {
        const res = await pgPool.query('SELECT * FROM products ORDER BY created_at DESC');
        return res.rows.map(row => ({
          id: row.id,
          code: row.code || '',
          name: row.name,
          price: row.price,
          description: row.description || '',
          type: row.type as any,
          stock: row.stock || [],
          category: row.category || '',
          imageUrl: row.image_url || '',
          createdAt: Number(row.created_at),
          isUnlimited: row.is_unlimited,
          filePath: row.file_path
        }));
      } catch (err) {
        console.error('Postgres error:', err); throw err;
      }
    }
    return readLocalFile().products;
  };

export const saveProduct = async (prod: Product): Promise<void> => {
    if (pgPool) {
      try {
        await pgPool.query({
          text: `INSERT INTO products (id, code, name, price, description, type, stock, category, image_url, created_at, is_unlimited, file_path)
                 VALUES ($1, $10, $2, $3, $4, $5, $6, $7, $8, $9, $11, $12)
                 ON CONFLICT (id) DO UPDATE SET
                   code = $10, name = $2, price = $3, description = $4, type = $5, stock = $6, category = $7, image_url = $8, is_unlimited = $11, file_path = $12`,
          values: [prod.id, prod.name, prod.price, prod.description, prod.type, prod.stock, prod.category, prod.imageUrl || '', prod.createdAt, prod.code || '', prod.isUnlimited || false, prod.filePath || '']
        });
        return;
      } catch (err) {
        console.error('Postgres error:', err); throw err;
      }
    }
    const data = readLocalFile();
    const existingIdx = data.products.findIndex((p: Product) => p.id === prod.id);
    if (existingIdx !== -1) {
      data.products[existingIdx] = prod;
    } else {
      data.products.unshift(prod);
    }
    writeLocalFile(data);
  };

export const deleteProduct = async (id: string): Promise<void> => {
    if (pgPool) {
      try {
        await pgPool.query('DELETE FROM products WHERE id = $1', [id]);
        return;
      } catch (err) {
        console.error('Postgres error:', err); throw err;
      }
    }
    const data = readLocalFile();
    if (!data.products) data.products = [];
    data.products = data.products.filter((p: Product) => p.id !== id);
    writeLocalFile(data);
  };