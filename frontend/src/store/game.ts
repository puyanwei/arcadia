import { create } from 'zustand';
import { Board } from '../types/game';

interface GameStore {
  board: Board;
  setBoard: (board: Board) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  board: Array(9).fill(null),
  setBoard: (board) => set({ board }),
})); 