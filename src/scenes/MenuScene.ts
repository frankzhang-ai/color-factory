import Phaser from 'phaser';
import { ball, text } from '../objects/draw.ts';
import { cuteBackdrop } from '../objects/cuteDecor.ts';
import { getSound, saveSound, getSkin, saveSkin, getUnlockedSkins, SKINS, type Skin } from '../systems/Storage.ts';
import { getStars, nodeState, totalStars } from '../systems/Progress.ts';
import { currentStreak, playedToday } from '../systems/Daily.ts';
import { localDateKey } from '../systems/Clock.ts';
import { soundIcon } from './ui.ts';
import { bake } from '../objects/bake.ts';

type MapNode={id:number;state:'cleared'|'next'|'locked';stars:number;x:number;y:number;visible:boolean};
export class MenuScene extends Phaser.Scene {
 private scrollY=0; private lastScroll=Number.NaN; private nodes:Phaser.GameObjects.Container[]=[]; private velocity=0; private dragging=false; private downY=0; private downScroll=0; private moved=false; private world!:Phaser.GameObjects.Container; private soundEnabled=true; private skin:Skin='Classic'; private skinPanel=false;
 constructor(){super('menu');}
 create(data:{scrollY?:number}={}):void {
  cuteBackdrop(this,true); this.soundEnabled=getSound(); this.skin=getSkin(); this.scrollY=data.scrollY??0;this.lastScroll=Number.NaN;this.velocity=0;this.dragging=false;this.moved=false;
  this.world=this.add.container(0,0); this.drawMap();
  const today=localDateKey(), streak=currentStreak(today), h=this.scale.height;
  this.add.image(390,74,bake(this,'cflv-map-topbar',780,150,g=>{g.fillStyle(0xffffff,.88);g.fillRoundedRect(20,22,740,105,34);})).setScrollFactor(0);
  text(this,130,67,`⭐  ${totalStars()}`,29,'#b38d35').setScrollFactor(0); text(this,335,67,`🔥  ${streak}`,29,'#ee8a55').setScrollFactor(0);
  const s=soundIcon(this,700,72,this.soundEnabled).setScrollFactor(0); const hit=this.add.circle(700,72,36,0xffffff,0).setScrollFactor(0).setInteractive();hit.on('pointerdown',()=>{this.soundEnabled=!this.soundEnabled;saveSound(this.soundEnabled);s.destroy();soundIcon(this,700,72,this.soundEnabled).setScrollFactor(0);});
  this.add.image(390,h-93,bake(this,'cflv-map-footer',780,170,g=>{g.fillStyle(0xffffff,.93);g.fillRoundedRect(14,8,752,151,35);})).setScrollFactor(0);
  this.button(144,h-112,'🔥 DAILY',()=>this.scene.start('goal',{mode:'daily',dateKey:today}),playedToday(today)?'✓ today':''); this.button(390,h-112,'∞ ENDLESS',()=>this.scene.start('game',{mode:'endless'})); this.button(635,h-112,'SKINS',()=>this.toggleSkins());
  const zone=this.add.zone(0,130,780,h-310).setOrigin(0).setDepth(-2).setInteractive();
  zone.on('pointerdown',(p:Phaser.Input.Pointer)=>{this.dragging=true;this.moved=false;this.downY=p.y;this.downScroll=this.scrollY;this.velocity=0;});
  zone.on('pointermove',(p:Phaser.Input.Pointer)=>{if(!this.dragging||!p.isDown)return;const dy=p.y-this.downY;if(Math.abs(dy)>10)this.moved=true;if(this.moved){this.scrollY=Phaser.Math.Clamp(this.downScroll+dy,0,this.maxScroll());this.velocity=p.velocity.y;this.applyScroll();}});
  zone.on('pointerup',()=>{this.dragging=false;});
  this.input.on('pointerdown',(p:Phaser.Input.Pointer)=>{if(p.y>=130&&p.y<=h-180){this.dragging=true;this.moved=false;this.downY=p.y;this.downScroll=this.scrollY;this.velocity=0;}});
  this.input.on('pointermove',(p:Phaser.Input.Pointer)=>{if(!this.dragging||!p.isDown)return;const dy=p.y-this.downY;if(Math.abs(dy)>10)this.moved=true;if(this.moved){this.scrollY=Phaser.Math.Clamp(this.downScroll+dy,0,this.maxScroll());this.velocity=p.velocity.y;this.applyScroll();}});
  this.input.on('pointerup',()=>{this.dragging=false;});
  this.input.on('wheel',(_p:unknown,_objs:unknown,_dx:number,dy:number)=>{this.scrollY=Phaser.Math.Clamp(this.scrollY+dy,0,this.maxScroll());this.applyScroll();});
  const next=Math.min(30,Math.max(1,Array.from({length:30},(_,i)=>i+1).find(id=>nodeState(id)==='next')??30));this.scrollY=Phaser.Math.Clamp(this.yFor(next)-h*.54,0,this.maxScroll());this.applyScroll();
  this.publish();
 }
 update(_t:number,dt:number):void{if(!this.dragging&&Math.abs(this.velocity)>5){this.scrollY=Phaser.Math.Clamp(this.scrollY+this.velocity*dt/1000,0,this.maxScroll());this.velocity*=.91;this.applyScroll();}}
 private drawMap():void {
  const pathKey=bake(this,'cflv-level-map-path',780,4800,g=>{g.lineStyle(48,0xffe3ed,.75);g.beginPath();for(let i=0;i<30;i++){const {x,y}=this.nodeXY(i+1);if(i===0)g.moveTo(x,y);else g.lineTo(x,y);}g.strokePath();g.lineStyle(7,0xffffff,.82);g.beginPath();for(let i=0;i<30;i++){const {x,y}=this.nodeXY(i+1);if(i===0)g.moveTo(x,y);else g.lineTo(x,y);}g.strokePath();});this.world.add(this.add.image(0,0,pathKey).setOrigin(0));
  const nodeTextures=new Map<string,string>();
  const starsFilled=bake(this,'cflv-map-star-filled',28,28,g=>{g.fillStyle(0xe7ad36,1);g.fillPoints([{x:14,y:0},{x:17,y:10},{x:28,y:10},{x:19,y:17},{x:22,y:28},{x:14,y:21},{x:6,y:28},{x:9,y:17},{x:0,y:10},{x:11,y:10}],true);});
  const starsEmpty=bake(this,'cflv-map-star-empty',28,28,g=>{g.lineStyle(2,0xc5bdc1,1);g.strokePoints([{x:14,y:1},{x:17,y:10},{x:27,y:10},{x:19,y:16},{x:22,y:27},{x:14,y:21},{x:6,y:27},{x:9,y:16},{x:1,y:10},{x:11,y:10}],true);});
  const styles=['cleared-pink','cleared-mint','next','locked','boss-cleared-pink','boss-cleared-mint','boss-next','boss-locked'];
  for(const style of styles){const boss=style.startsWith('boss-'),state=style.replace('boss-',''),r=boss?56:44,cx=75,cy=88,w=150,h=160,color=state==='locked'?0xc9c5c5:style.endsWith('pink')?0xffb3c7:0x8ed9bd;
   nodeTextures.set(style,bake(this,`cflv-map-node-${style}`,w,h,g=>{if(state==='next'){g.fillStyle(0xff8fab,.18);g.fillCircle(cx,cy,r+22);}g.fillStyle(state==='next'?0xff8fab:color,1);g.fillCircle(cx,cy,r);g.lineStyle(boss?5:4,0xffffff,1);g.strokeCircle(cx,cy,r);if(boss){g.fillStyle(0xffd45e,1);g.fillPoints([{x:cx-19,y:cy-r+8},{x:cx-14,y:cy-r-15},{x:cx,y:cy-r+3},{x:cx+14,y:cy-r-15},{x:cx+19,y:cy-r+8}],true);}if(state==='locked'){const lx=cx+r*.67,ly=cy-r*.67;g.fillStyle(0x8f8989,1);g.fillCircle(lx,ly,18);g.lineStyle(3,0xffffff,1);g.strokeCircle(lx,ly,18);g.strokeCircle(lx,ly-3,5);g.strokeRoundedRect(lx-7,ly,14,11,3);}}));}
  const glowKey=bake(this,'cflv-map-next-glow',180,180,g=>{g.fillStyle(0xff8fab,.18);g.fillCircle(90,90,88);});
  const friendKey=bake(this,`cflv-map-friend-${this.skin}`,64,64,g=>ball(g,'coral',32,32,24,this.skin,0));
  for(let id=1;id<=30;id++){const {x,y}=this.nodeXY(id),state=nodeState(id),stars=getStars(id),boss=id%5===0,r=boss?56:44,style=`${boss?'boss-':''}${state==='cleared'?(id%2?'cleared-pink':'cleared-mint'):state}`,node=this.add.container(x,y);
   node.add(this.add.image(0,0,nodeTextures.get(style)!));
   if(state==='next'){const glow=this.add.image(0,0,glowKey).setAlpha(.75);node.addAt(glow,0);this.tweens.add({targets:glow,scale:1.08,alpha:.45,duration:650,yoyo:true,repeat:-1,ease:'Sine.InOut'});}
   const number=this.add.text(0,0,String(id),{fontFamily:'system-ui,sans-serif',fontSize:(boss?34:30)+'px',fontStyle:'bold',color:'#ffffff',stroke:'#776d75',strokeThickness:5}).setOrigin(.5);node.add(number);
   if(state==='cleared')for(let i=0;i<3;i++){const a=Math.PI+(i/2)*Math.PI;node.add(this.add.image(Math.cos(a)*(r+15),Math.sin(a)*(r+15),i<stars?starsFilled:starsEmpty));}
   if(state==='next'){node.add(this.add.image(r+28,0,friendKey));node.add(this.add.text(r+50,-43,'PLAY',{fontFamily:'system-ui',fontSize:'15px',fontStyle:'bold',color:'#59465b',backgroundColor:'#ffffff',padding:{x:8,y:4}}).setOrigin(.5));}
   const hit=this.add.circle(0,0,r+12,0xffffff,0).setInteractive();hit.on('pointerup',()=>{if(this.moved)return;if(state==='locked'){this.cameras.main.shake(100,.002);this.toast(`Clear level ${id-1} first`);}else this.scene.start('goal',{mode:'level',id});});node.add(hit);this.world.add(node);this.nodes.push(node);
  }
 }
 private nodeXY(id:number):{x:number;y:number}{return{x:390+Math.sin(id*1.65)*190,y:300+(30-id)*145};}
 private yFor(id:number):number{return this.nodeXY(id).y;}
 private maxScroll():number{return Math.max(0,4800-this.scale.height);}
 private applyScroll():void{if(this.scrollY===this.lastScroll)return;this.lastScroll=this.scrollY;this.world.y=-this.scrollY;for(let i=0;i<this.nodes.length;i++){const y=this.nodeXY(i+1).y-this.scrollY;this.nodes[i].setVisible(y>-180&&y<this.scale.height+180);}this.publish();}
 private button(x:number,y:number,label:string,fn:()=>void,sub=''):void{const color=label.includes('DAILY')?0xff8fab:0x75c9f5,key=bake(this,`cflv-map-button-${color}`,216,74,g=>{g.fillStyle(color,1);g.fillRoundedRect(0,0,216,74,24);g.fillStyle(0xffffff,.2);g.fillRoundedRect(14,8,188,12,6);});this.add.image(x,y,key).setScrollFactor(0);text(this,x,y-5,label,19,'#ffffff').setScrollFactor(0);if(sub)text(this,x,y+19,sub,13,'#ffffff').setScrollFactor(0);this.add.rectangle(x,y,216,74,0xffffff,0).setScrollFactor(0).setInteractive().on('pointerdown',fn);}
 private toast(label:string):void{const t=text(this,390,190,label,22,'#59465b');this.time.delayedCall(1100,()=>t.destroy());}
 private toggleSkins():void{if(this.skinPanel){this.children.getByName('skins-panel')?.destroy();this.skinPanel=false;return;}this.skinPanel=true;const h=this.scale.height,g=this.add.graphics().setScrollFactor(0).setName('skins-panel');g.fillStyle(0xffffff,.98);g.fillRoundedRect(45,h-535,690,355,28);text(this,390,h-500,'BALL SKINS',25).setScrollFactor(0);SKINS.forEach((s,i)=>{const x=130+(i%3)*260,y=h-435+Math.floor(i/3)*112,open=getUnlockedSkins().includes(s.name),label=s.name==='Sunny'?'🔥 3-day streak':s.name==='Galaxy'?'🔥 7-day streak':`⭐ ${s.at}`;const preview=this.add.graphics().setScrollFactor(0);ball(preview,'coral',x-65,y,25,s.name);text(this,x+30,y-8,s.name,19,open?'#59465b':'#9b9595').setScrollFactor(0);text(this,x+30,y+16,open?(this.skin===s.name?'SELECTED':'SELECT'):(s.name==='Sunny'||s.name==='Galaxy'?label:`⭐ ${s.at}`),12,'#8c8185').setScrollFactor(0);this.add.rectangle(x,y,220,72,0xffffff,0).setScrollFactor(0).setInteractive().on('pointerdown',()=>{if(open){this.skin=s.name;saveSkin(s.name);this.children.getByName('skins-panel')?.destroy();this.skinPanel=false;this.scene.restart({scrollY:this.scrollY});}});});}
 private publish():void{const rect=this.game.canvas.getBoundingClientRect(),sx=rect.width/780,sy=rect.height/this.scale.height,visible:MapNode[]=[];for(let id=1;id<=30;id++){const p=this.nodeXY(id),y=p.y-this.scrollY,shown=y>100&&y<this.scale.height-170;visible.push({id,state:nodeState(id),stars:getStars(id),x:rect.left+p.x*sx,y:rect.top+y*sy,visible:shown});}const cv=(x:number,y:number)=>({x:rect.left+x*sx,y:rect.top+y*sy});const h=this.scale.height;(window as any).__COLORFACTORY__={...window.__COLORFACTORY__,getState:()=>Object.freeze({scene:'menu',mode:'endless',levelId:null,goal:null,stars:null,totalStars:totalStars(),streak:currentStreak(localDateKey()),dateKey:localDateKey(),dailySeed:null,map:{nodes:visible,daily:cv(144,h-112),endless:cv(390,h-112),scrollY:this.scrollY}}),scrollMapTo:(id:number)=>{this.scrollY=Phaser.Math.Clamp(this.yFor(id)-h*.54,0,this.maxScroll());this.applyScroll();}};}
}
