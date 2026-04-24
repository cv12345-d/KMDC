export interface SudokuPuzzle {
  id: number;
  level: 1 | 2;
  puzzle: number[];   // 81 cells, 0 = empty
  solution: number[]; // 81 cells, complete
}

// Level 1 = Facile (~30 cases données)
// Level 2 = Moyen  (~22 cases données)
export const PUZZLES: SudokuPuzzle[] = [
  {
    id: 1,
    level: 1,
    // Puzzle canonique Wikipedia — validé
    puzzle: [
      5,3,0,0,7,0,0,0,0,
      6,0,0,1,9,5,0,0,0,
      0,9,8,0,0,0,0,6,0,
      8,0,0,0,6,0,0,0,3,
      4,0,0,8,0,3,0,0,1,
      7,0,0,0,2,0,0,0,6,
      0,6,0,0,0,0,2,8,0,
      0,0,0,4,1,9,0,0,5,
      0,0,0,0,8,0,0,7,9,
    ],
    solution: [
      5,3,4,6,7,8,9,1,2,
      6,7,2,1,9,5,3,4,8,
      1,9,8,3,4,2,5,6,7,
      8,5,9,7,6,1,4,2,3,
      4,2,6,8,5,3,7,9,1,
      7,1,3,9,2,4,8,5,6,
      9,6,1,5,3,7,2,8,4,
      2,8,7,4,1,9,6,3,5,
      3,4,5,2,8,6,1,7,9,
    ],
  },
  {
    id: 2,
    level: 1,
    // Dérivé du puzzle Wikipedia — 6 cases supplémentaires données (très facile)
    puzzle: [
      5,3,4,0,7,0,9,0,0,
      6,0,0,1,9,5,0,0,0,
      0,9,8,0,4,0,0,6,0,
      8,5,0,0,6,0,0,0,3,
      4,0,0,8,0,3,0,0,1,
      7,0,0,0,2,0,0,5,6,
      0,6,0,0,3,0,2,8,0,
      0,0,7,4,1,9,0,0,5,
      0,0,0,0,8,0,0,7,9,
    ],
    solution: [
      5,3,4,6,7,8,9,1,2,
      6,7,2,1,9,5,3,4,8,
      1,9,8,3,4,2,5,6,7,
      8,5,9,7,6,1,4,2,3,
      4,2,6,8,5,3,7,9,1,
      7,1,3,9,2,4,8,5,6,
      9,6,1,5,3,7,2,8,4,
      2,8,7,4,1,9,6,3,5,
      3,4,5,2,8,6,1,7,9,
    ],
  },
  {
    id: 3,
    level: 2,
    // Même solution, beaucoup moins de cases données
    puzzle: [
      5,0,0,0,7,0,0,0,0,
      0,0,0,1,9,5,0,0,0,
      0,9,0,0,0,0,0,6,0,
      8,0,0,0,0,0,0,0,3,
      4,0,0,8,0,3,0,0,1,
      7,0,0,0,2,0,0,0,0,
      0,6,0,0,0,0,2,8,0,
      0,0,0,4,1,9,0,0,5,
      0,0,0,0,0,0,0,7,9,
    ],
    solution: [
      5,3,4,6,7,8,9,1,2,
      6,7,2,1,9,5,3,4,8,
      1,9,8,3,4,2,5,6,7,
      8,5,9,7,6,1,4,2,3,
      4,2,6,8,5,3,7,9,1,
      7,1,3,9,2,4,8,5,6,
      9,6,1,5,3,7,2,8,4,
      2,8,7,4,1,9,6,3,5,
      3,4,5,2,8,6,1,7,9,
    ],
  },
  {
    id: 4,
    level: 2,
    // Variante niveau 2 — cases différentes retirées
    puzzle: [
      0,3,0,0,0,8,9,0,2,
      6,0,0,0,9,0,0,4,0,
      0,0,8,3,0,0,0,0,7,
      0,0,9,7,0,0,0,2,0,
      0,2,0,0,5,0,0,9,0,
      0,1,0,0,0,4,8,0,0,
      9,0,0,0,0,7,0,0,4,
      0,8,0,0,1,0,0,0,5,
      3,0,5,2,0,0,0,7,0,
    ],
    solution: [
      5,3,4,6,7,8,9,1,2,
      6,7,2,1,9,5,3,4,8,
      1,9,8,3,4,2,5,6,7,
      8,5,9,7,6,1,4,2,3,
      4,2,6,8,5,3,7,9,1,
      7,1,3,9,2,4,8,5,6,
      9,6,1,5,3,7,2,8,4,
      2,8,7,4,1,9,6,3,5,
      3,4,5,2,8,6,1,7,9,
    ],
  },
];

export function getRandomPuzzle(level: 1 | 2): SudokuPuzzle {
  const pool = PUZZLES.filter(p => p.level === level);
  return pool[Math.floor(Math.random() * pool.length)];
}

export function isBoardSolved(board: number[], solution: number[]): boolean {
  return board.length === 81 && board.every((v, i) => v !== 0 && v === solution[i]);
}

export function getErrorCells(board: number[], solution: number[]): Set<number> {
  const errors = new Set<number>();
  board.forEach((v, i) => {
    if (v !== 0 && v !== solution[i]) errors.add(i);
  });
  return errors;
}
