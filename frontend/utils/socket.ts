import { io } from "socket.io-client";

let socket: any;

if (typeof window !== 'undefined') {
  // Environment variable validation
  if (!process.env.NEXT_PUBLIC_SOCKET_URL) {
    console.error('⚠️ NEXT_PUBLIC_SOCKET_URL is not defined in environment variables!');
    console.error('Please set NEXT_PUBLIC_SOCKET_URL in your Railway environment variables.');
  }
  
  const backendUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";
  console.log('Socket.IO Configuration:', {
    backendUrl,
    isDevelopment: process.env.NODE_ENV === 'development',
    hasSocketUrl: !!process.env.NEXT_PUBLIC_SOCKET_URL
  });
  
  socket = io(backendUrl, {
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    autoConnect: false,
    transports: ['websocket', 'polling']
  });

  socket.on("connect", () => {
    console.log('Socket connected successfully to:', backendUrl);
  });

  socket.on("connect_error", (error: Error) => {
    console.error("Connection error:", {
      error: error.message,
      backendUrl,
      socketId: socket.id,
      isConnected: socket.connected,
      envCheck: {
        hasSocketUrl: !!process.env.NEXT_PUBLIC_SOCKET_URL,
        nodeEnv: process.env.NODE_ENV
      }
    });
  });

  socket.on("connect_timeout", () => {
    console.error("Connection timeout. Configuration:", {
      backendUrl,
      socketId: socket.id,
      isConnected: socket.connected
    });
  });

  socket.on("reconnect", (attemptNumber: number) => {
    console.log("Reconnected on attempt:", attemptNumber, "to:", backendUrl);
  });

  socket.on("reconnect_error", (error: Error) => {
    console.error("Reconnection error:", {
      error: error.message,
      backendUrl,
      socketId: socket.id,
      isConnected: socket.connected
    });
  });
}

export default socket;
