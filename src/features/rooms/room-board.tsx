"use client";

import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { changeRoomStatusAction } from "@/features/rooms/actions";
import type { Room, RoomStatus } from "@/types/rooms";
import type { AppRole } from "@/types/auth";
import type { RoomActionState } from "@/types/rooms";

const statusLabels: Record<RoomStatus, string> = {
  disponible: "Disponible",
  ocupada: "Ocupada",
  limpieza: "En limpieza",
};

const statusIcons: Record<RoomStatus, string> = {
  disponible: "✓",
  ocupada: "●",
  limpieza: "↻",
};

export function RoomBoard({
  role,
  rooms,
}: {
  role: AppRole;
  rooms: Room[];
}) {
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const closeDialog = useCallback(() => setSelectedRoom(null), []);

  return (
    <section aria-labelledby="room-board-title" className="room-board-panel">
      <div className="room-board-heading">
        <div>
          <p className="eyebrow">Estado operativo</p>
          <h2 id="room-board-title">Habitaciones</h2>
        </div>
        <p className="muted">{rooms.filter((room) => room.active).length} activas de 6</p>
      </div>
      <ul className="room-grid">
        {rooms.map((room) => (
          <li
            className={`room-card room-card-${room.status}${room.active ? "" : " room-card-inactive"}`}
            key={room.id}
          >
            <div className="room-card-header">
              <span aria-hidden="true" className="room-status-icon">
                {statusIcons[room.status]}
              </span>
              <span className={`room-status room-status-${room.status}`}>
                {statusLabels[room.status]}
              </span>
            </div>
            <h3>{room.name}</h3>
            <p className="muted">Habitación {room.room_number}</p>
            {!room.active && <p className="room-inactive-label">Desactivada</p>}
            {room.active &&
              ((role === "recepcion" && room.status === "ocupada") ||
                role === "admin") && (
                <button
                  className="button button-secondary room-action"
                  onClick={() => setSelectedRoom(room)}
                  type="button"
                >
                  {role === "admin" ? "Corregir estado" : "Registrar salida"}
                </button>
              )}
          </li>
        ))}
      </ul>
      {selectedRoom && (
        <RoomStatusDialog
          key={selectedRoom.id}
          onClose={closeDialog}
          role={role}
          room={selectedRoom}
        />
      )}
    </section>
  );
}

function RoomStatusDialog({
  room,
  role,
  onClose,
}: {
  room: Room;
  role: AppRole;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [state, formAction, pending] = useActionState<RoomActionState, FormData>(
    changeRoomStatusAction,
    {},
  );
  const isAdmin = role === "admin";

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  useEffect(() => {
    if (state.success) {
      onClose();
      router.refresh();
    }
  }, [onClose, router, state.success]);

  return (
    <dialog
      aria-labelledby="room-dialog-title"
      className="room-dialog"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      ref={dialogRef}
    >
      <form action={formAction} className="room-dialog-form">
        <h2 id="room-dialog-title">
          ¿Estás seguro de que quieres cambiar el estado de la estancia?
        </h2>
        <p>
          {room.name}: <strong>{statusLabels[room.status]}</strong>
        </p>
        <input name="roomId" type="hidden" value={room.id} />
        {!isAdmin ? (
          <>
            <input name="newStatus" type="hidden" value="limpieza" />
            <p>La habitación pasará a estado “En limpieza”.</p>
          </>
        ) : (
          <>
            <label htmlFor="room-new-status">Nuevo estado</label>
            <select
              defaultValue={room.status}
              id="room-new-status"
              name="newStatus"
              required
            >
              {(["disponible", "ocupada", "limpieza"] as RoomStatus[])
                .filter(
                  (status) =>
                    (room.status === "disponible" && status === "ocupada") ||
                    (room.status === "ocupada" && status === "limpieza") ||
                    (room.status === "limpieza" && status === "disponible"),
                )
                .map((status) => (
                  <option key={status} value={status}>
                    {statusLabels[status]}
                  </option>
                ))}
            </select>
            <label htmlFor="room-correction-reason">Motivo de la corrección</label>
            <textarea
              id="room-correction-reason"
              maxLength={500}
              name="reason"
              required
              rows={3}
            />
          </>
        )}
        {state.error && (
          <p className="message message-error" role="alert">
            {state.error}
          </p>
        )}
        <div className="room-dialog-actions">
          <button
            autoFocus
            className="button button-secondary"
            disabled={pending}
            onClick={onClose}
            type="button"
          >
            Cancelar
          </button>
          <button className="button button-primary" disabled={pending} type="submit">
            {pending
              ? "Guardando…"
              : isAdmin
                ? "Confirmar corrección"
                : "Sí, cambiar a limpieza"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
