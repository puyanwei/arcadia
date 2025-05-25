import { useState } from 'react';

type JoinRoomFormProps = {
  onJoin: (roomId: string) => void;
}

export function JoinRoomForm({ onJoin }: JoinRoomFormProps) {
  const [roomId, setRoomId] = useState('');

  return (
    <div className="flex flex-col gap-2">
      <input
        className="border p-2 rounded-lg"
        placeholder="Enter Room ID"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
      />
      <button
        onClick={() => onJoin(roomId)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Join Game
      </button>
    </div>
  );
} 