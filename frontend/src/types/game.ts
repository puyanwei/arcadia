export type PlayerSymbol = "X" | "O" | null;
export type Cell = (string | null)
export type Board = Cell[]

export type RematchStatus = "waiting" | "pending" | null;

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

export type GameType = 'tictactoe' | 'connect-four';

export type Grid = {
  columns: number;
  rows: number;
}; 