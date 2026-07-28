# Telemetría real multi-empresa

Fecha: 2026-07-28
Estado: aprobado, pendiente de plan de implementación

## Objetivo

Capturar eventos reales de una extensión real, instalada por un usuario real de
una empresa real, y verlos en el dashboard.

Hoy la extensión es local-first: no tiene red, ni identidad, ni permisos para un
backend. El dashboard multi-empresa existe pero se alimenta de fixtures. Este
spec construye el puente entre los dos.

## Alcance

El trabajo total se descompone en cuatro slices independientes:

| #   | Slice                                          | Estado        |
| --- | ---------------------------------------------- | ------------- |
| 1   | Identidad y telemetría                         | **Este spec** |
| 2   | Publicación y sincronización de políticas      | Futuro        |
| 3   | Distribución de la extensión por empresa       | Futuro        |
| 4   | Autenticación completa del dashboard con roles | Futuro        |

### Dentro del alcance

- API desplegado en Vercel con Postgres serverless (Neon).
- Enrolamiento de instalaciones a una empresa mediante código y email.
- Cola de eventos en el background de la extensión, con reintentos.
- Ingesta de eventos y heartbeats con contadores agregados.
- Login de super-admin y lectura de datos reales desde el dashboard.
- CRUD de reglas personalizadas en el API, para que el dashboard deje de
  depender de `localStorage`.
- Semilla de las 8 empresas de demostración, sus usuarios y sus códigos.

### Fuera del alcance

- **Las reglas personalizadas no bajan a la extensión.** La extensión sigue
  evaluando con sus reglas base, que se aplican a todas las empresas por igual.
  El CRUD existe sólo para que el dashboard tenga una única fuente de verdad.
- Roles y aislamiento real entre empresas. La sesión sigue siendo la de un
  super-admin único que ve todo.
- Pipeline de build por empresa. Una sola extensión sirve a todas; la empresa se
  determina por el código de enrolamiento.
- Adapters de proveedores nuevos. Sigue siendo sólo ChatGPT.

## Criterios de éxito

1. Un empleado instala la extensión, pega el código de su empresa y su email en
   el popup, y queda enrolado.
2. Escribe un prompt con una API key en ChatGPT. La extensión lo bloquea.
3. El evento aparece en el dashboard, dentro de esa empresa y atribuido a ese
   usuario, sin contener el prompt ni el fragmento detectado.
4. Con el API caído, el envío del usuario funciona igual y el evento se entrega
   cuando el API vuelve.
5. Sin enrolar, la extensión protege exactamente como hoy y no emite nada.

## Arquitectura

### Estructura del repositorio

```text
packages/contracts/     Tipos y esquemas de validación compartidos
apps/api/               Express: enrolamiento, ingesta, lectura del dashboard
apps/dashboard/         Vite estático, mismo deployment de Vercel
api/index.ts            Función catch-all de Vercel que monta el Express
entrypoints/, src/      Extensión, con cambios incrementales
```

Dashboard y API viven en un único proyecto de Vercel y comparten origen, así que
entre ellos no hay CORS y la cookie de sesión queda en su caso más simple. La
extensión, que sí es cross-origin, habla únicamente con `/v1/*`.

`packages/contracts` existe para que la extensión, el API y el dashboard no
puedan desincronizarse. El drift entre lo que la extensión envía y lo que el API
acepta se manifestaría como eventos descartados en silencio, que es el peor modo
de falla posible para un producto cuyo output son los eventos.

### Piezas nuevas en la extensión

| Módulo                                | Responsabilidad                                            |
| ------------------------------------- | ---------------------------------------------------------- |
| `src/enrollment/EnrollmentRepository` | Borde persistente: `installationId`, token, empresa, email |
| `src/enrollment/EnrollmentService`    | Canjea código y email por token contra el API              |
| `src/telemetry/EventFactory`          | Construye el payload seguro desde el outcome. Función pura |
| `src/telemetry/EventQueueRepository`  | Cola acotada en `storage.local`                            |
| `src/telemetry/EventDeliveryService`  | Envío con backoff y jitter, reintentos por `alarms`        |
| `src/telemetry/CounterReporter`       | Heartbeat con contadores acumulados                        |
| `src/messaging/`                      | Mensajes tipados entre content script y background         |

### Flujo completo

```text
Dashboard: el super-admin copia el código de enrolamiento de la empresa
   ↓
Popup: el empleado pega código + email → POST /v1/enroll → token opaco en storage.local
   ↓
Content script: PrivacyReviewService decide, el usuario resuelve
   ↓ mensaje tipado, fire-and-forget
Background: EventFactory arma el evento, EventQueueRepository lo encola
   ↓ flush con backoff; alarms reintenta lo pendiente
POST /v1/events → Neon → el dashboard lo lee
```

### Decisiones de arquitectura

**El token de instalación nunca llega al content script.** El content script se
ejecuta dentro del DOM de `chatgpt.com`, junto a código de terceros. Darle una
credencial que identifica a la empresa sería regalarla. El content script emite
un resultado de decisión sin credenciales; el background, que sí tiene el token,
arma y envía el lote.

**La telemetría queda fuera del camino crítico del envío.** Si el API está
caído, lento, o el token venció, el usuario manda su prompt igual y no se entera.
El único efecto es que el evento espera en la cola. Se prefiere perder un log
antes que interrumpir a alguien que está trabajando.

**El evento es por envío, no por regla.** Un prompt puede activar cinco
detectores. Modelarlo como cinco eventos infla todas las métricas e impide
contestar cuántas veces alguien intentó mandar algo riesgoso. `events` guarda el
envío; `event_rules` guarda cada regla activada.

**El código de enrolamiento es por empresa y reutilizable.** Un código por
empleado obligaría al admin a generar y repartir cientos de códigos. El código
pertenece a la empresa, es revocable y rotable. Riesgo asumido: si se filtra, un
extraño puede enrolarse y escribir eventos falsos en esa empresa, pero no puede
leer nada. Es ruido, no fuga.

**El token se guarda hasheado.** La base almacena SHA-256 del token; el token en
claro sólo existe en el `storage.local` de la extensión. Un dump de la base no
permite suplantar instalaciones.

**La idempotencia es responsabilidad del cliente.** El `id` del evento lo genera
la extensión. Un reintento tras un timeout donde la escritura sí ocurrió
reinserta el mismo `id` y el API lo descarta. Sin esto, el backoff duplicaría
eventos y las métricas serían basura.

## Modelo de datos

```text
companies          id, name, domain, industry, plan, status, seats, created_at
enrollment_codes   code, company_id, revoked_at, created_at
users              id, company_id, email, name, area, role, status
                   único (company_id, email)
installations      id, company_id, user_id, token_hash, extension_version,
                   status, enrolled_at, last_seen_at
events             id, company_id, installation_id, user_id, occurred_at,
                   received_at, provider, decision, resolution,
                   top_severity, score, duration_ms
event_rules        event_id, rule_id, rule_source, category, severity
heartbeats         installation_id, reported_at, extension_version,
                   analyzed_count, allowed_count, warned_count,
                   blocked_count, redacted_count, dropped_count
custom_rules       id, company_id, name, description, keywords, severity,
                   action, enabled, created_at, updated_at
sessions           id, token_hash, created_at, expires_at, revoked_at
enroll_attempts    ip, attempted_at, code_prefix, succeeded
```

`sessions` respalda el login del super-admin: guarda el hash del token de cookie,
su expiración y su revocación. `enroll_attempts` sostiene el rate limiting de
`/v1/enroll`, que en serverless no puede vivir en memoria del proceso.

El evento guarda `decision` —`ALLOW`, `WARN` o `BLOCK`, la salida del
`PolicyEngine`— y `resolution` —lo que el usuario finalmente hizo—. No guarda un
campo `action` separado: mientras sólo existan reglas base, la acción es función
directa de la decisión, y tener las dos invitaría a que se contradigan. La
columna "Acción" del dashboard pasa a llamarse "Decisión". Cuando el slice 2
traiga reglas personalizadas con acción propia, ahí se agrega la columna.

`events.id` es la clave primaria y llega del cliente, lo que da idempotencia sin
tabla auxiliar. Índice por `(company_id, occurred_at desc)` para las consultas
del dashboard.

`event_rules.rule_id` guarda el identificador estable del detector base
(`api-key`, `jwt`, …). El nombre legible no se persiste: el dashboard lo resuelve
con `describeBaseRules()`, que ya importa. Así el catálogo de reglas base tiene
una sola fuente de verdad, que es el código de los detectores.

`rule_source` admite `base` y `custom` desde ahora, aunque en este slice sólo se
emitirán eventos con `base`.

Los contadores del heartbeat son **acumulados desde la instalación**, no deltas.
El servidor guarda cada snapshot recibido. Un heartbeat perdido no corrompe el
total, porque el siguiente lo corrige. Consecuencia asumida: el dashboard puede
mostrar el total analizado acumulado, no "analizados en los últimos 30 días".

## API

### Rutas de la extensión

Autenticación por `Authorization: Bearer <token de instalación>`, salvo
`/v1/enroll`. CORS abierto sólo en `/v1/*`, sin credenciales, porque el ID de una
extensión sin publicar varía entre instalaciones y no puede allowlistearse.

```text
POST /v1/enroll      { code, email, extensionVersion }
                     → { installationId, token, company: { id, name } }
POST /v1/events      { events: [...] }  lote de hasta 50, idempotente por id
                     → { accepted, rejected: [{ id, reason }] }
POST /v1/heartbeat   { counters, extensionVersion } → 204
POST /v1/unenroll    revoca la instalación → 204
```

`/v1/enroll` crea el usuario si el email no existe en esa empresa. Si existe,
reutiliza el registro y crea una instalación nueva. Un mismo usuario puede tener
varias instalaciones, una por navegador.

### Rutas del dashboard

Autenticación por cookie de sesión, mismo origen, sin CORS.

```text
POST   /admin/session                             login
DELETE /admin/session                             logout
GET    /admin/companies                           listado con métricas agregadas
GET    /admin/companies/:id                       detalle
GET    /admin/companies/:id/users
GET    /admin/companies/:id/installations
GET    /admin/companies/:id/events                filtros y paginación por cursor
GET    /admin/events                              actividad global
POST   /admin/companies/:id/enrollment-code/rotate
GET    /admin/companies/:id/rules
POST   /admin/companies/:id/rules
PATCH  /admin/companies/:id/rules/:ruleId
DELETE /admin/companies/:id/rules/:ruleId
```

### Seguridad

- **Token de instalación**: 32 bytes aleatorios en base64url. Se persiste
  hasheado con SHA-256.
- **Contraseña de super-admin**: derivada con scrypt, provista por variable de
  entorno `SUPERADMIN_PASSWORD_HASH`. Nunca en código.
- **Sesión**: token opaco en cookie `HttpOnly`, `Secure`, `SameSite=Lax`,
  persistido hasheado en tabla `sessions` con expiración y revocación.
- **Validación**: esquemas compartidos en todos los bordes. Body máximo 64 KB,
  lote máximo 50 eventos.
- **Rate limiting**: por IP en `/v1/enroll`, para que un código no pueda
  adivinarse por fuerza bruta. Al ser serverless sin estado, la ventana se
  cuenta en la base.
- **Retención**: 90 días. Purga por cron diario de Vercel.

## Cambios en la extensión

### Manifest

Suma el permiso `alarms` y el host del API en `host_permissions`. La URL del API
llega por variable de build (`WXT_API_URL`); no se hardcodea, porque el mismo
código se compila contra desarrollo y contra producción.

### Popup

Gana una pantalla de enrolamiento con código, email, estado de conexión y botón
de desconectar. Los toggles actuales se conservan.

Antes de enrolar, el popup debe informar de forma prominente que a partir de ese
momento la empresa verá metadatos de sus intervenciones. Sin ese aviso el
producto es indefendible frente al empleado.

### PrivacyReviewService

Hoy devuelve una decisión y pierde lo que el usuario terminó haciendo. Se le
inyecta un callback `onOutcome` que emite decisión, acción, resolución final,
reglas activadas, score y duración. El servicio sigue sin conocer mensajería ni
APIs de Chrome.

Esto además corrige el problema 13 del análisis de arquitectura: los contadores
actuales registran la decisión inicial, no la resolución real de cada intento.

### EventFactory

Es la única función autorizada a construir el payload. Su test es una lista
negra explícita: dado un finding con `safePreview`, `matchedText` y offsets, el
payload resultante no puede contener ninguno de esos campos ni ninguna substring
del texto original. Ese test es lo que impide que un refactor futuro filtre datos
sin que nadie lo note.

### Cola y entrega

Cola en `storage.local`, tope de 200 eventos, descarta el más viejo y cuenta los
descartes, que viajan en el heartbeat para que el dashboard pueda mostrar que una
instalación perdió eventos.

Entrega con backoff exponencial y jitter: base 30 s, tope 30 min, disparada por
`chrome.alarms`.

### Manejo de errores

| Situación                  | Comportamiento                                                 |
| -------------------------- | -------------------------------------------------------------- |
| API caído o sin red        | El evento espera en la cola. El envío del usuario no se altera |
| Token revocado (401)       | Deja de reintentar, limpia la cola, el popup pide re-enrolar   |
| Código inválido al enrolar | Error visible en el popup, sin estado parcial                  |
| Cola llena                 | Descarta el más viejo y reporta el descarte en el heartbeat    |
| Evento rechazado (422)     | Se descarta ese evento; el resto del lote continúa             |
| Sin enrolar                | La extensión funciona completa en modo local, sin telemetría   |

La última fila sostiene todo lo demás: el producto sigue siendo local-first y la
telemetría es algo que la empresa agrega, no un requisito para que proteja.

## Cambios en el dashboard

- Nueva capa `src/api/` con fetch tipado. `mockData.ts` se elimina.
- Pantalla de login de super-admin.
- Las secciones existentes ganan estados de carga, error y vacío, que hoy no
  tienen porque asumen datos siempre presentes.
- La sección Extensión muestra el código real con botón de rotar y la lista de
  **instalaciones** reales —versión, última conexión, estado— en lugar de
  usuarios inventados. Hay que corregir el texto que hoy afirma que el código es
  de un solo uso.
- La cobertura se calcula sobre instalaciones que existen.
- La tabla de eventos muestra la regla principal más un indicador de "+N reglas",
  consecuencia de que el evento sea por envío.

## Semilla de datos

El seed carga las 8 empresas, sus usuarios y sus códigos de enrolamiento.

**Los eventos mockeados desaparecen.** Al arrancar se verán las 8 empresas con
cero eventos hasta que se enrole una extensión real y se envíe un prompt con
datos sensibles. Es más brusco visualmente, pero es la única forma de que "logs
reales" signifique eso.

## Documentación de privacidad

`PRIVACY.md` y `THREAT_MODEL.md` quedan **falsos** apenas exista telemetría.
Ambos deben reescribirse antes de habilitar la ingesta, cubriendo:

- Qué se envía: identificadores, proveedor, categoría, severidad, acción,
  resolución, timestamps y contadores agregados.
- Qué nunca se envía: prompt, texto detectado, `safePreview`, offsets asociados a
  texto, URL de conversación, contenido redactado.
- Dónde se guarda, cuánto tiempo, y cómo se desconecta una instalación.

`README.md` y `ARCHITECTURE.md` también necesitan actualización.

## Testing

**Unitario**

- `EventFactory`: lista negra de campos y de substrings del texto original.
- `EventQueueRepository`: límite, orden FIFO, descarte del más viejo, conteo.
- `EnrollmentRepository`: normalización y defaults seguros.
- Backoff: progresión, tope y jitter acotado.

**Integración del API**

- Enrolar, ingerir, leer.
- Idempotencia: el mismo `id` dos veces produce un solo evento.
- Token revocado devuelve 401.
- Validación rechaza payloads malformados sin tumbar el lote entero.

**Integración de la extensión**

- Outcome → cola → flush, con `fetch` mockeado.
- Falla de red deja el evento en cola y no afecta el resultado del envío.

**E2E**

- El E2E actual debe seguir pasando **sin enrolar**. Es la prueba de que la
  telemetría no es requisito.
- E2E nuevo: enrolar contra un API local, enviar un prompt con una API key,
  verificar que el evento llegó a la base y que no contiene el prompt.

## Riesgos y supuestos

1. El email del usuario es declarado, no verificado. Cualquiera con el código de
   la empresa puede enrolarse con el email que quiera. La verificación queda para
   el slice 4.
2. Un código filtrado permite escribir eventos falsos en esa empresa. Mitigación
   disponible: rotarlo desde el dashboard.
3. Vercel es serverless: no hay estado en proceso, no hay SQLite en disco y no
   hay colas del lado del servidor. Toda la resiliencia de entrega vive en la
   extensión.
4. El dominio del API queda horneado en el manifest, así que debe fijarse antes
   de compilar el paquete que instalen las empresas. Cambiarlo después obliga a
   republicar.
5. Las métricas de "total analizado" son acumuladas por instalación, no por
   ventana temporal.
6. La extensión sigue cubriendo sólo ChatGPT.
