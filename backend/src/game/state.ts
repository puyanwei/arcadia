import { GameState, Room, RoomId, PlayerId, PlayerSymbol } from './types';

export function createInitialState(): GameState {
  return {
    rooms: new Map(),
    playerSymbols: new Map()
  };
}

export function createRoom(roomId: RoomId): Room {
  return {
    id: roomId,
    players: [],
    board: Array(9).fill(null)
  };
}

function shuffleSymbols(): ["X", "O"] | ["O", "X"] {
  return Math.random() < 0.5 ? ["X", "O"] : ["O", "X"];
}

export function addPlayerToRoom(state: GameState, roomId: RoomId, playerId: PlayerId): GameState {
  const room = state.rooms.get(roomId) || createRoom(roomId);
  
  if (room.players.length >= 2) return state;
  
  // If this is the first player, randomly assign X or O
  let symbol: PlayerSymbol;
  if (room.players.length === 0) {
    const [firstSymbol] = shuffleSymbols();
    symbol = firstSymbol;
  } else {
    // Second player gets the opposite symbol
    const firstPlayerSymbol = state.playerSymbols.get(room.players[0]);
    symbol = firstPlayerSymbol === "X" ? "O" : "X";
  }

  const updatedRoom = {
    ...room,
    players: [...room.players, playerId]
  };

  return {
    rooms: new Map(state.rooms).set(roomId, updatedRoom),
    playerSymbols: new Map(state.playerSymbols).set(playerId, symbol)
  };
}

export function removePlayerFromRoom(state: GameState, roomId: RoomId, playerId: PlayerId): GameState {
  const room = state.rooms.get(roomId);
  if (!room) return state;

  const updatedRoom = {
    ...room,
    players: room.players.filter(id => id !== playerId)
  };

  const newRooms = new Map(state.rooms);
  if (updatedRoom.players.length === 0) {
    newRooms.delete(roomId);
  } else {
    newRooms.set(roomId, updatedRoom);
  }

  const newPlayerSymbols = new Map(state.playerSymbols);
  newPlayerSymbols.delete(playerId);

  return {
    rooms: newRooms,
    playerSymbols: newPlayerSymbols
  };
}

export function updateBoard(state: GameState, roomId: RoomId, board: (PlayerSymbol | null)[]): GameState {
  const room = state.rooms.get(roomId);
  if (!room) return state;

  const updatedRoom = {
    ...room,
    board
  };

  return {
    ...state,
    rooms: new Map(state.rooms).set(roomId, updatedRoom)
  };
}

export function isPlayerInAnyRoom(state: GameState, playerId: PlayerId): boolean {
  return Array.from(state.rooms.values()).some(room => 
    room.players.includes(playerId)
  );
}

export function getPlayerRoom(state: GameState, playerId: PlayerId): Room | undefined {
  return Array.from(state.rooms.values()).find(room => 
    room.players.includes(playerId)
  );
}

export function getPlayerSymbol(state: GameState, playerId: PlayerId): PlayerSymbol | undefined {
  return state.playerSymbols.get(playerId);
}

export function checkWinner(board: (string | null)[]): string | null {
  // Check rows
  for (let i = 0; i < 9; i += 3) {
    if (board[i] && board[i] === board[i + 1] && board[i] === board[i + 2]) {
      return board[i];
    }
  }

  // Check columns
  for (let i = 0; i < 3; i++) {
    if (board[i] && board[i] === board[i + 3] && board[i] === board[i + 6]) {
      return board[i];
    }
  }

  // Check diagonals
  if (board[0] && board[0] === board[4] && board[0] === board[8]) {
    return board[0];
  }
  if (board[2] && board[2] === board[4] && board[2] === board[6]) {
    return board[2];
  }

  // Check for draw - make sure all cells are filled
  const isDraw = board.every(cell => cell !== null);
  if (isDraw) {
    return 'draw';
  }

  return null;
} 