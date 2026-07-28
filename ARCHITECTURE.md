# Arquitectura

## Flujo de envío

```text
Evento del usuario
  → SubmissionInterceptor
  → ProviderAdapter.getComposerText()
  → DetectorEngine
  → PolicyEngine
  → ALLOW | WARN | BLOCK
  → RedactionEngine + WarningModal
  → EventGuard
  → ProviderAdapter.triggerApprovedSubmission()
```

`EventGuard` mantiene una ventana de aprobación limitada a una transacción. La cadena nativa `click → submit` puede atravesarla, pero un nuevo gesto del usuario vuelve a analizarse. `SubmissionInterceptor` bloquea intentos concurrentes para evitar envíos duplicados.

## Límites

- `src/adapters`: conocimiento del DOM del proveedor.
- `src/detection`: detectores puros, offsets y previews seguras.
- `src/policy`: score determinístico y coordinación de decisiones.
- `src/redaction`: reemplazos específicos y resolución de solapamientos.
- `src/interception`: captura de eventos y reanudación aprobada.
- `src/ui`: React encapsulado dentro de Shadow DOM.
- `src/storage`: validación del único borde persistente.
- `src/security`: sanitización y logging estructurado opcional.

Los motores de detección, política y redacción no importan selectores ni APIs de Chrome.

## DOM dinámico

`DomProviderAdapter` prioriza `role="textbox"`, `contenteditable`, `textarea`, ARIA y relación con el formulario de envío. Un único `MutationObserver` observa `main` —o `body` como fallback— sólo para cambios de hijos. La identidad del composer se compara antes de notificar.

## Proveedores

`ProviderAdapter` define matching, lectura/escritura del composer, send action, envío aprobado y observación. `ChatGPTAdapter`, `ClaudeAdapter` y `GeminiAdapter` son configuraciones delgadas (hostnames + selectores) sobre `DomProviderAdapter` (`src/adapters/shared`), que centraliza el comportamiento DOM genérico. `createAdapterForLocation` elige el adapter activo según `location.hostname` al iniciar el content script.

## Estado

Los prompts existen únicamente en memoria durante el análisis y la decisión. Chrome Storage contiene:

```typescript
{
  warningsEnabled: boolean;
  financialDetectionEnabled: boolean;
  strictSecrets: boolean;
  confidentialTerms: string[];
  counters: {
    allowedCount: number;
    warnedCount: number;
    blockedCount: number;
    redactedCount: number;
  };
}
```
