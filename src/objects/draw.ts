import Phaser from 'phaser';
import type { ColorName } from '../systems/DifficultyManager.ts';
export const HEX: Record<ColorName, number> = { coral: 0xff3d6e, blue: 0x2fb6ff, mint: 0x39ff9c, yellow: 0xffd23a, lavender: 0xb26bff };
export const INK = '#eafaff';
export function floatingShapes(scene:Phaser.Scene):void {
  const bg=scene.add.graphics().setDepth(-100); bg.fillGradientStyle(0x05070f,0x05070f,0x0b1230,0x0b1230,1);bg.fillRect(0,0,780,1688);
  // Fine CRT lines, side machinery and a restrained amber factory warning light.
  bg.lineStyle(1,0x8ba0bc,.045);for(let y=2;y<1688;y+=4)bg.lineBetween(0,y,780,y);
  bg.lineStyle(1,0x22e6ff,.075); for(let x=0;x<=780;x+=65)bg.lineBetween(x,0,x,1688);
  for(let i=0;i<18;i++){const y=900+i*i*2.2;bg.lineStyle(1+i*.13,0x22e6ff,.22);bg.lineBetween(0,y,780,y);}
  bg.lineStyle(2,0x22e6ff,.24);bg.lineBetween(0,990,390,820);bg.lineBetween(780,990,390,820);
  // Hazard marked machinery plinths sit behind the lower controls.
  for(const x of [18,762]){bg.fillStyle(0x101b2b,.48);bg.fillRoundedRect(x-16,1370,32,250,8);for(let y=1380;y<1610;y+=28){bg.lineStyle(5,0xffc23a,.3);bg.lineBetween(x-12,y,x+12,y+13);}}
  // Soft edge vignette keeps the bright controls and ball in focus.
  bg.fillStyle(0x02040b,.22);bg.fillRect(0,0,42,1688);bg.fillRect(738,0,42,1688);
  // Low contrast jointed silhouettes and side pipe runs.
  for(const side of [0,1]){const x=side?745:35;bg.lineStyle(20,0x17283d,.9);bg.lineBetween(x,280,x,1570);bg.lineStyle(4,0x22e6ff,.45);bg.lineBetween(x,280,x,1570);for(let y=380;y<1500;y+=190){bg.fillStyle(0xff2bd6,.75);bg.fillCircle(x,y,5);}}
  for(const side of [0,1]){const x=side?690:90,y=460;const arm=scene.add.graphics().setDepth(-99);arm.fillStyle(0x101b2b,.9);arm.fillRoundedRect(-32,0,64,38,8);arm.lineStyle(25,0x101b2b,.88);arm.lineBetween(0,20,side?-65:65,112);arm.lineBetween(side?-65:65,112,side?-18:18,205);arm.lineStyle(5,0x22e6ff,.32);arm.lineBetween(0,20,side?-65:65,112);arm.lineBetween(side?-65:65,112,side?-18:18,205);for(const [jx,jy,jr] of [[0,20,19],[side?-65:65,112,16],[side?-18:18,205,12]] as number[][]){arm.fillStyle(0x192c42,.98);arm.fillCircle(jx,jy,jr);arm.lineStyle(4,0x22e6ff,.4);arm.strokeCircle(jx,jy,jr-2);}arm.lineStyle(7,0x22e6ff,.65);arm.lineBetween(side?-18:18,205,side?-38:38,229);arm.lineBetween(side?-18:18,205,side?2:-2,229);arm.fillStyle(0xffc23a,.9);arm.fillCircle(0,-8,5);arm.setPosition(x,y);arm.setAlpha(.44);scene.tweens.add({targets:arm,rotation:side?.025:-.025,duration:4200,ease:'Sine.InOut',yoyo:true,repeat:-1});}
  // Overhead pipework and valves.
  bg.lineStyle(12,0x17263a,.9);bg.lineBetween(70,22,710,22);bg.lineStyle(3,0x22e6ff,.4);bg.lineBetween(70,22,710,22);for(const x of [140,640]){bg.lineStyle(5,0x516078,.8);bg.lineBetween(x,8,x,36);bg.lineBetween(x-12,8,x+12,8);bg.lineBetween(x-12,36,x+12,36);}
  for(const x of [35,745])for(let i=0;i<5;i++){const dash=scene.add.graphics().setDepth(-99);dash.fillStyle(0x22e6ff,.75);dash.fillRoundedRect(-3,0,6,22,3);dash.setPosition(x,310+i*260);scene.tweens.add({targets:dash,y:1580,duration:5000+i*300,delay:i*180,repeat:-1,onRepeat:()=>dash.y=300});}
  const scan=scene.add.graphics().setDepth(-99);scan.fillStyle(0xffffff,.05);scan.fillRect(0,0,780,9);scene.tweens.add({targets:scan,y:1688,duration:6500,repeat:-1});
    const dots=scene.add.graphics().setDepth(-98);for(let i=0;i<16;i++){const x=30+(i*137)%720,y=260+(i*223)%1200;dots.fillStyle(i%3?0x39ff88:0xffc23a,.42);dots.fillCircle(x,y,2+(i%2));scene.time.addEvent({delay:400+Math.random()*1600,loop:true,callback:()=>dots.setAlpha(Math.random()>.5?1:.25)});}
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
