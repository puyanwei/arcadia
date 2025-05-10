 "use client";

import { useParams } from 'next/navigation';
import TicTacToe from '@/games/tictactoe/Board';

type GameComponents = {
  [key: string]: React.ComponentType;
};

const gameComponents: GameComponents = {
  tictactoe: TicTacToe,
  // Add more games here as you create them
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

  return <GameComponent />;
}