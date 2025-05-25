import { Server, Socket } from 'socket.io';
import { SocketHandlerParams } from './types';

export function onMove({ data, gameStates, socket, io }: SocketHandlerParams) {
  if (!data) return;

  const { gameType, roomId, board } = data;
  const gameRooms = gameStates[gameType];
  
  if (!gameRooms) return;
  
  const room = gameRooms.rooms[roomId];
  if (!room) return;

  if (gameType === 'tictactoe') return;

  socket.to(roomId).emit('updateBoard', board);
}