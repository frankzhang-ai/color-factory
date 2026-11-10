import Phaser from 'phaser';
import { bake } from './bake.ts';
export class Conveyor extends Phaser.GameObjects.Container {
  private stripes!: Phaser.GameObjects.TileSprite;
  private rollers: Phaser.GameObjects.Image[] = [];
  constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number) {
    super(scene, x, y);
    const frameKey=bake(scene,'cfcute-conveyor-frame',width,height,g=>{
    g.fillStyle(0xe8a8bf,.3); g.fillRoundedRect(3,10,width,height,32);
    g.fillStyle(0xc9a4dc,1); g.fillRoundedRect(0,0,width,height,30);
    g.fillStyle(0xffd8e5,1); g.fillRoundedRect(12,10,width-24,height-20,23);
    g.fillStyle(0xfff2d7,1); g.fillRoundedRect(19,15,width-38,height-30,20);
    g.lineStyle(5,0xffffff,1);g.lineBetween(8,22,8,height-22);g.lineBetween(width-8,22,width-8,height-22);
    g.lineStyle(2,0xaaa192,.55);g.lineBetween(23,23,width-23,23);g.lineBetween(23,height-23,width-23,height-23);
    g.fillStyle(0xffffff,.92);g.fillRoundedRect(20,16,width-40,12,6);for(let i=0;i<9;i++)g.fillEllipse(46+i*42,29,13,24+(i%3)*7);
    });
    this.add(scene.add.image(-width/2,-height/2,frameKey).setOrigin(0));
    const tileKey=bake(scene,'cfcute-wafer-tile',96,29,g=>{g.lineStyle(8,0xffb3c7,.35);g.beginPath();g.moveTo(0,0);g.lineTo(24,24);g.lineTo(48,0);g.strokePath();g.lineStyle(8,0xa8d8ff,.35);g.beginPath();g.moveTo(48,0);g.lineTo(72,24);g.lineTo(96,0);g.strokePath();g.fillStyle(0xff8fab,.8);g.fillRoundedRect(4,13,11,4,2);g.fillStyle(0x75c9f5,.8);g.fillRoundedRect(61,8,11,4,2);g.fillStyle(0xffd45e,.8);g.fillRoundedRect(81,21,11,4,2);});
    this.stripes=scene.add.tileSprite(0,0,width-40,height-36,tileKey).setAlpha(1);this.add(this.stripes);
    const rollerKey=bake(scene,'cfcute-roller',22,22,g=>{g.fillStyle(0xffb3c7,1);g.fillCircle(11,11,10);g.fillStyle(0xfff2d7,1);g.fillCircle(11,11,4);g.fillStyle(0xffffff,.8);g.fillCircle(8,8,2);g.lineStyle(2,0xffffff,.9);g.strokeCircle(11,11,9);});
    for(const xx of [-width/2+9,width/2-9]) for(let i=0;i<15;i++){const roller=scene.add.image(xx,-height/2+26+i*48,rollerKey);this.rollers.push(roller);this.add(roller);}
  }
  tick(delta:number,travelMs=2400):void{this.stripes.tilePositionY-=delta*Math.max(.045,230/travelMs);for(const roller of this.rollers)roller.rotation+=delta*.004;}
}
