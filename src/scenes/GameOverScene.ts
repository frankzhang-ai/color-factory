import Phaser from 'phaser';
import { text,floatingShapes,ball } from '../objects/draw.ts';
import { getUnlockedSkins,SKINS } from '../systems/Storage.ts';
import type { Tier } from '../systems/ScoreManager.ts';
import type { ColorName } from '../systems/DifficultyManager.ts';
type Data={score:number;best:number;newBest:boolean;previousBest:number;comboTier:Tier|null;band:number;colorsInPool:number;laneColors:ColorName[];travelMs:number;gapMs:number;fx:any;elapsedMs:number;level:number;levelProgress:number;skin:string;unlockedSkins:string[];firstBallAt:number|null};
export class GameOverScene extends Phaser.Scene {
  constructor(){super('over');}
  create(d:Data):void{
    floatingShapes(this);
    const newly=SKINS.find(s=>d.previousBest<s.at&&d.best>=s.at)?.name??null;
    const next=SKINS.find(s=>s.at>d.best);
    const over={score:d.score,best:d.best,isNewBest:d.newBest,toBest:Math.max(0,d.best-d.score),nextUnlock:next?{name:next.name,at:next.at,remaining:Math.max(0,next.at-d.best)}:null,newlyUnlocked:newly};
    window.__COLORFACTORY__={getState:()=>Object.freeze({scene:'over',score:d.score,best:d.best,lives:0,combo:0,comboTier:d.comboTier,band:d.band,colorsInPool:d.colorsInPool,laneColors:Object.freeze([...d.laneColors]),ball:null,travelMs:d.travelMs,gapMs:d.gapMs,buttons:Object.freeze([]),level:d.level,levelProgress:d.levelProgress,skin:d.skin,unlockedSkins:Object.freeze(getUnlockedSkins(d.best)),firstBallAt:d.firstBallAt,fx:Object.freeze({...d.fx}),elapsedMs:d.elapsedMs,layout:{hud:{top:0,bottom:240},play:{top:250,bottom:1300},controls:{top:1390,bottom:1620},hint:null},over:Object.freeze(over)})};
    const bg=this.add.graphics();bg.fillStyle(0xb8a6d9,.12);bg.fillCircle(130,300,100);bg.fillStyle(0x9ac9ac,.13);bg.fillCircle(650,1200,130);
    text(this,390,310,'RUN COMPLETE',46);
    text(this,390,415,'SCORE',22,'#77746d');text(this,390,500,String(d.score),100);
    text(this,390,620,`BEST  ${d.best}`,28);
    if(d.newBest){const best=text(this,390,680,'NEW BEST!',56,'#e98980');best.setScale(.35);this.tweens.add({targets:best,scale:1,duration:430,ease:'Back.Out',onComplete:()=>this.tweens.add({targets:best,scale:1.08,duration:520,yoyo:true,repeat:-1,ease:'Sine.InOut'})});this.tweens.add({targets:bg,alpha:.5,duration:260,yoyo:true,repeat:2});this.confetti();}
    else text(this,390,680,`${Math.max(0,d.best-d.score)} TO BEAT YOUR BEST (${d.best})`,23,'#77746d','normal');
    if(newly){text(this,390,775,`NEW SKIN UNLOCKED: ${newly}!`,23,'#8d7652');const preview=this.add.graphics();ball(preview,'coral',650,775,24,newly,0);}
    if(next){
      text(this,390,newly?865:795,`NEXT UNLOCK: ${next.name} IN ${Math.max(0,next.at-d.best)} PTS`,22,'#77746d');
      const barY=newly?912:842;const bar=this.add.graphics();bar.fillStyle(0xe4ded1,1);bar.fillRoundedRect(230,barY,320,14,7);bar.fillStyle(0x85b9d8,1);bar.fillRoundedRect(230,barY,320*Math.min(1,d.best/next.at),14,7);
      const preview=this.add.graphics();ball(preview,'coral',590,barY+8,25,next.name,0);preview.setAlpha(.8);
    } else text(this,390,795,'ALL SKINS UNLOCKED',22,'#77746d');
    const play=this.add.graphics();play.fillStyle(0xe98980,1);play.fillRoundedRect(105,1020,570,132,36);play.lineStyle(4,0xffffff,.65);play.strokeRoundedRect(105,1020,570,132,36);play.setInteractive(new Phaser.Geom.Rectangle(105,1020,570,132),Phaser.Geom.Rectangle.Contains).on('pointerdown',()=>this.scene.start('game'));text(this,390,1086,'PLAY AGAIN',34);
    const menu=this.add.graphics();menu.fillStyle(0xffffff,1);menu.lineStyle(3,0xe4ded1,1);menu.fillRoundedRect(150,1190,480,96,30);menu.strokeRoundedRect(150,1190,480,96,30);menu.setInteractive(new Phaser.Geom.Rectangle(150,1190,480,96),Phaser.Geom.Rectangle.Contains).on('pointerdown',()=>this.scene.start('menu'));text(this,390,1238,'MENU',28);
  }
  private confetti():void{const g=this.add.graphics();const colors=[0xe98980,0x85b9d8,0x9ac9ac,0xe9cd83,0xb8a6d9];for(let i=0;i<32;i++){g.fillStyle(colors[i%colors.length],1);g.fillRect(90+(i*73)%600,200+(i*97)%700,9,14);}this.tweens.add({targets:g,alpha:0,y:100,duration:1000,onComplete:()=>g.destroy()});}
}
