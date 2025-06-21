import { describe, it, expect, vi, beforeEach } from 'vitest';
import { onMove } from '../onMove';
import { onJoinRoom } from '../onJoinRoom';
import { GameRooms, GameType } from '../types';
import { createInitialState } from '../state';

describe('onMove', () => {
  let mockIo: any;
  let gameStates: Record<GameType, GameRooms>;
  let clientSocketMap: Record<string, string>;
  const roomId = 'room1';
  const clientId1 = 'client1';
  const clientId2 = 'client2';
  const socket1 = { id: 'socket1', join: vi.fn(), emit: vi.fn() };
  const socket2 = { id: 'socket2', join: vi.fn(), emit: vi.fn() };


  beforeEach(() => {
    mockIo = {
      to: vi.fn().mockReturnThis(),
      emit: vi.fn(),
    };
    gameStates = {
      tictactoe: createInitialState(),
    };
    clientSocketMap = {
      [socket1.id]: clientId1,
      [socket2.id]: clientId2,
    };

    // Setup: Two players join the room for each test
    onJoinRoom({ data: { gameType: 'tictactoe', roomId, clientId: clientId1 }, gameStates, socket: socket1 as any, io: mockIo, clientSocketMap });
    onJoinRoom({ data: { gameType: 'tictactoe', roomId, clientId: clientId2 }, gameStates, socket: socket2 as any, io: mockIo, clientSocketMap });
  });

  it('should call handleMove for tictactoe game type and update the board', () => {
    const move = { index: 0 };
    // Find which client is 'player1'
    const player1ClientId = Object.keys(gameStates.tictactoe.playerNumbers).find(
      (cid) => gameStates.tictactoe.playerNumbers[cid] === 'player1'
    )!;
    
    gameStates.tictactoe.rooms[roomId].currentPlayer = player1ClientId;
    // Use the correct socket for player1
    const socket = player1ClientId === clientId1 ? socket1 : socket2;
    const playerNumber = gameStates.tictactoe.playerNumbers[player1ClientId];
    onMove({
      data: { gameType: 'tictactoe', roomId, clientId: player1ClientId, move },
      gameStates,
      socket: socket as any,
      io: mockIo,
      clientSocketMap,
    });
    const room = gameStates.tictactoe.rooms[roomId];
    expect(room.board[0]).toEqual(playerNumber);
    expect(mockIo.to).toHaveBeenCalledWith(roomId);
    expect(mockIo.emit).toHaveBeenCalledWith('boardUpdate', {
      board: expect.any(Array),
      currentPlayer: expect.any(String),
    });
  });

  it('should not do anything if room is not found', () => {
    onMove({
      data: { gameType: 'tictactoe', roomId: 'nonexistent', clientId: clientId1, move: { index: 0 } },
      gameStates,
      socket: socket1 as any,
      io: mockIo,
      clientSocketMap,
    });

    expect(mockIo.emit).not.toHaveBeenCalledWith('boardUpdate', expect.any(Array));
  });
}); 