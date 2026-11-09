import Phaser from 'phaser';
import { text,floatingShapes } from '../objects/draw.ts';
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
    if(d.newBest){const best=text(this,390,710,'NEW BEST!',40,'#e98980');best.setScale(.4);this.tweens.add({targets:best,scale:1.1,duration:450,ease:'Back.Out'});this.confetti();}
    else text(this,390,710,`${Math.max(0,d.best-d.score)} TO BEAT YOUR BEST`,21,'#77746d','normal');
    const unlockText=newly?`NEW SKIN UNLOCKED: ${newly}!`:next?`NEXT UNLOCK: ${next.name} IN ${Math.max(0,next.at-d.best)}`:'ALL SKINS UNLOCKED';
    text(this,390,815,unlockText,21,'#77746d');
    const play=this.add.graphics();play.fillStyle(0xe98980,1);play.fillRoundedRect(105,1000,570,140,36);play.setInteractive(new Phaser.Geom.Rectangle(105,1000,570,140),Phaser.Geom.Rectangle.Contains).on('pointerdown',()=>this.scene.start('game'));text(this,390,1070,'PLAY AGAIN',34);
    const menu=this.add.graphics();menu.fillStyle(0xffffff,1);menu.lineStyle(3,0xe4ded1,1);menu.fillRoundedRect(150,1180,480,110,30);menu.strokeRoundedRect(150,1180,480,110,30);menu.setInteractive(new Phaser.Geom.Rectangle(150,1180,480,110),Phaser.Geom.Rectangle.Contains).on('pointerdown',()=>this.scene.start('menu'));text(this,390,1235,'MENU',28);
  }
  private confetti():void{const g=this.add.graphics();const colors=[0xe98980,0x85b9d8,0x9ac9ac,0xe9cd83,0xb8a6d9];for(let i=0;i<32;i++){g.fillStyle(colors[i%colors.length],1);g.fillRect(90+(i*73)%600,200+(i*97)%700,9,14);}this.tweens.add({targets:g,alpha:0,y:100,duration:1000,onComplete:()=>g.destroy()});}
}
