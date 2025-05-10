"use client";

import Link from 'next/link';

type Game = {
  id: string;
  name: string;
  description: string;
  path: string;
};

const games: Game[] = [
  {
    id: 'tictactoe',
    name: 'Tic Tac Toe',
    description: 'Classic two-player game of X\'s and O\'s',
    path: '/games/tictactoe'
  },
  // Add more games here as you create them
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-8 text-center">Welcome to Arcadia</h1>
      
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {games.map((game) => (
          <Link 
            key={game.id}
            href={game.path}
            className="block p-6 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <h2 className="text-2xl font-semibold mb-2">{game.name}</h2>
            <p className="text-gray-400">{game.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}