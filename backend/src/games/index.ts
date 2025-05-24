import { Server, Socket } from 'socket.io';
import { 
  handleJoinRoom,
  handleMakeMove,
  handlePlayAgain,
  handleRematch,
  handleDisconnect
} from './tictactoe/handlers';
import {
  createInitialState,
  checkWinner,
  getPlayerSymbol
} from './tictactoe/state';
import { Board, RematchState, PlayerSymbol } from './tictactoe/types';

export interface GameState<T = PlayerSymbol> {
  rooms: Map<string, GameRoom>;
  playerSymbols: Map<string, T>;
}

export interface GameRoom {
  id: string;
  players: string[];
  board: Board;
}

export interface GameHandler<T = PlayerSymbol> {
  createInitialState(): GameState<T>;
  handleJoinRoom(gameState: GameState<T>, roomId: string, playerId: string): GameState<T>;
  handleMakeMove(gameState: GameState<T>, roomId: string, playerId: string, move: { board: Board }): GameState<T>;
  handlePlayAgain(gameState: GameState<T>, roomId: string, playerId: string): GameState<T>;
  checkWinner(board: Board): string | null;
  getPlayerSymbol(gameState: GameState<T>, playerId: string): T | null;
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

export const gameHandlers: Record<string, GameHandler> = {
  tictactoe: {
    createInitialState,
    handleJoinRoom,
    handleMakeMove,
    handlePlayAgain,
    checkWinner,
    getPlayerSymbol,
    handleRematch,
    handleDisconnect
  },
  // Add more games here as you create them
};

export type GameType = keyof typeof gameHandlers; 