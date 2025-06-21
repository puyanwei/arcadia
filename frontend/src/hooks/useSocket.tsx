"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
  useCallback,
} from "react";
import type { Socket } from "socket.io-client";

// Context type
export type SocketContextType = {
  socket: Socket | null;
  clientId: string | null;
  on: (event: string, handler: (...args: any[]) => void) => void;
  off: (event: string, handler: (...args: any[]) => void) => void;
  isConnected: boolean;
  connectionError: string | null;
};

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const socketRef = useRef<Socket | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const connectionAttemptedRef = useRef<boolean>(false);

  useEffect(() => {
    if (connectionAttemptedRef.current) return;
    connectionAttemptedRef.current = true;

    // Get or create a client ID that persists for the session
    const getClientId = () => {
      let id = sessionStorage.getItem("arcadia_client_id");
      if (!id) {
        // A simple unique ID generator for the session
        id = `client_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem("arcadia_client_id", id);
      }
      setClientId(id); // Set the clientId in state
      return id;
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
            clientId: getClientId(), // Use the session-specific clientId
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
        connectionAttemptedRef.current = false;
      }
    };
  }, []);

  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    socketRef.current?.on(event, handler);
  }, []);

  const off = useCallback(
    (event: string, handler: (...args: any[]) => void) => {
      socketRef.current?.off(event, handler);
    },
    []
  );

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        clientId,
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
