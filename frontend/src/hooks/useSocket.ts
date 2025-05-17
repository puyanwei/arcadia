import { useEffect, useState } from 'react';
import socket from '../utils/socket';

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    if (!socket) return; // Guard against server-side rendering

    function onConnect() {
      setIsConnected(true);
      setConnectionError(null);
      console.log('Connected to server');
    }

    function onDisconnect() {
      setIsConnected(false);
      console.log('Disconnected from server');
    }

    function onError(error: Error) {
      setConnectionError(error.message);
      console.error('Socket error:', error);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('error', onError);
    socket.on('connect_error', onError);

    // Connect when component mounts
    socket.connect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('error', onError);
      socket.off('connect_error', onError);
      socket.disconnect();
    };
  }, []);

  return { isConnected, connectionError, socket };
} 