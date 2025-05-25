import { GameRooms, GameRoom, Board, PlayerNumber } from '../../shared/types';

export function createInitialStateTTT(): GameRooms {
  return {
    rooms: {},
    playerNumbers: {}
  };
}

export function checkWinnerTTT(board: Board): string | null {
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

function shuffleNumbers(): ["player1", "player2"] | ["player2", "player1"] {
  return Math.random() < 0.5 ? ["player1", "player2"] : ["player2", "player1"];
}

export const getPlayerRoom = (gameRooms: GameRooms, playerId: string): GameRoom | null => {
  for (const room of Object.values(gameRooms.rooms)) {
    if (room.players.includes(playerId)) {
      return room;
    }
  }
  return null;
};

export const assignPlayerNumber = (gameRooms: GameRooms, room: GameRoom, playerId: string): PlayerNumber => {
  let number: PlayerNumber;
  if (room.players.length === 0) {
    const [firstNumber] = shuffleNumbers();
    number = firstNumber;
  } else {
    const firstPlayerNumber = gameRooms.playerNumbers[room.players[0]];
    number = firstPlayerNumber === "player1" ? "player2" : "player1";
  }
  gameRooms.playerNumbers[playerId] = number;
  return number;
};

