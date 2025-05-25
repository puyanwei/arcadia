import { getPlayerRoom } from "./onJoinRoom";
import { SocketHandlerParams } from "./types";

export function onDisconnect({ socket, io, gameStates }: SocketHandlerParams) {
    console.log("User disconnected:", socket.id);
    for (const [gameType, gameRooms] of Object.entries(gameStates)) {
      const room = getPlayerRoom(gameRooms, socket.id);
      if (!room) continue;
      room.rematchState = undefined;
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
  