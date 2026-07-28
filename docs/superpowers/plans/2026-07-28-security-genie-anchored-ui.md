# Security Genie Anchored UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar el badge y modal centrado por Security Genie y una burbuja de decisión anclada al personaje dentro de ChatGPT.

**Architecture:** Un único árbol React vive en el Shadow DOM del content script. Un controller imperativo publica eventos del ciclo de revisión hacia un reducer React; la UI presenta estados transitorios de la mascota y resuelve decisiones mediante la burbuja sin cambiar detección, política ni redacción.

**Tech Stack:** TypeScript strict, React 19, WXT, Shadow DOM, CSS, Vitest, Playwright.

## Global Constraints

- No agregar dependencias.
- No usar `any`.
- No cambiar detectores, redacción ni reglas de política.
- No enviar datos fuera del dispositivo.
- Reutilizar los dos assets WebP existentes.
- Respetar `prefers-reduced-motion`.
- No hacer staging, commits ni push.

---

## File map

- Create: `public/mascot/security-genie-idle.webp`
- Create: `public/mascot/security-genie-shield.webp`
- Create: `src/ui/mascot/mascotState.ts`
- Create: `src/ui/mascot/SecurityGenieController.tsx`
- Create: `src/ui/mascot/SecurityGenie.tsx`
- Create: `src/ui/mascot/GenieDecisionBubble.tsx`
- Modify: `entrypoints/content/index.tsx`
- Modify: `entrypoints/content/styles.css`
- Modify: `src/interception/SubmissionInterceptor.ts`
- Modify: `src/policy/PrivacyReviewService.ts`
- Modify: `src/ui/showDecisionModal.tsx`
- Test: `tests/unit/ui/mascotState.test.ts`
- Test: `tests/unit/ui/SecurityGenie.test.tsx`
- Modify: `tests/unit/ui/showDecisionModal.test.tsx`
- Modify: `tests/integration/submission-interceptor.test.ts`
- Modify: `tests/unit/policy/PrivacyReviewService.test.ts`
- Modify: `tests/e2e/privacy-guard.spec.ts`

### Task 1: Estado visual y assets

**Interfaces:**

```ts
export type MascotState =
  | { readonly kind: "idle" }
  | { readonly kind: "scanning" }
  | { readonly kind: "allow"; readonly message: string }
  | { readonly kind: "verify"; readonly message: string }
  | { readonly kind: "redacted"; readonly message: string }
  | { readonly kind: "block"; readonly message: string }
  | { readonly kind: "error"; readonly message: string };

export type MascotEvent =
  | { readonly kind: "review-started" }
  | { readonly kind: "allowed" }
  | { readonly kind: "verification-requested" }
  | { readonly kind: "redacted" }
  | { readonly kind: "blocked" }
  | { readonly kind: "failed" }
  | { readonly kind: "reset" };

export function reduceMascotState(
  state: MascotState,
  event: MascotEvent,
): MascotState;
```

- [ ] Copiar los assets aprobados desde `landing/public/mascot/` a `public/mascot/`.
- [ ] Escribir tests fallidos de cada transición y copy terminal.
- [ ] Ejecutar `pnpm vitest run tests/unit/ui/mascotState.test.ts` y confirmar fallo.
- [ ] Implementar el reducer exhaustivo.
- [ ] Ejecutar el test y confirmar éxito.

### Task 2: Eventos semánticos del ciclo de revisión

**Interfaces:**

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

`SubmissionInterceptorOptions` agrega:

```ts
readonly onReviewStarted: () => void;
readonly onReviewCompleted: (review: SubmissionReview) => void;
```

- [ ] Actualizar tests del servicio para exigir `outcome`.
- [ ] Actualizar tests del interceptor para exigir orden y cardinalidad de callbacks.
- [ ] Ejecutar ambos tests y confirmar fallo.
- [ ] Implementar outcomes sin modificar decisiones existentes.
- [ ] Publicar inicio y finalización desde el interceptor.
- [ ] Ejecutar ambos tests y confirmar éxito.

### Task 3: Mascota y burbuja accesible

**Interfaces:**

```ts
interface SecurityGenieProps {
  readonly state: MascotState;
  readonly decision: DecisionModalInput | null;
  readonly onDecision: (decision: UserDecision) => void;
  readonly onDismissStatus: () => void;
}
```

- [ ] Escribir tests fallidos para `idle`, `scanning`, confirmación y decisión.
- [ ] Cubrir foco inicial, `Escape`, focus trap y restauración de foco.
- [ ] Ejecutar los tests y confirmar fallo.
- [ ] Implementar `SecurityGenie` y `GenieDecisionBubble` reutilizando `FindingsList`.
- [ ] Reemplazar el montaje de raíces efímeras de `showDecisionModal` por un presenter conectado al controller.
- [ ] Ejecutar tests de UI y confirmar éxito.

### Task 4: Controller e integración del content script

**Interfaces:**

```ts
export interface SecurityGenieHandle {
  readonly emit: (event: MascotEvent) => void;
  readonly requestDecision: (
    input: DecisionModalInput,
  ) => Promise<UserDecision>;
}
```

- [ ] Implementar el controller con reducer, una sola decisión activa y timers cancelables.
- [ ] Montar el controller como única raíz React del Shadow DOM.
- [ ] Mapear `review-started`, resultados, errores e interrupciones a eventos visuales.
- [ ] Retirar `RiskBadge` del content script.
- [ ] Mantener cleanup completo en `ctx.onInvalidated`.
- [ ] Ejecutar tests de integración, typecheck y build.

### Task 5: Estilos anclados y responsive

- [ ] Reemplazar estilos del badge y modal centrado por `.security-genie`, `.genie-bubble` y estados.
- [ ] Posicionar la mascota sin tapar controles de ChatGPT.
- [ ] Hacer que la burbuja crezca hacia arriba e izquierda en desktop.
- [ ] Implementar layout móvil para anchos menores a `520px`.
- [ ] Agregar hit areas de `44px`, contraste AA y reduced motion.
- [ ] Ejecutar format, lint, typecheck y tests de UI.

### Task 6: Regresión E2E y verificación real

- [ ] Actualizar E2E para esperar una burbuja anclada, no un overlay centrado.
- [ ] Verificar prompt limpio, PII, secreto crítico, composer recreado y `Ctrl+Enter`.
- [ ] Ejecutar `pnpm test`, `pnpm e2e`, `pnpm lint`, `pnpm typecheck`, `pnpm build` y audit.
- [ ] Recargar la extensión una vez.
- [ ] Validar en ChatGPT real: click, Enter, `Ctrl+Enter`, `Meta+Enter`, bloqueo, anonimización y viewport angosto.
- [ ] Revisar consola y diff final.
