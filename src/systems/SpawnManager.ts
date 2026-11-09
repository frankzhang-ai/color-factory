import { pickBallColor, pickLanes, type ColorName } from './DifficultyManager.ts';
export class SpawnManager {
  lanes: [
    ColorName,
    ColorName,
    ColorName
  ];
  private random: () => number;
  ballsSinceLaneDraw = 0;
  previous: ColorName | null = null;
  streak = 0;
  constructor(pool: readonly ColorName[] = ['coral', 'blue', 'mint'], random: () => number = Math.random) { this.random = random; this.lanes = pickLanes(pool, random); }
  next(pool: readonly ColorName[]): {
    color: ColorName;
    correctLane: number;
    newLanes: boolean;
  } {
    let newLanes = false;
    if (pool.length > 3 && this.ballsSinceLaneDraw >= 8) {
      this.lanes = pickLanes(pool, this.random);
      this.ballsSinceLaneDraw = 0;
      newLanes = true;
    }
    const color = pickBallColor(this.lanes, this.previous, this.streak, this.random);
    this.streak = color === this.previous ? this.streak + 1 : 1;
    this.previous = color;
    this.ballsSinceLaneDraw++;
    return { color, correctLane: this.lanes.indexOf(color), newLanes };
  }
}
