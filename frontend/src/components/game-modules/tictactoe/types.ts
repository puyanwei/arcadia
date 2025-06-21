import { Prettify, RematchStatus } from '@/types/game';

export type PlayerNumber = 'player1' | 'player2';
export type GameResult<T extends string = string> = (T & {}) | "draw";

export type Board = (PlayerNumber | null)[];

export type GameState = {
  board: Board;
  playerNumber: PlayerNumber | null;
  isMyTurn: boolean;
  playersInRoom: number;
  gameStarted: boolean;
  gameFinished: boolean;
  gameStatus: string;
  rematchStatus: RematchStatus;
  roomId: string;
};

export type GameActions = {
  makeMove: (index: number, roomId: string) => void;
  joinRoom: (roomId: string) => void;
  rematch: (roomId: string) => void;
};

export type GameRoomState = {
  roomId: string;
  gameStatus: string;
  rematchStatus: RematchStatus;
};

export type UseTicTacToeReturnType = GameState & GameActions & GameRoomState & { 
  isConnected: boolean;
  connectionError: string | null;
};
export type GameEndEventData = { gameResult: GameResult; message: string }; 
export type RematchStatusEventData = { status: RematchStatus; message: string };