import { STORAGE_PREFIX, readNumber, writeValue } from './Storage.ts';
import { LEVELS } from './Levels.ts';
function key(id:number){return `${STORAGE_PREFIX}level.${id}`;}
export function getStars(id:number):number{return readNumber(key(id));}
export function recordResult(id:number,stars:number):void {if(!Number.isInteger(id)||id<1||id>LEVELS.length)return;writeValue(key(id),String(Math.max(getStars(id),Math.max(0,Math.min(3,Math.floor(stars))))));recount();}
function recount():void {writeValue(STORAGE_PREFIX+'totalStars',String(totalStars()));}
export function totalStars():number{return LEVELS.reduce((n,l)=>n+getStars(l.id),0);}
export function highestUnlocked():number {let n=1;while(n<LEVELS.length&&getStars(n)>0)n++;return n;}
export function isUnlocked(id:number):boolean{return id===1||(id>1&&id<=LEVELS.length&&getStars(id-1)>0);}
export function nodeState(id:number):'cleared'|'next'|'locked'{return getStars(id)>0?'cleared':isUnlocked(id)?'next':'locked';}
