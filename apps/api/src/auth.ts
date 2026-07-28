import {
  createHash,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import type { SqlClient } from "./db/client";

const sessionTtlMs = 12 * 60 * 60 * 1000;

/** Token opaco de 32 bytes. Se entrega una vez y sólo vive en el cliente. */
export function createOpaqueToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * La base guarda el hash, nunca el token. Un dump de la base no permite
 * suplantar instalaciones ni sesiones.
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function hashPassword(password: string, salt?: string): string {
  const usedSalt = salt ?? randomBytes(16).toString("hex");
  const derived = scryptSync(password, usedSalt, 64).toString("hex");
  return `scrypt$${usedSalt}$${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [algorithm, salt, expected] = stored.split("$");
  if (algorithm !== "scrypt" || salt === undefined || expected === undefined) {
    return false;
  }

  const derived = scryptSync(password, salt, 64);
  const expectedBuffer = Buffer.from(expected, "hex");
  if (derived.length !== expectedBuffer.length) return false;
  return timingSafeEqual(derived, expectedBuffer);
}

export function resolvePasswordHash(env: NodeJS.ProcessEnv): string {
  const hash = env.SUPERADMIN_PASSWORD_HASH;
  if (hash !== undefined && hash.length > 0) return hash;

  const plain = env.SUPERADMIN_PASSWORD;
  if (plain !== undefined && plain.length > 0) return hashPassword(plain);

  if (env.NODE_ENV === "production") {
    throw new Error(
      "Definí SUPERADMIN_PASSWORD_HASH o SUPERADMIN_PASSWORD en producción.",
    );
  }

  return hashPassword("privacy-guard-dev");
}

export async function createSession(client: SqlClient): Promise<string> {
  const token = createOpaqueToken();
  const expiresAt = new Date(Date.now() + sessionTtlMs).toISOString();
  await client.query(
    `insert into sessions (token_hash, expires_at) values ($1, $2)`,
    [hashToken(token), expiresAt],
  );
  return token;
}

export async function isSessionValid(
  client: SqlClient,
  token: string,
): Promise<boolean> {
  const rows = await client.query<{ id: string }>(
    `select id from sessions
      where token_hash = $1 and revoked_at is null and expires_at > now()`,
    [hashToken(token)],
  );
  return rows.length > 0;
}

export async function revokeSession(
  client: SqlClient,
  token: string,
): Promise<void> {
  await client.query(
    `update sessions set revoked_at = now() where token_hash = $1`,
    [hashToken(token)],
  );
}

export function parseCookies(header: string | undefined): Map<string, string> {
  const cookies = new Map<string, string>();
  if (header === undefined) return cookies;

  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;
    const name = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    if (name.length > 0) cookies.set(name, decodeURIComponent(value));
  }

  return cookies;
}

export const sessionCookieName = "pg_session";

export function buildSessionCookie(token: string, secure: boolean): string {
  const attributes = [
    `${sessionCookieName}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${Math.floor(sessionTtlMs / 1000)}`,
  ];
  if (secure) attributes.push("Secure");
  return attributes.join("; ");
}

export function buildClearedSessionCookie(secure: boolean): string {
  const attributes = [
    `${sessionCookieName}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
  ];
  if (secure) attributes.push("Secure");
  return attributes.join("; ");
}
