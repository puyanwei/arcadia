import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

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
app.use(cors());  // Add cors middleware

app.get('/', (req, res) => {
  res.json({ 
    status: 'Server is running',
    rooms: Object.keys(rooms).length
  });
});

// Create HTTP server first
const httpServer = createServer(app);

// Initialize Socket.IO with the HTTP server
const io = new Server(httpServer, {
  cors: {
    origin: DEV ? '*' : process.env.FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true
  },
});

const rooms: Record<string, string[]> = {}; // Stores players per room
const playerSymbols: Record<string, "X" | "O"> = {}; // Stores player symbols

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinRoom", (roomId) => {
    // Check if player is already in a room
    const currentRoom = Object.keys(rooms).find(room => rooms[room].includes(socket.id));
    if (currentRoom) {
      socket.emit("error", "You are already in a room");
      return;
    }

    // Initialize room if it doesn't exist
    if (!rooms[roomId]) {
      rooms[roomId] = [];
    }

    // Check room capacity
    if (rooms[roomId].length >= 2) {
      socket.emit("roomFull");
      return;
    }

    // Join room and assign symbol
    rooms[roomId].push(socket.id);
    socket.join(roomId);
    
    const symbol = rooms[roomId].length === 1 ? "X" : "O";
    playerSymbols[socket.id] = symbol;
    socket.emit("playerSymbol", symbol);
    
    console.log(`User ${socket.id} joined room ${roomId} as ${symbol}`);
    io.to(roomId).emit("playerJoined", rooms[roomId].length);

    // If room is now full, notify players
    if (rooms[roomId].length === 2) {
      io.to(roomId).emit("gameStart", true);
    }
  });

  socket.on("makeMove", ({ roomId, board }) => {
    // Verify player is in the room
    if (!rooms[roomId]?.includes(socket.id)) {
      socket.emit("error", "You are not in this room");
      return;
    }
    socket.to(roomId).emit("updateBoard", board);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    
    // Find and clean up the room the player was in
    for (const roomId in rooms) {
      if (rooms[roomId].includes(socket.id)) {
        rooms[roomId] = rooms[roomId].filter(id => id !== socket.id);
        
        // Notify remaining player
        if (rooms[roomId].length > 0) {
          io.to(roomId).emit("playerLeft", "Opponent left the game");
          io.to(roomId).emit("gameEnd", true);
        } else {
          // Delete empty room
          delete rooms[roomId];
        }
      }
    }
    
    delete playerSymbols[socket.id];
  });
});

// Listen with the httpServer, not the Express app
httpServer.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
  console.log('Server is ready to accept connections');
});

// Add error handling
httpServer.on('error', (error) => {
  console.error('Server error:', error);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});
