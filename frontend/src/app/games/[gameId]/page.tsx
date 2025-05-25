"use client";

import { useParams } from "next/navigation";
import { TicTacToe } from "@/components/game-modules/tictactoe/TicTacToe";
import { ConnectFour } from "@/components/game-modules/connect-four/ConnectFour";

type GameComponents = Record<string, React.ComponentType>;

const gameComponents: GameComponents = {
  tictactoe: TicTacToe,
  "connect-four": ConnectFour,
};

export default function GamePage() {
  const { gameId } = useParams();

  const GameComponent = gameComponents[gameId as string];

  if (!GameComponent) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <h1 className="text-2xl text-center">Game not found</h1>
      </div>
    );
  }

  return (
    <div className="p-8">
      <GameComponent />
    </div>
  );
}
