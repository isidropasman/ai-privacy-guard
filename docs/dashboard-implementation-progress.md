# Progreso del dashboard

Última actualización: 2026-07-28

## Alcance actual

Esta etapa implementa un dashboard local **multi-empresa**. No incluye backend,
autenticación, sincronización de políticas ni cambios en la extensión.

La sesión se comporta siempre como un super-admin que ve todas las empresas y
puede ingresar a cualquiera. Todavía no hay roles ni aislamiento real: el
aislamiento es de modelo de datos, no de seguridad.

## Completado

- [x] Análisis de la arquitectura existente.
- [x] Dashboard React + TypeScript + Vite independiente.
- [x] Sección de reglas base derivadas del registro real de detectores.
- [x] Reglas personalizadas: alta, edición, activación y desactivación.
- [x] Keywords, descripción, severidad y acción.
- [x] Modelo multi-empresa: `Company`, `CompanyUser`, `CompanyExtension` y
      reglas indexadas por empresa.
- [x] Consola super-admin con listado de empresas, búsqueda y métricas
      agregadas.
- [x] Ingreso a una empresa y navegación con contexto de empresa activa.
- [x] Resumen por empresa: cobertura, ranking de reglas, proveedores y últimos
      eventos.
- [x] Sección de usuarios por empresa con rol, estado y enrolamiento.
- [x] Sección de extensión por empresa: build ID, código de enrolamiento,
      versión de política y composición del paquete.
- [x] Eventos por empresa con filtros y actividad global entre empresas.
- [x] 8 empresas de demostración con usuarios, reglas y eventos deterministas.
- [x] Persistencia local por empresa en `localStorage`
      (`ai-privacy-guard-dashboard-rules-v2`).
- [x] Verificación de TypeScript, ESLint, Prettier, build de producción y
      recorrido headless de todas las secciones sin errores de consola.

## Modelo multi-empresa

- Las **reglas base** son compartidas: se derivan de `describeBaseRules()` y son
  de solo lectura en todas las empresas.
- Las **reglas personalizadas** pertenecen a una empresa y se guardan como
  `Record<companyId, CustomRule[]>`.
- Los **usuarios** y **eventos** están scopeados por `companyId`.
- Cada empresa tiene su propio descriptor de **extensión**: build ID, versión,
  versión de política, código de enrolamiento y proveedores cubiertos.
- La cobertura se calcula como usuarios con la extensión instalada (al día o
  desactualizada) sobre el total de usuarios de la empresa.

## Archivos del dashboard

```text
apps/dashboard/src/
  App.tsx                     Shell, contexto de empresa activa y navegación
  CompaniesSection.tsx        Listado super-admin e ingreso a cada empresa
  GlobalActivitySection.tsx   Eventos de todas las empresas
  CompanyOverviewSection.tsx  Resumen de una empresa
  RulesSection.tsx            Reglas personalizadas de la empresa activa
  BaseRulesSection.tsx        Detectores base, de solo lectura
  UsersSection.tsx            Usuarios de la empresa activa
  EventsSection.tsx           Eventos de la empresa activa
  ExtensionSection.tsx        Paquete y política de la empresa activa
  metrics.ts                  Métricas derivadas y rankings
  mockData.ts                 8 empresas de demostración deterministas
  storage.ts                  Persistencia local indexada por empresa
  types.ts                    Contratos del dashboard
  ui.tsx                      Primitivas de UI y formateo compartido
```

## Decisiones

- El dashboard no importa código de la extensión salvo `describeBaseRules()`,
  para que las reglas base mostradas sean las reales.
- No existe comunicación de red.
- Las reglas del dashboard son prototipos locales y no alteran las reglas
  TypeScript existentes.
- Los eventos son fixtures sin prompts ni fragmentos sensibles; sólo contienen
  metadatos (usuario, proveedor, categoría, regla, severidad, acción y
  resolución).
- Los datos de demostración se generan con semillas fijas para que los números
  no cambien entre recargas.
- La integración real se realizará en una etapa posterior.

## Pendiente para etapas futuras

- Backend y persistencia centralizada por organización.
- Autenticación, roles y aislamiento real entre empresas.
- Diferenciar la sesión de super-admin de la de un administrador de empresa.
- Publicación y versionado de políticas por empresa.
- Generación y firma del paquete de extensión por empresa.
- Enrolamiento real de instalaciones y usuarios.
- Recepción real de eventos.
