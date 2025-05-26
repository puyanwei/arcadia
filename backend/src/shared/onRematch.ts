import { SocketHandlerParams } from "./types";
import { RematchState } from "./types";

export function onRematch({ data, socket, io, gameStates }: SocketHandlerParams) {
    if (!data) return;
    const { gameType, roomId } = data;
    const gameRooms = gameStates[gameType];
    if (!gameRooms) {
      socket.emit("error", "Game state not found");
      return;
    }
    const room = gameRooms.rooms[roomId];
    if (!room) return;
  
    const clientId = socket.handshake.auth && socket.handshake.auth.clientId ? socket.handshake.auth.clientId : socket.id;
    const currentRematchState = room.rematchState;
    if (!currentRematchState) {
      const newRematchState: RematchState = {
        requested: true,
        requestedBy: clientId,
        status: "pending"
      };
      
      socket.emit("rematchState", { status: "pending", message: "Waiting for opponent to accept...", requestedBy: clientId });
      socket.to(roomId).emit("rematchState", { status: "pending", message: "Opponent wants a rematch!", requestedBy: clientId });
      
      room.rematchState = newRematchState;
      return;
    }
  
    if (currentRematchState.requestedBy !== clientId) {
      room.board = Array(9).fill(null);
      const shouldSwapFirst = Math.random() < 0.5;
      
      io.to(roomId).emit("updateBoard", Array(9).fill(null));
      io.to(roomId).emit("gameStart", shouldSwapFirst);
      
      room.rematchState = { requested: false, requestedBy: '', status: "accepted" };
    }
}