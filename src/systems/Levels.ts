export type GoalType = 'sort'|'timed'|'streak'|'combo';
export type LevelDef = { id:number; goal:GoalType; target:number; timeLimitSec:number|null; boss:boolean; lives:number; travelMs:number; gapMs:number; colorsInPool:3|4|5; title:string; starRule:'lives'|'time'; parSec:number|null };
export type RunStats = {correct:number;combo:number;bestCombo:number;streak:number;wrong:number;missed:number;elapsedSec:number;livesLeft:number};
export type Progress = {current:number;target:number;done:boolean;failed:boolean;failReason:'lives'|'time'|'mistake'|null;remaining:number};
function makeLevel(id:number):LevelDef {
 const t=Math.floor((id-1)/5), slot=(id-1)%5, boss=slot===4;
 const travelBase=Math.max(1200,2400-40*(id-1)), travelMs=boss?Math.round(travelBase*.88):travelBase;
 let goal:GoalType='sort', target=10+3*t, timeLimitSec:number|null=null,lives=3,starRule:'lives'|'time'='lives',parSec:number|null=null;
 if(slot===1){goal='combo';target=6+2*t;} else if(slot===2){goal='streak';target=6+2*t;lives=1;starRule='time';parSec=Math.ceil(target*2.2*travelMs/2400+1);} else if(slot===3){goal='timed';timeLimitSec=Math.ceil(target*(3-.2*t));} else if(boss){goal='timed';target=15+4*t;timeLimitSec=Math.ceil(target*(2.8-.2*t));}
 const title=goal==='sort'?`Sort ${target} balls`:goal==='timed'?`Sort ${target} in ${timeLimitSec}s`:goal==='combo'?`Reach a ${target} combo`:`${target} in a row — no mistakes!`;
 return {id,goal,target,timeLimitSec,boss,lives,travelMs,gapMs:Math.max(280,430-5*(id-1)),colorsInPool:id<=10?3:id<=20?4:5,title,starRule,parSec};
}
export const LEVELS:LevelDef[]=Array.from({length:30},(_,i)=>makeLevel(i+1));
export function getLevel(id:number):LevelDef|undefined{return LEVELS[id-1]?.id===id?LEVELS[id-1]:undefined;}
export function starsFor(def:LevelDef, result:{livesLeft:number;elapsedSec:number}):number{return def.starRule==='lives'?Math.max(0,Math.min(3,Math.floor(result.livesLeft))):result.elapsedSec<=def.parSec!?3:result.elapsedSec<=1.4*def.parSec!?2:1;}
export function goalProgress(def:LevelDef,s:RunStats):Progress {
 const current=def.goal==='combo'?s.bestCombo:def.goal==='streak'?s.streak:s.correct, done=current>=def.target;
 let failReason:Progress['failReason']=null;
 if(!done&&s.livesLeft<=0) failReason='lives';
 else if(!done&&def.goal==='streak'&&(s.wrong>0||s.missed>0)) failReason='mistake';
 else if(!done&&def.goal==='timed'&&s.elapsedSec>(def.timeLimitSec??Infinity)) failReason='time';
 return {current,target:def.target,done,failed:failReason!==null,failReason,remaining:Math.max(0,def.target-current)};
}
export function soCloseText(def:LevelDef,p:Progress):string {if(def.goal==='combo')return `Best combo ${p.current} / ${p.target}`;if(def.goal==='streak')return `You got ${p.current} in a row — need ${p.target}`;if(p.failReason==='time')return `So close! ${p.remaining} more before time ran out`;return `So close! Only ${p.remaining} more balls`;}
export function levelTable(){return LEVELS.map(l=>({id:l.id,title:l.title,target:l.target,time:l.timeLimitSec,lives:l.lives,travelMs:l.travelMs,colours:l.colorsInPool,boss:l.boss}));}
