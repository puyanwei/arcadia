export type Cell = (string | null)
export type Board = Cell[]
export type PlayerNumber = 'player1' | 'player2';
export type RematchStatus = "waiting" | "pending" | null;
export type RematchState = {
  requested: boolean;
  requestedBy: string;
  status?: RematchStatus;
}; 