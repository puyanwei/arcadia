import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { GameState } from './game/types';
import {
  createInitialState,
  addPlayerToRoom,
  removePlayerFromRoom,
  updateBoard,
  isPlayerInAnyRoom,
  getPlayerRoom,
  getPlayerSymbol,
  checkWinner
} from './game/state';

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

// Initialize game state
let gameState: GameState = createInitialState();

app.get('/', (req, res) => {
  res.json({ 
    status: 'Server is running',
    rooms: gameState.rooms.size
  });
});

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: [
      'https://ttt-multiplayer.up.railway.app',
      'http://localhost:3000'
    ],
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["my-custom-header"],
  },
  allowEIO3: true,
  transports: ['websocket', 'polling']
});

function emitGameState(roomId: string) {
  const room = gameState.rooms.get(roomId);
  if (room) {
    io.to(roomId).emit("playerJoined", room.players.length);
    if (room.players.length === 2) {
      io.to(roomId).emit("gameStart", true);
    }
  }
}

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinRoom", (roomId) => {
    if (isPlayerInAnyRoom(gameState, socket.id)) {
      socket.emit("error", "You are already in a room");
      return;
    }

    const room = gameState.rooms.get(roomId);
    if (room?.players.length >= 2) {
      socket.emit("roomFull");
      return;
    }

    gameState = addPlayerToRoom(gameState, roomId, socket.id);
    socket.join(roomId);

    const symbol = getPlayerSymbol(gameState, socket.id);
    if (symbol) {
      socket.emit("playerSymbol", symbol);
      console.log(`User ${socket.id} joined room ${roomId} as ${symbol}`);
    }

    emitGameState(roomId);
  });

  socket.on("playAgain", (roomId) => {
    const room = gameState.rooms.get(roomId);
    if (!room) return;

    // Reset the board
    const emptyBoard = Array(9).fill(null);
    gameState = updateBoard(gameState, roomId, emptyBoard);

    // Randomly decide if we swap who goes first
    const shouldSwapFirst = Math.random() < 0.5;
    
    // Notify players of game start and board reset
    io.to(roomId).emit("updateBoard", emptyBoard);
    io.to(roomId).emit("gameStart", shouldSwapFirst);
  });

  socket.on("makeMove", ({ roomId, board }) => {
    const room = getPlayerRoom(gameState, socket.id);
    if (!room || room.id !== roomId) {
      socket.emit("error", "You are not in this room");
      return;
    }

    gameState = updateBoard(gameState, roomId, board);
    socket.to(roomId).emit("updateBoard", board);

    // Check for win or draw
    const result = checkWinner(board);
    if (result) {
      const message = result === 'draw' 
        ? "Game ended in a draw!" 
        : `Player ${result} wins!`;
      
      io.to(roomId).emit("gameEnd", { winner: result, message });
      
      // Reset the room's board
      const emptyBoard = Array(9).fill(null);
      gameState = updateBoard(gameState, roomId, emptyBoard);
      io.to(roomId).emit("updateBoard", emptyBoard);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    
    const room = getPlayerRoom(gameState, socket.id);
    if (room) {
      gameState = removePlayerFromRoom(gameState, room.id, socket.id);
      
      if (gameState.rooms.has(room.id)) {
        io.to(room.id).emit("playerLeft", "Opponent left the game");
        io.to(room.id).emit("gameEnd", true);
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
