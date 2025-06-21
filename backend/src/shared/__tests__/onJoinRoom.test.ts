import { describe, it, expect, vi, beforeEach } from 'vitest'
import { onJoinRoom } from '../onJoinRoom'
import { GameRooms, GameType } from '../types'
import { createInitialState } from '../state'

describe('onJoinRoom', () => {
  let mockIo: any
  let mockSocket: any
  let gameStates: Record<GameType, GameRooms>
  let clientSocketMap: Record<string, string>

  beforeEach(() => {
    mockIo = {
      to: vi.fn().mockReturnThis(),
      emit: vi.fn(),
    }
    mockSocket = {
      id: 'socket1',
      join: vi.fn(),
      emit: vi.fn(),
    }
    gameStates = {
      tictactoe: createInitialState(),
    }
    clientSocketMap = {}
  })

  it('should add a player to a new room and assign a player number', () => {
    const roomId = 'room1'
    const clientId = 'client1'
    
    onJoinRoom({
      data: { gameType: 'tictactoe', roomId, clientId },
      gameStates,
      socket: mockSocket,
      io: mockIo,
      clientSocketMap,
    })

    const room = gameStates.tictactoe.rooms[roomId]
    expect(room).toBeDefined()
    expect(room.players).toContain(clientId)
    expect(clientSocketMap[mockSocket.id]).toBe(clientId)
    expect(mockSocket.join).toHaveBeenCalledWith(roomId)
    expect(mockIo.to).toHaveBeenCalledWith(roomId)
    expect(mockIo.emit).toHaveBeenCalledWith('playerJoined', expect.any(Object))
    const playerNumber = gameStates.tictactoe.playerNumbers[clientId]
    expect(['player1', 'player2']).toContain(playerNumber)
  })

  it('should assign the other player number to the second player', () => {
    const roomId = 'room1'
    const clientId1 = 'client1'
    const clientId2 = 'client2'

    // First player joins
    onJoinRoom({
      data: { gameType: 'tictactoe', roomId, clientId: clientId1 },
      gameStates,
      socket: { ...mockSocket, id: 'socket1' },
      io: mockIo,
      clientSocketMap,
    })
    const player1Number = gameStates.tictactoe.playerNumbers[clientId1]

    // Second player joins
    onJoinRoom({
      data: { gameType: 'tictactoe', roomId, clientId: clientId2 },
      gameStates,
      socket: { ...mockSocket, id: 'socket2' },
      io: mockIo,
      clientSocketMap,
    })
    const player2Number = gameStates.tictactoe.playerNumbers[clientId2]

    expect(player2Number).toBe(player1Number === 'player1' ? 'player2' : 'player1')
    
    // Check for game start events
    expect(mockIo.emit).toHaveBeenCalledWith('playerJoined', expect.objectContaining({
      playerCount: 2
    }));
    expect(mockIo.emit).toHaveBeenCalledWith('statusUpdate', { status: 'playing' });
    expect(mockIo.emit).toHaveBeenCalledWith('boardUpdate', expect.objectContaining({
      board: expect.any(Array),
      currentPlayer: expect.any(String)
    }));
  })

  it('should not allow more than 2 players in a room', () => {
    const roomId = 'room1'
    const clientIds = ['c1', 'c2', 'c3']

    // Two players join
    onJoinRoom({ data: { gameType: 'tictactoe', roomId, clientId: clientIds[0] }, gameStates, socket: { ...mockSocket, id: 's1' } as any, io: mockIo, clientSocketMap });
    onJoinRoom({ data: { gameType: 'tictactoe', roomId, clientId: clientIds[1] }, gameStates, socket: { ...mockSocket, id: 's2' } as any, io: mockIo, clientSocketMap });

    const thirdSocket = { id: 's3', emit: vi.fn(), join: vi.fn() };

    // Third player tries to join
    onJoinRoom({ data: { gameType: 'tictactoe', roomId, clientId: clientIds[2] }, gameStates, socket: thirdSocket as any, io: mockIo, clientSocketMap });

    const room = gameStates.tictactoe.rooms[roomId];
    expect(room.players.length).toBe(2);
    expect(thirdSocket.emit).toHaveBeenCalledWith('error', 'This room is full.')
  })
}) 