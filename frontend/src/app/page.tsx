"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "../../store/game";
import socket from "../../utils/socket";

export default function Home() {
  const { board, setBoard } = useGameStore();
  const [roomId, setRoomId] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [gameStatus, setGameStatus] = useState("Enter a room ID to start");
  const [playerSymbol, setPlayerSymbol] = useState<"X" | "O" | null>(null);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [playersInRoom, setPlayersInRoom] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to server');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from server');
      setGameStatus("Disconnected from server");
    });

    socket.on("updateBoard", (newBoard) => {
      console.log('Board updated:', newBoard);
      setBoard(newBoard);
      setIsMyTurn(true);
      setGameStatus("Your turn!");
    });

    socket.on("playerSymbol", (symbol: "X" | "O") => {
      setPlayerSymbol(symbol);
      setIsMyTurn(symbol === "X");
      setGameStatus(`You are player ${symbol}. ${symbol === "X" ? "It's your turn!" : "Waiting for X to move..."}`);
    });

    socket.on("playerJoined", (playerCount: number) => {
      setPlayersInRoom(playerCount);
      setGameStatus(`Players in room: ${playerCount}/2 ${playerCount === 1 ? "- Waiting for opponent..." : ""}`);
    });

    socket.on("gameStart", () => {
      setGameStarted(true);
      if (playerSymbol === "X") {
        setGameStatus("Game started! Your turn (X)");
      } else {
        setGameStatus("Game started! Waiting for X's move");
      }
    });

    socket.on("roomFull", () => {
      setGameStatus("Room is full! Try another room ID");
    });

    socket.on("error", (message: string) => {
      setGameStatus(`Error: ${message}`);
    });

    socket.on("playerLeft", (message: string) => {
      setGameStatus(message);
      setGameStarted(false);
      setPlayersInRoom(prev => prev - 1);
    });

    socket.on("gameEnd", () => {
      setGameStarted(false);
      setBoard(Array(9).fill(null));
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('updateBoard');
      socket.off('playerSymbol');
      socket.off('playerJoined');
      socket.off('gameStart');
      socket.off('roomFull');
      socket.off('error');
      socket.off('playerLeft');
      socket.off('gameEnd');
    };
  }, [setBoard, playerSymbol]);

  const handleClick = (index: number) => {
    if (!gameStarted) {
      setGameStatus("Waiting for another player to join...");
      return;
    }

    if (!board[index] && isMyTurn && playerSymbol) {
      const newBoard = [...board];
      newBoard[index] = playerSymbol;
      setBoard(newBoard);
      setIsMyTurn(false);
      setGameStatus("Waiting for opponent's move...");
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
      <h1 className="text-xl font-bold mb-4 text-white">Tic-Tac-Toe</h1>
      
      <div className={`mb-4 ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
        {isConnected ? 'Connected to server' : 'Disconnected from server'}
      </div>

      {!playerSymbol && (
        <>
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
        </>
      )}

      <div className="mb-4 text-center text-white">
        {gameStatus}
      </div>

      {playerSymbol && (
        <div className="mb-4 text-center">
          <span className={`px-3 py-1 rounded ${playerSymbol === 'X' ? 'bg-blue-600' : 'bg-red-600'}`}>
            You are {playerSymbol}
          </span>
        </div>
      )}

      <div className={`grid grid-cols-3 gap-4 p-4 bg-gray-800 rounded ${!gameStarted && 'opacity-50'}`}>
        {board.map((cell, i) => (
          <button
            key={i}
            className={`w-20 h-20 flex items-center justify-center text-2xl border-2 border-gray-600 
              ${!cell && isMyTurn && gameStarted ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-800'} 
              ${cell === 'X' ? 'text-blue-400' : cell === 'O' ? 'text-red-400' : 'text-white'}`}
            onClick={() => handleClick(i)}
            disabled={!isMyTurn || !!cell || !gameStarted}
          >
            {cell || '-'}
          </button>
        ))}
      </div>
    </div>
  );
}
