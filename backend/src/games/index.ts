import { Server, Socket } from 'socket.io';
import { 
  handleJoinRoom as ticTacToeJoinRoom,
  handleMakeMove as ticTacToeMakeMove,
  handlePlayAgain as ticTacToePlayAgain,
  handleRematch as ticTacToeRematch,
  handleDisconnect as ticTacToeDisconnect
} from './tictactoe/handlers';
import {
  createInitialState as ticTacToeCreateInitialState,
  checkWinner as ticTacToeCheckWinner,
  getPlayerNumber as ticTacToeGetPlayerNumber
} from './tictactoe/state';
import { Board, RematchState, PlayerNumber } from './tictactoe/types';
import { connectFourHandler } from './connect-four/handlers';

export interface GameRoom {
  id: string;
  players: string[];
  board: Board;
}

export interface GameState<T = PlayerNumber> {
  rooms: Map<string, GameRoom>;
  playerNumbers: Map<string, T>;
}

export interface GameHandler<T = PlayerNumber> {
  createInitialState(): GameState<T>;
  handleJoinRoom(gameState: GameState<T>, roomId: string, playerId: string): GameState<T>;
  handleMakeMove(gameState: GameState<T>, roomId: string, playerId: string, move: { board: Board }): GameState<T>;
  handlePlayAgain(gameState: GameState<T>, roomId: string, playerId: string): GameState<T>;
  checkWinner(board: Board): string | null;
  getPlayerNumber(gameState: GameState<T>, playerId: string): T | null;
  handleRematch(
    gameState: GameState<T>, 
    roomId: string, 
    playerId: string, 
    currentRematchState: RematchState | undefined, 
    socket: Socket, 
    io: Server
  ): { newGameState: GameState<T>; newRematchState?: RematchState };
  handleDisconnect(gameState: GameState<T>, roomId: string, playerId: string): GameState<T>;
}

export const gameHandlers: Record<string, GameHandler<any>> = {
  tictactoe: {
    createInitialState: ticTacToeCreateInitialState,
    handleJoinRoom: ticTacToeJoinRoom,
    handleMakeMove: ticTacToeMakeMove,
    handlePlayAgain: ticTacToePlayAgain,
    checkWinner: ticTacToeCheckWinner,
    getPlayerNumber: ticTacToeGetPlayerNumber,
    handleRematch: ticTacToeRematch,
    handleDisconnect: ticTacToeDisconnect
  },
  'connect-four': connectFourHandler
};

export type GameType = keyof typeof gameHandlers; 