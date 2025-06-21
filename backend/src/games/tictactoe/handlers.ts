import { Server, Socket } from 'socket.io';
import { checkEndOfGame } from './state';
import { Board, RematchState, PlayerNumber, GameRooms, HandleMoveParams } from '../../shared/types';

export function handleMove({ 
  gameRooms, 
  roomId, 
  move, 
  socket, 
  io, 
  clientSocketMap 
}: HandleMoveParams<{ index: number }>): { newGameRooms: GameRooms } {
  const room = gameRooms.rooms[roomId];
  if (!room) {
    socket.emit('error', 'Room not found.');
    return { newGameRooms: gameRooms };
  }
  
  const clientId = clientSocketMap[socket.id];
  if (!clientId) {
    socket.emit('error', 'Could not identify client.');
    return { newGameRooms: gameRooms };
  }
  
  const playerNumber = gameRooms.playerNumbers[clientId];
  if (!playerNumber) {
    socket.emit('error', 'You are not a player in this game.');
    return { newGameRooms: gameRooms };
  }

  // Basic validation
  const { index } = move;
  if (typeof index !== 'number' || index < 0 || index > 8) {
    socket.emit('error', 'Invalid move index.');
    return { newGameRooms: gameRooms };
  }

  const board = room.board as Board;

  // Check if it's the player's turn
  if (room.currentPlayer !== clientId) {
    socket.emit('error', "It's not your turn.");
    return { newGameRooms: gameRooms };
  }

  // Check if the cell is already taken
  if (board[index]) {
    socket.emit('error', 'This cell is already taken.');
    return { newGameRooms: gameRooms };
  }

  // Update the board state on the server
  board[index] = playerNumber;

  // Switch current player
  const otherPlayer = room.players.find(p => p !== clientId);
  if (otherPlayer) {
    room.currentPlayer = otherPlayer;
  }

  // Broadcast the updated board and current player to all players in the room
  io.to(roomId).emit("boardUpdate", { board: room.board, currentPlayer: room.currentPlayer });
  
  const result = checkEndOfGame(board);
  // No winner or draw, game continues
  if (!result) return { newGameRooms: gameRooms };

  // Update player statuses to 'gameOver'
  room.players.forEach(playerId => {
    gameRooms.playerStatuses[playerId] = 'gameOver';
  });

  let gameResult: string | 'draw' | null = null;
  if (result === 'draw') {
    gameResult = 'draw';
  } else if (result) {
    // Find the clientId of the winner
    gameResult =
      Object.keys(gameRooms.playerNumbers).find(
        id => gameRooms.playerNumbers[id] === result
      ) || null;
  }

  console.log('Game Over. Result:', gameResult);
  io.to(roomId).emit('statusUpdate', { status: 'gameOver', gameResult });

  return { newGameRooms: gameRooms };
}

export function handlePlayAgain(gameRooms: GameRooms, roomId: string, playerId: string): GameRooms {
  const room = gameRooms.rooms[roomId];
  if (!room) throw new Error('Room not found');

  room.board = Array(9).fill(null);
  return gameRooms;
}

export function handleRematch(
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
    const newGameRooms = handlePlayAgain(gameRooms, roomId, playerId);
    const shouldSwapFirst = Math.random() < 0.5;
    
    io.to(roomId).emit("boardUpdate", Array(9).fill(null));
    io.to(roomId).emit("gameStart", shouldSwapFirst);
    
    return { newGameRooms };
  }

  return { newGameRooms: gameRooms };
}

export function handleDisconnect(gameRooms: GameRooms, roomId: string, playerId: string): GameRooms {
  const room = gameRooms.rooms[roomId];
  if (!room) return gameRooms;

  room.players = room.players.filter(id => id !== playerId);
  if (room.players.length === 0) {
    delete gameRooms.rooms[roomId];
  }
  delete gameRooms.playerNumbers[playerId];
  return gameRooms;
}

export async function emitGameState(io: Server, gameRooms: GameRooms, roomId: string): Promise<void> {
  const room = gameRooms.rooms[roomId];
  if (room) {
    io.to(roomId).emit("playerJoined", room.players.length);
    if (room.players.length === 2) {
      const sockets = await io.in(roomId).allSockets();
      io.to(roomId).emit("gameStart", true);
    }
  }
}