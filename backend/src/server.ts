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
  getPlayerSymbol
} from './game/state';

dotenv.config();

const HOST = '0.0.0.0';
const PORT = parseInt(process.env.PORT || '3000');
const DEV = process.env.NODE_ENV === 'development';

// Add startup logging
console.log('Starting server with environment:', {
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT
});

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
    origin: DEV ? '*' : process.env.FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true
  },
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

  socket.on("makeMove", ({ roomId, board }) => {
    const room = getPlayerRoom(gameState, socket.id);
    if (!room || room.id !== roomId) {
      socket.emit("error", "You are not in this room");
      return;
    }

    gameState = updateBoard(gameState, roomId, board);
    socket.to(roomId).emit("updateBoard", board);
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
