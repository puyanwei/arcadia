import { describe, it, expect, vi, beforeEach } from 'vitest'
import { onDisconnect } from '../onDisconnect'
import { GameRooms } from '../types'
import { Socket, Server } from 'socket.io'
import { DefaultEventsMap } from 'socket.io/dist/typed-events'

describe('onDisconnect', () => {
  let mockSocket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap>
  let mockIo: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap>
  let gameStates: Record<string, GameRooms>

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

  it('should remove player from room and notify other player when one player disconnects', () => {
    // Setup room with two players
    gameStates.tictactoe.rooms['room1'] = {
      id: 'room1',
      players: ['socket1', 'socket2'],
      board: Array(9).fill(null)
    }
    gameStates.tictactoe.playerNumbers['socket1'] = 'player1'
    gameStates.tictactoe.playerNumbers['socket2'] = 'player2'

    onDisconnect({
      socket: mockSocket,
      io: mockIo,
      gameStates
    })

    // Check that player was removed from room
    expect(gameStates.tictactoe.rooms['room1'].players).not.toContain('socket1')
    expect(gameStates.tictactoe.rooms['room1'].players).toContain('socket2')
    
    // Check that player number was removed
    expect(gameStates.tictactoe.playerNumbers['socket1']).toBeUndefined()
    
    // Check that other player was notified
    expect(mockIo.to).toHaveBeenCalledWith('room1')
    const mockEmit = mockIo.to('room1').emit
    expect(mockEmit).toHaveBeenCalledWith('playerLeft', 'Opponent left the game')
    expect(mockEmit).toHaveBeenCalledWith('gameEnd', { 
      winner: 'disconnect', 
      message: 'Opponent left the game' 
    })
  })

  it('should delete room when last player disconnects', () => {
    // Setup room with one player
    gameStates.tictactoe.rooms['room1'] = {
      id: 'room1',
      players: ['socket1'],
      board: Array(9).fill(null)
    }
    gameStates.tictactoe.playerNumbers['socket1'] = 'player1'

    onDisconnect({
      socket: mockSocket,
      io: mockIo,
      gameStates
    })

    // Check that room was deleted
    expect(gameStates.tictactoe.rooms['room1']).toBeUndefined()
    
    // Check that player number was removed
    expect(gameStates.tictactoe.playerNumbers['socket1']).toBeUndefined()
    
    // Check that no notifications were sent (since no other players)
    expect(mockIo.to).not.toHaveBeenCalled()
  })
}) 