import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Server, Socket } from 'socket.io';
import { onMove } from '../onMove';
import { GameRooms, GameType, PlayerNumber } from '../types';

describe('onMove', () => {
  let mockSocket: Partial<Socket>;
  let mockIo: Partial<Server>;
  let mockGameRooms: GameRooms;

  beforeEach(() => {
    mockSocket = {
      id: 'player1',
      to: vi.fn().mockReturnThis(),
      emit: vi.fn(),
    };

    mockIo = {
      to: vi.fn().mockReturnThis(),
      emit: vi.fn(),
    };

    mockGameRooms = {
      rooms: {
        'room1': {
          id: 'room1',
          players: ['player1', 'player2'],
          board: Array(9).fill(null)
        }
      },
      playerNumbers: {
        'player1': 'player1',
        'player2': 'player2'
      }
    };
  });

  it('should emit updateBoard event when gameType is not tictactoe', () => {
    const data = {
      gameType: 'connect-four' as GameType,
      roomId: 'room1',
      playerNumber: 'player1' as PlayerNumber,
      board: Array(42).fill(null)
    };

    onMove({ data, gameStates: { 'connect-four': mockGameRooms }, socket: mockSocket as Socket, io: mockIo as Server });

    expect(mockSocket.to).toHaveBeenCalledWith('room1');
    expect(mockSocket.emit).toHaveBeenCalledWith('updateBoard', data.board);
  });

  it('should not emit any events when room is not found', () => {
    const data = {
      gameType: 'connect-four' as GameType,
      roomId: 'nonexistent',
      playerNumber: 'player1' as PlayerNumber,
      board: Array(42).fill(null)
    };

    onMove({ data, gameStates: { 'connect-four': mockGameRooms }, socket: mockSocket as Socket, io: mockIo as Server });

    expect(mockSocket.to).not.toHaveBeenCalled();
    expect(mockSocket.emit).not.toHaveBeenCalled();
  });
}); 