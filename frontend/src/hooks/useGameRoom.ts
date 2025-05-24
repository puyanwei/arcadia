import { useEffect, useState, useCallback } from 'react';
import { useSocket } from './useSocket';

export type RematchStatus = 'pending' | 'accepted' | 'rejected' | null;

export type GameRoomState = {
  roomId: string;
  playersInRoom: number;
  gameStatus: string;
  rematchStatus: RematchStatus;
  gameStarted: boolean;
};

// Handler function types
export type PlayerJoinedEventHandler = (playerCount: number) => void;
export type RoomFullEventHandler = () => void;
export type PlayerLeftEventHandler = (message: string) => void;
export type RematchStateEventHandler = (payload: { status: RematchStatus; message: string }) => void;
export type GameStartEventHandler = () => void;
export type PlayerNumberEventHandler = (number: 'player1' | 'player2') => void;

// Event map
export type GameRoomEventHandlerMap = {
  playerJoined: PlayerJoinedEventHandler;
  roomFull: RoomFullEventHandler;
  playerLeft: PlayerLeftEventHandler;
  rematchState: RematchStateEventHandler;
  gameStart: GameStartEventHandler;
  updateBoard: (newBoard: any) => void;
  playerSymbol: (symbol: "X" | "O" | "yellow" | "red") => void;
  gameEnd: (data: { winner: string; message: string }) => void;
  playerNumber: PlayerNumberEventHandler;
};

// Event name union
export type GameRoomEventName = keyof GameRoomEventHandlerMap;

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

  const handleRematchState: RematchStateEventHandler = useCallback(({ status, message }) => {
    setRoomState(prev => ({ ...prev, rematchStatus: status, gameStatus: message }));
  }, []);

  const handleGameStart: GameStartEventHandler = useCallback(() => {
    setRoomState(prev => ({ ...prev, gameStarted: true, rematchStatus: null }));
  }, []);

  const handlePlayerNumber: PlayerNumberEventHandler = useCallback((number) => {
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

  const playAgain = useCallback((roomId: string) => {
    setRoomState(prev => ({ ...prev, rematchStatus: 'pending', gameStatus: 'Requesting rematch...' }));
    socket?.emit('playAgain', { gameType, roomId });
  }, [socket, gameType]);

  return {
    roomState,
    joinRoom,
    playAgain,
  };
} 