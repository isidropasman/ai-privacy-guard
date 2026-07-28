# Redacta Landing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir una landing responsive e interactiva para Redacta que explique, demuestre y convierta sin alterar el runtime de la extensión WXT.

**Architecture:** La landing vive como un package Vite + React independiente dentro del workspace pnpm. Los escenarios y el copy son datos centralizados; la demo usa una máquina de estados explícita y las secciones visuales permanecen desacopladas de la extensión.

**Tech Stack:** React 19, TypeScript strict, Vite, CSS propio, Motion, Vitest, Testing Library.

## Global Constraints

- No realizar llamadas reales a proveedores de IA.
- No usar `any`, secretos, URLs de producción ni valores dependientes del entorno.
- Mantener intactos los scripts y el build de la extensión WXT.
- Respetar `prefers-reduced-motion`, navegación por teclado y contraste WCAG AA.
- No agregar secciones fuera de navbar, hero/demo, comparación, beneficios, privacidad, CTA y footer.
- No hacer commits ni staging sin autorización explícita.

---

## File map

- Create: `landing/package.json`, `landing/index.html`, `landing/tsconfig.json`, `landing/vite.config.ts`
- Create: `landing/src/main.tsx`, `landing/src/App.tsx`, `landing/src/styles.css`
- Create: `landing/src/data/copy.ts`, `landing/src/data/demoScenarios.ts`
- Create: `landing/src/components/*.tsx`
- Create: `landing/src/test/setup.ts`, `landing/src/components/InteractiveDemo.test.tsx`
- Create: `landing/public/mascot/redacta-guardian.png`
- Modify: `pnpm-workspace.yaml`

### Task 1: Package y datos

**Files:**
- Create: `landing/package.json`, `landing/index.html`, `landing/tsconfig.json`, `landing/vite.config.ts`
- Create: `landing/src/data/copy.ts`, `landing/src/data/demoScenarios.ts`
- Modify: `pnpm-workspace.yaml`

**Interfaces:**
- Produces: `DemoState`, `DemoScenario`, `demoScenarios` y `siteCopy`.

- [ ] Crear el package Vite con scripts `dev`, `build`, `typecheck`, `lint` y `test`.
- [ ] Declarar los tres escenarios con findings tipados y texto protegido.
- [ ] Centralizar el copy principal.
- [ ] Instalar dependencias con `pnpm install`.

### Task 2: Demo interactiva

**Files:**
- Create: `landing/src/components/InteractiveDemo.tsx`
- Create: `landing/src/components/InteractiveDemo.test.tsx`
- Create: `landing/src/test/setup.ts`

**Interfaces:**
- Consumes: `DemoScenario`, `demoScenarios`.
- Produces: demo con estados `idle`, `scanning`, `risk-detected`, `redacting`, `protected`, `sent`.

- [ ] Escribir un test que cambie escenario, detecte riesgo y anonimice.
- [ ] Ejecutar `pnpm --dir landing test` y confirmar el fallo por componente ausente.
- [ ] Implementar tabs, escaneo local simulado, hallazgos, acciones críticas/medias y envío seguro.
- [ ] Reejecutar el test y confirmar que pasa.

### Task 3: Estructura y secciones

**Files:**
- Create: `landing/src/components/Navbar.tsx`
- Create: `landing/src/components/DataFlowComparison.tsx`
- Create: `landing/src/components/Benefits.tsx`
- Create: `landing/src/components/PrivacySection.tsx`
- Create: `landing/src/components/FinalCTA.tsx`
- Create: `landing/src/components/Footer.tsx`
- Create: `landing/src/App.tsx`, `landing/src/main.tsx`

**Interfaces:**
- Consumes: `siteCopy`, `InteractiveDemo`.
- Produces: documento semántico completo con anchors `demo`, `como-funciona` y `privacidad`.

- [ ] Construir navbar responsive con menú accesible.
- [ ] Componer hero y demo sin sumar contenido no solicitado.
- [ ] Implementar selector Sin/Con Redacta y transformación de bloques.
- [ ] Implementar tres beneficios, privacidad, CTA y footer.

### Task 4: Identidad, mascota y responsive

**Files:**
- Create: `landing/public/mascot/redacta-guardian.png`
- Create: `landing/src/styles.css`

**Interfaces:**
- Produces: sistema visual completo y mascota reutilizable en demo y CTA.

- [ ] Recortar el chroma key de la mascota generada y validar alpha.
- [ ] Implementar tokens, layout editorial, frontera visual, estados y pixel details.
- [ ] Diseñar breakpoints para 375 px, foco visible y estados no dependientes del color.
- [ ] Desactivar transiciones y animaciones bajo `prefers-reduced-motion`.

### Task 5: Verificación final

**Files:**
- Modify only files required by findings.

- [ ] Ejecutar `pnpm --dir landing typecheck`.
- [ ] Ejecutar `pnpm --dir landing lint`.
- [ ] Ejecutar `pnpm --dir landing test`.
- [ ] Ejecutar `pnpm --dir landing build`.
- [ ] Ejecutar `pnpm typecheck`, `pnpm lint`, `pnpm test` y `pnpm build` para confirmar que la extensión sigue intacta.
- [ ] Levantar preview, inspeccionar desktop y 375 px, revisar consola y corregir hallazgos reales.
