import { GameState } from "../index";
import { ConnectFourPlayerSymbol } from "./types";

export type ConnectFourCell = 'yellow' | 'red' | 'valid';

export type ConnectFourState = GameState & {
  board: ConnectFourCell[];
  currentPlayer: 'yellow' | 'red';
  winner: 'yellow' | 'red' | null;
  columns: number;
  rows: number;
  status: 'waiting' | 'playing' | 'finished';
  players: { id: string; symbol: ConnectFourPlayerSymbol }[];
  rooms: Map<string, string>;
  playerSymbols: Map<string, ConnectFourPlayerSymbol>;
};

export const initialConnectFourState: ConnectFourState = {
  board: Array(42).fill('valid'), // 6 rows * 7 columns
  currentPlayer: 'yellow',
  winner: null,
  columns: 7,
  rows: 6,
  status: 'waiting',
  players: [],
  rooms: new Map(),
  playerSymbols: new Map()
};

export function checkWinner(board: ConnectFourCell[], columns: number, rows: number): 'yellow' | 'red' | null {
  // Check horizontal
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col <= columns - 4; col++) {
      const winner = checkLine(board, row * columns + col, 1);
      if (winner) return winner;
    }
  }

  // Check vertical
  for (let row = 0; row <= rows - 4; row++) {
    for (let col = 0; col < columns; col++) {
      const winner = checkLine(board, row * columns + col, columns);
      if (winner) return winner;
    }
  }

  // Check diagonal down-right
  for (let row = 0; row <= rows - 4; row++) {
    for (let col = 0; col <= columns - 4; col++) {
      const winner = checkLine(board, row * columns + col, columns + 1);
      if (winner) return winner;
    }
  }

  // Check diagonal up-right
  for (let row = 3; row < rows; row++) {
    for (let col = 0; col <= columns - 4; col++) {
      const winner = checkLine(board, row * columns + col, columns - 1);
      if (winner) return winner;
    }
  }

  return null;
}

export function isBoardFull(board: ConnectFourCell[]): boolean {
  return !board.includes('valid');
}

export function getLowestEmptyCellInColumn(board: ConnectFourCell[], col: number, columns: number, rows: number): number | null {
  for (let row = rows - 1; row >= 0; row--) {
    const idx = row * columns + col;
    if (board[idx] === 'valid') {
      return idx;
    }
  }
  return null;
}

/**
 * Checks if there are 4 matching pieces in a line
 * @param board The game board
 * @param startIdx The index of the first cell to check
 * @param step How many cells to move for each subsequent check:
 *   - Horizontal: step = 1 (check next cell)
 *   - Vertical: step = columns (check cell below)
 *   - Diagonal down-right: step = columns + 1 (check cell below and right)
 *   - Diagonal up-right: step = columns - 1 (check cell above and right)
 * @returns 'yellow' or 'red' if 4 matching pieces found, null otherwise
 * 
 * Example in a 7x6 board:
 * - Horizontal: [0,1,2,3] (checking cells 0,1,2,3)
 * - Vertical: [0,7,14,21] (checking cells 0,7,14,21)
 * - Diagonal down-right: [0,8,16,24] (checking cells 0,8,16,24)
 * - Diagonal up-right: [21,15,9,3] (checking cells 21,15,9,3)
 */
function checkLine(board: ConnectFourCell[], startIdx: number, step: number): 'yellow' | 'red' | null {
    const first = board[startIdx];  // Get the first cell in the line
    if (first === 'valid') return null;  // If it's empty, no win possible
    
    // Check the next 3 cells in the line
    for (let i = 1; i < 4; i++) {
        if (board[startIdx + step * i] !== first) return null;
    }
    return first;  // If we get here, all 4 cells match
}
