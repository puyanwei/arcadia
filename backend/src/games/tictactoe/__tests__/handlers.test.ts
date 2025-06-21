import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { Server, Socket } from 'socket.io';
import { handleMove } from '../handlers';
import { GameRooms, PlayerNumber } from '../../../shared/types';

describe('handleMove', () => {
  let mockSocket: { id: string; emit: Mock; to: Mock; };
  let mockIo: Partial<Server>;
  let gameRooms: GameRooms;
  let clientSocketMap: Record<string, string>;

  beforeEach(() => {
    mockSocket = {
      id: 'socket1',
      emit: vi.fn(),
      to: vi.fn().mockReturnThis(),
    };
    mockIo = {
      to: vi.fn().mockReturnThis(),
      emit: vi.fn(),
    };
    gameRooms = {
      rooms: {
        'room1': {
          id: 'room1',
          players: ['client1', 'client2'],
          board: Array(9).fill(null),
          currentPlayer: 'client1'
        }
      },
      playerNumbers: {
        'client1': 'player1',
        'client2': 'player2'
      },
      playerStatuses: {
        'client1': 'playing',
        'client2': 'playing',
      },
    };
    clientSocketMap = {
      'socket1': 'client1',
      'socket2': 'client2',
      'non-socket': 'non-client'
    };
  });

  it('should update the board and emit boardUpdate event for a valid move', () => {
    const move = { index: 0 };
    const result = handleMove({ 
      gameRooms, 
      roomId: 'room1', 
      move, 
      socket: mockSocket as unknown as Socket, 
      io: mockIo as Server,
      clientSocketMap
    });
    expect(result.newGameRooms.rooms['room1'].board[0]).toEqual('player1');
    expect(mockIo.to).toHaveBeenCalledWith('room1');
    expect(mockIo.emit).toHaveBeenCalledWith('boardUpdate', {
      board: result.newGameRooms.rooms['room1'].board,
      currentPlayer: 'client2',
    });
  });

  it('should emit an error if the move index is invalid', () => {
    const move = { index: 99 };
    handleMove({ gameRooms, roomId: 'room1', move, socket: mockSocket as unknown as Socket, io: mockIo as Server, clientSocketMap });
    expect(mockSocket.emit).toHaveBeenCalledWith('error', 'Invalid move index.');
  });

  it("should emit an error if it's not the player's turn", () => {
    const move = { index: 0 };
    // It's player1's turn, but player2 makes a move
    mockSocket.id = 'socket2';
    handleMove({ gameRooms, roomId: 'room1', move, socket: mockSocket as unknown as Socket, io: mockIo as Server, clientSocketMap });
    expect(mockSocket.emit).toHaveBeenCalledWith('error', "It's not your turn.");
  });

  it('should emit an error if a non-player tries to move', () => {
    const move = { index: 0 };
    mockSocket.id = 'non-socket';
    handleMove({ gameRooms, roomId: 'room1', move, socket: mockSocket as unknown as Socket, io: mockIo as Server, clientSocketMap });
    expect(mockSocket.emit).toHaveBeenCalledWith('error', 'You are not a player in this game.');
  });

  it('should emit an error if the cell is already taken', () => {
    // It's player1's turn initially. P1 takes cell 0.
    gameRooms.rooms['room1'].board[0] = 'player1';
    // Now it's player2's turn. P2 takes cell 1.
    gameRooms.rooms['room1'].board[1] = 'player2';
    // Now it's player1's turn again.
    gameRooms.rooms['room1'].currentPlayer = 'client1';
    // P1 tries to take cell 1, which is already taken by P2.
    const move = { index: 1 };
    handleMove({ gameRooms, roomId: 'room1', move, socket: mockSocket as unknown as Socket, io: mockIo as Server, clientSocketMap });
    expect(mockSocket.emit).toHaveBeenCalledWith('error', 'This cell is already taken.');
  });

  it('should emit statusUpdate event when player1 wins', () => {
    // Setup a board where player1 can win
    gameRooms.rooms['room1'].board = ['player1', 'player1', null, 'player2', 'player2', null, null, null, null];
    gameRooms.rooms['room1'].currentPlayer = 'client1';
    const move = { index: 2 }; // Winning move for player1
    handleMove({ gameRooms, roomId: 'room1', move, socket: mockSocket as unknown as Socket, io: mockIo as Server, clientSocketMap });
    expect(mockIo.to).toHaveBeenCalledWith('room1');
    expect(mockIo.emit).toHaveBeenCalledWith('statusUpdate', { status: 'gameOver', gameResult: 'client1' });
  });

  it('should emit statusUpdate event when player2 wins', () => {
    // Setup a board where player2 can win
    gameRooms.rooms['room1'].board = ['player1', 'player1', null, 'player2', 'player2', null, 'player1', null, null];
    const move = { index: 5 }; // Winning move for player2
    
    // Set currentPlayer so that it's player2's turn
    gameRooms.rooms['room1'].currentPlayer = 'client2';
    // Find which socket id maps to player2
    mockSocket.id = 'socket2';

    handleMove({ gameRooms, roomId: 'room1', move, socket: mockSocket as unknown as Socket, io: mockIo as Server, clientSocketMap });
    expect(mockIo.to).toHaveBeenCalledWith('room1');
    expect(mockIo.emit).toHaveBeenCalledWith('statusUpdate', { status: 'gameOver', gameResult: 'client2' });
  });

  it('should emit statusUpdate event on a draw move', () => {
    // Setup a board that will result in a draw
    gameRooms.rooms['room1'].board = ['player1', 'player2', 'player1', 'player1', 'player2', 'player2', 'player2', 'player1', null];
    gameRooms.rooms['room1'].currentPlayer = 'client1';
    const move = { index: 8 }; // Final move leading to a draw
    handleMove({ gameRooms, roomId: 'room1', move, socket: mockSocket as unknown as Socket, io: mockIo as Server, clientSocketMap });
    expect(mockIo.to).toHaveBeenCalledWith('room1');
    expect(mockIo.emit).toHaveBeenCalledWith('statusUpdate', { status: 'gameOver', gameResult: 'draw' });
  });
}); 