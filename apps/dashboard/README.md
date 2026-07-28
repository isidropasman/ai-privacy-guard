# Dashboard local

Prototipo administrativo independiente de la extensión.

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

- Gestión local de reglas personalizadas.
- Creación, edición y activación/desactivación.
- Keywords, severidad y acción.
- Persistencia en `localStorage`.
- Eventos mockeados sin prompts.

No incluye backend, autenticación ni integración con la extensión.
