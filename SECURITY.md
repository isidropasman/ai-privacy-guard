# Seguridad

## Controles

- Manifest V3.
- CSP explícita: `script-src 'self'; object-src 'self';`.
- Sin `eval`, `new Function`, scripts remotos ni código descargado.
- Sin backend, `fetch`, XHR, WebSocket o telemetría.
- React renderiza texto como nodos; el contenido del prompt nunca entra en `innerHTML`.
- Validación y normalización al leer Chrome Storage.
- TypeScript strict y lint con `no-explicit-any` y `no-console`.
- Lockfile versionado y scripts de build transitivos allowlisteados sólo para `esbuild` y `spawn-sync`.

## Permisos

| Permiso                     | Motivo                                               |
| --------------------------- | ---------------------------------------------------- |
| `storage`                   | Toggles, términos voluntarios y contadores agregados |
| `https://chatgpt.com/*`     | Inyectar la protección en ChatGPT                    |
| `https://chat.openai.com/*` | Compatibilidad con el dominio histórico              |

No se solicitan `tabs`, `history`, `bookmarks`, `cookies`, `webRequest`, `downloads`, `clipboardRead` ni acceso global a sitios.

## Logging

`Logger` está desactivado por defecto y su API sólo acepta eventos tipados:

- detector ejecutado por ID;
- cantidad de hallazgos;
- decisión.

No acepta prompts, fragmentos, previews libres ni secretos.

## Reporte

No incluyas secretos reales en un issue. Usá fixtures inequívocamente falsas y describí el comportamiento, versión de Chrome y URL del proveedor.
