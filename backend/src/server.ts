import express from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import {  OverallGameState, ClientData } from './shared/types';
import { handleMove } from "./games/tictactoe/handlers";
import { onJoinRoom } from "./shared/onJoinRoom";
import { onDisconnect } from "./shared/onDisconnect";
import { onRematch } from "./shared/onRematch";
import { onMove } from "./shared/onMove";

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

// Track active connections
const activeConnections = new Map<string, { 
  count: number; 
  lastSeen: Date;
  socketIds: Set<string>;
  tabs: number;
}>();

io.on('connection', (socket) => {
  const clientId = socket.handshake.auth.clientId || socket.id;
  const now = new Date();
  
  // Update connection tracking
  const existingConnection = activeConnections.get(clientId);
  activeConnections.set(clientId, {
    count: (existingConnection?.count || 0) + 1,
    lastSeen: now,
    socketIds: new Set([...(existingConnection?.socketIds || []), socket.id]),
    tabs: (existingConnection?.tabs || 0) + 1
  });

  console.log(`[Socket] Client connected - ID: ${clientId}, Socket ID: ${socket.id}`);
  console.log(`[Socket] Active tabs for client ${clientId}: ${activeConnections.get(clientId)?.tabs}`);
  console.log(`[Socket] Total unique clients: ${activeConnections.size}`);

  // Monitor connection health
  socket.on('ping', () => {
    const connection = activeConnections.get(clientId);
    if (connection) {
      connection.lastSeen = new Date();
      activeConnections.set(clientId, connection);
    }
  });

  socket.on('disconnect', () => {
    const connection = activeConnections.get(clientId);
    if (connection) {
      connection.socketIds.delete(socket.id);
      connection.tabs = Math.max(0, connection.tabs - 1);
      
      if (connection.tabs === 0) {
        activeConnections.delete(clientId);
        console.log(`[Socket] Removed all connections for client ${clientId}`);
      } else {
        activeConnections.set(clientId, connection);
        console.log(`[Socket] Client ${clientId} now has ${connection.tabs} active tabs`);
      }
    }
  });

  socket.on("joinRoom", (data: ClientData) => onJoinRoom({ data, gameStates, socket, io }));
  socket.on("rematch", (data: ClientData) => onRematch({ data, socket, io, gameStates }));
  socket.on("disconnect", () => onDisconnect({ socket, io, gameStates }));
  socket.on("move", (data: ClientData) => onMove({ data, gameStates, socket, io }));
});

// Cleanup stale connections every 5 minutes
setInterval(() => {
  const now = new Date();
  for (const [clientId, connection] of activeConnections.entries()) {
    if (now.getTime() - connection.lastSeen.getTime() > 5 * 60 * 1000) {
      activeConnections.delete(clientId);
      console.log(`[Socket] Removed stale connection for client ${clientId}`);
    }
  }
}, 5 * 60 * 1000);

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
