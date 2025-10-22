// import_products.js
const fs = require('fs');

if (process.argv.length < 4) {
  console.log('Uso: node import_products.js productos.json productos.sql');
  process.exit(1);
}

const [,, jsonFile, sqlFile] = process.argv;
const productos = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));

let sql = `
-- Marcar todos los productos como no disponibles antes de la importación
UPDATE products SET disponible = 0;
`;

const categorias = new Set();
const codigos = new Set();
const tagsSet = new Set();
const productTags = [];

for (const p of productos) {
  if (!p.title || !p.price || !p.code || !p.category) continue;
  categorias.add(p.category);
  codigos.add(p.code);

  // Procesar tags si existen
  if (p.tags) {
    let tagsArr = [];
    if (Array.isArray(p.tags)) {
      tagsArr = p.tags;
    } else if (typeof p.tags === 'string') {
      tagsArr = p.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
    }
    for (const tag of tagsArr) {
      tagsSet.add(tag);
      productTags.push({ code: p.code, tag });
    }
  }
}

// Insertar categorías si no existen
for (const cat of categorias) {
  sql += `
INSERT INTO categories (name)
SELECT '${cat.replace(/'/g, "''")}'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '${cat.replace(/'/g, "''")}');
`;
}

// Insertar tags si no existen
for (const tag of tagsSet) {
  sql += `
INSERT INTO tags (name, enabled)
SELECT '${tag.replace(/'/g, "''")}', 1
WHERE NOT EXISTS (SELECT 1 FROM tags WHERE name = '${tag.replace(/'/g, "''")}');
`;
}

// Insertar o actualizar productos y detalles
for (const p of productos) {
  if (!p.title || !p.price || !p.code || !p.category) continue;

  sql += `
-- Obtener category_id para '${p.category}'
WITH cat AS (
  SELECT id FROM categories WHERE name = '${p.category.replace(/'/g, "''")}' LIMIT 1
)
INSERT INTO products (title, price, code, asin, category_id, disponible, habilitado)
SELECT
  '${p.title.replace(/'/g, "''")}',
  ${Number(p.price)},
  '${p.code.replace(/'/g, "''")}',
  '${p.asin ? p.asin.replace(/'/g, "''") : ''}',
  cat.id,
  1,
  1
FROM cat
WHERE NOT EXISTS (SELECT 1 FROM products WHERE code = '${p.code.replace(/'/g, "''")}')
;
-- Si ya existe, actualizar
UPDATE products
SET
  title = '${p.title.replace(/'/g, "''")}',
  price = ${Number(p.price)},
  asin = '${p.asin ? p.asin.replace(/'/g, "''") : ''}',
  category_id = (SELECT id FROM categories WHERE name = '${p.category.replace(/'/g, "''")}' LIMIT 1),
  disponible = 1,
  habilitado = 1
WHERE code = '${p.code.replace(/'/g, "''")}'
;

-- Insertar o actualizar product_details con mainImage
WITH prod AS (
  SELECT id FROM products WHERE code = '${p.code.replace(/'/g, "''")}' LIMIT 1
)
INSERT INTO product_details (product_id, main_image)
SELECT prod.id, '${p.image ? p.image.replace(/'/g, "''") : ''}'
FROM prod
WHERE NOT EXISTS (SELECT 1 FROM product_details WHERE product_id = prod.id)
;
UPDATE product_details
SET main_image = '${p.image ? p.image.replace(/'/g, "''") : ''}'
WHERE product_id = (SELECT id FROM products WHERE code = '${p.code.replace(/'/g, "''")}' LIMIT 1)
;
`;
}

// Insertar relaciones producto-tag
for (const pt of productTags) {
  sql += `
-- Relacionar producto '${pt.code}' con tag '${pt.tag}'
WITH prod AS (
  SELECT id FROM products WHERE code = '${pt.code.replace(/'/g, "''")}' LIMIT 1
), tg AS (
  SELECT id FROM tags WHERE name = '${pt.tag.replace(/'/g, "''")}' LIMIT 1
)
INSERT INTO product_tags (product_id, tag_id)
SELECT prod.id, tg.id FROM prod, tg
WHERE NOT EXISTS (
  SELECT 1 FROM product_tags WHERE product_id = prod.id AND tag_id = tg.id
);
`;
}

// Marcar como no disponibles los productos que no están en el JSON
sql += `
UPDATE products SET disponible = 0 WHERE code NOT IN (${[...codigos].map(c => `'${c.replace(/'/g, "''")}'`).join(', ')});
`;

fs.writeFileSync(sqlFile, sql);
console.log(`Archivo SQL generado: ${sqlFile}`);