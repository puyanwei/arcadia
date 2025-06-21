import { useState, useEffect, useCallback } from "react";
import { useSocket } from "@/hooks/useSocket";
import { useGameRoom } from "@/hooks/useGameRoom";
import {
  Board,
  UseTicTacToeReturnType,
  PlayerStatus,
  GameState,
} from "./types";
import { Player } from "@/types/game";

export function useTicTacToe(): UseTicTacToeReturnType {
  const { socket, on, off, isConnected, connectionError, clientId } =
    useSocket();
  const { roomId, joinRoom, rematch } = useGameRoom("tictactoe");

  const [gameState, setGameState] = useState<GameState>({
    board: Array(9).fill(null),
    playerNumber: null,
    isMyTurn: false,
    playersInRoom: 0,
    gameStatus: "Enter a room ID to start",
    playerStatus: null,
    rematchStatus: null,
    roomId: "",
  });

  // Sync roomId from useGameRoom hook to local state
  useEffect(() => {
    setGameState((prev) => ({ ...prev, roomId }));
  }, [roomId]);

  useEffect(() => {
    if (!socket) return;

    // Handles the primary state machine
    const handleStatusUpdate = ({
      status,
      gameResult,
      message,
    }: {
      status: PlayerStatus;
      gameResult?: "draw" | string;
      message?: string;
    }) => {
      setGameState((prev) => {
        let newGameStatus = prev.gameStatus;
        if (status === "playing") {
          newGameStatus = prev.isMyTurn ? "Your turn!" : "Opponent's turn!";
        } else if (status === "waiting") {
          newGameStatus = "Waiting for opponent...";
        } else if (status === "gameOver") {
          const winnerMessage =
            gameResult === clientId ? "You won!" : "You lost!";
          newGameStatus =
            gameResult === "draw" ? "It's a draw." : winnerMessage;
        } else if (status === "rematchPending") {
          newGameStatus = message || "Opponent wants a rematch!";
        } else if (status === "rematchWaiting") {
          newGameStatus = message || "Waiting for opponent to accept...";
        }
        return { ...prev, playerStatus: status, gameStatus: newGameStatus };
      });
    };

    // Handles board updates
    const handleBoardUpdate = ({
      board,
      currentPlayer,
    }: {
      board: Board;
      currentPlayer?: string;
    }) => {
      setGameState((prev) => {
        const myTurn = currentPlayer === clientId;
        return {
          ...prev,
          board,
          isMyTurn: myTurn,
          gameStatus: myTurn ? "Your turn!" : "Opponent's turn!",
        };
      });
    };

    // Handles player list updates
    const handlePlayerJoined = ({
      players,
      playerCount,
    }: {
      players: Player[];
      playerCount: number;
    }) => {
      setGameState((prev) => ({
        ...prev,
        playersInRoom: playerCount,
        playerNumber:
          players.find((p) => p.id === clientId)?.playerNumber ||
          prev.playerNumber,
      }));
    };

    on("statusUpdate", handleStatusUpdate);
    on("boardUpdate", handleBoardUpdate);
    on("playerJoined", handlePlayerJoined);

    return () => {
      off("statusUpdate", handleStatusUpdate);
      off("boardUpdate", handleBoardUpdate);
      off("playerJoined", handlePlayerJoined);
    };
  }, [socket, on, off, clientId]);

  const makeMove = useCallback(
    (index: number) => {
      if (
        gameState.playerStatus !== "playing" ||
        !gameState.isMyTurn ||
        gameState.board[index] ||
        !roomId
      )
        return;
      socket?.emit("move", {
        gameType: "tictactoe",
        roomId,
        clientId,
        move: { index },
      });
    },
    [
      socket,
      gameState.playerStatus,
      gameState.isMyTurn,
      gameState.board,
      roomId,
      clientId,
    ]
  );

  const memoizedJoinRoom = useCallback(
    (newRoomId: string) => {
      joinRoom(newRoomId);
    },
    [joinRoom]
  );

  const memoizedRematch = useCallback(() => {
    if (roomId) rematch();
  }, [rematch, roomId]);

  return {
    ...gameState,
    makeMove,
    joinRoom: memoizedJoinRoom,
    rematch: memoizedRematch,
    isConnected,
    connectionError,
  };
}
