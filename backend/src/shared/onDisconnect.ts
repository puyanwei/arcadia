import { getPlayerRoom } from "../games/tictactoe/state";
import { SocketHandlerParams } from "./types";

export function onDisconnect({ socket, io, gameStates, rematchStates }: SocketHandlerParams) {
    console.log("User disconnected:", socket.id);
    for (const [gameType, gameRooms] of Object.entries(gameStates)) {
      const room = getPlayerRoom(gameRooms, socket.id);
      if (!room) continue;
    //   if (rematchStates) {
    //     delete rematchStates[room.id];
    //   }
  
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
  