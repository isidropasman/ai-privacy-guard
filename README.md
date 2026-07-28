# AI Privacy Guard

Extensión Chrome local-first que detecta información sensible antes de enviarla a ChatGPT.

> Usá la IA. No filtres información confidencial.

## Qué protege

- Credenciales de OpenAI, Anthropic, Google, AWS, GitHub, Slack, Stripe y Twilio.
- Claves privadas, JWT, connection strings y tarjetas válidas por Luhn.
- Emails, teléfonos, nombres personales y datos argentinos en contexto.
- Información financiera interna.
- Proyectos, clientes y términos configurados localmente.

Los prompts seguros se envían sin UI. Los riesgos medios ofrecen anonimización en un clic. Los secretos críticos quedan bloqueados hasta eliminar la información detectada.

## Desarrollo

Requiere Node.js 22 o superior, pnpm y Chrome/Chromium.

```bash
pnpm install
pnpm dev
```

## Build e instalación unpacked

```bash
pnpm build
```

1. Abrí `chrome://extensions`.
2. Activá **Modo desarrollador**.
3. Elegí **Cargar extensión sin empaquetar**.
4. Seleccioná `.output/chrome-mv3`.
5. Abrí `https://chatgpt.com`.
6. Verificá el indicador **Protected**.

## Demo

Prompt seguro:

```text
Explicame de manera sencilla qué es Kubernetes.
```

PII:

```text
Ayudame a escribirle a Juan Pérez. Su email es juan.perez@example.com.
```

Información empresarial:

```text
Nuestro margen interno para Cliente ACME es 47% y pensamos bajar el precio a USD 80.000. Esta información todavía no fue anunciada.
```

Credencial ficticia:

```text
OPENAI_API_KEY=sk-proj-example-for-testing
```

La credencial es una fixture inválida. No uses secretos reales para probar.

## Verificación

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm e2e
```

## Privacidad

- Sin backend ni requests de análisis.
- Sin historial de prompts.
- Sin telemetría de contenido.
- Chrome Storage guarda únicamente configuración voluntaria y contadores numéricos.
- El caché de análisis vive en memoria y se identifica con un hash efímero no persistido.

## Limitaciones conocidas

- Sólo cubre `chatgpt.com` y el dominio histórico `chat.openai.com`.
- Cambios profundos en el DOM del proveedor pueden requerir actualizar selectores.
- La detección heurística puede producir falsos positivos o falsos negativos.
- No analiza archivos adjuntos, imágenes, voz, requests de red ni aplicaciones de escritorio.
- Una extensión de consumo puede desactivarse o evitarse usando otro navegador o proveedor.

## Roadmap

1. Adaptadores para Claude y Gemini.
2. Análisis local de archivos antes de adjuntarlos.
3. Políticas empresariales administradas y Chrome Enterprise force-install.
4. Integración con controles de endpoint, proxy o secure web gateway.
5. Eventos empresariales sin contenido para SIEM.

Consultá [ARCHITECTURE.md](ARCHITECTURE.md), [SECURITY.md](SECURITY.md), [PRIVACY.md](PRIVACY.md), [THREAT_MODEL.md](THREAT_MODEL.md) y [TESTING.md](TESTING.md).
