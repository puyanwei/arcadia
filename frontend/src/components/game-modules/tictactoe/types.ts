import { Prettify, RematchStatus } from '@/types/game';
import { GameState as GlobalGameState, PlayerNumber } from "@/types/game";
import { PlayerStatus as GlobalPlayerStatus } from "@/types/game";

export type Board = (PlayerNumber | null)[];

export type PlayerStatus = GlobalPlayerStatus;

export type GameState = Omit<
  GlobalGameState,
  "rematchStatus" | "makeMove" | "joinRoom" | "rematch"
> & {
  playerStatus: PlayerStatus;
  rematchStatus: RematchStatus | null;
  roomId: string;
};

export type GameResult<T extends string = string> = (T & {}) | "draw";

export type GameActions = {
  makeMove: (index: number) => void;
  joinRoom: (roomId: string) => void;
  rematch: () => void;
};

export type GameRoomState = {
  roomId: string;
  gameStatus: string;
  rematchStatus: RematchStatus;
};

export type UseTicTacToeReturnType = GameState & GameActions & GameRoomState & { 
  isConnected: boolean;
  connectionError: string | null;
};
export type GameEndEventData = { gameResult: GameResult<string>; message: string }; 
export type RematchStatusEventData = { status: RematchStatus; message: string };