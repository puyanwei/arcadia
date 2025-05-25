import express from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { RematchState, GameRooms, OverallGameState } from './shared/types';
import { onDisconnect, onJoinRoom, onPlayAgain, ClientData } from "./games/shared-handlers";
import { handleMove } from "./games/tictactoe/handlers";

dotenv.config();

const gameStates: OverallGameState = {
  tictactoe: { rooms: {}, playerNumbers: {} },
  'connect-four': { rooms: {}, playerNumbers: {} }
};

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
      'connect-four': Object.keys(gameStates['connect-four'].rooms).length
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
})

io.on("connection", (socket: Socket) => {
  console.log("User connected:", socket.id);
  socket.on("joinRoom", (data: SocketHandlerData) => onJoinRoom({ data, gameStates, socket, io }));
  // socket.on("playAgain", (data: SocketHandlerData) => onPlayAgain({ data, socket, io, gameStates, rematchStates }));
  // socket.on("disconnect", () => onDisconnect({ socket, io, gameStates, rematchStates }));
  // Tic Tac Toe
  socket.on("ticTacToe:move", (data: ClientData) => handleMove({ 
    gameRooms: gameStates.tictactoe,
    roomId: data.roomId,
    playerNumber: data.playerNumber,
    move: { board: data.board },
    socket,
    io
  }));
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
