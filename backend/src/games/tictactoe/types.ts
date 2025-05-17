export type Cell = (string | null)
export type Board = Cell[]
export type PlayerSymbol = 'X' | 'O';
export type RematchStatus = "waiting" | "pending" | null;
export type RematchState = {
  requested: boolean;
  requestedBy: string;
  status?: RematchStatus;
}; 