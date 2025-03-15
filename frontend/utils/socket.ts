import { io } from "socket.io-client";

let socket: any;

if (typeof window !== 'undefined') {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
  console.log('Connecting to backend:', backendUrl);
  
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
    console.log('Socket connected successfully');
  });

  socket.on("connect_error", (error: Error) => {
    console.error("Connection error:", error, "Backend URL:", backendUrl);
  });

  socket.on("connect_timeout", () => {
    console.error("Connection timeout to:", backendUrl);
  });

  socket.on("reconnect", (attemptNumber: number) => {
    console.log("Reconnected on attempt:", attemptNumber, "to:", backendUrl);
  });

  socket.on("reconnect_error", (error: Error) => {
    console.error("Reconnection error:", error, "Backend URL:", backendUrl);
  });
}

export default socket;
