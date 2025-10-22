import { Hono } from 'hono'
import { drizzle } from 'drizzle-orm/d1'
import { eq } from 'drizzle-orm'
import { products, categories } from './db/schema'

export type Env = {
  DB: D1Database
  API_KEY: string
}

const app = new Hono<{ Bindings: Env }>()

app.get('/products', async (c) => {
  const db = drizzle(c.env.DB);
  const result = await db.select().from(products).all();
  return c.json(result);
});

app.get('/product', async (c) => {
  const apiKey = c.req.header('x-api-key');
  const expectedKey = c.env.API_KEY;
  if (!apiKey || apiKey !== expectedKey) {
    return c.text('Unauthorized', 401);
  }
  const db = drizzle(c.env.DB);
  const result = await db.select().from(products).all();
  return c.json(result);
});

app.put('/products', async (c) => {
  const apiKey = c.req.header('x-api-key');
  const expectedKey = c.env.API_KEY;
  if (!apiKey || apiKey !== expectedKey) {
    return c.text('Unauthorized', 401);
  }
  const db = drizzle(c.env.DB);
  const body = await c.req.json();
  let productsArray = Array.isArray(body) ? body : [body];
  let stats = {
    inserted: 0,
    updated: 0,
    omitted: 0,
    markedUnavailable: 0,
    markedAvailable: 0,
    total: productsArray.length
  };

  // Obtener todas las categorías y productos una sola vez
  const allCategories = await db.select().from(categories).all();
  const categoryMap = new Map(allCategories.map(cat => [cat.name, cat.id]));
  const allProducts = await db.select().from(products).all();
  const productMap = new Map(allProducts.map(prod => [prod.code, prod]));

  // Marcar como disponible: false los que no están en el JSON
  const codesInJson = new Set(productsArray.map(p => p.code));
  for (const prod of allProducts) {
    if (!codesInJson.has(prod.code) && prod.disponible !== false) {
      await db.update(products)
        .set({ disponible: false })
        .where(eq(products.code, prod.code));
      stats.markedUnavailable++;
    }
  }

  for (const item of productsArray) {
    const { title, price, code, asin, category } = item;
    if (!title || !price || !code || !category) {
      stats.omitted++;
      continue;
    }

    // Usar el mapa de categorías
    let categoryId = categoryMap.get(category);
    if (!categoryId) {
      const newCat = await db.insert(categories).values({ name: category }).returning();
      categoryId = (Array.isArray(newCat) && newCat.length > 0 && 'id' in newCat[0]) ? newCat[0].id : undefined;
      if (!categoryId) {
        stats.omitted++;
        continue;
      }
      categoryMap.set(category, categoryId);
    }

    // Usar el mapa de productos
    const existing = productMap.get(code);
    if (existing && existing.id) {
      // Detectar si hay cambios reales
      const needsUpdate =
        existing.title !== title ||
        Number(existing.price) !== Number(price) ||
        existing.asin !== asin ||
        existing.categoryId !== categoryId ||
        existing.disponible !== true ||
        existing.habilitado !== true;

      if (existing.habilitado === false) {
        await db.update(products)
          .set({
            title,
            price: Number(price),
            asin,
            categoryId,
            disponible: true,
            habilitado: true,
          })
          .where(eq(products.code, code));
        stats.markedAvailable++;
        // Actualizar el mapa
        productMap.set(code, { ...existing, title, price: Number(price), asin, categoryId, disponible: true, habilitado: true });
      } else if (needsUpdate) {
        await db.update(products)
          .set({
            title,
            price: Number(price),
            asin,
            categoryId,
            disponible: true,
            habilitado: true,
          })
          .where(eq(products.code, code));
        stats.updated++;
        // Actualizar el mapa
        productMap.set(code, { ...existing, title, price: Number(price), asin, categoryId, disponible: true, habilitado: true });
      }
      // Si no hay cambios, no sumes nada
    } else {
      const inserted = await db.insert(products).values({
        title,
        price: Number(price),
        code,
        asin,
        categoryId,
        disponible: true,
        habilitado: true,
      }).returning();
      stats.inserted++;
      // Actualizar el mapa con el id retornado
      const newProduct = Array.isArray(inserted) ? inserted[0] : inserted;
      productMap.set(code, { ...newProduct });
    }
  }
  return c.json(stats, 201);
});

export default app
