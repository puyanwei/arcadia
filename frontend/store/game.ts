import { create } from "zustand";

type GameState = {
  board: string[];
  currentPlayer: string;
  setBoard: (board: string[]) => void;
  setCurrentPlayer: (player: string) => void;
};

export const useGameStore = create<GameState>((set) => ({
  board: Array(9).fill(""),
  currentPlayer: "X",
  setBoard: (board) => set({ board }),
  setCurrentPlayer: (player) => set({ currentPlayer: player }),
}));
