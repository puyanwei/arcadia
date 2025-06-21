import { SocketHandlerParams } from "./types";
import { RematchState } from "./types";

function findSocketIdByClientId(clientId: string, clientSocketMap: Record<string, string>): string | undefined {
  return Object.keys(clientSocketMap).find(socketId => clientSocketMap[socketId] === clientId);
}

export function onRematch({ data, socket, io, gameStates, clientSocketMap }: SocketHandlerParams) {
    if (!data?.clientId) return;
    const { gameType, roomId, clientId } = data;
    
    const gameState = gameStates[gameType];
    if (!gameState) {
      socket.emit("error", "Game state not found for: " + gameType);
      return;
    }
    const room = gameState.rooms[roomId];
    if (!room) {
      return;
    }
  
    const rematchState = room.rematchState;
    
    if (!rematchState) {
      const newRematchState: RematchState = {
        requested: true,
        requestedBy: clientId,
        status: "pending"
      };
      room.rematchState = newRematchState;
      const opponentId = room.players.find(p => p !== clientId);

      if(opponentId) {
        gameState.playerStatuses[clientId] = 'rematchWaiting';
        gameState.playerStatuses[opponentId] = 'rematchPending';

        const requesterSocketId = findSocketIdByClientId(clientId, clientSocketMap);
        const opponentSocketId = findSocketIdByClientId(opponentId, clientSocketMap);
        
        if (requesterSocketId && opponentSocketId) {
          io.to(requesterSocketId).emit('statusUpdate', { 
            status: 'rematchWaiting',
            message: 'Waiting for opponent to accept...'
          });
          io.to(opponentSocketId).emit('statusUpdate', { 
            status: 'rematchPending',
            message: 'Opponent wants a rematch!'
          });
        }
      }
      return;
    }
    
    if (rematchState.requestedBy === clientId) {
      return;
    }

    // Rematch accepted
    room.rematchState = { requested: false, requestedBy: '', status: 'accepted' };

    // Reset board and determine new first player
    room.board = gameType === 'tictactoe' ? Array(9).fill(null) : Array(42).fill('valid');
    const newFirstPlayer = room.players[Math.floor(Math.random() * room.players.length)];
    room.firstPlayer = newFirstPlayer;
    room.currentPlayer = newFirstPlayer;

    room.players.forEach(p => {
      gameState.playerStatuses[p] = 'playing';
    });
    io.to(roomId).emit('statusUpdate', { status: 'playing' });
    io.to(roomId).emit('boardUpdate', { board: room.board, currentPlayer: room.currentPlayer });
}