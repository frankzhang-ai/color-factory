import assert from 'node:assert/strict';
import {LEVELS,getLevel,goalProgress,soCloseText,starsFor} from '../src/systems/Levels.ts';
assert.equal(LEVELS.length,30);assert.equal(getLevel(31),undefined);
for(const l of LEVELS){assert.equal(l.boss,l.id%5===0);assert.ok(soCloseText(l,{current:0,target:l.target,done:false,failed:false,failReason:null,remaining:l.target}));}
assert.deepEqual(LEVELS.slice(0,5).map(x=>x.goal),['sort','combo','streak','timed','timed']);
const normalTravel=LEVELS.filter(x=>!x.boss).map(x=>x.travelMs);for(let i=1;i<normalTravel.length;i++)assert.ok(normalTravel[i]<=normalTravel[i-1]);
assert.deepEqual([LEVELS[0].colorsInPool,LEVELS[10].colorsInPool,LEVELS[20].colorsInPool],[3,4,5]);
assert.equal(starsFor(LEVELS[0],{livesLeft:2,elapsedSec:1}),2);
assert.equal(starsFor(LEVELS[2],{livesLeft:1,elapsedSec:LEVELS[2].parSec!}),3);
const base={correct:0,combo:0,bestCombo:0,streak:0,wrong:0,missed:0,elapsedSec:0,livesLeft:3};
for(const l of LEVELS.slice(0,4)){const win={...base,correct:l.target,bestCombo:l.target,streak:l.target};assert.equal(goalProgress(l,win).done,true);}
assert.equal(goalProgress(LEVELS[2],{...base,wrong:1}).failReason,'mistake');
assert.equal(goalProgress(LEVELS[3],{...base,elapsedSec:999}).failReason,'time');
