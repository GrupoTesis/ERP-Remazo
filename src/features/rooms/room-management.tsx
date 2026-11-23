"use client";

import { useActionState } from "react";
import {
  setRoomActiveAction,
  setRoomRateAction,
  updateRoomDetailsAction,
} from "@/features/rooms/actions";
import type { RoomActionState, RoomConfiguration, RoomRate } from "@/types/rooms";

const initialState: RoomActionState = {};
const durationOptions = Array.from({ length: 48 }, (_, index) => (index + 1) * 30);

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) return `${hours} h`;
  if (hours === 0) return `${remainingMinutes} min`;
  return `${hours} h ${remainingMinutes} min`;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(price);
}

export function RoomManagement({
  rooms,
}: {
  rooms: RoomConfiguration[];
}) {
  return (
    <section aria-labelledby="room-management-title" className="room-management">
      <header className="panel room-management-intro">
        <p className="eyebrow">Configuración</p>
        <h2 id="room-management-title">Habitaciones y tarifas</h2>
        <p>
          Administra las seis habitaciones y configura el precio de cada duración
          disponible en intervalos de 30 minutos. Las tarifas anteriores se conservan
          como historial.
        </p>
      </header>
      <div className="room-settings-list">
        {rooms.map((room) => (
          <RoomSettingsCard key={room.id} room={room} />
        ))}
      </div>
    </section>
  );
}

function RoomSettingsCard({ room }: { room: RoomConfiguration }) {
  const [detailsState, detailsAction, savingDetails] = useActionState(
    updateRoomDetailsAction,
    initialState,
  );
  const [rateState, rateAction, savingRate] = useActionState(
    setRoomRateAction,
    initialState,
  );
  const [activeState, activeAction, changingActive] = useActionState(
    setRoomActiveAction,
    initialState,
  );

  return (
    <article className="panel room-settings-card">
      <div className="room-settings-heading">
        <div>
          <h3>{room.name}</h3>
          <p className="muted">
            Habitación {room.room_number} · {room.active ? "Activa" : "Desactivada"}
          </p>
        </div>
        <form action={activeAction}>
          <input name="roomId" type="hidden" value={room.id} />
          <input name="active" type="hidden" value={String(!room.active)} />
          <button
            className="button button-secondary"
            disabled={changingActive || (!room.active && room.status !== "disponible")}
            type="submit"
          >
            {changingActive
              ? "Guardando…"
              : room.active
                ? "Desactivar"
                : "Reactivar"}
          </button>
        </form>
      </div>
      {activeState.error && (
        <p className="message message-error" role="alert">
          {activeState.error}
        </p>
      )}
      {activeState.message && (
        <p className="message message-success" role="status">
          {activeState.message}
        </p>
      )}

      <form action={detailsAction} className="room-edit-form">
        <input name="roomId" type="hidden" value={room.id} />
        <label>
          Número
          <input
            defaultValue={room.room_number}
            max={6}
            min={1}
            name="roomNumber"
            required
            type="number"
          />
        </label>
        <label>
          Nombre
          <input
            defaultValue={room.name}
            maxLength={80}
            name="name"
            required
            type="text"
          />
        </label>
        <button className="button button-primary" disabled={savingDetails} type="submit">
          {savingDetails ? "Guardando…" : "Guardar habitación"}
        </button>
      </form>
      {detailsState.error && (
        <p className="message message-error" role="alert">
          {detailsState.error}
        </p>
      )}
      {detailsState.message && (
        <p className="message message-success" role="status">
          {detailsState.message}
        </p>
      )}

      <section aria-label={`Tarifas de ${room.name}`} className="room-rates">
        <h4>Tarifas vigentes</h4>
        {room.rates.length === 0 ? (
          <p className="muted">Aún no hay tarifas configuradas.</p>
        ) : (
          <ul className="room-rate-list">
            {room.rates.map((rate) => (
              <li key={rate.id}>
                <RateEditor
                  action={rateAction}
                  disabled={savingRate}
                  rate={rate}
                  roomId={room.id}
                />
              </li>
            ))}
          </ul>
        )}
        <form action={rateAction} className="room-rate-form">
          <input name="roomId" type="hidden" value={room.id} />
          <label>
            Duración
            <select defaultValue="30" name="durationMinutes" required>
              {durationOptions.map((minutes) => (
                <option key={minutes} value={minutes}>
                  {formatDuration(minutes)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Precio (S/)
            <input
              min="0"
              name="price"
              required
              step="0.01"
              type="number"
            />
          </label>
          <button className="button button-primary" disabled={savingRate} type="submit">
            {savingRate ? "Guardando…" : "Agregar tarifa"}
          </button>
        </form>
        {rateState.error && (
          <p className="message message-error" role="alert">
            {rateState.error}
          </p>
        )}
        {rateState.message && (
          <p className="message message-success" role="status">
            {rateState.message}
          </p>
        )}
      </section>
    </article>
  );
}

function RateEditor({
  action,
  disabled,
  rate,
  roomId,
}: {
  action: (formData: FormData) => void;
  disabled: boolean;
  rate: RoomRate;
  roomId: string;
}) {
  return (
    <form action={action} className="room-rate-row">
      <input name="roomId" type="hidden" value={roomId} />
      <input
        name="durationMinutes"
        type="hidden"
        value={rate.duration_minutes}
      />
      <span>{formatDuration(rate.duration_minutes)}</span>
      <label>
        <span className="visually-hidden">
          Precio para {formatDuration(rate.duration_minutes)} (S/)
        </span>
        <input
          defaultValue={rate.price}
          min="0"
          name="price"
          required
          step="0.01"
          type="number"
        />
      </label>
      <span className="room-rate-current">{formatPrice(rate.price)}</span>
      <button className="button button-secondary" disabled={disabled} type="submit">
        Actualizar
      </button>
    </form>
  );
}
