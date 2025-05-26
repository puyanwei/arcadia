import { useState } from "react";
import { useConnectFour } from "./useConnectFour";
import { ConnectFourCell } from "./types";

export function ConnectFour() {
  const {
    playerNumber,
    isMyTurn,
    gameStarted,
    gameFinished,
    gameStatus,
    board,
    makeMove,
    joinRoom,
    rematch,
    rematchStatus,
    isConnected,
    connectionError,
  } = useConnectFour();

  const [roomId, setRoomId] = useState("");

  function handleJoinRoom() {
    if (!isConnected) return;
    joinRoom(roomId);
  }

  function handlePlayAgain() {
    if (!isConnected) return;
    rematch(roomId);
  }

  function getCellClassName(cell: ConnectFourCell) {
    const base =
      "w-16 h-16 flex items-center justify-center text-2xl border border-gray-400 rounded-full text-shadow-2xl";
    const valid = "bg-gray-500 hover:bg-gray-400 cursor-pointer";
    const yellow = "bg-yellow-200 text-black";
    const red = "bg-red-300 text-white";
    const invalid = "bg-gray-300 text-gray-400 cursor-not-allowed";
    if (cell === "valid") return `${base} ${valid}`;
    if (cell === "player1") return `${base} ${yellow}`;
    if (cell === "player2") return `${base} ${red}`;
    if (cell === "invalid") return `${base} ${invalid}`;
  }

  return (
    <div className="flex flex-col items-center p-5 text-white min-h-screen">
      <h1 className="text-xl font-bold mb-4 text-white">Connect Four</h1>

      <div
        className={`mb-4 ${isConnected ? "text-green-400" : "text-red-400"}`}
      >
        {isConnected ? "Connected to server" : "Disconnected from server"}
      </div>

      {connectionError && (
        <div className="mb-4 text-red-400">
          Connection error: {connectionError}
        </div>
      )}

      {!playerNumber && (
        <>
          <input
            className="border p-2 my-2 w-64 bg-gray-800 text-white border-gray-600"
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            disabled={!isConnected}
          />
          <button
            onClick={handleJoinRoom}
            className={`p-2 ${
              isConnected
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-600 cursor-not-allowed"
            } text-white rounded w-64 mb-4`}
            disabled={!isConnected}
          >
            {isConnected ? "Join Game" : "Connecting..."}
          </button>
        </>
      )}

      <div className="mb-4 text-center text-white">{gameStatus}</div>

      {playerNumber && (
        <div className="mb-4 text-center">
          <span
            className={`px-3 py-1 rounded ${
              playerNumber === "player1" ? "bg-yellow-600" : "bg-red-600"
            }`}
          >
            You are {playerNumber === "player1" ? "yellow" : "red"}
          </span>
        </div>
      )}

      <div
        className={`grid gap-4 p-4 bg-blue-700 rounded ${
          !gameStarted && "opacity-50"
        }`}
        style={{ gridTemplateColumns: `repeat(7, minmax(0, 1fr))` }}
      >
        {board.map((cell, i) => {
          const cellClassName = getCellClassName(cell);
          return (
            <button
              key={i}
              className={cellClassName}
              disabled={cell !== "valid" || !isMyTurn || !gameStarted}
              onClick={() => makeMove(i, roomId)}
            >
              {cell === "player1" ? "●" : cell === "player2" ? "●" : ""}
            </button>
          );
        })}
      </div>

      {gameFinished && (
        <button
          onClick={handlePlayAgain}
          className="mt-4 p-2 bg-green-600 hover:bg-green-700 text-white rounded w-64"
        >
          {rematchStatus === "pending"
            ? "Accept Rematch"
            : rematchStatus === "accepted"
            ? "Waiting for opponent..."
            : "Rematch"}
        </button>
      )}
    </div>
  );
}
