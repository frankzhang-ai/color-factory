import Phaser from 'phaser';
import type { ColorName } from '../systems/DifficultyManager.ts';
export const HEX: Record<ColorName, number> = { coral: 0xE98980, blue: 0x85B9D8, mint: 0x9AC9AC, yellow: 0xE9CD83, lavender: 0xB8A6D9 };
export const INK = '#353431';
export function text(scene: Phaser.Scene, x: number, y: number, value: string, size: number, color = INK, weight = '700'): Phaser.GameObjects.Text { return scene.add.text(x, y, value, { fontFamily: '-apple-system, "SF Pro Rounded", system-ui, sans-serif', fontSize: size + 'px', color, fontStyle: weight === '700' ? 'bold' : 'normal', align: 'center' }).setOrigin(0.5); }
export function symbol(g: Phaser.GameObjects.Graphics, color: ColorName, x: number, y: number, size: number): void { g.lineStyle(Math.max(2, size * 0.12), 0xffffff, 0.96); g.fillStyle(0xffffff, 0.96); const kind = color; if (kind === 'coral')
  g.fillTriangle(x, y - size, x - size, y + size, x + size, y + size);
else if (kind === 'blue')
  g.fillRoundedRect(x - size, y - size, size * 2, size * 2, 2);
else if (kind === 'mint') {
  g.lineStyle(Math.max(2, size * .2), 0xffffff);
  g.strokeCircle(x, y, size);
}
else if (kind === 'yellow')
  g.fillPoints([{ x, y: y - size }, { x: x + size, y }, { x, y: y + size }, { x: x - size, y }], true);
else {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? size * .45 : size;
    pts.push({ x: x + Math.cos(a) * r, y: y + Math.sin(a) * r });
  }
  g.fillPoints(pts, true);
} }
export function ball(g: Phaser.GameObjects.Graphics, color: ColorName, x: number, y: number, r: number): void { g.fillStyle(HEX[color], 1); g.fillCircle(x, y, r); g.fillStyle(0xffffff, .2); g.fillCircle(x - r * .28, y - r * .34, r * .28); symbol(g, color, x, y, r * .55); }
