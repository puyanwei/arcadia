"use client";

import { useState } from "react";
import { useSocket } from "@/hooks/useSocket";
import { useTicTacToe } from "./useTicTacToe";

export default function TicTacToe() {
  const {
    playerNumber,
    isMyTurn,
    gameStarted,
    gameFinished,
    gameStatus,
    board,
    makeMove,
    joinRoom,
    playAgain,
    rematchStatus,
    isConnected,
    connectionError
  } = useTicTacToe();
  
  const [roomId, setRoomId] = useState("");

  function handleJoinRoom() {
    if (!isConnected) return;
    joinRoom(roomId);
  }

  function handlePlayAgain() {
    if (!isConnected) return;
    playAgain(roomId);
  }

  return (
    <div className="flex flex-col items-center p-5 text-white">
      <h1 className="text-xl font-bold mb-4 text-white">Tic-Tac-Toe</h1>
      
      <div className={`mb-4 ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
        {isConnected ? 'Connected to server' : 'Disconnected from server'}
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
            className={`p-2 ${isConnected ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 cursor-not-allowed'} text-white rounded w-64 mb-4`}
            disabled={!isConnected}
          >
            {isConnected ? 'Join Game' : 'Connecting...'}
          </button>
        </>
      )}

      <div className="mb-4 text-center text-white">
        {gameStatus}
      </div>

      {playerNumber && (
        <div className="mb-4 text-center">
          <span className={`px-3 py-1 rounded ${playerNumber === 'player1' ? 'bg-blue-600' : 'bg-red-600'}`}>
            You are {playerNumber === 'player1' ? 'X' : 'O'}
          </span>
        </div>
      )}

      <div className={`grid grid-cols-3 gap-4 p-4 bg-gray-800 rounded ${!gameStarted && 'opacity-50'}`}>
        {board.map((cell, i) => (
          <button
            key={i}
            className={`w-20 h-20 flex items-center justify-center text-2xl border-2 border-gray-600 
              ${!cell && isMyTurn && gameStarted ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-800'} 
              ${cell === 'player1' ? 'text-blue-400' : cell === 'player2' ? 'text-red-400' : 'text-white'}`}
            onClick={() => makeMove(i, roomId)}
            disabled={!isMyTurn || !!cell || !gameStarted}
          >
            {cell === 'player1' ? 'X' : cell === 'player2' ? 'O' : '-'}
          </button>
        ))}
      </div>

      {gameFinished && (
        <button
          onClick={handlePlayAgain}
          className="mt-4 p-2 bg-green-600 hover:bg-green-700 text-white rounded w-64"
        >
          {rematchStatus === "pending" ? "Accept Rematch" :
           rematchStatus === "accepted" ? "Waiting for opponent..." :
           "Rematch"}
        </button>
      )}
    </div>
  );
} 