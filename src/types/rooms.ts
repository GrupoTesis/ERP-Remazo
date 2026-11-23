export type RoomStatus = "disponible" | "ocupada" | "limpieza";

export type Room = {
  id: string;
  room_number: number;
  name: string;
  active: boolean;
  status: RoomStatus;
};

export type RoomRate = {
  id: string;
  room_id: string;
  duration_minutes: number;
  price: number;
  valid_from: string;
  valid_to: string | null;
};

export type RoomConfiguration = Room & {
  rates: RoomRate[];
};

export type RoomActionState = {
  error?: string;
  message?: string;
  success?: boolean;
};
