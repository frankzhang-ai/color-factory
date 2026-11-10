import Phaser from 'phaser';
import { bake } from './bake.ts';

const candy = [0xffb3c7, 0xffd1a8, 0xfff1a8, 0xb5ead7, 0xa8d8ff, 0xd7c4ff];

/** Shared, non-interactive scene dressing. All scenery is drawn once and animated as small objects. */
export function cuteBackdrop(scene: Phaser.Scene, quiet = false): void {
  const key = bake(scene, `cfcute-backdrop-${quiet?'quiet':'full'}`, 780, 1688, g => {
  g.fillGradientStyle(0xfff6fb, 0xfff6fb, 0xeef8ff, 0xeef8ff, 1); g.fillRect(0,0,780,1688);
  [0xffb3c7, 0xffd1a8, 0xfff1a8, 0xb5ead7, 0xa8d8ff, 0xd7c4ff].forEach(c=>{g.lineStyle(18,c,quiet?.10:.26);g.beginPath();g.arc(390,860,470-[0xffb3c7,0xffd1a8,0xfff1a8,0xb5ead7,0xa8d8ff,0xd7c4ff].indexOf(c)*20,Math.PI,Math.PI*2,false);g.strokePath();});
  g.fillStyle(0xb5ead7,quiet?.30:.53);g.fillEllipse(390,1695,1040,220);g.fillStyle(0xa6dfc7,quiet?.18:.34);g.fillEllipse(80,1688,500,150);
  for(let i=0;i<12;i++){const x=24+i*66,y=1600+(i%3)*20,s=.7+(i%4)*.13;g.lineStyle(4,0x83c69f,.9);g.lineBetween(x,y+5,x,y+31*s);g.fillStyle(candy[i%6],1);for(let p=0;p<5;p++){const a=p*Math.PI*2/5;g.fillCircle(x+Math.cos(a)*9*s,y+Math.sin(a)*9*s,6*s);}g.fillStyle(0xffdf70,1);g.fillCircle(x,y,5*s);}
  for(let i=0;i<(quiet?6:18);i++){const x=(i*173+61)%780,y=260+(i*197)%1240,r=5+(i%4)*2;if(i%3===0){g.fillStyle(candy[i%6],quiet?.24:.45);g.fillCircle(x,y,r);g.lineStyle(2,0xffffff,.9);g.strokeCircle(x,y,r);g.fillStyle(0xffffff,.8);g.fillCircle(x-r*.35,y-r*.35,2);}else if(i%3===1){g.fillStyle(candy[i%6],quiet?.28:.55);g.fillPoints([{x,y:y-r},{x:x+r*.28,y:y-r*.28},{x:x+r,y},{x:x+r*.28,y:y+r*.28},{x,y:y+r},{x:x-r*.28,y:y+r*.28},{x:x-r,y},{x:x-r*.28,y:y-r*.28}],true);}else{g.lineStyle(3,candy[i%6],quiet?.35:.7);g.beginPath();g.arc(x,y,r,Math.PI,Math.PI*2,false);g.strokePath();g.beginPath();g.arc(x+r,y,r,Math.PI,Math.PI*2,false);g.strokePath();g.lineBetween(x-r,y,x,y+r*1.6);g.lineBetween(x,y+r*1.6,x+r,y);}}
  for(let i=0;i<(quiet?5:14);i++){const x=35+(i*127)%710,y=250+(i*211)%1150,r=5+i%3*2;g.fillStyle(0xfff1a8,quiet?.16:.28);g.fillPoints([{x,y:y-r*1.8},{x:x+r*.35,y:y-r*.35},{x:x+r*1.8,y},{x:x+r*.35,y:y+r*.35},{x,y:y+r*1.8},{x:x-r*.35,y:y+r*.35},{x:x-r*1.8,y},{x:x-r*.35,y:y-r*.35}],true);}
  });
  scene.add.image(0,0,key).setOrigin(0).setDepth(-100);
  // Puffy clouds have soft shadows and a few friendly faces.
  const cloudSpecs = quiet ? [[90,170,1],[390,105,.72],[680,220,.9]] : [[90,170,1],[390,105,.72],[680,220,.9],[190,720,.62],[650,810,.7],[100,1110,.58],[20,860,.82],[760,860,.82]];
  cloudSpecs.forEach(([x,y,s], i) => {
    const c = scene.add.container(x, y).setDepth(-80).setAlpha(quiet ? .56 : .92);
    const cloudKey=bake(scene,`cfcute-cloud-${i<3?'face':'plain'}`,150,80,g=>{
    const s=1; g.fillStyle(0xc4b8c7,.10);g.fillEllipse(75,60,140,25);g.fillStyle(0xffffff,.92);g.fillCircle(45,35,30);g.fillCircle(75,21,39);g.fillCircle(107,35,30);g.fillRoundedRect(25,31,100,34,18);
    if(i<3){g.fillStyle(0x59465b,.65);g.fillCircle(64,38,2.5);g.fillCircle(84,38,2.5);g.lineStyle(2,0xe989a7,.9);g.beginPath();g.arc(74,44,5,.1,Math.PI-.1,false);g.strokePath();}
    });
    const cloud=scene.add.image(0,0,cloudKey).setOrigin(.5).setScale(s).setAlpha(quiet?.56:.92); c.add(cloud);
    /*
    const g = scene.add.graphics();
    g.fillStyle(0xc4b8c7,.10); g.fillEllipse(0,24,190*s,35*s);
    g.fillStyle(0xffffff,.92); g.fillCircle(-42*s,0,35*s);g.fillCircle(0,-17*s,47*s);g.fillCircle(43*s,0,35*s);g.fillRoundedRect(-64*s,-4*s,128*s,39*s,18*s);
    if (i < 3) { g.fillStyle(0x59465b,.65);g.fillCircle(-10*s,5*s,3*s);g.fillCircle(10*s,5*s,3*s);g.lineStyle(2,0xe989a7,.9);g.beginPath();g.arc(0,12*s,6*s,.1,Math.PI-.1,false);g.strokePath(); }
    c.add(g); */ scene.tweens.add({targets:c,x:x+(i%2?24:-24),y:y+(i%2?8:-8),duration:5200+i*550,ease:'Sine.InOut',yoyo:true,repeat:-1});
  });
}

export function worker(scene: Phaser.Scene, x: number, y: number, flip = false): Phaser.GameObjects.Container {
  const c=scene.add.container(x,y).setDepth(4); if(flip)c.setScale(-1,1);
  const key=bake(scene,'cfcute-worker',120,110,g=>{
  g.fillStyle(0x77cfae,1);g.fillEllipse(0,25,90,70);g.fillStyle(0xffffff,1);g.fillCircle(-17,16,12);g.fillCircle(17,16,12);g.fillStyle(0x59465b,1);g.fillCircle(-14,18,5);g.fillCircle(20,18,5);g.fillStyle(0xff9ab5,1);g.fillEllipse(-33,29,15,8);g.fillEllipse(33,29,15,8);
  g.lineStyle(4,0x59465b,1);g.beginPath();g.arc(0,34,10,.15,Math.PI-.15,false);g.strokePath();
  g.fillStyle(0xffd45e,1);g.fillRoundedRect(-35,-29,70,23,9);g.fillRoundedRect(-24,-42,48,19,9);g.lineStyle(3,0xffffff,.85);g.strokeRoundedRect(-33,-27,66,18,8);
  g.lineStyle(7,0x77cfae,1);g.lineBetween(-37,25,-54,37);g.lineBetween(37,25,54,37);g.fillStyle(0xffb3c7,1);g.fillCircle(-55,39,7);g.fillCircle(55,39,7);
  },60,55); const image=scene.add.image(0,0,key).setOrigin(.5);c.add(image);scene.tweens.add({targets:c,y:y-8,duration:770+Math.random()*300,ease:'Sine.InOut',yoyo:true,repeat:-1});return c;
}

export function cheerWorker(scene: Phaser.Scene, c: Phaser.GameObjects.Container): void {
  scene.tweens.add({targets:c,y:c.y-30,duration:170,ease:'Back.Out',yoyo:true,hold:100});
  scene.tweens.add({targets:c.list[0],rotation:.08,duration:100,yoyo:true,repeat:3});
  const yay=scene.add.text(c.x,c.y-75,'yay!',{fontFamily:'system-ui',fontSize:'22px',fontStyle:'bold',color:'#ed789e',backgroundColor:'#ffffff',padding:{x:9,y:4}}).setOrigin(.5).setDepth(10);
  scene.tweens.add({targets:yay,y:yay.y-30,alpha:0,duration:750,onComplete:()=>yay.destroy()});
}

/** A cupcake gumball dispenser drawn once; call spitMachine when a ball launches. */
export function spitMachine(scene: Phaser.Scene, x=390, y=390): Phaser.GameObjects.Container {
  const c=scene.add.container(x,y).setDepth(3);
  const key=bake(scene,'cfcute-machine',240,310,g=>{
  g.fillStyle(0x59465b,.13);g.fillEllipse(0,54,220,30);
  g.fillStyle(0xf6a9bc,1);g.fillRoundedRect(-76,-5,152,79, thirty());
  g.fillStyle(0xffd5df,1);g.fillRoundedRect(-66,2,132,15,8);
  g.fillStyle(0xd7c4ff,1);g.fillRoundedRect(-92,-93,184,112,52);
  g.fillStyle(0xffffff,.23);g.fillCircle(-43,-65,30);
  const colors=[0xff8fab,0x75c9f5,0x70cda9,0xffd45e,0xb993f5];
  colors.forEach((color,i)=>{g.fillStyle(color,1);g.fillCircle(-42+i*21,-111+(i%2)*12,10);g.lineStyle(2,0xffffff,.7);g.strokeCircle(-42+i*21,-111+(i%2)*12,10);});
  g.fillStyle(0xffffff,1);g.fillCircle(-34,-52,16);g.fillCircle(34,-52,16);g.fillStyle(0x59465b,1);g.fillCircle(-30,-49,7);g.fillCircle(38,-49,7);g.fillStyle(0xff9ab5,1);g.fillEllipse(-58,-23,22,12);g.fillEllipse(58,-23,22,12);
  g.fillStyle(0xff8fab,1);g.fillEllipse(0,-23,27,12);
  g.lineStyle(5,0xff8fab,1);g.lineBetween(0,-94,0,-130);g.fillStyle(0xff8fab,1);g.fillCircle(0,-140,12);g.fillCircle(-9,-145,8);g.fillCircle(9,-145,8);g.fillTriangle(-16,-143,16,-143,0,-126);
  },120,155);const image=scene.add.image(0,0,key).setOrigin(.5);c.add(image);scene.tweens.add({targets:c,y:y-5,duration:900,ease:'Sine.InOut',yoyo:true,repeat:-1});return c;
}
function thirty():number{return 30;}
export function spit(machine:Phaser.GameObjects.Container):void {
  machine.setScale(1.08,.9);machine.scene.tweens.add({targets:machine,scaleX:1,scaleY:1,duration:210,ease:'Back.Out'});
}

/** Tiny colorful side props frame the playfield without covering the lanes. */
export function factorySides(scene:Phaser.Scene):Phaser.GameObjects.Container[] {
  const workers=[worker(scene,45,850),worker(scene,735,850,true)];
  for(const [x,y] of [[52,570],[728,610],[48,1090],[730,1120]] as number[][]){
    const c=scene.add.container(x,y).setDepth(-2);const g=scene.add.graphics();
    if(y<700){g.fillStyle(0xffd1a8,1);g.fillRoundedRect(-34,0,68,50,14);g.fillStyle(0xfff1a8,1);g.fillEllipse(0,0,76,28);g.fillStyle(0xff8fab,1);g.fillCircle(0,-8,10);g.fillStyle(0x70cda9,1);g.fillTriangle(-9,-24,9,-24,0,-39);}
    else {for(let i=0;i<4;i++){g.fillStyle([0xffb3c7,0xffd1a8,0xb5ead7,0xa8d8ff][i],1);g.fillEllipse(0,-i*19,65,27);g.fillStyle(0xffffff,.45);g.fillEllipse(-7,-i*19-3,38,6);}}
    c.add(g);
  }
  return workers;
}
