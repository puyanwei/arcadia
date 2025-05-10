export type Board = (string | null)[];

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