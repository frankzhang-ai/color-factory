import Phaser from 'phaser';
import type { ColorName } from '../systems/DifficultyManager.ts';
export const HEX: Record<ColorName, number> = { coral: 0xff3d6e, blue: 0x2fb6ff, mint: 0x39ff9c, yellow: 0xffd23a, lavender: 0xb26bff };
export const INK = '#eafaff';
export function floatingShapes(scene:Phaser.Scene):void {
  const bg=scene.add.graphics().setDepth(-100); bg.fillGradientStyle(0x05070f,0x05070f,0x0b1230,0x0b1230,1);bg.fillRect(0,0,780,1688);
  bg.lineStyle(1,0x22e6ff,.075); for(let x=0;x<=780;x+=65)bg.lineBetween(x,0,x,1688);
  for(let i=0;i<18;i++){const y=900+i*i*2.2;bg.lineStyle(1+i*.13,0x22e6ff,.22);bg.lineBetween(0,y,780,y);}
  bg.lineStyle(2,0x22e6ff,.24);bg.lineBetween(0,990,390,820);bg.lineBetween(780,990,390,820);
  // Low contrast jointed silhouettes and side pipe runs.
  for(const side of [0,1]){const x=side?745:35;bg.lineStyle(20,0x17283d,.9);bg.lineBetween(x,280,x,1570);bg.lineStyle(4,0x22e6ff,.45);bg.lineBetween(x,280,x,1570);for(let y=380;y<1500;y+=190){bg.fillStyle(0xff2bd6,.75);bg.fillCircle(x,y,5);}}
  for(let i=0;i<3;i++){const x=130+i*260,y=350+i%2*90;const arm=scene.add.graphics().setDepth(-100);arm.lineStyle(20,0x111b2b,.92);arm.lineBetween(0,0,50,100);arm.lineBetween(50,100,5,190);arm.lineStyle(4,0x22e6ff,.55);arm.lineBetween(0,0,50,100);arm.lineBetween(50,100,5,190);arm.fillStyle(0x22e6ff,.55);arm.fillCircle(0,0,13);arm.fillCircle(50,100,10);arm.fillCircle(5,190,8);arm.setPosition(x,y);scene.tweens.add({targets:arm,rotation:i%2?.045:-.045,duration:3200+i*300,ease:'Sine.InOut',yoyo:true,repeat:-1});}
  for(const x of [35,745])for(let i=0;i<5;i++){const dash=scene.add.graphics().setDepth(-99);dash.fillStyle(0x22e6ff,.75);dash.fillRoundedRect(-3,0,6,22,3);dash.setPosition(x,310+i*260);scene.tweens.add({targets:dash,y:1580,duration:5000+i*300,delay:i*180,repeat:-1,onRepeat:()=>dash.y=300});}
  const scan=scene.add.graphics().setDepth(-99);scan.fillStyle(0xffffff,.035);scan.fillRect(0,0,780,9);scene.tweens.add({targets:scan,y:1688,duration:6500,repeat:-1});
  const dots=scene.add.graphics().setDepth(-98);for(let i=0;i<20;i++){const x=30+(i*137)%720,y=260+(i*223)%1200;dots.fillStyle(i%2?0x39ff88:0xff2bd6,.55);dots.fillCircle(x,y,2+(i%3));scene.time.addEvent({delay:300+Math.random()*1300,loop:true,callback:()=>dots.setAlpha(Math.random()>.5?1:.18)});}
}
export function text(scene: Phaser.Scene, x: number, y: number, value: string, size: number, color = INK, weight = '700'): Phaser.GameObjects.Text { return scene.add.text(x, y, value, { fontFamily: '-apple-system, "SF Pro Rounded", system-ui, sans-serif', fontSize: size + 'px', color, fontStyle: weight === '700' ? 'bold' : 'normal', align: 'center', shadow:{offsetX:0,offsetY:0,color:'#22e6ff',blur:12,fill:true} }).setOrigin(0.5); }
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
export function ball(g: Phaser.GameObjects.Graphics, color: ColorName, x: number, y: number, r: number, skin = 'Neon', roll = 0): void {
  // Ground shadow, layered radial approximation, rim, and soft specular highlight.
  g.fillStyle(0x252a31, .18); g.fillEllipse(x + r * .12, y + r * .78, r * 1.65, r * .38);
  const base = skin==='Chrome'?0xd8f3ff:HEX[color];
  g.fillStyle(base,.09);g.fillCircle(x,y,r*1.35);g.fillStyle(base,.2);g.fillCircle(x,y,r*1.12);
  g.fillStyle(0x07101e,1); g.fillCircle(x, y, r*.94);g.fillStyle(base,.24);g.fillCircle(x,y,r*.78);g.fillStyle(base,1);g.lineStyle(Math.max(4,r*.1),base,1);g.strokeCircle(x,y,r*.88);
  g.fillStyle(0xffffff,.92);g.fillCircle(x-r*.3,y-r*.34,r*.18);g.fillStyle(0xffffff,.3);g.fillCircle(x-r*.16,y-r*.2,r*.36);
  if (skin === 'Plasma') { g.lineStyle(r*.07,0xff2bd6,.95);g.beginPath();g.arc(x,y,r*.53,roll,roll+Math.PI*1.55);g.strokePath(); }
  if (skin === 'Chrome') { g.lineStyle(r*.09,0xffffff,.8);g.beginPath();g.arc(x,y,r*.61,roll,roll+Math.PI*.85);g.strokePath(); }
  if (skin === 'Hologram') { const hs=[0x22e6ff,0xff2bd6,0x8a5cff];hs.forEach((c,i)=>{g.lineStyle(r*.035,c,.9);g.beginPath();g.arc(x,y,r*(.75+i*.06),roll+i*2,roll+i*2+Math.PI*.8);g.strokePath();}); }
  if (skin === 'Quantum') { for(let i=0;i<4;i++){const a=roll+i*Math.PI/2;g.fillStyle(i%2?0xff2bd6:0x39ff88,1);g.fillCircle(x+Math.cos(a)*r*1.03,y+Math.sin(a)*r*1.03,r*.09);} }
  // Rotating short meridian creates a readable rolling cue without hiding the glyph.
  const a=roll; g.lineStyle(r*.035,0xffffff,.45); g.beginPath();g.arc(x,y,r*.72,a,a+Math.PI*.72,false);g.strokePath();
  symbol(g, color, x, y, r * .55);
}
