import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Server, Socket } from 'socket.io';
import { handleMove } from '../handlers';
import { GameRooms, PlayerNumber } from '../../../shared/types';

describe('handleMove', () => {
  let mockSocket: Partial<Socket>;
  let mockIo: Partial<Server>;
  let gameRooms: GameRooms;

  beforeEach(() => {
    mockSocket = {
      id: 'player1',
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

  it('should update the board and emit updateBoard event', () => {
    const move = { board: Array(9).fill(null) };
    move.board[0] = 'player1';
    const result = handleMove({ gameRooms, roomId: 'room1', playerNumber: 'player1', move, socket: mockSocket as Socket, io: mockIo as Server });
    expect(result.newGameRooms.rooms['room1'].board).toEqual(move.board);
    expect(mockSocket.to).toHaveBeenCalledWith('room1');
    expect(mockSocket.emit).toHaveBeenCalledWith('updateBoard', move.board);
  });

  it('should throw an error if the room is not found', () => {
    const move = { board: Array(9).fill(null) };
    expect(() => handleMove({ gameRooms, roomId: 'nonexistent', playerNumber: 'player1', move, socket: mockSocket as Socket, io: mockIo as Server })).toThrow('Room not found');
  });

  it('should throw an error if the board is invalid', () => {
    const move = { board: Array(8).fill(null) };
    expect(() => handleMove({ gameRooms, roomId: 'room1', playerNumber: 'player1', move, socket: mockSocket as Socket, io: mockIo as Server })).toThrow('Invalid board state');
  });

  it('should throw an error if the board values are invalid', () => {
    const move = { board: Array(9).fill('invalid') };
    expect(() => handleMove({ gameRooms, roomId: 'room1', playerNumber: 'player1', move, socket: mockSocket as Socket, io: mockIo as Server })).toThrow('Invalid board values');
  });

  it('should emit gameEnd event with draw if the game is a draw', () => {
    const move = { board: Array(9).fill(null) };
    move.board[0] = 'player1';
    move.board[1] = 'player2';
    move.board[2] = 'player1';
    move.board[3] = 'player2';
    move.board[4] = 'player1';
    move.board[5] = 'player2';
    move.board[6] = 'player2';
    move.board[7] = 'player1';
    move.board[8] = 'player2';
    handleMove({ gameRooms, roomId: 'room1', playerNumber: 'player1', move, socket: mockSocket as Socket, io: mockIo as Server });
    expect(mockIo.to).toHaveBeenCalledWith('room1');
    expect(mockIo.emit).toHaveBeenCalledWith('gameEnd', { gameResult: 'draw', message: 'Game ended in a draw!' });
  });

  it('should emit gameEnd event with winner if the game is won', () => {
    const move = { board: Array(9).fill(null) };
    move.board[0] = 'player1';
    move.board[1] = 'player1';
    move.board[2] = 'player1';
    handleMove({ gameRooms, roomId: 'room1', playerNumber: 'player1', move, socket: mockSocket as Socket, io: mockIo as Server });
    expect(mockIo.to).toHaveBeenCalledWith('player1');
    expect(mockIo.emit).toHaveBeenCalledWith('gameEnd', { gameResult: 'player1', message: 'You won!' });
    expect(mockIo.to).toHaveBeenCalledWith('player2');
    expect(mockIo.emit).toHaveBeenCalledWith('gameEnd', { gameResult: 'player1', message: 'You lost!' });
  });
}); 