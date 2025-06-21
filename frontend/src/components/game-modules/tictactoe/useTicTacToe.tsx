import { useState, useEffect } from "react";
import { useSocket } from "@/hooks/useSocket";
import { useGameRoom } from "@/hooks/useGameRoom";
import {
  Board,
  GameEndEventData,
  GameState,
  RematchStatusEventData,
  UseTicTacToeReturnType,
} from "./types";
import { Player, PlayerNumber } from "@/types/game";

export function useTicTacToe(): UseTicTacToeReturnType {
  const { socket, on, off, isConnected, connectionError, clientId } =
    useSocket();
  const {
    roomId,
    gameStatus: roomGameStatus,
    rematchStatus,
    joinRoom,
    rematch,
  } = useGameRoom("tictactoe");
  const [gameState, setGameState] = useState<GameState>({
    board: Array(9).fill(null),
    playerNumber: null,
    isMyTurn: false,
    playersInRoom: 0,
    gameStarted: false,
    gameFinished: false,
    gameStatus: "Enter a room ID to start",
    rematchStatus: null,
    roomId: "",
  });

  // Update roomId in gameState when it changes
  useEffect(() => {
    setGameState((prev) => ({ ...prev, roomId }));
  }, [roomId]);

  useEffect(() => {
    on("gameStart", handleGameStart);
    on("updateBoard", handleUpdateBoard);
    on("playerJoined", handlePlayerJoined);
    on("gameEnd", handleGameEnd);
    on("rematchState", handleRematchState);

    return () => {
      off("updateBoard", handleUpdateBoard);
      off("gameStart", handleGameStart);
      off("playerJoined", handlePlayerJoined);
      off("gameEnd", handleGameEnd);
      off("rematchState", handleRematchState);
    };
  }, [on, off]);

  function handleUpdateBoard({
    board: newBoard,
    currentPlayer,
  }: {
    board: Board;
    currentPlayer?: string;
  }) {
    console.log("TicTacToe handleUpdateBoard called:", {
      newBoard,
      isFreshBoard: newBoard.every((cell) => cell === null),
    });

    setGameState((prev) => {
      console.log("TicTacToe handleUpdateBoard - current state:", {
        gameFinished: prev.gameFinished,
        gameStarted: prev.gameStarted,
        playerNumber: prev.playerNumber,
      });

      if (!prev.playerNumber) return { ...prev, board: newBoard };

      // If the board is completely reset (all cells are null), this is likely a rematch
      const isFreshBoard = newBoard.every((cell) => cell === null);

      if (prev.gameFinished && isFreshBoard) {
        // This is a rematch - reset the game state
        console.log(
          "TicTacToe handleUpdateBoard - rematch detected, resetting game state"
        );
        return {
          ...prev,
          board: newBoard,
          gameStarted: true,
          gameFinished: false,
          isMyTurn: prev.playerNumber === "player1",
          gameStatus:
            prev.playerNumber === "player1" ? "Your turn!" : "Opponent's turn!",
        };
      }

      const myTurn = currentPlayer === clientId;

      return {
        ...prev,
        board: newBoard,
        isMyTurn: myTurn,
        gameStatus: myTurn ? "Your turn!" : "Opponent's turn!",
      };
    });
  }

  function handleGameStart({ firstPlayer }: { firstPlayer: string }) {
    setGameState((prev) => {
      const myTurn = firstPlayer === clientId;
      return {
        ...prev,
        gameStarted: true,
        gameFinished: false,
        isMyTurn: myTurn,
        gameStatus: myTurn ? "Your turn!" : "Opponent's turn!",
      };
    });
  }

  function handlePlayerJoined({
    players,
    playerCount,
  }: {
    players: Player[];
    playerCount: number;
  }) {
    setGameState((prev) => {
      const myPlayerInfo = players.find((p) => p.id === clientId);
      const gameStatus =
        playerCount < 2 ? "Waiting for opponent..." : "Game starting...";

      return {
        ...prev,
        playersInRoom: playerCount,
        playerNumber: myPlayerInfo?.playerNumber || prev.playerNumber,
        gameStatus: !prev.gameStarted ? gameStatus : prev.gameStatus,
      };
    });
  }

  function handleGameEnd({ gameResult, message }: GameEndEventData) {
    console.log(
      `[TicTacToe] handleGameEnd called. Result: ${gameResult}, Message: ${message}`
    );
    setGameState((prev) => ({
      ...prev,
      gameStarted: false,
      gameFinished: true,
      gameStatus: gameResult === "draw" ? "It's a tie!" : message,
      isMyTurn: false,
    }));
  }

  function handleRematchState({ status, message }: RematchStatusEventData) {
    setGameState((prev) => {
      if (status === "accepted") {
        // When rematch is accepted, reset the game state
        return {
          ...prev,
          rematchStatus: status,
          gameStatus: message,
          gameFinished: false,
          gameStarted: true,
          isMyTurn: prev.playerNumber === "player1",
        };
      }

      return {
        ...prev,
        rematchStatus: status,
        gameStatus: message,
      };
    });
  }

  function makeMove(index: number, roomId: string) {
    if (!gameState.gameStarted || !gameState.isMyTurn || gameState.board[index])
      return;

    socket?.emit("move", {
      gameType: "tictactoe",
      roomId,
      clientId,
      move: { index },
    });
  }

  function joinRoomWithLog(roomId: string) {
    if (socket) {
    }
    joinRoom(roomId);
  }

  return {
    ...gameState,
    roomId,
    gameStatus: gameState.gameStatus,
    rematchStatus,
    makeMove,
    joinRoom: joinRoomWithLog,
    rematch,
    isConnected,
    connectionError,
  };
}
