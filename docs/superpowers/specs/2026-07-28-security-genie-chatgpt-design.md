# Security Genie en ChatGPT

## Objetivo

Reemplazar el badge pasivo de AI Privacy Guard por Security Genie, una mascota
persistente junto al composer de ChatGPT que representa visualmente la revisión
local y presenta las decisiones de privacidad como una conversación iniciada
por el personaje.

## Experiencia

Security Genie permanece visible en la esquina inferior derecha, próximo al
composer sin superponer sus controles. En reposo ocupa poco espacio y no muestra
texto. Cuando el usuario intenta enviar un prompt, cambia a estado de escaneo.

Si el prompt está limpio, confirma brevemente que puede enviarse y vuelve al
reposo. Si encuentra información sensible, despliega una burbuja anclada a la
mascota. La burbuja conserva las decisiones actuales:

- Anonimizar y enviar.
- Revisar o volver al mensaje.
- Enviar original cuando la política lo permite.
- Copiar la versión segura en bloqueos críticos.
- Cancelar.

La burbuja es la superficie principal para advertencias y bloqueos. El fondo de
ChatGPT no se oscurece: el usuario mantiene contexto sobre el mensaje que está
protegiendo. En pantallas angostas puede crecer hacia arriba, pero siempre
permanece conectada visualmente a la mascota.

## Estados visuales

- `idle`: mascota presente, sin burbuja.
- `scanning`: feedback visual mientras se ejecuta la revisión local.
- `allow`: confirmación breve de envío limpio.
- `verify`: burbuja con hallazgos y versión segura.
- `redacted`: confirmación breve después de anonimizar.
- `block`: pose de protección y burbuja sin salida directa del contenido crítico.
- `error`: explica que la revisión local falló y ofrece únicamente las acciones
  permitidas por el estado real del envío.

Los estados `allow` y `redacted` vuelven automáticamente a `idle`. Los estados
`verify`, `block` y `error` permanecen hasta que el usuario decide o los cierra.

## Arquitectura

El content script mantiene un único árbol React dentro del Shadow DOM existente.
Ese árbol renderiza la mascota y, cuando corresponde, su burbuja. No se crean
raíces React independientes por cada revisión.

`SubmissionInterceptor` publica el inicio y el resultado semántico de cada
revisión. `PrivacyReviewService` continúa siendo responsable de política y
decisiones, sin duplicar reglas en la UI. Un reducer de UI traduce esos eventos a
estados de Security Genie.

La lógica de detección, redacción y envío permanece intacta. La integración
visual consume sus resultados y devuelve las mismas decisiones que hoy devuelve
el modal.

## Componentes

- `SecurityGenie`: renderiza el personaje, estado y feedback breve.
- `GenieDecisionBubble`: renderiza hallazgos, versión segura y acciones.
- `mascotState`: reducer exhaustivo del ciclo visual.
- `SecurityGenieController`: conecta eventos del interceptor, decisiones del
  servicio y timers de autocierre.

La burbuja reutiliza `FindingsList` y los tipos de decisión actuales. El
componente `WarningModal` deja de ser la superficie principal, pero sus reglas
de contenido y accesibilidad se trasladan sin cambios funcionales.

## Assets y movimiento

Se reutiliza la identidad pixel-art existente del Security Genie. Los assets
mantienen fondo transparente, proporciones estables e `image-rendering:
pixelated`. No se agrega ninguna dependencia de animación.

La pose `idle` se usa en reposo y la pose con escudo en bloqueos. Escaneo,
confirmación y anonimización pueden usar movimiento CSS sutil sobre estos assets
en la primera versión. No se requiere un sprite adicional para lanzar esta
iteración.

Con `prefers-reduced-motion: reduce`, se eliminan desplazamientos y loops; cada
estado conserva una pose estática comprensible.

## Accesibilidad

La mascota tiene nombre accesible y no recibe foco cuando está en reposo. La
burbuja usa `role="dialog"` para decisiones y `role="status"` para confirmaciones
no interactivas.

Al abrir una decisión, el foco pasa a la acción principal. `Escape` vuelve al
mensaje sin enviarlo. `Tab` queda contenido dentro de la burbuja. Al cerrar, el
foco vuelve al composer.

Las áreas interactivas tienen al menos `44×44 px`, contraste AA y textos que no
dependen únicamente del color o de la pose.

## Responsive

En desktop la mascota queda a la derecha del composer y la burbuja crece hacia
arriba y hacia la izquierda. En anchos menores a `520 px`, la mascota reduce su
tamaño visual y la burbuja ocupa el ancho disponible sobre el composer.

La UI no puede tapar el botón de envío, el selector de archivos ni el contenido
editable. El posicionamiento se adapta a cambios del composer mediante CSS y no
depende de coordenadas absolutas de la página de ChatGPT.

## Errores y concurrencia

Sólo puede existir una decisión activa. Un segundo intento de envío mientras
hay una revisión en curso no abre otra burbuja ni dispara otro envío.

Los timers se cancelan al cambiar de estado o desmontar el content script. Si
ChatGPT recrea el composer, la mascota permanece montada y el foco se restaura al
nuevo composer disponible.

Los errores locales respetan `originalMayBeSent`; la UI nunca ofrece enviar el
original cuando el interceptor no puede asegurar que sea una acción válida.

## Verificación

- Tests unitarios para todas las transiciones del reducer.
- Tests del render, acciones, foco, `Escape` y focus trap de la burbuja.
- Tests de integración para eventos del interceptor y una única revisión activa.
- E2E para prompt limpio, anonimización, bloqueo crítico y composer recreado.
- Prueba manual en ChatGPT real con click, Enter, `Ctrl+Enter`, `Meta+Enter` y
  viewport angosto.
- Validación con `prefers-reduced-motion: reduce`.

## Fuera de alcance

- Historial de revisiones.
- Configuración desde la mascota.
- Chat libre con la mascota.
- Telemetría o procesamiento remoto.
- Nuevas reglas de detección o cambios de política.
