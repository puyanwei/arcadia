import { describe, it, expect } from 'vitest';
import {  checkEndOfGame } from '../state';
import { createInitialState } from '../../../shared/state';

describe('checkEnd', () => {
  it('should return null for an empty board', () => {
    const board = Array(9).fill(null);
    expect(checkEndOfGame(board)).toBeNull();
  });

  it('should return null for a board with no winner', () => {
    const board = Array(9).fill(null);
    board[0] = 'player1';
    board[1] = 'player2';
    board[2] = 'player1';
    expect(checkEndOfGame(board)).toBeNull();
  });

  it('should return player1 for a horizontal win', () => {
    const board = Array(9).fill(null);
    board[0] = 'player1';
    board[1] = 'player1';
    board[2] = 'player1';
    expect(checkEndOfGame(board)).toBe('player1');
  });

  it('should return player2 for a vertical win', () => {
    const board = Array(9).fill(null);
    board[0] = 'player2';
    board[3] = 'player2';
    board[6] = 'player2';
    expect(checkEndOfGame(board)).toBe('player2');
  });

  it('should return player1 for a diagonal win', () => {
    const board = Array(9).fill(null);
    board[0] = 'player1';
    board[4] = 'player1';
    board[8] = 'player1';
    expect(checkEndOfGame(board)).toBe('player1');
  });

  it('should return draw for a full board with no winner', () => {
    const board = Array(9).fill(null);
    board[0] = 'player1';
    board[1] = 'player2';
    board[2] = 'player1';
    board[3] = 'player2';
    board[4] = 'player1';
    board[5] = 'player2';
    board[6] = 'player2';
    board[7] = 'player1';
    board[8] = 'player2';
    expect(checkEndOfGame(board)).toBe('draw');
  });
});

describe('createInitialState', () => {
  it('should create a new room with the correct structure', () => {
    const result = createInitialState();
    expect(result.rooms).toBeDefined();
    expect(result.playerNumbers).toBeDefined();
  });
}); 