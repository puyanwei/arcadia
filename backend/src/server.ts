import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { GameState, RematchState } from './game/types';
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
let rematchStates = new Map<string, RematchState>();

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

    const currentRematchState = rematchStates.get(roomId);
    
    if (!currentRematchState) {
      // First player requesting rematch
      rematchStates.set(roomId, {
        requested: true,
        requestedBy: socket.id
      });
      
      // Notify both players about the rematch request
      socket.emit("rematchState", { status: "waiting", message: "Waiting for opponent to accept..." });
      socket.to(roomId).emit("rematchState", { status: "pending", message: "Opponent wants a rematch!" });
      return;
    }

    if (currentRematchState.requestedBy !== socket.id) {
      // Second player accepted the rematch
      rematchStates.delete(roomId);

      // Reset the board
      const emptyBoard = Array(9).fill(null);
      gameState = updateBoard(gameState, roomId, emptyBoard);

      // Randomly decide if we swap who goes first
      const shouldSwapFirst = Math.random() < 0.5;
      
      // Notify players of game start and board reset
      io.to(roomId).emit("updateBoard", emptyBoard);
      io.to(roomId).emit("gameStart", shouldSwapFirst);
    }
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
      if (result === 'draw') {
        // Send draw message to all players in the room
        io.to(roomId).emit("gameEnd", { 
          winner: 'draw', 
          message: "Game ended in a draw!" 
        });
      } else {
        // Send different messages to winner and loser
        const winnerSymbol = result;
        room.players.forEach(playerId => {
          const playerSymbol = getPlayerSymbol(gameState, playerId);
          const isWinner = playerSymbol === winnerSymbol;
          io.to(playerId).emit("gameEnd", {
            winner: result,
            message: isWinner ? "You won!" : "You lost!"
          });
        });
      }
      
      // Don't reset the board immediately - let players see the final state
      // The board will be reset when both players accept the rematch
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    
    const room = getPlayerRoom(gameState, socket.id);
    if (room) {
      // Clear rematch state when a player disconnects
      rematchStates.delete(room.id);
      
      gameState = removePlayerFromRoom(gameState, room.id, socket.id);
      
      if (gameState.rooms.has(room.id)) {
        io.to(room.id).emit("playerLeft", "Opponent left the game");
        io.to(room.id).emit("gameEnd", { winner: 'disconnect', message: "Opponent left the game" });
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
