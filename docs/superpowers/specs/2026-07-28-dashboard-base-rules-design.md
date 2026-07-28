# Reglas base en el dashboard — diseño

Fecha: 2026-07-28

## Objetivo

El dashboard local (`apps/dashboard`) ya permite crear y administrar reglas
personalizadas (prototipo, persistidas en `localStorage`), pero no muestra las
reglas base que la extensión ya aplica en producción (los detectores de
`src/detection/detectors/*`). Esta etapa agrega una sección de solo lectura
"Reglas base" que refleja esas reglas reales.

## Alcance

- Mostrar en el dashboard la lista real de detectores base y si están
  siempre activos o condicionados por un ajuste del popup.
- No se toca la sección de reglas personalizadas ni la de eventos.
- No hay backend, red, autenticación ni sincronización con otra instalación
  de la extensión. Los detectores base son idénticos en cualquier
  instalación porque están hardcodeados en el código fuente; no hace falta
  ningún dato de otra computadora para mostrarlos.
- Las reglas base siguen siendo de solo lectura: no se pueden crear, editar
  ni desactivar desde el dashboard. Alta y edición siguen existiendo
  únicamente para reglas personalizadas (ya implementado).

## Por qué se necesita tocar 2 archivos de la extensión

`DetectorEngine` guarda el array de detectores registrados en un campo
`private`. Ni `createDetectorEngine()` ni `createCriticalDetectorEngine()`
exponían antes una forma de leer esa lista desde afuera. Para que el
dashboard refleje altas/bajas de detectores sin mantenimiento manual
duplicado, se agregan dos cambios aditivos, sin alterar comportamiento
existente:

1. `src/detection/DetectorEngine.ts`: getter público de solo lectura
   `detectors` que expone el array ya construido en el constructor.
2. `src/detection/createDetectorEngine.ts`: nueva función exportada
   `describeBaseRules()`.

Ningún export, firma ni comportamiento existente cambia. No se modifica
`PolicyEngine`, `PrivacyReviewService`, ni ningún detector individual.

### `describeBaseRules()`

Deriva el estado de activación construyendo tres engines con la propia
`createDetectorEngine()` real (no se reimplementa esa lógica):

- `allOff`: `warningsEnabled: false`, `financialDetectionEnabled: false`.
- `warningsOnly`: `warningsEnabled: true`, `financialDetectionEnabled: false`.
- `financialOnly`: `warningsEnabled: false`, `financialDetectionEnabled: true`.

Con los `id` de `allOff.detectors` se obtienen los detectores siempre
activos (incluye los críticos y `confidential-keyword`, que siempre se
instancia). La diferencia `warningsOnly - allOff` da los detectores
condicionados por `warningsEnabled`; `financialOnly - allOff` da los
condicionados por `financialDetectionEnabled`. Si en el futuro se agrega o
quita un detector en `createDetectorEngine()`, esta derivación lo refleja
automáticamente, sin tocar el dashboard.

`id` y `label` de cada regla salen de la instancia real del detector
(`detector.id`, `detector.label`), nunca de una copia manual.

La descripción corta en español de cada regla (para UX, no para lógica) sale
de un mapa local `descriptionById: Record<string, string>` dentro del mismo
archivo. Si un id no está en el mapa (por ejemplo, un detector nuevo que
todavía no fue documentado), se muestra un texto genérico de respaldo — la
regla igual aparece en la lista, nunca se oculta por falta de descripción.

Forma del resultado:

```ts
export interface BaseRuleDescriptor {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly alwaysActive: boolean;
  readonly requiresSetting?: "warningsEnabled" | "financialDetectionEnabled";
}

export function describeBaseRules(): readonly BaseRuleDescriptor[];
```

## Cambios en el dashboard

- `apps/dashboard/src/BaseRulesSection.tsx` (nuevo): importa
  `describeBaseRules` desde `../../../src/detection/createDetectorEngine` y
  renderiza una tabla de solo lectura reusando `PageHeader` y las clases de
  tabla ya existentes (`panel table-panel`, etc.).
  Columnas: Detector (label + id), Descripción, Estado (Siempre activo /
  Depende de "Advertir sobre datos personales" / Depende de "Detectar
  información financiera").
- `apps/dashboard/src/App.tsx`: nuevo ítem de navegación "Reglas base",
  primero en la lista (antes de "Reglas personalizadas"); nuevo tipo de
  `Section` y rama de render.
- `apps/dashboard/vite.config.ts`: se esperaba tener que agregar
  `server.fs.allow` apuntando a la raíz del repo (`import {
searchForWorkspaceRoot } from "vite"`), porque Vite por defecto no sirve
  en dev archivos fuera de la carpeta del proyecto (`apps/dashboard`). En
  la práctica esto resultó innecesario: Vite detecta automáticamente la
  raíz del workspace de pnpm a partir del `pnpm-lock.yaml` de la raíz del
  repo, así que `pnpm dev` funciona sin tocar la configuración.
  `vite.config.ts` queda sin modificar.
- `apps/dashboard/src/styles.css`: se reutilizan clases existentes; solo se
  agrega alguna regla puntual si hace falta (por ejemplo, para el texto de
  "Depende de…"), sin reestructurar el archivo.

No se modifica `RulesSection.tsx`, `EventsSection.tsx`, `storage.ts`,
`mockData.ts` ni `types.ts` del dashboard.

## Verificación local de que no se rompe nada

Los detectores base son puros (no dependen del DOM ni de `browser.*`); el
único import cruzado (`PrivacyGuardSettings` en `createDetectorEngine.ts`)
es `import type`, por lo que no arrastra código de storage al bundle del
dashboard en runtime.

Pasos de verificación antes de dar por cerrada la etapa:

1. `pnpm typecheck` y `pnpm build` en la raíz (extensión) — deben seguir
   pasando sin cambios de comportamiento.
2. Tests unitarios existentes de `detection/` — deben seguir pasando sin
   modificaciones.
3. Test unitario nuevo para `describeBaseRules()` (agrupa correctamente los
   11 detectores conocidos en siempre-activo / condicionado por
   `warningsEnabled` / condicionado por `financialDetectionEnabled`).
4. `apps/dashboard`: `pnpm typecheck`, `pnpm build`, y `pnpm dev` con
   verificación manual en el navegador de que la sección "Reglas base"
   muestra las 11 reglas con el estado correcto.

## Fuera de alcance (etapas futuras, no se implementan ahora)

- Backend, autenticación, roles, publicación/versionado de políticas.
- Sincronización en vivo con una instalación real de la extensión.
- Edición o desactivación de reglas base desde el dashboard.
- Recepción real de eventos (la sección "Eventos" sigue con datos
  mockeados).
