# Dashboard multi-empresa

Prototipo administrativo independiente de la extensión. Modela una plataforma
que varias empresas implementan al mismo tiempo: todas reciben las mismas reglas
base y cada una suma sus propias reglas y sus propios usuarios.

## Ejecutar

Requiere Node.js 22+ y pnpm.

```bash
cd apps/dashboard
pnpm install
pnpm dev
```

Abrí `http://localhost:5173`.

## Verificar

```bash
pnpm typecheck
pnpm build
```

## Alcance

La sesión actual es siempre la de un **super-admin** que ve todas las empresas y
puede entrar a cualquiera.

Consola super-admin:

- **Empresas**: listado de las 8 organizaciones de demostración con plan,
  estado, cobertura de instalación, reglas propias, eventos y última política
  publicada. Desde acá se ingresa a cada empresa.
- **Actividad global**: eventos de todas las empresas, con filtros por empresa,
  severidad y origen de la regla.
- **Reglas base**: detectores reales del código de la extensión, de solo
  lectura.

Dentro de una empresa:

- **Resumen**: cobertura, reglas más activadas, proveedores usados y últimos
  eventos.
- **Reglas personalizadas**: alta, edición, activación y desactivación. Sólo
  afectan a esa empresa.
- **Reglas base**: las mismas para todas, no se editan ni se desactivan.
- **Usuarios**: personas alcanzadas por la extensión, rol, estado de
  enrolamiento y actividad.
- **Eventos**: intercepciones de esa empresa, con filtros por usuario,
  severidad y proveedor.
- **Extensión**: identificación del paquete de la empresa, código de
  enrolamiento y composición de la política publicada.

## Datos

- Empresas, usuarios y eventos son fixtures deterministas (`src/mockData.ts`).
  No contienen prompts ni fragmentos sensibles.
- Las reglas base se derivan del registro real de detectores de la extensión.
- Las reglas personalizadas se guardan en `localStorage`, indexadas por empresa,
  bajo la clave `ai-privacy-guard-dashboard-rules-v2`.

No incluye backend, autenticación real ni integración con la extensión.
