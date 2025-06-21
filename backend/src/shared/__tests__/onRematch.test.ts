import { describe, it, expect, vi, beforeEach } from 'vitest';
import { onRematch } from '../onRematch';
import { RematchState } from '../types';

const mockSocket = (clientId = 'player1') => {
  const socket: any = {
    id: clientId,
    emit: vi.fn(),
    to: vi.fn().mockReturnThis(),
    handshake: { auth: { clientId } },
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
  let gameStates: any;

  beforeEach(() => {
    socket = mockSocket('player1');
    io = mockIo();
    gameStates = {
      tictactoe: {
        rooms: {
          room1: {
            id: 'room1',
            players: ['player1', 'player2'],
            board: Array(9).fill(null),
            rematchState: undefined,
          },
        },
        playerNumbers: {
          player1: 'player1',
          player2: 'player2',
        },
      },
      'connect-four': {
        rooms: {
          room1: {
            id: 'room1',
            players: ['player1', 'player2'],
            board: Array(42).fill('valid'),
            rematchState: undefined,
          },
        },
        playerNumbers: {
          player1: 'player1',
          player2: 'player2',
        },
      },
    };
  });

  it('should set rematchState to pending and emit correct events on first request for tictactoe', () => {
    onRematch({ data: { gameType: 'tictactoe', roomId: 'room1', playerNumber: 'player1' }, socket, io, gameStates });
    const room = gameStates.tictactoe.rooms['room1'];
    expect(room.rematchState).toEqual({ requested: true, requestedBy: 'player1', status: 'pending' });
    // First player should get "waiting" status
    expect(socket.emit).toHaveBeenCalledWith('rematchState', { status: 'waiting', message: 'Waiting for opponent to accept...', requestedBy: 'player1' });
    // Opponent should get "pending" status
    expect(socket.to('room1').emit).toHaveBeenCalledWith('rematchState', { status: 'pending', message: 'Opponent wants a rematch!', requestedBy: 'player1' });
  });

  it('should set rematchState to pending and emit correct events on first request for connect-four', () => {
    onRematch({ data: { gameType: 'connect-four', roomId: 'room1', playerNumber: 'player1' }, socket, io, gameStates });
    const room = gameStates['connect-four'].rooms['room1'];
    expect(room.rematchState).toEqual({ requested: true, requestedBy: 'player1', status: 'pending' });
    // First player should get "waiting" status
    expect(socket.emit).toHaveBeenCalledWith('rematchState', { status: 'waiting', message: 'Waiting for opponent to accept...', requestedBy: 'player1' });
    // Opponent should get "pending" status
    expect(socket.to('room1').emit).toHaveBeenCalledWith('rematchState', { status: 'pending', message: 'Opponent wants a rematch!', requestedBy: 'player1' });
  });

  it('should reset board and set rematchState to accepted when second player accepts tictactoe', () => {
    // First player requests rematch
    onRematch({ data: { gameType: 'tictactoe', roomId: 'room1', playerNumber: 'player1' }, socket, io, gameStates });
    // Second player accepts
    const socket2 = mockSocket('player2');
    onRematch({ data: { gameType: 'tictactoe', roomId: 'room1', playerNumber: 'player2' }, socket: socket2, io, gameStates });
    const room = gameStates.tictactoe.rooms['room1'];
    expect(room.board).toEqual(Array(9).fill(null));
    expect(room.rematchState).toEqual({ requested: false, requestedBy: '', status: 'accepted' });
    expect(io.to('room1').emit).toHaveBeenCalledWith('updateBoard', Array(9).fill(null));
    expect(io.to('room1').emit).toHaveBeenCalledWith('gameStart', expect.any(Boolean));
    // Both players should get "accepted" status
    expect(io.to('room1').emit).toHaveBeenCalledWith('rematchState', { status: 'accepted', message: 'Rematch accepted! Game starting...', requestedBy: '' });
  });

  it('should reset board and set rematchState to accepted when second player accepts connect-four', () => {
    // First player requests rematch
    onRematch({ data: { gameType: 'connect-four', roomId: 'room1', playerNumber: 'player1' }, socket, io, gameStates });
    // Second player accepts
    const socket2 = mockSocket('player2');
    onRematch({ data: { gameType: 'connect-four', roomId: 'room1', playerNumber: 'player2' }, socket: socket2, io, gameStates });
    const room = gameStates['connect-four'].rooms['room1'];
    expect(room.board).toEqual(Array(42).fill('valid'));
    expect(room.rematchState).toEqual({ requested: false, requestedBy: '', status: 'accepted' });
    expect(io.to('room1').emit).toHaveBeenCalledWith('updateBoard', Array(42).fill('valid'));
    expect(io.to('room1').emit).toHaveBeenCalledWith('gameStart', expect.any(Boolean));
    // Both players should get "accepted" status
    expect(io.to('room1').emit).toHaveBeenCalledWith('rematchState', { status: 'accepted', message: 'Rematch accepted! Game starting...', requestedBy: '' });
  });

  it('should do nothing if room does not exist', () => {
    onRematch({ data: { gameType: 'tictactoe', roomId: 'nonexistent', playerNumber: 'player1' }, socket, io, gameStates });
    // No error thrown, no emit called
    expect(socket.emit).not.toHaveBeenCalled();
  });

  it('should do nothing if game type does not exist', () => {
    onRematch({ data: { gameType: 'nonexistent' as any, roomId: 'room1', playerNumber: 'player1' }, socket, io, gameStates });
    // Should emit error
    expect(socket.emit).toHaveBeenCalledWith('error', 'Game state not found');
  });

  it('should not allow same player to accept their own rematch request', () => {
    // First player requests rematch
    onRematch({ data: { gameType: 'tictactoe', roomId: 'room1', playerNumber: 'player1' }, socket, io, gameStates });
    const room = gameStates.tictactoe.rooms['room1'];
    expect(room.rematchState).toEqual({ requested: true, requestedBy: 'player1', status: 'pending' });
    
    // Same player tries to accept (should do nothing)
    onRematch({ data: { gameType: 'tictactoe', roomId: 'room1', playerNumber: 'player1' }, socket, io, gameStates });
    expect(room.rematchState).toEqual({ requested: true, requestedBy: 'player1', status: 'pending' });
    // Should not emit game start events
    expect(io.to('room1').emit).not.toHaveBeenCalledWith('updateBoard', expect.any(Array));
    expect(io.to('room1').emit).not.toHaveBeenCalledWith('gameStart', expect.any(Boolean));
  });
}); 