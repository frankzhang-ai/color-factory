import Phaser from 'phaser';
import { text,floatingShapes,ball } from '../objects/draw.ts';
import { getUnlockedSkins,SKINS } from '../systems/Storage.ts';
import type { Tier } from '../systems/ScoreManager.ts';
import type { ColorName } from '../systems/DifficultyManager.ts';
type Data={score:number;best:number;newBest:boolean;previousBest:number;comboTier:Tier|null;band:number;colorsInPool:number;laneColors:ColorName[];travelMs:number;gapMs:number;fx:any;elapsedMs:number;level:number;levelProgress:number;skin:string;unlockedSkins:string[];firstBallAt:number|null};
export class GameOverScene extends Phaser.Scene {
  constructor(){super('over');}
  create(d:Data):void {
    floatingShapes(this);
    const newly=SKINS.filter(s=>d.previousBest<s.at&&d.best>=s.at).at(-1)?.name??null;
    const next=SKINS.find(s=>s.at>d.best);
    const over={score:d.score,best:d.best,isNewBest:d.newBest,toBest:Math.max(0,d.best-d.score),nextUnlock:next?{name:next.name,at:next.at,remaining:Math.max(0,next.at-d.best)}:null,newlyUnlocked:newly};
    window.__COLORFACTORY__={getState:()=>Object.freeze({scene:'over',score:d.score,best:d.best,lives:0,combo:0,comboTier:d.comboTier,band:d.band,colorsInPool:d.colorsInPool,laneColors:Object.freeze([...d.laneColors]),ball:null,travelMs:d.travelMs,gapMs:d.gapMs,buttons:Object.freeze([]),level:d.level,levelProgress:d.levelProgress,skin:d.skin,unlockedSkins:Object.freeze(getUnlockedSkins(d.best)),firstBallAt:d.firstBallAt,fx:Object.freeze({...d.fx}),elapsedMs:d.elapsedMs,layout:{hud:{top:0,bottom:240},play:{top:250,bottom:1300},controls:{top:1390,bottom:1620},hint:null},over:Object.freeze(over)})};
    const title=text(this,390,228,'SYSTEM OVERLOAD',50,'#ff2bd6');title.setStroke('#22e6ff',2);text(this,390,280,'GAME OVER',24,'#b9d5e6');
    text(this,390,350,'SCORE',22,'#9bb3cd');text(this,390,430,String(d.score),96,'#ffffff');text(this,390,510,`BEST  ${d.best}`,29,'#39ff88');
    if(d.newBest) text(this,390,570,'NEW BEST!',48,'#22e6ff');else text(this,390,570,`${Math.max(0,d.best-d.score)} TO BEAT YOUR BEST (${d.best})`,22,'#b9d5e6','normal');
    const panel=this.add.graphics();panel.fillStyle(0x081426,.97);panel.fillRoundedRect(90,635,600,342,28);panel.lineStyle(3,0x22e6ff,.9);panel.strokeRoundedRect(90,635,600,342,28);panel.lineStyle(1,0xff2bd6,.6);panel.strokeRoundedRect(97,642,586,328,22);
    if(newly){const prev=this.add.graphics();ball(prev,'coral',160,735,38,newly,0);text(this,420,720,'NEW SKIN UNLOCKED',26,'#ffc23a');text(this,420,765,newly.toUpperCase(),28,'#ffffff');}
    if(next){const rowY=newly?820:720;const preview=this.add.graphics();ball(preview,'coral',155,rowY,31,next.name,0);const label=text(this,425,rowY,`NEXT UNLOCK: ${next.name} · ${Math.max(0,next.at-d.best)} PTS`,24,'#22e6ff');label.setScale(.82);const barY=rowY+38;const bar=this.add.graphics();bar.fillStyle(0x101d32,1);bar.fillRoundedRect(205,barY,390,18,9);bar.lineStyle(2,0x22e6ff,.9);bar.strokeRoundedRect(205,barY,390,18,9);const previous=SKINS.filter(s=>s.at<next.at).at(-1)?.at??0;const progress=Math.max(.02,Math.min(1,(d.best-previous)/(next.at-previous)));bar.fillStyle(0x22e6ff,1);bar.fillRoundedRect(209,barY+4,382*progress,10,5);}
    else text(this,390,740,'ALL SKINS UNLOCKED',25,'#22e6ff');
    const stats=this.add.graphics();stats.fillStyle(0x101d32,.8);stats.fillRoundedRect(175,895,430,58,15);text(this,390,925,`LEVEL ${d.level}   ·   ${d.score} POINTS`,20,'#d9f5ff');
    const play=this.add.graphics();play.fillStyle(0x091426,1);play.fillRoundedRect(105,1050,570,125,36);play.lineStyle(5,0x22e6ff,1);play.strokeRoundedRect(105,1050,570,125,36);play.setInteractive(new Phaser.Geom.Rectangle(105,1050,570,125),Phaser.Geom.Rectangle.Contains).on('pointerdown',()=>this.scene.start('game'));text(this,390,1114,'PLAY AGAIN',34,'#ffffff');
    const menu=this.add.graphics();menu.fillStyle(0x101d32,1);menu.lineStyle(3,0xff2bd6,1);menu.fillRoundedRect(150,1210,480,92,30);menu.strokeRoundedRect(150,1210,480,92,30);menu.setInteractive(new Phaser.Geom.Rectangle(150,1210,480,92),Phaser.Geom.Rectangle.Contains).on('pointerdown',()=>this.scene.start('menu'));text(this,390,1256,'MENU',28,'#ffffff');
  }
}
