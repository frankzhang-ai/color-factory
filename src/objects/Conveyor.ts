import Phaser from 'phaser';
export class Conveyor extends Phaser.GameObjects.Container {
  private stripes: Phaser.GameObjects.Graphics[] = [];
  private rollers: Phaser.GameObjects.Graphics[] = [];
  private readonly stripeTop: number; private readonly stripeBottom: number;
  constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number) {
    super(scene, x, y); this.stripeTop=-height/2+30; this.stripeBottom=height/2-30;
    const g=scene.add.graphics();
    g.fillStyle(0x665f55,.13); g.fillRoundedRect(-width/2+3,-height/2+10,width,height,32);
    g.fillStyle(0xbab1a3,1); g.fillRoundedRect(-width/2,-height/2,width,height,30);
    g.fillStyle(0xe0d9ce,1); g.fillRoundedRect(-width/2+12,-height/2+10,width-24,height-20,23);
    g.fillStyle(0xcfc7b8,1); g.fillRoundedRect(-width/2+19,-height/2+15,width-38,height-30,20);
    g.lineStyle(5,0xf3eee5,1);g.lineBetween(-width/2+8,-height/2+22,-width/2+8,height/2-22);g.lineBetween(width/2-8,-height/2+22,width/2-8,height/2-22);
    g.lineStyle(2,0xaaa192,.55);g.lineBetween(-width/2+23,-height/2+23,width/2-23,-height/2+23);g.lineBetween(-width/2+23,height/2-23,width/2-23,height/2-23);
    this.add(g);
    const maskShape=scene.make.graphics({x:0,y:0});maskShape.fillStyle(0xffffff);maskShape.fillRoundedRect(x-width/2+20,y-height/2+18,width-40,height-36,18);const mask=maskShape.createGeometryMask();
    for(let i=0;i<27;i++){const stripe=scene.add.graphics();stripe.fillStyle(0x9b9283,.42);stripe.fillPoints([{x:-width/2+25,y:-15},{x:width/2-25,y:-15},{x:width/2-39,y:15},{x:-width/2+39,y:15}],true);stripe.y=-height/2+30+i*29;stripe.setMask(mask);this.stripes.push(stripe);this.add(stripe);}
    for(const xx of [-width/2+9,width/2-9]) for(let i=0;i<15;i++){const roller=scene.add.graphics();roller.fillStyle(0xf2eee6,1);roller.fillCircle(0,0,9);roller.lineStyle(2,0xaaa192,.9);roller.strokeCircle(0,0,8);roller.lineBetween(-5,0,5,0);roller.setPosition(xx,-height/2+26+i*48);this.rollers.push(roller);this.add(roller);}
  }
  tick(delta:number,travelMs=2400):void{const span=this.stripeBottom-this.stripeTop,speed=delta*Math.max(.045,230/travelMs);for(const stripe of this.stripes){stripe.y+=speed;if(stripe.y>this.stripeBottom)stripe.y-=span;}for(const roller of this.rollers)roller.rotation+=delta*.004;}
}
