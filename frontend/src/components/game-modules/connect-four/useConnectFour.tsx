import { useState } from 'react';
import { boardGrid } from '@/store/game';
import { useGameRoom } from '@/hooks/useGameRoom';

export type ConnectFourCell = 'yellow' | 'red' | 'invalid' | 'valid';

export function useConnectFour() {
  const columns = boardGrid['connect-four'].columns;
  const rows = boardGrid['connect-four'].rows;
  const [board, setBoard] = useState<ConnectFourCell[]>(Array(columns * rows).fill('valid'));
  const [currentPlayer, setCurrentPlayer] = useState<'yellow' | 'red'>('yellow');
  const { roomState, joinRoom, playAgain } = useGameRoom('connect-four');

  function isLowestEmptyCellInColumn(board: ConnectFourCell[], idx: number, col: number, columns: number, rows: number): boolean {
    for (let row = rows - 1; row >= 0; row--) {
      const currentIdx = row * columns + col;
      if (currentIdx === idx) return board[currentIdx] === 'valid';
      if (board[currentIdx] === 'valid') return false;
    }
    return false;
  }

  function getCellState(board: ConnectFourCell[], idx: number, col: number, columns: number, rows: number): ConnectFourCell {
    if (board[idx] === 'valid') {
      return isLowestEmptyCellInColumn(board, idx, col, columns, rows) ? 'valid' : 'invalid';
    }
    return board[idx];
  }

  function computeCellStates(board: ConnectFourCell[], columns: number, rows: number): ConnectFourCell[] {
    const cellStates: ConnectFourCell[] = Array.from(board);
    
    for (let col = 0; col < columns; col++) {
      for (let row = 0; row < rows; row++) {
        const idx = row * columns + col;
        cellStates[idx] = getCellState(board, idx, col, columns, rows);
      }
    }
    
    return cellStates;
  }

  const cellStates = computeCellStates(board, columns, rows);

  function handleCellClick(i: number) {
    if (cellStates[i] !== 'valid') return;
    const newBoard = [...board];
    newBoard[i] = currentPlayer;
    setBoard(newBoard);
    setCurrentPlayer(currentPlayer === 'yellow' ? 'red' : 'yellow');
  }

  return {
    cellStates,
    currentPlayer,
    handleCellClick,
    columns,
    rows,
    joinRoom,
    playAgain,
    roomState,
  };
}