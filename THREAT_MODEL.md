# Threat model

## Activos

- contenido escrito;
- credenciales y claves privadas;
- información personal y financiera;
- políticas corporativas;
- términos y configuración local.

## Adversarios

- proveedor de IA externo;
- sitio web comprometido;
- otra extensión maliciosa;
- atacante con acceso al navegador;
- usuario que intenta evitar la política;
- dependencia comprometida.

## Amenazas y mitigaciones

| Amenaza                         | Mitigación                                           | Riesgo residual                                              |
| ------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------ |
| Fuga del prompt                 | Procesamiento local, sin red ni historial            | El proveedor recibe el texto finalmente aprobado             |
| Logs accidentales               | API de logging cerrada y `no-console`                | Herramientas del navegador pueden inspeccionar el DOM actual |
| Almacenamiento accidental       | Repositorio tipado sólo para settings y números      | Términos voluntarios siguen siendo datos locales             |
| Manipulación del DOM            | Selectores semánticos, consulta al momento del envío | Un cambio incompatible puede generar falso negativo          |
| Bypass por caminos alternativos | Captura de teclado, clic y submit                    | Nuevos flujos del proveedor pueden requerir adaptación       |
| Envíos duplicados               | Transacción aprobada e in-flight guard               | Integraciones no estándar del sitio pueden variar            |
| Conflictos CSS                  | Shadow DOM y z-index aislado                         | Otra extensión puede superponerse                            |
| Falsos negativos                | Múltiples detectores y contexto                      | Ningún detector heurístico garantiza cobertura total         |
| Falsos positivos                | Confianza, contexto, Luhn y opción de revisar        | La intervención puede interrumpir trabajo legítimo           |
| Supply chain                    | Dependencias mínimas, lockfile y CSP                 | Una dependencia aprobada todavía requiere auditoría          |

## Límites explícitos

La versión de consumo no puede impedir que un usuario:

- desactive la extensión;
- use incógnito sin habilitarla;
- use otro navegador, sitio o app de escritorio;
- llame directamente una API;
- modifique la extensión localmente.

Una versión empresarial deberá complementarse con Chrome Enterprise force-install, políticas de navegador, controles de endpoint, proxy o secure web gateway y administración centralizada.
