# Redacta Security Incident Simulator — Design Specification

## Objective

Rediseñar la landing de Redacta como una experiencia pixel-art orientada a CISO, compliance y responsables de seguridad. La página debe concientizar sobre qué ocurre cuando información empresarial llega a un proveedor público de IA, demostrar cómo Redacta interviene antes del envío y traducir la protección a impacto medible para la empresa.

La acción primaria continúa siendo probar la demo o solicitar acceso.

## Audience

Primary:

- CISO.
- Equipos de compliance.
- Responsables de seguridad y riesgo.
- IT managers con responsabilidad sobre adopción de IA.

Secondary:

- Founders y líderes operativos de empresas medianas.
- Equipos legales y de privacidad.

La narrativa prioriza control, exposición, políticas y evidencia. No depende de conocimiento técnico profundo.

## Creative Direction

La experiencia adopta el concepto **Security Incident Simulator**.

No debe parecer:

- una landing SaaS genérica;
- un videojuego retro;
- un dashboard enterprise desconectado del producto;
- una página alarmista basada únicamente en miedo.

Debe sentirse como una consola de seguridad futurista construida completamente en pixel art:

- geometría en grilla;
- esquinas escalonadas;
- marcos y separadores de un píxel;
- íconos, gráficos, cursores, toggles y estados pixelados;
- animaciones discretas por pasos;
- tipografía sans legible para contenido;
- tipografía mono o pixel para datos, estados y controles.

Paleta:

- fondo `#050B14`;
- superficie `#091727`;
- superficie elevada `#10243A`;
- texto `#EAF4F6`;
- seguridad `#5CF2C2`;
- información `#45C8FF`;
- advertencia `#FFCB66`;
- riesgo `#FF665C`;
- bordes `#29435A`.

La mascota existente `security-genie.webp` actúa como guardián y narrador. Se utilizan frames existentes del sprite sheet; no se redibuja ni reemplaza.

## Page Narrative

### 1. Navbar

Mantiene logo, Cómo funciona, Privacidad y Probar demo. El tratamiento visual pasa a ser una barra de consola pixelada con estado:

`REDACTA // LOCAL PROTECTION: ACTIVE`

### 2. Hero

Headline:

> Tu equipo ya usa IA. ¿Sabés qué información está saliendo?

Subheadline:

> Redacta intercepta documentos y mensajes antes de que lleguen a un proveedor público, detecta información confidencial y genera una versión segura sin romper el flujo de trabajo.

La demo de archivo comienza visible en el hero. No existe una ilustración decorativa separada.

Indicadores compactos:

- análisis local;
- contenido no almacenado;
- secretos críticos bloqueados;
- políticas aplicadas antes del envío.

### 3. Guided File Incident Demo

La demo simula la carga local de:

`Propuesta_ACME_Q4.pdf · 38 páginas · 2.8 MB`

El contenido es ficticio y está definido en datos locales.

Estados:

```ts
type IncidentDemoState =
  | "ready"
  | "loading-file"
  | "scanning"
  | "findings"
  | "redacting"
  | "review"
  | "safe-to-send"
  | "sent";
```

Recorrido:

1. El usuario selecciona “Analizar antes de enviar”.
2. Un escáner pixelado recorre miniaturas del documento.
3. Aparecen hallazgos por página:
   - clientes;
   - emails;
   - precios;
   - márgenes;
   - estrategia comercial;
   - API key.
4. Un heatmap marca páginas y zonas con riesgo.
5. Se muestra:
   - `18 hallazgos`;
   - `7 críticos`;
   - `42% del archivo contiene información confidencial`;
   - `14.820 caracteres evitaron salir del navegador`.
6. El usuario elige “Generar versión segura”.
7. Valores originales se transforman en tokens semánticos.
8. Se presenta una comparación Antes / Después.
9. El usuario confirma el envío de la versión protegida.

La métrica “salvada” se presenta como:

> Redacta evitó que 14.820 caracteres sensibles y 7 secretos críticos llegaran a un servidor público.

Es una simulación educativa, no telemetría real.

### 4. Data Journey Simulator

Sección titulada:

> Un prompt no desaparece cuando presionás enviar

Selector:

- Sin Redacta.
- Con Redacta.

Sin Redacta:

1. Empleado envía un paquete con datos identificables.
2. El paquete atraviesa la frontera del navegador.
3. Llega al proveedor público.
4. El servidor procesa el contenido.
5. Una copia visual del dato queda dentro de la infraestructura externa.
6. La respuesta vuelve al empleado.
7. Aparece:

> La IA respondió. La información confidencial de tu empresa quedó fuera de tu control.

Con Redacta:

1. El paquete se detiene dentro del navegador.
2. Redacta abre y analiza el contenido localmente.
3. Los bloques sensibles se sustituyen por tokens.
4. Sólo la versión segura cruza la frontera.
5. El proveedor procesa contenido anonimizado.
6. La respuesta vuelve sin haber recibido los valores originales.

La animación usa nodos, paquetes y rutas pixel-art. No usa partículas ambientales constantes.

### 5. Enterprise Impact Console

Sección explícitamente marcada:

`VISIÓN ENTERPRISE · PRÓXIMAMENTE`

Muestra un panel conceptual para CISO/compliance:

- 1.248 prompts inspeccionados;
- 183 intervenciones;
- 41 secretos críticos bloqueados;
- 2.7 MB de información sensible evitó salir;
- distribución por credenciales, clientes, comercial y contratos;
- proveedores compatibles;
- políticas aplicadas;
- actividad por equipo.

Mensaje principal:

> Convertí riesgo invisible en evidencia accionable.

No afirma que el MVP actual ya dispone de administración, auditoría o métricas centralizadas.

### 6. Use-case Incident Gallery

Cuatro microescenas interactivas:

- Contrato: partes, montos y cláusulas confidenciales.
- Código: API keys, tokens y connection strings.
- Propuesta comercial: cliente, precio, margen y estrategia.
- Datos de cliente: nombres, emails e identificadores.

Cada escena tiene tres estados:

- original;
- hallazgos;
- versión segura.

No se presentan como cards SaaS independientes. Forman una única consola con selector lateral.

### 7. Privacy and Architecture

La sección explica:

- análisis dentro del navegador;
- prompts no almacenados por Redacta;
- permisos mínimos;
- sin entrenamiento con datos;
- políticas aplicadas antes de cruzar la frontera.

Incluye el disclaimer:

> Redacta reduce el riesgo de exposición en proveedores compatibles. No reemplaza una política integral de seguridad, DLP ni controles de acceso.

### 8. Final CTA

Headline:

> No esperes al próximo incidente para descubrir qué estaba saliendo.

La mascota aparece con el frame de escudo.

Acciones:

- Solicitar acceso.
- Repetir simulación.

## Component Architecture

```text
landing/src/
  components/
    navigation/
      Navbar.tsx
    incident-demo/
      IncidentDemo.tsx
      FileDropZone.tsx
      ScanProgress.tsx
      DocumentHeatmap.tsx
      FindingsConsole.tsx
      RedactionComparison.tsx
      ProtectionReceipt.tsx
    data-journey/
      DataJourneySimulator.tsx
      JourneyNode.tsx
      DataPacket.tsx
    enterprise/
      EnterpriseImpactConsole.tsx
    use-cases/
      IncidentGallery.tsx
      IncidentScene.tsx
    privacy/
      PrivacyArchitecture.tsx
    FinalCTA.tsx
    Footer.tsx
  data/
    copy.ts
    incidentDemo.ts
    journeyScenarios.ts
    useCases.ts
  styles/
    tokens.css
    primitives.css
    layout.css
    responsive.css
```

## Interaction and Motion

- Framer Motion sólo coordina transiciones de estado y recorrido.
- Los paquetes viajan entre nodos una vez por interacción.
- El escáner usa una línea pixelada y actualiza progreso por páginas.
- Los valores se sustituyen visualmente, no mediante crossfade genérico.
- Los números incrementan cuando termina una etapa, no permanentemente.
- Todos los recorridos tienen control manual y no dependen de autoplay.
- `prefers-reduced-motion` elimina movimiento espacial y conserva cambios de estado instantáneos.

## Accessibility

- Controles nativos y navegación por teclado.
- Estados comunicados con texto y `aria-live`, no sólo por color.
- Tabs con roles correctos y foco visible.
- Animaciones pausables o disparadas por acciones.
- Contraste WCAG AA.
- El documento ficticio tiene representación textual accesible además del heatmap.

## Performance

- No videos.
- Sprite existente recortado en WebP para usos estáticos.
- Animaciones con transform y opacity.
- Datos y simulaciones completamente locales.
- Sin llamadas reales a IA.
- Lazy rendering para Enterprise Impact Console e Incident Gallery cuando sea útil.

## Testing

- Unit tests de transiciones de la máquina de estados.
- Component test del recorrido completo:
  - analizar;
  - detectar;
  - redactar;
  - revisar;
  - enviar versión segura.
- Test del selector Sin / Con Redacta.
- Typecheck, lint, tests y build de landing.
- Typecheck, lint, tests y build de la extensión.
- Revisión visual en desktop y 375 px.
- Consola sin errores.

## Explicit Non-goals

- Upload real de archivos.
- Parseo real de PDF.
- Backend.
- Telemetría.
- Dashboard enterprise funcional.
- Autenticación.
- Integraciones con proveedores.
- Claims de protección absoluta.

