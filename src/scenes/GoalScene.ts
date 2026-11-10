import Phaser from 'phaser';
import { ball,text } from '../objects/draw.ts';
import { getLevel } from '../systems/Levels.ts';
import { dailyChallenge } from '../systems/Daily.ts';
import { localDateKey } from '../systems/Clock.ts';
import { getStars,totalStars } from '../systems/Progress.ts';
import { currentStreak } from '../systems/Daily.ts';

type Data={mode:'level'|'daily';id?:number;dateKey?:string};
export class GoalScene extends Phaser.Scene {
 constructor(){super('goal');}
 create(d:Data):void{
  const daily=d.mode==='daily',id=d.id??1,dateKey=d.dateKey??localDateKey(),def:any=daily?dailyChallenge(dateKey):getLevel(id)!;
  const h=this.scale.height, k=Math.min(1,h/1688), top=Math.max(80,(h-1000*k)/2);const Y=(v:number)=>top+(v-300)*k;
  this.add.graphics().fillStyle(0xffffff,.55).fillRect(0,0,780,h);const card=this.add.graphics();card.fillStyle(0xffffff,.98);card.fillRoundedRect(42,top,696,1000*k,48);card.lineStyle(6,0xffdce6,1);card.strokeRoundedRect(42,top,696,1000*k,48);
  text(this,390,Y(380),daily?`DAILY CHALLENGE · ${dateKey}`:`LEVEL ${id}${def.boss?'  👑':''}`,30,'#59465b');if(def.boss)text(this,390,Y(435),'BOSS!',24,'#e98980');
  const icon=this.add.graphics();ball(icon,'coral',390,Y(550),64,'Classic');const goalIcon=def.timeLimitSec?'⏱':def.goal==='combo'?'⛓':def.goal==='score'?'🔥':'◎';text(this,475,Y(550),goalIcon,32,'#e98980');text(this,390,Y(665),def.title,35,'#59465b');
  const details=`♥ ${def.lives} lives${def.timeLimitSec?`   ·   ⏱ ${def.timeLimitSec}s`:''}   ·   ${def.colorsInPool} colours`;text(this,390,Y(750),details,24,'#77746d','normal');
  text(this,390,Y(830),(daily||def.starRule!=='time'||!def.parSec)?'3★: no mistakes':`3★: under ${def.parSec}s`,24,'#b38d35');text(this,390,Y(900),`BEST  ${daily?'—':`${getStars(id)} ★`}`,23,'#77746d');if(daily)text(this,390,Y(950),`🔥  ${currentStreak(localDateKey())} day streak`,22,'#e98955');
  const py=Y(1110),ph=110*k,play=this.add.graphics();play.fillStyle(0xff8fab,1);play.fillRoundedRect(140,py-ph/2,500,ph,34);play.setInteractive(new Phaser.Geom.Rectangle(140,py-ph/2,500,ph),Phaser.Geom.Rectangle.Contains).on('pointerdown',()=>this.scene.start('game',daily?{mode:'daily',dateKey}:{mode:'level',id}));text(this,390,py,'PLAY',39,'#ffffff');
  const close=this.add.graphics();close.fillStyle(0xf7edf1,1);close.fillCircle(685,top+40,30);close.setInteractive(new Phaser.Geom.Circle(685,top+40,30),Phaser.Geom.Circle.Contains).on('pointerdown',()=>this.scene.start('menu'));text(this,685,top+40,'×',31,'#59465b');
  const rect=this.game.canvas.getBoundingClientRect(),sx=rect.width/780,sy=rect.height/this.scale.height;const point=(x:number,y:number)=>({x:rect.left+x*sx,y:rect.top+y*sy});(window as any).__COLORFACTORY__={...window.__COLORFACTORY__,getState:()=>Object.freeze({scene:'goal',mode:daily?'daily':'level',levelId:id,goal:{type:def.goal,target:def.target,current:0,remaining:def.target,timeLeftSec:def.timeLimitSec,title:def.title},stars:null,totalStars:totalStars(),streak:currentStreak(localDateKey()),dateKey,dailySeed:daily?def.seed:null,goalCard:{play:point(390,py),close:point(685,top+40)}})};
 }
}
