# Redacta Security Incident Simulator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar la landing actual en un simulador pixel-art de incidentes que demuestre el riesgo empresarial de enviar información a IA pública y cuantifique cómo Redacta lo reduce.

**Architecture:** La landing conserva Vite, React y Motion. Las simulaciones se implementan como componentes locales controlados por máquinas de estados explícitas; los documentos, hallazgos, recorridos y casos de uso son datos tipados y no realizan uploads, telemetría ni llamadas a IA.

**Tech Stack:** React 19, TypeScript strict, Vite, Motion, CSS propio, Vitest, Testing Library.

## Global Constraints

- No usar `any`.
- No realizar upload, parseo real de PDF ni llamadas reales a IA.
- No afirmar que las funciones enterprise conceptuales existen en el MVP.
- Etiquetar panel de administración y métricas como `VISIÓN ENTERPRISE · PRÓXIMAMENTE`.
- Usar únicamente frames existentes de `.worktrees/security-genie-mascot/public/mascot/security-genie.webp`.
- Respetar `prefers-reduced-motion`, teclado y contraste WCAG AA.
- Mantener la landing usable a 375 px.
- No modificar reglas de detección, redacción o política de la extensión.
- No hacer commits ni staging sin autorización explícita.

---

## File Map

- Replace: `landing/src/App.tsx`
- Replace: `landing/src/styles.css`
- Modify: `landing/src/data/copy.ts`
- Create: `landing/src/data/incidentDemo.ts`
- Create: `landing/src/data/journeyScenarios.ts`
- Create: `landing/src/data/useCases.ts`
- Create: `landing/src/components/incident-demo/*.tsx`
- Create: `landing/src/components/data-journey/*.tsx`
- Create: `landing/src/components/enterprise/EnterpriseImpactConsole.tsx`
- Create: `landing/src/components/use-cases/*.tsx`
- Create: `landing/src/components/privacy/PrivacyArchitecture.tsx`
- Modify: `landing/src/components/Navbar.tsx`
- Modify: `landing/src/components/FinalCTA.tsx`
- Modify: `landing/src/components/Footer.tsx`
- Remove from composition: `InteractiveDemo`, `DataFlowComparison`, `Benefits`, `PrivacySection`
- Create: `landing/src/components/incident-demo/incidentDemoMachine.test.ts`
- Create: `landing/src/components/incident-demo/IncidentDemo.test.tsx`
- Create: `landing/src/components/data-journey/DataJourneySimulator.test.tsx`
- Create: cropped mascot frames under `landing/public/mascot/`

### Task 1: Datos y máquina de estados del incidente

**Files:**

- Create: `landing/src/data/incidentDemo.ts`
- Create: `landing/src/components/incident-demo/incidentDemoMachine.ts`
- Test: `landing/src/components/incident-demo/incidentDemoMachine.test.ts`

**Interfaces:**

```ts
export type IncidentDemoState =
  | "ready"
  | "loading-file"
  | "scanning"
  | "findings"
  | "redacting"
  | "review"
  | "safe-to-send"
  | "sent";

export type IncidentDemoEvent =
  | { readonly type: "START" }
  | { readonly type: "FILE_LOADED" }
  | { readonly type: "SCAN_COMPLETED" }
  | { readonly type: "REDACT" }
  | { readonly type: "REDACTION_COMPLETED" }
  | { readonly type: "APPROVE" }
  | { readonly type: "SEND" }
  | { readonly type: "RESET" };

export function transitionIncident(
  state: IncidentDemoState,
  event: IncidentDemoEvent,
): IncidentDemoState;
```

- [ ] Escribir tests para el recorrido completo y eventos inválidos que conservan el estado.
- [ ] Ejecutar `pnpm --dir landing test incidentDemoMachine` y verificar fallo por módulo ausente.
- [ ] Implementar reducer exhaustivo sin throws para eventos de UI inválidos.
- [ ] Definir documento ficticio de 38 páginas, 18 hallazgos, 7 críticos, 42% confidencial y 14.820 caracteres protegidos.
- [ ] Reejecutar test y verificar pass.

### Task 2: Demo guiada de archivo

**Files:**

- Create: `landing/src/components/incident-demo/IncidentDemo.tsx`
- Create: `landing/src/components/incident-demo/FileDropZone.tsx`
- Create: `landing/src/components/incident-demo/ScanProgress.tsx`
- Create: `landing/src/components/incident-demo/DocumentHeatmap.tsx`
- Create: `landing/src/components/incident-demo/FindingsConsole.tsx`
- Create: `landing/src/components/incident-demo/RedactionComparison.tsx`
- Create: `landing/src/components/incident-demo/ProtectionReceipt.tsx`
- Test: `landing/src/components/incident-demo/IncidentDemo.test.tsx`

**Interfaces:**

- Consumes: `incidentDocument`, `transitionIncident`.
- Produces: demo accesible con acciones `Analizar antes de enviar`, `Generar versión segura`, `Aprobar cambios`, `Enviar versión segura`.

- [ ] Escribir component test del recorrido completo con timers controlados.
- [ ] Ejecutar el test y verificar fallo por componentes ausentes.
- [ ] Implementar controlador del recorrido y cancelación de timers al desmontar.
- [ ] Implementar carga simulada, escaneo por páginas y progreso textual.
- [ ] Implementar heatmap de 38 páginas con riesgo bajo, medio y crítico.
- [ ] Implementar consola con categorías, severidad y páginas.
- [ ] Implementar reemplazos original → token y recibo de protección.
- [ ] Reejecutar el test y verificar pass.

### Task 3: Simulador del recorrido del dato

**Files:**

- Create: `landing/src/data/journeyScenarios.ts`
- Create: `landing/src/components/data-journey/DataJourneySimulator.tsx`
- Create: `landing/src/components/data-journey/JourneyNode.tsx`
- Create: `landing/src/components/data-journey/DataPacket.tsx`
- Test: `landing/src/components/data-journey/DataJourneySimulator.test.tsx`

**Interfaces:**

```ts
export type JourneyMode = "without-redacta" | "with-redacta";
export type JourneyPhase =
  | "idle"
  | "employee"
  | "boundary"
  | "provider"
  | "persistence"
  | "response"
  | "complete";
```

- [ ] Escribir test que ejecute ambos recorridos y compruebe sus mensajes finales.
- [ ] Ejecutar el test y verificar fallo por componente ausente.
- [ ] Implementar selector Sin / Con Redacta.
- [ ] Implementar nodos empleado, navegador, Redacta, proveedor, storage y respuesta.
- [ ] Animar un paquete una vez por fase, con fallback instantáneo para reduced motion.
- [ ] Mostrar persistencia roja sólo sin Redacta y contenido anonimizado con Redacta.
- [ ] Reejecutar test y verificar pass.

### Task 4: Consola enterprise y galería de incidentes

**Files:**

- Create: `landing/src/data/useCases.ts`
- Create: `landing/src/components/enterprise/EnterpriseImpactConsole.tsx`
- Create: `landing/src/components/use-cases/IncidentGallery.tsx`
- Create: `landing/src/components/use-cases/IncidentScene.tsx`

**Interfaces:**

- `EnterpriseImpactConsole` no recibe datos externos.
- `IncidentGallery` consume `useCases` con estados `original`, `findings`, `protected`.

- [ ] Definir cuatro casos: contrato, código, propuesta comercial y datos de cliente.
- [ ] Implementar selector lateral y microescena central.
- [ ] Implementar transformaciones visuales por caso.
- [ ] Implementar consola enterprise con métricas, distribución y etiqueta de próxima funcionalidad.
- [ ] Asegurar que ninguna métrica se presenta como telemetría actual.

### Task 5: Privacidad, hero y composición

**Files:**

- Modify: `landing/src/data/copy.ts`
- Modify: `landing/src/components/Navbar.tsx`
- Create: `landing/src/components/privacy/PrivacyArchitecture.tsx`
- Modify: `landing/src/components/FinalCTA.tsx`
- Modify: `landing/src/components/Footer.tsx`
- Replace: `landing/src/App.tsx`

**Interfaces:**

- `App` compone Navbar, hero + IncidentDemo, DataJourneySimulator, EnterpriseImpactConsole, IncidentGallery, PrivacyArchitecture, FinalCTA y Footer.

- [ ] Actualizar copy para CISO/compliance.
- [ ] Convertir navbar en consola de protección local.
- [ ] Integrar demo directamente en hero.
- [ ] Implementar arquitectura local con frontera del navegador y disclaimer.
- [ ] Actualizar CTA y footer.
- [ ] Retirar componentes anteriores de la composición sin borrar código no relacionado.

### Task 6: Sistema visual pixel-art

**Files:**

- Replace: `landing/src/styles.css`
- Create: `landing/public/mascot/security-genie-scan.webp`
- Create: `landing/public/mascot/security-genie-redact.webp`
- Reuse: `landing/public/mascot/security-genie-idle.webp`
- Reuse: `landing/public/mascot/security-genie-shield.webp`

- [ ] Extraer del sprite existente frames de análisis y redacción.
- [ ] Implementar tokens de color, tipografía y profundidad.
- [ ] Implementar primitive visual común para marcos escalonados, paneles, barras, badges y botones.
- [ ] Diseñar documento, heatmap, consola y grafo completamente en pixel art.
- [ ] Implementar layouts desktop, tablet y 375 px.
- [ ] Aplicar motion por pasos y reglas reduced-motion.
- [ ] Verificar que la mascota no tape controles ni capture eventos.

### Task 7: Verificación

**Files:**

- Modify only files required by verified findings.

- [ ] Ejecutar `pnpm --dir landing typecheck`.
- [ ] Ejecutar `pnpm --dir landing lint`.
- [ ] Ejecutar `pnpm --dir landing test`.
- [ ] Ejecutar `pnpm --dir landing build`.
- [ ] Ejecutar `pnpm typecheck`, `pnpm lint`, `pnpm test` y `pnpm build`.
- [ ] Levantar servidor local.
- [ ] Ejecutar recorrido completo de demo en navegador.
- [ ] Ejecutar Sin / Con Redacta.
- [ ] Revisar consola del navegador.
- [ ] Revisar desktop y 375 px.
- [ ] Corregir todo hallazgo reproducible y repetir checks afectados.
