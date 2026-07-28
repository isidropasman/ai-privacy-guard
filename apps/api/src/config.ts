import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { resolvePasswordHash } from "./auth";

export interface ApiConfig {
  readonly port: number;
  readonly databaseUrl: string | undefined;
  readonly passwordHash: string;
  readonly secureCookies: boolean;
  /** Directorio con el build de la extensión que se empaqueta por empresa. */
  readonly extensionDir: string;
  /** URL que se hornea en el config.json de cada paquete. */
  readonly publicApiBaseUrl: string;
  readonly dashboardDir: string;
}

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ApiConfig {
  const port = Number(env.PORT ?? 8787);

  return {
    port: Number.isSafeInteger(port) && port > 0 ? port : 8787,
    databaseUrl: env.DATABASE_URL,
    passwordHash: resolvePasswordHash(env),
    secureCookies: env.NODE_ENV === "production",
    extensionDir: env.EXTENSION_DIR ?? join(repoRoot, ".output", "chrome-mv3"),
    publicApiBaseUrl:
      env.PUBLIC_API_BASE_URL ?? `http://localhost:${String(port)}`,
    dashboardDir:
      env.DASHBOARD_DIR ?? join(repoRoot, "apps", "dashboard", "dist"),
  };
}
