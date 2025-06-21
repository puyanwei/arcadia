"use client";

import { useState } from "react";
import { useTicTacToe } from "./useTicTacToe";

export function TicTacToe() {
  const {
    board,
    isMyTurn,
    gameStatus,
    makeMove,
    joinRoom,
    rematch,
    roomId,
    isConnected,
    playerNumber,
  } = useTicTacToe();

  const [inputRoomId, setInputRoomId] = useState("");

  const playerId =
    typeof window !== "undefined"
      ? sessionStorage.getItem("arcadia_client_id")
      : undefined;

  const handleMove = (index: number) => {
    makeMove(index);
  };

  const handleRematch = () => {
    if (roomId) rematch();
  };

  const handleJoinGame = () => {
    if (inputRoomId && isConnected) {
      joinRoom(inputRoomId);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2 text-white">Tic Tac Toe</h2>
        <p
          className={`text-lg font-semibold ${
            gameStatus.includes("rematch") ||
            gameStatus.includes("Waiting for opponent")
              ? "text-yellow-400"
              : "text-gray-200"
          }`}
        >
          {gameStatus}
        </p>
      </div>

      {!roomId && (
        <div className="w-full max-w-xs">
          <div className="flex flex-col gap-2">
            <input
              className="border p-2 rounded-lg text-black"
              placeholder="Enter Room ID"
              value={inputRoomId}
              onChange={(e) => setInputRoomId(e.target.value)}
            />
            <button
              onClick={handleJoinGame}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              disabled={!isConnected}
            >
              Join Game
            </button>
          </div>
        </div>
      )}

      {gameStatus === "Waiting for opponent..." && (
        <div className="flex flex-col items-center justify-center p-8 text-white bg-gray-800 rounded-lg shadow-xl">
          <p className="text-lg">
            Room ID: <span className="font-bold text-yellow-400">{roomId}</span>
          </p>
          <p className="mt-2 text-gray-300">Share this ID with your friend!</p>
        </div>
      )}

      {gameStatus.includes("turn") && (
        <div className="flex flex-col items-center gap-4">
          {playerNumber && (
            <p className="text-gray-200">
              You are{" "}
              {playerNumber === "player1" ? (
                <span className="text-blue-500 font-extrabold">X</span>
              ) : (
                <span className="text-red-500 font-extrabold">O</span>
              )}
            </p>
          )}
          <div className="grid grid-cols-3 gap-2">
            {board.map((cell, index) => (
              <button
                key={index}
                onClick={() => handleMove(index)}
                disabled={!isMyTurn || cell !== null}
                className={`w-20 h-20 text-4xl font-bold border-2 rounded-lg
                ${cell === "player1" ? "text-blue-600" : "text-red-600"}
                ${
                  isMyTurn && !cell ? "hover:bg-gray-100" : "cursor-not-allowed"
                }
                ${cell ? "border-gray-300" : "border-gray-400"}`}
              >
                {cell === "player1" ? "X" : cell === "player2" ? "O" : ""}
              </button>
            ))}
          </div>
        </div>
      )}

      {(gameStatus.includes("won") ||
        gameStatus.includes("lost") ||
        gameStatus.includes("draw") ||
        gameStatus.includes("rematch")) && (
        <div className="flex flex-col items-center gap-4">
          <div className="text-center">
            <p className="text-xl text-white mb-4 font-semibold">
              {gameStatus}
            </p>
          </div>
          <button
            onClick={handleRematch}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 text-lg font-semibold"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}
