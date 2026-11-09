import Phaser from 'phaser';
export function soundIcon(scene: Phaser.Scene, x: number, y: number, on: boolean): Phaser.GameObjects.Graphics {
  const graphics = scene.add.graphics();
  graphics.fillStyle(0x353431, 1);
  graphics.fillPoints([
    { x: x - 22, y: y - 8 },
    { x: x - 12, y: y - 8 },
    { x: x + 1, y: y - 19 },
    { x: x + 1, y: y + 19 },
    { x: x - 12, y: y + 8 },
    { x: x - 22, y: y + 8 },
  ], true);
  graphics.lineStyle(4, 0x353431, 1);
  if (on) {
    graphics.beginPath();
    graphics.arc(x + 1, y, 14, -0.85, 0.85, false);
    graphics.strokePath();
    graphics.beginPath();
    graphics.arc(x + 1, y, 24, -0.8, 0.8, false);
    graphics.strokePath();
  }
  else {
    graphics.lineBetween(x + 9, y - 10, x + 25, y + 10);
    graphics.lineBetween(x + 25, y - 10, x + 9, y + 10);
  }
  return graphics;
}
export function pauseIcon(scene: Phaser.Scene, x: number, y: number): void {
  const graphics = scene.add.graphics();
  graphics.fillStyle(0x353431, 1);
  graphics.fillRoundedRect(x - 12, y - 17, 8, 34, 3);
  graphics.fillRoundedRect(x + 4, y - 17, 8, 34, 3);
}
