import { GameRooms, GameRoom, Board, PlayerNumber } from '../../shared/types';

export function createInitialState(): GameRooms {
  return {
    rooms: {},
    playerNumbers: {}
  };
}

export function checkWinner(board: Board): PlayerNumber | 'draw' | null {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6]             // diagonals
  ];

  for (const line of lines) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a] as PlayerNumber;
    }
  }

  if (board.every(cell => cell !== null)) {
    return 'draw';
  }

  return null;
}

function shuffleNumbers(): ["player1", "player2"] | ["player2", "player1"] {
  return Math.random() < 0.5 ? ["player1", "player2"] : ["player2", "player1"];
}

export function assignPlayerNumber(gameRooms: GameRooms, room: GameRoom, playerId: string): PlayerNumber {
  const firstPlayerNumber = gameRooms.playerNumbers[room.players[0]];
  const number = firstPlayerNumber === 'player1' ? 'player2' : 'player1';
  gameRooms.playerNumbers[playerId] = number;
  return number;
}

