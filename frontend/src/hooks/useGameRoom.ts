import { useState, useCallback, useEffect } from 'react';
import { useSocket } from './useSocket';

export function useGameRoom(gameType: 'tictactoe' | 'connect-four') {
  const { socket, clientId } = useSocket();
  const [roomState, setRoomState] = useState({
    roomId: '',
    gameStatus: 'Enter a room ID to start',
    rematchStatus: null,
  });

  const joinRoom = useCallback((roomId: string) => {
    if (socket && clientId && roomId) {
      console.log(`[useGameRoom] Joining room ${roomId} with clientId ${clientId}`);
      socket.emit('joinRoom', {
        gameType,
        roomId,
        clientId,
      });
      setRoomState(prev => ({ ...prev, roomId }));
    }
  }, [socket, clientId, gameType]);

  const rematch = useCallback(() => {
    if (socket && clientId && roomState.roomId) {
      socket.emit('rematch', {
        gameType,
        roomId: roomState.roomId,
        clientId,
      });
    }
  }, [socket, clientId, roomState.roomId, gameType]);

  useEffect(() => {
    const handleError = (message: string) => {
      setRoomState(prev => ({ ...prev, gameStatus: message }));
    };

    socket?.on('error', handleError);

    return () => {
      socket?.off('error', handleError);
    };
  }, [socket]);

  return { roomId: roomState.roomId, gameStatus: roomState.gameStatus, rematchStatus: roomState.rematchStatus, joinRoom, rematch };
} 