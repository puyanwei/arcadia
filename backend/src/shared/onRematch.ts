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
  
    const currentRematchState = room.rematchState;
    if (!currentRematchState) {
      const newRematchState: RematchState = {
        requested: true,
        requestedBy: socket.id,
        status: "pending"
      };
      
      socket.emit("rematchState", { status: "pending", message: "Waiting for opponent to accept...", requestedBy: socket.id });
      socket.to(roomId).emit("rematchState", { status: "pending", message: "Opponent wants a rematch!", requestedBy: socket.id });
      
      room.rematchState = newRematchState;
      return;
    }
  
    if (currentRematchState.requestedBy !== socket.id) {
      room.board = Array(9).fill(null);
      const shouldSwapFirst = Math.random() < 0.5;
      
      io.to(roomId).emit("updateBoard", Array(9).fill(null));
      io.to(roomId).emit("gameStart", shouldSwapFirst);
      
      room.rematchState = { requested: false, requestedBy: '', status: "accepted" };
    }
}