import { Server, Socket } from 'socket.io';
import { checkEndOfGame } from './state';
import { Board, RematchState, PlayerNumber, GameRooms } from '../../shared/types';

type HandleMoveParams = {
  gameRooms: GameRooms;
  roomId: string;
  playerNumber: PlayerNumber;
  move: { board: Board };
  socket: Socket;
  io: Server;
}

export function handleMove({ gameRooms, roomId, move, socket, io }: HandleMoveParams): { newGameRooms: GameRooms } {
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
  
  const result = checkEndOfGame(move.board);
  if (!result) return { newGameRooms: gameRooms };

  if (result === 'draw') {
    console.log('[gameEnd emit] gameResult: draw, message: Game ended in a draw!');
    io.to(roomId).emit("gameEnd", { 
      gameResult: 'draw', 
      message: 'Game ended in a draw!'
    });
  } else {
    room.players.forEach(playerId => {
      const playerNumber = gameRooms.playerNumbers[playerId];
      const isWinner = playerNumber === result;
      const msg = isWinner ? "You won!" : "You lost!";
      console.log(`[gameEnd emit] gameResult: ${result}, message: ${msg} (to playerId: ${playerId})`);
      io.to(playerId).emit("gameEnd", {
        gameResult: result,
        message: msg
      });
    });
  }

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
    
    io.to(roomId).emit("updateBoard", Array(9).fill(null));
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