# Dashboard Base Rules Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-only "Reglas base" section to `apps/dashboard` that lists the extension's real detectors, derived live from `src/detection/createDetectorEngine.ts` instead of hand-copied data.

**Architecture:** Two small, additive, non-behavioral changes to the extension's detection layer expose the already-registered detector list and a derived activation status (`describeBaseRules()`). The dashboard imports that function directly (relative cross-directory import, no package coupling) and renders it in a new read-only table, reusing existing dashboard components and CSS classes.

**Tech Stack:** TypeScript 5.9 strict, Vitest (extension tests), React 19 + Vite 8 (dashboard, separate project with its own `package.json`/lockfile).

## Global Constraints

- No behavior change to any existing detector, `PolicyEngine`, `PrivacyReviewService`, or any existing exported function's signature. Only additive exports.
- Base rules stay read-only in the dashboard: no create/edit/disable UI for them. Only custom rules keep that capability (already implemented, out of scope here).
- No backend, network calls, authentication, or sync with another machine. Everything resolves at build/dev time from local source files.
- Do not modify `apps/dashboard/src/RulesSection.tsx`, `EventsSection.tsx`, `storage.ts`, `mockData.ts`, or `types.ts` (per approved spec).
- Every existing test in `tests/unit/detection/**` must keep passing unmodified.

---

### Task 1: Expose the registered detector list from `DetectorEngine`

**Files:**

- Modify: `src/detection/DetectorEngine.ts`
- Test: `tests/unit/detection/DetectorEngine.test.ts`

**Interfaces:**

- Consumes: nothing new (existing `SensitiveDataDetector[]` constructor argument).
- Produces: `DetectorEngine.prototype.detectors` — a public getter returning `readonly SensitiveDataDetector[]`, the same array passed to the constructor. Task 2 consumes this.

- [ ] **Step 1: Write the failing test**

Add this test to the existing `describe("DetectorEngine", ...)` block in `tests/unit/detection/DetectorEngine.test.ts` (append after the last test, before the closing `});`):

```ts
test("exposes the registered detectors through a public getter", () => {
  const fixture: SensitiveDataDetector = {
    id: "fixture",
    label: "Fixture",
    detect: () => [],
  };

  const engine = new DetectorEngine([fixture]);

  expect(engine.detectors).toEqual([fixture]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/detection/DetectorEngine.test.ts`
Expected: FAIL — `Property 'detectors' does not exist on type 'DetectorEngine'` (TypeScript error surfaced through Vitest).

- [ ] **Step 3: Write the minimal implementation**

Make two small changes to `src/detection/DetectorEngine.ts`. Leave `hashInput()` and every other line exactly as they are today — only touch the two spots below.

First, rename the constructor parameter property and add a public getter right after it. Replace this line:

```ts
  constructor(private readonly detectors: readonly SensitiveDataDetector[]) {}
```

with these lines:

```ts
  constructor(private readonly registeredDetectors: readonly SensitiveDataDetector[]) {}

  get detectors(): readonly SensitiveDataDetector[] {
    return this.registeredDetectors;
  }
```

Second, update the one place inside `detect()` that reads the renamed field. Replace this line:

```ts
const findings = this.detectors;
```

with:

```ts
const findings = this.registeredDetectors;
```

That's the entire diff: a renamed private field, a new public getter exposing it, and the one call site inside `detect()` updated to match. `hashInput()` and the rest of the file are untouched.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/detection/DetectorEngine.test.ts`
Expected: PASS (3 tests: the 2 pre-existing plus the new one).

- [ ] **Step 5: Run the full existing detection suite to confirm no regression**

Run: `pnpm vitest run tests/unit/detection`
Expected: PASS (all files in `tests/unit/detection/`).

- [ ] **Step 6: Commit**

```bash
git add src/detection/DetectorEngine.ts tests/unit/detection/DetectorEngine.test.ts
git commit -m "feat: expose registered detectors from DetectorEngine"
```

---

### Task 2: Add `describeBaseRules()` to `createDetectorEngine.ts`

**Files:**

- Modify: `src/detection/createDetectorEngine.ts`
- Test: `tests/unit/detection/describeBaseRules.test.ts` (new)

**Interfaces:**

- Consumes: `DetectorEngine.prototype.detectors` from Task 1; the existing exported `createDetectorEngine(settings: PrivacyGuardSettings): DetectorEngine`; the existing `PrivacyGuardSettings` type (already imported in this file).
- Produces: `export interface BaseRuleDescriptor { readonly id: string; readonly label: string; readonly description: string; readonly alwaysActive: boolean; readonly requiresSetting?: "warningsEnabled" | "financialDetectionEnabled"; }` and `export function describeBaseRules(): readonly BaseRuleDescriptor[]`. Task 3 consumes both.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/detection/describeBaseRules.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { describeBaseRules } from "../../../src/detection/createDetectorEngine";

describe("describeBaseRules", () => {
  test("lists all 11 base detectors exactly once", () => {
    const ids = describeBaseRules().map((rule) => rule.id);

    expect(ids).toHaveLength(11);
    expect(new Set(ids).size).toBe(11);
  });

  test("marks critical detectors and the confidential keyword detector as always active", () => {
    const alwaysActiveIds = describeBaseRules()
      .filter((rule) => rule.alwaysActive)
      .map((rule) => rule.id)
      .sort();

    expect(alwaysActiveIds).toEqual(
      [
        "api-key",
        "confidential-keyword",
        "connection-string",
        "credit-card",
        "jwt",
        "private-key",
      ].sort(),
    );
  });

  test("marks PII detectors as conditioned by warningsEnabled", () => {
    const warningsIds = describeBaseRules()
      .filter((rule) => rule.requiresSetting === "warningsEnabled")
      .map((rule) => rule.id)
      .sort();

    expect(warningsIds).toEqual(
      ["argentine-identity", "email", "person-name", "phone"].sort(),
    );
  });

  test("marks the financial detector as conditioned by financialDetectionEnabled", () => {
    const financialIds = describeBaseRules()
      .filter((rule) => rule.requiresSetting === "financialDetectionEnabled")
      .map((rule) => rule.id);

    expect(financialIds).toEqual(["financial-information"]);
  });

  test("carries a non-empty label and description for every rule", () => {
    for (const rule of describeBaseRules()) {
      expect(rule.label.length).toBeGreaterThan(0);
      expect(rule.description.length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/detection/describeBaseRules.test.ts`
Expected: FAIL — `describeBaseRules` is not exported from `createDetectorEngine.ts`.

- [ ] **Step 3: Write the minimal implementation**

Replace the full contents of `src/detection/createDetectorEngine.ts` with:

```ts
import type { PrivacyGuardSettings } from "../storage/SettingsRepository";
import { DetectorEngine } from "./DetectorEngine";
import { ApiKeyDetector } from "./detectors/ApiKeyDetector";
import { ArgentineIdentityDetector } from "./detectors/ArgentineIdentityDetector";
import { ConfidentialKeywordDetector } from "./detectors/ConfidentialKeywordDetector";
import { ConnectionStringDetector } from "./detectors/ConnectionStringDetector";
import { CreditCardDetector } from "./detectors/CreditCardDetector";
import { EmailDetector } from "./detectors/EmailDetector";
import { FinancialInformationDetector } from "./detectors/FinancialInformationDetector";
import { JwtDetector } from "./detectors/JwtDetector";
import { PersonNameDetector } from "./detectors/PersonNameDetector";
import { PhoneDetector } from "./detectors/PhoneDetector";
import { PrivateKeyDetector } from "./detectors/PrivateKeyDetector";
import type { SensitiveDataDetector } from "./types";

export function createDetectorEngine(
  settings: PrivacyGuardSettings,
): DetectorEngine {
  const detectors: SensitiveDataDetector[] = [
    ...createCriticalDetectors(),
    new ConfidentialKeywordDetector(),
  ];

  if (settings.warningsEnabled) {
    detectors.push(
      new EmailDetector(),
      new PhoneDetector(),
      new PersonNameDetector(),
      new ArgentineIdentityDetector(),
    );
  }

  if (settings.financialDetectionEnabled) {
    detectors.push(new FinancialInformationDetector());
  }

  return new DetectorEngine(detectors);
}

export function createCriticalDetectorEngine(): DetectorEngine {
  return new DetectorEngine(createCriticalDetectors());
}

function createCriticalDetectors(): SensitiveDataDetector[] {
  return [
    new ApiKeyDetector(),
    new PrivateKeyDetector(),
    new JwtDetector(),
    new ConnectionStringDetector(),
    new CreditCardDetector(),
  ];
}

export interface BaseRuleDescriptor {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly alwaysActive: boolean;
  readonly requiresSetting?: "warningsEnabled" | "financialDetectionEnabled";
}

const descriptionById: Record<string, string> = {
  "api-key":
    "Detecta credenciales y API keys de proveedores conocidos (OpenAI, AWS, GitHub, Slack, Stripe, Google, Twilio) y variables tipo API_KEY=, TOKEN= o PASSWORD=.",
  "private-key":
    "Detecta bloques de clave privada en formato PEM (RSA u OpenSSH).",
  jwt: "Detecta tokens con estructura JWT; la severidad sube a crítica si aparece junto a lenguaje de autorización.",
  "connection-string":
    "Detecta cadenas de conexión a bases de datos que incluyen usuario y contraseña.",
  "credit-card":
    "Detecta números que superan la validación Luhn de tarjetas de pago.",
  "confidential-keyword":
    "Detecta los términos confidenciales que cada usuario configura localmente en el popup de la extensión.",
  email: "Detecta direcciones de email.",
  phone: "Detecta teléfonos mencionados en contexto de contacto.",
  "person-name":
    'Detecta nombres de persona en frases como "contactar a…" o "escribirle a…".',
  "argentine-identity":
    "Detecta DNI, CUIT/CUIL, CBU y alias bancario en formato argentino.",
  "financial-information":
    "Detecta montos que aparecen junto a lenguaje financiero y confidencial a la vez.",
};

const fallbackDescription = "Detector sin descripción documentada todavía.";

function baseDetectionSettings(overrides: {
  readonly warningsEnabled: boolean;
  readonly financialDetectionEnabled: boolean;
}): PrivacyGuardSettings {
  return {
    strictSecrets: true,
    confidentialTerms: [],
    counters: {
      allowedCount: 0,
      warnedCount: 0,
      blockedCount: 0,
      redactedCount: 0,
    },
    ...overrides,
  };
}

export function describeBaseRules(): readonly BaseRuleDescriptor[] {
  const alwaysActive = createDetectorEngine(
    baseDetectionSettings({
      warningsEnabled: false,
      financialDetectionEnabled: false,
    }),
  ).detectors;
  const withWarnings = createDetectorEngine(
    baseDetectionSettings({
      warningsEnabled: true,
      financialDetectionEnabled: false,
    }),
  ).detectors;
  const withFinancial = createDetectorEngine(
    baseDetectionSettings({
      warningsEnabled: false,
      financialDetectionEnabled: true,
    }),
  ).detectors;

  const alwaysActiveIds = new Set(alwaysActive.map((detector) => detector.id));
  const warningsIds = new Set(
    withWarnings
      .map((detector) => detector.id)
      .filter((id) => !alwaysActiveIds.has(id)),
  );
  const financialIds = new Set(
    withFinancial
      .map((detector) => detector.id)
      .filter((id) => !alwaysActiveIds.has(id)),
  );

  const seen = new Set<string>();
  const descriptors: BaseRuleDescriptor[] = [];

  for (const detector of [...alwaysActive, ...withWarnings, ...withFinancial]) {
    if (seen.has(detector.id)) continue;
    seen.add(detector.id);

    descriptors.push({
      id: detector.id,
      label: detector.label,
      description: descriptionById[detector.id] ?? fallbackDescription,
      alwaysActive: alwaysActiveIds.has(detector.id),
      requiresSetting: warningsIds.has(detector.id)
        ? "warningsEnabled"
        : financialIds.has(detector.id)
          ? "financialDetectionEnabled"
          : undefined,
    });
  }

  return descriptors;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/detection/describeBaseRules.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Run the full test suite and typecheck**

Run: `pnpm test && pnpm typecheck`
Expected: All existing tests still PASS; no new type errors.

- [ ] **Step 6: Commit**

```bash
git add src/detection/createDetectorEngine.ts tests/unit/detection/describeBaseRules.test.ts
git commit -m "feat: derive base rule descriptors from the real detector registry"
```

---

### Task 3: Add the "Reglas base" section to the dashboard

**Files:**

- Create: `apps/dashboard/src/BaseRulesSection.tsx`
- Modify: `apps/dashboard/src/App.tsx`

**Interfaces:**

- Consumes: `describeBaseRules` and `BaseRuleDescriptor` from `../../../src/detection/createDetectorEngine` (Task 2); `PageHeader` from `./RulesSection` (already exported, unchanged).
- Produces: `export function BaseRulesSection(): JSX.Element`, consumed by `App.tsx`.

- [ ] **Step 1: Create the component**

Create `apps/dashboard/src/BaseRulesSection.tsx`:

```tsx
import { describeBaseRules } from "../../../src/detection/createDetectorEngine";
import { PageHeader } from "./RulesSection";

const settingLabels: Record<
  "warningsEnabled" | "financialDetectionEnabled",
  string
> = {
  warningsEnabled: "Advertir sobre datos personales",
  financialDetectionEnabled: "Detectar información financiera",
};

export function BaseRulesSection() {
  const rules = describeBaseRules();
  const alwaysActiveCount = rules.filter((rule) => rule.alwaysActive).length;

  return (
    <>
      <PageHeader
        title="Reglas base"
        description="Detectores que ya corren en la extensión, tal como están definidos en el código fuente. Son de solo lectura: no se editan desde acá."
      />

      <section className="summary-strip" aria-label="Resumen de reglas base">
        <Summary label="Total" value={rules.length} />
        <Summary label="Siempre activas" value={alwaysActiveCount} />
        <Summary
          label="Condicionadas"
          value={rules.length - alwaysActiveCount}
        />
      </section>

      <section className="panel table-panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Detector</th>
                <th>Descripción</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id}>
                  <td>
                    <strong>{rule.label}</strong>
                    <small>{rule.id}</small>
                  </td>
                  <td>{rule.description}</td>
                  <td>
                    {rule.alwaysActive ? (
                      <span className="status-toggle status-toggle--on">
                        Siempre activo
                      </span>
                    ) : (
                      <span className="status-toggle">
                        Depende de &quot;
                        {rule.requiresSetting === undefined
                          ? "un ajuste"
                          : settingLabels[rule.requiresSetting]}
                        &quot;
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function Summary({
  label,
  value,
}: {
  readonly label: string;
  readonly value: number;
}) {
  return (
    <div>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
```

This reuses existing CSS classes (`summary-strip`, `panel table-panel`, `status-toggle`, `status-toggle--on`) already defined in `apps/dashboard/src/styles.css` — no CSS changes needed.

- [ ] **Step 2: Wire the new section into the app shell**

Modify `apps/dashboard/src/App.tsx`. Replace the full file contents with:

```tsx
import { useEffect, useState } from "react";
import { BaseRulesSection } from "./BaseRulesSection";
import { EventsSection } from "./EventsSection";
import { RulesSection } from "./RulesSection";
import { loadRules, saveRules } from "./storage";
import type { CustomRule } from "./types";

type Section = "base-rules" | "rules" | "events";

export function App() {
  const [section, setSection] = useState<Section>("base-rules");
  const [rules, setRules] = useState<readonly CustomRule[]>(loadRules);

  useEffect(() => {
    saveRules(rules);
  }, [rules]);

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="brand">
          <span>PG</span>
          <div>
            <strong>Privacy Guard</strong>
            <small>Dashboard local</small>
          </div>
        </div>
        <nav aria-label="Secciones del dashboard">
          <button
            type="button"
            className={section === "base-rules" ? "nav-active" : ""}
            onClick={() => setSection("base-rules")}
          >
            Reglas base
          </button>
          <button
            type="button"
            className={section === "rules" ? "nav-active" : ""}
            onClick={() => setSection("rules")}
          >
            Reglas personalizadas
          </button>
          <button
            type="button"
            className={section === "events" ? "nav-active" : ""}
            onClick={() => setSection("events")}
          >
            Eventos
          </button>
        </nav>
        <p className="scope-note">
          Prototipo local. Todavía no está conectado con la extensión.
        </p>
      </aside>
      <main className="workspace">
        {section === "base-rules" ? (
          <BaseRulesSection />
        ) : section === "rules" ? (
          <RulesSection rules={rules} onChange={setRules} />
        ) : (
          <EventsSection />
        )}
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck the dashboard**

Run: `cd apps/dashboard && pnpm typecheck`
Expected: No errors. (The cross-directory import resolves because TypeScript follows imports regardless of `tsconfig.json`'s `include` glob, and `noEmit: true` means no `rootDir` output-path error can occur.)

- [ ] **Step 4: Commit**

```bash
git add apps/dashboard/src/BaseRulesSection.tsx apps/dashboard/src/App.tsx
git commit -m "feat: show real base detectors in a read-only dashboard section"
```

---

### Task 4: Verify the dev server and production build, fix cross-directory serving only if needed

**Files:**

- Modify (conditionally, only if Step 2 below fails): `apps/dashboard/vite.config.ts`

**Interfaces:**

- Consumes: nothing new.
- Produces: nothing new (verification + conditional config task).

- [ ] **Step 1: Build the dashboard for production**

Run: `cd apps/dashboard && pnpm build`
Expected: Build succeeds. Rollup (used by `vite build`) has no dev-server file-serving restriction, so this should pass regardless of the dev-server check in Step 2.

- [ ] **Step 2: Start the dev server and check for a file-serving restriction**

Run: `cd apps/dashboard && pnpm dev`

Open `http://localhost:5173` in a browser, open the devtools console and network tab, and click "Reglas base" in the sidebar.

- If the page renders a table with 11 rows (labels: Credencial, Clave privada, Token JWT, Conexión con credenciales, Tarjeta, Término confidencial, Email, Teléfono, Nombre de persona, Dato argentino, Información financiera) and there are no console/network errors mentioning "outside of Vite serving allow list" or "not allowed to be served" — **skip Step 3**, this task is done, go to Step 4.
- If you see such an error, proceed to Step 3.

- [ ] **Step 3 (only if Step 2 showed a serving error): Allow the workspace root in Vite's dev server**

Replace the full contents of `apps/dashboard/vite.config.ts` with:

```ts
import react from "@vitejs/plugin-react";
import { defineConfig, searchForWorkspaceRoot } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    fs: {
      allow: [searchForWorkspaceRoot(process.cwd())],
    },
  },
});
```

Stop and restart `pnpm dev`, reload the browser, and repeat the check from Step 2.

- [ ] **Step 4: Manually verify the 3 summary counts and one conditional row**

In the running dev server, on the "Reglas base" table, confirm:

- The "Total" summary tile reads 11.
- The "Siempre activas" tile reads 6.
- The "Condicionadas" tile reads 5.
- The row for "Email" (id `email`) shows the status pill `Depende de "Advertir sobre datos personales"`.
- The row for "Información financiera" (id `financial-information`) shows the status pill `Depende de "Detectar información financiera"`.
- The row for "Credencial" (id `api-key`) shows the status pill `Siempre activo`.

Stop the dev server (Ctrl+C) once confirmed.

- [ ] **Step 5: Commit (only if Step 3 modified vite.config.ts; skip if nothing changed)**

```bash
git add apps/dashboard/vite.config.ts
git commit -m "fix: allow Vite dev server to serve files from the repo root"
```

---

## Final Verification

- [ ] Run `pnpm test && pnpm typecheck` at the repo root — all pass.
- [ ] Run `cd apps/dashboard && pnpm typecheck && pnpm build` — both pass.
- [ ] Confirm via `git status` that no file outside `apps/dashboard/`, `src/detection/DetectorEngine.ts`, and `src/detection/createDetectorEngine.ts` was touched, and that `tests/unit/detection/DetectorEngine.test.ts` / `describeBaseRules.test.ts` are the only test files touched.
