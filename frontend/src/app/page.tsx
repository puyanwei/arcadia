"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "../../store/game";
import socket from "../../utils/socket";

export default function Home() {
  const { board, setBoard, currentPlayer, setCurrentPlayer } = useGameStore();
  const [roomId, setRoomId] = useState("");

  useEffect(() => {
    socket.on("updateBoard", (newBoard) => setBoard(newBoard));
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
    socket.emit("joinRoom", roomId);
  };

  return (
    <div className="flex flex-col items-center p-5">
      <h1 className="text-xl font-bold">Tic-Tac-Toe</h1>
      <input
        className="border p-2 my-2"
        placeholder="Enter Room ID"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
      />
      <button onClick={handleJoinRoom} className="p-2 bg-blue-500 text-white rounded">
        Join Game
      </button>

      <div className="grid grid-cols-3 gap-2 mt-4">
        {board.map((cell, i) => (
          <button
            key={i}
            className="w-16 h-16 text-2xl border"
            onClick={() => handleClick(i)}
          >
            {cell}
          </button>
        ))}
      </div>
    </div>
  );
}
