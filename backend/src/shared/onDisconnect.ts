import { SocketHandlerParams, GameRoom, GameType } from "./types";

export function onDisconnect({ socket, gameStates, clientSocketMap, io }: SocketHandlerParams) {
    const clientId = clientSocketMap[socket.id];
    if (!clientId) return;

    console.log(`[onDisconnect] Client ${clientId} (${socket.id}) disconnected.`);

    // Find which room the player was in
    let playerRoom: GameRoom | null = null;
    let gameType: GameType | null = null;

    for (const type in gameStates) {
        const game = gameStates[type as keyof typeof gameStates];
        for (const room of Object.values(game.rooms)) {
            if (room.players.includes(clientId)) {
                playerRoom = room;
                gameType = type as GameType;
                break;
            }
        }
        if (playerRoom) break;
    }
    
    if (playerRoom && gameType) {
        // Remove player from the room
        playerRoom.players = playerRoom.players.filter((id: string) => id !== clientId);
        io.to(playerRoom.id).emit('playerLeft', clientId);

        console.log(`[onDisconnect] Removed ${clientId} from room ${playerRoom.id}. Players remaining: ${playerRoom.players.length}`);

        // If room is empty, delete it
        if (playerRoom.players.length === 0) {
            delete gameStates[gameType as keyof typeof gameStates].rooms[playerRoom.id];
            console.log(`[onDisconnect] Deleted empty room ${playerRoom.id}.`);
        }
    }

    // Clean up maps
    delete clientSocketMap[socket.id];
    // Note: We don't delete from playerNumbers here, as they might reconnect.
    // A better system would have a timeout for this.
}
  