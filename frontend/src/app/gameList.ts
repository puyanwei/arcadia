type Game = {
    id: string;
    name: string;
    description: string;
    path: string;
  };
  
  export const games: Game[] = [
        {
            id: 'tictactoe',
            name: 'Tic Tac Toe',
            description: 'Classic two-player game of X\'s and O\'s',
            path: '/games/tictactoe'
        },
        {
            id: 'connect-four',
            name: 'Connect Four',
            description: 'Classic two-player game of Connect Four (Pending)',
            path: '/games/connect-four'
        }
  ] as const;
  