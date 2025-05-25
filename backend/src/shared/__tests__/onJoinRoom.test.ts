import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { onJoinRoom } from '../onJoinRoom'
import { GameRooms } from '../types'
import { Socket, Server } from 'socket.io'
import { DefaultEventsMap } from 'socket.io/dist/typed-events'

describe('onJoinRoom', () => {
  let mockSocket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap>
  let mockIo: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap>
  let gameStates: Record<string, GameRooms>
  const originalRandom = Math.random

  beforeEach(() => {
    mockSocket = {
      id: 'socket1',
      emit: vi.fn(),
      join: vi.fn(),
      nsp: {},
      client: {},
      recovered: false,
      handshake: {},
      connected: true,
      disconnected: false
    } as unknown as Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap>

    mockIo = {
      to: vi.fn().mockReturnValue({
        emit: vi.fn()
      }),
      sockets: {},
      engine: {},
      httpServer: {},
      _parser: {}
    } as unknown as Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap>

    gameStates = {
      tictactoe: {
        rooms: {},
        playerNumbers: {}
      }
    }
  })

  afterEach(() => {
    Math.random = originalRandom
    vi.clearAllMocks()
  })

  it('should randomly assign player1 or player2 to first player', async () => {
    // Mock Math.random to return 0.3 (less than 0.5, so player1)
    Math.random = vi.fn(() => 0.3)

    await onJoinRoom({
      data: { gameType: 'tictactoe', roomId: 'room1', playerNumber: 'player1' },
      socket: mockSocket,
      io: mockIo,
      gameStates
    })

    expect(mockSocket.emit).toHaveBeenCalledWith('playerNumber', {
      currentPlayer: 'player1',
      otherPlayer: undefined
    })
  })

  it('should assign opposite player number to second player', async () => {
    // Setup room with first player
    gameStates.tictactoe.rooms['room1'] = {
      id: 'room1',
      players: ['socket2'],
      board: Array(9).fill(null)
    }
    gameStates.tictactoe.playerNumbers['socket2'] = 'player1'

    await onJoinRoom({
      data: { gameType: 'tictactoe', roomId: 'room1', playerNumber: 'player2' },
      socket: mockSocket,
      io: mockIo,
      gameStates
    })

    expect(mockSocket.emit).toHaveBeenCalledWith('playerNumber', {
      currentPlayer: 'player2',
      otherPlayer: 'player1'
    })
  })

  it('should not allow more than 2 players in a room', async () => {
    // Setup room with two players
    gameStates.tictactoe.rooms['room1'] = {
      id: 'room1',
      players: ['socket1', 'socket2'],
      board: Array(9).fill(null)
    };
    gameStates.tictactoe.playerNumbers['socket1'] = 'player1';
    gameStates.tictactoe.playerNumbers['socket2'] = 'player2';

    await onJoinRoom({
      data: { gameType: 'tictactoe', roomId: 'room1', playerNumber: 'player1' },
      socket: mockSocket,
      io: mockIo,
      gameStates
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('error', 'Room is full');
    expect(gameStates.tictactoe.rooms['room1'].players.length).toBe(2);
  });
}) 