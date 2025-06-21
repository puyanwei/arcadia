import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { onRematch } from '../onRematch';
import { GameType, GameRooms } from '../types';
import { createInitialState } from '../state';

describe('onRematch', () => {
  let io: any;
  let client1Socket: { emit: Mock };
  let client2Socket: { emit: Mock };
  let roomEmitter: { emit: Mock };
  let gameStates: Record<GameType, GameRooms>;
  let clientSocketMap: Record<string, string>;

  beforeEach(() => {
    client1Socket = { emit: vi.fn() };
    client2Socket = { emit: vi.fn() };
    roomEmitter = { emit: vi.fn() };
    io = {
      to: vi.fn((target: string) => {
        if (target === 'client1') return client1Socket;
        if (target === 'client2') return client2Socket;
        if (target === 'room1') return roomEmitter;
        return { emit: vi.fn() };
      }),
    };
    
    const baseInitialState = createInitialState();
    gameStates = {
      tictactoe: {
        ...baseInitialState,
        rooms: {
          room1: {
            id: 'room1',
            players: ['client1', 'client2'],
            board: Array(9).fill(null),
            currentPlayer: 'client1',
            firstPlayer: 'client1',
            rematchState: undefined,
          },
        },
        playerNumbers: { client1: 'player1', client2: 'player2' },
        playerStatuses: { client1: 'gameOver', client2: 'gameOver' },
      },
      'connect-four': {
        ...baseInitialState,
        rooms: {
          room1: {
            id: 'room1',
            players: ['client1', 'client2'],
            board: Array(42).fill(null),
            currentPlayer: 'client1',
            firstPlayer: 'client1',
            rematchState: undefined,
          },
        },
        playerNumbers: { client1: 'player1', client2: 'player2' },
        playerStatuses: { client1: 'gameOver', client2: 'gameOver' },
      },
    };
    clientSocketMap = { 'socket1': 'client1', 'socket2': 'client2' };
  });

  it('should emit correct status updates on first rematch request', () => {
    onRematch({
      data: { gameType: 'tictactoe', roomId: 'room1', clientId: 'client1' },
      socket: { id: 'socket1' } as any,
      io,
      gameStates,
      clientSocketMap,
    });
    
    expect(gameStates.tictactoe.playerStatuses['client1']).toBe('rematchWaiting');
    expect(gameStates.tictactoe.playerStatuses['client2']).toBe('rematchPending');

    expect(io.to).toHaveBeenCalledWith('client1');
    expect(client1Socket.emit).toHaveBeenCalledWith('statusUpdate', { status: 'rematchWaiting' });
    
    expect(io.to).toHaveBeenCalledWith('client2');
    expect(client2Socket.emit).toHaveBeenCalledWith('statusUpdate', { status: 'rematchPending' });
  });

  it('should reset board and emit playing status when second player accepts', () => {
    // First player requests
    onRematch({ data: { gameType: 'tictactoe', roomId: 'room1', clientId: 'client1' }, socket: { id: 'socket1' } as any, io, gameStates, clientSocketMap });

    // Second player accepts
    onRematch({ data: { gameType: 'tictactoe', roomId: 'room1', clientId: 'client2' }, socket: { id: 'socket2' } as any, io, gameStates, clientSocketMap });
    
    const room = gameStates.tictactoe.rooms['room1'];
    const newBoard = Array(9).fill(null);
    expect(room.board).toEqual(newBoard);
    
    expect(gameStates.tictactoe.playerStatuses['client1']).toBe('playing');
    expect(gameStates.tictactoe.playerStatuses['client2']).toBe('playing');

    expect(io.to).toHaveBeenCalledWith('room1');
    expect(roomEmitter.emit).toHaveBeenCalledWith('statusUpdate', { status: 'playing' });
    expect(roomEmitter.emit).toHaveBeenCalledWith('boardUpdate', {
      board: newBoard,
      currentPlayer: expect.any(String),
    });
  });

  it('should do nothing if room does not exist', () => {
    const socket = { id: 'socket1', emit: vi.fn() };
    onRematch({ data: { gameType: 'tictactoe', roomId: 'nonexistent', clientId: 'client1' }, socket: socket as any, io, gameStates, clientSocketMap });
    expect(socket.emit).not.toHaveBeenCalled();
  });

  it('should emit error if game type does not exist', () => {
    const socket = { id: 'socket1', emit: vi.fn() };
    onRematch({ data: { gameType: 'nonexistent' as any, roomId: 'room1', clientId: 'client1' }, socket: socket as any, io, gameStates, clientSocketMap });
    expect(socket.emit).toHaveBeenCalledWith('error', 'Game state not found for: nonexistent');
  });

  it('should not allow same player to accept their own rematch request', () => {
    // First player requests rematch
    onRematch({ data: { gameType: 'tictactoe', roomId: 'room1', clientId: 'client1' }, socket: { id: 'socket1' } as any, io, gameStates, clientSocketMap });
    const originalStatuses = { ...gameStates.tictactoe.playerStatuses };

    // Same player tries to accept
    onRematch({ data: { gameType: 'tictactoe', roomId: 'room1', clientId: 'client1' }, socket: { id: 'socket1' } as any, io, gameStates, clientSocketMap });
    
    // Statuses should not change
    expect(gameStates.tictactoe.playerStatuses).toEqual(originalStatuses);
    // Should not emit playing status
    expect(roomEmitter.emit).not.toHaveBeenCalledWith('statusUpdate', { status: 'playing' });
  });
}); 