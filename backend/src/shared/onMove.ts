import { SocketHandlerParams } from './types';
import { handleMove } from '../games/tictactoe/handlers';
import { handleMakeMoveCF } from '../games/connect-four/handlers';

export function onMove({ data, gameStates, socket, io, clientSocketMap }: SocketHandlerParams) {
  if (!data?.roomId || !data.clientId || !data.move) return;

  const { gameType, roomId, clientId, move } = data;
  const gameRooms = gameStates[gameType];
  if (!gameRooms) return;

  const room = gameRooms.rooms[roomId];
  if (!room || !room.players.includes(clientId)) {
    // Basic validation to ensure the player is in the room
    return;
  }

  const params = { gameRooms, roomId, move, socket, io, clientSocketMap };

  if (gameType === 'tictactoe') {
    return handleMove(params);
  }

  if (gameType === 'connect-four') {
    return handleMakeMoveCF(params);
  }
}