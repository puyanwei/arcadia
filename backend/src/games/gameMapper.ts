import { Server, Socket } from 'socket.io';
import { Board, ConnectFourCell, PlayerNumber } from './types';
import { 
  handleJoinRoomTTT, 
  handleMakeMoveTTT, 
  handlePlayAgainTTT, 
  handleRematchTTT, 
  handleDisconnectTTT,
} from './tictactoe/handlers';
import { 
  createInitialStateCF, 
  handleJoinRoomCF, 
  handleMakeMoveCF, 
  handlePlayAgainCF, 
  handleRematchCF, 
  handleDisconnectCF
} from './connect-four/handlers';
import { checkWinnerCF } from './connect-four/state';
import { checkWinnerTTT } from './tictactoe/state';
import { createInitialStateTTT } from './tictactoe/state';
import { getPlayerNumber } from './shared-handlers';

export type GameRoom = {
  id: string;
  players: string[];
  board: Board;
}

export type GameState<T = PlayerNumber> = {
  rooms: Map<string, GameRoom>;
  playerNumbers: Map<string, T>;
}

export type GameResult = {
  type: 'win' | 'draw';
  winner?: PlayerNumber;
  message: string;
}

export type GameHandler = {
  createInitialState: () => GameState;
  handleJoinRoom: (gameState: GameState, roomId: string, playerId: string) => GameState;
  handleMakeMove: (gameState: GameState, roomId: string, playerId: string, move: { board: Board }) => GameState;
  handlePlayAgain: (gameState: GameState, roomId: string, playerId: string) => GameState;
  handleRematch: (gameState: GameState, roomId: string, playerId: string, rematchState: any, socket: Socket, io: Server) => { newGameState: GameState, newRematchState: any };
  handleDisconnect: (gameState: GameState, roomId: string, playerId: string) => GameState;
  checkGameResult: (board: Board) => GameResult | null;
  getPlayerNumber: (gameState: GameState, playerId: string) => PlayerNumber | null;
}

const tictactoeHandler: GameHandler = {
  createInitialState: createInitialStateTTT,
  handleJoinRoom: handleJoinRoomTTT,
  handleMakeMove: handleMakeMoveTTT,
  handlePlayAgain: handlePlayAgainTTT,
  handleRematch: (gameState, roomId, playerId, rematchState, socket, io) => {
    const result = handleRematchTTT(gameState, roomId, playerId, rematchState, socket, io);
    return { newGameState: result.newGameState, newRematchState: result.newRematchState || null };
  },
  handleDisconnect: handleDisconnectTTT,
  checkGameResult: (board) => {
    const result = checkWinnerTTT(board as Board);
    if (!result) return null;
    return result === 'draw' 
      ? { type: 'draw', message: 'Game ended in a draw!' }
      : { type: 'win', winner: result as PlayerNumber, message: 'Game Over!' };
  },
  getPlayerNumber: getPlayerNumber
};

const connectFourHandler: GameHandler = {
  createInitialState: createInitialStateCF,
  handleJoinRoom: handleJoinRoomCF,
  handleMakeMove: handleMakeMoveCF,
  handlePlayAgain: handlePlayAgainCF,
  handleRematch: (gameState, roomId, playerId, rematchState, socket, io) => {
    const result = handleRematchCF(gameState, roomId, playerId, rematchState, socket, io);
    return { newGameState: result.newGameState, newRematchState: result.newRematchState || null };
  },
  handleDisconnect: handleDisconnectCF,
  checkGameResult: (board) => {
    const result = checkWinnerCF(board as ConnectFourCell[], 7, 6);
    if (!result) return null;
    return result === 'draw'
      ? { type: 'draw', message: 'Game ended in a draw!' }
      : { type: 'win', winner: result as PlayerNumber, message: 'Game Over!' };
  },
  getPlayerNumber: getPlayerNumber
};

export const gameHandlers = {
  tictactoe: tictactoeHandler,
  'connect-four': connectFourHandler
} as const;

export type GameType = keyof typeof gameHandlers;

