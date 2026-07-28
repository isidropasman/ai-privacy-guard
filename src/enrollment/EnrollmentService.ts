import type { RuntimeConfig } from "../../packages/contracts/src/index";
import type {
  EnrollmentRepository,
  EnrollmentState,
} from "./EnrollmentRepository";

export type EnrollmentResult =
  | { readonly ok: true; readonly state: EnrollmentState }
  | { readonly ok: false; readonly error: string };

export interface EnrollmentServiceDependencies {
  readonly repository: EnrollmentRepository;
  readonly fetchImpl: typeof fetch;
  readonly extensionVersion: string;
  readonly now: () => Date;
}

interface EnrollResponseBody {
  readonly installationId?: unknown;
  readonly token?: unknown;
  readonly company?: { readonly id?: unknown; readonly name?: unknown };
  readonly userEmail?: unknown;
  readonly error?: unknown;
}

export class EnrollmentService {
  constructor(private readonly dependencies: EnrollmentServiceDependencies) {}

  async enroll(
    config: RuntimeConfig,
    code: string,
    email: string,
  ): Promise<EnrollmentResult> {
    let response: Response;

    try {
      response = await this.dependencies.fetchImpl(
        `${config.apiBaseUrl}/v1/enroll`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            code,
            email,
            extensionVersion: this.dependencies.extensionVersion,
          }),
        },
      );
    } catch {
      return {
        ok: false,
        error: "No se pudo contactar al servidor. Revisá tu conexión.",
      };
    }

    let body: EnrollResponseBody;
    try {
      body = (await response.json()) as EnrollResponseBody;
    } catch {
      return {
        ok: false,
        error: "El servidor devolvió una respuesta inválida.",
      };
    }

    if (!response.ok) {
      return {
        ok: false,
        error:
          typeof body.error === "string"
            ? body.error
            : "No se pudo completar el enrolamiento.",
      };
    }

    if (
      typeof body.installationId !== "string" ||
      typeof body.token !== "string" ||
      typeof body.company?.id !== "string" ||
      typeof body.company.name !== "string" ||
      typeof body.userEmail !== "string"
    ) {
      return { ok: false, error: "El servidor devolvió datos incompletos." };
    }

    const state: EnrollmentState = {
      installationId: body.installationId,
      token: body.token,
      companyId: body.company.id,
      companyName: body.company.name,
      userEmail: body.userEmail,
      enrolledAt: this.dependencies.now().toISOString(),
    };

    await this.dependencies.repository.save(state);
    return { ok: true, state };
  }

  async unenroll(config: RuntimeConfig): Promise<void> {
    const state = await this.dependencies.repository.get();
    // El borrado local ocurre siempre: si el servidor no responde, el usuario
    // igual queda desconectado en su navegador.
    await this.dependencies.repository.clear();
    if (state === null) return;

    try {
      await this.dependencies.fetchImpl(`${config.apiBaseUrl}/v1/unenroll`, {
        method: "POST",
        headers: { authorization: `Bearer ${state.token}` },
      });
    } catch {
      // Sin acción: la revocación del lado del servidor es best-effort.
    }
  }
}
