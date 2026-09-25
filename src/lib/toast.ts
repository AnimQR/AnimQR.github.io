"use client";

import { create } from "zustand";

export type ToastKind = "success" | "error" | "info";
export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

let nextId = 1;

export const useToasts = create<{ toasts: Toast[]; dismiss(id: number): void }>((set) => ({
  toasts: [],
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Show a short notification. Errors stay a little longer. */
export function toast(message: string, kind: ToastKind = "success") {
  const id = nextId++;
  useToasts.setState((s) => ({ toasts: [...s.toasts.slice(-2), { id, kind, message }] }));
  setTimeout(() => useToasts.getState().dismiss(id), kind === "error" ? 6000 : 3000);
}
