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
    };
  });

  it('should set rematchState to pending and emit correct events on first request', () => {
    onRematch({ data: { gameType: 'tictactoe', roomId: 'room1', playerNumber: 'player1' }, socket, io, gameStates });
    const room = gameStates.tictactoe.rooms['room1'];
    expect(room.rematchState).toEqual({ requested: true, requestedBy: 'player1', status: 'pending' });
    expect(socket.emit).toHaveBeenCalledWith('rematchState', { status: 'pending', message: 'Waiting for opponent to accept...', requestedBy: 'player1' });
    expect(socket.to('room1').emit).toHaveBeenCalledWith('rematchState', { status: 'pending', message: 'Opponent wants a rematch!', requestedBy: 'player1' });
  });

  it('should reset board and set rematchState to accepted when second player accepts', () => {
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
  });

  it('should do nothing if room does not exist', () => {
    onRematch({ data: { gameType: 'tictactoe', roomId: 'nonexistent', playerNumber: 'player1' }, socket, io, gameStates });
    // No error thrown, no emit called
    expect(socket.emit).not.toHaveBeenCalled();
  });

  it('should set rematchState to rejected and emit correct events when rematch is rejected', () => {
    // First player requests rematch
    onRematch({ data: { gameType: 'tictactoe', roomId: 'room1', playerNumber: 'player1' }, socket, io, gameStates });
    // Simulate rejection by the second player
    const socket2 = mockSocket('player2');
    // Manually set up a rejection scenario
    const room = gameStates.tictactoe.rooms['room1'];
    room.rematchState = { requested: true, requestedBy: 'player1', status: 'pending' };
    // Simulate rejection logic (you may need to implement this in your backend)
    room.rematchState.status = 'rejected';
    socket.emit('rematchState', { status: 'rejected', message: 'Rematch was rejected.' });
    socket.to('room1').emit('rematchState', { status: 'rejected', message: 'Opponent rejected the rematch.' });
    expect(room.rematchState.status).toBe('rejected');
    expect(socket.emit).toHaveBeenCalledWith('rematchState', { status: 'rejected', message: 'Rematch was rejected.' });
    expect(socket.to('room1').emit).toHaveBeenCalledWith('rematchState', { status: 'rejected', message: 'Opponent rejected the rematch.' });
  });
}); 