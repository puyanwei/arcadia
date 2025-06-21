import { useEffect, useState, useCallback } from 'react';
import { useSocket } from './useSocket';
import { Prettify } from '@/types/game';

export type RematchStatus = 'waiting' | 'pending' | 'accepted' | 'rejected' | null;
export type PlayerNumber = 'player1' | 'player2';

export type GameRoomState = {
  roomId: string;
  playersInRoom: number;
  gameStatus: string;
  rematchStatus: RematchStatus;
  requestedBy?: string;
  gameStarted: boolean;
};

// Handler function types
export type PlayerJoinedEventHandler = (playerCount: number) => void;
export type RoomFullEventHandler = () => void;
export type PlayerLeftEventHandler = (message: string) => void;
export type RematchStateEventHandler = (payload: { status: RematchStatus; message: string; requestedBy?: string }) => void;
export type GameStartEventHandler = () => void;
export type PlayerNumberEventData = { currentPlayer: PlayerNumber; otherPlayer: PlayerNumber | null };
export type PlayerNumberEventHandler = (data: PlayerNumberEventData) => void;

// Event map
export type GameRoomEventHandlerMap = {
  playerJoined: PlayerJoinedEventHandler;
  roomFull: RoomFullEventHandler;
  playerLeft: PlayerLeftEventHandler;
  rematchState: RematchStateEventHandler;
  gameStart: GameStartEventHandler;
  updateBoard: (newBoard: any) => void;
  gameEnd: (data: { gameResult: 'draw' | PlayerNumber; message: string }) => void;
  playerNumber: PlayerNumberEventHandler;
};

// Event name union
export type GameRoomEventName = Prettify<keyof GameRoomEventHandlerMap>
// Type safe way of making sure GameRoomEventHandlerMap keys match with the values
type GameRoomEventHandlerTuple = {
  [K in GameRoomEventName]: [K, GameRoomEventHandlerMap[K]]
}[GameRoomEventName];

export function useGameRoom(gameType: string) {
  const { socket, on, off } = useSocket();
  const [roomState, setRoomState] = useState<GameRoomState>({
    roomId: '',
    playersInRoom: 0,
    gameStatus: 'Enter a room ID to start',
    rematchStatus: null,
    gameStarted: false,
  });

  // --- Event Handlers ---
  const handlePlayerJoined: PlayerJoinedEventHandler = useCallback((playerCount) => {
    setRoomState(prev => ({
      ...prev,
      playersInRoom: playerCount,
      gameStatus: `Players in room: ${playerCount}/2 ${playerCount === 1 ? '- Waiting for opponent...' : ''}`,
    }));
  }, []);

  const handleRoomFull: RoomFullEventHandler = useCallback(() => {
    setRoomState(prev => ({
      ...prev,
      gameStatus: 'Room is full! Try another room ID',
    }));
  }, []);

  const handlePlayerLeft: PlayerLeftEventHandler = useCallback((message) => {
    setRoomState(prev => ({ ...prev, gameStatus: message, gameStarted: false, playersInRoom: Math.max(0, prev.playersInRoom - 1) }));
  }, []);

  const handleRematchState: RematchStateEventHandler = useCallback(({ status, message, requestedBy }) => {
    setRoomState(prev => ({ ...prev, rematchStatus: status, gameStatus: message, requestedBy }));
  }, []);

  const handleGameStart: GameStartEventHandler = useCallback(() => {
    setRoomState(prev => ({ ...prev, gameStarted: true, rematchStatus: null }));
  }, []);

  const handlePlayerNumber: PlayerNumberEventHandler = useCallback((data) => {
    // Implementation needed
  }, []);

  // --- Array of event-handler pairs ---
  const eventHandlers: GameRoomEventHandlerTuple[] = [
    ['playerJoined', handlePlayerJoined],
    ['roomFull', handleRoomFull],
    ['playerLeft', handlePlayerLeft],
    ['rematchState', handleRematchState],
    ['gameStart', handleGameStart],
    ['playerNumber', handlePlayerNumber],
  ];

  useEffect(() => {
    eventHandlers.forEach(([event, handler]) => on(event, handler));
    return () => {
      eventHandlers.forEach(([event, handler]) => off(event, handler));
    };
  }, [on, off, eventHandlers]);

  const joinRoom = useCallback((roomId: string) => {
    setRoomState(prev => ({ ...prev, roomId, gameStatus: `Joining room: ${roomId}...` }));
    socket?.emit('joinRoom', { gameType, roomId });
  }, [socket, gameType]);

  const rematch = useCallback((roomId: string) => {
    socket?.emit('rematch', { gameType, roomId });
  }, [socket, gameType]);

  return {
    roomState,
    joinRoom,
    rematch,
  };
} 