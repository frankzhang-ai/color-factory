import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene.ts';
import { MenuScene } from '../scenes/MenuScene.ts';
import { GameScene, PauseScene } from '../scenes/GameScene.ts';
import { GameOverScene } from '../scenes/GameOverScene.ts';
export const config: Phaser.Types.Core.GameConfig = { type: Phaser.AUTO, width: 780, height: 1688, parent: 'game', backgroundColor: '#05070f', scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }, scene: [BootScene, MenuScene, GameScene, PauseScene, GameOverScene], render: { antialias: true, roundPixels: false }, input: { activePointers: 3 } };
