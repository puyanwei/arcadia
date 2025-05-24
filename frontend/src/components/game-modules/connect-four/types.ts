import { Board } from '@/types/game';

export type GameState = {
  board: Board;
  playerSymbol: string | null;
  isMyTurn: boolean;
  gameStarted: boolean;
  gameFinished: boolean;
  gameStatus: string;
  playersInRoom: number;
  rematchStatus: RematchStatus;
};

export type GameActions = {
  makeMove: (index: number, roomId: string) => void;
  joinRoom: (roomId: string) => void;
  playAgain: (roomId: string) => void;
};

export type RematchStatus = "pending" | "accepted" | "rejected" | null; 

export type ConnectFourCell = 'yellow' | 'red' | 'invalid' | 'valid';
