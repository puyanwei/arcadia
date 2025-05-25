"use client";

import { useTicTacToe } from "./useTicTacToe";

export function TicTacToe() {
  const { 
    board, 
    isMyTurn, 
    gameStarted,
    gameFinished,
    gameStatus,
    rematchStatus,
    makeMove, 
    joinRoom, 
    playAgain,
    roomId 
  } = useTicTacToe();

  const handleMove = (index: number) => {
    if (roomId) makeMove(index, roomId);
  };

  const handlePlayAgain = () => {
    if (roomId) playAgain(roomId);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Tic Tac Toe</h2>
        <p className="text-gray-600">{gameStatus}</p>
      </div>

      {!gameStarted && !gameFinished && (
        <div className="w-full max-w-xs">
          <div className="flex flex-col gap-2">
            <input
              className="border p-2 rounded-lg"
              placeholder="Enter Room ID"
              value={roomId}
              onChange={(e) => joinRoom(e.target.value)}
            />
            <button
              onClick={() => joinRoom(roomId)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Join Game
            </button>
          </div>
        </div>
      )}

      {gameStarted && !gameFinished && (
        <div className="grid grid-cols-3 gap-2">
          {board.map((cell, index) => (
            <button
              key={index}
              onClick={() => handleMove(index)}
              disabled={!isMyTurn || cell !== null}
              className={`w-20 h-20 text-4xl font-bold border-2 rounded-lg
                ${cell === 'player1' ? 'text-blue-600' : 'text-red-600'}
                ${isMyTurn && !cell ? 'hover:bg-gray-100' : 'cursor-not-allowed'}
                ${cell ? 'border-gray-300' : 'border-gray-400'}`}
            >
              {cell === 'player1' ? 'X' : cell === 'player2' ? 'O' : ''}
            </button>
          ))}
        </div>
      )}

      {gameFinished && (
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={handlePlayAgain}
            disabled={rematchStatus === 'pending'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {rematchStatus === 'pending' ? 'Waiting for opponent...' : 'Play Again'}
          </button>
        </div>
      )}
    </div>
  );
} 