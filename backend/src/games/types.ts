import { Prettify } from '../utils/types';

export type GameType = 'tictactoe' | 'connect-four';
export type Cell = (string | null)
export type Board = Cell[]
export type PlayerNumber = 'player1' | 'player2';
export type RematchStatus = "waiting" | "pending" | null;
export type RematchState = {
  requested: boolean;
  requestedBy: string;
  status?: RematchStatus;
}; 

export type ConnectFourCell = Prettify<PlayerNumber | 'invalid' | 'valid'>
export type ConnectFourBoard = ConnectFourCell[];