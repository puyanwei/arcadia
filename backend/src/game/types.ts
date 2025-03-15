export type PlayerSymbol = "X" | "O";
export type Board = (PlayerSymbol | null)[];
export type PlayerId = string;
export type RoomId = string;

export type Room = {
  id: RoomId;
  players: PlayerId[];
  board: Board;
}

export type GameState = {
  rooms: Map<RoomId, Room>;
  playerSymbols: Map<PlayerId, PlayerSymbol>;
} 