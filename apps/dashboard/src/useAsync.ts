import { useCallback, useEffect, useState } from "react";

export interface AsyncState<Value> {
  readonly value: Value | undefined;
  readonly error: string | undefined;
  readonly loading: boolean;
  readonly reload: () => void;
}

/**
 * Carga con estados explícitos de carga, error y vacío. El dashboard pasó de
 * fixtures siempre presentes a datos remotos, así que ninguna sección puede
 * seguir asumiendo que los datos ya están.
 */
export function useAsync<Value>(
  load: () => Promise<Value>,
  deps: readonly unknown[],
): AsyncState<Value> {
  const [value, setValue] = useState<Value>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => {
    setNonce((current) => current + 1);
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(undefined);

    load()
      .then((result) => {
        if (active) setValue(result);
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(cause instanceof Error ? cause.message : String(cause));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [...deps, nonce]);

  return { value, error, loading, reload };
}
