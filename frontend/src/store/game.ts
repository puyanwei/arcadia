import { create } from 'zustand';
import { Board } from '../types/game';

type GameType = 'tictactoe' | 'connect-four';

export const boardGrid = {
  tictactoe: {
    columns: 3,
    rows: 3
  },
  'connect-four': {
    columns: 7,
    rows: 6
  }
} as const;

export type Grid = {
  columns: number;
  rows: number;
}

type GridBoard = {
  board: Board;
  setBoard: (board: Board) => void;
  currentPlayer: string;
  setCurrentPlayer: (player: string) => void;
  boardGrid: Grid;
}

const { tictactoe, 'connect-four': connectFourGrid } = boardGrid;

export const useTicTacToeGameStore = create<GridBoard>((set) => ({
  board: createBoard(tictactoe.columns, tictactoe.rows),
  setBoard: (board) => set({ board }),
  currentPlayer: 'X',
  setCurrentPlayer: (player) => set({ currentPlayer: player }),
  boardGrid: tictactoe
})); 

export const useConnectFourGameStore = create<GridBoard>((set) => ({
  board: createBoard(connectFourGrid.columns, connectFourGrid.rows),
  setBoard: (board) => set({ board }),
  currentPlayer: 'red',
  setCurrentPlayer: (player) => set({ currentPlayer: player }),
  boardGrid: connectFourGrid
})); 

function createBoard(columns: number, rows: number) {
  return Array(columns * rows).fill(null);
}