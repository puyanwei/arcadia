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
  ] as const;
  