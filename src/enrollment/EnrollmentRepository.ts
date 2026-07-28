export interface EnrollmentState {
  readonly installationId: string;
  readonly token: string;
  readonly companyId: string;
  readonly companyName: string;
  readonly userEmail: string;
  readonly enrolledAt: string;
}

export interface EnrollmentStorage {
  get(key: string): Promise<Record<string, unknown>>;
  set(values: Record<string, unknown>): Promise<void>;
  remove(key: string): Promise<void>;
}

const storageKey = "enrollment";

/**
 * Borde persistente del enrolamiento. El token vive únicamente acá y sólo lo
 * lee el background: el content script nunca lo recibe.
 */
export class EnrollmentRepository {
  constructor(private readonly storage: EnrollmentStorage) {}

  async get(): Promise<EnrollmentState | null> {
    try {
      const values = await this.storage.get(storageKey);
      return normalize(values[storageKey]);
    } catch {
      return null;
    }
  }

  async save(state: EnrollmentState): Promise<void> {
    await this.storage.set({ [storageKey]: state });
  }

  async clear(): Promise<void> {
    await this.storage.remove(storageKey);
  }
}

function normalize(value: unknown): EnrollmentState | null {
  if (typeof value !== "object" || value === null) return null;
  const state = value as Record<string, unknown>;

  const fields = [
    "installationId",
    "token",
    "companyId",
    "companyName",
    "userEmail",
    "enrolledAt",
  ] as const;

  for (const field of fields) {
    const current = state[field];
    if (typeof current !== "string" || current.length === 0) return null;
  }

  return {
    installationId: String(state.installationId),
    token: String(state.token),
    companyId: String(state.companyId),
    companyName: String(state.companyName),
    userEmail: String(state.userEmail),
    enrolledAt: String(state.enrolledAt),
  };
}
