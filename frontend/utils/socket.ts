import { io } from "socket.io-client";

let socket: any;

if (typeof window !== 'undefined') {
  const backendUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";
  
  // Add connection options for secure WebSocket
  socket = io(backendUrl, {
    transports: ['websocket', 'polling'],
    secure: true,
    rejectUnauthorized: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  });

  socket.on("connect", () => {
    console.log('Socket connected successfully to:', backendUrl);
  });

  socket.on("connect_error", (error: Error) => {
    console.error("Connection error:", error);
    console.log("Failed to connect to:", backendUrl);
  });

  socket.on("disconnect", (reason: string) => {
    console.log("Socket disconnected:", reason);
  });
}

export default socket;
