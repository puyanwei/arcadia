import { io } from "socket.io-client";

let socket: any;

if (typeof window !== 'undefined') {
  const backendUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";
  socket = io(backendUrl);

  socket.on("connect", () => {
    console.log('Socket connected successfully');
  });

  socket.on("connect_error", (error: Error) => {
    console.error("Connection error:", error);
  });
}

export default socket;
