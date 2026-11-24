"use client";

import { type ReactNode, useSyncExternalStore } from "react";

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

/** Defers calendar defaults until the browser's local timezone is available. */
export function ClientDateContent({ children }: { children: ReactNode }) {
  const mounted = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  return mounted ? children : null;
}
