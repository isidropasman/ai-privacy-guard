import { readdir, readFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import JSZip from "jszip";
import type { RuntimeConfig } from "../../../packages/contracts/src/index";

export interface PackageRequest {
  readonly extensionDir: string;
  readonly apiBaseUrl: string;
  readonly companyId: string;
  readonly companyName: string;
  readonly enrollmentCode: string;
}

/**
 * Arma el paquete de una empresa a partir del build único de la extensión.
 *
 * No compila nada: lee el build ya generado e inyecta `config.json` más el
 * nombre visible en el manifest. Compilar por empresa tardaría decenas de
 * segundos por descarga y no aportaría nada, porque lo único que cambia entre
 * empresas son datos.
 */
export async function buildCompanyPackage(
  request: PackageRequest,
): Promise<Buffer> {
  const files = await collectFiles(request.extensionDir);
  if (files.length === 0) {
    throw new Error(
      `No se encontró el build de la extensión en ${request.extensionDir}`,
    );
  }

  const zip = new JSZip();

  for (const file of files) {
    const contents = await readFile(join(request.extensionDir, file));
    if (file === "manifest.json") {
      zip.file(file, renameManifest(contents, request.companyName));
      continue;
    }
    zip.file(file, contents);
  }

  const config: RuntimeConfig = {
    apiBaseUrl: request.apiBaseUrl,
    companyId: request.companyId,
    companyName: request.companyName,
    enrollmentCode: request.enrollmentCode,
  };
  zip.file("config.json", `${JSON.stringify(config, null, 2)}\n`);

  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}

function renameManifest(contents: Buffer, companyName: string): string {
  const manifest: unknown = JSON.parse(contents.toString("utf8"));
  if (typeof manifest !== "object" || manifest === null) {
    throw new Error("manifest.json inválido en el build de la extensión");
  }

  const named = manifest as Record<string, unknown>;
  const baseName =
    typeof named.name === "string" ? named.name : "AI Privacy Guard";

  return JSON.stringify(
    { ...named, name: `${baseName} — ${companyName}` },
    null,
    2,
  );
}

async function collectFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, {
    withFileTypes: true,
    recursive: true,
  });

  return entries
    .filter((entry) => entry.isFile())
    .map((entry) =>
      relative(directory, join(entry.parentPath, entry.name))
        .split(sep)
        .join("/"),
    )
    .sort();
}
