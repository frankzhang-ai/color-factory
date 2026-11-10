import Phaser from 'phaser';
import { HEX, symbol } from './draw.ts';
import type { ColorName } from '../systems/DifficultyManager.ts';
import { bake } from './bake.ts';
export class SortButton extends Phaser.GameObjects.Container {
  private art!: Phaser.GameObjects.Image; private buttonWidth:number; private buttonHeight:number;
  constructor(scene: Phaser.Scene, x: number, y: number, w: number, h: number, public color: ColorName, private callback: () => void) { super(scene, x, y);this.buttonWidth=w;this.buttonHeight=h;this.art=scene.add.image(-w/2,-h/2,this.texture(scene,color,w,h)).setOrigin(0);this.add(this.art);this.setSize(w, h).setInteractive(new Phaser.Geom.Rectangle(0, 0, w, h), Phaser.Geom.Rectangle.Contains); this.on('pointerdown', callback); scene.add.existing(this); }
  setColor(color: ColorName): void { this.color = color; this.art.setTexture(this.texture(this.scene,color,this.buttonWidth,this.buttonHeight)); }
  private texture(scene:Phaser.Scene,color:ColorName,w:number,h:number):string {return bake(scene,`cfcute-button-${color}-${w}x${h}`,w,h,g=>{g.fillStyle(0x855875,.12);g.fillRoundedRect(4,9,w-8,h-8,38);g.fillStyle(HEX[color],1);g.fillRoundedRect(0,0,w-8,h-8,38);g.fillStyle(0xffffff,.2);g.fillRoundedRect(9,8,w-26,28,16);g.lineStyle(5,0xffffff,.62);g.strokeRoundedRect(4,4,w-16,h-16,34);symbol(g,color,w/2-4,h/2-6,40);g.fillStyle(0xffffff,.95);g.fillCircle(w/2-29,h/2+51-6,7);g.fillCircle(w/2+29,h/2+51-6,7);g.fillStyle(0x59465b,1);g.fillCircle(w/2-27,h/2+52-6,3);g.fillCircle(w/2+31,h/2+52-6,3);g.lineStyle(3,0x59465b,1);g.beginPath();g.arc(w/2-4,h/2+58-6,9,.15,Math.PI-.15,false);g.strokePath();});}
}
