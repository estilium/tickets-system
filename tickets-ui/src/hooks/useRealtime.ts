import { useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { api } from "../api/api";

const rawBase =
  (api.defaults.baseURL ?? "http://localhost:3000").replace(/\/api\/?$/, "");
const BACKEND_BASE = rawBase.replace(/\/$/, "");

const socket: Socket = io(BACKEND_BASE, {
  transports: ["websocket"],
  autoConnect: true,
});

export function useSocketEvent<T = any>(
  event: string,
  handler: (payload: T) => void,
) {
  useEffect(() => {
    const listener = (payload: T) => handler(payload);
    socket.on(event, listener);
    return () => {
      socket.off(event, listener);
    };
  }, [event, handler]);
}

export function getAttachmentUrl(relative: string) {
  if (!relative) return "";
  const path = relative.startsWith("/") ? relative : `/${relative}`;
  return `${BACKEND_BASE}${path}`;
}
