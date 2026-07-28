import { join } from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import { createApp } from "../apps/api/src/app";
import { loadConfig } from "../apps/api/src/config";
import { createSqlClient, migrate } from "../apps/api/src/db/client";
import { seed } from "../apps/api/src/db/seed";

// El bundle de la función se monta en el cwd del runtime, así que el build de
// la extensión que empaqueta /admin/companies/:id/extension/download hay que
// resolverlo contra ese cwd y no contra el layout del repo.
process.env.EXTENSION_DIR ??= join(process.cwd(), ".output", "chrome-mv3");

// Una sola inicialización por instancia: Fluid reutiliza el proceso entre
// invocaciones, así que migrate y seed no corren por request. Ambos son
// idempotentes (`create table if not exists`, `on conflict do update`), de modo
// que un cold start nuevo no duplica ni pisa datos reales.
const ready = (async () => {
  const config = loadConfig();
  const client = await createSqlClient(config.databaseUrl);

  await migrate(client);
  if (process.env.SKIP_SEED !== "1") await seed(client);

  return createApp(client, config);
})();

export default async function handler(
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  const app = await ready;
  app(request as never, response as never);
}
