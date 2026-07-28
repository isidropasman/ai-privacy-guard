# Privacidad

## Principio

El contenido analizado no sale del dispositivo.

## Datos que no se recopilan

- prompts;
- fragmentos o previews del prompt;
- credenciales;
- nombres, emails o teléfonos detectados;
- hashes persistidos;
- historial de conversaciones;
- URLs de conversaciones;
- identidad del usuario.

## Datos locales

Chrome Storage conserva únicamente:

- preferencias de detección;
- términos confidenciales ingresados voluntariamente;
- contadores agregados.

Los contadores no permiten reconstruir el contenido. El usuario puede borrar estos datos eliminando la extensión o limpiando su almacenamiento.

## Procesamiento

Las expresiones regulares, validaciones, score y redacción se ejecutan en el content script. El caché usa un hash no criptográfico efímero en memoria para evitar recalcular el texto actual; se reemplaza al cambiar el input y nunca se persiste.

## Portapapeles

“Copiar versión segura” escribe únicamente el texto ya anonimizado y requiere una acción explícita. La extensión no solicita ni usa lectura del portapapeles.
