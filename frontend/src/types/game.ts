export type PlayerSymbol = "X" | "O" | null;
export type Board = (PlayerSymbol)[];

export interface GameState {
  board: Board;
  playerSymbol: PlayerSymbol;
  isMyTurn: boolean;
  playersInRoom: number;
  gameStarted: boolean;
  gameStatus: string;
}

export interface GameActions {
  makeMove: (index: number, roomId: string) => void;
  joinRoom: (roomId: string) => void;
} 