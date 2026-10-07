import {createClient} from '@supabase/supabase-js'
import type {Match,Series} from './engine'
const url=import.meta.env.VITE_SUPABASE_URL as string|undefined,key=import.meta.env.VITE_SUPABASE_ANON_KEY as string|undefined
export const sb=url&&key?createClient(url,key):null
export const pushMatch=async(m:Match)=>{if(!sb)return
  try{const e=(await sb.from('matches').upsert({id:m.id,share_token:m.token,series_id:m.seriesId??null,data:m})).error;if(e)throw e
    await sb.from('teams').upsert(m.teams.map((t,i)=>({id:`${m.id}-${i}`,match_id:m.id,name:t.name,idx:i})))
    await sb.from('players').upsert(m.teams.flatMap((t,i)=>t.players.map((p,k)=>({id:`${m.id}-${i}-${k}`,team_id:`${m.id}-${i}`,name:p,pos:k}))))
    for(const[i,inn]of m.innings.entries()){
      const rows=inn.balls.map((b,k)=>({match_id:m.id,innings:i,seq:k,bowler:b.bowler,runs:b.runs,extra:b.extra??null,wicket:b.wicket??null}))
      if(rows.length)await sb.from('balls').upsert(rows)
      await sb.from('balls').delete().eq('match_id',m.id).eq('innings',i).gte('seq',inn.balls.length)}
  }catch(err){console.warn('Cloud sync failed — data kept locally',err)}}
export const pushSeries=(s:Series)=>{sb?.from('series').upsert({id:s.id,share_token:s.token,name:s.name,best_of:s.bestOf,concluded:!!s.concluded}).then(r=>r.error&&console.warn('sync',r.error.message))}
// Viewers only ever call these two RPCs (token-scoped, security definer). They have no table access.
export async function fetchByToken(kind:'match'|'series',token:string){
  if(!sb)return null
  const {data}=await sb.rpc(kind==='match'?'get_match_by_token':'get_series_by_token',{t:token});return data
}
export const signIn=(email:string,password:string)=>sb?.auth.signInWithPassword({email,password})
export const dropMatch=(id:string)=>{sb?.from('matches').delete().eq('id',id).then(r=>r.error&&console.warn('delete',r.error.message))}
export const dropSeries=async(id:string)=>{if(!sb)return;await sb.from('matches').delete().eq('series_id',id);await sb.from('series').delete().eq('id',id)}
