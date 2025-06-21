import { describe, it, expect, vi, beforeEach } from 'vitest';
import { onRematch } from '../onRematch';
import { RematchState, GameType, GameRooms } from '../types';
import { createInitialState } from '../state';

const mockSocket = (clientId = 'client1') => {
  const socket: any = {
    id: clientId,
    emit: vi.fn(),
    to: vi.fn().mockReturnThis(),
  };
  return socket;
};

const mockIo = () => {
  const io: any = {
    to: vi.fn().mockReturnThis(),
    emit: vi.fn(),
  };
  return io;
};

describe('onRematch', () => {
  let socket: any;
  let io: any;
  let gameStates: Record<GameType, GameRooms>;
  let clientSocketMap: Record<string, string>;

  beforeEach(() => {
    socket = mockSocket('client1');
    io = mockIo();
    gameStates = {
      tictactoe: {
        ...createInitialState(),
        rooms: {
          room1: {
            id: 'room1',
            players: ['client1', 'client2'],
            board: Array(9).fill(null),
            rematchState: undefined,
          },
        },
        playerNumbers: {
          client1: 'player1',
          client2: 'player2',
        },
      },
      'connect-four': {
        ...createInitialState(),
        rooms: {
          room1: {
            id: 'room1',
            players: ['client1', 'client2'],
            board: Array(42).fill('valid'),
            rematchState: undefined,
          },
        },
        playerNumbers: {
          client1: 'player1',
          client2: 'player2',
        },
      },
    };
    clientSocketMap = { 'client1': 'client1', 'client2': 'client2' };
  });

  it('should set rematchState to pending and emit correct events on first request for tictactoe', () => {
    onRematch({ data: { gameType: 'tictactoe', roomId: 'room1', clientId: 'client1' }, socket, io, gameStates, clientSocketMap });
    const room = gameStates.tictactoe.rooms['room1'];
    expect(room.rematchState).toEqual({ requested: true, requestedBy: 'client1', status: 'pending' });
    // First player should get "waiting" status
    expect(socket.emit).toHaveBeenCalledWith('rematchState', { status: 'waiting', message: 'Waiting for opponent to accept...', requestedBy: 'client1' });
    // Opponent should get "pending" status
    expect(socket.to('room1').emit).toHaveBeenCalledWith('rematchState', { status: 'pending', message: 'Opponent wants a rematch!', requestedBy: 'client1' });
  });

  it('should set rematchState to pending and emit correct events on first request for connect-four', () => {
    onRematch({ data: { gameType: 'connect-four', roomId: 'room1', clientId: 'client1' }, socket, io, gameStates, clientSocketMap });
    const room = gameStates['connect-four'].rooms['room1'];
    expect(room.rematchState).toEqual({ requested: true, requestedBy: 'client1', status: 'pending' });
    // First player should get "waiting" status
    expect(socket.emit).toHaveBeenCalledWith('rematchState', { status: 'waiting', message: 'Waiting for opponent to accept...', requestedBy: 'client1' });
    // Opponent should get "pending" status
    expect(socket.to('room1').emit).toHaveBeenCalledWith('rematchState', { status: 'pending', message: 'Opponent wants a rematch!', requestedBy: 'client1' });
  });

  it('should reset board and set rematchState to accepted when second player accepts tictactoe', () => {
    // First player requests rematch
    onRematch({ data: { gameType: 'tictactoe', roomId: 'room1', clientId: 'client1' }, socket, io, gameStates, clientSocketMap });
    // Second player accepts
    const socket2 = mockSocket('client2');
    onRematch({ data: { gameType: 'tictactoe', roomId: 'room1', clientId: 'client2' }, socket: socket2, io, gameStates, clientSocketMap });
    const room = gameStates.tictactoe.rooms['room1'];
    const newBoard = Array(9).fill(null);
    expect(room.board).toEqual(newBoard);
    expect(room.rematchState).toEqual({ requested: false, requestedBy: '', status: 'accepted' });
    const newFirstPlayer = room.firstPlayer;

    expect(io.to('room1').emit).toHaveBeenCalledWith('updateBoard', {
      board: newBoard,
      currentPlayer: newFirstPlayer,
    });
    expect(io.to('room1').emit).toHaveBeenCalledWith('gameStart', {
      firstPlayer: newFirstPlayer,
    });
    // Both players should get "accepted" status
    expect(io.to('room1').emit).toHaveBeenCalledWith('rematchState', { status: 'accepted', message: 'Rematch accepted! Game starting...', requestedBy: '' });
  });

  it('should reset board and set rematchState to accepted when second player accepts connect-four', () => {
    // First player requests rematch
    onRematch({ data: { gameType: 'connect-four', roomId: 'room1', clientId: 'client1' }, socket, io, gameStates, clientSocketMap });
    // Second player accepts
    const socket2 = mockSocket('client2');
    onRematch({ data: { gameType: 'connect-four', roomId: 'room1', clientId: 'client2' }, socket: socket2, io, gameStates, clientSocketMap });
    const room = gameStates['connect-four'].rooms['room1'];
    const newBoard = Array(42).fill('valid');
    expect(room.board).toEqual(newBoard);
    expect(room.rematchState).toEqual({ requested: false, requestedBy: '', status: 'accepted' });
    const newFirstPlayer = room.firstPlayer;

    expect(io.to('room1').emit).toHaveBeenCalledWith('updateBoard', {
      board: newBoard,
      currentPlayer: newFirstPlayer,
    });
    expect(io.to('room1').emit).toHaveBeenCalledWith('gameStart', {
      firstPlayer: newFirstPlayer,
    });
    // Both players should get "accepted" status
    expect(io.to('room1').emit).toHaveBeenCalledWith('rematchState', { status: 'accepted', message: 'Rematch accepted! Game starting...', requestedBy: '' });
  });

  it('should do nothing if room does not exist', () => {
    onRematch({ data: { gameType: 'tictactoe', roomId: 'nonexistent', clientId: 'client1' }, socket, io, gameStates, clientSocketMap });
    // No error thrown, no emit called
    expect(socket.emit).not.toHaveBeenCalled();
  });

  it('should do nothing if game type does not exist', () => {
    onRematch({ data: { gameType: 'nonexistent' as any, roomId: 'room1', clientId: 'client1' }, socket, io, gameStates, clientSocketMap });
    // Should emit error
    expect(socket.emit).toHaveBeenCalledWith('error', 'Game state not found');
  });

  it('should not allow same player to accept their own rematch request', () => {
    // First player requests rematch
    onRematch({ data: { gameType: 'tictactoe', roomId: 'room1', clientId: 'client1' }, socket, io, gameStates, clientSocketMap });
    const room = gameStates.tictactoe.rooms['room1'];
    expect(room.rematchState).toEqual({ requested: true, requestedBy: 'client1', status: 'pending' });
    
    // Same player tries to accept (should do nothing)
    onRematch({ data: { gameType: 'tictactoe', roomId: 'room1', clientId: 'client1' }, socket, io, gameStates, clientSocketMap });
    expect(room.rematchState).toEqual({ requested: true, requestedBy: 'client1', status: 'pending' });
    // Should not emit game start events
    expect(io.to('room1').emit).not.toHaveBeenCalledWith('updateBoard', expect.any(Array));
    expect(io.to('room1').emit).not.toHaveBeenCalledWith('gameStart', expect.any(Boolean));
  });
}); 