export const siteCopy = {
  hero: {
    eyebrow: "Simulación educativa · Análisis local",
    title: "Rick evita que los datos de tu empresa se filtren.",
    body: "Nos encargamos de que los datos sensibles no salgan de tu computadora y queden en los servidores de terceros, conectando una extensión.",
  },
  flow: {
    title: "Lo que cambia antes de enviar",
    body: "En el flujo compatible, Redacta puede intervenir dentro del navegador antes de que el texto cruce hacia un servidor público.",
  },
  privacy: {
    eyebrow: "Arquitectura y privacidad",
    title: "Control local antes del envío compatible.",
    body: "Cuando Redacta detecta contenido sensible e interviene en un flujo compatible, aplica la política dentro del navegador. El proveedor recibe el texto finalmente aprobado; la detección heurística puede omitir datos.",
    controls: [
      {
        label: "Análisis local",
        detail: "En el flujo compatible, la detección y la sustitución ocurren dentro del navegador.",
      },
      {
        label: "Prompts no almacenados",
        detail: "Redacta no crea un historial del texto original ni de la versión aprobada.",
      },
      {
        label: "Permisos mínimos",
        detail: "La intervención se limita a los sitios declarados y al flujo compatible.",
      },
      {
        label: "Sin entrenamiento",
        detail: "Redacta no entrena modelos con el contenido procesado localmente.",
      },
    ],
    note:
      "Redacta reduce el riesgo de exposición cuando detecta e interviene en proveedores compatibles. La detección puede tener falsos negativos y admite revisión.",
    disclaimer:
      "Redacta reduce el riesgo de exposición cuando detecta e interviene en proveedores compatibles. La detección heurística puede tener falsos negativos; cambios del proveedor o vías alternativas pueden evitar la intervención. No reemplaza una política integral de seguridad, DLP ni controles de acceso.",
  },
  cta: {
    eyebrow: "Control antes del envío",
    title: "No esperes al próximo incidente para descubrir qué estaba saliendo.",
    body: "Sumá control local al flujo compatible y hacé explícita la revisión antes de enviar texto a un proveedor público.",
  },
} as const;
