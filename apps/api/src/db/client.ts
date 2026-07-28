import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Borde único contra la base. La aplicación sólo conoce esta interfaz, así que
 * cambiar de Postgres embebido a Neon no toca ningún repositorio.
 */
export interface SqlClient {
  query<Row = Record<string, unknown>>(
    text: string,
    params?: readonly unknown[],
  ): Promise<Row[]>;
  close(): Promise<void>;
}

/**
 * Neon devuelve filas planas o `{ rows }` según cómo se construya el cliente.
 * Normalizamos las dos formas en vez de depender de una configuración exacta.
 */
function normalizeRows<Row>(result: unknown): Row[] {
  if (Array.isArray(result)) return result as Row[];
  if (
    typeof result === "object" &&
    result !== null &&
    Array.isArray((result as { rows?: unknown }).rows)
  ) {
    return (result as { rows: Row[] }).rows;
  }
  return [];
}

export async function createSqlClient(
  databaseUrl: string | undefined,
): Promise<SqlClient> {
  if (databaseUrl !== undefined && databaseUrl.length > 0) {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(databaseUrl);
    return {
      async query<Row>(text: string, params: readonly unknown[] = []) {
        const result: unknown = await sql.query(text, [...params]);
        return normalizeRows<Row>(result);
      },
      async close() {
        // Neon sobre HTTP no mantiene conexiones abiertas.
      },
    };
  }

  const { PGlite } = await import("@electric-sql/pglite");
  const dataDir = process.env.PGLITE_DATA_DIR;
  const pg =
    dataDir === undefined || dataDir.length === 0
      ? new PGlite()
      : new PGlite(dataDir);

  return {
    async query<Row>(text: string, params: readonly unknown[] = []) {
      const result = await pg.query(text, [...params]);
      return result.rows as Row[];
    },
    async close() {
      await pg.close();
    },
  };
}

export async function migrate(client: SqlClient): Promise<void> {
  const here = dirname(fileURLToPath(import.meta.url));
  const schema = await readFile(join(here, "schema.sql"), "utf8");

  // PGlite y Neon aceptan varias sentencias por llamada, pero separarlas da
  // errores accionables cuando una falla.
  for (const statement of splitStatements(schema)) {
    await client.query(statement);
  }
}

function splitStatements(schema: string): string[] {
  // Los comentarios se quitan antes de partir: si un statement empieza con una
  // línea `--`, filtrarlo por prefijo descartaría la sentencia entera.
  return schema
    .replace(/^\s*--.*$/gmu, "")
    .split(/;\s*$/mu)
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);
}
