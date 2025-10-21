# Guía para ejecutar migraciones con Drizzle y Wrangler

## ¿Cómo funciona el pipeline desde el schema hasta la base de datos?

1. **Definición del esquema (`src/db/schema.ts`)**
   - Aquí describes las tablas, campos y relaciones usando Drizzle ORM en TypeScript.
   - Ejemplo: defines productos, categorías, etiquetas, etc.

2. **Generación de migraciones (`bun run db:generate`)**
   - Drizzle compara el esquema actual con el estado previo y genera archivos SQL en `drizzle/migrations/` para reflejar los cambios.
   - Cada archivo de migración contiene instrucciones SQL para crear, modificar o eliminar tablas y campos.

3. **Ejecución de migraciones**
   - Usando Wrangler y el comando adecuado, aplicas las migraciones a la base de datos D1 (local o remota).
   - Esto actualiza la estructura real de la base de datos según lo definido en el esquema.

4. **Meta y control de versiones**
   - Drizzle lleva un registro de las migraciones aplicadas en `drizzle/migrations/meta/` para evitar duplicados y mantener el historial.

---

**Resumen del flujo:**
- Modificas el esquema en TypeScript → Generas migraciones → Ejecutas migraciones → La base de datos se actualiza.

---

# Guía para ejecutar migraciones con Drizzle y Wrangler

1. **Genera los archivos de migración**
   - Ejecuta el comando:
     ```pwsh
     bun run db:generate
     ```
   - Esto crea o actualiza los archivos de migración en `drizzle/migrations/` según los cambios en el esquema.

2. **Verifica la configuración**
   - Asegúrate que `drizzle.config.json` y `wrangler.jsonc` estén correctamente configurados.
   - La base de datos debe estar definida en `wrangler.jsonc` bajo `d1_databases`.

3. **Crea o modifica migraciones manualmente (opcional)**
   - Las migraciones SQL deben estar en la carpeta `drizzle/migrations/`.
   - Ejemplo: `drizzle/migrations/0001_nombre.sql`

4. **Ejecuta la migración en local**
   - Abre la terminal en la raíz del proyecto.
   - Ejecuta el comando:
     ```pwsh
     bunx wrangler d1 execute <nombreDB> --local --file=./drizzle/migrations/<archivo>.sql
     ```
   - Ejemplo:
     ```pwsh
     bunx wrangler d1 execute crafterofchaosDB --local --file=./drizzle/migrations/0001_nombre.sql
     ```

5. **Verifica el estado de la migración**
   - Revisa la base de datos y los archivos de la carpeta `drizzle/migrations/meta/` para confirmar que la migración se aplicó.

6. **Migraciones en producción**
   - Para aplicar migraciones en producción, omite el flag `--local` y asegúrate de tener acceso a la base de datos remota.
   - Ejemplo:
     ```pwsh
     bunx wrangler d1 execute <nombreDB> --file=./drizzle/migrations/<archivo>.sql
     ```

7. **Recomendaciones**
   - Haz backup antes de migrar en producción.
   - Revisa los logs y errores en la terminal.
   - Mantén las migraciones organizadas y versionadas.

---

**Notas:**
- Cambia `<nombreDB>` y `<archivo>` por los valores correspondientes.
- Usa el comando `bunx` para ejecutar wrangler si usas Bun, o `npx` si usas Node.js.
