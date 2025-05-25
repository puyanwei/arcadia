import { GameRoomState, RematchStatus } from '@/hooks/useGameRoom';

export type Board = (string | null)[];

export type GameState = {
  board: Board;
  playerNumber: 'player1' | 'player2' | null;
  isMyTurn: boolean;
  playersInRoom: number;
  gameStarted: boolean;
  gameFinished: boolean;
  gameStatus: string;
  rematchStatus: RematchStatus;
};

export type GameActions = {
  makeMove: (index: number, roomId: string) => void;
  joinRoom: (roomId: string) => void;
  playAgain: (roomId: string) => void;
};

export type UseTicTacToeReturnType = GameState & GameActions & GameRoomState & { 
  isConnected: boolean;
  connectionError: string | null;
}; 