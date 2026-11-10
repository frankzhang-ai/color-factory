import { STORAGE_PREFIX, readNumber, writeValue } from './Storage.ts';
import { addDays } from './Clock.ts';
export function mulberry32(seed:number):()=>number {let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
export function seedFor(dateKey:string):number {let h=2166136261;for(const c of dateKey.replaceAll('-',''))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
export type DailyChallenge={dateKey:string;seed:number;goal:'sort'|'timed'|'combo';target:number;timeLimitSec:number|null;lives:3;travelMs:number;gapMs:number;colorsInPool:4;title:string};
export function dailyChallenge(dateKey:string):DailyChallenge {const seed=seedFor(dateKey),r=mulberry32(seed), goals=['sort','timed','combo'] as const,goal=goals[Math.floor(r()*3)];const target=goal==='sort'?15+Math.floor(r()*11):goal==='timed'?14+Math.floor(r()*7):8+Math.floor(r()*5);const timeLimitSec=goal==='timed'?Math.ceil(target*2.6):null;return{dateKey,seed,goal,target,timeLimitSec,lives:3,travelMs:1700+Math.floor(r()*201),gapMs:320+Math.floor(r()*21),colorsInPool:4,title:goal==='timed'?`Sort ${target} in ${timeLimitSec}s`:goal==='combo'?`Reach a ${target} combo`:`Sort ${target} balls`};}
export function dailyRandom(dateKey:string):()=>number{return mulberry32(seedFor(dateKey));}
export type DailyResult={won?:boolean;score?:number;stars?:number;[key:string]:unknown};
function dailyDoneKey(date:string){return `${STORAGE_PREFIX}dailyDone.${date}`;}
export function recordDailyPlay(dateKey:string,result:DailyResult):{streak:number;maxStreak:number;newlyUnlocked:'Sunny'|'Galaxy'|null}{
 const prev=globalThis.localStorage?.getItem(STORAGE_PREFIX+'dailyLast');let streak=readNumber(STORAGE_PREFIX+'dailyStreak');
 if(prev!==dateKey)streak=prev===addDays(dateKey,-1)?streak+1:1;
 const old=globalThis.localStorage?.getItem(dailyDoneKey(dateKey));let best=result;
 if(old){try{const parsed=JSON.parse(old) as DailyResult;if((parsed.score??0)>(result.score??0))best=parsed;}catch{}}
 writeValue(dailyDoneKey(dateKey),JSON.stringify(best));writeValue(STORAGE_PREFIX+'dailyLast',dateKey);writeValue(STORAGE_PREFIX+'dailyStreak',String(streak));
 const oldMax=readNumber(STORAGE_PREFIX+'dailyMaxStreak'),maxStreak=Math.max(oldMax,streak);writeValue(STORAGE_PREFIX+'dailyMaxStreak',String(maxStreak));
 return{streak,maxStreak,newlyUnlocked:oldMax<7&&maxStreak>=7?'Galaxy':oldMax<3&&maxStreak>=3?'Sunny':null};
}
export function currentStreak(todayKey:string):number {const last=globalThis.localStorage?.getItem(STORAGE_PREFIX+'dailyLast');return last===todayKey||last===addDays(todayKey,-1)?readNumber(STORAGE_PREFIX+'dailyStreak'):0;}
export function playedToday(todayKey:string):boolean{return globalThis.localStorage?.getItem(STORAGE_PREFIX+'dailyLast')===todayKey;}
