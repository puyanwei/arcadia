import { Server, Socket } from 'socket.io';

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type PlayerNumber = "player1" | "player2";
export type GameType = "tictactoe" | "connect-four";

export type Board = (PlayerNumber | null)[];

export type OverallGameState = Record<GameType, GameRooms>

export type RematchStatus = 'waiting' | 'pending' | 'accepted' | 'rejected' | null;
export type RematchState = {
  requested: boolean;
  requestedBy: string;
  status: 'pending' | 'accepted';
}; 

export type GameRoom = {
  id: string;
  players: string[]; // CIDs
  board: Board | string[];
  firstPlayer?: string;
  currentPlayer?: string;
  rematchState?: RematchState;
  status?: RoomStatus;
};

export type GameRooms = {
  rooms: Record<string, GameRoom>;
  playerNumbers: Record<string, PlayerNumber>;
  playerStatuses: Record<string, PlayerStatus>;
};

export type GameResult<T extends string = string> = (T & {}) | "draw";
export type Cell = (string | null)

export type ClientData<T = any> = { 
  gameType: GameType, 
  roomId: string, 
  clientId: string,
  move?: T,
  playerNumber?: PlayerNumber
};

export type SocketHandlerParams<T = any> = {
  data?: ClientData<T>;
  gameStates: Record<GameType, GameRooms>;
  socket: Socket;
  io: Server;
  clientSocketMap: Record<string, string>;
};

export type HandleMoveParams<T> = {
  gameRooms: GameRooms;
  roomId: string;
  move: T;
  socket: Socket;
  io: Server;
  clientSocketMap: Record<string, string>;
};

// Connect Four
export type ConnectFourCell = Prettify<PlayerNumber | 'invalid' | 'valid'>
export type ConnectFourBoard = ('player1' | 'player2' | 'valid' | 'invalid')[];

// Tic Tac Toe
export type TicTacToeCell = Prettify<PlayerNumber | 'invalid' | 'valid'>
export type TicTacToeBoard = TicTacToeCell[];

export type RoomStatus = 'waiting' | 'playing' | 'gameOver' | 'rematchPending';

export type PlayerStatus = 'waiting' | 'playing' | 'gameOver' | 'rematchPending' | 'rematchWaiting';




