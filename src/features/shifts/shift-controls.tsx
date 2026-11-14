"use client";

import { useActionState } from "react";
import {
  closeMyShiftAction,
  openShiftAction,
} from "@/features/shifts/actions";
import type { AppRole } from "@/types/auth";
import type { Shift, ShiftActionState } from "@/types/shifts";

const initialState: ShiftActionState = {};

export function ShiftControls({
  role,
  shift,
}: {
  role: AppRole;
  shift: Shift | null;
}) {
  const [openState, openAction, opening] = useActionState(
    openShiftAction,
    initialState,
  );
  const [closeState, closeAction, closing] = useActionState(
    closeMyShiftAction,
    initialState,
  );

  const active = closeState.active ?? openState.active ?? Boolean(shift);
  const error = closeState.error ?? openState.error;
  const message = closeState.message ?? openState.message;

  return (
    <section aria-labelledby="shift-title" className="panel shift-panel">
      <h2 id="shift-title">
        Turno de{" "}
        {role === "recepcion"
          ? "recepción"
          : role === "limpieza"
            ? "limpieza"
            : "administración"}
      </h2>
      {active ? (
        <>
          <p>
            Turno abierto desde{" "}
            <time dateTime={shift?.opened_at}>
              {shift
                ? new Date(shift.opened_at).toLocaleString("es-PE")
                : "ahora"}
            </time>
          </p>
          <form action={closeAction}>
            <button
              className="button button-secondary"
              disabled={closing}
              type="submit"
            >
              {closing ? "Cerrando turno…" : "Cerrar turno"}
            </button>
          </form>
        </>
      ) : (
        <>
          <p>No tienes un turno abierto. Ábrelo para habilitar las operaciones.</p>
          <form action={openAction}>
            <button
              className="button button-primary"
              disabled={opening}
              type="submit"
            >
              {opening ? "Abriendo turno…" : "Abrir turno"}
            </button>
          </form>
        </>
      )}
      {error && (
        <p className="message message-error" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="message message-success" role="status">
          {message}
        </p>
      )}
    </section>
  );
}
