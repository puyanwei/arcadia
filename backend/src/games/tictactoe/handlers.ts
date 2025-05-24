import { GameState } from '../index';
import { Server, Socket } from 'socket.io';
import { assignPlayerNumber } from './state';
import { Board, RematchState } from './types';

export const handleJoinRoom = (gameState: GameState, roomId: string, playerId: string): GameState => {
  let room = gameState.rooms.get(roomId);
  if (!room) {
    room = {
      id: roomId,
      players: [],
      board: Array(9).fill(null)
    };
  }

  if (room.players.length >= 2) {
    throw new Error('Room is full');
  }

  room.players.push(playerId);
  gameState.rooms.set(roomId, room);
  assignPlayerNumber(gameState, room, playerId);
  return gameState;
};

export const handleMakeMove = (gameState: GameState, roomId: string, playerId: string, move: { board: Board }): GameState => {
  const room = gameState.rooms.get(roomId);
  if (!room) throw new Error('Room not found');
  
  // Validate board
  if (!Array.isArray(move.board) || move.board.length !== 9) {
    throw new Error('Invalid board state');
  }
  
  if (!move.board.every(cell => cell === null || cell === 'player1' || cell === 'player2')) {
    throw new Error('Invalid board values');
  }

  room.board = move.board;
  return gameState;
};

export const handlePlayAgain = (gameState: GameState, roomId: string, playerId: string): GameState => {
  const room = gameState.rooms.get(roomId);
  if (!room) throw new Error('Room not found');

  room.board = Array(9).fill(null);
  return gameState;
};

export const handleRematch = (
  gameState: GameState,
  roomId: string,
  playerId: string,
  currentRematchState: RematchState | undefined,
  socket: Socket,
  io: Server
): { newGameState: GameState; newRematchState?: RematchState } => {
  if (!currentRematchState) {
    const newRematchState: RematchState = {
      requested: true,
      requestedBy: playerId,
      status: "waiting"
    };
    
    socket.emit("rematchState", { status: "waiting", message: "Waiting for opponent to accept..." });
    socket.to(roomId).emit("rematchState", { status: "pending", message: "Opponent wants a rematch!" });
    
    return { newGameState: gameState, newRematchState };
  }

  if (currentRematchState.requestedBy !== playerId) {
    const newGameState = handlePlayAgain(gameState, roomId, playerId);
    const shouldSwapFirst = Math.random() < 0.5;
    
    io.to(roomId).emit("updateBoard", Array(9).fill(null));
    io.to(roomId).emit("gameStart", shouldSwapFirst);
    
    return { newGameState };
  }

  return { newGameState: gameState };
};

export const handleDisconnect = (gameState: GameState, roomId: string, playerId: string): GameState => {
  const room = gameState.rooms.get(roomId);
  if (!room) return gameState;

  room.players = room.players.filter(id => id !== playerId);
  if (room.players.length === 0) {
    gameState.rooms.delete(roomId);
  }
  gameState.playerNumbers.delete(playerId);
  return gameState;
};

export const emitGameState = (io: Server, gameState: GameState, roomId: string): void => {
  const room = gameState.rooms.get(roomId);
  if (room) {
    io.to(roomId).emit("playerJoined", room.players.length);
    if (room.players.length === 2) {
      io.to(roomId).emit("gameStart", true);
    }
  }
}; 