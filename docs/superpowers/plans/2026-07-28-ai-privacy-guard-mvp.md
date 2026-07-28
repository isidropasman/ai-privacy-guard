# AI Privacy Guard MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir una extensión Chrome Manifest V3 local-first que detecte, advierta, bloquee y anonimice información sensible antes de enviarla a ChatGPT.

**Architecture:** Un `ProviderAdapter` encapsula el DOM cambiante de cada proveedor. La interceptación coordina motores puros de detección, política y redacción; la UI React se monta en Shadow DOM y Chrome Storage conserva únicamente configuración voluntaria y contadores agregados.

**Tech Stack:** WXT, React 19, TypeScript strict, Manifest V3, Vitest, Playwright, ESLint y Prettier.

## Global Constraints

- Cero persistencia o transmisión de prompts.
- Sin backend, telemetría de contenido, modelos externos ni scripts remotos.
- Permisos limitados a `storage`, `https://chatgpt.com/*` y `https://chat.openai.com/*`.
- TypeScript estricto, sin `any`; errores esperables como discriminated unions.
- No avanzar de fase mientras typecheck, tests básicos o build fallen.

---

## File Structure

```text
entrypoints/
  background.ts
  content/{index.tsx,styles.css}
  popup/{App.tsx,main.tsx,styles.css,index.html}
src/
  adapters/{types.ts,chatgpt/{ChatGPTAdapter.ts,selectors.ts}}
  detection/{DetectorEngine.ts,types.ts,detectors/*.ts}
  policy/{PolicyEngine.ts,defaultPolicy.ts}
  redaction/{RedactionEngine.ts,strategies.ts}
  interception/{SubmissionInterceptor.ts,EventGuard.ts}
  ui/{WarningModal.tsx,RiskBadge.tsx,FindingsList.tsx}
  storage/SettingsRepository.ts
  security/{ContentSanitizer.ts,Logger.ts}
  shared/{constants.ts,types.ts}
tests/{fixtures,unit,integration,e2e}
```

### Task 1: Extension shell and protected-state UI

**Files:** `package.json`, `wxt.config.ts`, `entrypoints/background.ts`, `entrypoints/content/*`, `entrypoints/popup/*`

**Produces:** Installable MV3 build with a Shadow DOM badge on ChatGPT and a privacy-focused popup.

- [x] Scaffold WXT React TypeScript and resolve dependencies in `pnpm-lock.yaml`.
- [x] Declare only `storage` and ChatGPT host permissions.
- [x] Mount an isolated, non-interactive “Protected” badge.
- [x] Build the popup’s active-provider and local-analysis states.
- [x] Run `pnpm typecheck` and `pnpm build`.

### Task 2: Provider adapter and idempotent DOM lifecycle

**Files:** `src/adapters/types.ts`, `src/adapters/chatgpt/{selectors.ts,ChatGPTAdapter.ts}`, `entrypoints/content/index.tsx`

**Produces:** The exact `ProviderAdapter` contract and a ChatGPT implementation that locates, reads, writes and observes the composer.

- [x] Test semantic selector priority against contenteditable and textarea fixtures.
- [x] Implement provider matching, composer access and approved submission.
- [x] Observe composer replacement and SPA navigation without duplicate listeners.
- [x] Verify initialization remains idempotent.

### Task 3: Submission interception

**Files:** `src/interception/{EventGuard.ts,SubmissionInterceptor.ts}`, `tests/integration/submission-interceptor.test.tsx`

**Produces:** Capture-phase handling for click, pointer, keyboard and submit with a one-shot approved submission token.

- [x] Test Enter, Ctrl/Cmd+Enter, Shift+Enter, click and submit paths.
- [x] Implement a consumable approval guard keyed to one submission attempt.
- [x] Preserve composer content on cancellation and unexpected errors.
- [x] Test DOM recreation and assert exactly one approved submission.

### Task 4: Critical detectors and policy

**Files:** `src/detection/*`, critical detectors, `src/policy/*`, `tests/unit/detectors/*`

**Produces:** Deterministic findings and `ALLOW | WARN | BLOCK` decisions without provider dependencies.

- [x] Define detector, finding, category and policy discriminated unions.
- [x] Add false fixtures and negative tests before each detector.
- [x] Implement API key, private key, JWT, connection string and Luhn card detection.
- [x] Implement confidence-aware risk aggregation capped at 100.
- [x] Block high-confidence critical findings and test overlaps.

### Task 5: Warning detectors and local settings

**Files:** remaining detectors, `src/storage/SettingsRepository.ts`, popup settings components.

**Produces:** Configurable warnings for PII, Argentine identifiers, contextual finance and user-entered terms.

- [x] Add positive and false-positive fixtures for every detector.
- [x] Detect configured terms case-insensitively with stable offsets.
- [x] Persist only settings, configured terms and aggregate counters.
- [x] Expose PII, finance and strict-secret toggles.

### Task 6: Redaction and decision UI

**Files:** `src/redaction/*`, `src/ui/*`, content styles and tests.

**Produces:** Accessible Shadow DOM modal and category-specific, overlap-safe redaction.

- [x] Test descending-offset replacement and specificity-based overlap removal.
- [x] Implement stable replacements and safe critical previews.
- [x] Add focus trap, Escape semantics, ARIA and light/dark styles.
- [x] Wire anonymize-and-send through the one-shot guard.
- [x] Verify original text changes only after explicit consent.

### Task 7: Hardening, E2E and documentation

**Files:** `tests/fixtures/*`, `tests/e2e/*`, `README.md`, `ARCHITECTURE.md`, `SECURITY.md`, `PRIVACY.md`, `THREAT_MODEL.md`, `TESTING.md`

**Produces:** Auditable production build, reproducible demo and explicit limitations.

- [x] Add ESLint, Prettier and Playwright. Vitest was added in Task 2 to preserve TDD.
- [x] Build a local dynamic-provider fixture with submission counts.
- [x] Run safe, warning and critical E2E flows without external traffic.
- [x] Audit manifest, CSP, messages, dependencies and forbidden logging.
- [x] Benchmark 10,000-character analysis.
- [x] Document installation, demo, manual QA, privacy, threats, limitations and roadmap.
- [x] Run typecheck, lint, unit/integration/E2E tests and production build.
