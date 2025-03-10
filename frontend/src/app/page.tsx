"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "../../store/game";
import socket from "../../utils/socket";

export default function Home() {
  const { board, setBoard, currentPlayer, setCurrentPlayer } = useGameStore();
  const [roomId, setRoomId] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [gameStatus, setGameStatus] = useState("Enter a room ID to start");

  useEffect(() => {
    // Check connection
    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to server');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from server');
    });

    socket.on("updateBoard", (newBoard) => {
      console.log('Board updated:', newBoard);
      setBoard(newBoard);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('updateBoard');
    };
  }, [setBoard]);

  const handleClick = (index: number) => {
    if (!board[index]) {
      const newBoard = [...board];
      newBoard[index] = currentPlayer;
      setBoard(newBoard);
      setCurrentPlayer(currentPlayer === "X" ? "O" : "X");
      socket.emit("makeMove", { roomId, board: newBoard });
    }
  };

  const handleJoinRoom = () => {
    if (!roomId.trim()) {
      setGameStatus("Please enter a room ID");
      return;
    }
    setGameStatus(`Joining room: ${roomId}...`);
    socket.emit("joinRoom", roomId);
  };

  return (
    <div className="flex flex-col items-center p-5 text-white">
      <h1 className="text-xl font-bold mb-4 text-whit underline">Tic-Tac-Toe</h1>
      
      {/* Connection status - keeping green/red for status but making them brighter */}
      <div className={`mb-4 ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
        {isConnected ? 'Connected to server' : 'Disconnected from server'}
      </div>

      <input
        className="border p-2 my-2 w-64 bg-gray-800 text-white border-gray-600"
        placeholder="Enter Room ID"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
      />
      <button 
        onClick={handleJoinRoom} 
        className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded w-64 mb-4"
      >
        Join Game
      </button>

      {/* Game status */}
      <div className="mb-4 text-center text-white">
        {gameStatus}
      </div>

      {/* Simplified grid layout */}
      <div className="grid grid-cols-3 gap-4 p-4 bg-gray-800 rounded">
        {board.map((cell, i) => (
          <button
            key={i}
            className="w-20 h-20 flex items-center justify-center text-2xl border-2 border-gray-600 bg-gray-700 hover:bg-gray-600 text-white"
            onClick={() => handleClick(i)}
          >
            {cell || '-'}
          </button>
        ))}
      </div>
    </div>
  );
}
