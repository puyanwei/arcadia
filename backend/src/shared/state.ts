import { GameRooms, GameRoom } from "./types";

export function createInitialState(): GameRooms {
  return {
    rooms: {},
    playerNumbers: {},
    playerStatuses: {},
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