import Phaser from 'phaser';

/** Render static vector art once and reuse it as a texture. Coordinates in draw
 * are texture-local; ox/oy describe the display origin for negative art bounds. */
export function bake(scene: Phaser.Scene, key: string, w: number, h: number, draw: (g: Phaser.GameObjects.Graphics) => void, ox = 0, oy = 0): string {
  if (scene.textures.exists(key)) return key;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  if (ox || oy) g.translateCanvas(ox, oy);
  draw(g);
  g.generateTexture(key, w, h);
  g.destroy();
  return key;
}
