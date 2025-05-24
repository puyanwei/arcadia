import { Server, Socket } from 'socket.io';
import {
  checkWinnerTTT,
  createInitialStateTTT,
} from './tictactoe/state';
import { createInitialStateCF } from './connect-four/handlers';
import { handleJoinRoomTTT, handleMakeMoveTTT, handlePlayAgainTTT, handleRematchTTT, handleDisconnectTTT, emitGameStateTTT } from './tictactoe/handlers';
import { Board } from './types';
import { PlayerNumber } from './types';
import { handleJoinRoomCF, handleMakeMoveCF, handlePlayAgainCF, handleRematchCF, handleDisconnectCF } from './connect-four/handlers';
import { checkWinnerCF } from './connect-four/state';
import { Prettify } from '../utils/types';

export type GameRoom = {
  id: string;
  players: string[];
  board: Board;
}

export type GameState<T = PlayerNumber> = {
  rooms: Map<string, GameRoom>;
  playerNumbers: Map<string, T>;
}

export type GameHandler = typeof gameHandlers[keyof typeof gameHandlers];

export type GameType = keyof typeof gameHandlers;

export const gameHandlers = {
  tictactoe: {
    createInitialState: createInitialStateTTT,
    handleJoinRoom: handleJoinRoomTTT,
    handleMakeMove: handleMakeMoveTTT,
    handlePlayAgain: handlePlayAgainTTT,
    checkWinner: checkWinnerTTT,
    handleRematch: handleRematchTTT,
    handleDisconnect: handleDisconnectTTT,
    emitGameState: emitGameStateTTT
  },
  'connect-four': {
    createInitialState: createInitialStateCF,
    handleJoinRoom: handleJoinRoomCF,
    handleMakeMove: handleMakeMoveCF,
    handlePlayAgain: handlePlayAgainCF,
    checkWinner: checkWinnerCF,
    handleRematch: handleRematchCF,
    handleDisconnect: handleDisconnectCF
  }
} as const;

export function getPlayerNumber(gameState: GameState, playerId: string): PlayerNumber | null {
  return gameState.playerNumbers.get(playerId) || null;
};
