import { GameHandler, GameState, GameRoom } from '../index';
import { Server, Socket } from 'socket.io';
import { checkWinner, assignPlayerNumber, getPlayerNumber } from './state';
import { RematchState } from '../tictactoe/types';
import { ConnectFourBoard, PlayerNumber } from './types';

export const handleJoinRoom = (gameState: GameState<PlayerNumber>, roomId: string, playerId: string): GameState<PlayerNumber> => {
  let room = gameState.rooms.get(roomId);
  if (!room) {
    room = {
      id: roomId,
      players: [],
      board: Array(42).fill('valid') as ConnectFourBoard
    };
  }

  if (room.players.length >= 2) {
    throw new Error('Room is full');
  }

  room.players.push(playerId);
  gameState.rooms.set(roomId, room);
  assignPlayerNumber(gameState, room, playerId);
  return gameState;
};

export const handleMakeMove = (gameState: GameState<PlayerNumber>, roomId: string, playerId: string, move: { board: ConnectFourBoard }): GameState<PlayerNumber> => {
  const room = gameState.rooms.get(roomId);
  if (!room) throw new Error('Room not found');
  
  // Validate board
  if (!Array.isArray(move.board) || move.board.length !== 42) {
    throw new Error('Invalid board state');
  }
  
  if (!move.board.every(cell => cell === 'player1' || cell === 'player2' || cell === 'valid' || cell === 'invalid')) {
    throw new Error('Invalid board values');
  }

  room.board = move.board;
  return gameState;
};

export const handlePlayAgain = (gameState: GameState<PlayerNumber>, roomId: string, playerId: string): GameState<PlayerNumber> => {
  const room = gameState.rooms.get(roomId);
  if (!room) throw new Error('Room not found');

  room.board = Array(42).fill('valid') as ConnectFourBoard;
  return gameState;
};

export const handleRematch = (
  gameState: GameState<PlayerNumber>,
  roomId: string,
  playerId: string,
  currentRematchState: RematchState | undefined,
  socket: Socket,
  io: Server
): { newGameState: GameState<PlayerNumber>; newRematchState?: RematchState } => {
  if (!currentRematchState) {
    const newRematchState: RematchState = {
      requested: true,
      requestedBy: playerId,
      status: "waiting"
    };
    
    socket.emit("rematchState", { status: "waiting", message: "Waiting for opponent to accept..." });
    socket.to(roomId).emit("rematchState", { status: "pending", message: "Opponent wants a rematch!" });
    
    return { newGameState: gameState, newRematchState };
  }

  if (currentRematchState.requestedBy !== playerId) {
    const newGameState = handlePlayAgain(gameState, roomId, playerId);
    
    io.to(roomId).emit("updateBoard", Array(42).fill('valid') as ConnectFourBoard);
    io.to(roomId).emit("gameStart", true);
    
    return { newGameState };
  }

  return { newGameState: gameState };
};

export const handleDisconnect = (gameState: GameState<PlayerNumber>, roomId: string, playerId: string): GameState<PlayerNumber> => {
  const room = gameState.rooms.get(roomId);
  if (!room) return gameState;

  room.players = room.players.filter(id => id !== playerId);
  if (room.players.length === 0) {
    gameState.rooms.delete(roomId);
  }
  gameState.playerNumbers.delete(playerId);
  return gameState;
};

export const connectFourHandler: GameHandler<PlayerNumber> = {
  createInitialState: () => ({
    rooms: new Map<string, GameRoom>(),
    playerNumbers: new Map<string, PlayerNumber>()
  }),
  handleJoinRoom,
  handleMakeMove,
  handlePlayAgain,
  checkWinner: (board) => checkWinner(board as ConnectFourBoard, 7, 6),
  getPlayerNumber,
  handleRematch,
  handleDisconnect
};
