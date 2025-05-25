import { Socket, Server } from "socket.io";
import { GameRoom, GameRooms, GameType, PlayerNumber, ClientData } from "./types";

type JoinRoomParams = {
  data: ClientData;
  gameStates: Record<string, GameRooms>;
  socket: Socket;
  io: Server;
}

export async function onJoinRoom({ data, gameStates, socket, io }: JoinRoomParams) {
  try {
    if (!data) return;
    const { gameType, roomId } = data;
    await checkIfGameExists(gameType, gameStates, socket);

    // Gets the game states for all rooms of that game type
    const gameRooms = gameStates[gameType];
    if (!gameRooms) {
      socket.emit("error", "Game states not found");
      return;
    }

    // Gets the specific room from the game states
    let room = gameRooms.rooms[roomId];
    if (!room) {
      room = {
        id: roomId,
        players: [],
        board: Array(9).fill(null)
      };
      console.log(`[onJoinRoom] Created new room: ${roomId}`);
    }

    if (room.players.length >= 2) {
      console.log(`[onJoinRoom] Room ${roomId} is full. Player ${socket.id} denied.`);
      socket.emit("error", "Room is full");
      return;
    }

    room.players.push(socket.id);
    console.log(`[onJoinRoom] Player ${socket.id} joined room ${roomId}. Players now: ${room.players.length}`);
    gameRooms.rooms[roomId] = room;
    
    const { currentPlayer, otherPlayer } = assignPlayerNumber(room, gameRooms, socket.id);

    socket.join(roomId);
    socket.emit("playerNumber", { currentPlayer, otherPlayer });
    io.to(roomId).emit("playerJoined", room.players.length);
    
    if (room.players.length === 2) {
      console.log(`[onJoinRoom] Room ${roomId} now has 2 players. Emitting gameStart.`);
      io.to(roomId).emit("gameStart", true);
    }
  } catch (error) {
    socket.emit("error", error instanceof Error ? error.message : "An error occurred");
  }
}

function checkIfRoomIsFull(room: GameRoom, socket: Socket) {
  if (room.players.length >= 2) {
    socket.emit("error", "Room is full");
    return;
  }
  return 
}

function assignPlayerNumber(room: GameRoom, gameRooms: GameRooms, socketId: string): { currentPlayer: PlayerNumber, otherPlayer: PlayerNumber | null } {
  let currentPlayer: PlayerNumber;
  let otherPlayer: PlayerNumber | null = null;

  if (room.players.length === 0) {
    currentPlayer = Math.random() < 0.5 ? "player1" : "player2";
  } else {
    const firstPlayerNumber = gameRooms.playerNumbers[room.players[0]];
    currentPlayer = firstPlayerNumber === "player1" ? "player2" : "player1";
    otherPlayer = firstPlayerNumber;
  }
  
  gameRooms.playerNumbers[socketId] = currentPlayer;
  return { currentPlayer, otherPlayer };
}

export function getPlayerRoom(gameRooms: GameRooms, playerId: string): GameRoom | null {
  for (const room of Object.values(gameRooms.rooms)) {
    if (room.players.includes(playerId)) {
      return room;
    }
  }
  return null;
};

export function validateGameType(gameType: string): gameType is GameType {
  return gameType === 'tictactoe' || gameType === 'connect-four';
}

export function checkIfGameExists(gameType: GameType, gameStates: Record<string, GameRooms>, socket: Socket) {
  if (!validateGameType(gameType)) {
    socket.emit("error", "Invalid game type");
    return;
  }
  const gameRooms = gameStates[gameType];
  if (!gameRooms) {
    socket.emit("error", "Game states not found");
    return;
  }
}
