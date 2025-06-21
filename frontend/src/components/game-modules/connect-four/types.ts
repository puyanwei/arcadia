import { PlayerNumber, RematchStatus } from "@/types/game";

export type ConnectFourCell = PlayerNumber | 'valid' | 'invalid' | null;

export type GameState = {
  board: ConnectFourCell[];
  playerNumber: PlayerNumber | null;
  isMyTurn: boolean;
  playersInRoom: number;
  gameStarted: boolean;
  gameFinished: boolean;
  gameStatus: string;
  rematchStatus: RematchStatus | null;
  roomId: string;
};

export type GameActions = {
  makeMove: (index: number, roomId: string) => void;
  joinRoom: (roomId: string) => void;
  rematch: (roomId: string) => void;
};

// Event data types
export type BoardUpdateData = {
  board: ConnectFourCell[];
  currentPlayer?: string;
};

export type PlayerNumberData = {
  currentPlayer: PlayerNumber;
  otherPlayer: PlayerNumber | null;
};

export type GameStartData = {
  firstPlayer: string;
};

export type RematchStateData = {
  status: RematchStatus;
  message: string;
}; 
