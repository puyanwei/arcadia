import { io } from "socket.io-client";

const socket = io(process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000", {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  autoConnect: true,
  transports: ['websocket', 'polling']
});

socket.on("connect_error", (error) => {
  console.error("Connection error:", error);
});

socket.on("connect_timeout", () => {
  console.error("Connection timeout");
});

socket.on("reconnect", (attemptNumber) => {
  console.log("Reconnected on attempt:", attemptNumber);
});

socket.on("reconnect_error", (error) => {
  console.error("Reconnection error:", error);
});

export default socket;
