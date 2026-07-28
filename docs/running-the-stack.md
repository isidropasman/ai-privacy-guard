# Cómo levantar y probar el stack

Recorrido completo: descargar el paquete de una empresa, instalarlo, enrolarse y
ver el evento en el dashboard.

## Requisitos

Node.js 22+ y pnpm. No hace falta instalar Postgres: en desarrollo el API usa
PGlite, un Postgres embebido en memoria.

## 1. Compilar la extensión

```bash
pnpm install
pnpm build
```

El API sirve el paquete a partir de `.output/chrome-mv3`. Si ese build no
existe, la descarga responde 503 con un mensaje explícito.

## 2. Levantar el API

```bash
pnpm api
```

Queda en `http://localhost:8787` con las 8 empresas de demostración cargadas.
La contraseña de super-admin en desarrollo es `privacy-guard-dev`.

Cada reinicio arranca con la base vacía, porque PGlite corre en memoria. Para
conservar los datos entre reinicios:

```bash
PGLITE_DATA_DIR=.pglite pnpm api
```

## 3. Levantar el dashboard

```bash
cd apps/dashboard && pnpm install && pnpm dev
```

Abrí `http://localhost:5173` y entrá con la contraseña. Vite proxea `/admin` al
API, así que dashboard y API comparten origen y la cookie de sesión funciona sin
CORS.

## 4. Descargar el paquete de una empresa

Empresas → Andes Fintech → Ingresar → Extensión → **Descargar extensión**.

Baja `ai-privacy-guard-andes-fintech.zip`, con el `config.json` de esa empresa
inyectado y el nombre del manifest personalizado.

## 5. Instalarlo

1. Descomprimir el zip.
2. Abrir `chrome://extensions`.
3. Activar **Modo de desarrollador**.
4. **Cargar descomprimida** → elegir la carpeta descomprimida.

Al instalarse se abre sola una pestaña de bienvenida que ya reconoce a la
empresa y pide solamente el email.

## 6. Generar un evento

Ir a ChatGPT y escribir algo con una credencial, por ejemplo
`OPENAI_API_KEY=sk-proj-loquesea`. La extensión bloquea el envío. Al elegir
"Eliminar y continuar", el evento se encola y se entrega.

En el dashboard, dentro de esa empresa, aparece en Eventos: usuario, proveedor,
regla activada, severidad, decisión y resolución. Sin el prompt.

## Verificación automatizada

```bash
pnpm test          # 131 unitarios e integración, incluida la lista negra de EventFactory
pnpm e2e           # 8 e2e con la extensión real en Chromium
```

El e2e `telemetry.spec.ts` hace todo el recorrido de arriba de punta a punta:
descarga el paquete del API, lo descomprime, lo carga en Chromium, se enrola,
dispara una detección y verifica que el evento llegó sin filtrar el prompt.

Los otros 7 e2e corren **sin enrolar**, y son la prueba de que la telemetría no
es un requisito para que la extensión proteja.

## Apuntar a producción

El API detecta Neon cuando existe `DATABASE_URL`; sin esa variable usa PGlite.

| Variable                   | Para qué                                                |
| -------------------------- | ------------------------------------------------------- |
| `DATABASE_URL`             | Cadena de conexión de Neon. Su ausencia activa PGlite   |
| `SUPERADMIN_PASSWORD_HASH` | Hash scrypt de la contraseña. Obligatorio en producción |
| `SUPERADMIN_PASSWORD`      | Alternativa en texto plano, sólo para desarrollo        |
| `PUBLIC_API_BASE_URL`      | URL que se hornea en el `config.json` de cada paquete   |
| `WXT_API_HOST`             | Host declarado en `host_permissions` al compilar        |

El host del API queda en el manifest, así que hay que fijarlo **antes** de
generar el zip base. Cambiarlo después obliga a redistribuir el paquete a todas
las empresas.
