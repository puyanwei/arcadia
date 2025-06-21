import { SocketHandlerParams } from './types';
import { handleMove } from '../games/tictactoe/handlers';
import { handleMakeMoveCF } from '../games/connect-four/handlers';

export function onMove({ data, gameStates, socket, io, clientSocketMap }: SocketHandlerParams) {
  if (!data?.roomId || !data.clientId) return;

  const { gameType, roomId, clientId } = data;
  const gameRooms = gameStates[gameType];
  if (!gameRooms) return;

  const room = gameRooms.rooms[roomId];
  if (!room || !room.players.includes(clientId)) {
    // Basic validation to ensure the player is in the room
    return;
  }

  if (gameType === 'tictactoe') {
    if (!data.move) return;
    return handleMove({ gameRooms, roomId, move: data.move, socket, io, clientSocketMap });
  }

  if (gameType === 'connect-four') {
    if (!data.board) return;
    return handleMakeMoveCF(gameRooms, roomId, clientId, { board: data.board }, socket, io);
  }
}