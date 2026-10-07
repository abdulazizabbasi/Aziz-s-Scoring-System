export type Extra='wd'|'nb'|'b'|'lb'|'pen'|'dead'|'swap'
export type Kind='bowled'|'caught'|'lbw'|'stumped'|'runout'|'hitwicket'
export interface Wicket{kind:Kind;out:'striker'|'non';fielder?:string;direct?:boolean;incoming?:string}
export interface Ball{runs:number;extra?:Extra;wicket?:Wicket;bowler:string}
export interface Team{name:string;players:string[]}
export interface Innings{bat:0|1;balls:Ball[]}
export interface Match{id:string;token:string;seriesId?:string;title:string;overs:number;teams:[Team,Team];innings:Innings[];status:'live'|'done';opening?:string;review?:{res:string};reviews?:{o:string;res:string}[]}
export interface Series{id:string;token:string;name:string;bestOf:number;concluded?:boolean}
export const uid=()=>crypto.randomUUID()
export const div=(a:number,b:number)=>b?a/b:0
export const fmtOvers=(l:number)=>`${Math.floor(l/6)}.${l%6}`

export interface Part{a:string;b:string;runs:number;balls:number;ra:number;rb:number;ex:number}
const NP=(a:string,b:string):Part=>({a,b,runs:0,balls:0,ra:0,rb:0,ex:0})
export function derive(m:Match,i:number){
  const inn=m.innings[i],bat=[...m.teams[inn.bat].players]
  let s=0,n=1,next=2,total=0,wk=0,legal=0,freeHit=false,lb=''
  const bt:Record<string,{r:number;b:number;f:number;s:number;out:string}>={}
  const bw:Record<string,{l:number;r:number;w:number;m:number}>={}
  const fl:Record<string,{c:number;ro:number;st:number;dh:number}>={}
  const overs:{runs:number;wk:number;legal:number;bowler:string;br:number;balls:string[]}[]=[]
  const parts:Part[]=[]
  const B=(x:string)=>(bt[x]??={r:0,b:0,f:0,s:0,out:''})
  let p=NP(bat[0]??'',bat[1]??'')
  for(const b of inn.balls){
    if(b.extra==='swap'){[s,n]=[n,s];continue}
    if(b.extra==='dead')continue
    lb=b.bowler
    const ex=b.extra,isL=ex!=='wd'&&ex!=='nb',sn=bat[s]??''
    const tot=ex==='wd'||ex==='nb'?1+b.runs:b.runs
    const br=ex==='b'||ex==='lb'||ex==='pen'?0:tot
    const o=(overs[Math.floor(legal/6)]??={runs:0,wk:0,legal:0,bowler:b.bowler,br:0,balls:[]})
    const bo=(bw[b.bowler]??={l:0,r:0,w:0,m:0})
    bo.r+=br;if(isL){bo.l++;o.legal++;legal++}
    if(sn){const x=B(sn);if(ex!=='wd'&&ex!=='pen')x.b++;if(!ex||ex==='nb'){x.r+=b.runs;if(b.runs===4)x.f++;if(b.runs===6)x.s++}}
    total+=tot;o.runs+=tot;o.br+=br;p.runs+=tot;p.balls+=isL?1:0
    const cr=!ex||ex==='nb'?b.runs:0;if(sn===p.a)p.ra+=cr;else if(sn===p.b)p.rb+=cr;p.ex+=tot-cr
    const r=b.runs
    o.balls.push(b.wicket?'W'+(r?r:''):ex==='wd'?'Wd'+(r?'+'+r:''):ex==='nb'?'Nb'+(r?'+'+r:''):ex==='b'?'B'+r:ex==='lb'?'Lb'+r:ex==='pen'?'P'+r:String(r))
    if(b.wicket){
      const w=b.wicket,on=bat[w.out==='striker'?s:n]??'';wk++;o.wk++
      const txt={bowled:`b ${b.bowler}`,lbw:`lbw b ${b.bowler}`,hitwicket:`hit wkt b ${b.bowler}`,caught:`c ${w.fielder??'sub'} b ${b.bowler}`,stumped:`st ${w.fielder??'wk'} b ${b.bowler}`,runout:`run out (${w.fielder??'sub'})`}[w.kind]
      if(on)B(on).out=txt
      if(w.kind!=='runout')bo.w++
      if(w.fielder){const f=(fl[w.fielder]??={c:0,ro:0,st:0,dh:0});if(w.kind==='caught')f.c++;if(w.kind==='runout'){f.ro++;if(w.direct)f.dh++};if(w.kind==='stumped')f.st++}
      parts.push(p);let ni=w.incoming?bat.indexOf(w.incoming):-1
      if(w.incoming&&ni<0){bat.push(w.incoming);ni=bat.length-1}
      if(ni<0){ni=bat.findIndex((x,j)=>j!==s&&j!==n&&!bt[x]);if(ni<0)ni=bat.length}
      if(bat[ni])B(bat[ni]);if(w.out==='striker')s=ni;else n=ni
      p=NP(bat[s]??'',bat[n]??'')
    }
    if(ex!=='pen'&&r%2===1)[s,n]=[n,s]
    if(isL&&legal%6===0)[s,n]=[n,s]
    if(ex==='nb')freeHit=true;else if(isL)freeHit=false
  }
  parts.push(p)
  if(bat[s])B(bat[s]);if(bat[n])B(bat[n])
  for(const o of overs)if(o.legal>=6&&o.br===0)bw[o.bowler].m++
  const last=overs[overs.length-1],cur=last&&last.legal<6?last.balls:[]
  const done=wk>=Math.max(1,bat.length-1)||legal>=m.overs*6
  const crr=div(total*6,legal)
  return {total,wk,legal,done,freeHit,striker:bat[s]??'',nonStriker:bat[n]??'',bt,bw,fl,overs,parts:parts.map((x,k)=>({...x,w:k+1})).filter(x=>x.runs>0||x.balls>0),cur,crr,projected:Math.round(crr*m.overs),lastBowler:last?.legal>=6?last.bowler:'',curBowler:lb}
}
export const score=(m:Match,i:number)=>m.innings[i]?derive(m,i).total:0
export function chaseOver(m:Match){return m.innings.length>1&&derive(m,1).total>score(m,0)}
export function result(m:Match){
  if(m.innings.length<2)return ''
  const a=derive(m,0),b=derive(m,1)
  if(b.total>a.total)return `${m.teams[1].name} won by ${Math.max(0,m.teams[1].players.length-1-b.wk)} wkts`
  if(a.total>b.total)return `${m.teams[0].name} won by ${a.total-b.total} runs`
  return 'Match tied'
}
export const winner=(m:Match):0|1|-1=>{if(m.status!=='done'||m.innings.length<2)return -1;const a=score(m,0),b=score(m,1);return b>a?1:a>b?0:-1}

export interface P{name:string;r:number;b:number;out:number;w:number;bl:number;br:number;c:number;ro:number;st:number;pts:number;avg:number;econ:number;fld:number;dh:number}
export function playerStats(ms:Match[]){
  const t:Record<string,P>={}
  const g=(n:string)=>(t[n]??={name:n,r:0,b:0,out:0,w:0,bl:0,br:0,c:0,ro:0,st:0,pts:0,avg:0,econ:0,fld:0,dh:0})
  for(const m of ms)m.innings.forEach((_,i)=>{const d=derive(m,i)
    for(const[k,v]of Object.entries(d.bt)){const p=g(k);p.r+=v.r;p.b+=v.b;if(v.out)p.out++}
    for(const[k,v]of Object.entries(d.bw)){const p=g(k);p.w+=v.w;p.bl+=v.l;p.br+=v.r}
    for(const[k,v]of Object.entries(d.fl)){const p=g(k);p.c+=v.c;p.ro+=v.ro;p.st+=v.st;p.dh+=v.dh}})
  return Object.values(t).map(p=>{p.avg=p.out?p.r/p.out:p.r;p.econ=div(p.br*6,p.bl);p.fld=p.c+p.ro+p.st
    p.pts=p.r+p.w*20+p.fld*10+(p.bl>=6?Math.max(0,8-p.econ)*5:0)+(p.b>=6?Math.max(0,div(p.r*100,p.b)-100)/10:0);return p})
}
export function awards(ms:Match[]){
  const ps=playerStats(ms),top=<T,>(a:T[],f:(x:T)=>number)=>a.length?a.reduce((x,y)=>f(y)>f(x)?y:x):undefined
  return{mvp:top(ps,p=>p.pts),
    batter:top(ps.filter(p=>p.r>0),p=>p.r+p.avg/1000),
    bowler:top(ps.filter(p=>p.w>0),p=>p.w*1000-p.econ),
    fielder:top(ps.filter(p=>p.fld>0),p=>p.fld)}
}
