import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());  // Add cors middleware

app.get('/', (req, res) => {
  res.json({ 
    status: 'Server is running',
    rooms: Object.keys(rooms).length
  });
});

const server = createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || "*" },
});

const rooms: Record<string, string[]> = {}; // Stores players per room

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinRoom", (roomId) => {
    if (!rooms[roomId]) rooms[roomId] = [];
    if (rooms[roomId].length < 2) {
      rooms[roomId].push(socket.id);
      socket.join(roomId);
      console.log(`User ${socket.id} joined room ${roomId}`);
      io.to(roomId).emit("playerJoined", rooms[roomId]);
    } else {
      socket.emit("roomFull");
    }
  });

  socket.on("makeMove", ({ roomId, board }) => {
    socket.to(roomId).emit("updateBoard", board);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    for (const roomId in rooms) {
      rooms[roomId] = rooms[roomId].filter((id) => id !== socket.id);
      io.to(roomId).emit("playerLeft", rooms[roomId]);
    }
  });
});

const PORT = parseInt(process.env.PORT || '5000', 10);
server.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
