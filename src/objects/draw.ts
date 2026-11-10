import Phaser from 'phaser';
import type { ColorName } from '../systems/DifficultyManager.ts';
export const HEX: Record<ColorName, number> = { coral: 0xff8fab, blue: 0x75c9f5, mint: 0x70cda9, yellow: 0xffd45e, lavender: 0xb993f5 };
export const INK = '#59465b';
export function floatingShapes(scene:Phaser.Scene):void { const bg=scene.add.graphics().setDepth(-20);bg.fillGradientStyle(0xfff6fb,0xfff6fb,0xeef8ff,0xeef8ff,1);bg.fillRect(0,0,780,1688); const specs:[[number,number,number,number],...Array<[number,number,number,number]>]=[[80,365,0xffb3c7,34],[680,600,0xa8d8ff,46],[115,1130,0xfff1a8,38],[665,1420,0xd7c4ff,42],[525,300,0xb5ead7,27],[80,1560,0x70cda9,22],[710,1540,0xffb3c7,26]];specs.forEach(([x,y,c,r],i)=>{const o=scene.add.graphics();o.setDepth(-10);o.fillStyle(c,.16);if(i%3===0)o.fillCircle(x,y,r);else if(i%3===1)o.fillPoints([{x,y:y-r},{x:x+r*.28,y:y-r*.28},{x:x+r,y},{x:x+r*.28,y:y+r*.28},{x,y:y+r},{x:x-r*.28,y:y+r*.28},{x:x-r,y},{x:x-r*.28,y:y-r*.28}],true);else{o.fillStyle(c,.10);o.fillCircle(x,y,r);}scene.tweens.add({targets:o,y:y+(i%2?30:-24),x:x+(i%2?12:-12),duration:4200+i*500,ease:'Sine.InOut',yoyo:true,repeat:-1});}); const ground=scene.add.graphics().setDepth(-9);ground.fillStyle(0xb5ead7,.35);ground.fillEllipse(390,1690,900,150); }
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
export function ball(g: Phaser.GameObjects.Graphics, color: ColorName, x: number, y: number, r: number, skin = 'Classic', roll = 0, mood: 'happy' | 'nervous' | 'sad' | 'dizzy' = 'happy'): void {
  // Ground shadow, layered radial approximation, rim, and soft specular highlight.
  g.fillStyle(0x252a31, .18); g.fillEllipse(x + r * .12, y + r * .78, r * 1.65, r * .38);
  const base = skin === 'Galaxy' ? 0x49356f : skin === 'Sunny' ? 0xffd45e : skin === 'Rainbow' ? [0xff8fab,0xffbd8b,0xffdd74,0x78d5ad,0x76c8f4][Math.floor((roll+10)%5)] : HEX[color];
  g.fillStyle(base, 1); g.fillCircle(x, y, r);
  g.fillStyle(0xffffff, .20); g.fillCircle(x - r*.18, y - r*.19, r*.77);
  g.fillStyle(base, .20); g.fillCircle(x + r*.2, y + r*.23, r*.68);
  g.lineStyle(Math.max(2,r*.035), 0xffffff, .24); g.strokeCircle(x,y,r*.96);
  if (skin === 'Strawberry') { g.fillStyle(0xfff1a8,1);for(let i=0;i<7;i++)g.fillEllipse(x+Math.sin(i*8)*r*.48,y+Math.cos(i*8)*r*.42,4,8);g.fillStyle(0x70cda9,1);g.fillPoints([{x:x-r*.18,y:y-r*.82},{x,y:y-r*1.08},{x:x+r*.18,y:y-r*.82}],true); }
  if (skin === 'Bunny') { g.fillStyle(base,1);g.fillEllipse(x-r*.43,y-r*.83,r*.32,r*.66);g.fillEllipse(x+r*.43,y-r*.83,r*.32,r*.66);g.fillStyle(0xffd2df,1);g.fillEllipse(x-r*.43,y-r*.83,r*.14,r*.42);g.fillEllipse(x+r*.43,y-r*.83,r*.14,r*.42); }
  if (skin === 'Star') { g.fillStyle(0xfff1a8,1);g.fillPoints([{x,y:y-r*1.16},{x:x+r*.16,y:y-r*.9},{x:x+r*.46,y:y-r*.88},{x:x+r*.25,y:y-r*.65},{x:x+r*.33,y:y-r*.38},{x,y:y-r*.54},{x:x-r*.33,y:y-r*.38},{x:x-r*.25,y:y-r*.65},{x:x-r*.46,y:y-r*.88},{x:x-r*.16,y:y-r*.9}],true); }
  if (skin === 'Rainbow') { for(let i=0;i<4;i++){g.lineStyle(r*.12,[0xff8fab,0xffd45e,0x70cda9,0x75c9f5][i],.85);g.beginPath();g.arc(x,y,r*(.72+i*.06),Math.PI*.15,Math.PI*.85);g.strokePath();} }
  if (skin === 'Sunny') { g.lineStyle(Math.max(2,r*.07),0xffad32,.9);for(let i=0;i<12;i++){const a=i*Math.PI/6;g.lineBetween(x+Math.cos(a)*r*1.03,y+Math.sin(a)*r*1.03,x+Math.cos(a)*r*1.22,y+Math.sin(a)*r*1.22);}g.fillStyle(0x59465b,1);g.fillRoundedRect(x-r*.64,y-r*.26,r*.56,r*.29,r*.1);g.fillRoundedRect(x+r*.08,y-r*.26,r*.56,r*.29,r*.1);g.lineStyle(r*.07,0x59465b,1);g.lineBetween(x-r*.08,y-r*.13,x+r*.08,y-r*.13); }
  if (skin === 'Galaxy') { for(let i=0;i<5;i++){const a=i*2.4+roll*.12,sx=x+Math.cos(a)*r*.67,sy=y+Math.sin(a)*r*.66;g.fillStyle(0xffffff,.95);g.fillCircle(sx,sy,Math.max(1,r*.045));}g.fillStyle(0xb993f5,.8);g.fillCircle(x+r*.48,y-r*.48,r*.14); }
  // Rotating short meridian creates a readable rolling cue without hiding the glyph.
  const a=roll; g.lineStyle(r*.035,0xffffff,.45); g.beginPath();g.arc(x,y,r*.79,a,a+Math.PI*.72,false);g.strokePath();
  // Big glossy eyes, blush and a tiny smile make every color a readable little friend.
  const ex=x-r*.25+Math.sin(roll)*r*.035, ey=y-r*.12, eyeY=r*.40;
  g.fillStyle(0xffffff,1);g.fillEllipse(ex,ey,mood==='nervous'?r*.40:r*.36,mood==='nervous'?r*.48:r*.43);g.fillEllipse(x+r*.25+Math.sin(roll)*r*.035,ey,mood==='nervous'?r*.40:r*.36,mood==='nervous'?r*.48:r*.43);
  g.fillStyle(0x59465b,1);g.fillCircle(ex+r*.035,ey+r*(mood==='nervous'?.10:.045),r*.18);g.fillCircle(x+r*.285+Math.sin(roll)*r*.035,ey+r*(mood==='nervous'?.10:.045),r*.18);
  g.fillStyle(0xffffff,1);g.fillCircle(ex-r*.035,ey-r*.085,r*.075);g.fillCircle(ex+r*.08,ey-r*.015,r*.035);g.fillCircle(x+r*.215,ey-r*.085,r*.075);g.fillCircle(x+r*.33,ey-r*.015,r*.035);
  g.lineStyle(r*.055,0x59465b,1);g.beginPath();g.arc(ex,ey-r*.34,r*.13,mood==='nervous'?Math.PI+.2:3.35, mood==='nervous'?Math.PI*2-.2:6.05,false);g.strokePath();g.beginPath();g.arc(x+r*.25,ey-r*.34,r*.13,mood==='nervous'?3.35:3.35,mood==='nervous'?6.05:6.05,false);g.strokePath();
  g.fillStyle(0xff9ab5,.65);g.fillEllipse(x-r*.48,y+r*.16,r*.22,r*.12);g.fillEllipse(x+r*.48,y+r*.16,r*.22,r*.12);
  if(mood==='happy') { g.fillStyle(0xffffff,1);g.fillEllipse(x,y+r*.30,r*.32,r*.24);g.fillStyle(0xff8fab,1);g.fillEllipse(x,y+r*.39,r*.19,r*.09); }
  else { g.lineStyle(Math.max(3,r*.06),0x59465b,1);g.beginPath();g.arc(x,y+r*.34,r*.17,mood==='sad'||mood==='dizzy'?Math.PI+.25:Math.PI+.7,mood==='sad'||mood==='dizzy'?Math.PI*2-.25:Math.PI*2-.7,false);g.strokePath(); }
  if(mood==='nervous'){g.fillStyle(0xa8d8ff,1);g.fillEllipse(x+r*.72,y-r*.4,r*.12,r*.2);g.fillCircle(x+r*.72,y-r*.48,r*.10);}
  if(mood==='dizzy'){g.lineStyle(r*.055,0x59465b,1);for(const dx of [-.25,.25]){const cx=x+r*dx,cy=y-r*.12;g.beginPath();for(let j=0;j<=24;j++){const a=j/24*Math.PI*3.4,rad=r*(.025+j/24*.155),px=cx+Math.cos(a)*rad,py=cy+Math.sin(a)*rad;if(j===0)g.moveTo(px,py);else g.lineTo(px,py);}g.strokePath();}for(let i=0;i<3;i++){const a=roll+i*2.1,sx=x+Math.cos(a)*r*1.15,sy=y-r*.8+Math.sin(a)*r*.18;g.fillStyle(0xffd45e,1);g.fillPoints([{x:sx,y:sy-r*.08},{x:sx+r*.04,y:sy},{x:sx+r*.08,y:sy-r*.08},{x:sx+r*.04,y:sy-r*.16}],true);}}
  // Shape badge remains visible for color-blind players.
  symbol(g, color, x, y+r*.49, r * .20);
}
