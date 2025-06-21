import { GameRooms } from "./types";

export function createInitialState(): GameRooms {
  return {
    rooms: {},
    playerNumbers: {}
  };
} 