"use client";

import Link from 'next/link';
import { games } from './gameList';


export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-8 text-center">Welcome to Arcadia</h1>
      
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {games.map(({description, id, name, path}) => (
          <Link 
            key={id}
            href={path}
            className="block p-6 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <h2 className="text-2xl font-semibold mb-2">{name}</h2>
            <p className="text-gray-400">{description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}