import { describe, it, expect, vi, beforeEach } from 'vitest'
import { onDisconnect } from '../onDisconnect';
import { onJoinRoom } from '../onJoinRoom';
import { GameRooms, SocketHandlerParams, GameType } from '../types';
import { createInitialState } from '../state';

describe('onDisconnect', () => {
  let mockIo: any;
  let mockSocket: any;
  let gameStates: Record<GameType, GameRooms>;
  let clientSocketMap: Record<string, string>;

  beforeEach(() => {
    mockIo = {
      to: vi.fn().mockReturnThis(),
      emit: vi.fn(),
    };
    mockSocket = {
      id: 'socket1',
      join: vi.fn(),
      emit: vi.fn(),
    };
    gameStates = {
      tictactoe: createInitialState(),
      'connect-four': createInitialState(),
    };
    clientSocketMap = {};
  });

  it('should remove player from room and notify other player when one player disconnects', () => {
    const roomId = 'room1';
    const clientId1 = 'client1';
    const clientId2 = 'client2';

    // Player 1 joins
    onJoinRoom({
      data: { gameType: 'tictactoe', roomId, clientId: clientId1 },
      gameStates,
      socket: { ...mockSocket, id: 'socket1' },
      io: mockIo,
      clientSocketMap,
    });

    // Player 2 joins
    onJoinRoom({
      data: { gameType: 'tictactoe', roomId, clientId: clientId2 },
      gameStates,
      socket: { ...mockSocket, id: 'socket2' },
      io: mockIo,
      clientSocketMap,
    });
    
    // Player 1 disconnects
    onDisconnect({
      socket: { id: 'socket1' },
      gameStates,
      io: mockIo,
      clientSocketMap,
    } as SocketHandlerParams);

    expect(gameStates.tictactoe.rooms[roomId].players).not.toContain(clientId1);
    expect(gameStates.tictactoe.rooms[roomId].players).toContain(clientId2);
    expect(mockIo.to).toHaveBeenCalledWith(roomId);
    expect(mockIo.emit).toHaveBeenCalledWith('playerLeft', clientId1);
  });

  it('should delete room when last player disconnects', () => {
    const roomId = 'room1';
    const clientId1 = 'client1';

    // Player 1 joins
    onJoinRoom({
      data: { gameType: 'tictactoe', roomId, clientId: clientId1 },
      gameStates,
      socket: mockSocket,
      io: mockIo,
      clientSocketMap,
    });

    // Player 1 disconnects
    onDisconnect({
      socket: { id: 'socket1' },
      gameStates,
      io: mockIo,
      clientSocketMap,
    } as SocketHandlerParams);
    
    expect(gameStates.tictactoe.rooms[roomId]).toBeUndefined();
  });
}); 