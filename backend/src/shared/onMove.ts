import { Server, Socket } from 'socket.io';
import { SocketHandlerParams } from './types';
import { handleMove } from '../games/tictactoe/handlers';

export function onMove({ data, gameStates, socket, io }: SocketHandlerParams) {
  if (!data) return;

  const { gameType, roomId, board, playerNumber } = data;
  const gameRooms = gameStates[gameType];
  
  if (!gameRooms) return;
  
  const room = gameRooms.rooms[roomId];
  if (!room) return;

  if (gameType === 'tictactoe') {
    const move = { board };
    return handleMove({ gameRooms, roomId, playerNumber, move, socket, io });
  };

  socket.to(roomId).emit('updateBoard', board);
}