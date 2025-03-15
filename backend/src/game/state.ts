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

export function addPlayerToRoom(state: GameState, roomId: RoomId, playerId: PlayerId): GameState {
  const room = state.rooms.get(roomId) || createRoom(roomId);
  
  if (room.players.length >= 2) return state;
  
  const symbol: PlayerSymbol = room.players.length === 0 ? "X" : "O";
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