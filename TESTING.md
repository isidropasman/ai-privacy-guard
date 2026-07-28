# Testing

## Automatizado

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm format:check
pnpm e2e
```

Vitest cubre detectores, política, caché, storage, redacción, UI, adapters e interceptación. Playwright carga el build unpacked real en Chromium y reemplaza `https://chatgpt.com/` por una fixture local: ninguna prueba automatizada envía datos al servicio externo.

La fixture simula:

- `textarea`;
- `contenteditable`;
- botón de envío;
- formulario;
- recreación dinámica;
- contador de submissions.

## Protocolo manual en ChatGPT

1. Ejecutá `pnpm build`.
2. Cargá `.output/chrome-mv3` desde `chrome://extensions`.
3. Abrí una conversación nueva en `https://chatgpt.com`.
4. Confirmá que aparece **Protected**.
5. Enviá el prompt seguro del README: debe salir sin modal.
6. Pegá la credencial fixture: debe aparecer **Envío bloqueado** y no debe enviarse.
7. Elegí **Eliminar y continuar**: el editor debe contener `[API_KEY_REMOVED]` y enviarse una vez.
8. Probá el prompt PII: debe advertir y anonimizar nombre/email.
9. Probá el prompt financiero: debe advertir y reemplazar montos.
10. Confirmá que Shift+Enter crea una línea y no envía.
11. Navegá a otro chat y repetí un prompt seguro.
12. Revisá DevTools: no debe haber logs con contenido ni requests iniciados por la extensión.

Usá sólo fixtures falsas.

## Rendimiento

La suite mide un prompt de 10.000 caracteres contra el conjunto completo de detectores y exige menos de 150 ms en el entorno de test.
