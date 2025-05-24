import express from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { gameHandlers, GameState, GameType } from './games';
import { emitGameState } from './games/tictactoe/handlers';
import { getPlayerRoom } from "./games/tictactoe/state";
import { RematchState } from './games/tictactoe/types';

dotenv.config();

// Environment variable validation
const requiredEnvVars = {
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  FRONTEND_URL: process.env.FRONTEND_URL
};

const missingEnvVars = Object.entries(requiredEnvVars)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach(envVar => {
    console.error(`   - ${envVar}`);
  });
  console.error('\nPlease set these environment variables in Railway.');
  process.exit(1);
}

// Log configuration
console.log('Server Configuration:', {
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  FRONTEND_URL: process.env.FRONTEND_URL,
  RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT
});

const HOST = '0.0.0.0';
const PORT = parseInt(process.env.PORT || '3000');
const DEV = process.env.NODE_ENV === 'development';

const app = express();
app.use(cors());
app.use(express.json());

// Initialize game states and rematch states
const gameStates = new Map(
  Object.entries(gameHandlers).map(([gameType, handler]) => [
    gameType,
    handler.createInitialState()
  ])
);
const rematchStates = new Map<string, RematchState>();

app.get('/', (req, res) => {
  res.json({ 
    status: 'Server is running',
    rooms: {
      tictactoe: gameStates.get('tictactoe')?.rooms.size || 0,
      'connect-four': gameStates.get('connect-four')?.rooms.size || 0
    }
  });
});

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: [
      'https://arcardia.up.railway.app',
      'http://localhost:3000'
    ],
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["my-custom-header"],
  },
  allowEIO3: true,
  transports: ['websocket', 'polling']
});

function getGameTypeFromRoom(roomId: string): GameType {
  // Check each game state to find the room
  for (const [gameType, gameState] of gameStates.entries()) {
    if (gameState.rooms.has(roomId)) {
      return gameType as GameType;
    }
  }
  return 'tictactoe'; // Default to tictactoe if room not found
}

function validateGameType(gameType: string): gameType is GameType {
  return gameType in gameHandlers;
}

io.on("connection", (socket: Socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinRoom", ({ gameType, roomId }) => {
    if (!validateGameType(gameType)) {
      socket.emit("error", "Invalid game type");
      return;
    }

    const handler = gameHandlers[gameType];
    if (!handler) {
      socket.emit("error", "Invalid game handler");
      return;
    }

    try {
      const gameState = gameStates.get(gameType)!;
      const newGameState = handler.handleJoinRoom(gameState, roomId, socket.id);
      gameStates.set(gameType, newGameState);
      
      socket.join(roomId);
      const symbol = handler.getPlayerSymbol(newGameState, socket.id);
      if (symbol) {
        socket.emit("playerSymbol", symbol);
      }
      
      emitGameState(io, newGameState, roomId);
    } catch (error) {
      socket.emit("error", error.message);
    }
  });

  socket.on("playAgain", ({ gameType, roomId }) => {
    const handler = gameHandlers[gameType];
    const gameState = gameStates.get(gameType)!;
    const room = gameState.rooms.get(roomId);
    if (!room) return;

    const currentRematchState = rematchStates.get(roomId);
    const { newGameState, newRematchState } = handler.handleRematch(
      gameState,
      roomId,
      socket.id,
      currentRematchState,
      socket,
      io
    );

    gameStates.set(gameType, newGameState);
    if (newRematchState) {
      rematchStates.set(roomId, newRematchState);
    } else {
      rematchStates.delete(roomId);
    }
  });

  socket.on("makeMove", ({ gameType, roomId, board }) => {
    const room = getPlayerRoom(gameStates.get(gameType)!, socket.id);
    if (!room || room.id !== roomId) {
      socket.emit("error", "You are not in this room");
      return;
    }

    const handler = gameHandlers[gameType];
    if (!handler) {
      socket.emit("error", "Game handler not found");
      return;
    }

    const newGameState = handler.handleMakeMove(gameStates.get(gameType)!, roomId, socket.id, { board });
    gameStates.set(gameType, newGameState);
    socket.to(roomId).emit("updateBoard", board);

    // Check for win or draw
    const result = handler.checkWinner(board);
    if (result) {
      if (result === 'draw') {
        io.to(roomId).emit("gameEnd", { 
          winner: 'draw', 
          message: "Game ended in a draw!" 
        });
      } else {
        const winnerSymbol = result;
        room.players.forEach(playerId => {
          const playerSymbol = handler.getPlayerSymbol(gameStates.get(gameType)!, playerId);
          const isWinner = playerSymbol === winnerSymbol;
          io.to(playerId).emit("gameEnd", {
            winner: result,
            message: isWinner ? "You won!" : "You lost!"
          });
        });
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    
    // Check all game states for the disconnected player
    for (const [gameType, gameState] of gameStates.entries()) {
      const room = getPlayerRoom(gameState, socket.id);
      if (room) {
        rematchStates.delete(room.id);
        
        const handler = gameHandlers[gameType];
        if (handler) {
          const newGameState = handler.handleDisconnect(gameState, room.id, socket.id);
          gameStates.set(gameType, newGameState);
          
          if (gameStates.get(gameType)!.rooms.has(room.id)) {
            io.to(room.id).emit("playerLeft", "Opponent left the game");
            io.to(room.id).emit("gameEnd", { winner: 'disconnect', message: "Opponent left the game" });
          }
        }
        break; // Found the room, no need to check other game states
      }
    }
  });
});

httpServer.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
  console.log('Server is ready to accept connections');
});

httpServer.on('error', (error) => {
  console.error('Server error:', error);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});
