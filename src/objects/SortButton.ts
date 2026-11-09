import Phaser from 'phaser';
import { HEX, symbol } from './draw.ts';
import type { ColorName } from '../systems/DifficultyManager.ts';
export class SortButton extends Phaser.GameObjects.Container {
  private g: Phaser.GameObjects.Graphics;
  constructor(scene: Phaser.Scene, x: number, y: number, w: number, h: number, public color: ColorName, private callback: () => void) { super(scene, x, y); this.g = scene.add.graphics(); this.add(this.g); this.draw(w, h); this.setSize(w, h).setInteractive(new Phaser.Geom.Rectangle(0, 0, w, h), Phaser.Geom.Rectangle.Contains) /* container hit areas are measured from the top-left of setSize() */; this.on('pointerdown', callback); scene.add.existing(this); }
  setColor(color: ColorName): void { this.color = color; this.draw((this.input?.hitArea as Phaser.Geom.Rectangle).width, (this.input?.hitArea as Phaser.Geom.Rectangle).height); }
  private draw(w: number, h: number): void { this.g.clear(); this.g.fillStyle(HEX[this.color], .12); this.g.fillRoundedRect(-w / 2-5, -h / 2-5, w+10, h+10, 28); this.g.fillStyle(0x091426, .98); this.g.fillRoundedRect(-w / 2, -h / 2, w, h, 24); this.g.lineStyle(8, HEX[this.color], 1); this.g.strokeRoundedRect(-w / 2 + 4, -h / 2 + 4, w - 8, h - 8, 21);this.g.fillStyle(HEX[this.color],.22);this.g.fillCircle(0,-6,58); symbol(this.g, this.color, 0, -6, 40); }
}
