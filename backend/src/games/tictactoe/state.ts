import { GameRoom, GameRooms, Board, PlayerNumber } from '../../shared/types';

export function checkEndOfGame(board: Board): PlayerNumber | 'draw' | null {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6]             // diagonals
  ];

  for (const line of lines) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a] as PlayerNumber; // Return winner if found
    }
  }

  // If no winner, check for a draw (board is full)
  if (board.every(cell => cell !== null)) {
    return 'draw';
  }

  // Otherwise, the game is still ongoing
  return null;
}

export function assignPlayerNumber(gameRooms: GameRooms, room: GameRoom, clientId: string): void {
  // If this is the first player, assign a random number and store it.
  if (room.players.length === 1) {
    const playerNumber = Math.random() < 0.5 ? "player1" : "player2";
    gameRooms.playerNumbers[clientId] = playerNumber;
    return;
  } 
  
  // If this is the second player, find the other player's number and assign the opposite.
  const otherPlayerId = room.players.find(id => id !== clientId);
  if (!otherPlayerId) {
    // This should not happen, but as a fallback, assign a random number.
    const playerNumber = Math.random() < 0.5 ? "player1" : "player2";
    gameRooms.playerNumbers[clientId] = playerNumber;
    return;
  }

  const otherPlayerNumber = gameRooms.playerNumbers[otherPlayerId];
  const currentPlayerNumber = otherPlayerNumber === "player1" ? "player2" : "player1";
  gameRooms.playerNumbers[clientId] = currentPlayerNumber;
} 