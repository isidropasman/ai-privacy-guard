import { useState } from "react";
import { api } from "./api";

export function LoginScreen({
  onAuthenticated,
}: {
  readonly onAuthenticated: () => void;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  return (
    <main className="login">
      <form
        className="panel login-card"
        onSubmit={(event) => {
          event.preventDefault();
          setError(undefined);
          setBusy(true);
          api
            .login(password)
            .then(onAuthenticated)
            .catch((cause: unknown) => {
              setError(
                cause instanceof Error ? cause.message : "No se pudo entrar.",
              );
            })
            .finally(() => {
              setBusy(false);
            });
        }}
      >
        <div className="brand">
          <span>PG</span>
          <div>
            <strong>Privacy Guard</strong>
            <small>Consola super-admin</small>
          </div>
        </div>

        <label>
          Contraseña
          <input
            type="password"
            value={password}
            autoFocus
            onChange={(event) => setPassword(event.currentTarget.value)}
          />
        </label>

        {error === undefined ? null : (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <button className="button button--primary" disabled={busy}>
          {busy ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
