import { ConnectFourCell } from "./types";
import { useConnectFour } from "./useConnectFour";

export default function ConnectFour() {
    const { cellStates, currentPlayer, handleCellClick, columns, rows, roomState } = useConnectFour();

    function getCellClassName(cell: ConnectFourCell) {
        const base = "w-16 h-16 flex items-center justify-center text-2xl border border-gray-400 rounded-full text-shadow-2xl";
        const valid = "bg-gray-500 hover:bg-gray-400 cursor-pointer";
        const yellow = "bg-yellow-200 text-black";
        const red = "bg-red-300 text-white";
        const invalid = "bg-gray-300 text-gray-400 cursor-not-allowed";
        if (cell === 'valid') return `${base} ${valid}`;
        if (cell === 'yellow') return `${base} ${yellow}`;
        if (cell === 'red') return `${base} ${red}`;
        if (cell === 'invalid') return `${base} ${invalid}`;
    }

    return (
        <div className="flex flex-col items-center p-5 text-white min-h-screen">
            <h1 className="text-xl font-bold mb-4 text-white">Connect Four</h1>

            {/* Status area */}
            <div className="mb-4 text-center text-white">
                {roomState.gameStatus}
            </div>

            {/* Player info */}
            <div className="mb-4 text-center">
                <span className="px-3 py-1 rounded bg-gray-600">Current player: {currentPlayer}</span>
            </div>

            {/* Board grid (dynamic columns) */}
            <div
                className={`grid gap-4 p-4 bg-blue-700 rounded`}
                style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
            >
                {cellStates.map((cell, i) => {
                    const cellClassName = getCellClassName(cell);
                    return (
                        <button
                            key={i}
                            className={cellClassName}
                            disabled={cell !== 'valid'}
                            onClick={() => handleCellClick(i)}
                    >
                        {cell === 'yellow' ? '●' : cell === 'red' ? '●' : ''}
                    </button>
                    );
                })}
            </div>
        </div>
    );
}