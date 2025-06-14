import { useState, useEffect } from "react";
import { useSocket } from "@/hooks/useSocket";
import { useGameRoom, RematchStatus, PlayerNumber } from "@/hooks/useGameRoom";
import {
  Board,
  GameEndEventData,
  GameState,
  RematchStatusEventData,
  UseTicTacToeReturnType,
} from "./types";

export function useTicTacToe(): UseTicTacToeReturnType {
  const { socket, on, off, isConnected, connectionError } = useSocket();
  const { roomState, joinRoom, rematch } = useGameRoom("tictactoe");
  const [gameState, setGameState] = useState<GameState>({
    board: Array(9).fill(null),
    playerNumber: null,
    isMyTurn: false,
    playersInRoom: 0,
    gameStarted: false,
    gameFinished: false,
    gameStatus: "Enter a room ID to start",
    rematchStatus: null,
  });

  useEffect(() => {
    on("gameStart", handleGameStart);
    on("updateBoard", handleUpdateBoard);
    on("playerNumber", handlePlayerNumber);
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

  function handleUpdateBoard(newBoard: Board) {
    setGameState((prev) => {
      if (!prev.playerNumber) return { ...prev, board: newBoard };
      const xCount = newBoard.filter((cell) => cell === "player1").length;
      const oCount = newBoard.filter((cell) => cell === "player2").length;
      const myTurn =
        prev.playerNumber === "player1" ? xCount === oCount : xCount > oCount;
      return {
        ...prev,
        board: newBoard,
        isMyTurn: myTurn,
        gameStatus: myTurn ? "Your turn!" : "Opponent's turn!",
      };
    });
  }

  function handlePlayerNumber(data: {
    currentPlayer: PlayerNumber;
    otherPlayer: PlayerNumber | null;
  }) {
    setGameState((prev) => ({
      ...prev,
      playerNumber: data.currentPlayer,
      isMyTurn: data.currentPlayer === "player1",
      gameStatus:
        data.currentPlayer === "player1"
          ? "You're X - you go first!"
          : "You're O - waiting for X to make the first move...",
    }));
  }

  function handleGameStart() {
    setGameState((prev) => {
      if (!prev.playerNumber) {
        return { ...prev, gameStarted: true, gameFinished: false };
      }
      const xCount = prev.board.filter((cell) => cell === "player1").length;
      const oCount = prev.board.filter((cell) => cell === "player2").length;
      const myTurn =
        prev.playerNumber === "player1" ? xCount === oCount : xCount > oCount;
      return {
        ...prev,
        gameStarted: true,
        gameFinished: false,
        isMyTurn: myTurn,
        gameStatus: myTurn ? "Your turn!" : "Opponent's turn!",
      };
    });
  }

  function handlePlayerJoined(count: number) {
    setGameState((prev) => ({
      ...prev,
      playersInRoom: count,
      gameStatus: count === 2 ? "Game starting..." : "Waiting for opponent...",
    }));
  }

  function handleGameEnd({ gameResult, message }: GameEndEventData) {
    console.log("handleGameEnd received:", { gameResult, message });
    setGameState((prev) => ({
      ...prev,
      gameStarted: false,
      gameFinished: true,
      gameStatus: gameResult === "draw" ? "It's a tie!" : message,
      isMyTurn: false,
    }));
  }

  function handleRematchState({ status, message }: RematchStatusEventData) {
    setGameState((prev) => ({
      ...prev,
      rematchStatus: status,
      gameStatus: message,
    }));
  }

  function makeMove(index: number, roomId: string) {
    if (!gameState.gameStarted || !gameState.isMyTurn || gameState.board[index])
      return;

    // Optimistically update the board
    const newBoard = [...gameState.board];
    newBoard[index] = gameState.playerNumber;
    setGameState((prev) => ({
      ...prev,
      board: newBoard,
      isMyTurn: false, // After move, it's not your turn
      gameStatus: "Opponent's turn!",
    }));

    socket?.emit("move", {
      gameType: "tictactoe",
      roomId,
      board: newBoard,
      playerNumber: gameState.playerNumber,
    });
  }

  function joinRoomWithLog(roomId: string) {
    if (socket) {
    }
    joinRoom(roomId);
  }

  return {
    ...roomState,
    ...gameState,
    gameStatus:
      gameState.gameStarted || gameState.gameFinished
        ? gameState.gameStatus
        : roomState.gameStatus,
    makeMove,
    joinRoom: joinRoomWithLog,
    rematch,
    isConnected,
    connectionError,
  };
}
