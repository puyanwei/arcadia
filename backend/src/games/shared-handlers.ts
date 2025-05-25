import { Socket, Server } from "socket.io";
import { getPlayerRoom } from "./tictactoe/state";
import { RematchState, PlayerNumber, GameType, GameRooms, ClientData } from "../shared/types";
import { handleMove } from "./tictactoe/handlers";
  




export function onMove({ data, socket, io, gameStates }: SocketHandlerParams) {
  const { gameType, roomId, playerNumber, board } = data;
  const gameRooms = gameStates[gameType];
  if (!gameRooms) {
    socket.emit("error", "Game state not found");
    return;
  }
  const room = getPlayerRoom(gameRooms, socket.id);
  if (!room || room.id !== roomId) {
    socket.emit("error", "You are not in this room");
    return;
  }

  if (gameType === 'tictactoe') {
    return handleMove({ gameRooms, roomId, playerNumber, move: { board }, socket, io });
  }
  throw new Error("Invalid game type");
}

export function onDisconnect({ socket, io, gameStates, rematchStates }: SocketHandlerParams) {
  console.log("User disconnected:", socket.id);
  for (const [gameType, gameRooms] of Object.entries(gameStates)) {
    const room = getPlayerRoom(gameRooms, socket.id);
    if (!room) continue;
    if (rematchStates) {
      delete rematchStates[room.id];
    }

    room.players = room.players.filter(id => id !== socket.id);
    if (room.players.length === 0) {
      delete gameRooms.rooms[room.id];
    }
    delete gameRooms.playerNumbers[socket.id];

    if (gameRooms.rooms[room.id]) {
      io.to(room.id).emit("playerLeft", "Opponent left the game");
      io.to(room.id).emit("gameEnd", { winner: 'disconnect', message: "Opponent left the game" });
    }
  }
}

export function onPlayAgain({ data, socket, io, gameStates, rematchStates }: SocketHandlerParams) {
  const { gameType, roomId } = data;
  const gameRooms = gameStates[gameType];
  if (!gameRooms) {
    socket.emit("error", "Game state not found");
    return;
  }
  const room = gameRooms.rooms[roomId];
  if (!room) return;

  const currentRematchState = rematchStates?.[roomId];
  if (!currentRematchState) {
    const newRematchState: RematchState = {
      requested: true,
      requestedBy: socket.id,
      status: "waiting"
    };
    
    socket.emit("rematchState", { status: "waiting", message: "Waiting for opponent to accept..." });
    socket.to(roomId).emit("rematchState", { status: "pending", message: "Opponent wants a rematch!" });
    
    if (rematchStates) {
      rematchStates[roomId] = newRematchState;
    }
    return;
  }

  if (currentRematchState.requestedBy !== socket.id) {
    room.board = Array(9).fill(null);
    const shouldSwapFirst = Math.random() < 0.5;
    
    io.to(roomId).emit("updateBoard", Array(9).fill(null));
    io.to(roomId).emit("gameStart", shouldSwapFirst);
    
    if (rematchStates) {
      delete rematchStates[roomId];
    }
  }
}

export function checkIfPlayerIsInRoom(gameType: GameType, gameStates: Record<string, GameRooms>, socket: Socket, roomId: string) {
  const gameRooms = gameStates[gameType];
  if (!gameRooms) {
    socket.emit("error", "Game state not found");
    return;
  }
  const room = getPlayerRoom(gameRooms, socket.id);
  if (!room || room.id !== roomId) {
    socket.emit("error", "You are not in this room");
    return;
  }
}

export function getPlayerNumber(gameRooms: GameRooms, playerId: string): PlayerNumber | null {
  return gameRooms.playerNumbers[playerId] || null;
}

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
