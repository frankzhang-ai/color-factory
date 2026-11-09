import Phaser from 'phaser';
import type { ColorName } from '../systems/DifficultyManager.ts';
export const HEX: Record<ColorName, number> = { coral: 0xE98980, blue: 0x85B9D8, mint: 0x9AC9AC, yellow: 0xE9CD83, lavender: 0xB8A6D9 };
export const INK = '#353431';
export function floatingShapes(scene:Phaser.Scene):void { const specs:[[number,number,number,number],...Array<[number,number,number,number]>]=[[80,365,0xe98980,34],[680,600,0x85b9d8,46],[115,1130,0xe9cd83,38],[665,1420,0xb8a6d9,42],[525,300,0x9ac9ac,27]];specs.forEach(([x,y,c,r],i)=>{const o=scene.add.graphics();o.setDepth(-10);o.fillStyle(c,.10);if(i%3===0)o.fillCircle(x,y,r);else if(i%3===1)o.fillPoints([{x,y:y-r},{x:x-r,y:y+r},{x:x+r,y:y+r}],true);else o.fillRoundedRect(x-r,y-r,r*2,r*2,12);scene.tweens.add({targets:o,y:y+(i%2?30:-24),x:x+(i%2?12:-12),duration:4200+i*500,ease:'Sine.InOut',yoyo:true,repeat:-1});}); }
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
export function ball(g: Phaser.GameObjects.Graphics, color: ColorName, x: number, y: number, r: number, skin = 'Classic', roll = 0): void {
  // Ground shadow, layered radial approximation, rim, and soft specular highlight.
  g.fillStyle(0x252a31, .18); g.fillEllipse(x + r * .12, y + r * .78, r * 1.65, r * .38);
  const base = skin === 'Neon' ? 0x42e6da : skin === 'Gold' ? 0xf0bd4e : HEX[color];
  g.fillStyle(base, 1); g.fillCircle(x, y, r);
  g.fillStyle(0xffffff, .20); g.fillCircle(x - r*.18, y - r*.19, r*.77);
  g.fillStyle(base, .20); g.fillCircle(x + r*.2, y + r*.23, r*.68);
  g.lineStyle(Math.max(2,r*.035), 0xffffff, .24); g.strokeCircle(x,y,r*.96);
  if (skin === 'Candy') { g.lineStyle(r*.13, 0xffffff, .45); for(let i=-1;i<=1;i++) g.lineBetween(x-r*.65+i*r*.42,y+r*.45,x-r*.2+i*r*.42,y-r*.45); }
  if (skin === 'Marble') { g.lineStyle(r*.035,0xffffff,.6); g.beginPath(); g.moveTo(x-r*.7,y+r*.1);g.lineTo(x-r*.25,y-r*.1);g.lineTo(x+r*.05,y+r*.12);g.lineTo(x+r*.7,y-r*.24);g.strokePath(); }
  if (skin === 'Neon') { g.lineStyle(r*.08,0x8afffa,.7);g.strokeCircle(x,y,r*.88); }
  if (skin === 'Gold') { g.fillStyle(0xffffff,.56);g.fillCircle(x-r*.28,y-r*.34,r*.16); }
  // Rotating short meridian creates a readable rolling cue without hiding the glyph.
  const a=roll; g.lineStyle(r*.035,0xffffff,.45); g.beginPath();g.arc(x,y,r*.79,a,a+Math.PI*.72,false);g.strokePath();
  symbol(g, color, x, y, r * .55);
}
