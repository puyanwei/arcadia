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
  const connectionAttemptRef = useRef<boolean>(false);

  useEffect(() => {
    if (connectionAttemptRef.current) return;
    connectionAttemptRef.current = true;

    // Get or create a client ID that persists across tabs
    const getClientId = () => {
      const storedId = localStorage.getItem("arcadia_client_id");
      if (storedId) return storedId;

      const newId = `client_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("arcadia_client_id", newId);
      return newId;
    };

    // Dynamically import socket.io-client only on the client
    import("socket.io-client").then(({ io }) => {
      const url = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

      // Only create a new socket if one doesn't exist
      if (!socketRef.current) {
        socketRef.current = io(url, {
          reconnectionAttempts: 3,
          reconnectionDelay: 1000,
          timeout: 5000,
          auth: {
            clientId: getClientId(),
          },
        });

        socketRef.current.on("connect", () => {
          setIsConnected(true);
          setConnectionError(null);
        });

        socketRef.current.on("disconnect", () => setIsConnected(false));

        socketRef.current.on("connect_error", (error) =>
          setConnectionError(error.message)
        );
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        connectionAttemptRef.current = false;
      }
    };
  }, []);

  function on<K extends GameRoomEventName>(
    event: K,
    handler: GameRoomEventHandlerMap[K]
  ) {
    socketRef.current?.on(event as string, handler as (...args: any[]) => void);
  }

  function off<K extends GameRoomEventName>(
    event: K,
    handler: GameRoomEventHandlerMap[K]
  ) {
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
