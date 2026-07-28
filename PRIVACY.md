# Privacidad

## Principio

El contenido analizado no sale del dispositivo. El análisis, el score y la
redacción ocurren íntegramente en el content script.

La extensión tiene dos modos, y la diferencia entre ellos importa:

- **Sin enrolar** (por defecto): no existe ninguna comunicación de red. La
  extensión protege exactamente igual.
- **Enrolada en una empresa**: se envían metadatos de las intervenciones a la
  organización que la distribuyó. Nunca el contenido.

Enrolarse es una acción explícita del usuario, que antes de hacerlo ve qué va a
compartir. Desconectarse está disponible en cualquier momento desde el popup.

## Datos que nunca se recopilan, en ningún modo

- prompts;
- fragmentos, previews o `safePreview` del prompt;
- el texto detectado por una regla;
- offsets acompañados de texto;
- credenciales;
- nombres, emails o teléfonos **detectados dentro de un prompt**;
- texto redactado;
- historial de conversaciones;
- URLs de conversaciones.

`EventFactory` es la única función autorizada a construir un evento, y sus tests
verifican que ninguno de esos campos ni ninguna substring del texto original
aparezca en el payload.

## Datos locales

Chrome Storage conserva:

- preferencias de detección;
- términos confidenciales ingresados voluntariamente;
- contadores agregados;
- si la instalación está enrolada: identificador de instalación, token opaco,
  empresa y el email declarado por el usuario;
- la cola de eventos pendientes de entrega.

Los contadores no permiten reconstruir el contenido. El usuario puede borrar
todo eliminando la extensión, limpiando su almacenamiento o desconectándose.

## Datos que se envían cuando la instalación está enrolada

Por cada envío que activa una regla, un evento con:

- identificador del evento, momento del envío y duración del análisis;
- proveedor de IA usado;
- identificadores de las reglas activadas, su categoría y su severidad;
- decisión de la política y resolución final del usuario;
- score numérico.

Periódicamente, un heartbeat con contadores acumulados: cantidad de envíos
analizados, permitidos, advertidos, bloqueados, reemplazados y descartados de la
cola.

El email identifica al usuario ante su organización. Es **declarado por el
usuario y no está verificado**.

## Retención

Los eventos se conservan 90 días en el backend de la organización y luego se
eliminan.

## Entrega

La telemetría nunca corre en el camino crítico del envío: si el backend está
caído, el prompt se envía igual y el evento espera en una cola local acotada,
con reintentos espaciados. Si la instalación es revocada, la cola se descarta.

## Procesamiento

Las expresiones regulares, validaciones, score y redacción se ejecutan en el
content script. El caché usa un hash no criptográfico efímero en memoria para
evitar recalcular el texto actual; se reemplaza al cambiar el input y nunca se
persiste.

El token de instalación vive únicamente en el background. El content script,
que se ejecuta dentro del DOM del proveedor junto a código de terceros, nunca lo
recibe.

## Portapapeles

“Copiar versión segura” escribe únicamente el texto ya anonimizado y requiere
una acción explícita. La extensión no solicita ni usa lectura del portapapeles.
