export const COLORS = ['coral', 'blue', 'mint', 'yellow', 'lavender'] as const;
export type ColorName = typeof COLORS[number];
export type Difficulty = {
  band: number;
  colorsInPool: number;
  travelMs: number;
  gapMs: number;
};
export function getDifficulty(score: number): Difficulty {
  const band = score >= 76 ? 6 : score >= 51 ? 5 : score >= 31 ? 4 : score >= 21 ? 3 : score >= 11 ? 2 : 1;
  // The opening is intentionally forgiving; later bands alter only one axis each.
  const colorsInPool = score >= 51 ? 5 : score >= 21 ? 4 : 3;
  // Rhythmic opening: first ball reaches the junction in ~2.4s; early gaps stay short.
  const travelMs = score >= 76 ? Math.max(900, 1550 - (score - 76) * 15) : score >= 11 ? 2200 : 2400;
  const gapMs = score >= 31 ? 360 : 430;
  return { band, colorsInPool, travelMs, gapMs };
}
export function pickLanes(pool: readonly ColorName[], random: () => number = Math.random): [
  ColorName,
  ColorName,
  ColorName
] {
  const copy = [...pool];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return [copy[0], copy[1], copy[2]];
}
export function pickBallColor(lanes: readonly ColorName[], previous: ColorName | null, streak: number, random: () => number = Math.random): ColorName {
  const options = streak >= 3 && previous ? lanes.filter(c => c !== previous) : lanes;
  return options[Math.floor(random() * options.length)];
}
