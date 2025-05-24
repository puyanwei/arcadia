import { Socket, Server } from "socket.io";
import { GameHandler, gameHandlers, GameState, GameType } from "./gameMapper";
import { getPlayerRoom } from "./tictactoe/state";
import { RematchState, PlayerNumber } from "./types";
  
  type SocketHandlerParams = {
    socket: Socket;
    io: Server;
    gameStates: Map<string, GameState>;
    gameHandlers: Record<string, GameHandler>;
    emitGameState?: Function;
    rematchStates?: Map<string, RematchState>;
    data?: SocketHandlerData;
  };
  
  type SocketHandlerData = { gameType: GameType, roomId: string, board?: any };
  
  export function onJoinRoom({ data, socket, io, gameStates, gameHandlers }: SocketHandlerParams) {
    const { gameType, roomId } = data;
    if (!validateGameType(gameType)) {
      socket.emit("error", "Invalid game type");
      return;
    }
    const handler = gameHandlers[gameType];
    if (!handler) {
      socket.emit("error", "Invalid game handler");
      return;
    }
    try {
      const gameState = gameStates.get(gameType);
      if (!gameState) {
        socket.emit("error", "Game state not found");
        return;
      }
      const newGameState = handler.handleJoinRoom(gameState, roomId, socket.id);
      gameStates.set(gameType, newGameState);
      socket.join(roomId);
      const playerNumber = getPlayerNumber(newGameState, socket.id);
      if (playerNumber) {
        socket.emit("playerNumber", playerNumber);
      }
    } catch (error) {
      socket.emit("error", error.message);
    }
  }

  export function onPlayAgain({ data, socket, io, gameStates, gameHandlers, rematchStates }: SocketHandlerParams) {
    const { gameType, roomId } = data;
    const gameState = gameStates.get(gameType);
    if (!gameState) {
      socket.emit("error", "Game state not found");
      return;
    }
    const room = gameState.rooms.get(roomId);
    if (!room) return;
    const currentRematchState = rematchStates?.get(roomId);
    const { newGameState, newRematchState } = gameHandlers[gameType].handleRematch(
      gameState,
      roomId,
      socket.id,
      currentRematchState,
      socket,
      io
    );
    gameStates.set(gameType, newGameState);
    if (newRematchState) {
      rematchStates?.set(roomId, newRematchState);
    } else {
      rematchStates?.delete(roomId);
    }
  }
  
  export function onMakeMove({ data, socket, io, gameStates, gameHandlers }: SocketHandlerParams) {
    const { gameType, roomId, board } = data;
    const room = getPlayerRoom(gameStates.get(gameType)!, socket.id);
    if (!room || room.id !== roomId) {
      socket.emit("error", "You are not in this room");
      return;
    }
    const handler = gameHandlers[gameType];
    if (!handler) {
      socket.emit("error", "Game not found");
      return;
    }
    const newGameState = handler.handleMakeMove(gameStates.get(gameType)!, roomId, socket.id, { board });
    gameStates.set(gameType, newGameState);
    socket.to(roomId).emit("updateBoard", board);
    
    const result = handler.checkGameResult(board);
    if (!result) return;
  
    if (result.type === 'draw') {
      io.to(roomId).emit("gameEnd", { 
        winner: 'draw', 
        message: result.message
      });
    } else {
      room.players.forEach(playerId => {
        const playerNumber = handler.getPlayerNumber(gameStates.get(gameType)!, playerId);
        const isWinner = playerNumber === result.winner;
        io.to(playerId).emit("gameEnd", {
          winner: result.winner,
          message: isWinner ? "You won!" : "You lost!"
        });
      });
    }
  }
  
  export function onDisconnect({ socket, io, gameStates, gameHandlers, rematchStates }: SocketHandlerParams) {
    console.log("User disconnected:", socket.id);
    for (const [gameType, gameState] of gameStates.entries()) {
      const room = getPlayerRoom(gameState, socket.id);
      if (!room) continue;
      rematchStates?.delete(room.id);
      const handler = gameHandlers[gameType];
      if (!handler) continue;
      const newGameState = handler.handleDisconnect(gameState, room.id, socket.id);
      gameStates.set(gameType, newGameState);
      if (gameStates.get(gameType)!.rooms.has(room.id)) {
            io.to(room.id).emit("playerLeft", "Opponent left the game");
            io.to(room.id).emit("gameEnd", { winner: 'disconnect', message: "Opponent left the game" });
          }
    }
  }

  export function getPlayerNumber(gameState: GameState, playerId: string): PlayerNumber | null {
    return gameState.playerNumbers.get(playerId) || null;
  };

  function validateGameType(gameType: string): gameType is GameType {
    return gameType in gameHandlers;
  }

