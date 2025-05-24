import { useEffect, useState } from 'react';
import { boardGrid } from '@/store/game';
import { useSocket } from '@/hooks/useSocket';
import { useGameRoom } from '@/hooks/useGameRoom';
import { ConnectFourCell, GameState, GameActions } from './types';

type UseConnectFourReturnType = GameState & GameActions & { isConnected: boolean, connectionError: string | null };

export function useConnectFour(): UseConnectFourReturnType {
  const { socket, on, off, isConnected, connectionError } = useSocket();
  const { roomState, joinRoom, playAgain } = useGameRoom('connect-four');
  const columns = boardGrid['connect-four'].columns;
  const rows = boardGrid['connect-four'].rows;
  const [gameState, setGameState] = useState<GameState>({
    board: Array(columns * rows).fill('valid'),
    playerNumber: null,
    isMyTurn: false,
    playersInRoom: 0,
    gameStarted: false,
    gameFinished: false,
    gameStatus: "Enter a room ID to start",
    rematchStatus: null
  });

  function isLowestEmptyCellInColumn(board: ConnectFourCell[], idx: number, col: number): boolean {
    for (let row = rows - 1; row >= 0; row--) {
      const currentIdx = row * columns + col;
      if (currentIdx === idx) return board[currentIdx] === 'valid';
      if (board[currentIdx] === 'valid') return false;
    }
    return false;
  }

  function getCellState(board: ConnectFourCell[], idx: number, col: number): ConnectFourCell {
    if (board[idx] === 'valid') {
      return isLowestEmptyCellInColumn(board, idx, col) ? 'valid' : 'invalid';
    }
    return board[idx];
  }

  function computeCellStates(board: ConnectFourCell[]): ConnectFourCell[] {
    const cellStates: ConnectFourCell[] = Array.from(board);
    
    for (let col = 0; col < columns; col++) {
      for (let row = 0; row < rows; row++) {
        const idx = row * columns + col;
        cellStates[idx] = getCellState(board, idx, col);
      }
    }
    
    return cellStates;
  }

  function checkLine(board: ConnectFourCell[], startIdx: number, step: number): 'player1' | 'player2' | null {
    const first = board[startIdx];
    if (first !== 'player1' && first !== 'player2') return null;
    
    for (let i = 1; i < 4; i++) {
      if (board[startIdx + step * i] !== first) return null;
    }
    return first;
  }

  function checkWinner(board: ConnectFourCell[]): 'player1' | 'player2' | 'draw' | null {
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

    // Check diagonal (down-right)
    for (let row = 0; row <= rows - 4; row++) {
      for (let col = 0; col <= columns - 4; col++) {
        const winner = checkLine(board, row * columns + col, columns + 1);
        if (winner) return winner;
      }
    }

    // Check diagonal (down-left)
    for (let row = 0; row <= rows - 4; row++) {
      for (let col = 3; col < columns; col++) {
        const winner = checkLine(board, row * columns + col, columns - 1);
        if (winner) return winner;
      }
    }

    // Check for draw
    if (!board.includes('valid')) return 'draw';
    return null;
  }

  useEffect(() => {
    const handleUpdateBoard = (newBoard: ConnectFourCell[]) => {
      const cellStates = computeCellStates(newBoard);
      setGameState(prev => {
        if (prev.gameFinished) {
          return {
            ...prev,
            board: cellStates
          };
        }
        return {
          ...prev,
          board: cellStates,
          isMyTurn: true,
          gameStatus: "Your turn!"
        };
      });
    };

    const handlePlayerNumber = (number: 'player1' | 'player2' | 'X' | 'O' | 'yellow' | 'red') => {
      if (number !== 'player1' && number !== 'player2') return;
      setGameState(prev => ({
        ...prev,
        playerNumber: number,
        isMyTurn: number === 'player1',
        gameStatus: `You are ${number === 'player1' ? 'yellow' : 'red'}. ${number === 'player1' ? "It's your turn!" : "Waiting for yellow to move..."}`
      }));
    };

    const handleGameEnd = ({ winner, message }: { winner: string, message: string }) => {
      setGameState(prev => ({
        ...prev,
        gameStarted: false,
        gameFinished: true,
        gameStatus: message,
        isMyTurn: false,
        board: prev.board
      }));
    };

    on("updateBoard", handleUpdateBoard);
    on("playerNumber", handlePlayerNumber);
    on("gameEnd", handleGameEnd);

    return () => {
      off("updateBoard", handleUpdateBoard);
      off("playerNumber", handlePlayerNumber);
      off("gameEnd", handleGameEnd);
    };
  }, [on, off]);

  function makeMove(index: number, roomId: string) {
    if (!gameState.gameStarted) {
      setGameState(prev => ({
        ...prev,
        gameStatus: "Waiting for another player to join..."
      }));
      return;
    }

    const col = index % columns;
    const cellStates = computeCellStates(gameState.board);
    
    if (cellStates[index] === 'valid' && gameState.isMyTurn && gameState.playerNumber) {
      const newBoard = [...gameState.board];
      newBoard[index] = gameState.playerNumber;
      
      const updatedCellStates = computeCellStates(newBoard);
      const winner = checkWinner(updatedCellStates);
      
      setGameState(prev => ({
        ...prev,
        board: updatedCellStates,
        isMyTurn: false,
        gameStatus: winner ? "Game Over!" : "Waiting for opponent's move..."
      }));
      
      socket?.emit("makeMove", { gameType: 'connect-four', roomId, board: newBoard });
    }
  }

  return {
    ...gameState,
    ...roomState,
    makeMove,
    joinRoom,
    playAgain,
    isConnected,
    connectionError
  };
}