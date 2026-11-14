"use client";

import { useActionState } from "react";
import { loginAction } from "@/features/auth/actions";
import type { LoginState } from "@/types/auth";

const initialState: LoginState = {};

export function LoginForm({
  inactive = false,
  reauthRequired = false,
}: {
  inactive?: boolean;
  reauthRequired?: boolean;
}) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="form">
      {inactive && (
        <p className="message message-error" role="alert">
          La cuenta no está registrada.
        </p>
      )}
      {reauthRequired && (
        <p className="message message-error" role="alert">
          Tu turno fue cerrado. Inicia sesión nuevamente para continuar.
        </p>
      )}
      {state.error && (
        <p className="message message-error" role="alert">
          {state.error}
        </p>
      )}
      <label htmlFor="email">Correo electrónico</label>
      <input
        autoComplete="username"
        id="email"
        name="email"
        type="email"
        required
      />
      <label htmlFor="password">Contraseña</label>
      <input
        autoComplete="current-password"
        id="password"
        name="password"
        type="password"
        required
      />
      <button className="button button-primary" disabled={pending} type="submit">
        {pending ? "Ingresando…" : "Iniciar sesión"}
      </button>
    </form>
  );
}
