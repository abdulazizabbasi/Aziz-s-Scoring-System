import {useEffect,useState} from 'react';import {Copy,Plus,Trash2} from 'lucide-react';import {AnimatePresence,motion} from 'framer-motion'
import {Match,result,Series,uid,winner} from './engine';import {useStore} from './store';import {fetchByToken} from './supabase'
import {Charts,Leaderboard,Motm,Scorecard,Scoreboard,SeriesDash} from './Analytics';import {Console,Tap} from './Console'
const Shell=({children}:{children:React.ReactNode})=><div className="bg-stadium"><div className="min-h-screen bg-slate-900/55"><div className="mx-auto max-w-3xl p-3 space-y-3 pb-16"><h1 className="text-xl font-extrabold bg-gradient-to-r from-emerald-400 via-sky-400 to-amber-400 bg-clip-text text-transparent">🏏 Aziz's Cricket Cloud</h1>{children}</div></div></div>

function Viewer({kind,token}:{kind:'match'|'series';token:string}){
  const local=useStore.getState(),[data,setData]=useState<any>(null),[err,setErr]=useState(false)
  useEffect(()=>{let live=true;const load=async()=>{const r=await fetchByToken(kind,token)
      if(!live)return
      if(r){setData(r);return}
      // Offline/demo fallback: only the single record matching this token is exposed.
      if(kind==='match'){const m=local.matches.find(x=>x.token===token);m?setData(m):setErr(true)}
      else{const s=local.series.find(x=>x.token===token);s?setData({series:s,matches:local.matches.filter(m=>m.seriesId===s.id)}):setErr(true)}}
    load();const t=setInterval(load,4000);return()=>{live=false;clearInterval(t)}},[kind,token])
  if(err)return <Shell><p className="glass p-4">This link is invalid or has been revoked.</p></Shell>
  if(!data)return <Shell><p className="glass p-4">Loading…</p></Shell>
  return <Shell><p className="text-xs text-slate-400">Read-only view</p>{kind==='match'?<MatchView m={data as Match}/>:<SeriesDash series={data.series} matches={data.matches}/>}</Shell>
}
const MatchView=({m}:{m:Match})=>{const [t,setT]=useState<'card'|'charts'|'stats'>('card')
  return <div className="space-y-3"><Scoreboard m={m}/>
    <div className="flex gap-2">{([['card','Scorecard'],['charts','Charts'],['stats','Stats']] as const).map(([k,l])=><button key={k} className={`flex-1 glass py-2 text-sm transition ${t===k?'!bg-gradient-to-r from-emerald-500 to-amber-500 text-slate-900 font-bold':''}`} onClick={()=>setT(k)}>{l}</button>)}</div>
    <AnimatePresence mode="wait"><motion.div key={t} className="space-y-3" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:.1}}>
      {t==='card'&&<Scorecard m={m}/>}{t==='charts'&&<Charts m={m}/>}{t==='stats'&&(m.status==='done'?<Motm m={m}/>:<Leaderboard ms={[m]}/>)}</motion.div></AnimatePresence></div>}

function Gate(){
  const set=useStore(s=>s.set),[pin,setPin]=useState(''),[err,setErr]=useState(0)
  const press=(d:string)=>{const v=(pin+d).slice(0,4);setPin(v)
    if(v.length===4){if(v===((import.meta.env.VITE_UMPIRE_PIN as string|undefined)??'1234'))set({unlocked:true});else{setErr(x=>x+1);setTimeout(()=>setPin(''),250)}}}
  return <Shell><motion.div key={err} animate={err?{x:[0,-14,14,-10,10,-5,0]}:{}} transition={{duration:.25}} className="glass p-5 space-y-4 mt-12 text-center">
    <h1 className="text-2xl font-extrabold">Aziz's Cricket Cloud</h1><p className="text-sm text-slate-400">Enter Umpire PIN to Unlock Scoring Console</p>
    <div className="flex justify-center gap-3">{[0,1,2,3].map(i=><span key={i} className={`h-3.5 w-3.5 rounded-full ${i<pin.length?(err&&pin.length===4?'bg-red-500':'bg-emerald-400'):'bg-slate-700'}`}/>)}</div>
    {err>0&&<p role="alert" className="text-red-400 text-sm">Incorrect PIN. Try again.</p>}
    <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">{['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k,i)=>k?<Tap key={i} className="glass py-4 text-2xl num font-bold" onClick={()=>k==='⌫'?setPin(pin.slice(0,-1)):press(k)}>{k}</Tap>:<span key={i}/>)}</div>
  </motion.div></Shell>
}

const names=(p:string,pre:string)=>p.split(/[,\n]/).map(x=>x.trim()).filter(Boolean).length?p.split(/[,\n]/).map(x=>x.trim()).filter(Boolean):Array.from({length:11},(_,i)=>`${pre}${i+1}`)
function Setup({seriesList}:{seriesList:Series[]}){
  const {addMatch}=useStore(),[f,setF]=useState({title:'Match 1',overs:'10',a:'Team A',b:'Team B',pa:'',pb:'',o1:'',o2:'',ob:'',series:''})
  const u=(k:string)=>(e:any)=>setF({...f,[k]:e.target.value}),A=names(f.pa,'A'),Bp=names(f.pb,'B')
  const start=()=>{const o1=A.includes(f.o1)?f.o1:A[0],o2=A.includes(f.o2)&&f.o2!==o1?f.o2:(A.find(x=>x!==o1)??o1)
    addMatch({id:uid(),token:uid(),seriesId:f.series||undefined,title:f.title,overs:Math.max(1,+f.overs||1),status:'live',opening:Bp.includes(f.ob)?f.ob:Bp[Bp.length-1],
      teams:[{name:f.a,players:[o1,o2,...A.filter(x=>x!==o1&&x!==o2)]},{name:f.b,players:Bp}],innings:[{bat:0,balls:[]}]})}
  const sel=(k:'o1'|'o2'|'ob',l:string,list:string[])=><select className="inp" value={f[k]} onChange={u(k)}><option value="">{l} (auto)</option>{list.map(p=><option key={p}>{p}</option>)}</select>
  return <div className="glass p-4 space-y-2"><p className="font-bold text-amber-300">New match</p>
    <input className="inp" value={f.title} onChange={u('title')}/><input className="inp num" type="number" min={1} value={f.overs} onChange={u('overs')}/>
    <div className="grid grid-cols-2 gap-2"><input className="inp" value={f.a} onChange={u('a')}/><input className="inp" value={f.b} onChange={u('b')}/>
      <textarea className="inp" rows={4} placeholder="Players, comma or line separated (blank = A1…A11)" value={f.pa} onChange={u('pa')}/><textarea className="inp" rows={4} placeholder="Players (blank = B1…B11)" value={f.pb} onChange={u('pb')}/></div>
    <div className="grid grid-cols-3 gap-2 text-xs">{sel('o1','Striker',A)}{sel('o2','Non-striker',A)}{sel('ob','Opening bowler',Bp)}</div>
    <select className="inp" value={f.series} onChange={u('series')}><option value="">No series</option>{seriesList.filter(s=>!s.concluded).map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select>
    <Tap className="w-full rounded-xl bg-gradient-to-r from-emerald-400 to-sky-500 text-slate-900 font-bold py-3" onClick={start}><Plus className="inline" size={16}/> Start match</Tap></div>
}
const link=(k:'match'|'series',t:string)=>`${location.origin}/${k}/view?token=${t}`
const Share=({k,t}:{k:'match'|'series';t:string})=><button className="text-xs text-emerald-400 flex items-center gap-1" onClick={()=>{navigator.clipboard.writeText(link(k,t));alert('Viewer link copied')}}><Copy size={12}/>Share link</button>

function Row({t,s,w,onOpen,onDel}:{t:string;s:string;w?:string;onOpen:()=>void;onDel:()=>void}){
  return <div className="glass p-2 flex items-center gap-2 text-sm"><button className="flex-1 text-left truncate" onClick={onOpen}><span className="font-semibold">{t}</span> <span className="text-slate-400 text-xs">{s}</span></button>
    <button aria-label={`Delete ${t}`} className="p-2 text-red-400 hover:text-red-300" onClick={()=>confirm(`Delete "${t}"? ${w??''} This cannot be undone.`)&&onDel()}><Trash2 size={16}/></button></div>
}
function Umpire(){
  const {matches,series,activeId,set,addSeries,delMatch,delSeries,updSeries}=useStore(),[tab,setTab]=useState<'live'|'series'>('live'),[sn,setSn]=useState(''),[bo,setBo]=useState('3'),[sv,setSv]=useState('')
  const m=matches.find(x=>x.id===activeId)
  const tally=(s:Series)=>{const w=[0,0];matches.filter(x=>x.seriesId===s.id).forEach(x=>{const k=winner(x);if(k>=0)w[k]++});return `${w[0]}–${w[1]}`}
  return <Shell><div className="flex gap-2"><button className={`flex-1 glass py-2 ${tab==='live'&&'text-amber-400'}`} onClick={()=>setTab('live')}>Scoring</button><button className={`flex-1 glass py-2 ${tab==='series'&&'text-amber-400'}`} onClick={()=>setTab('series')}>Series</button>
      <button className="glass px-3 text-xs" onClick={()=>set({unlocked:false})}>Lock</button></div>
    <AnimatePresence mode="wait"><motion.div key={tab} className="space-y-3" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} transition={{duration:.1}}>
    {tab==='live'?<>
      {m?<><Share k="match" t={m.token}/><Console key={m.id+m.innings.length} m={m}/><Motm m={m}/><Charts m={m}/><Scorecard m={m}/></>:<p className="glass p-4 text-sm text-slate-300">Select a match from history or start a new one below.</p>}
      <Setup seriesList={series}/>
      <details className="glass p-3"><summary className="cursor-pointer">Match history ({matches.length})</summary><div className="mt-2 space-y-2">
        {matches.map(x=><Row key={x.id} t={x.title} s={`${x.teams[0].name} v ${x.teams[1].name} · ${x.status==='done'?result(x):'Live'}`} onOpen={()=>{set({activeId:x.id});window.scrollTo({top:0,behavior:'smooth'})}} onDel={()=>delMatch(x.id)}/>)}
        {!matches.length&&<p className="text-sm text-slate-500">No matches yet</p>}</div></details></>
    :<>
      <div className="glass p-4 space-y-2"><p className="font-bold text-amber-300">New series</p><input className="inp" placeholder="Series name" value={sn} onChange={e=>setSn(e.target.value)}/>
        <select className="inp" value={bo} onChange={e=>setBo(e.target.value)}>{Array.from({length:11},(_,i)=>i+1).map(n=><option key={n} value={n}>Best of {n}</option>)}</select>
        <button className="w-full rounded-xl bg-gradient-to-r from-emerald-400 to-sky-500 text-slate-900 font-bold py-3" onClick={()=>sn&&(addSeries({id:uid(),token:uid(),name:sn,bestOf:+bo}),setSn(''))}>Create series</button></div>
      {series.map(s=><Row key={s.id} t={s.name} s={`Best of ${s.bestOf} · ${tally(s)}${s.concluded?' · concluded':''}`} w="Its matches will be deleted too." onOpen={()=>setSv(s.id)} onDel={()=>{delSeries(s.id);if(sv===s.id)setSv('')}}/>)}
      {series.filter(s=>s.id===sv).map(s=><div key={s.id} className="space-y-2"><Share k="series" t={s.token}/><SeriesDash series={s} matches={matches.filter(x=>x.seriesId===s.id)} onConclude={()=>confirm('Conclude this series and lock the final report?')&&updSeries(s.id,x=>({...x,concluded:true}))}/></div>)}</>}
    </motion.div></AnimatePresence></Shell>
}
export default function App(){
  const q=new URLSearchParams(location.search),token=q.get('token'),unlocked=useStore(s=>s.unlocked)
  // Token present => viewer-only app tree. Umpire code, nav and store actions are never rendered.
  if(token)return <Viewer kind={location.pathname.startsWith('/series')?'series':'match'} token={token}/>
  return unlocked?<Umpire/>:<Gate/>
}