import { SocketHandlerParams } from "./types";
import { RematchState } from "./types";

export function onRematch({ data, socket, io, gameStates, clientSocketMap }: SocketHandlerParams) {
    if (!data?.clientId) return;
    const { gameType, roomId, clientId } = data;
    console.log("Backend onRematch called:", { gameType, roomId, clientId });
    
    const gameRooms = gameStates[gameType];
    if (!gameRooms) {
      console.log("Backend onRematch - game state not found for:", gameType);
      socket.emit("error", "Game state not found");
      return;
    }
    const room = gameRooms.rooms[roomId];
    if (!room) {
      console.log("Backend onRematch - room not found:", roomId);
      return;
    }
  
    const currentRematchState = room.rematchState;
    console.log("Backend onRematch - current state:", {
      clientId,
      currentRematchState,
      roomPlayers: room.players
    });
    
    if (!currentRematchState) {
      const newRematchState: RematchState = {
        requested: true,
        requestedBy: clientId,
        status: "pending"
      };
      
      console.log("Backend onRematch - first player requesting rematch:", { clientId, newRematchState });
      
      // First player gets "waiting" status, opponent gets "pending" status
      socket.emit("rematchState", { status: "waiting", message: "Waiting for opponent to accept...", requestedBy: clientId });
      socket.to(roomId).emit("rematchState", { status: "pending", message: "Opponent wants a rematch!", requestedBy: clientId });
      
      room.rematchState = newRematchState;
      return;
    }
  
    if (currentRematchState.requestedBy !== clientId) {
      console.log("Backend onRematch - second player accepting rematch:", { clientId, currentRematchState });
      
      // Reset rematch state first
      room.rematchState = { requested: false, requestedBy: '', status: "accepted" };
      
      // Emit rematch accepted to both players first
      console.log("Backend onRematch - emitting rematch accepted");
      io.to(roomId).emit("rematchState", { status: "accepted", message: "Rematch accepted! Game starting...", requestedBy: '' });
      
      // Reset board based on game type
      if (gameType === "tictactoe") {
        room.board = Array(9).fill(null);
      } else if (gameType === "connect-four") {
        room.board = Array(42).fill('valid');
      }
      
      const shouldSwapFirst = Math.random() < 0.5;
      const newFirstPlayer = shouldSwapFirst ? room.players.find(p => p !== room.firstPlayer) : room.firstPlayer;
      room.firstPlayer = newFirstPlayer;
      room.currentPlayer = newFirstPlayer;
      
      // Emit game start events
      console.log("Backend onRematch - emitting game start events:", { gameType, newFirstPlayer });
      if (gameType === "tictactoe") {
        io.to(roomId).emit("updateBoard", { board: Array(9).fill(null), currentPlayer: room.currentPlayer });
      } else if (gameType === "connect-four") {
        io.to(roomId).emit("updateBoard", { board: Array(42).fill('valid'), currentPlayer: room.currentPlayer });
      }
      io.to(roomId).emit("gameStart", { firstPlayer: room.firstPlayer });
      
      console.log("Backend onRematch - rematch completed, new state:", room.rematchState);
    } else {
      console.log("Backend onRematch - same player trying to accept their own rematch:", clientId);
    }
}