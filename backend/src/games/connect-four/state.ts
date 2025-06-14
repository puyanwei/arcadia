import { GameRooms, GameRoom, PlayerNumber, ConnectFourCell, ConnectFourBoard } from '../../shared/types';

export function createInitialStateCF(): GameRooms {
  return {
    rooms: {},
    playerNumbers: {}
  };
}

export function getPlayerRoom(gameRooms: GameRooms, playerId: string): GameRoom | undefined {
  for (const room of Object.values(gameRooms.rooms)) {
    if (room.players.includes(playerId)) {
      return room;
    }
  }
  return undefined;
}

export function assignPlayerNumber(gameRooms: GameRooms, room: GameRoom, playerId: string): void {
  if (room.players.length === 1) {
    gameRooms.playerNumbers[playerId] = 'player1';
  } else if (room.players.length === 2) {
    gameRooms.playerNumbers[playerId] = 'player2';
  }
}

export function isLowestEmptyCellInColumn(board: ConnectFourBoard, col: number, rows: number): boolean {
  for (let row = rows - 1; row >= 0; row--) {
    const idx = row * 7 + col;
    if (board[idx] === 'valid') return true;
  }
  return false;
}

export function getLowestEmptyCellInColumn(board: ConnectFourBoard, col: number, rows: number): number | null {
  for (let row = rows - 1; row >= 0; row--) {
    const idx = row * 7 + col;
    if (board[idx] === 'valid') return idx;
  }
  return null;
}

export function checkLine(board: ConnectFourBoard, startIdx: number, step: number): ConnectFourCell | null {
  const first = board[startIdx];
  if (first === 'valid' || first === 'invalid') return null;
  
  for (let i = 1; i < 4; i++) {
    if (board[startIdx + step * i] !== first) return null;
  }
  return first;
}

export function checkWinnerCF(board: ConnectFourBoard, columns: number, rows: number): ConnectFourCell | 'draw' | null {
  // Check horizontal
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col <= columns - 4; col++) {
      const winner = checkLine(board, row * columns + col, 1);
      if (winner) return winner;
    }
  }

  // Check vertical
  for (let row = 0; row <= rows - 4; row++) {
    for (let col = 0; col < columns; col++) {
      const winner = checkLine(board, row * columns + col, columns);
      if (winner) return winner;
    }
  }

  // Check diagonal (down-right)
  for (let row = 0; row <= rows - 4; row++) {
    for (let col = 0; col <= columns - 4; col++) {
      const winner = checkLine(board, row * columns + col, columns + 1);
      if (winner) return winner;
    }
  }

  // Check diagonal (down-left)
  for (let row = 0; row <= rows - 4; row++) {
    for (let col = 3; col < columns; col++) {
      const winner = checkLine(board, row * columns + col, columns - 1);
      if (winner) return winner;
    }
  }

  // Check for draw
  if (!board.includes('valid')) return 'draw';
  return null;
}
