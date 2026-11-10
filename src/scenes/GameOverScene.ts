import Phaser from 'phaser';
import { text,ball } from '../objects/draw.ts';
import { cuteBackdrop } from '../objects/cuteDecor.ts';
import { getUnlockedSkins,SKINS } from '../systems/Storage.ts';
import type { Tier } from '../systems/ScoreManager.ts';
import type { ColorName } from '../systems/DifficultyManager.ts';
type Data={score:number;best:number;newBest:boolean;previousBest:number;comboTier:Tier|null;band:number;colorsInPool:number;laneColors:ColorName[];travelMs:number;gapMs:number;fx:any;elapsedMs:number;level:number;levelProgress:number;skin:string;unlockedSkins:string[];firstBallAt:number|null};
export class GameOverScene extends Phaser.Scene {
  constructor(){super('over');}
  create(d:Data):void{
    cuteBackdrop(this);
    const newly=[...SKINS].reverse().find(s=>s.at>0&&d.previousBest<s.at&&d.best>=s.at)?.name??null;
    const next=SKINS.find(s=>s.at>d.best);
    const over={score:d.score,best:d.best,isNewBest:d.newBest,toBest:Math.max(0,d.best-d.score),nextUnlock:next?{name:next.name,at:next.at,remaining:Math.max(0,next.at-d.best)}:null,newlyUnlocked:newly};
    window.__COLORFACTORY__={getState:()=>Object.freeze({scene:'over',score:d.score,best:d.best,lives:0,combo:0,comboTier:d.comboTier,band:d.band,colorsInPool:d.colorsInPool,laneColors:Object.freeze([...d.laneColors]),ball:null,travelMs:d.travelMs,gapMs:d.gapMs,buttons:Object.freeze([]),level:d.level,levelProgress:d.levelProgress,skin:d.skin,unlockedSkins:Object.freeze(getUnlockedSkins()),firstBallAt:d.firstBallAt,fx:Object.freeze({...d.fx}),elapsedMs:d.elapsedMs,layout:{hud:{top:0,bottom:240},play:{top:250,bottom:1300},controls:{top:1390,bottom:1620},hint:null},over:Object.freeze(over)})};
    const bg=this.add.graphics();bg.fillStyle(0xffffff,.9);bg.fillRoundedRect(100,250,580,410,42);bg.lineStyle(5,0xffdce6,1);bg.strokeRoundedRect(100,250,580,410,42);
    text(this,390,315,'GREAT RUN!',50,'#59465b');
    const scoreCard=this.add.graphics();scoreCard.fillStyle(0xfff6fb,1);scoreCard.fillRoundedRect(165,380,450,190,32);scoreCard.lineStyle(3,0xf4e5d2,1);scoreCard.strokeRoundedRect(165,380,450,190,32);
    text(this,390,420,'SCORE',22,'#77746d');text(this,390,493,String(d.score),86,'#59465b');text(this,390,603,`BEST  ${d.best}`,28);
    if(d.newBest){const best=text(this,390,690,'NEW BEST!',50,'#e98980');best.setStroke('#ffffff',8);this.tweens.add({targets:best,scale:1.04,duration:430,ease:'Back.Out',yoyo:true,repeat:-1});this.tweens.add({targets:bg,alpha:.5,duration:260,yoyo:true,repeat:2});this.confetti();}
    // A trio of factory friends reacts beneath the score card.
    const blobs=this.add.graphics().setDepth(2);const shades=[0xff8fab,0x75c9f5,0x70cda9];
    [250,390,530].forEach((x,i)=>{const y=780;blobs.fillStyle(shades[i],.95);blobs.fillCircle(x,y,34);if(d.newBest){blobs.lineStyle(4,0x59465b,1);blobs.beginPath();blobs.arc(x-11,y-6,7,Math.PI,Math.PI*2,false);blobs.strokePath();blobs.beginPath();blobs.arc(x+11,y-6,7,Math.PI,Math.PI*2,false);blobs.strokePath();blobs.lineStyle(3,0x59465b,1);blobs.beginPath();blobs.arc(x,y+5,8,.15,Math.PI-.15,false);blobs.strokePath();blobs.fillStyle(0xffd45e,1);blobs.fillPoints([{x:x-28,y:y-30},{x:x-12,y:y-30},{x:x-20,y:y-54}],true);blobs.fillPoints([{x:x+12,y:y-30},{x:x+28,y:y-30},{x:x+20,y:y-54}],true);blobs.fillCircle(x,y-34,15);}else{blobs.lineStyle(4,0x59465b,1);blobs.beginPath();blobs.arc(x-11,y-4,7,Math.PI,Math.PI*2);blobs.strokePath();blobs.beginPath();blobs.arc(x+11,y-4,7,Math.PI,Math.PI*2);blobs.strokePath();blobs.lineStyle(3,0x59465b,1);blobs.beginPath();blobs.arc(x,y+10,7,.1,Math.PI-.1,false);blobs.strokePath();}});
    this.tweens.add({targets:blobs,y:'+=-14',duration:360,ease:'Sine.InOut',yoyo:true,repeat:-1});
    if(!d.newBest){[0,1].forEach(i=>{const z=text(this,600+i*40,770-i*22,'z',22+i*6,'#b993f5');this.tweens.add({targets:z,y:z.y-45,alpha:0,duration:1100,delay:i*400,repeat:-1,onRepeat:()=>z.setAlpha(1)});});}
    if(!d.newBest) text(this,390,710,`${Math.max(0,d.best-d.score)} TO BEAT YOUR BEST (${d.best})`,23,'#77746d','normal');
    if(newly){text(this,390,850,`NEW SKIN UNLOCKED: ${newly}!`,23,'#8d7652');const preview=this.add.graphics();ball(preview,'coral',655,850,26,newly,0);}
    if(next){
      text(this,390,newly?930:890,`NEXT UNLOCK: ${next.name} IN ${Math.max(0,next.at-d.best)} PTS`,22,'#77746d');
      const barY=newly?976:936;const bar=this.add.graphics();bar.fillStyle(0xffffff,.9);bar.fillRoundedRect(210,barY-10,360,38,19);bar.lineStyle(3,0xf4e5d2,1);bar.strokeRoundedRect(210,barY-10,360,38,19);bar.fillStyle(0xa8d8ff,1);bar.fillRoundedRect(218,barY-2,344*Math.min(1,d.best/next.at),22,11);
      const preview=this.add.graphics();ball(preview,'coral',610,barY+8,30,next.name,0);preview.setAlpha(.95);
    } else text(this,390,830,'ALL SKINS UNLOCKED',22,'#77746d');
    const play=this.add.graphics();play.fillStyle(0x855875,.12);play.fillRoundedRect(105,1028,570,132,36);play.fillStyle(0xe98980,1);play.fillRoundedRect(105,1020,570,132,36);play.fillStyle(0xffffff,.22);play.fillRoundedRect(120,1030,540,27,14);play.lineStyle(4,0xffffff,.85);play.strokeRoundedRect(105,1020,570,132,36);play.setInteractive(new Phaser.Geom.Rectangle(105,1020,570,132),Phaser.Geom.Rectangle.Contains).on('pointerdown',()=>this.scene.start('game'));text(this,390,1086,'PLAY AGAIN',34,'#ffffff');
    const menu=this.add.graphics();menu.fillStyle(0xffffff,1);menu.lineStyle(4,0xf4e5d2,1);menu.fillRoundedRect(150,1190,480,96,30);menu.strokeRoundedRect(150,1190,480,96,30);menu.setInteractive(new Phaser.Geom.Rectangle(150,1190,480,96),Phaser.Geom.Rectangle.Contains).on('pointerdown',()=>this.scene.start('menu'));text(this,390,1238,'MENU',28);
  }
  private confetti():void{const g=this.add.graphics();const colors=[0xe98980,0x85b9d8,0x9ac9ac,0xe9cd83,0xb8a6d9];for(let i=0;i<32;i++){g.fillStyle(colors[i%colors.length],1);g.fillRect(90+(i*73)%600,200+(i*97)%700,9,14);}this.tweens.add({targets:g,alpha:0,y:100,duration:1000,onComplete:()=>g.destroy()});}
}
