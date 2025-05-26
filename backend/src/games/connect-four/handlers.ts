import { Server, Socket } from 'socket.io';
import { assignPlayerNumber } from './state';
import { ConnectFourBoard, GameRoom, PlayerNumber, GameRooms } from '../../shared/types';
import { RematchState } from '../../shared/types';

export function handleJoinRoomCF(gameRooms: GameRooms, roomId: string, playerId: string): GameRooms {
  let room = gameRooms.rooms[roomId];
  if (!room) {
    room = {
      id: roomId,
      players: [],
      board: Array(42).fill('valid') as ConnectFourBoard
    };
  }

  if (room.players.length >= 2) {
    throw new Error('Room is full');
  }

  room.players.push(playerId);
  gameRooms.rooms[roomId] = room;
  assignPlayerNumber(gameRooms, room, playerId);
  return gameRooms;
};

export function handleMakeMoveCF(gameRooms: GameRooms, roomId: string, playerId: string, move: { board: ConnectFourBoard }): GameRooms {
  const room = gameRooms.rooms[roomId];
  if (!room) throw new Error('Room not found');
  
  // Validate board
  if (!Array.isArray(move.board) || move.board.length !== 42) {
    throw new Error('Invalid board state');
  }
  
  if (!move.board.every(cell => cell === 'player1' || cell === 'player2' || cell === 'valid' || cell === 'invalid')) {
    throw new Error('Invalid board values');
  }

  room.board = move.board;
  return gameRooms;
};

export function handlePlayAgainCF(gameRooms: GameRooms, roomId: string, playerId: string): GameRooms {
  const room = gameRooms.rooms[roomId];
  if (!room) throw new Error('Room not found');

  room.board = Array(42).fill('valid') as ConnectFourBoard;
  return gameRooms;
};

export function handleRematchCF(
  gameRooms: GameRooms,
  roomId: string,
  playerId: string,
  currentRematchState: RematchState | undefined,
  socket: Socket,
  io: Server
): { newGameRooms: GameRooms; newRematchState?: RematchState } {
  if (!currentRematchState) {
    const newRematchState: RematchState = {
      requested: true,
      requestedBy: playerId,
      status: "pending"
    };
    
    socket.emit("rematchState", { status: "waiting", message: "Waiting for opponent to accept..." });
    socket.to(roomId).emit("rematchState", { status: "pending", message: "Opponent wants a rematch!" });
    
    return { newGameRooms: gameRooms, newRematchState };
  }

  if (currentRematchState.requestedBy !== playerId) {
    const newGameRooms = handlePlayAgainCF(gameRooms, roomId, playerId);
    
    io.to(roomId).emit("updateBoard", Array(42).fill('valid') as ConnectFourBoard);
    io.to(roomId).emit("gameStart", true);
    
    return { newGameRooms };
  }

  return { newGameRooms: gameRooms };
};

export function handleDisconnectCF(gameRooms: GameRooms, roomId: string, playerId: string): GameRooms {
  const room = gameRooms.rooms[roomId];
  if (!room) return gameRooms;

  room.players = room.players.filter((id: string) => id !== playerId);
  if (room.players.length === 0) {
    delete gameRooms.rooms[roomId];
  }
  delete gameRooms.playerNumbers[playerId];
  return gameRooms;
};