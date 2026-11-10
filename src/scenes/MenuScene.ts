import Phaser from 'phaser';
import { ball, text, floatingShapes } from '../objects/draw.ts';
import { getBest,getSound,saveSound,getSkin,saveSkin,getUnlockedSkins,SKINS,type Skin } from '../systems/Storage.ts';
import { soundIcon } from './ui.ts';
export class MenuScene extends Phaser.Scene {
  private soundEnabled=getSound(); private soundGraphic?:Phaser.GameObjects.Graphics; private skin=getSkin(); private skinLabel!:Phaser.GameObjects.Text; private skinPreview!:Phaser.GameObjects.Graphics;
  constructor(){super('menu');}
  create():void {
    this.soundEnabled=getSound(); this.skin=getSkin(); floatingShapes(this);
    const state=()=>Object.freeze({scene:'menu' as const,score:0,best:getBest(),lives:3,combo:0,comboTier:null,band:1,colorsInPool:3,laneColors:Object.freeze(['coral','blue','mint'] as const),ball:null,travelMs:2400,gapMs:430,buttons:Object.freeze([]),level:1,levelProgress:0,skin:this.skin,unlockedSkins:Object.freeze(getUnlockedSkins()),firstBallAt:null,fx:{lastCorrectAt:0,correctCount:0,wrongCount:0,missCount:0,scorePopCount:0,particleBursts:0,lastSound:null,soundCount:0,tierShown:null,tierBursts:0,levelUps:0,vibrateCalls:0,lastPitch:null},elapsedMs:0,layout:{hud:{top:0,bottom:240},play:{top:250,bottom:1300},controls:{top:1390,bottom:1620},hint:null}});
    window.__COLORFACTORY__={getState:state};
    const demo=this.add.graphics();
    for(let i=0;i<3;i++) ball(demo,(['coral','blue','mint'] as const)[i],285+i*105,426,47,this.skin,this.time.now/650+i);
    demo.fillStyle(0x101d30,1);demo.fillRoundedRect(220,500,340,64,18);demo.lineStyle(4,0x22e6ff,.9);demo.strokeRoundedRect(220,500,340,64,18);
    for(let x=245;x<550;x+=38){demo.fillStyle(0x22e6ff,.65);demo.fillTriangle(x,520,x+22,520,x+11,543);}
    for(let i=0;i<8;i++){const light=this.add.circle(240+i*43,490,3,0x22e6ff,.9);this.tweens.add({targets:light,alpha:.12,duration:450+i*35,yoyo:true,repeat:-1,delay:i*65});}
    const title=text(this,390,635,'COLOR FACTORY',84,'#ffffff');title.setStroke('#ff2bd6',2);const glitch=text(this,386,635,'COLOR FACTORY',84,'#22e6ff').setAlpha(.28);
    text(this,390,715,'CYBER EDITION',27,'#ff2bd6'); text(this,390,759,'SORT  •  MATCH  •  KEEP IT MOVING',19,'#9bb3cd','normal');
    this.time.addEvent({delay:2600,loop:true,callback:()=>{title.setX(390+Phaser.Math.Between(-4,4));glitch.setX(386+Phaser.Math.Between(-8,8));glitch.setAlpha(.65);this.time.delayedCall(110,()=>{title.setX(390);glitch.setX(386);glitch.setAlpha(.28);});}});
    const play=this.add.graphics();play.fillStyle(0x091426,.98);play.fillRoundedRect(130,825,520,136,38);play.lineStyle(6,0x22e6ff,1);play.strokeRoundedRect(130,825,520,136,38);play.setInteractive(new Phaser.Geom.Rectangle(130,825,520,136),Phaser.Geom.Rectangle.Contains).on('pointerdown',()=>this.scene.start('game'));text(this,390,893,'▶  PLAY',48,'#ffffff');this.tweens.add({targets:play,alpha:.68,duration:850,yoyo:true,repeat:-1});
    text(this,390,1025,`BEST SCORE   ${getBest()}`,27,'#39ff88'); text(this,390,1120,'BALL SKIN',22,'#22e6ff');
    const card=this.add.graphics();card.fillStyle(0x081426,.97);card.fillRoundedRect(170,1150,440,200,26);card.lineStyle(3,0x22e6ff,.9);card.strokeRoundedRect(170,1150,440,200,26);card.lineStyle(1,0xff2bd6,.5);card.strokeRoundedRect(177,1157,426,186,21);
    const left=text(this,208,1250,'‹',48);left.setInteractive(new Phaser.Geom.Rectangle(175,1208,65,82),Phaser.Geom.Rectangle.Contains).on('pointerdown',()=>this.shift(-1));
    this.skinPreview=this.add.graphics();this.skinLabel=text(this,430,1250,'',23);this.updateSkinLabel();
    const right=text(this,572,1250,'›',48);right.setInteractive(new Phaser.Geom.Rectangle(540,1208,65,82),Phaser.Geom.Rectangle.Contains).on('pointerdown',()=>this.shift(1));
    const soundBg=this.add.graphics();soundBg.fillStyle(0x091426,.9);soundBg.fillCircle(700,110,42);soundBg.lineStyle(2,0x22e6ff,.8);soundBg.strokeCircle(700,110,42);this.soundGraphic=soundIcon(this,700,110,this.soundEnabled);soundBg.setInteractive(new Phaser.Geom.Circle(700,110,46),Phaser.Geom.Circle.Contains).on('pointerdown',()=>{this.soundEnabled=!this.soundEnabled;saveSound(this.soundEnabled);this.soundGraphic?.destroy();this.soundGraphic=soundIcon(this,700,110,this.soundEnabled);});
  }
  private shift(direction:number):void {const current=SKINS.findIndex(s=>s.name===this.skin);const next=SKINS[(current+direction+SKINS.length)%SKINS.length];this.skin=next.name;if(getUnlockedSkins().includes(next.name))saveSkin(this.skin);this.updateSkinLabel();}
  private updateSkinLabel():void {const row=SKINS.find(s=>s.name===this.skin)!;const unlocked=getUnlockedSkins().includes(row.name);this.skinPreview.clear();ball(this.skinPreview,'coral',300,1250,43,this.skin,0);if(!unlocked)this.skinPreview.setAlpha(.3);else this.skinPreview.setAlpha(1);this.skinLabel.setText(unlocked?`${row.name}\nSELECTED`:`${row.name}\nLOCKED · Best ${row.at}`);this.skinLabel.setColor(unlocked?'#ffffff':'#8290a6');this.skinLabel.setFontSize(22);}
}
