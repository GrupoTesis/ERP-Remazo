"use client";

import { useActionState } from "react";
import { closeShiftAsAdminAction } from "@/features/shifts/actions";
import type { Shift, ShiftActionState } from "@/types/shifts";

const initialState: ShiftActionState = {};

export function AdminShifts({ shifts }: { shifts: Shift[] }) {
  const [state, formAction, pending] = useActionState(
    closeShiftAsAdminAction,
    initialState,
  );

  return (
    <section aria-labelledby="active-shifts-title" className="panel shift-panel">
      <h2 id="active-shifts-title">Turnos abiertos</h2>
      {shifts.length === 0 ? (
        <p>No hay turnos abiertos.</p>
      ) : (
        <ul className="shift-list">
          {shifts.map((shift) => (
            <li key={shift.id}>
              <div>
                <strong>
                  {shift.role === "recepcion"
                    ? "Recepción"
                    : shift.role === "limpieza"
                      ? "Limpieza"
                      : "Administración"}
                </strong>
                <p className="muted">Usuario: {shift.user_id}</p>
                <p>
                  Inicio:{" "}
                  <time dateTime={shift.opened_at}>
                    {new Date(shift.opened_at).toLocaleString("es-PE")}
                  </time>
                </p>
              </div>
              <form action={formAction}>
                <input name="shiftId" type="hidden" value={shift.id} />
                <button
                  className="button button-secondary"
                  disabled={pending}
                  type="submit"
                >
                  {pending ? "Cerrando…" : "Cerrar turno y sesión"}
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
      {state.error && (
        <p className="message message-error" role="alert">
          {state.error}
        </p>
      )}
      {state.message && (
        <p className="message message-success" role="status">
          {state.message}
        </p>
      )}
    </section>
  );
}
