import {
  parseRuntimeConfig,
  type RuntimeConfig,
} from "../../packages/contracts/src/index";

export type ConfigLoader = () => Promise<unknown>;

/**
 * Lee la configuración inyectada por empresa en `config.json`.
 *
 * Se lee en runtime y no como variable de compilación porque el paquete se
 * genera inyectando ese archivo en un build ya compilado.
 *
 * La ausencia de configuración no es un error: la extensión funciona en modo
 * local sin telemetría, que es el estado de un build de desarrollo.
 */
export class RuntimeConfigRepository {
  private cached: RuntimeConfig | null | undefined;

  constructor(private readonly load: ConfigLoader = defaultLoader) {}

  async get(): Promise<RuntimeConfig | null> {
    if (this.cached !== undefined) return this.cached;

    try {
      this.cached = parseRuntimeConfig(await this.load());
    } catch {
      this.cached = null;
    }

    return this.cached;
  }
}

async function defaultLoader(): Promise<unknown> {
  const response = await fetch(browser.runtime.getURL("/config.json"));
  if (!response.ok) return null;
  return response.json();
}
