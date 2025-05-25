"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import type { Socket } from "socket.io-client";
import { GameRoomEventHandlerMap, GameRoomEventName } from "./useGameRoom";

// Context type
export type SocketContextType = {
  socket: Socket | null;
  on: <K extends GameRoomEventName>(
    event: K,
    handler: GameRoomEventHandlerMap[K]
  ) => void;
  off: <K extends GameRoomEventName>(
    event: K,
    handler: GameRoomEventHandlerMap[K]
  ) => void;
  isConnected: boolean;
  connectionError: string | null;
};

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    // Dynamically import socket.io-client only on the client
    let socket: Socket | null = null;
    import("socket.io-client").then(({ io }) => {
      const url = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
      socket = io(url);
      socketRef.current = socket;

      socket.on("connect", () => {
        if (socket) {
          console.log("[Socket] Connected with id:", socket.id, "to", url);
        }
        setIsConnected(true);
        setConnectionError(null);
      });

      socket.on("disconnect", () => {
        console.log("[Socket] Disconnected");
        setIsConnected(false);
      });

      socket.on("connect_error", (error) => {
        console.error("[Socket] Connection error:", error);
        setConnectionError(error.message);
      });
    });

    return () => {
      socket?.disconnect();
    };
  }, []);

  function on<K extends GameRoomEventName>(
    event: K,
    handler: GameRoomEventHandlerMap[K]
  ) {
    console.log("[Socket] Registering handler for event:", event);
    socketRef.current?.on(event as string, handler as (...args: any[]) => void);
  }

  function off<K extends GameRoomEventName>(
    event: K,
    handler: GameRoomEventHandlerMap[K]
  ) {
    console.log("[Socket] Removing handler for event:", event);
    socketRef.current?.off(
      event as string,
      handler as (...args: any[]) => void
    );
  }

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        on,
        off,
        isConnected,
        connectionError,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket(): SocketContextType {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within a SocketProvider");
  return ctx;
}
