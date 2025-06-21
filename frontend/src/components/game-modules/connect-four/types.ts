import { Board } from '@/types/game';

export type ConnectFourCell = 'player1' | 'player2' | 'invalid' | 'valid';

export type GameState = {
  board: ConnectFourCell[];
  playerNumber: 'player1' | 'player2' | null;
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
  rematch: (roomId: string) => void;
};

export type RematchStatus = "waiting" | "pending" | "accepted" | "rejected" | null; 
