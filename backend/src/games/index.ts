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

export interface GameState {
  rooms: Map<string, GameRoom>;
  playerSymbols: Map<string, PlayerSymbol>;
}

export interface GameRoom {
  id: string;
  players: string[];
  board: Board;
}

export interface GameHandler {
  createInitialState(): GameState;
  handleJoinRoom(gameState: GameState, roomId: string, playerId: string): GameState;
  handleMakeMove(gameState: GameState, roomId: string, playerId: string, move: { board: Board }): GameState;
  handlePlayAgain(gameState: GameState, roomId: string, playerId: string): GameState;
  checkWinner(board: Board): string | null;
  getPlayerSymbol(gameState: GameState, playerId: string): PlayerSymbol | null;
  handleRematch(
    gameState: GameState, 
    roomId: string, 
    playerId: string, 
    currentRematchState: RematchState | undefined, 
    socket: Socket, 
    io: Server
  ): { newGameState: GameState; newRematchState?: RematchState };
  handleDisconnect(gameState: GameState, roomId: string, playerId: string): GameState;
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