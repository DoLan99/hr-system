"use client";

/**
 * Inspired by shadcn/ui toast (Sonner-style).
 * Lightweight reducer + listeners — không cần context. Components subscribe
 * qua hook, action dispatch qua hàm `toast()`.
 */
import * as React from "react";
import type { ToastVariant } from "@/components/ui/toast";

type ToastId = string;

export interface ToastData {
  id: ToastId;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  open: boolean;
}

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY_MS = 200; // animation thoát

type Action =
  | { type: "ADD"; toast: ToastData }
  | { type: "UPDATE"; toast: Partial<ToastData> & { id: ToastId } }
  | { type: "DISMISS"; id?: ToastId }
  | { type: "REMOVE"; id?: ToastId };

interface State {
  toasts: ToastData[];
}

let memoryState: State = { toasts: [] };
const listeners: Array<(state: State) => void> = [];

const removeTimeouts = new Map<ToastId, ReturnType<typeof setTimeout>>();

function scheduleRemove(id: ToastId) {
  if (removeTimeouts.has(id)) return;
  const timeout = setTimeout(() => {
    removeTimeouts.delete(id);
    dispatch({ type: "REMOVE", id });
  }, TOAST_REMOVE_DELAY_MS);
  removeTimeouts.set(id, timeout);
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ADD":
      return { toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT) };
    case "UPDATE":
      return {
        toasts: state.toasts.map((t) => (t.id === action.toast.id ? { ...t, ...action.toast } : t)),
      };
    case "DISMISS":
      if (action.id) scheduleRemove(action.id);
      else state.toasts.forEach((t) => scheduleRemove(t.id));
      return {
        toasts: state.toasts.map((t) =>
          action.id === undefined || t.id === action.id ? { ...t, open: false } : t,
        ),
      };
    case "REMOVE":
      return {
        toasts: action.id === undefined ? [] : state.toasts.filter((t) => t.id !== action.id),
      };
  }
}

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((l) => l(memoryState));
}

let counter = 0;
function genId(): ToastId {
  counter = (counter + 1) % Number.MAX_SAFE_INTEGER;
  return String(counter);
}

export interface ToastInput {
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

export function toast(input: ToastInput) {
  const id = genId();
  dispatch({
    type: "ADD",
    toast: {
      id,
      title: input.title,
      description: input.description,
      variant: input.variant ?? "default",
      duration: input.duration ?? 4000,
      open: true,
    },
  });
  return {
    id,
    dismiss: () => dispatch({ type: "DISMISS", id }),
    update: (next: Partial<ToastInput>) =>
      dispatch({ type: "UPDATE", toast: { id, ...next } }),
  };
}

export function useToast() {
  const [state, setState] = React.useState<State>(memoryState);
  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const idx = listeners.indexOf(setState);
      if (idx !== -1) listeners.splice(idx, 1);
    };
  }, []);
  return {
    ...state,
    toast,
    dismiss: (id?: ToastId) => dispatch({ type: "DISMISS", id }),
  };
}
