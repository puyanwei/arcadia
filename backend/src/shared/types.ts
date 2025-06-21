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
  status: RematchStatus;
}; 

export type GameRoom = {
  id: string;
  players: string[]; // This will store clientIds
  board: Board | ConnectFourBoard;
  firstPlayer?: string;
  currentPlayer?: string;
  rematchState?: RematchState;
};

export type GameRooms = {
  rooms: Record<string, GameRoom>;
  playerNumbers: Record<string, PlayerNumber>;
};

export type GameResult<T extends string = string> = (T & {}) | "draw";
export type Cell = (string | null)

export type ClientData = { 
  gameType: GameType, 
  roomId: string, 
  clientId: string,
  move?: {
    index: number
  },
  board?: ConnectFourBoard,
  playerNumber?: PlayerNumber
};

export type SocketHandlerParams = {
  data?: ClientData;
  gameStates: Record<GameType, GameRooms>;
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




