import { GameRoomState, RematchStatus } from '@/hooks/useGameRoom';
import { Prettify } from '@/types/game';

export type PlayerNumber = 'player1' | 'player2';

export type Board = (PlayerNumber | null)[];

export type GameState = {
  board: Board;
  playerNumber: PlayerNumber | null;
  isMyTurn: boolean;
  playersInRoom: number;
  gameStarted: boolean;
  gameFinished: boolean;
  gameStatus: string;
  rematchStatus: RematchStatus;
};

export type GameActions = {
  makeMove: (index: number, roomId: string) => void;
  joinRoom: (roomId: string) => void;
  playAgain: (roomId: string) => void;
};

export type UseTicTacToeReturnType = GameState & GameActions & GameRoomState & { 
  isConnected: boolean;
  connectionError: string | null;
  roomId: string;
};
export type GameEndStatus = Prettify<'draw' | PlayerNumber>;
export type GameEndEventData = { gameResult: GameEndStatus; message: string }; 
export type RematchStatusEventData = { status: RematchStatus; message: string };