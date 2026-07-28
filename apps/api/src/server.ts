import { createApp } from "./app";
import { loadConfig } from "./config";
import { createSqlClient, migrate } from "./db/client";
import { seed } from "./db/seed";

const config = loadConfig();
const client = await createSqlClient(config.databaseUrl);

await migrate(client);
if (process.env.SKIP_SEED !== "1") await seed(client);

const app = createApp(client, config);

app.listen(config.port, () => {
  process.stdout.write(
    `API escuchando en http://localhost:${String(config.port)}\n` +
      `Base: ${config.databaseUrl === undefined ? "PGlite en memoria" : "Neon"}\n` +
      `Build de la extensión: ${config.extensionDir}\n`,
  );
});
