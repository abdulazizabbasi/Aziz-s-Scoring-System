import {useEffect,useRef,useState} from 'react';import {motion} from 'framer-motion'
import {Bar,BarChart,CartesianGrid,Cell,LabelList,Legend,Line,LineChart,Pie,PieChart,ResponsiveContainer,Tooltip,XAxis,YAxis} from 'recharts'
import {Trophy} from 'lucide-react'
import {awards,derive,div,fmtOvers,Match,P,playerStats,result,score,Series,winner} from './engine'
const G='#10B981',A='#F59E0B',PAL=[G,A,'#38BDF8','#F472B6','#A78BFA','#FB7185','#34D399','#FBBF24']

export function Scoreboard({m}:{m:Match}){
  const i=m.innings.length-1,d=derive(m,i),bat=m.teams[m.innings[i].bat].name
  const pv=useRef(d.wk),[pulse,setPulse]=useState(0)
  useEffect(()=>{if(d.wk>pv.current)setPulse(x=>x+1);pv.current=d.wk},[d.wk])
  const target=i===1?score(m,0)+1:0,left=m.overs*6-d.legal,need=target-d.total
  return <div className="glass p-4 relative overflow-hidden">
    {pulse>0&&<motion.div key={pulse} className="absolute inset-0 bg-red-500/40 pointer-events-none" initial={{opacity:.9,scale:.5}} animate={{opacity:0,scale:1.8}} transition={{duration:.5}}/>}
    <div className="flex items-center justify-between text-sm"><span className="text-slate-300">{m.title}</span>
      {m.status==='live'?<span className="text-emerald-400 animate-pulse">● LIVE</span>:<span className="text-amber-400">FINAL</span>}</div>
    <div className="mt-1 flex items-end gap-3"><span className="font-semibold">{bat}</span>
      <span className="num text-5xl font-extrabold bg-gradient-to-r from-emerald-300 via-sky-300 to-amber-300 bg-clip-text text-transparent">{d.total}/{d.wk}</span><span className="num text-slate-400 mb-1">({fmtOvers(d.legal)}/{m.overs})</span></div>
    <div className="num mt-2 flex flex-wrap gap-x-4 text-sm text-slate-300">
      <span>CRR {d.crr.toFixed(2)}</span>
      {target>0&&m.status==='live'&&<span className="text-amber-400">RRR {left>0?div(Math.max(0,need)*6,left).toFixed(2):'–'} · need {Math.max(0,need)} off {left}</span>}
      {i===0&&<span>Proj {d.projected}</span>}</div>
    {m.status==='done'&&<p className="mt-2 text-amber-400 font-semibold">{result(m)}</p>}
    <div className="mt-3 flex gap-1.5 overflow-x-auto">{d.cur.length?d.cur.map((b,k)=><span key={k} className={`num min-w-9 text-center rounded-full px-2 py-1 text-sm ${b[0]==='W'?'bg-red-500':b==='4'||b==='6'?'bg-emerald-500 text-slate-900':'bg-slate-700'}`}>{b}</span>):<span className="text-xs text-slate-500">New over</span>}
      {d.freeHit&&<span className="ml-2 rounded-full bg-amber-500 text-slate-900 px-2 py-1 text-xs font-bold">FREE HIT</span>}</div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
      {([[d.striker?d.striker+'*':'','text-emerald-300',d.bt[d.striker]],[d.nonStriker,'text-sky-300',d.bt[d.nonStriker]]] as const).map(([n,c,v],k)=><div key={k} className="rounded-xl bg-slate-800/70 p-2 border border-white/5"><p className={`truncate ${c}`}>{n||'—'}</p><p className="num text-base font-bold">{v?.r??0}<span className="text-slate-400 text-xs"> ({v?.b??0})</span></p></div>)}
      <div className="rounded-xl bg-slate-800/70 p-2 border border-white/5"><p className="truncate text-amber-300">{d.curBowler||'—'}</p><p className="num text-base font-bold">{d.bw[d.curBowler]?`${d.bw[d.curBowler].w}-${d.bw[d.curBowler].r}`:'0-0'}<span className="text-slate-400 text-xs"> ({fmtOvers(d.bw[d.curBowler]?.l??0)})</span></p></div></div></div>
}

export function Charts({m}:{m:Match}){
  const cum=(i:number)=>{if(!m.innings[i])return[];let c=0;return derive(m,i).overs.map(o=>c+=o.runs)}
  const a=cum(0),b=cum(1),n=Math.max(a.length,b.length)
  const worm=Array.from({length:n+1},(_,k)=>({over:k,[m.teams[0].name]:k?a[k-1]:0,...(m.innings[1]?{[m.teams[1].name]:k?b[k-1]:0}:{})}))
  const k=m.innings.length-1,d=derive(m,k)
  const man=d.overs.map((o,j)=>({over:j+1,runs:o.runs,w:'W'.repeat(o.wk)}))
  const parts=d.parts.map(p=>({...p,label:`${p.a} & ${p.b}`}))
  const ord=(n:number)=>{const s=['th','st','nd','rd'],v=n%100;return n+(s[(v-20)%10]||s[v]||s[0])}
  const box='glass p-3 h-60'
  return <div className="grid gap-3 md:grid-cols-2">
    <div className={box}><p className="text-xs text-slate-400">Worm</p><ResponsiveContainer><LineChart data={worm}><CartesianGrid stroke="#334155"/><XAxis dataKey="over"/><YAxis/><Tooltip/><Legend/>
      <Line dataKey={m.teams[0].name} stroke={G} dot={false}/>{m.innings[1]&&<Line dataKey={m.teams[1].name} stroke={A} dot={false}/>}</LineChart></ResponsiveContainer></div>
    <div className={box}><p className="text-xs text-slate-400">Manhattan · {m.teams[m.innings[k].bat].name}</p><ResponsiveContainer><BarChart data={man}><CartesianGrid stroke="#334155"/><XAxis dataKey="over"/><YAxis/><Tooltip/>
      <Bar dataKey="runs" fill={G}><LabelList dataKey="w" position="top" fill="#F87171" fontWeight={700}/></Bar></BarChart></ResponsiveContainer></div>
    <div className="glass p-3 md:col-span-2"><p className="text-xs text-slate-400">Partnerships · {m.teams[m.innings[k].bat].name} <span className="ml-2"><i className="inline-block w-2 h-2 rounded-full" style={{background:G}}/> 1st batter <i className="inline-block w-2 h-2 rounded-full ml-1" style={{background:A}}/> 2nd batter <i className="inline-block w-2 h-2 rounded-full ml-1 bg-slate-500"/> extras</span></p>
      {parts.length?<div className="grid md:grid-cols-2 gap-3 items-center mt-2"><div className="h-56 relative"><ResponsiveContainer><PieChart><Pie data={parts} dataKey="runs" nameKey="label" innerRadius={52} outerRadius={88} paddingAngle={2} label={(e:any)=>e.runs}>{parts.map((_,j)=><Cell key={j} fill={PAL[j%PAL.length]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer>
        <div className="absolute inset-0 grid place-items-center pointer-events-none"><div className="text-center"><p className="num text-2xl font-bold">{d.total}</p><p className="text-xs text-slate-400">innings total</p></div></div></div>
        <div className="space-y-2 text-xs max-h-56 overflow-y-auto pr-1">{parts.map((p,j)=><div key={j}><div className="flex justify-between gap-2"><span className="truncate" style={{color:PAL[j%PAL.length]}}>{p.w===d.wk+1&&m.status==='live'?'Unbroken':ord(p.w)+' wkt'} · {p.a} &amp; {p.b}</span><span className="num shrink-0">{p.runs} ({p.balls}b) · RR {div(p.runs*6,p.balls).toFixed(1)}</span></div>
          <div className="flex h-2 rounded overflow-hidden bg-slate-700 my-1"><div style={{width:`${div(p.ra*100,p.runs)}%`,background:G}}/><div style={{width:`${div(p.rb*100,p.runs)}%`,background:A}}/><div className="bg-slate-500" style={{width:`${div(p.ex*100,p.runs)}%`}}/></div>
          <p className="num text-slate-400">{p.a} {p.ra} · {p.b} {p.rb} · extras {p.ex}</p></div>)}</div></div>:<p className="text-slate-500 text-sm mt-8 text-center">No partnership runs yet</p>}</div></div>
}

export function Scorecard({m}:{m:Match}){
  return <div className="space-y-3">{m.innings.map((inn,i)=>{const d=derive(m,i),t=m.teams[inn.bat]
    return <div key={i} className="glass p-3 overflow-x-auto text-sm">
      <p className="font-semibold mb-2">{t.name} <span className="num text-amber-400">{d.total}/{d.wk}</span> ({fmtOvers(d.legal)})</p>
      <table className="w-full num"><thead className="text-slate-400 text-left"><tr><th className="font-normal">Batter</th><th>R</th><th>B</th><th>4s</th><th>6s</th><th>SR</th></tr></thead><tbody>
        {Object.entries(d.bt).map(([k,v])=><tr key={k}><td className="font-sans">{k} <span className="text-xs text-slate-400">{v.out||'not out'}</span></td><td>{v.r}</td><td>{v.b}</td><td>{v.f}</td><td>{v.s}</td><td>{div(v.r*100,v.b).toFixed(1)}</td></tr>)}</tbody></table>
      <table className="w-full num mt-3"><thead className="text-slate-400 text-left"><tr><th className="font-normal">Bowler</th><th>O</th><th>M</th><th>R</th><th>W</th><th>Econ</th><th>Avg</th></tr></thead><tbody>
        {Object.entries(d.bw).map(([k,v])=><tr key={k}><td className="font-sans">{k}</td><td>{fmtOvers(v.l)}</td><td>{v.m}</td><td>{v.r}</td><td>{v.w}</td><td>{div(v.r*6,v.l).toFixed(2)}</td><td>{v.w?(v.r/v.w).toFixed(1):'–'}</td></tr>)}</tbody></table>
      {Object.keys(d.fl).length>0&&<table className="w-full num mt-3"><thead className="text-slate-400 text-left"><tr><th className="font-normal">Fielder</th><th>Ct</th><th>St</th><th>RO</th><th>DH</th></tr></thead><tbody>{Object.entries(d.fl).map(([k,v])=><tr key={k}><td className="font-sans">{k}</td><td>{v.c}</td><td>{v.st}</td><td>{v.ro}</td><td>{v.dh}</td></tr>)}</tbody></table>}</div>})}</div>
}

export function Motm({m}:{m:Match}){
  if(m.status!=='done')return null
  const p=[...playerStats([m])].sort((x,y)=>y.pts-x.pts)[0];if(!p)return null
  return <div className="space-y-3"><div className="glass p-4 border-amber-400/50 flex items-center gap-3"><Trophy className="text-amber-400" size={36}/>
    <div><p className="text-xs text-slate-400">Man of the Match</p><p className="font-bold text-lg">{p.name}</p><p className="num text-sm text-slate-300">{p.r} runs · {p.w} wkts · {p.fld} fielding · {p.pts.toFixed(0)} pts</p></div></div><Leaderboard ms={[m]}/></div>
}

const Aw=({t,p,s}:{t:string;p?:P;s:string})=><div className="glass p-3"><p className="text-xs text-slate-400">{t}</p><p className="font-bold">{p?.name??'–'}</p><p className="num text-xs text-amber-400">{p?s:''}</p></div>
export function SeriesDash({series,matches,onConclude}:{series:Series;matches:Match[];onConclude?:()=>void}){
  const w=[0,0],tot=[0,0],done=matches.filter(m=>m.status==='done').length
  matches.forEach(m=>{const x=winner(m);if(x>=0)w[x]++;m.innings.forEach((inn,i)=>{tot[inn.bat]+=derive(m,i).total})})
  const a=awards(matches),need=Math.floor(series.bestOf/2)+1,lead=w[0]>w[1]?0:w[1]>w[0]?1:-1,fin=!!series.concluded
  const complete=done>=series.bestOf||w[0]>=need||w[1]>=need,nm=matches[0]?.teams.map(t=>t.name)??['A','B']
  return <div className="space-y-3"><div className="glass p-4"><p className="font-bold text-lg">{series.name} <span className="text-xs text-slate-400">Best of {series.bestOf} · {done} played</span></p>
    <p className="num text-3xl font-extrabold mt-1 bg-gradient-to-r from-emerald-300 to-amber-300 bg-clip-text text-transparent">{nm[0]} {w[0]} – {w[1]} {nm[1]}</p>
    <p className="num text-xs text-slate-400 mt-1">Total runs: {nm[0]} {tot[0]} · {nm[1]} {tot[1]}</p></div>
    {fin&&<motion.div initial={{scale:.7,opacity:0}} animate={{scale:1,opacity:1}} transition={{type:'spring',stiffness:500,damping:18}} className="glass p-4 border-amber-400/60 flex items-center gap-3 bg-gradient-to-r from-amber-500/20 to-emerald-500/20"><Trophy className="text-amber-400" size={44}/><div><p className="text-xs text-slate-300">Series concluded</p><p className="text-2xl font-extrabold text-amber-400">{lead>=0?`${nm[lead]} — Series Champions`:'Series drawn'}</p></div></motion.div>}
    {!fin&&complete&&onConclude&&<motion.button whileTap={{scale:.95}} className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 font-extrabold py-3" onClick={onConclude}>Conclude series &amp; show final report</motion.button>}
    <div className="glass p-3 text-sm space-y-1"><p className="font-semibold">Results</p>{matches.map(m=><p key={m.id} className="num flex justify-between gap-2"><span>{m.title}</span><span className="text-amber-400 text-right">{m.status==='done'?result(m):'In progress'}</span></p>)}{!matches.length&&<p className="text-slate-500">No matches yet</p>}</div>
    <div className="grid grid-cols-2 gap-3">
      <Aw t="Player of the Series" p={a.mvp} s={`${a.mvp?.pts.toFixed(0)} pts`}/>
      <Aw t="Best Batter" p={a.batter} s={`${a.batter?.r} runs · avg ${a.batter?.avg.toFixed(1)}`}/>
      <Aw t="Best Bowler" p={a.bowler} s={`${a.bowler?.w} wkts · econ ${a.bowler?.econ.toFixed(2)}`}/>
      <Aw t="Best Fielder" p={a.fielder} s={`${a.fielder?.c}c ${a.fielder?.ro}ro ${a.fielder?.st}st`}/></div>
    <Leaderboard ms={matches}/>
    {matches.map(m=><details key={m.id} className="glass p-3"><summary className="cursor-pointer">{m.title} <span className="text-amber-400 text-sm">{result(m)}</span></summary><div className="mt-3 space-y-3"><Scoreboard m={m}/><Scorecard m={m}/></div></details>)}</div>
}

export function Leaderboard({ms}:{ms:Match[]}){
  const ps=[...playerStats(ms)].sort((a,b)=>b.pts-a.pts)
  return <div className="glass p-3 overflow-x-auto text-sm"><p className="font-semibold mb-2">Leaderboard</p><table className="w-full num"><thead className="text-slate-400 text-left"><tr><th className="font-normal">Player</th><th>Runs</th><th>Avg</th><th>Wkts</th><th>Econ</th><th>Ct/St/RO/DH</th><th>Pts</th></tr></thead><tbody>
    {ps.map(p=><tr key={p.name}><td className="font-sans">{p.name}</td><td>{p.r}</td><td>{p.avg.toFixed(1)}</td><td>{p.w}</td><td>{p.bl?p.econ.toFixed(2):'–'}</td><td>{p.c}/{p.st}/{p.ro}/{p.dh}</td><td className="text-amber-400">{p.pts.toFixed(0)}</td></tr>)}</tbody></table></div>
}
