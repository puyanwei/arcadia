import { Prettify } from '../../utils/types';
import { Board } from '../tictactoe/types';

export type ConnectFourCell = Prettify<PlayerNumber | 'invalid' | 'valid'>
export type ConnectFourBoard = ConnectFourCell[];
export type PlayerNumber = 'player1' | 'player2'; 