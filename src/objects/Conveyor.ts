import Phaser from 'phaser';
export class Conveyor extends Phaser.GameObjects.Container {
  private stripes: Phaser.GameObjects.Graphics[] = [];
  private readonly stripeTop: number;
  private readonly stripeBottom: number;
  constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number) {
    super(scene, x, y);
    this.stripeTop = -height / 2 + 24;
    this.stripeBottom = height / 2 - 24;
    const background = scene.add.graphics();
    background.fillStyle(0xeee9de, 1);
    background.fillRoundedRect(-width / 2, -height / 2, width, height, 28);
    background.lineStyle(3, 0xe4ded1, 0.9);
    background.strokeRoundedRect(-width / 2, -height / 2, width, height, 28);
    this.add(background);
    const maskShape = scene.make.graphics({ x: 0, y: 0 });
    maskShape.fillStyle(0xffffff);
    maskShape.fillRoundedRect(x - width / 2, y - height / 2, width, height, 28);
    const mask = maskShape.createGeometryMask();
    for (let i = 0; i < 12; i++) {
      const stripe = scene.add.graphics();
      stripe.fillStyle(0xded8cc, 0.8);
      stripe.fillRoundedRect(-width / 2 + 10, -height / 2 + i * 32, width - 20, 14, 7);
      stripe.setMask(mask);
      this.stripes.push(stripe);
      this.add(stripe);
    }
  }
  tick(delta: number): void {
    const span = this.stripeBottom - this.stripeTop;
    for (const stripe of this.stripes) {
      stripe.y += delta * 0.055;
      if (stripe.y > this.stripeBottom)
        stripe.y -= span;
    }
  }
}
