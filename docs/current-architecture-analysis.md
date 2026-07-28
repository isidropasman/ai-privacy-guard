# Análisis de arquitectura actual

Fecha del análisis: 2026-07-28

## Alcance y estado de la línea base

El repositorio contiene una extensión Chrome Manifest V3 local-first. No contiene
backend, dashboard administrativo, autenticación, usuarios ni comunicación de red.
El árbol de trabajo estaba limpio al comenzar este análisis.

Stack actual:

- WXT 0.21 y Manifest V3.
- TypeScript 5.9 en modo estricto, React 19 y Shadow DOM.
- `browser.storage.local` para preferencias y contadores.
- Vitest para tests unitarios/de integración y Playwright para E2E.
- ESLint y Prettier.
- Node.js 22+ y pnpm según `package.json`.

No fue posible ejecutar la línea base en el entorno de análisis: `pnpm` no está
instalado, no existe `node_modules` y la versión disponible de Node es 18.19.1,
inferior al mínimo 22 declarado. Esta limitación no implica que la suite falle;
significa que todavía no pudo verificarse localmente.

## Organización actual

```text
entrypoints/
  background.ts           Inicialización de settings al instalar
  content/index.tsx       Composición de adapter, motores, UI e interceptor
  popup/                  Configuración local y contadores
src/
  adapters/               Abstracción del proveedor y adapter de ChatGPT
  detection/              Contratos, engine y detectores base
  interception/           Captura de envíos y guard de reanudación
  policy/                 Score, decisión y orquestación de revisión
  redaction/              Resolución de solapamientos y reemplazos
  security/               Sanitización y logger seguro opcional
  storage/                Repositorio validado de settings locales
  ui/                     Modal, findings y badge
tests/
  unit/                   Detectores, política, storage, adapter y UI
  integration/            Flujo de SubmissionInterceptor
  e2e/                    Extensión real sobre una fixture local de ChatGPT
```

## Flujo completo de envío

1. WXT inyecta `entrypoints/content/index.tsx` en `chatgpt.com` o
   `chat.openai.com` durante `document_idle`.
2. El content script monta `RiskBadge` y los modales React dentro de un Shadow
   DOM.
3. Se instancia `ChatGPTAdapter`. El proveedor no se descubre dinámicamente:
   queda seleccionado por construcción. `ChatGPTAdapter.id` vale `chatgpt` y
   `matchesLocation()` reconoce dos hostnames, aunque el content script actual
   no llama ese método.
4. `initializeProvider()` instala un `MutationObserver` que detecta si se
   reemplazó el composer y actualiza sólo el estado visual `waiting | ready`.
5. `SubmissionInterceptor.start()` agrega listeners en fase de captura sobre
   todo `document` para `click`, `keydown` y `submit`.
6. `ChatGPTAdapter.isSendAction()` considera envío:
   - cualquier `Enter` sin `Shift` y fuera de composición IME;
   - un `submit` del formulario que contiene al composer;
   - un click cuyo target o ancestro coincide con un selector de botón de envío.
7. El interceptor ejecuta `preventDefault()` y `stopImmediatePropagation()`.
   `reviewInFlight` descarta gestos concurrentes.
8. `getComposerText()` vuelve a buscar el composer en el DOM. Lee `value` si es
   `textarea`; para cualquier otro elemento usa `textContent`.
9. `PrivacyReviewService.review()` realiza primero una detección crítica sin
   leer storage. Esto conserva un bloqueo mínimo si falla el almacenamiento.
10. `performReview()` lee settings locales, construye un `DetectorEngine`,
    ejecuta todos los detectores habilitados y pasa sus findings a
    `PolicyEngine`.
11. Si la decisión es `ALLOW`, incrementa `allowedCount` y devuelve permiso sin
    UI.
12. Si la decisión es `WARN` o `BLOCK`, incrementa el contador correspondiente,
    calcula una versión redactada y abre `WarningModal`.
13. La elección puede:
    - redactar y continuar;
    - volver/revisar o cancelar, interrumpiendo;
    - copiar sólo la versión segura;
    - enviar el original ante un warning;
    - enviar un original crítico únicamente si `strictSecrets` está apagado.
14. Para continuar con texto reemplazado, el adapter escribe mediante el setter
    nativo del `textarea` o una transacción de edición para `contenteditable`,
    espera un tick y vuelve a buscar el botón actual.
15. `EventGuard.runApproved()` habilita temporalmente la cadena nativa iniciada
    por `button.click()`. Los listeners ven el guard y no vuelven a analizar ese
    envío. Al finalizar, el guard se cierra.
16. Ante una excepción inesperada del interceptor, el envío queda detenido.
    Ante un error controlado de revisión, el modal técnico sólo ofrece enviar el
    original si la pre-detección crítica determinó que podía hacerse.

## Proveedor y extracción del prompt

El único adapter es `src/adapters/chatgpt/ChatGPTAdapter.ts`. La interfaz
reutilizable `ProviderAdapter` está en `src/adapters/types.ts` y encapsula:

- identificación y matching de URL;
- localización, lectura y escritura del composer;
- localización del botón;
- clasificación del gesto de envío;
- reanudación de un envío aprobado;
- observación de reemplazos del composer.

Los selectores están centralizados en
`src/adapters/chatgpt/selectors.ts`. Se prioriza
`[role="textbox"][contenteditable="true"]`, después se intenta relacionar el
composer con el formulario del botón y finalmente se busca el primer fallback
global.

No existe detección de tipo de cuenta, workspace, conversación, usuario ni
destino más específico que el ID fijo `chatgpt`.

## Reglas base y contrato actual

En el código actual no existe una entidad denominada “regla”. Hay detectores
base TypeScript que implementan:

```ts
interface SensitiveDataDetector {
  readonly id: string;
  readonly label: string;
  detect(input: DetectionInput): DetectionFinding[];
}
```

`DetectionInput` contiene el texto completo y una lista de términos
confidenciales configurados. `DetectionFinding` contiene:

- ID derivado de detector, offsets e índice;
- `detectorId`;
- categoría;
- severidad `low | medium | high | critical`;
- confianza numérica;
- offsets `start`/`end`;
- preview segura, explicación y reemplazo sugerido.

Existe un campo opcional `matchedText`, pero `createFinding()` no lo asigna y los
detectores no lo usan. Esto es positivo para auditoría porque evita propagar el
valor detectado, pero el contrato debería eliminarlo o prohibirlo explícitamente
en eventos.

Detectores críticos, siempre activos:

- `api-key`;
- `private-key`;
- `jwt`;
- `connection-string`;
- `credit-card`.

Detectores de advertencia condicionados por settings:

- `email`, `phone`, `person-name`, `argentine-identity`;
- `financial-information`;
- `confidential-keyword` (siempre instanciado, pero depende de la lista local).

`createDetectorEngine()` es el registro central. Cada revisión crea un engine
nuevo, por lo que su caché en memoria sólo puede reutilizar llamadas dentro de
esa instancia; en el flujo normal tiene poca utilidad. El hash FNV-like es
efímero y no se persiste.

### Ejecución, severidad y decisión

`DetectorEngine.detect()` ejecuta todos los detectores, concatena findings y los
ordena por offset inicial y longitud.

`PolicyEngine.evaluate()`:

- devuelve `ALLOW/0` sin findings;
- devuelve `BLOCK/100` si existe un finding crítico con confianza >= 0.8;
- en los demás casos suma pesos por categoría (o severidad como fallback),
  multiplicados por confianza;
- suma 10 puntos por cada categoría adicional;
- suma 15 puntos por lenguaje de confidencialidad;
- limita el score a 100;
- devuelve `WARN` si existe un finding con confianza >= 0.5 y severidad no baja;
  de lo contrario devuelve `ALLOW`.

La severidad no se agrega como un valor final independiente. El resultado de
política sólo contiene `{ decision, score }`. La acción de reemplazar tampoco
forma parte de la política: es una resolución elegida en UI después de
`WARN/BLOCK`.

### Reemplazos

`RedactionEngine` descarta rangos inválidos, resuelve solapamientos priorizando
severidad, confianza, longitud y posición, y aplica los reemplazos desde el
final del texto. El reemplazo pertenece a cada finding. Esto es reutilizable
para reglas dinámicas si sus matches producen offsets validados y el mismo
contrato seguro.

## Estado, identidad, logs y comunicaciones

- Persistencia: una única clave `settings` de `browser.storage.local`.
- Datos: tres toggles, términos confidenciales y cuatro contadores agregados.
- Identidad: ninguna. No existe ID de usuario, instalación o dispositivo.
- Autenticación/autorización: ninguna. No hay JWT, sesiones, roles ni OAuth.
- Eventos: no hay registro individual de intercepciones.
- Logs: existe un `Logger` cerrado a tres eventos seguros, pero no está conectado
  al flujo de producción.
- Red: no hay `fetch`, XHR, WebSocket ni mensajería entre content/background.
- Background: sólo normaliza/persiste defaults en `onInstalled`.
- Permisos: `storage` y dos orígenes de ChatGPT. No hay permiso para backend,
  alarmas ni otros proveedores.

## Componentes reutilizables

- `ProviderAdapter` separa correctamente el DOM del motor y admite futuros
  adapters.
- `SensitiveDataDetector`, `DetectionFinding`, `DetectorEngine` y
  `RedactionEngine` forman una base pura y testeable para integrar matches
  dinámicos.
- Los IDs de detector, categorías, offsets y replacements permiten generar
  eventos sin prompt completo.
- `SettingsRepository` muestra el patrón correcto: borde persistente tipado,
  normalización al leer y defaults seguros.
- El pre-scan crítico de `PrivacyReviewService` y `EventGuard` ofrecen una base
  fail-safe.
- El background MV3 es el lugar adecuado para sincronización, autenticación de
  instalación, colas y reintentos, aunque hoy no implementa esas funciones.
- La UI React y el toolchain pueden reutilizarse en un dashboard React sin
  compartir componentes acoplados a Shadow DOM.

## Problemas y riesgos detectados

1. **Intercepción de teclado demasiado amplia.** Para un `KeyboardEvent`,
   `isSendAction()` no comprueba que el target sea el composer. Un Enter en otro
   control de la página podría bloquearse y enviar el contenido actual.
2. **Selectores globales amplios.** `[contenteditable="true"]`,
   `textarea` y `button[type="submit"]` pueden seleccionar controles ajenos si
   cambia el DOM o aparece otro formulario.
3. **Reanudación dependiente del click.** `triggerApprovedSubmission()` sólo
   hace click en el botón. Si el proveedor habilita envíos de teclado sin botón,
   cambia el botón o requiere estado interno distinto, el envío puede no
   reanudarse.
4. **El adapter no se valida contra `location`.** `matchesLocation()` existe
   pero no participa en la inicialización.
5. **Cobertura de proveedores incompleta.** Sólo ChatGPT; Claude y Gemini
   requieren manifest, content-script matches y adapters.
6. **“Reglas” y detectores están acoplados.** Los detectores fijan en código
   categoría, severidad, confianza, texto de UI y reemplazo. No existe una capa
   de definición de reglas ni versionado.
7. **Semántica insuficiente para reglas administradas.** `PolicyResult` no
   informa severidad final, reglas activadas, acción aplicada ni versión de
   política. `SubmissionReview` tampoco conserva esa trazabilidad.
8. **Identidad y persistencia empresarial ausentes.** No se pueden atribuir ni
   sincronizar eventos, políticas o roles.
9. **Contadores con read-modify-write no atómico.** Dos revisiones desde
   contextos distintos pueden perder incrementos.
10. **Caché casi inefectivo.** Se crea un `DetectorEngine` en cada revisión.
11. **Riesgo de exposición futura.** Findings contienen previews y el texto
    redactado completo llega a UI. Ninguno debe reutilizarse sin filtrado como
    payload de auditoría.
12. **Sin timeout de revisión.** Storage/UI pueden dejar `reviewInFlight`
    bloqueado indefinidamente. La red no debe incorporarse al camino crítico de
    envío.
13. **Métrica ambigua.** Los contadores registran decisiones iniciales y una
    redacción adicional; no registran la resolución final de cada intento ni
    cancelaciones.
14. **Configuración local no administrada.** Los términos confidenciales del
    popup no tienen ID, diccionario, versión, fuente ni política de precedencia.
15. **Documentación de privacidad incompatible con el objetivo futuro.** La
    promesa actual de “sin backend/telemetría” deberá actualizarse de forma
    explícita, manteniendo la garantía de no transmitir prompts completos.

## Arquitectura final propuesta

Se propone evolucionar el repositorio a un workspace sin reescribir la
extensión:

```text
apps/
  api/                    Express + TypeScript + SQLite
  dashboard/              React + TypeScript
packages/
  contracts/              Tipos, esquemas y enums compartidos
  policy-engine/          Evaluador dinámico puro y sin código remoto
entrypoints/, src/        Extensión existente, modificada incrementalmente
```

Para el MVP:

- Express es suficiente; NestJS agregaría estructura y dependencias no
  justificadas por el tamaño actual.
- SQLite con migraciones incrementales es coherente con una ejecución local.
  La capa de repositorios debe permitir migrar a PostgreSQL sin cambiar
  contratos HTTP ni motores.
- Inputs HTTP, políticas descargadas y datos leídos de storage se validarán con
  esquemas compartidos. El engine sólo aceptará documentos ya validados.
- El dashboard y API tendrán contratos compartidos, pero no importarán código
  del content script ni componentes Shadow DOM.

### Modelo de reglas dinámicas

Una regla será datos JSON, nunca JavaScript ejecutable. Tendrá ID estable,
revisión, estado de borrador/archivo, enabled, metadata, scope de proveedores,
severidad, acción, mensaje, estrategia de reemplazo y un árbol de condiciones
validado.

Operadores MVP:

- `contains_any`;
- `contains_all`;
- `regex` con límites de longitud/flags y defensa contra patrones riesgosos;
- `dictionary` por ID y versión;
- `detector` que referencia IDs base allowlisteados;
- grupos `all`, `any` y `not` con profundidad y cantidad máximas.

El evaluador dinámico produce `DetectionFinding` compatibles y metadata de
regla separada. No se persistirán `matchedText`, previews libres ni texto
original. Los detectores base se registrarán con IDs estables y se conservarán.

Se agregará un resultado unificado con:

- decisión y acción;
- severidad y score finales;
- findings;
- IDs y revisiones de reglas activadas;
- versión de política;
- duración de evaluación.

La precedencia propuesta es `BLOCK > REPLACE > WARN > ALLOW`; dentro de igual
acción prevalece mayor severidad y luego una prioridad explícita estable. Las
reglas dinámicas no podrán desactivar ni degradar detectores base críticos.

### Publicación y sincronización

1. El administrador guarda drafts validados.
2. Publicar crea un snapshot inmutable, monótono y transaccional que incluye
   reglas activas y versiones de diccionarios.
3. El background de la extensión consulta `latest` con versión/ETag.
4. Verifica esquema, tamaño y versión antes de reemplazar la última política
   válida en `browser.storage.local`.
5. El content script obtiene sólo el snapshot local, combina base + dinámicas y
   evalúa sin esperar red.
6. Si backend o validación fallan, continúa la última política válida; si nunca
   hubo una, usa reglas base.

Estrategia: **híbrida y base-first**. Una falla de backend nunca deshabilita
reglas base. Los críticos base son fail-closed ante fallas de settings o
evaluación, como hoy. La indisponibilidad de políticas dinámicas es fail-open
solamente respecto de reglas que el dispositivo nunca recibió. Se debe mostrar
salud/desactualización administrativa y definir una antigüedad máxima, sin
poner una llamada de red en el camino de envío.

### Eventos seguros

El content script construirá un evento sin prompt y lo enviará al background.
El background hará entrega asíncrona, cola acotada, backoff con jitter y
reintentos por alarmas. El envío al proveedor no dependerá del éxito de
telemetría.

Payload permitido:

- UUID de evento, timestamp y duración;
- IDs opacos de usuario/instalación;
- proveedor/destino y tipo de cuenta sólo si se detectan de forma confiable;
- IDs/revisiones de reglas y categorías;
- severidad, acción, resolución y versión de política;
- cantidades por categoría;
- opcionalmente hashes HMAC con clave organizacional para correlación, nunca
  hashes simples de valores de baja entropía;
- nunca prompt, match, offsets acompañados de texto, URL de conversación o
  `safePreview`.

Para soportar “total analizado”, se registrará un evento metadata-only también
para `ALLOW`, o un agregado equivalente. El dashboard de intercepciones
mostrará por defecto sólo eventos con findings.

### Autenticación e identidad

No existe autenticación reutilizable. Para el MVP:

- dashboard con sesión opaca en cookie `HttpOnly`, `Secure` y `SameSite`,
  almacenada y revocable en DB;
- contraseñas derivadas con una función segura y usuario administrador inicial
  creado desde variables de entorno, nunca hardcodeado;
- roles `ADMIN`, `SECURITY_ANALYST` y `VIEWER`, aplicados por middleware;
- protección de mutaciones por verificación de origen/CSRF;
- instalación con UUID aleatorio local y credencial opaca emitida mediante un
  código de enrolamiento de un solo uso;
- la credencial de instalación se guarda en storage de extensión, nunca en
  código fuente, y es revocable/rotable;
- no se intentará inferir la identidad de ChatGPT. Usuario corporativo y tipo
  de cuenta serán `unknown` hasta contar con enrolamiento o integración
  explícita.

### Diccionarios

Los diccionarios serán entidades versionadas. Un snapshot publicado incluirá
los valores normalizados necesarios para evaluación local, evitando una
consulta por match. Las referencias se resolverán al publicar, y una política
no podrá publicarse con diccionarios ausentes. Cambiar un valor crea una nueva
revisión de diccionario y una nueva versión de política.

## Archivos previstos para la implementación

Archivos existentes a modificar:

- `package.json`, `pnpm-workspace.yaml`, `tsconfig.json`, `vitest.config.ts`;
- `wxt.config.ts`;
- `entrypoints/background.ts`, `entrypoints/content/index.tsx`;
- `src/adapters/types.ts`, `src/adapters/chatgpt/ChatGPTAdapter.ts` y
  `src/adapters/chatgpt/selectors.ts`;
- `src/detection/types.ts`, `src/detection/createDetectorEngine.ts`;
- `src/policy/PolicyEngine.ts`, `src/policy/PrivacyReviewService.ts`;
- `src/interception/SubmissionInterceptor.ts`;
- `src/storage/SettingsRepository.ts`;
- tests unitarios, de integración y E2E afectados;
- `README.md`, `ARCHITECTURE.md`, `SECURITY.md`, `PRIVACY.md`,
  `THREAT_MODEL.md` y `TESTING.md`.

Componentes nuevos previstos:

- `packages/contracts`: reglas, políticas, eventos, métricas, auth y validación;
- `packages/policy-engine`: evaluación de condiciones dinámicas;
- `apps/api`: configuración, DB/migraciones no destructivas, repositorios,
  auth/RBAC, reglas, diccionarios, publicación, eventos y métricas;
- `apps/dashboard`: login, shell RBAC, reglas/diccionarios, prueba/publicación,
  eventos, filtros y métricas;
- `src/policy/PolicyRepository.ts`: snapshot local validado;
- `src/sync/PolicySyncService.ts`: descarga/versionado;
- `src/events/EventQueueRepository.ts` y `EventDeliveryService.ts`;
- mensajería tipada entre content script y background;
- tests del engine dinámico, publicación/descarga, eventos, RBAC y endpoints.

La lista exacta podrá subdividir archivos durante la implementación, pero no se
reemplazarán detectores base ni se modificará su comportamiento sin un test y
una justificación registrada.

## Supuestos concretos

1. El MVP se ejecutará inicialmente como un despliegue de una sola organización.
2. SQLite es aceptable para desarrollo/MVP; producción multi-instancia requerirá
   PostgreSQL.
3. La URL del API será configuración de build no secreta y su origen deberá
   declararse explícitamente en permisos del manifest.
4. Los administradores se enrolan por variables de entorno/CLI, no mediante
   registro público.
5. La extensión no puede obtener de forma confiable el usuario o tipo de cuenta
   del proveedor; usará identidad corporativa de enrolamiento.
6. Las reglas base críticas no pueden ser desactivadas remotamente.
7. La última política validada puede seguir operando offline.
8. No se almacenará prompt completo ni vista anonimizada en el MVP.
9. El dashboard será una aplicación web separada del popup.
10. Se mantendrán los IDs actuales de detectores como referencias estables.

## Criterios de integración recomendados

- Corregir y ampliar tests de interceptación antes de agregar providers o red.
- Definir contratos y esquemas antes de DB o UI.
- Mantener detección y evaluación como funciones puras.
- Hacer publicación transaccional e inmutable; edición sólo sobre drafts.
- Validar en API, al descargar y al leer storage (defensa en profundidad).
- Mantener sync y auditoría fuera del camino crítico del envío.
- Limitar tamaños de políticas, diccionarios, regex, árbol de condiciones y
  cola local.
- Actualizar documentación de privacidad y consentimiento antes de habilitar
  eventos remotos.
