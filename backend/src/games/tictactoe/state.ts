import { GameState, GameRoom } from '../index';
import { Board, PlayerSymbol } from './types'

function shuffleSymbols(): ["X", "O"] | ["O", "X"] {
  return Math.random() < 0.5 ? ["X", "O"] : ["O", "X"];
}

export const createInitialState = (): GameState => ({
  rooms: new Map<string, GameRoom>(),
  playerSymbols: new Map<string, PlayerSymbol>()
});

export const getPlayerRoom = (gameState: GameState, playerId: string): GameRoom | null => {
  for (const room of gameState.rooms.values()) {
    if (room.players.includes(playerId)) {
      return room;
    }
  }
  return null;
};

export const getPlayerSymbol = (gameState: GameState, playerId: string): PlayerSymbol | null => {
  return gameState.playerSymbols.get(playerId) || null;
};

export const assignPlayerSymbol = (gameState: GameState, room: GameRoom, playerId: string): PlayerSymbol => {
  let symbol: PlayerSymbol;
  if (room.players.length === 0) {
    const [firstSymbol] = shuffleSymbols();
    symbol = firstSymbol;
  } else {
    const firstPlayerSymbol = gameState.playerSymbols.get(room.players[0]);
    symbol = firstPlayerSymbol === "X" ? "O" : "X";
  }
  gameState.playerSymbols.set(playerId, symbol);
  return symbol;
};

export const checkWinner = (board: Board): string | null => {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6] // diagonals
  ];

  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }

  return board.every(cell => cell) ? 'draw' : null;
}; 