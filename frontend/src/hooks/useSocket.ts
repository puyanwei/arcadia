import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameRoomEventHandlerMap, GameRoomEventName } from './useGameRoom';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
    const socket = io(url);
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket] Connected with id:', socket.id, 'to', url);
      setIsConnected(true);
      setConnectionError(null);
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error);
      setConnectionError(error.message);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const socket = socketRef.current;

  function on<K extends GameRoomEventName>(event: K, handler: GameRoomEventHandlerMap[K]) {
    console.log('[Socket] Registering handler for event:', event);
    socket?.on(event as string, handler as (...args: any[]) => void);
  }

  function off<K extends GameRoomEventName>(event: K, handler: GameRoomEventHandlerMap[K]) {
    console.log('[Socket] Removing handler for event:', event);
    socket?.off(event as string, handler as (...args: any[]) => void);
  }

  return {
    socket,
    on,
    off,
    isConnected,
    connectionError,
  };
} 