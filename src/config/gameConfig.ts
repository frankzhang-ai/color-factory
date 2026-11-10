import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene.ts';
import { MenuScene } from '../scenes/MenuScene.ts';
import { GameScene, PauseScene } from '../scenes/GameScene.ts';
import { GameOverScene } from '../scenes/GameOverScene.ts';
import { GoalScene } from '../scenes/GoalScene.ts';
import { LevelEndScene } from '../scenes/LevelEndScene.ts';
// Fixed 780-wide design; height follows the phone's aspect so FIT fills the screen without side gutters.
const viewW = Math.max(1, globalThis.innerWidth || 390), viewH = Math.max(1, globalThis.innerHeight || 844);
export const DESIGN_HEIGHT = Math.round(Math.min(1800, Math.max(1300, 780 * viewH / viewW)));
export const config: Phaser.Types.Core.GameConfig = { type: Phaser.AUTO, width: 780, height: DESIGN_HEIGHT, parent: 'game', backgroundColor: '#fff6fb', scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }, scene: [BootScene, MenuScene, GoalScene, GameScene, PauseScene, GameOverScene, LevelEndScene], render: { antialias: true, roundPixels: false }, input: { activePointers: 3 } };
