import { useEffect, useState } from 'react';
import { useTicTacToeGameStore } from '@/store/game';
import { useSocket } from '@/hooks/useSocket';
import { GameRoomState, useGameRoom } from '@/hooks/useGameRoom';
import { GameState, GameActions, Board } from './types';

type PlayerNumber = 'player1' | 'player2';
type UseTicTacToeReturnType = GameState & GameActions & GameRoomState & { isConnected: boolean, connectionError: string | null };

export function useTicTacToe(): UseTicTacToeReturnType {
  const { socket, on, off, isConnected, connectionError } = useSocket();
  const { board, setBoard } = useTicTacToeGameStore();
  const { roomState, joinRoom, playAgain } = useGameRoom('tictactoe');
  const [gameState, setGameState] = useState<GameState>({
    board: Array(9).fill(null),
    playerNumber: null,
    isMyTurn: false,
    playersInRoom: 0,
    gameStarted: false,
    gameFinished: false,
    gameStatus: "Enter a room ID to start",
    rematchStatus: null
  });

  useEffect(() => {
    const handleUpdateBoard = (newBoard: Board) => {
      setBoard(newBoard);
      setGameState(prev => {
        if (prev.gameFinished) {
          return {
            ...prev,
            board: newBoard
          };
        }
        return {
          ...prev,
          board: newBoard,
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
        gameStatus: `You are ${number === 'player1' ? 'X' : 'O'}. ${number === 'player1' ? "It's your turn!" : "Waiting for X to move..."}`
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
  }, [on, off, setBoard]);

  function makeMove(index: number, roomId: string) {
    if (!gameState.gameStarted) {
      setGameState(prev => ({
        ...prev,
        gameStatus: "Waiting for another player to join..."
      }));
      return;
    }
    if (!board[index] && gameState.isMyTurn && gameState.playerNumber) {
      const newBoard = [...board];
      newBoard[index] = gameState.playerNumber;
      setBoard(newBoard);
      setGameState(prev => ({
        ...prev,
        board: newBoard,
        isMyTurn: false,
        gameStatus: "Waiting for opponent's move..."
      }));
      socket?.emit("makeMove", { gameType: 'tictactoe', roomId, board: newBoard });
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