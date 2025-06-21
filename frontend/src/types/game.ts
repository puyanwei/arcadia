export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type PlayerNumber = 'player1' | 'player2' | null;
export type Cell = (string | null)
export type Board = Cell[]

export type Player = {
  id: string;
  playerNumber: PlayerNumber;
};

export type PlayerStatus = 
  | "waiting"
  | "playing"
  | "gameOver"
  | "rematchPending"
  | "rematchWaiting"
  | null;

export type RematchStatus = 'waiting' | 'pending' | 'accepted' | 'rejected' | null;

export type GameState = {
  board: Board;
  playerNumber: string | null;
  isMyTurn: boolean;
  gameStatus: string;
  playersInRoom: number;
  rematchStatus: RematchStatus;
};

export type GameActions = {
  makeMove: (index: number, roomId: string) => void;
  joinRoom: (roomId: string) => void;
  rematch: (roomId: string) => void;
};

export type GameType = 'tictactoe' | 'connect-four';

export type Grid = {
  columns: number;
  rows: number;
}; 