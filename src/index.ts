
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

app.post('/products', async (c) => {
  const apiKey = c.req.header('x-api-key');
  const expectedKey = c.env.API_KEY;
  if (!apiKey || apiKey !== expectedKey) {
    return c.text('Unauthorized', 401);
  }
  const db = drizzle(c.env.DB);
  const body = await c.req.json();
  let productsArray = Array.isArray(body) ? body : [body];
  const inserted = [];
  for (const item of productsArray) {
    const { title, price, code, asin, category } = item;
    if (!title || !price || !code || !category) {
      continue;
    }
    // Buscar el categoryId por nombre en la tabla categories
    const cat = await db.select().from(categories).where(eq(categories.name, category)).get();
    let categoryId = cat?.id;
    if (!categoryId) {
      // Crear la categoría si no existe
      const newCat = await db.insert(categories).values({ name: category }).returning();
      categoryId = (Array.isArray(newCat) && newCat.length > 0 && 'id' in newCat[0]) ? newCat[0].id : undefined;
      if (!categoryId) {
        continue;
      }
    }
    // Verificar si el producto ya existe por code
    const existing = await db.select().from(products).where(eq(products.code, code)).get();
    let result;
    if (existing && existing.id) {
      // Actualizar producto existente
      result = await db.update(products)
        .set({
          title,
          price: Number(price),
          asin,
          categoryId,
          disponible: true,
          habilitado: true,
        })
        .where(eq(products.code, code))
        .returning();
    } else {
      // Insertar nuevo producto
      result = await db.insert(products).values({
        title,
        price: Number(price),
        code,
        asin,
        categoryId,
        disponible: true,
        habilitado: true,
      }).returning();
    }
    inserted.push(result);
  }
  return c.json(inserted, 201);
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
  const results = [];
  let stats = {
    inserted: 0,
    updated: 0,
    omitted: 0,
    markedUnavailable: 0,
    total: productsArray.length
  };
  // Obtener todos los códigos del JSON
  const codesInJson = new Set(productsArray.map(p => p.code));
  // Obtener todos los productos actuales de la base
  const allProducts = await db.select().from(products).all();
  // Marcar como disponible: false los que no están en el JSON
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
    // Buscar el categoryId por nombre en la tabla categories
    const cat = await db.select().from(categories).where(eq(categories.name, category)).get();
    let categoryId = cat?.id;
    if (!categoryId) {
      // Crear la categoría si no existe
      const newCat = await db.insert(categories).values({ name: category }).returning();
      categoryId = (Array.isArray(newCat) && newCat.length > 0 && 'id' in newCat[0]) ? newCat[0].id : undefined;
      if (!categoryId) {
        stats.omitted++;
        continue;
      }
    }
    // Verificar si el producto ya existe por code
    const existing = await db.select().from(products).where(eq(products.code, code)).get();
    let result;
    if (existing && existing.id) {
      // Actualizar producto existente
      result = await db.update(products)
        .set({
          title,
          price: Number(price),
          asin,
          categoryId,
          disponible: true,
          habilitado: true,
        })
        .where(eq(products.code, code))
        .returning();
      stats.updated++;
    } else {
      // Insertar nuevo producto
      result = await db.insert(products).values({
        title,
        price: Number(price),
        code,
        asin,
        categoryId,
        disponible: true,
        habilitado: true,
      }).returning();
      stats.inserted++;
    }
    results.push(result);
  }
  return c.json({
    stats,
    results
  }, 201);
});

export default app
