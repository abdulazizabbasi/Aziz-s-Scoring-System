import {create} from 'zustand';import {persist} from 'zustand/middleware'
import {Ball,Match,Series} from './engine';import {dropMatch,dropSeries,pushMatch,pushSeries} from './supabase'
interface St{matches:Match[];series:Series[];unlocked:boolean;activeId:string;
  set:(p:Partial<St>)=>void;addMatch:(m:Match)=>void;addSeries:(s:Series)=>void
  upd:(id:string,f:(m:Match)=>Match)=>void;record:(id:string,b:Ball)=>void;undo:(id:string)=>void;nextInnings:(id:string)=>void;finish:(id:string)=>void;delMatch:(id:string)=>void;delSeries:(id:string)=>void;updSeries:(id:string,f:(s:Series)=>Series)=>void}
export const useStore=create<St>()(persist((set,get)=>({
  matches:[],series:[],unlocked:false,activeId:'',
  set:p=>set(p),
  addMatch:m=>{set(s=>({matches:[...s.matches,m],activeId:m.id}));pushMatch(m)},
  addSeries:s=>{set(x=>({series:[...x.series,s]}));pushSeries(s)},
  upd:(id,f)=>{set(s=>({matches:s.matches.map(m=>m.id===id?f(m):m)}));const m=get().matches.find(x=>x.id===id);m&&pushMatch(m)},
  record:(id,b)=>get().upd(id,m=>{const k=m.innings.length-1;return{...m,innings:m.innings.map((x,j)=>j===k?{...x,balls:[...x.balls,b]}:x)}}),
  undo:id=>get().upd(id,m=>{const k=m.innings.length-1,cur=m.innings[k]
    if(!cur.balls.length)return k>0?{...m,innings:m.innings.slice(0,-1),status:'live'}:m
    return{...m,status:'live',innings:m.innings.map((x,j)=>j===k?{...x,balls:x.balls.slice(0,-1)}:x)}}),
  nextInnings:id=>get().upd(id,m=>({...m,innings:[...m.innings,{bat:1,balls:[]}]})),
  finish:id=>get().upd(id,m=>({...m,status:'done'})),
  delMatch:id=>{set(s=>({matches:s.matches.filter(m=>m.id!==id),activeId:s.activeId===id?'':s.activeId}));dropMatch(id)},
  delSeries:id=>{set(s=>({series:s.series.filter(x=>x.id!==id),matches:s.matches.filter(m=>m.seriesId!==id)}));dropSeries(id)},
  updSeries:(id,f)=>{set(s=>({series:s.series.map(x=>x.id===id?f(x):x)}));const x=get().series.find(y=>y.id===id);x&&pushSeries(x)}
}),{name:'cricket-cloud',partialize:s=>({matches:s.matches,series:s.series,activeId:s.activeId})}))
