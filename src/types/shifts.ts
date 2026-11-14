import type { AppRole } from "@/types/auth";

export type Shift = {
  id: string;
  user_id: string;
  role: AppRole;
  opened_at: string;
  closed_at: string | null;
};

export type ShiftActionState = {
  active?: boolean;
  error?: string;
  message?: string;
};
