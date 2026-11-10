import Phaser from 'phaser';
import { ball,text } from '../objects/draw.ts';
import { cuteBackdrop } from '../objects/cuteDecor.ts';
import { recordResult,totalStars } from '../systems/Progress.ts';
import { recordDailyPlay,currentStreak } from '../systems/Daily.ts';
import { localDateKey,msUntilLocalMidnight } from '../systems/Clock.ts';
import { getUnlockedSkins } from '../systems/Storage.ts';
import { SKINS } from '../systems/Storage.ts';
type Data={mode:'level'|'daily';id:number;dateKey:string;won:boolean;stars:number;progress:number;target:number;soClose:string;elapsedMs:number;score:number;lives:number;totalStars:number;def:any};
export class LevelEndScene extends Phaser.Scene {
 constructor(){super('level-end');}
 create(d:Data):void{
  cuteBackdrop(this,true);const daily=d.mode==='daily',h=this.scale.height;let newly:string|null=null,streak=currentStreak(localDateKey());
  if(daily){const result=recordDailyPlay(d.dateKey,{won:d.won,score:d.score,stars:d.stars});streak=result.streak;newly=result.newlyUnlocked;}else if(d.won){const was=getUnlockedSkins();recordResult(d.id,d.stars);newly=SKINS.find(s=>getUnlockedSkins().includes(s.name)&&!was.includes(s.name))?.name??null;}
  const title=daily?(d.won?'DAILY COMPLETE!':'DAILY OVER'):(d.won?`LEVEL ${d.id} CLEAR!`:'SO CLOSE!');text(this,390,300,title,46,d.won?'#59465b':'#e98980');
  if(d.won){for(let i=0;i<3;i++){const star=text(this,300+i*90,410,i<d.stars?'★':'☆',58,i<d.stars?'#e7ad36':'#c5bdc1').setScale(.05);this.tweens.add({targets:star,scale:1,duration:280,delay:i*240,ease:'Back.Out'});}text(this,390,500,`+${Math.max(0,totalStars()-d.totalStars)} ⭐ total`,23,'#b38d35');if(newly){text(this,390,550,`New skin: ${newly}!`,24,'#8d7652');const preview=this.add.graphics();ball(preview,'coral',645,550,24,newly);}const cheers=this.add.graphics();['coral','blue','mint'].forEach((c,i)=>ball(cheers,c as any,260+i*130,690,34,'Classic'));this.tweens.add({targets:cheers,y:'-=18',duration:360,yoyo:true,repeat:-1,ease:'Sine.InOut'});const conf=this.add.graphics();for(let i=0;i<38;i++){conf.fillStyle([0xff8fab,0x75c9f5,0x70cda9,0xffd45e][i%4],.95);conf.fillCircle(50+(i*83)%680,580+(i*47)%250,5);}this.tweens.add({targets:conf,y:70,alpha:0,duration:900,onComplete:()=>conf.destroy()});
  }else{text(this,390,440,d.soClose,24,'#77746d','normal');const g=this.add.graphics();g.fillStyle(0xffffff,.8);g.fillRoundedRect(130,510,520,32,16);g.fillStyle(0xff8fab,1);g.fillRoundedRect(134,514,512*Math.min(1,d.progress/d.target),24,12);text(this,390,575,`${d.progress} / ${d.target}`,22,'#59465b');const face=this.add.graphics();ball(face,'coral',390,700,52,'Classic',0,'sad');}
  if(daily){text(this,390,640,`🔥 ${streak}-day streak!`,25,'#e98955');text(this,390,700,'Come back tomorrow for a new challenge!',20,'#77746d','normal');const remain=msUntilLocalMidnight();text(this,390,738,`Next in ${Math.floor(remain/3600000)}h ${Math.floor(remain%3600000/60000)}m`,17,'#77746d','normal');if(newly)text(this,390,790,`New skin: ${newly}!`,22,'#8d7652');}
  const buttons:Record<string,{x:number;y:number;label:string;fn:()=>void}>={};
  const add=(key:string,x:number,y:number,label:string,fn:()=>void,primary=false)=>{const g=this.add.graphics();g.fillStyle(primary?0xff8fab:0xffffff,1);g.fillRoundedRect(x-250,y-42,500,84,25);g.lineStyle(4,0xffdce6,1);g.strokeRoundedRect(x-250,y-42,500,84,25);text(this,x,y,label,25,primary?'#ffffff':'#59465b');g.setInteractive(new Phaser.Geom.Rectangle(x-250,y-42,500,84),Phaser.Geom.Rectangle.Contains).on('pointerdown',fn);buttons[key]={x,y,label,fn};};
  if(daily){add('map',390,1100,'MAP',()=>this.scene.start('menu'),true);add('retry',390,1210,'PLAY AGAIN',()=>this.scene.start('goal',{mode:'daily',dateKey:d.dateKey}));}
  else if(d.won){if(d.id<30)add('next',390,1050,'NEXT LEVEL ▶',()=>this.scene.start('goal',{mode:'level',id:d.id+1}),true);else add('next',390,1050,'ALL CLEARED!',()=>this.scene.start('menu'),true);add('retry',390,1160,'REPLAY',()=>this.scene.start('game',{mode:'level',id:d.id}));add('map',390,1270,'MAP',()=>this.scene.start('menu'));}
  else{add('retry',390,1060,'TRY AGAIN',()=>this.scene.start('game',{mode:'level',id:d.id}),true);add('map',390,1170,'MAP',()=>this.scene.start('menu'));}
  const rect=this.game.canvas.getBoundingClientRect(),sx=rect.width/780,sy=rect.height/this.scale.height,point=(x:number,y:number)=>({x:rect.left+x*sx,y:rect.top+y*sy}),coords:any={map:point(buttons.map.x,buttons.map.y)};if(buttons.next)coords.next=point(buttons.next.x,buttons.next.y);if(buttons.retry)coords.retry=point(buttons.retry.x,buttons.retry.y);
  (window as any).__COLORFACTORY__={...window.__COLORFACTORY__,getState:()=>Object.freeze({scene:daily?'daily-end':d.won?'win':'fail',mode:d.mode,levelId:d.id,goal:{type:d.def.goal,target:d.target,current:d.progress,remaining:Math.max(0,d.target-d.progress),timeLeftSec:null,title:d.def.title},stars:d.stars,totalStars:totalStars(),streak,dateKey:d.dateKey,dailySeed:null,end:{...coords,soClose:d.soClose,missing:Math.max(0,d.target-d.progress)}})};
 }
}
