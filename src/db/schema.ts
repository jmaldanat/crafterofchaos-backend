import { sqliteTable, text, integer, real, primaryKey } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";

// ============================================
// TABLAS DE PRODUCTOS
// ============================================

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  description: text("description"),
});

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  price: real("price").notNull(),
  asin: text("asin").notNull().unique(),
  code: text("code").notNull().unique(),
  created: text("created").default(sql`(datetime('now'))`),
  modified: text("modified").default(sql`(datetime('now'))`),
  categoryId: integer("category_id").references(() => categories.id),
  disponible: integer("disponible", { mode: "boolean" }).notNull().default(true),
  habilitado: integer("habilitado", { mode: "boolean" }).notNull().default(true),
});

export const productDetails = sqliteTable("product_details", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  shortDescription: text("short_description"),
  longDescription: text("long_description"),
  imageUrls: text("image_urls"), // JSON o lista separada por comas
  mainImage: text("main_image"), // Nueva columna para la imagen principal
});

export const tags = sqliteTable("tags", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
});

export const productTags = sqliteTable(
  "product_tags",
  {
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.productId, table.tagId] }),
  })
);

// ============================================
// RELACIONES
// ============================================

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  details: one(productDetails, {
    fields: [products.id],
    references: [productDetails.productId],
  }),
  productTags: many(productTags),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productDetailsRelations = relations(productDetails, ({ one }) => ({
  product: one(products, {
    fields: [productDetails.productId],
    references: [products.id],
  }),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  productTags: many(productTags),
}));

export const productTagsRelations = relations(productTags, ({ one }) => ({
  product: one(products, {
    fields: [productTags.productId],
    references: [products.id],
  }),
  tag: one(tags, {
    fields: [productTags.tagId],
    references: [tags.id],
  }),
}));
