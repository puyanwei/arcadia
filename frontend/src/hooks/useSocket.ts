import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameRoomEventHandlerMap, GameRoomEventName } from './useGameRoom';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');
    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, []);

  const socket = socketRef.current;

  function on<K extends GameRoomEventName>(event: K, handler: GameRoomEventHandlerMap[K]) {
    socket?.on(event as string, handler as (...args: any[]) => void);
  }

  function off<K extends GameRoomEventName>(event: K, handler: GameRoomEventHandlerMap[K]) {
    socket?.off(event as string, handler as (...args: any[]) => void);
  }

  return {
    socket,
    on,
    off,
  };
} 