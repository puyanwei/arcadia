import { Server, Socket } from 'socket.io';
import { assignPlayerNumber, checkWinnerTTT } from './state';
import { Board, RematchState, PlayerNumber, GameRooms } from '../../shared/types';

export function handleJoinRoomTTT(gameRooms: GameRooms, roomId: string, playerId: string): GameRooms {
  let room = gameRooms.rooms[roomId];
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
  gameRooms.rooms[roomId] = room;
  assignPlayerNumber(gameRooms, room, playerId);
  return gameRooms;
}

type HandleMoveParams = {
  gameRooms: GameRooms;
  roomId: string;
  playerNumber: PlayerNumber;
  move: { board: Board };
  socket: Socket;
  io: Server;
}

export function handleMove({ gameRooms, roomId, playerNumber, move, socket, io }: HandleMoveParams): { newGameRooms: GameRooms } {
  const room = gameRooms.rooms[roomId];
  if (!room) throw new Error('Room not found');
  
  // Validate board
  if (!Array.isArray(move.board) || move.board.length !== 9) {
    throw new Error('Invalid board state');
  }
  
  if (!move.board.every(cell => cell === null || cell === 'player1' || cell === 'player2')) {
    throw new Error('Invalid board values');
  }

  room.board = move.board;
  socket.to(roomId).emit("updateBoard", move.board);
  
  const result = checkWinnerTTT(move.board);
  if (!result) return { newGameRooms: gameRooms };

  if (result === 'draw') {
    io.to(roomId).emit("gameEnd", { 
      winner: 'draw', 
      message: 'Game ended in a draw!'
    });
  } else {
    room.players.forEach(playerId => {
      const playerNumber = gameRooms.playerNumbers[playerId];
      const isWinner = playerNumber === result;
      io.to(playerId).emit("gameEnd", {
        winner: result,
        message: isWinner ? "You won!" : "You lost!"
      });
    });
  }

  return { newGameRooms: gameRooms };
}

export function handlePlayAgainTTT(gameRooms: GameRooms, roomId: string, playerId: string): GameRooms {
  const room = gameRooms.rooms[roomId];
  if (!room) throw new Error('Room not found');

  room.board = Array(9).fill(null);
  return gameRooms;
}

export function handleRematchTTT(
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
      status: "waiting"
    };
    
    socket.emit("rematchState", { status: "waiting", message: "Waiting for opponent to accept..." });
    socket.to(roomId).emit("rematchState", { status: "pending", message: "Opponent wants a rematch!" });
    
    return { newGameRooms: gameRooms, newRematchState };
  }

  if (currentRematchState.requestedBy !== playerId) {
    const newGameRooms = handlePlayAgainTTT(gameRooms, roomId, playerId);
    const shouldSwapFirst = Math.random() < 0.5;
    
    io.to(roomId).emit("updateBoard", Array(9).fill(null));
    io.to(roomId).emit("gameStart", shouldSwapFirst);
    
    return { newGameRooms };
  }

  return { newGameRooms: gameRooms };
}

export function handleDisconnectTTT(gameRooms: GameRooms, roomId: string, playerId: string): GameRooms {
  const room = gameRooms.rooms[roomId];
  if (!room) return gameRooms;

  room.players = room.players.filter(id => id !== playerId);
  if (room.players.length === 0) {
    delete gameRooms.rooms[roomId];
  }
  delete gameRooms.playerNumbers[playerId];
  return gameRooms;
}

export function emitGameStateTTT(io: Server, gameRooms: GameRooms, roomId: string): void {
  const room = gameRooms.rooms[roomId];
  if (room) {
    io.to(roomId).emit("playerJoined", room.players.length);
    if (room.players.length === 2) {
      io.to(roomId).emit("gameStart", true);
    }
  }
} 