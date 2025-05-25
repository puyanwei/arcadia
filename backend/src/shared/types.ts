import { Server, Socket } from 'socket.io';

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type PlayerNumber = "player1" | "player2";
export type GameType = "tictactoe" | "connect-four";

export type Board = (PlayerNumber | null)[];

export type OverallGameState = Record<GameType, GameRooms>

export type RematchStatus = "waiting" | "pending" | null;
export type RematchState = {
  requested: boolean;
  requestedBy: string;
  status: "waiting" | "pending" | "accepted" | "rejected";
}; 

export type GameRoom = {
  id: string;
  players: string[];
  board: Board | ConnectFourBoard | TicTacToeBoard;
  rematchState?: RematchState;
};

export type GameRooms = {
  rooms: Record<string, GameRoom>;
  playerNumbers: Record<string, PlayerNumber>;
};

export type GameResult = {
  type: 'win' | 'draw';
  winner?: PlayerNumber;
  message: string;
}
export type Cell = (string | null)

export type ClientData = { gameType: GameType, roomId: string, playerNumber: PlayerNumber, board?: any };

export type SocketHandlerParams = {
  socket: Socket;
  io: Server;
  gameStates: Record<string, GameRooms>;
  emitGameState?: Function;
  data?: ClientData;
};

// Connect Four
export type ConnectFourCell = Prettify<PlayerNumber | 'invalid' | 'valid'>
export type ConnectFourBoard = ConnectFourCell[];

// Tic Tac Toe
export type TicTacToeCell = Prettify<PlayerNumber | 'invalid' | 'valid'>
export type TicTacToeBoard = TicTacToeCell[];




