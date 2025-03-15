import { useEffect, useState } from 'react';
import { useGameStore } from '../store/game';
import { useSocket } from './useSocket';
import { GameState, GameActions, Board } from '../types/game';

export function useGame(): GameState & GameActions {
  const { socket } = useSocket();
  const { board, setBoard } = useGameStore();
  const [gameState, setGameState] = useState<GameState>({
    board: Array(9).fill(null),
    playerSymbol: null,
    isMyTurn: false,
    playersInRoom: 0,
    gameStarted: false,
    gameFinished: false,
    gameStatus: "Enter a room ID to start"
  });

  useEffect(() => {
    socket.on("updateBoard", (newBoard: Board) => {
      console.log('Board updated:', newBoard);
      setBoard(newBoard);
      setGameState(prev => ({
        ...prev,
        board: newBoard,
        isMyTurn: true,
        gameStatus: "Your turn!"
      }));
    });

    socket.on("playerSymbol", (symbol: "X" | "O") => {
      setGameState(prev => ({
        ...prev,
        playerSymbol: symbol,
        isMyTurn: symbol === "X",
        gameStatus: `You are player ${symbol}. ${symbol === "X" ? "It's your turn!" : "Waiting for X to move..."}`
      }));
    });

    socket.on("playerJoined", (playerCount: number) => {
      setGameState(prev => ({
        ...prev,
        playersInRoom: playerCount,
        gameStatus: `Players in room: ${playerCount}/2 ${playerCount === 1 ? "- Waiting for opponent..." : ""}`
      }));
    });

    socket.on("gameStart", (shouldSwapFirst: boolean) => {
      setGameState(prev => {
        const isX = prev.playerSymbol === "X";
        // If shouldSwapFirst is true, O goes first this game
        const goesFirst = shouldSwapFirst ? !isX : isX;
        
        return {
          ...prev,
          gameStarted: true,
          isMyTurn: goesFirst,
          gameStatus: goesFirst ? 
            `Game started! Your turn (${prev.playerSymbol})` : 
            `Game started! Waiting for opponent's move...`
        };
      });
    });

    socket.on("roomFull", () => {
      setGameState(prev => ({
        ...prev,
        gameStatus: "Room is full! Try another room ID"
      }));
    });

    socket.on("error", (message: string) => {
      setGameState(prev => ({
        ...prev,
        gameStatus: `Error: ${message}`
      }));
    });

    socket.on("playerLeft", (message: string) => {
      setGameState(prev => ({
        ...prev,
        gameStatus: message,
        gameStarted: false,
        playersInRoom: prev.playersInRoom - 1
      }));
    });

    socket.on("gameEnd", ({ winner, message }: { winner: string, message: string }) => {
      setGameState(prev => ({
        ...prev,
        gameStarted: false,
        gameFinished: true,
        gameStatus: message,
        board: Array(9).fill(null)
      }));
      setBoard(Array(9).fill(null));
    });

    return () => {
      socket.off("updateBoard");
      socket.off("playerSymbol");
      socket.off("playerJoined");
      socket.off("gameStart");
      socket.off("roomFull");
      socket.off("error");
      socket.off("playerLeft");
      socket.off("gameEnd");
    };
  }, [socket, setBoard]);

  function makeMove(index: number, roomId: string) {
    if (!gameState.gameStarted) {
      setGameState(prev => ({
        ...prev,
        gameStatus: "Waiting for another player to join..."
      }));
      return;
    }

    if (!board[index] && gameState.isMyTurn && gameState.playerSymbol) {
      const newBoard = [...board];
      newBoard[index] = gameState.playerSymbol;
      setBoard(newBoard);
      setGameState(prev => ({
        ...prev,
        board: newBoard,
        isMyTurn: false,
        gameStatus: "Waiting for opponent's move..."
      }));
      socket.emit("makeMove", { roomId, board: newBoard });
    }
  }

  function joinRoom(roomId: string) {
    if (!roomId.trim()) {
      setGameState(prev => ({
        ...prev,
        gameStatus: "Please enter a room ID"
      }));
      return;
    }
    setGameState(prev => ({
      ...prev,
      gameStatus: `Joining room: ${roomId}...`
    }));
    socket.emit("joinRoom", roomId);
  }

  function playAgain(roomId: string) {
    setGameState(prev => ({
      ...prev,
      gameFinished: false,
      gameStarted: false,
      gameStatus: "Starting new game..."
    }));
    
    socket.emit("playAgain", roomId);
  }

  return {
    ...gameState,
    makeMove,
    joinRoom,
    playAgain
  };
} 