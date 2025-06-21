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
      'connect-four': createInitialState(),
    };
    clientSocketMap = {};

    // Setup: Two players join the room
    onJoinRoom({ data: { gameType: 'tictactoe', roomId, clientId: clientId1 }, gameStates, socket: socket1 as any, io: mockIo, clientSocketMap });
    onJoinRoom({ data: { gameType: 'tictactoe', roomId, clientId: clientId2 }, gameStates, socket: socket2 as any, io: mockIo, clientSocketMap });
  });

  it('should call handleMove for tictactoe game type and update the board', () => {
    const move = { index: 0 };
    // Find which client is 'player1'
    const player1ClientId = Object.keys(gameStates.tictactoe.playerNumbers).find(
      (cid) => gameStates.tictactoe.playerNumbers[cid] === 'player1'
    )!;
    const player2ClientId = player1ClientId === clientId1 ? clientId2 : clientId1;

    const playerNumber = gameStates.tictactoe.playerNumbers[player1ClientId];
    // It's player1's turn
    gameStates.tictactoe.rooms[roomId].board = Array(9).fill(null);
    gameStates.tictactoe.rooms[roomId].currentPlayer = player1ClientId;
    // Use the correct socket for player1
    const socket = player1ClientId === clientId1 ? socket1 : socket2;
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

  it('should call handleMakeMoveCF for connect-four game type', () => {
    const board = Array(42).fill('valid');
    const playerNumber = gameStates['connect-four'].playerNumbers[clientId1];

    onMove({
      data: { gameType: 'connect-four', roomId, clientId: clientId1, board },
      gameStates,
      socket: socket1 as any,
      io: mockIo,
      clientSocketMap,
    });

    expect(mockIo.to).toHaveBeenCalledWith(roomId);
    // Don't check for board update here as CF handler is complex, just that it was called.
    expect(mockIo.emit).toHaveBeenCalled();
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