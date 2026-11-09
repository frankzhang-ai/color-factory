export type Tier = 'GOOD' | 'GREAT' | 'PERFECT' | 'FANTASTIC';
export type SortResult = {
  correct: boolean;
  score: number;
  lives: number;
  combo: number;
  tier: Tier | null;
  gameOver: boolean;
};
export function tierForCombo(combo: number): Tier | null {
  if (combo >= 20 && (combo - 20) % 10 === 0)
    return 'FANTASTIC';
  if (combo === 10)
    return 'PERFECT';
  if (combo === 5)
    return 'GREAT';
  if (combo === 3)
    return 'GOOD';
  return null;
}
export class ScoreManager {
  score = 0;
  lives = 3;
  combo = 0;
  comboTier: Tier | null = null;
  sort(correct: boolean): SortResult {
    if (correct) {
      this.score++;
      this.combo++;
      this.comboTier = tierForCombo(this.combo) ?? this.comboTier;
    }
    else {
      this.lives = Math.max(0, this.lives - 1);
      this.combo = 0;
    }
    return { correct, score: this.score, lives: this.lives, combo: this.combo, tier: correct ? tierForCombo(this.combo) : null, gameOver: this.lives === 0 };
  }
  miss(): SortResult { return this.sort(false); }
}
