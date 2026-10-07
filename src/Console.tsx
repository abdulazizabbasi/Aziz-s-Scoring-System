import {useState} from 'react';import confetti from 'canvas-confetti';import {AnimatePresence,motion} from 'framer-motion';import {Undo2,ArrowLeftRight} from 'lucide-react'
import {chaseOver,derive,fmtOvers,Extra,Kind,Match,Wicket} from './engine';import {useStore} from './store';import {Scoreboard} from './Analytics'
const KINDS:{k:Kind;l:string}[]=[{k:'bowled',l:'Bowled'},{k:'caught',l:'Caught'},{k:'runout',l:'Run Out'},{k:'stumped',l:'Stumped'}]
export const Tap=(p:React.ComponentProps<typeof motion.button>)=><motion.button whileTap={{scale:.9}} transition={{type:'spring',stiffness:800,damping:22}} {...p}/>
const Drawer=({open,children}:{open:boolean;children:React.ReactNode})=><AnimatePresence>{open&&<motion.div className="fixed inset-0 z-40 bg-black/70 grid items-end md:place-items-center" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
  <motion.div className="glass w-full max-w-md mx-auto p-4 space-y-3 rounded-b-none md:rounded-2xl" initial={{y:240}} animate={{y:0}} exit={{y:240}} transition={{type:'spring',damping:30,stiffness:560}}>{children}</motion.div></motion.div>}</AnimatePresence>

const LBL:Record<string,[string,string]>={W:['OUT!','text-red-400'],'1':['1 RUN','text-sky-300'],'2':['2 RUNS','text-teal-300'],'3':['3 RUNS','text-violet-300'],'4':['FOUR!','text-emerald-300'],'6':['SIX!','text-amber-300'],'0':['DOT BALL','text-slate-300'],Wd:['WIDE','text-yellow-300'],Nb:['NO BALL','text-orange-400'],B:['EXTRAS','text-pink-300'],U:['UNDO','text-slate-200']}
const ball='absolute w-6 h-6 rounded-full bg-gradient-to-br from-red-400 to-red-700 shadow-lg'
function Fx({fx}:{fx:{k:string;id:number}|null}){
  const k=fx?.k??'',[t,c]=LBL[k]??['','']
  return <AnimatePresence>{fx&&<motion.div key={fx.id} className="fixed inset-0 z-[60] pointer-events-none overflow-hidden" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.08}}>
    {k==='W'&&<><motion.div className="absolute inset-0 bg-red-600/30" animate={{opacity:[0,1,0]}} transition={{delay:.2,duration:.45}}/>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-3 h-32">
        {[0,1,2].map(i=><motion.div key={i} className="w-3 h-28 rounded bg-amber-200 origin-bottom" animate={{rotate:[0,0,(i-1)*35+12],x:[0,0,(i-1)*34]}} transition={{times:[0,.3,1],duration:.6}}/>)}
        {[0,1].map(i=><motion.div key={i} className="absolute -top-2 h-1.5 w-7 rounded bg-amber-500" style={{left:i*30}} animate={{y:[0,0,-130-i*30],x:[0,0,i?70:-70],rotate:[0,0,i?420:-420]}} transition={{times:[0,.3,1],duration:.6}}/>)}
        <motion.div className={ball} style={{left:24,top:40}} initial={{x:'-70vw',y:50}} animate={{x:0,y:0,opacity:[1,1,0]}} transition={{duration:.22,ease:'easeIn'}}/></div></>}
    {['1','2','3'].includes(k)&&Array.from({length:+k}).map((_,i)=><motion.div key={i} className="absolute top-1/3 text-6xl" initial={{x:i%2?'110vw':'-20vw'}} animate={{x:i%2?'-20vw':'110vw',rotate:i%2?-25:25}} transition={{duration:.4,delay:i*.22,ease:'easeIn'}}>🏏</motion.div>)}
    {k==='4'&&<motion.div className={ball+' top-2/3'} initial={{x:'-5vw'}} animate={{x:'105vw'}} transition={{duration:.4,ease:'easeOut'}}/>}
    {k==='6'&&<motion.div className={ball+' top-2/3'} initial={{x:'-5vw',y:0}} animate={{x:'105vw',y:['0vh','-48vh','-20vh']}} transition={{duration:.6,ease:'easeOut'}}/>}
    {t&&<motion.p className={'absolute inset-x-0 top-[20%] text-center text-6xl font-black drop-shadow-[0_4px_20px_rgba(0,0,0,.9)] '+c} initial={{scale:.3,opacity:0}} animate={{scale:1,opacity:1}} transition={{type:'spring',stiffness:700,damping:20}}>{t}</motion.p>}
  </motion.div>}</AnimatePresence>
}
const RC:Record<number,string>={0:'from-slate-500 to-slate-700',1:'from-sky-500 to-blue-600',2:'from-teal-500 to-cyan-600',3:'from-violet-500 to-fuchsia-600',4:'from-emerald-400 to-green-600',6:'from-amber-400 to-orange-600'}
export function Console({m}:{m:Match}){
  const {record,undo,nextInnings,finish}=useStore()
  const idx=m.innings.length-1,d=derive(m,idx),bowl=m.teams[1-m.innings[idx].bat].players
  const [bowler,setB]=useState(idx===0?m.opening??'':''),[nbv,setNbv]=useState(''),[mode,setMode]=useState<Extra|''>(''),[wk,setWk]=useState(false),[fx,setFx]=useState<{k:string;id:number}|null>(null)
  const [kind,setKind]=useState<Kind>('caught'),[out,setOut]=useState<'striker'|'non'>('striker'),[fld,setFld]=useState(''),[wr,setWr]=useState(0),[direct,setDirect]=useState(false),[wb,setWb]=useState(''),[inc,setInc]=useState('')
  const ended=d.done||(idx===1&&chaseOver(m)),live=m.status==='live'&&!ended
  const needBowler=live&&(!bowler||(!!d.lastBowler&&d.lastBowler===bowler)),locked=!live||needBowler
  const fire=(k:string)=>{const id=Date.now();setFx({k,id});setTimeout(()=>setFx(f=>f?.id===id?null:f),1100)}
  const go=(runs:number,wicket?:Wicket,bw?:string)=>{
    record(m.id,{runs,extra:mode||undefined,wicket,bowler:bw||bowler})
    fire(wicket?'W':mode==='wd'?'Wd':mode==='nb'?'Nb':mode==='b'||mode==='lb'?'B':String(runs));setMode('')
    if((runs===4||runs===6)&&!wicket){const six=runs===6;confetti({particleCount:six?220:70,spread:six?110:70,startVelocity:six?55:40,origin:{y:.65},colors:['#10B981','#F59E0B','#38BDF8','#F472B6']});if(six)setTimeout(()=>confetti({particleCount:120,angle:60,spread:70,origin:{x:0,y:.7}}),120)}}
  const avail=m.teams[m.innings[idx].bat].players.filter(p=>!d.bt[p]),allowed=d.freeHit?KINDS.filter(x=>x.k==='runout'):KINDS,needF=kind==='caught'||kind==='stumped'||kind==='runout'
  const big='glass py-5 text-2xl num font-bold disabled:opacity-30',pill=(a:boolean)=>`rounded-xl px-3 py-2 text-sm font-semibold ${a?'bg-amber-500 text-slate-900':'bg-slate-800'}`
  const inp=(v:string,f:(s:string)=>void,ph:string,l:string)=><><input className="inp" list={l} placeholder={ph} value={v} onChange={e=>f(e.target.value)}/><datalist id={l}>{bowl.map(p=><option key={p} value={p}/>)}</datalist></>
  return <div className="space-y-3"><Scoreboard m={m}/>
    <div className="flex items-center justify-between text-sm"><span>Bowler: <b>{bowler||'—'}</b></span><Tap className={pill(false)} onClick={()=>{setNbv('');setB('')}}>Change</Tap></div>
    <div className="grid grid-cols-4 gap-2">{([['wd','Wd'],['nb','Nb'],['b','Bye'],['lb','Leg Bye']] as const).map(([k,l])=><Tap key={k} disabled={locked} className={pill(mode===k)+' py-3'} onClick={()=>setMode(mode===k?'':k)}>{l}</Tap>)}</div>
    {mode&&<p className="text-xs text-amber-400">{mode.toUpperCase()} selected — tap runs (0 = no extra runs)</p>}
    <div className="grid grid-cols-3 gap-2">{[0,1,2,3,4,6].map(r=><Tap key={r} disabled={locked} className={big+' bg-gradient-to-br text-white shadow-lg !border-0 '+RC[r]} onClick={()=>go(r)}>{r}</Tap>)}
      <Tap disabled={locked} className={big+' col-span-3 bg-gradient-to-r from-red-500 to-rose-700 text-white text-xl !border-0 shadow-lg'} onClick={()=>{setKind(d.freeHit?'runout':'caught');setWb(bowler);setFld('');setInc(avail[0]??'');setWk(true)}}>WICKET</Tap></div>
    <div className="grid grid-cols-2 gap-2">
      <Tap className={big+' !text-base !py-3 flex items-center justify-center gap-2'} onClick={()=>{undo(m.id);fire('U')}}><Undo2 size={18}/>Undo last ball</Tap>
      <Tap disabled={locked} className={big+' !text-base !py-3 flex items-center justify-center gap-2'} onClick={()=>record(m.id,{runs:0,extra:'swap',bowler})}><ArrowLeftRight size={18}/>Swap strike</Tap></div>
    {ended&&m.status==='live'&&(idx===0?<Tap className={big+' w-full text-base bg-emerald-600'} onClick={()=>nextInnings(m.id)}>Start 2nd innings</Tap>:<Tap className={big+' w-full text-base bg-amber-500 text-slate-900'} onClick={()=>finish(m.id)}>Finish match</Tap>)}
    <Drawer open={needBowler}><p className="font-bold">{d.lastBowler?'Over complete — incoming bowler':'Select opening bowler'}</p>
      {inp(nbv,setNbv,'Pick or type a name','bowlers')}
      <Tap disabled={!nbv.trim()||nbv.trim()===d.lastBowler} className="w-full rounded-xl bg-emerald-500 text-slate-900 font-bold py-3 disabled:opacity-40" onClick={()=>{setB(nbv.trim());setNbv('')}}>Confirm bowler</Tap>
      {nbv.trim()===d.lastBowler&&<p className="text-xs text-amber-400">The same bowler cannot bowl consecutive overs.</p>}</Drawer>
    <Drawer open={wk}><p className="font-bold">Wicket {d.freeHit&&<span className="text-amber-400 text-sm">Free hit: Run Out only</span>}</p>
      <div className="flex flex-wrap gap-2">{allowed.map(x=><Tap key={x.k} className={pill(kind===x.k)} onClick={()=>setKind(x.k)}>{x.l}</Tap>)}</div>
      {kind==='runout'&&<div className="flex gap-2"><Tap className={pill(out==='striker')} onClick={()=>setOut('striker')}>{d.striker||'Striker'}</Tap><Tap className={pill(out==='non')} onClick={()=>setOut('non')}>{d.nonStriker||'Non-striker'}</Tap></div>}
      <input className="inp" placeholder="Bowler" value={wb} onChange={e=>setWb(e.target.value)}/>
      {needF&&inp(fld,setFld,kind==='stumped'?'Wicketkeeper':'Fielder','fielders')}
      {kind==='runout'&&<div className="flex items-center gap-3 text-sm"><label>Runs completed <select className="inp !w-20" value={wr} onChange={e=>setWr(+e.target.value)}>{[0,1,2,3].map(r=><option key={r}>{r}</option>)}</select></label><label><input type="checkbox" checked={direct} onChange={e=>setDirect(e.target.checked)}/> Direct hit</label></div>}
      {avail.length>0&&<label className="text-sm block">Incoming batter<select className="inp" value={inc} onChange={e=>setInc(e.target.value)}>{avail.map(p=><option key={p}>{p}</option>)}</select></label>}
      <div className="flex gap-2"><Tap className={pill(false)+' flex-1'} onClick={()=>setWk(false)}>Cancel</Tap>
        <Tap disabled={(needF&&!fld.trim())||!wb.trim()} className="flex-1 rounded-xl bg-red-600 py-2 font-bold disabled:opacity-40" onClick={()=>{go(kind==='runout'?wr:0,{kind,out:kind==='runout'?out:'striker',fielder:needF?fld.trim():undefined,direct:kind==='runout'&&direct,incoming:inc||undefined},wb.trim());setWk(false)}}>Confirm wicket</Tap></div></Drawer>
    <Fx fx={fx}/></div>
}
