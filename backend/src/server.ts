import express from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import {  OverallGameState, ClientData, GameType, GameRooms, SocketHandlerParams } from './shared/types';
import { createInitialState } from './shared/state';
import { handleMove } from "./games/tictactoe/handlers";
import { onJoinRoom } from "./shared/onJoinRoom";
import { onDisconnect } from "./shared/onDisconnect";
import { onRematch } from "./shared/onRematch";
import { onMove } from "./shared/onMove";

dotenv.config();

const gameStates: Record<GameType, GameRooms> = {
  'tictactoe': createInitialState(),
};

const clientSocketMap: Record<string, string> = {};

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

app.get('/', (req, res) => {
  res.json({ 
    status: 'Server is running',
    rooms: {
      tictactoe: Object.keys(gameStates.tictactoe.rooms).length,
    }
  });
});

const httpServer = createServer(app);

const isProd = process.env.NODE_ENV === 'production';

const prodCors = {
  origin: [
    'https://arcardia.up.railway.app',
    'http://localhost:3000'
  ],
  methods: ["GET", "POST"],
  credentials: true,
  allowedHeaders: ["my-custom-header"],
};

const devCors = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST'],
};

const io = new Server(httpServer, {
  cors: isProd ? prodCors : devCors,
  allowEIO3: true,
  transports: ['websocket', 'polling']
});

io.on('connection', (socket) => {
  console.log(`[Socket] Client connected - Socket ID: ${socket.id}`);

  const handlerParams: SocketHandlerParams = {
    socket,
    io,
    gameStates,
    clientSocketMap,
  };

  socket.on('joinRoom', (data: ClientData) => onJoinRoom({ ...handlerParams, data }));
  socket.on('move', (data: ClientData) => onMove({ ...handlerParams, data }));
  socket.on('rematch', (data: ClientData) => onRematch({ ...handlerParams, data }));
  socket.on('disconnect', () => onDisconnect(handlerParams));
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
