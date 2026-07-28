# Security Genie Mascot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrar una mascota pixel-art persistente en ChatGPT que refleje el ciclo de revisión del prompt y permita resolver anonimización, verificación y bloqueo.

**Architecture:** El content script mantiene un único estado visual de la mascota dentro del Shadow DOM existente. `SubmissionInterceptor` publica eventos del ciclo de envío y `PrivacyReviewService` devuelve resultados con suficiente semántica para distinguir permitido, anonimizado, verificación y bloqueo; la mascota muestra feedback compacto y el modal actual conserva las decisiones complejas.

**Tech Stack:** TypeScript strict, React 19, WXT, Shadow DOM, CSS sprite animations, Vitest + jsdom.

## Global Constraints

- No agregar dependencias de animación.
- No usar `any`; datos desconocidos usan `unknown` con type guards.
- No cambiar las reglas de detección, redacción o política.
- No enviar telemetría ni contenido fuera del dispositivo.
- Respetar `prefers-reduced-motion`.
- No hacer commits ni staging sin autorización explícita.

---

## File map

- Create: `src/ui/mascot/mascotState.ts` — máquina de estados y copy de la mascota.
- Create: `src/ui/mascot/SecurityGenie.tsx` — render del personaje, burbuja y acciones compactas.
- Create: `src/ui/mascot/security-genie.css` — posicionamiento y animaciones por estado.
- Create: `public/mascot/security-genie.webp` — sprite sheet optimizado y con transparencia.
- Modify: `src/interception/SubmissionInterceptor.ts` — callbacks del ciclo de revisión.
- Modify: `src/policy/PrivacyReviewService.ts` — clasificar el resultado visual sin duplicar política.
- Modify: `entrypoints/content/index.tsx` — montar el controlador React y conectar eventos.
- Modify: `entrypoints/content/styles.css` — importar estilos y retirar el badge anterior.
- Test: `tests/unit/ui/mascotState.test.ts`.
- Test: `tests/unit/ui/SecurityGenie.test.tsx`.
- Modify: `tests/integration/submission-interceptor.test.ts`.
- Modify: `tests/unit/policy/PrivacyReviewService.test.ts`.

### Task 1: Preparar los assets definitivos

**Files:**

- Create: `public/mascot/security-genie.webp`

**Interfaces:**

- Produces: sprite sheet de seis filas (`idle`, `scanning`, `allow`, `redacted`, `verify`, `block`) con frames cuadrados de `192×192`.

- [ ] **Step 1: Generar los keyframes consistentes**

Usar el personaje aprobado como referencia y generar cada estado con idénticas proporciones, ropa, anteojos, color y cola. La animación `allow` termina con el personaje de costado, poste izquierdo libre, soga anclada al poste derecho y extremo suelto en su mano.

- [ ] **Step 2: Normalizar los frames**

Exportar cada frame a lienzo `192×192`, fondo transparente, nearest-neighbor y origen visual estable en el centro inferior.

- [ ] **Step 3: Construir y optimizar el sprite**

Crear una única imagen WebP lossless. Verificar que no haya halos, recortes ni desplazamientos involuntarios entre frames.

- [ ] **Step 4: Validar el tamaño**

Run:

```bash
du -h public/mascot/security-genie.webp
```

Expected: asset menor a `500 KB`.

### Task 2: Definir la máquina de estados visual

**Files:**

- Create: `src/ui/mascot/mascotState.ts`
- Test: `tests/unit/ui/mascotState.test.ts`

**Interfaces:**

- Produces:

```ts
export type MascotState =
  | { readonly kind: "idle" }
  | { readonly kind: "scanning" }
  | { readonly kind: "allow"; readonly message: string }
  | { readonly kind: "redacted"; readonly message: string }
  | { readonly kind: "verify"; readonly message: string }
  | { readonly kind: "block"; readonly message: string }
  | { readonly kind: "error"; readonly message: string };

export type MascotEvent =
  | { readonly kind: "review-started" }
  | { readonly kind: "allowed" }
  | { readonly kind: "redacted" }
  | { readonly kind: "verification-requested" }
  | { readonly kind: "blocked" }
  | { readonly kind: "interrupted" }
  | { readonly kind: "failed" }
  | { readonly kind: "reset" };

export function reduceMascotState(
  state: MascotState,
  event: MascotEvent,
): MascotState;
```

- [ ] **Step 1: Escribir tests fallidos de transiciones**

Cubrir:

```ts
expect(reduceMascotState({ kind: "idle" }, { kind: "review-started" })).toEqual(
  { kind: "scanning" },
);
expect(reduceMascotState({ kind: "scanning" }, { kind: "allowed" })).toEqual({
  kind: "allow",
  message: "Todo limpio. Pasá.",
});
expect(reduceMascotState({ kind: "scanning" }, { kind: "redacted" })).toEqual({
  kind: "redacted",
  message: "Anonimicé los datos sensibles antes de enviarlo.",
});
expect(
  reduceMascotState({ kind: "scanning" }, { kind: "verification-requested" }),
).toEqual({
  kind: "verify",
  message: "Encontré información sensible. Revisala antes de seguir.",
});
expect(reduceMascotState({ kind: "scanning" }, { kind: "blocked" })).toEqual({
  kind: "block",
  message: "Esto no puede salir sin que lo corrijas.",
});
```

- [ ] **Step 2: Ejecutar el test y verificar que falle**

Run:

```bash
pnpm vitest run tests/unit/ui/mascotState.test.ts
```

Expected: FAIL porque el módulo todavía no existe.

- [ ] **Step 3: Implementar el reducer exhaustivo**

Usar un `switch` sobre `event.kind` y un helper `assertNever(value: never)` para impedir eventos sin manejar.

- [ ] **Step 4: Ejecutar el test**

Run:

```bash
pnpm vitest run tests/unit/ui/mascotState.test.ts
```

Expected: PASS.

### Task 3: Exponer el ciclo semántico de revisión

**Files:**

- Modify: `src/interception/SubmissionInterceptor.ts`
- Modify: `src/policy/PrivacyReviewService.ts`
- Modify: `tests/integration/submission-interceptor.test.ts`
- Modify: `tests/unit/policy/PrivacyReviewService.test.ts`

**Interfaces:**

- `SubmissionReview` produce:

```ts
export type SubmissionReview =
  | { readonly kind: "allow"; readonly outcome: "clean" }
  | {
      readonly kind: "allow";
      readonly outcome: "redacted";
      readonly replacementText: string;
    }
  | { readonly kind: "interrupt"; readonly outcome: "cancelled" | "blocked" }
  | { readonly kind: "error"; readonly originalMayBeSent: boolean };
```

- `SubmissionInterceptorOptions` consume:

```ts
readonly onReviewStarted: () => void;
readonly onReviewCompleted: (review: SubmissionReview) => void;
```

- [ ] **Step 1: Actualizar los tests del servicio**

Esperar `outcome: "clean"` para `ALLOW`, `outcome: "redacted"` cuando el usuario elige anonimizar y `outcome: "blocked"` cuando una decisión `BLOCK` no continúa.

- [ ] **Step 2: Actualizar los tests del interceptor**

Verificar que `onReviewStarted` ocurra una vez antes de `review()` y que `onReviewCompleted` reciba exactamente el resultado devuelto antes de continuar o interrumpir.

- [ ] **Step 3: Ejecutar los tests y verificar que fallen**

Run:

```bash
pnpm vitest run tests/unit/policy/PrivacyReviewService.test.ts tests/integration/submission-interceptor.test.ts
```

Expected: FAIL por callbacks y outcomes ausentes.

- [ ] **Step 4: Implementar los outcomes en `PrivacyReviewService`**

Mantener intactas las decisiones actuales. Agregar solamente la clasificación del resultado en cada retorno.

- [ ] **Step 5: Publicar inicio y finalización desde `SubmissionInterceptor`**

Llamar `onReviewStarted()` después de bloquear el evento y antes de leer/revisar el texto. Llamar `onReviewCompleted(review)` inmediatamente después de resolver `review(text)`.

- [ ] **Step 6: Ejecutar los tests**

Run:

```bash
pnpm vitest run tests/unit/policy/PrivacyReviewService.test.ts tests/integration/submission-interceptor.test.ts
```

Expected: PASS.

### Task 4: Construir la mascota y su burbuja

**Files:**

- Create: `src/ui/mascot/SecurityGenie.tsx`
- Create: `src/ui/mascot/security-genie.css`
- Test: `tests/unit/ui/SecurityGenie.test.tsx`

**Interfaces:**

- Consumes:

```ts
interface SecurityGenieProps {
  readonly state: MascotState;
  readonly onDismiss: () => void;
}
```

- Produces: `[data-mascot-state]`, `[role="status"]` y botón accesible para cerrar la burbuja.

- [ ] **Step 1: Escribir tests fallidos del render**

Renderizar `allow`, `redacted`, `verify` y `block`; verificar `data-mascot-state`, copy, `role="status"` y que `onDismiss` se dispare desde el botón.

- [ ] **Step 2: Ejecutar el test y verificar que falle**

Run:

```bash
pnpm vitest run tests/unit/ui/SecurityGenie.test.tsx
```

Expected: FAIL porque el componente no existe.

- [ ] **Step 3: Implementar el componente**

Usar un `div` con background-image del sprite y clases derivadas exclusivamente de `state.kind`. La burbuja se muestra para estados terminales y no para `idle` o `scanning`.

- [ ] **Step 4: Implementar estilos**

Posicionar a `right: 18px; bottom: 18px`, limitar el personaje a `96×96` CSS pixels y escalar con `image-rendering: pixelated`. Agregar hit-area mínima de `44×44`, contraste AA, entrada/salida y fallback sin movimiento dentro de:

```css
@media (prefers-reduced-motion: reduce) {
  .security-genie__sprite {
    animation: none;
  }
}
```

- [ ] **Step 5: Ejecutar el test**

Run:

```bash
pnpm vitest run tests/unit/ui/SecurityGenie.test.tsx
```

Expected: PASS.

### Task 5: Integrar la mascota con el content script

**Files:**

- Modify: `entrypoints/content/index.tsx`
- Modify: `entrypoints/content/styles.css`
- Test: `tests/integration/submission-interceptor.test.ts`

**Interfaces:**

- Consumes: `reduceMascotState`, `SecurityGenie`, `onReviewStarted`, `onReviewCompleted`.
- Produces: una única mascota montada al cargar ChatGPT y sincronizada con cada revisión.

- [ ] **Step 1: Reemplazar `RiskBadge` por un controlador React**

Crear un componente local `MascotController` con `useReducer(reduceMascotState, { kind: "idle" })` y exponer un callback estable para despachar `MascotEvent` desde el setup del interceptor.

- [ ] **Step 2: Mapear los resultados**

Aplicar este mapeo:

```ts
function eventForReview(review: SubmissionReview): MascotEvent {
  if (review.kind === "error") return { kind: "failed" };
  if (review.kind === "interrupt") {
    return review.outcome === "blocked"
      ? { kind: "blocked" }
      : { kind: "interrupted" };
  }
  return review.outcome === "redacted"
    ? { kind: "redacted" }
    : { kind: "allowed" };
}
```

El presenter del modal despacha `verification-requested` antes de llamar `showDecisionModal`, para que la mascota adopte la pose amarilla mientras espera la decisión.

- [ ] **Step 3: Agregar autocierre sin carreras**

Para `allow` y `redacted`, volver a `idle` después de `2400 ms`. Cancelar el timer anterior cada vez que cambia el estado y al desmontar. `verify`, `block` y `error` permanecen hasta resolución o cierre explícito.

- [ ] **Step 4: Retirar el badge anterior**

Eliminar estilos `.badge`/`.risk-badge` que ya no tengan consumidores. No modificar el modal ni el popup.

- [ ] **Step 5: Ejecutar la suite completa**

Run:

```bash
pnpm test
pnpm typecheck
pnpm build
```

Expected: todos los tests pasan, TypeScript no reporta errores y WXT genera el build de Chrome.

- [ ] **Step 6: Verificación manual en Chrome**

Cargar `.output/chrome-mv3` como extensión sin empaquetar y validar:

- La mascota aparece al abrir `https://chatgpt.com/`.
- Un prompt limpio reproduce `scanning → allow → idle`.
- Una anonimización reproduce `scanning → verify → redacted → idle`.
- Un secreto crítico reproduce `scanning → verify → block`.
- La mascota no tapa el composer a `320 px`, `768 px` y desktop.
- Las acciones siguen funcionando con teclado.
- Con `prefers-reduced-motion: reduce` no hay desplazamientos animados.
