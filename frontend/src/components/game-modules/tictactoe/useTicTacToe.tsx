import { useState, useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useGameRoom, RematchStatus, PlayerNumber } from '@/hooks/useGameRoom';
import { Board, GameState, UseTicTacToeReturnType } from './types';

export function useTicTacToe(): UseTicTacToeReturnType {
  const { socket, on, off, isConnected, connectionError } = useSocket();
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
      setGameState(prev => ({
        ...prev,
        board: newBoard,
        isMyTurn: !prev.isMyTurn,
        gameStatus: prev.isMyTurn ? "Waiting for opponent's move..." : "Your turn!"
      }));
    };

    const handlePlayerNumber = (number: PlayerNumber) => {
      setGameState(prev => ({
        ...prev,
        playerNumber: number,
        isMyTurn: number === 'player1',
        gameStatus: number === 'player1' 
          ? "You're X - you go first!" 
          : "You're O - waiting for X to make the first move..."
      }));
    };

    const handleGameStart = () => {
      setGameState(prev => ({
        ...prev,
        gameStarted: true,
        gameFinished: false,
        gameStatus: prev.playerNumber === 'player1' 
          ? "You're X - make your first move!" 
          : "You're O - waiting for X to make the first move..."
      }));
    };

    const handlePlayerJoined = (count: number) => {
      setGameState(prev => ({
        ...prev,
        playersInRoom: count,
        gameStatus: count === 2 
          ? "Game starting..." 
          : "Waiting for opponent..."
      }));
    };

    const handleGameEnd = ({ winner, message }: { winner: string, message: string }) => {
      setGameState(prev => ({
        ...prev,
        gameStarted: false,
        gameFinished: true,
        gameStatus: message,
        isMyTurn: false
      }));
    };

    const handleRematchState = ({ status, message }: { status: RematchStatus, message: string }) => {
      setGameState(prev => ({
        ...prev,
        rematchStatus: status,
        gameStatus: message
      }));
    };

    on("updateBoard", handleUpdateBoard);
    on("playerNumber", handlePlayerNumber);
    on("gameStart", handleGameStart);
    on("playerJoined", handlePlayerJoined);
    on("gameEnd", handleGameEnd);
    on("rematchState", handleRematchState);

    return () => {
      off("updateBoard", handleUpdateBoard);
      off("playerNumber", handlePlayerNumber);
      off("gameStart", handleGameStart);
      off("playerJoined", handlePlayerJoined);
      off("gameEnd", handleGameEnd);
      off("rematchState", handleRematchState);
    };
  }, [on, off]);

  function makeMove(index: number, roomId: string) {
    if (!gameState.gameStarted || !gameState.isMyTurn || gameState.board[index]) return;
    
    const newBoard = [...gameState.board];
    newBoard[index] = gameState.playerNumber;
    
    socket?.emit("move", { 
      gameType: 'tictactoe', 
      roomId, 
      board: newBoard,
      playerNumber: gameState.playerNumber 
    });
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