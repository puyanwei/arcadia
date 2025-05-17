import { useState } from "react";

import { useConnectFour } from "./useConnectFour";
export default function ConnectFour() {
    const { board, boardGrid } = useConnectFour();
    const [gameStatus] = useState("Enter a room ID to start"); // Placeholder for now
 

    return (
        <div className="flex flex-col items-center p-5 text-white min-h-screen">
            <h1 className="text-xl font-bold mb-4 text-white">Connect Four</h1>

            {/* Status area */}
            <div className="mb-4 text-center text-white">
                {gameStatus}
            </div>

            {/* Player info placeholder */}
            <div className="mb-4 text-center">
                <span className="px-3 py-1 rounded bg-gray-600">Player info</span>
            </div>

            {/* Board grid (dynamic columns) */}
            <div
                className={`grid gap-4 p-4 bg-blue-700 rounded`}
                style={{ gridTemplateColumns: `repeat(${boardGrid.columns}, minmax(0, 1fr))` }}
            >
                {board.map((cell, i) => (
                    <button
                        key={i}
                        className={`w-16 h-16 flex items-center justify-center text-2xl border border-gray-400 rounded-full text-shadow-2xl
                          ${!cell ? 'bg-gray-500 hover:bg-gray-400' : cell === 'Red' ? 'bg-red-300 text-white' : 'bg-yellow-200 text-black'}`}
                        disabled={!!cell}
                    >
                        {cell || ''}
                    </button>
                ))}
            </div>
        </div>
    );
}