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

  // Notify players
  io.to(roomId).emit('playerJoined', {
    players: room.players.map(id => ({ id, playerNumber: gameState.playerNumbers[id] })),
    playerCount: room.players.length
  });

  // If room is full, start the game
  if (room.players.length === 2) {
    // Emit player numbers to each client individually
    // ... (existing code to emit playerNumber)

    console.log(`[onJoinRoom] Room ${roomId} now has 2 players. Emitting gameStart.`);
    io.to(roomId).emit('gameStart', { firstPlayer: room.firstPlayer });
  }
}
