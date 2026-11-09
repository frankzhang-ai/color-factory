import Phaser from 'phaser';
import { ball, text, floatingShapes } from '../objects/draw.ts';
import { getBest,getSound,saveSound,getSkin,saveSkin,getUnlockedSkins,SKINS,type Skin } from '../systems/Storage.ts';
import { soundIcon } from './ui.ts';
export class MenuScene extends Phaser.Scene {
  private soundEnabled=getSound();private soundGraphic?:Phaser.GameObjects.Graphics;private skin=getSkin();private skinLabel!:Phaser.GameObjects.Text;private skinPreview!:Phaser.GameObjects.Graphics;
  constructor(){super('menu');}
  create():void{
    this.soundEnabled=getSound();this.skin=getSkin();
    floatingShapes(this);
    const state=()=>Object.freeze({scene:'menu' as const,score:0,best:getBest(),lives:3,combo:0,comboTier:null,band:1,colorsInPool:3,laneColors:Object.freeze(['coral','blue','mint'] as const),ball:null,travelMs:2400,gapMs:430,buttons:Object.freeze([]),level:1,levelProgress:0,skin:this.skin,unlockedSkins:Object.freeze(getUnlockedSkins()),firstBallAt:null,fx:{lastCorrectAt:0,correctCount:0,wrongCount:0,missCount:0,scorePopCount:0,particleBursts:0,lastSound:null,soundCount:0,tierShown:null,tierBursts:0,levelUps:0,vibrateCalls:0,lastPitch:null},elapsedMs:0,layout:{hud:{top:0,bottom:240},play:{top:250,bottom:1300},controls:{top:1390,bottom:1620},hint:null}});
    window.__COLORFACTORY__={getState:state};
    this.add.text(55,230,'✦',{fontSize:'55px',color:'#22e6ff'});this.add.text(680,390,'●',{fontSize:'80px',color:'#ff2bd6'});this.add.text(90,1140,'△',{fontSize:'90px',color:'#39ff88'});
    const g=this.add.graphics();ball(g,'coral',285,450,46,this.skin,0);ball(g,'blue',390,450,46,this.skin,1);ball(g,'mint',495,450,46,this.skin,2);
    g.fillStyle(0x101d30,1);g.fillRoundedRect(220,510,340,64,18);g.lineStyle(4,0x22e6ff,.8);g.strokeRoundedRect(220,510,340,64,18);g.lineStyle(2,0x22e6ff,.45);g.lineBetween(240,520,540,520);g.lineBetween(240,562,540,562);
    for(let x=245;x<550;x+=38){g.fillStyle(0x22e6ff,.75);g.fillTriangle(x,530,x+22,530,x+11,551);}
    text(this,390,660,'COLOR FACTORY',58,'#ffffff');text(this,390,725,'CYBER EDITION',25,'#ff2bd6');text(this,390,770,'SORT  •  MATCH  •  KEEP IT MOVING',19,'#9bb3cd','normal');
    const play=this.add.graphics();play.fillStyle(0x091426,.98);play.fillRoundedRect(130,850,520,142,40);play.lineStyle(6,0x22e6ff,1);play.strokeRoundedRect(130,850,520,142,40);play.setInteractive(new Phaser.Geom.Rectangle(130,850,520,142),Phaser.Geom.Rectangle.Contains).on('pointerdown',()=>this.scene.start('game'));text(this,390,921,'▶  PLAY',48,'#eafaff');
    text(this,390,1070,`BEST SCORE   ${getBest()}`,27,'#39ff88');
    text(this,390,1195,'BALL SKIN',19,'#9bb3cd');
    const left=text(this,145,1275,'‹',52);left.setInteractive(new Phaser.Geom.Rectangle(100,1235,80,80),Phaser.Geom.Rectangle.Contains).on('pointerdown',()=>this.shift(-1));
    this.skinPreview=this.add.graphics();this.skinLabel=text(this,425,1275,'',22);this.updateSkinLabel();
    const right=text(this,700,1275,'›',52);right.setInteractive(new Phaser.Geom.Rectangle(660,1235,80,80),Phaser.Geom.Rectangle.Contains).on('pointerdown',()=>this.shift(1));
    const box=this.add.graphics();box.fillStyle(0x353431,.08);box.fillCircle(700,145,46);this.soundGraphic=soundIcon(this,700,145,this.soundEnabled);box.setInteractive(new Phaser.Geom.Circle(700,145,46),Phaser.Geom.Circle.Contains).on('pointerdown',()=>{this.soundEnabled=!this.soundEnabled;saveSound(this.soundEnabled);this.soundGraphic?.destroy();this.soundGraphic=soundIcon(this,700,145,this.soundEnabled);});
  }
  private shift(direction:number):void{const current=SKINS.findIndex(s=>s.name===this.skin);const next=SKINS[(current+direction+SKINS.length)%SKINS.length];this.skin=next.name;if(getUnlockedSkins().includes(next.name))saveSkin(this.skin);this.updateSkinLabel();}
  private updateSkinLabel():void{const row=SKINS.find(s=>s.name===this.skin)!;const unlocked=getUnlockedSkins().includes(row.name);this.skinPreview.clear();ball(this.skinPreview,'coral',275,1275,30,this.skin,0);if(!unlocked){this.skinPreview.setAlpha(.32);this.skinPreview.fillStyle(0x353431,.75);this.skinPreview.fillRoundedRect(298,1262,30,27,5);this.skinPreview.fillStyle(0xfaf7f0,1);this.skinPreview.fillCircle(313,1262,7);this.skinPreview.lineStyle(4,0xfaf7f0,1);this.skinPreview.strokeCircle(313,1262,7);}else this.skinPreview.setAlpha(1);this.skinLabel.setText(unlocked?`${row.name}\nSELECTED`:`${row.name}\nBest ${row.at} to unlock`);this.skinLabel.setColor(unlocked?'#eafaff':'#8290a6');this.skinLabel.setFontSize(20);}
}
