import Phaser from 'phaser';
import { ball, text } from '../objects/draw.ts';
import { cuteBackdrop, spitMachine } from '../objects/cuteDecor.ts';
import { getBest,getSound,saveSound,getSkin,saveSkin,getUnlockedSkins,SKINS,type Skin } from '../systems/Storage.ts';
import { soundIcon } from './ui.ts';
export class MenuScene extends Phaser.Scene {
  private soundEnabled=getSound();private soundGraphic?:Phaser.GameObjects.Graphics;private skin=getSkin();private skinLabel!:Phaser.GameObjects.Text;private skinPreview!:Phaser.GameObjects.Graphics;
  constructor(){super('menu');}
  create():void{
    this.soundEnabled=getSound();this.skin=getSkin();
    cuteBackdrop(this);
    const state=()=>Object.freeze({scene:'menu' as const,score:0,best:getBest(),lives:3,combo:0,comboTier:null,band:1,colorsInPool:3,laneColors:Object.freeze(['coral','blue','mint'] as const),ball:null,travelMs:2400,gapMs:430,buttons:Object.freeze([]),level:1,levelProgress:0,skin:this.skin,unlockedSkins:Object.freeze(getUnlockedSkins()),firstBallAt:null,fx:{lastCorrectAt:0,correctCount:0,wrongCount:0,missCount:0,scorePopCount:0,particleBursts:0,lastSound:null,soundCount:0,tierShown:null,tierBursts:0,levelUps:0,vibrateCalls:0,lastPitch:null},elapsedMs:0,layout:{hud:{top:0,bottom:240},play:{top:250,bottom:1300},controls:{top:1390,bottom:1620},hint:null}});
    window.__COLORFACTORY__={getState:state};
    const machine=spitMachine(this,390,438);machine.setScale(1);
    this.time.addEvent({delay:2000,loop:true,callback:()=>{const snack=this.add.graphics();ball(snack,'coral',0,0,22,this.skin,0);snack.setPosition(390,505).setDepth(8);this.tweens.add({targets:snack,y:575,x:390+Phaser.Math.Between(-35,35),scale:0.7,duration:520,ease: 'Bounce.Out',onComplete:()=>snack.destroy()});}});
    const g=this.add.graphics();ball(g,'coral',285,565,43,this.skin,0);ball(g,'blue',390,565,43,this.skin,1);ball(g,'mint',495,565,43,this.skin,2);
    g.fillStyle(0xfff2d7,1);g.fillRoundedRect(230,608,320,42,15);g.lineStyle(5,0xffb3c7,1);g.strokeRoundedRect(230,608,320,42,15);for(let x=245;x<540;x+=30){g.fillStyle([0xffb3c7,0xffd1a8,0xb5ead7,0xa8d8ff][Math.floor(x/30)%4],.9);g.fillTriangle(x,615,x+22,615,x+11,638);}
    const palette=['#ff8fab','#ffd1a8','#e8bf59','#70cda9','#75c9f5','#b993f5'];
    const title=[...('COLOR FACTORY')],style={fontFamily:'system-ui, sans-serif',fontSize:'48px',fontStyle:'bold',stroke:'#ffffff',strokeThickness:8,shadow:{offsetX:0,offsetY:4,color:'#9c8295',blur:7,fill:true}};
    const letters=title.map((letter,i)=>this.add.text(0,720,letter,{...style,color:palette[i%palette.length]}).setOrigin(.5));const gap=title.indexOf(' '), total=letters.reduce((n,o)=>n+o.width,0)+15*11;let cursor=390-total/2;
    letters.forEach((o,i)=>{o.x=cursor+o.width/2;cursor+=o.width+(i===gap?22:15);this.tweens.add({targets:o,y:710,duration:430+i*24,yoyo:true,repeat:-1,ease:'Sine.InOut',delay:i*32});});
    text(this,390,770,'SORT • MATCH • KEEP IT MOVING',21,'#987c9a','normal');
    const play=this.add.graphics();play.fillStyle(0x855875,.12);play.fillRoundedRect(130,858,520,142,40);play.fillStyle(0xff8fab);play.fillRoundedRect(130,850,520,142,48);play.fillStyle(0xffffff,.28);play.fillRoundedRect(144,862,492,33,18);play.lineStyle(6,0xffffff,.85);play.strokeRoundedRect(130,850,520,142,40);play.setInteractive(new Phaser.Geom.Rectangle(130,850,520,142),Phaser.Geom.Rectangle.Contains).on('pointerdown',()=>this.scene.start('game'));text(this,390,921,'PLAY ♡',48,'#ffffff');this.tweens.add({targets:play,scaleX:1.025,scaleY:1.025,duration:650,yoyo:true,repeat:-1,ease:'Sine.InOut'});
    text(this,390,1070,`BEST SCORE   ${getBest()}`,27);
    const card=this.add.graphics();card.fillStyle(0xffffff,.88);card.fillRoundedRect(95,1170,590,205,36);card.lineStyle(4,0xffdce6,1);card.strokeRoundedRect(95,1170,590,205,36);
    text(this,390,1195,'BALL SKIN',19,'#77746d');
    const left=text(this,145,1275,'‹',52);left.setInteractive(new Phaser.Geom.Rectangle(100,1235,80,80),Phaser.Geom.Rectangle.Contains).on('pointerdown',()=>this.shift(-1));
    this.skinPreview=this.add.graphics();this.skinLabel=text(this,425,1275,'',22);this.updateSkinLabel();
    const right=text(this,700,1275,'›',52);right.setInteractive(new Phaser.Geom.Rectangle(660,1235,80,80),Phaser.Geom.Rectangle.Contains).on('pointerdown',()=>this.shift(1));
    const box=this.add.graphics();box.fillStyle(0x353431,.08);box.fillCircle(700,145,46);this.soundGraphic=soundIcon(this,700,145,this.soundEnabled);box.setInteractive(new Phaser.Geom.Circle(700,145,46),Phaser.Geom.Circle.Contains).on('pointerdown',()=>{this.soundEnabled=!this.soundEnabled;saveSound(this.soundEnabled);this.soundGraphic?.destroy();this.soundGraphic=soundIcon(this,700,145,this.soundEnabled);});
  }
  private shift(direction:number):void{const current=SKINS.findIndex(s=>s.name===this.skin);const next=SKINS[(current+direction+SKINS.length)%SKINS.length];this.skin=next.name;if(getUnlockedSkins().includes(next.name))saveSkin(this.skin);this.updateSkinLabel();}
  private updateSkinLabel():void{const row=SKINS.find(s=>s.name===this.skin)!;const unlocked=getUnlockedSkins().includes(row.name);this.skinPreview.clear();ball(this.skinPreview,'coral',275,1275,30,this.skin,0);if(!unlocked){this.skinPreview.setAlpha(.32);this.skinPreview.fillStyle(0x353431,.75);this.skinPreview.fillRoundedRect(298,1262,30,27,5);this.skinPreview.fillStyle(0xffffff,1);this.skinPreview.fillCircle(313,1262,7);this.skinPreview.lineStyle(4,0xffffff,1);this.skinPreview.strokeCircle(313,1262,7);}else this.skinPreview.setAlpha(1);this.skinLabel.setText(unlocked?`${row.name}\nSELECTED`:`${row.name}\nBest ${row.at} to unlock`);this.skinLabel.setColor(unlocked?'#353431':'#9b958a');this.skinLabel.setFontSize(20);}
}
