import { Server, Socket } from "socket.io";
import { assignPlayerNumber } from '../games/tictactoe/state';
import { GameRoom, SocketHandlerParams, GameType, GameRooms } from './types';
import { emitGameState } from '../games/tictactoe/handlers';

export function onJoinRoom({ data, gameStates, socket, io, clientSocketMap }: SocketHandlerParams): void {
  if (!data?.roomId || !data.clientId) return;

  const { gameType, roomId, clientId } = data;
  const gameState = gameStates[gameType];
  if (!gameState) return;

  let room = gameState.rooms[roomId];
  if (!room) {
    console.log(`[onJoinRoom] Created new room: ${roomId}`);
    room = {
      id: roomId,
      players: [],
      board: gameType === 'tictactoe' ? Array(9).fill(null) : Array(42).fill('valid'),
    };
    gameState.rooms[roomId] = room;
  }

  if (!room.firstPlayer) {
    room.firstPlayer = clientId;
    room.currentPlayer = clientId;
  }

  // Prevent user from joining the same room from two different tabs
  if (room.players.includes(clientId)) {
    socket.emit('error', 'You have already joined this room from another tab.');
    return;
  }

  if (room.players.length >= 2) {
    socket.emit('error', 'This room is full.');
    return;
  }

  // Add player to room
  room.players.push(clientId);
  clientSocketMap[socket.id] = clientId; // Map socket.id to clientId

  // Assign player number (X or O)
  assignPlayerNumber(gameState, room, clientId);

  socket.join(roomId);
  console.log(`[onJoinRoom] Player ${clientId} (${socket.id}) joined room ${roomId}. Players now: ${room.players.length}`);

  // Notify players in room of the new player list
  io.to(roomId).emit('playerJoined', {
    players: room.players.map(id => ({ id, playerNumber: gameState.playerNumbers[id] })),
    playerCount: room.players.length
  });

  // If room is not full, set first player's status to waiting
  if (room.players.length < 2) {
    gameState.playerStatuses[clientId] = 'waiting';
    socket.emit('statusUpdate', { status: 'waiting' });
  } else {
    // If room is full, set both players' status to 'playing' and start the game
    const player1Id = room.players[0];
    const player2Id = room.players[1];
    gameState.playerStatuses[player1Id] = 'playing';
    gameState.playerStatuses[player2Id] = 'playing';

    io.to(roomId).emit('statusUpdate', { status: 'playing' });
    io.to(roomId).emit('boardUpdate', { board: room.board, currentPlayer: room.firstPlayer });
  }
}
