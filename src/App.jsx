import { useState, useEffect, useRef, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────────────────
//  FONTS
// ─────────────────────────────────────────────────────────────────────────────
const FontLoader = () => {
  useEffect(() => {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@400;500;600&display=swap";
    document.head.appendChild(l);
  }, []);
  return null;
};

// ─────────────────────────────────────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const POKER_VALUES = ["1","2","3","5","8","13","21","40","?","☕"];
const COLUMNS = [
  { id:"backlog",     title:"Backlog",      color:"#64748b" },
  { id:"sprint",      title:"Sprint Ready", color:"#ffd166" },
  { id:"in_progress", title:"In Progress",  color:"#7c3aed" },
  { id:"done",        title:"Done ✓",       color:"#06d6a0" },
];
const TEAM = [
  { id:"t1", name:"Alex K.",   avatar:"AK", color:"#7c3aed", online:true  },
  { id:"t2", name:"Jordan M.", avatar:"JM", color:"#06d6a0", online:true  },
  { id:"t3", name:"Sam P.",    avatar:"SP", color:"#ffd166", online:false },
  { id:"t4", name:"Riley C.",  avatar:"RC", color:"#ff4d6d", online:true  },
];
const INIT_STORIES = {
  backlog:[
    {id:"s1",title:"User authentication flow",   priority:"high",  points:null,tags:["auth","security"],description:"OAuth + email/password login with session management"},
    {id:"s2",title:"Dashboard onboarding wizard",priority:"medium",points:null,tags:["UX"],             description:"First-run guided tour for new users"},
    {id:"s3",title:"Mobile push notifications",  priority:"low",   points:null,tags:["mobile"],         description:"Sprint reminders and @mentions via push"},
  ],
  sprint:[
    {id:"s5",title:"Sprint board drag & drop",priority:"high",points:"8", tags:["core"],  description:"Kanban board with smooth card movement"},
    {id:"s6",title:"QR code room joining",    priority:"high",points:"5", tags:["collab"],description:"Kahoot-style instant team join via QR scan"},
  ],
  in_progress:[
    {id:"s7",title:"Planning poker engine",priority:"high",points:"13",tags:["core","game"],description:"Real-time card voting system with animated reveal"},
  ],
  done:[
    {id:"s8",title:"Project setup & CI/CD",priority:"medium",points:"3",tags:["infra"],description:"GitHub Actions pipeline with auto-deploy"},
    {id:"s9",title:"Design system tokens", priority:"medium",points:"5",tags:["UI"],   description:"Colour, spacing and typography variables"},
  ],
};
const SIM_NOTES = {
  went_well:    ["Strong team communication","Shipped features on time","Code reviews were thorough","Daily standups were focused"],
  improve:      ["PR turnaround too slow","Unclear acceptance criteria","Too many context switches","Need better test coverage"],
  action_items: ["Set 24hr PR SLA","Write ACs before sprint starts","Block focus time on calendar"],
};
const RETRO_COLS = [
  {id:"went_well",   label:"Went Well",   emoji:"✅",color:"#06d6a0"},
  {id:"improve",     label:"To Improve",  emoji:"🔧",color:"#ffd166"},
  {id:"action_items",label:"Action Items",emoji:"⚡",color:"#ff4d6d"},
];
// Timer preset options per phase (label → seconds)
const TIMER_PRESETS = [
  { label:"1 min",  seconds:60  },
  { label:"2 min",  seconds:120 },
  { label:"3 min",  seconds:180 },
  { label:"5 min",  seconds:300 },
  { label:"10 min", seconds:600 },
  { label:"No limit", seconds:0 },
];

// ─────────────────────────────────────────────────────────────────────────────
//  STYLE HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const btn = (bg,color="white",ex={}) => ({background:bg,color,border:"none",borderRadius:10,padding:"8px 14px",cursor:"pointer",fontFamily:"Syne",fontWeight:700,fontSize:12,transition:"all 0.18s",...ex});
const inp = (ex={}) => ({background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:9,padding:"9px 12px",color:"white",fontFamily:"DM Sans",fontSize:13,outline:"none",width:"100%",boxSizing:"border-box",...ex});

// ─────────────────────────────────────────────────────────────────────────────
//  QR CODE SVG
// ─────────────────────────────────────────────────────────────────────────────
const QRCode = ({value,size=140}) => {
  const hash=[...value].reduce((a,c)=>(a*31+c.charCodeAt(0))|0,0);
  const N=21,cell=size/N;
  const grid=Array.from({length:N},(_,r)=>Array.from({length:N},(_,c)=>{
    if((r<7&&c<7)||(r<7&&c>13)||(r>13&&c<7))
      return !((r===1||r===5)&&c>=1&&c<=5)&&!((c===1||c===5)&&r>=1&&r<=5)&&!(r>=2&&r<=4&&c>=2&&c<=4)?1:r>=2&&r<=4&&c>=2&&c<=4?1:0;
    if(r===6||c===6)return(r+c)%2===0?1:0;
    return((hash>>((r*N+c)%32))&1)^((r*c)%3===0?1:0);
  }));
  return(
    <svg width={size} height={size} style={{display:"block",borderRadius:6}}>
      <rect width={size} height={size} fill="white"/>
      {grid.flatMap((row,r)=>row.map((on,c)=>on?<rect key={`${r}-${c}`} x={c*cell} y={r*cell} width={cell} height={cell} fill="#0d0d1c"/>:null))}
    </svg>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  COUNTDOWN RING  — shows a circular timer + mm:ss
// ─────────────────────────────────────────────────────────────────────────────
const CountdownRing = ({seconds,total,label,warn=60,danger=30}) => {
  const r=28,circ=2*Math.PI*r;
  const pct=total>0?Math.max(0,seconds/total):0;
  const stroke=seconds<=danger?"#ff4d6d":seconds<=warn?"#ffd166":"#7c3aed";
  const mm=Math.floor(seconds/60),ss=String(seconds%60).padStart(2,"0");
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
      <svg width={70} height={70} style={{transform:"rotate(-90deg)"}}>
        <circle cx={35} cy={35} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={5}/>
        <circle cx={35} cy={35} r={r} fill="none" stroke={stroke} strokeWidth={5}
          strokeDasharray={circ} strokeDashoffset={circ*(1-pct)}
          strokeLinecap="round" style={{transition:"stroke-dashoffset 1s linear,stroke 0.3s"}}/>
      </svg>
      <div style={{position:"relative",marginTop:-52,display:"flex",flexDirection:"column",alignItems:"center"}}>
        <div style={{fontFamily:"Syne",fontWeight:800,fontSize:15,color:stroke}}>{mm}:{ss}</div>
      </div>
      <div style={{fontFamily:"DM Sans",fontSize:10,color:"#475569",marginTop:20}}>{label}</div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  QR JOIN BANNER — used inside Poker and Retro
// ─────────────────────────────────────────────────────────────────────────────
const QRJoinBanner = ({roomCode,url,participantCount=3}) => {
  const [copied,setCopied]=useState(false);
  const [expanded,setExpanded]=useState(false);
  return(
    <div style={{background:"rgba(124,58,237,0.08)",border:"1px solid rgba(124,58,237,0.25)",borderRadius:16,overflow:"hidden",marginBottom:20}}>
      {/* Collapsed bar */}
      <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",cursor:"pointer"}} onClick={()=>setExpanded(e=>!e)}>
        <div style={{width:8,height:8,borderRadius:"50%",background:"#06d6a0",boxShadow:"0 0 8px #06d6a0",flexShrink:0}}/>
        <div style={{flex:1}}>
          <span style={{fontFamily:"Syne",fontWeight:700,fontSize:13,color:"white"}}>Room: </span>
          <span style={{fontFamily:"Syne",fontWeight:800,fontSize:13,color:"#a78bfa",letterSpacing:2}}>{roomCode}</span>
          <span style={{fontFamily:"DM Sans",fontSize:12,color:"#475569",marginLeft:10}}>{participantCount} joined</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <button onClick={e=>{e.stopPropagation();navigator.clipboard?.writeText(url).catch(()=>{});setCopied(true);setTimeout(()=>setCopied(false),2000);}}
            style={btn(copied?"#06d6a0":"rgba(124,58,237,0.3)",copied?"#0d0d1c":"#a78bfa",{padding:"5px 12px",fontSize:11})}>
            {copied?"✓ Copied":"📋 Copy Link"}
          </button>
          <span style={{color:"#475569",fontSize:14,transform:expanded?"rotate(180deg)":"none",transition:"transform 0.2s"}}>▾</span>
        </div>
      </div>
      {/* Expanded QR panel */}
      {expanded&&(
        <div style={{borderTop:"1px solid rgba(124,58,237,0.2)",padding:"20px",display:"flex",gap:20,alignItems:"flex-start",flexWrap:"wrap"}}>
          <div style={{background:"white",borderRadius:12,padding:10,boxShadow:"0 0 30px rgba(124,58,237,0.35)",flexShrink:0}}>
            <QRCode value={url} size={120}/>
          </div>
          <div style={{flex:1,minWidth:160}}>
            <div style={{fontFamily:"Syne",fontSize:11,color:"#64748b",letterSpacing:1,marginBottom:8}}>SCAN TO JOIN</div>
            <div style={{fontFamily:"DM Sans",fontSize:13,color:"#94a3b8",lineHeight:1.6,marginBottom:12}}>Team members scan with their phone camera. Works on iPhone, Android &amp; desktop — no app needed.</div>
            <div style={{fontFamily:"DM Sans",fontSize:11,color:"#334155",wordBreak:"break-all"}}>{url}</div>
            {/* Live participants */}
            <div style={{display:"flex",gap:6,marginTop:12,flexWrap:"wrap"}}>
              {TEAM.filter(m=>m.online).map(m=>(
                <div key={m.id} style={{display:"flex",alignItems:"center",gap:5,background:"rgba(255,255,255,0.04)",borderRadius:8,padding:"4px 10px"}}>
                  <span style={{width:5,height:5,borderRadius:"50%",background:"#06d6a0",boxShadow:"0 0 5px #06d6a0"}}/>
                  <span style={{fontFamily:"DM Sans",fontSize:11,color:"#94a3b8"}}>{m.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  PHASE TIMER HOOK
// ─────────────────────────────────────────────────────────────────────────────
const usePhaseTimer = (phase,totalSeconds,onExpire) => {
  const [remaining,setRemaining]=useState(totalSeconds);
  const [paused,setPaused]=useState(false);
  const ref=useRef(null);

  useEffect(()=>{
    setRemaining(totalSeconds);
    setPaused(false);
  },[phase,totalSeconds]);

  useEffect(()=>{
    if(paused||remaining<=0){clearInterval(ref.current);if(remaining===0&&onExpire)onExpire();return;}
    ref.current=setInterval(()=>setRemaining(r=>{if(r<=1){clearInterval(ref.current);return 0;}return r-1;}),1000);
    return()=>clearInterval(ref.current);
  },[remaining,paused]);

  return{remaining,paused,pause:()=>setPaused(true),resume:()=>setPaused(false),reset:()=>setRemaining(totalSeconds)};
};

// ─────────────────────────────────────────────────────────────────────────────
//  KANBAN CARD
// ─────────────────────────────────────────────────────────────────────────────
const KanbanCard=({story,columnId,onDrop})=>{
  const [dragging,setDragging]=useState(false);
  const PC={high:"#ff4d6d",medium:"#ffd166",low:"#06d6a0"};
  const tr=useRef(null);
  const onTS=e=>{const t=e.touches[0];tr.current={x:t.clientX,y:t.clientY};};
  const onTE=e=>{if(!tr.current)return;const t=e.changedTouches[0];const col=document.elementFromPoint(t.clientX,t.clientY)?.closest("[data-col]");if(col&&col.dataset.col!==columnId)onDrop(story.id,columnId,col.dataset.col);tr.current=null;};
  return(
    <div draggable onDragStart={e=>{setDragging(true);e.dataTransfer.setData("cid",story.id);e.dataTransfer.setData("from",columnId);}} onDragEnd={()=>setDragging(false)} onTouchStart={onTS} onTouchEnd={onTE}
      style={{background:dragging?"rgba(124,58,237,0.14)":"rgba(255,255,255,0.06)",border:`1px solid ${dragging?"#7c3aed":"rgba(255,255,255,0.09)"}`,borderRadius:12,padding:"11px 13px",marginBottom:9,cursor:"grab",opacity:dragging?0.5:1,transition:"all 0.18s",userSelect:"none",touchAction:"none",boxShadow:dragging?"0 8px 24px rgba(124,58,237,0.28)":"none"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
        <span style={{width:7,height:7,borderRadius:"50%",background:PC[story.priority]||"#888",flexShrink:0}}/>
        <span style={{fontFamily:"DM Sans",fontSize:13,color:"#e2e8f0",fontWeight:500,flex:1,lineHeight:1.3}}>{story.title}</span>
        {story.points?<span style={{background:"#7c3aed",color:"white",borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:700,fontFamily:"Syne"}}>{story.points}</span>:<span style={{background:"rgba(255,255,255,0.05)",color:"#475569",borderRadius:6,padding:"2px 7px",fontSize:10}}>–</span>}
      </div>
      {story.description&&<div style={{fontFamily:"DM Sans",fontSize:11,color:"#475569",marginBottom:5,lineHeight:1.4}}>{story.description}</div>}
      <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{story.tags?.map(t=><span key={t} style={{background:"rgba(255,255,255,0.05)",borderRadius:4,padding:"1px 6px",fontSize:10,color:"#64748b"}}>{t}</span>)}</div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  DROP COLUMN  (with full inline add-story form)
// ─────────────────────────────────────────────────────────────────────────────
const DropColumn=({id,title,stories,color,onDrop,onAdd})=>{
  const [over,setOver]=useState(false);
  const [adding,setAdding]=useState(false);
  const [form,setForm]=useState({title:"",description:"",priority:"medium",tags:""});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const submit=()=>{
    if(!form.title.trim())return;
    onAdd(id,{id:`s${Date.now()}`,title:form.title.trim(),description:form.description.trim(),priority:form.priority,tags:form.tags.split(",").map(t=>t.trim()).filter(Boolean),points:null});
    setForm({title:"",description:"",priority:"medium",tags:""});setAdding(false);
  };
  return(
    <div data-col={id}
      onDragOver={e=>{e.preventDefault();setOver(true);}} onDragLeave={e=>{if(!e.currentTarget.contains(e.relatedTarget))setOver(false);}}
      onDrop={e=>{e.preventDefault();setOver(false);const cid=e.dataTransfer.getData("cid");const fr=e.dataTransfer.getData("from");if(cid&&fr!==id)onDrop(cid,fr,id);}}
      style={{flex:"0 0 250px",background:over?"rgba(124,58,237,0.09)":"rgba(255,255,255,0.025)",border:`1.5px solid ${over?"#7c3aed":"rgba(255,255,255,0.07)"}`,borderRadius:16,padding:14,transition:"all 0.2s",minHeight:420,display:"flex",flexDirection:"column"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
        <span style={{width:9,height:9,borderRadius:3,background:color}}/><span style={{fontFamily:"Syne",fontWeight:700,color:"#e2e8f0",fontSize:13}}>{title}</span>
        <span style={{marginLeft:"auto",background:"rgba(255,255,255,0.07)",borderRadius:20,padding:"1px 8px",fontSize:11,color:"#475569"}}>{stories.length}</span>
      </div>
      <div style={{flex:1}}>{stories.map(s=><KanbanCard key={s.id} story={s} columnId={id} onDrop={onDrop}/>)}
        {stories.length===0&&!adding&&<div style={{textAlign:"center",color:"#1e293b",fontSize:12,marginTop:32,fontFamily:"DM Sans"}}>Drop stories here</div>}
      </div>
      {adding?(
        <div style={{marginTop:10,background:"rgba(124,58,237,0.08)",border:"1px solid rgba(124,58,237,0.2)",borderRadius:12,padding:12}}>
          <input autoFocus value={form.title} onChange={e=>set("title",e.target.value)} onKeyDown={e=>e.key==="Escape"&&setAdding(false)} placeholder="Story title *" style={{...inp(),marginBottom:8}}/>
          <textarea value={form.description} onChange={e=>set("description",e.target.value)} placeholder="Description / acceptance criteria…" rows={2} style={{...inp(),resize:"none",marginBottom:8}}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
            <div>
              <div style={{fontFamily:"DM Sans",fontSize:10,color:"#475569",marginBottom:4}}>Priority</div>
              <select value={form.priority} onChange={e=>set("priority",e.target.value)} style={{...inp(),padding:"7px 10px",fontSize:12}}>
                <option value="high">🔴 High</option><option value="medium">🟡 Medium</option><option value="low">🟢 Low</option>
              </select>
            </div>
            <div>
              <div style={{fontFamily:"DM Sans",fontSize:10,color:"#475569",marginBottom:4}}>Tags</div>
              <input value={form.tags} onChange={e=>set("tags",e.target.value)} placeholder="auth, UI…" style={{...inp(),padding:"7px 10px",fontSize:12}}/>
            </div>
          </div>
          <div style={{display:"flex",gap:6}}>
            <button onClick={submit} style={btn("#7c3aed","white",{flex:1,padding:"8px",fontSize:12})}>＋ Add Story</button>
            <button onClick={()=>setAdding(false)} style={btn("rgba(255,255,255,0.06)","#64748b",{padding:"8px 12px",fontSize:12})}>✕</button>
          </div>
        </div>
      ):(
        <button onClick={()=>setAdding(true)} style={{marginTop:8,width:"100%",background:"none",border:"1px dashed rgba(255,255,255,0.07)",borderRadius:8,padding:"8px",color:"#334155",cursor:"pointer",fontFamily:"DM Sans",fontSize:12,transition:"all 0.2s"}}
          onMouseEnter={e=>{e.target.style.borderColor="#7c3aed";e.target.style.color="#7c3aed";}} onMouseLeave={e=>{e.target.style.borderColor="rgba(255,255,255,0.07)";e.target.style.color="#334155";}}>
          + Add Story
        </button>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  PLANNING POKER SESSION
// ─────────────────────────────────────────────────────────────────────────────
const PokerSession=({stories,onScore})=>{
  const [step,setStep]=useState("pick"); // pick | vote | reveal
  const [ticket,setTicket]=useState(null);
  const [myVote,setMyVote]=useState(null);
  const [simVotes,setSimVotes]=useState({});
  const POKER_URL="https://sprintvibe.app/poker/ROOM-7X9P";
  const POKER_CODE="POKER-7X9P";

  const startSession=story=>{setTicket(story);setMyVote(null);setSimVotes({});setStep("vote");};
  const castVote=val=>{
    setMyVote(val);
    setTimeout(()=>{
      const p=["2","3","5","8","13","8","5","3"];
      setSimVotes({"Alex K.":p[Math.floor(Math.random()*p.length)],"Jordan M.":p[Math.floor(Math.random()*p.length)],"Riley C.":p[Math.floor(Math.random()*p.length)]});
    },800+Math.random()*1000);
  };
  const allVoted=myVote&&Object.keys(simVotes).length===3;
  const allVotesMap={...simVotes,"You":myVote};
  const nums=Object.values(allVotesMap).map(v=>parseFloat(v)).filter(n=>!isNaN(n));
  const avg=nums.length?(nums.reduce((a,b)=>a+b,0)/nums.length).toFixed(1):null;
  const fib=[1,2,3,5,8,13,21,40];
  const suggested=avg?fib.reduce((p,c)=>Math.abs(c-avg)<Math.abs(p-avg)?c:p):null;
  const PC={high:"#ff4d6d",medium:"#ffd166",low:"#06d6a0"};

  // ── pick ────────────────────────────────────────────────────────────────
  if(step==="pick") return(
    <div style={{padding:"20px 16px 48px"}}>
      {/* QR Join Banner */}
      <QRJoinBanner roomCode={POKER_CODE} url={POKER_URL} participantCount={3}/>

      <div style={{textAlign:"center",marginBottom:28}}>
        <div style={{fontSize:36,marginBottom:8}}>🃏</div>
        <div style={{fontFamily:"Syne",fontSize:24,fontWeight:800,color:"white",marginBottom:6}}>Sprint Poker</div>
        <div style={{fontFamily:"DM Sans",fontSize:13,color:"#475569",maxWidth:320,margin:"0 auto",lineHeight:1.6}}>Pick a ticket. Everyone votes privately, then you reveal together.</div>
      </div>

      <div style={{maxWidth:540,margin:"0 auto"}}>
        {COLUMNS.map(col=>{const cs=stories[col.id]||[];if(!cs.length)return null;return(
          <div key={col.id} style={{marginBottom:22}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <span style={{width:8,height:8,borderRadius:3,background:col.color}}/>
              <span style={{fontFamily:"Syne",fontSize:11,fontWeight:700,color:"#64748b",letterSpacing:1}}>{col.title.toUpperCase()}</span>
            </div>
            {cs.map(story=>(
              <button key={story.id} onClick={()=>startSession(story)}
                style={{width:"100%",marginBottom:7,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:"13px 16px",cursor:"pointer",textAlign:"left",transition:"all 0.18s",display:"flex",alignItems:"center",gap:12}}
                onMouseEnter={e=>{e.currentTarget.style.background="rgba(124,58,237,0.12)";e.currentTarget.style.borderColor="#7c3aed";}}
                onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.04)";e.currentTarget.style.borderColor="rgba(255,255,255,0.07)";}}>
                <span style={{width:8,height:8,borderRadius:"50%",background:PC[story.priority]||"#888",flexShrink:0}}/>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"DM Sans",fontSize:14,fontWeight:600,color:"#e2e8f0",marginBottom:2}}>{story.title}</div>
                  {story.description&&<div style={{fontFamily:"DM Sans",fontSize:12,color:"#475569"}}>{story.description}</div>}
                </div>
                <div style={{flexShrink:0,display:"flex",alignItems:"center",gap:8}}>
                  {story.points?<span style={{background:"#7c3aed",color:"white",borderRadius:6,padding:"2px 8px",fontSize:11,fontFamily:"Syne",fontWeight:700}}>{story.points}pt</span>:<span style={{background:"rgba(255,255,255,0.05)",color:"#475569",borderRadius:6,padding:"2px 8px",fontSize:11}}>no est.</span>}
                  <span style={{color:"#334155",fontSize:18}}>›</span>
                </div>
              </button>
            ))}
          </div>
        );})}
      </div>
    </div>
  );

  // ── vote ────────────────────────────────────────────────────────────────
  if(step==="vote") return(
    <div style={{padding:"20px 16px 48px",maxWidth:540,margin:"0 auto"}}>
      <button onClick={()=>setStep("pick")} style={btn("rgba(255,255,255,0.06)","#64748b",{marginBottom:16})}>← Back</button>

      {/* Ticket card */}
      <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,padding:"13px 16px",marginBottom:24}}>
        <span style={{width:8,height:8,borderRadius:"50%",background:PC[ticket.priority]||"#888",display:"inline-block",marginRight:8}}/>
        <span style={{fontFamily:"Syne",fontSize:15,fontWeight:800,color:"white"}}>{ticket.title}</span>
        {ticket.description&&<div style={{fontFamily:"DM Sans",fontSize:12,color:"#475569",marginTop:4}}>{ticket.description}</div>}
      </div>

      {/* Player cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:28}}>
        {[...TEAM.slice(0,3),{id:"you",name:"You",avatar:"YOU",color:"#06d6a0"}].map(m=>{
          const isYou=m.id==="you";const voted=isYou?!!myVote:!!simVotes[m.name];
          return(
            <div key={m.id} style={{textAlign:"center"}}>
              <div style={{width:"100%",aspectRatio:"2/3",borderRadius:12,marginBottom:6,border:`2px solid ${voted?m.color:"rgba(255,255,255,0.08)"}`,background:voted?`${m.color}22`:"rgba(255,255,255,0.03)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontFamily:"Syne",fontWeight:800,color:"white",transition:"all 0.3s",boxShadow:voted?`0 0 18px ${m.color}44`:"none"}}>
                {voted?"✓":"…"}
              </div>
              <div style={{fontFamily:"DM Sans",fontSize:10,color:"#475569"}}>{m.name.split(" ")[0]}</div>
            </div>
          );
        })}
      </div>

      <div style={{fontFamily:"DM Sans",fontSize:12,color:"#475569",textAlign:"center",marginBottom:12}}>
        {myVote?`You voted ${myVote} — waiting for teammates…`:"Pick your estimate"}
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center",marginBottom:24}}>
        {POKER_VALUES.map(v=>(
          <button key={v} onClick={()=>castVote(v)} style={{width:52,height:70,borderRadius:12,cursor:"pointer",border:`2px solid ${myVote===v?"#7c3aed":"rgba(255,255,255,0.1)"}`,background:myVote===v?"#7c3aed":"rgba(255,255,255,0.04)",color:"white",fontFamily:"Syne",fontWeight:800,fontSize:16,transition:"all 0.18s",transform:myVote===v?"translateY(-8px) scale(1.08)":"none",boxShadow:myVote===v?"0 12px 28px rgba(124,58,237,0.5)":"none"}}>{v}</button>
        ))}
      </div>
      <button disabled={!allVoted} onClick={()=>setStep("reveal")} style={btn(allVoted?"#7c3aed":"rgba(255,255,255,0.05)",allVoted?"white":"#334155",{width:"100%",padding:"13px",fontSize:14,cursor:allVoted?"pointer":"default"})}>
        {allVoted?"🃏 Reveal All Cards":`Waiting… (${Object.keys(simVotes).length}/3 voted)`}
      </button>
    </div>
  );

  // ── reveal ──────────────────────────────────────────────────────────────
  if(step==="reveal") return(
    <div style={{padding:"20px 16px 48px",maxWidth:540,margin:"0 auto"}}>
      <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,padding:"13px 16px",marginBottom:24}}>
        <span style={{width:8,height:8,borderRadius:"50%",background:PC[ticket.priority]||"#888",display:"inline-block",marginRight:8}}/>
        <span style={{fontFamily:"Syne",fontSize:15,fontWeight:800,color:"white"}}>{ticket.title}</span>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:24}}>
        {[...TEAM.slice(0,3),{id:"you",name:"You",avatar:"YOU",color:"#06d6a0"}].map(m=>{
          const v=m.id==="you"?myVote:simVotes[m.name];
          return(
            <div key={m.id} style={{textAlign:"center"}}>
              <div style={{width:"100%",aspectRatio:"2/3",borderRadius:12,marginBottom:6,background:`linear-gradient(145deg,${m.color}33,${m.color}11)`,border:`2px solid ${m.color}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,fontFamily:"Syne",fontWeight:800,color:"white",boxShadow:`0 4px 18px ${m.color}44`,animation:"flipIn 0.4s ease"}}>{v||"?"}</div>
              <div style={{fontFamily:"DM Sans",fontSize:10,color:"#64748b"}}>{m.name.split(" ")[0]}</div>
            </div>
          );
        })}
      </div>
      {avg&&<div style={{background:"rgba(6,214,160,0.08)",border:"1px solid rgba(6,214,160,0.25)",borderRadius:14,padding:"16px 20px",marginBottom:18,textAlign:"center"}}><div style={{fontFamily:"DM Sans",fontSize:11,color:"#64748b",marginBottom:3}}>Team Average</div><div style={{fontFamily:"Syne",fontSize:40,fontWeight:800,color:"#06d6a0",lineHeight:1,marginBottom:3}}>{avg}</div><div style={{fontFamily:"DM Sans",fontSize:13,color:"#475569"}}>Suggested: <strong style={{color:"white"}}>{suggested} pts</strong></div></div>}
      <div style={{fontFamily:"DM Sans",fontSize:12,color:"#64748b",textAlign:"center",marginBottom:10}}>Accept a point value:</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center",marginBottom:22}}>
        {POKER_VALUES.filter(v=>!isNaN(parseFloat(v))).map(v=>(
          <button key={v} onClick={()=>{onScore(ticket.id,v);setStep("pick");setTicket(null);}}
            style={{width:52,height:52,borderRadius:12,cursor:"pointer",border:`2px solid ${v===String(suggested)?"#06d6a0":"rgba(255,255,255,0.1)"}`,background:v===String(suggested)?"rgba(6,214,160,0.15)":"rgba(255,255,255,0.04)",color:v===String(suggested)?"#06d6a0":"white",fontFamily:"Syne",fontWeight:800,fontSize:15,transition:"all 0.18s"}}
            onMouseEnter={e=>{e.currentTarget.style.background="rgba(124,58,237,0.2)";e.currentTarget.style.borderColor="#7c3aed";e.currentTarget.style.color="white";}}
            onMouseLeave={e=>{const s=v===String(suggested);e.currentTarget.style.background=s?"rgba(6,214,160,0.15)":"rgba(255,255,255,0.04)";e.currentTarget.style.borderColor=s?"#06d6a0":"rgba(255,255,255,0.1)";e.currentTarget.style.color=s?"#06d6a0":"white";}}>
            {v}
          </button>
        ))}
      </div>
      <div style={{display:"flex",gap:10}}>
        <button onClick={()=>{setStep("vote");setMyVote(null);setSimVotes({});}} style={btn("rgba(255,255,255,0.06)","#94a3b8",{flex:1,padding:"12px"})}>↩ Re-vote</button>
        <button onClick={()=>{setStep("pick");setTicket(null);}} style={btn("rgba(255,255,255,0.06)","#64748b",{flex:1,padding:"12px"})}>Next ticket →</button>
      </div>
    </div>
  );
  return null;
};

// ─────────────────────────────────────────────────────────────────────────────
//  RETROSPECTIVE SESSION
// ─────────────────────────────────────────────────────────────────────────────
const RetroView=()=>{
  const RETRO_URL="https://sprintvibe.app/retro/RETRO-2Z5K";
  const RETRO_CODE="RETRO-2Z5K";

  const [role,setRole]=useState("host");
  const [phase,setPhase]=useState("lobby");
  const [notes,setNotes]=useState({went_well:[],improve:[],action_items:[]});
  const [myInputs,setMyInputs]=useState({went_well:"",improve:"",action_items:""});
  const [votes,setVotes]=useState({});
  const [aiSummary,setAiSummary]=useState(null);
  const [aiLoading,setAiLoading]=useState(false);
  const [mood,setMood]=useState(null);
  const [activeDiscuss,setActiveDiscuss]=useState(null);
  const noteId=useRef(100);
  const simRef=useRef(null);
  const MOODS=["😩","😕","😐","🙂","🚀"];

  // Host-configurable time limits per phase (seconds; 0 = no limit)
  const [phaseTimeLimits,setPhaseTimeLimits]=useState({collect:300,vote:180,discuss:300});
  const setLimit=(ph,secs)=>setPhaseTimeLimits(p=>({...p,[ph]:secs}));

  // Phase timers — re-initialise when the chosen limit changes
  const collectTimer=usePhaseTimer(phase==="collect"?"collect":"idle",phaseTimeLimits.collect,()=>{});
  const voteTimer=usePhaseTimer(phase==="vote"?"vote":"idle",phaseTimeLimits.vote,()=>{});
  const discussTimer=usePhaseTimer(phase==="discuss"?"discuss":"idle",phaseTimeLimits.discuss,()=>{});
  const activeTimer=phase==="collect"?collectTimer:phase==="vote"?voteTimer:phase==="discuss"?discussTimer:null;
  const activeTotal=phase==="collect"?phaseTimeLimits.collect:phase==="vote"?phaseTimeLimits.vote:phase==="discuss"?phaseTimeLimits.discuss:0;

  // Stream simulated notes during collect
  useEffect(()=>{
    clearInterval(simRef.current);
    if(phase!=="collect")return;
    const all=RETRO_COLS.flatMap(col=>SIM_NOTES[col.id].map((text,i)=>({col:col.id,text,delay:(i+1)*2400+Math.random()*700})));
    const ts=all.map(({col,text,delay})=>setTimeout(()=>{
      setNotes(n=>({...n,[col]:[...n[col],{id:noteId.current++,text,author:"Team",mine:false}]}));
    },delay));
    return()=>ts.forEach(clearTimeout);
  },[phase]);

  const addNote=col=>{const t=myInputs[col].trim();if(!t)return;setNotes(n=>({...n,[col]:[...n[col],{id:noteId.current++,text:t,author:"You",mine:true}]}));setMyInputs(i=>({...i,[col]:""}));};
  const castVote=id=>setVotes(v=>({...v,[id]:(v[id]||0)+1}));
  const totalNotes=RETRO_COLS.reduce((a,c)=>a+notes[c.id].length,0);
  const allNotes=RETRO_COLS.flatMap(col=>notes[col.id].map(n=>({...n,col:col.id})));
  const topNotes=[...allNotes].sort((a,b)=>(votes[b.id]||0)-(votes[a.id]||0)).slice(0,6);
  const totalVotes=Object.values(votes).reduce((a,b)=>a+b,0);

  const getAI=async()=>{
    setAiLoading(true);
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:600,system:`You are an agile coach. Return ONLY valid JSON no markdown: {"summary":"2 sentences","actions":["a1","a2","a3"],"health":"good|fair|poor"}`,messages:[{role:"user",content:`Went Well:${notes.went_well.map(n=>n.text).join(",")}\nImprove:${notes.improve.map(n=>n.text).join(",")}\nActions:${notes.action_items.map(n=>n.text).join(",")}`}]})});
      const data=await res.json();setAiSummary(JSON.parse(data.content.map(b=>b.text||"").join("").replace(/```json|```/g,"").trim()));
    }catch{setAiSummary({summary:"Strong sprint execution with good team collaboration. Process improvements around PR review cycle will increase velocity.",actions:["Set 24hr PR review SLA","Write ACs before sprint starts","Block 2hr focus time blocks"],health:"good"});}
    finally{setAiLoading(false);}
  };

  // ── LOBBY ──────────────────────────────────────────────────────────────
  if(phase==="lobby") return(
    <div style={{padding:"20px 16px 48px",maxWidth:620,margin:"0 auto"}}>
      {/* Role toggle */}
      <div style={{display:"flex",gap:0,background:"rgba(255,255,255,0.04)",borderRadius:12,padding:4,marginBottom:24,width:"fit-content"}}>
        {["host","participant"].map(r=>(
          <button key={r} onClick={()=>setRole(r)} style={btn(role===r?"#7c3aed":"transparent",role===r?"white":"#475569",{borderRadius:9,padding:"7px 18px",fontSize:12})}>
            {r==="host"?"🎙 Host":"👤 Participant"}
          </button>
        ))}
      </div>

      {/* QR Join Banner — visible to host so they can share */}
      <QRJoinBanner roomCode={RETRO_CODE} url={RETRO_URL} participantCount={3}/>

      {role==="host"?(
        <>
          <div style={{textAlign:"center",marginBottom:24}}>
            <div style={{fontSize:36,marginBottom:8}}>🏁</div>
            <div style={{fontFamily:"Syne",fontSize:24,fontWeight:800,color:"white",marginBottom:6}}>Sprint Retrospective</div>
            <div style={{fontFamily:"DM Sans",fontSize:13,color:"#475569",lineHeight:1.6,maxWidth:400,margin:"0 auto"}}>You're the facilitator. Set a time limit for each phase once it starts.</div>
          </div>
          {/* Mood + Team */}
          <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:16,marginBottom:20}}>
            <div style={{fontFamily:"Syne",fontSize:11,color:"white",fontWeight:700,marginBottom:10}}>Quick mood check</div>
            <div style={{display:"flex",gap:8,marginBottom:14}}>{MOODS.map((m,i)=><button key={m} onClick={()=>setMood(i)} style={{fontSize:24,background:mood===i?"rgba(124,58,237,0.18)":"none",border:`2px solid ${mood===i?"#7c3aed":"rgba(255,255,255,0.07)"}`,borderRadius:11,padding:"6px 10px",cursor:"pointer",transform:mood===i?"scale(1.2) translateY(-2px)":"none",transition:"all 0.2s"}}>{m}</button>)}</div>
            <div style={{fontFamily:"Syne",fontSize:10,color:"#64748b",letterSpacing:1,marginBottom:10}}>TEAM IN ROOM</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{TEAM.map(m=>(
              <div key={m.id} style={{display:"flex",alignItems:"center",gap:6,background:"rgba(255,255,255,0.04)",borderRadius:9,padding:"5px 10px"}}>
                <span style={{width:5,height:5,borderRadius:"50%",background:m.online?"#06d6a0":"#334155",boxShadow:m.online?"0 0 5px #06d6a0":"none"}}/>
                <span style={{fontFamily:"DM Sans",fontSize:12,color:m.online?"#e2e8f0":"#475569"}}>{m.name}</span>
              </div>
            ))}</div>
          </div>
          <button onClick={()=>setPhase("collect")} style={btn("#7c3aed","white",{width:"100%",padding:"14px",fontSize:15})}>Start Retrospective →</button>
        </>
      ):(
        <>
          <div style={{textAlign:"center",marginBottom:24}}>
            <div style={{fontSize:36,marginBottom:8}}>👋</div>
            <div style={{fontFamily:"Syne",fontSize:22,fontWeight:800,color:"white",marginBottom:6}}>You're in the room</div>
            <div style={{fontFamily:"DM Sans",fontSize:13,color:"#475569",marginBottom:20}}>Waiting for the host to start…</div>
            <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:20,marginBottom:20}}>
              <div style={{fontSize:28,marginBottom:8,animation:"pulse 2s ease infinite"}}>⏳</div>
              <div style={{fontFamily:"Syne",fontSize:13,fontWeight:700,color:"#64748b"}}>Host hasn't started yet</div>
            </div>
          </div>
          <button onClick={()=>setPhase("collect")} style={btn("#7c3aed","white",{width:"100%",padding:"13px",fontSize:14})}>(Demo) Join Session →</button>
        </>
      )}
    </div>
  );

  // ── COLLECT ────────────────────────────────────────────────────────────
  if(phase==="collect") return(
    <div style={{padding:"20px 16px 48px"}}>
      {/* Phase header */}
      <div style={{marginBottom:20}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:12,marginBottom:12}}>
          <div>
            <div style={{fontFamily:"Syne",fontSize:10,color:"#7c3aed",letterSpacing:2,marginBottom:3}}>PHASE 1 OF 3</div>
            <div style={{fontFamily:"Syne",fontSize:20,fontWeight:800,color:"white"}}>Collect Notes</div>
            <div style={{fontFamily:"DM Sans",fontSize:12,color:"#475569"}}>{totalNotes} notes so far · everyone's typing live</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            {phaseTimeLimits.collect>0 && <>
              <CountdownRing seconds={collectTimer.remaining} total={phaseTimeLimits.collect} label="Collect" warn={60} danger={30}/>
              <button onClick={()=>collectTimer.paused?collectTimer.resume():collectTimer.pause()} style={btn("rgba(255,255,255,0.06)","#94a3b8",{padding:"5px 12px",fontSize:11})}>{collectTimer.paused?"▶ Resume":"⏸ Pause"}</button>
            </>}
            {role==="host"&&<button onClick={()=>setPhase("vote")} style={btn("#7c3aed","white",{padding:"7px 14px",fontSize:12})}>End → Vote</button>}
          </div>
        </div>
        {/* ── Timer preset picker ── */}
        <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"10px 14px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
          <span style={{fontFamily:"Syne",fontSize:10,color:"#475569",letterSpacing:1,flexShrink:0}}>⏱ TIME LIMIT</span>
          {TIMER_PRESETS.map(p=>{
            const active=phaseTimeLimits.collect===p.seconds;
            return(
              <button key={p.label} onClick={()=>setLimit("collect",p.seconds)} style={{padding:"4px 11px",borderRadius:7,cursor:"pointer",fontFamily:"Syne",fontWeight:700,fontSize:11,background:active?"#7c3aed":"rgba(255,255,255,0.05)",border:`1px solid ${active?"#7c3aed":"rgba(255,255,255,0.08)"}`,color:active?"white":"#64748b",transition:"all 0.15s",boxShadow:active?"0 0 10px rgba(124,58,237,0.35)":"none"}}>
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* QR banner */}
      <QRJoinBanner roomCode={RETRO_CODE} url={RETRO_URL} participantCount={totalNotes>0?4:3}/>

      {/* Note columns */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:14}}>
        {RETRO_COLS.map(col=>(
          <div key={col.id} style={{background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:14,display:"flex",flexDirection:"column",minHeight:360}}>
            <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:14,paddingBottom:10,borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
              <span style={{fontSize:15}}>{col.emoji}</span>
              <span style={{fontFamily:"Syne",fontSize:13,fontWeight:700,color:col.color}}>{col.label}</span>
              <span style={{marginLeft:"auto",background:"rgba(255,255,255,0.06)",borderRadius:20,padding:"1px 7px",fontSize:11,color:"#475569"}}>{notes[col.id].length}</span>
            </div>
            <div style={{flex:1,marginBottom:10}}>
              {notes[col.id].length===0&&<div style={{textAlign:"center",color:"#1e293b",fontSize:12,fontFamily:"DM Sans",marginTop:20}}>No notes yet…</div>}
              {notes[col.id].map(n=>(
                <div key={n.id} style={{background:n.mine?"rgba(124,58,237,0.12)":"rgba(255,255,255,0.04)",border:`1px solid ${n.mine?"rgba(124,58,237,0.3)":"rgba(255,255,255,0.06)"}`,borderRadius:9,padding:"8px 11px",marginBottom:7,borderLeft:`3px solid ${col.color}`,animation:"noteIn 0.35s ease"}}>
                  <div style={{fontFamily:"DM Sans",fontSize:13,color:"#e2e8f0",lineHeight:1.4,marginBottom:3}}>{n.text}</div>
                  <div style={{fontFamily:"DM Sans",fontSize:10,color:"#475569"}}>{n.mine?"You":n.author}</div>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:6}}>
              <input value={myInputs[col.id]} onChange={e=>setMyInputs(p=>({...p,[col.id]:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&addNote(col.id)} placeholder={`Add ${col.label.toLowerCase()}…`} style={{...inp(),flex:1,fontSize:12,padding:"7px 10px"}}/>
              <button onClick={()=>addNote(col.id)} style={{background:col.color,border:"none",borderRadius:8,width:30,height:30,cursor:"pointer",color:"#0d0d1c",fontWeight:800,fontSize:17,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>+</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── VOTE ───────────────────────────────────────────────────────────────
  if(phase==="vote") return(
    <div style={{padding:"20px 16px 48px",maxWidth:660,margin:"0 auto"}}>
      <div style={{marginBottom:20}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:12,marginBottom:12}}>
          <div>
            <div style={{fontFamily:"Syne",fontSize:10,color:"#7c3aed",letterSpacing:2,marginBottom:3}}>PHASE 2 OF 3</div>
            <div style={{fontFamily:"Syne",fontSize:20,fontWeight:800,color:"white"}}>Dot Voting</div>
            <div style={{fontFamily:"DM Sans",fontSize:12,color:"#475569"}}>You have 5 votes · {totalVotes}/5 used</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            {phaseTimeLimits.vote>0 && <>
              <CountdownRing seconds={voteTimer.remaining} total={phaseTimeLimits.vote} label="Vote" warn={45} danger={20}/>
              <button onClick={()=>voteTimer.paused?voteTimer.resume():voteTimer.pause()} style={btn("rgba(255,255,255,0.06)","#94a3b8",{padding:"5px 12px",fontSize:11})}>{voteTimer.paused?"▶ Resume":"⏸ Pause"}</button>
            </>}
            {role==="host"&&<button onClick={()=>{setActiveDiscuss(topNotes[0]);setPhase("discuss");}} style={btn("#7c3aed","white",{padding:"7px 14px",fontSize:12})}>End → Discuss</button>}
          </div>
        </div>
        {/* ── Timer preset picker ── */}
        <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"10px 14px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
          <span style={{fontFamily:"Syne",fontSize:10,color:"#475569",letterSpacing:1,flexShrink:0}}>⏱ TIME LIMIT</span>
          {TIMER_PRESETS.map(p=>{
            const active=phaseTimeLimits.vote===p.seconds;
            return(
              <button key={p.label} onClick={()=>setLimit("vote",p.seconds)} style={{padding:"4px 11px",borderRadius:7,cursor:"pointer",fontFamily:"Syne",fontWeight:700,fontSize:11,background:active?"#7c3aed":"rgba(255,255,255,0.05)",border:`1px solid ${active?"#7c3aed":"rgba(255,255,255,0.08)"}`,color:active?"white":"#64748b",transition:"all 0.15s",boxShadow:active?"0 0 10px rgba(124,58,237,0.35)":"none"}}>
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {RETRO_COLS.map(col=>{const cn=notes[col.id];if(!cn.length)return null;return(
        <div key={col.id} style={{marginBottom:24}}>
          <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:10}}>
            <span style={{fontSize:13}}>{col.emoji}</span>
            <span style={{fontFamily:"Syne",fontSize:11,fontWeight:700,color:col.color,letterSpacing:1}}>{col.label.toUpperCase()}</span>
          </div>
          {cn.map(n=>{const vc=votes[n.id]||0;const canVote=totalVotes<5;return(
            <div key={n.id} style={{display:"flex",alignItems:"center",gap:12,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12,padding:"11px 14px",marginBottom:7,borderLeft:`3px solid ${col.color}`}}>
              <div style={{flex:1,fontFamily:"DM Sans",fontSize:13,color:"#e2e8f0",lineHeight:1.4}}>{n.text}</div>
              <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                {vc>0&&<div style={{display:"flex",gap:3}}>{Array.from({length:vc}).map((_,i)=><span key={i} style={{width:9,height:9,borderRadius:"50%",background:col.color,boxShadow:`0 0 5px ${col.color}`}}/>)}</div>}
                <button onClick={()=>canVote&&castVote(n.id)} style={{width:30,height:30,borderRadius:8,border:`1px solid ${vc>0?col.color:"rgba(255,255,255,0.1)"}`,background:vc>0?`${col.color}22`:"rgba(255,255,255,0.04)",color:canVote?"white":"#334155",cursor:canVote?"pointer":"default",fontFamily:"Syne",fontWeight:800,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.18s"}}>+</button>
              </div>
            </div>
          );})}
        </div>
      );})}
    </div>
  );

  // ── DISCUSS ────────────────────────────────────────────────────────────
  if(phase==="discuss") return(
    <div style={{padding:"20px 16px 48px",maxWidth:660,margin:"0 auto"}}>
      <div style={{marginBottom:20}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:12,marginBottom:12}}>
          <div>
            <div style={{fontFamily:"Syne",fontSize:10,color:"#7c3aed",letterSpacing:2,marginBottom:3}}>PHASE 3 OF 3</div>
            <div style={{fontFamily:"Syne",fontSize:20,fontWeight:800,color:"white"}}>Discussion</div>
            <div style={{fontFamily:"DM Sans",fontSize:12,color:"#475569"}}>Work through the top voted items</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            {phaseTimeLimits.discuss>0 && <>
              <CountdownRing seconds={discussTimer.remaining} total={phaseTimeLimits.discuss} label="Discuss" warn={60} danger={30}/>
              <button onClick={()=>discussTimer.paused?discussTimer.resume():discussTimer.pause()} style={btn("rgba(255,255,255,0.06)","#94a3b8",{padding:"5px 12px",fontSize:11})}>{discussTimer.paused?"▶ Resume":"⏸ Pause"}</button>
            </>}
            {role==="host"&&<button onClick={()=>setPhase("done")} style={btn("#7c3aed","white",{padding:"7px 14px",fontSize:12})}>Wrap Up →</button>}
          </div>
        </div>
        {/* ── Timer preset picker ── */}
        <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"10px 14px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
          <span style={{fontFamily:"Syne",fontSize:10,color:"#475569",letterSpacing:1,flexShrink:0}}>⏱ TIME LIMIT</span>
          {TIMER_PRESETS.map(p=>{
            const active=phaseTimeLimits.discuss===p.seconds;
            return(
              <button key={p.label} onClick={()=>setLimit("discuss",p.seconds)} style={{padding:"4px 11px",borderRadius:7,cursor:"pointer",fontFamily:"Syne",fontWeight:700,fontSize:11,background:active?"#7c3aed":"rgba(255,255,255,0.05)",border:`1px solid ${active?"#7c3aed":"rgba(255,255,255,0.08)"}`,color:active?"white":"#64748b",transition:"all 0.15s",boxShadow:active?"0 0 10px rgba(124,58,237,0.35)":"none"}}>
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:10,marginBottom:24}}>
        {topNotes.map((n,i)=>{const col=RETRO_COLS.find(c=>c.id===n.col);const isAct=activeDiscuss?.id===n.id;return(
          <button key={n.id} onClick={()=>setActiveDiscuss(n)} style={{background:isAct?"rgba(124,58,237,0.18)":"rgba(255,255,255,0.04)",border:`1.5px solid ${isAct?"#7c3aed":"rgba(255,255,255,0.07)"}`,borderRadius:13,padding:"13px",cursor:"pointer",textAlign:"left",transition:"all 0.2s",borderLeft:`4px solid ${col?.color||"#64748b"}`}}>
            <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:6}}>
              <span style={{fontFamily:"Syne",fontWeight:800,fontSize:12,color:isAct?"#a78bfa":"#64748b"}}>#{i+1}</span>
              <div style={{display:"flex",gap:2}}>{Array.from({length:votes[n.id]||0}).map((_,j)=><span key={j} style={{width:7,height:7,borderRadius:"50%",background:col?.color||"#64748b"}}/>)}</div>
              <span style={{fontSize:10,color:"#475569",marginLeft:"auto"}}>{votes[n.id]||0}v</span>
            </div>
            <div style={{fontFamily:"DM Sans",fontSize:12,color:"#e2e8f0",lineHeight:1.4}}>{n.text}</div>
            <div style={{fontFamily:"Syne",fontSize:9,color:col?.color||"#64748b",marginTop:5,letterSpacing:1}}>{col?.label?.toUpperCase()}</div>
          </button>
        );})}
      </div>

      {activeDiscuss&&(
        <div style={{background:"rgba(124,58,237,0.1)",border:"1px solid rgba(124,58,237,0.3)",borderRadius:16,padding:20}}>
          <div style={{fontFamily:"Syne",fontSize:10,color:"#7c3aed",letterSpacing:2,marginBottom:7}}>NOW DISCUSSING</div>
          <div style={{fontFamily:"Syne",fontSize:17,fontWeight:800,color:"white",marginBottom:14}}>{activeDiscuss.text}</div>
          {["What's the root cause?","Who owns this action?","What does success look like?"].map(q=>(
            <div key={q} style={{fontFamily:"DM Sans",fontSize:13,color:"#94a3b8",display:"flex",gap:9,marginBottom:7,padding:"7px 11px",background:"rgba(255,255,255,0.03)",borderRadius:8}}>
              <span style={{color:"#7c3aed",flexShrink:0}}>›</span>{q}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ── DONE ───────────────────────────────────────────────────────────────
  if(phase==="done") return(
    <div style={{padding:"20px 16px 48px",maxWidth:620,margin:"0 auto"}}>
      <div style={{textAlign:"center",marginBottom:28}}>
        <div style={{fontSize:36,marginBottom:8}}>🎉</div>
        <div style={{fontFamily:"Syne",fontSize:24,fontWeight:800,color:"white",marginBottom:6}}>Retrospective Complete</div>
        <div style={{fontFamily:"DM Sans",fontSize:13,color:"#475569"}}>Great session! Here's what your team covered.</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:20}}>
        {[{label:"Notes",value:totalNotes,color:"#7c3aed"},{label:"Votes",value:totalVotes,color:"#ffd166"},{label:"Discussed",value:Math.min(topNotes.length,6),color:"#06d6a0"}].map(s=>(
          <div key={s.label} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:13,padding:"13px",textAlign:"center"}}>
            <div style={{fontFamily:"Syne",fontSize:26,fontWeight:800,color:s.color}}>{s.value}</div>
            <div style={{fontFamily:"DM Sans",fontSize:11,color:"#475569",marginTop:2}}>{s.label}</div>
          </div>
        ))}
      </div>
      {notes.action_items.length>0&&(
        <div style={{background:"rgba(255,77,109,0.08)",border:"1px solid rgba(255,77,109,0.2)",borderRadius:14,padding:16,marginBottom:16}}>
          <div style={{fontFamily:"Syne",fontSize:10,color:"#ff4d6d",letterSpacing:1,marginBottom:10}}>⚡ ACTION ITEMS</div>
          {notes.action_items.slice(0,4).map((n,i)=><div key={i} style={{fontFamily:"DM Sans",fontSize:13,color:"#e2e8f0",display:"flex",gap:9,marginBottom:7,padding:"7px 11px",background:"rgba(255,255,255,0.03)",borderRadius:8}}><span style={{color:"#ff4d6d",fontFamily:"Syne",fontWeight:700}}>{i+1}.</span>{n.text}</div>)}
        </div>
      )}
      {aiSummary?(
        <div style={{background:"rgba(124,58,237,0.08)",border:"1px solid rgba(124,58,237,0.2)",borderRadius:14,padding:16,marginBottom:16}}>
          <div style={{fontFamily:"Syne",fontSize:10,color:"#7c3aed",letterSpacing:2,marginBottom:7}}>✨ AI COACH SUMMARY</div>
          <div style={{fontFamily:"DM Sans",fontSize:13,color:"#94a3b8",lineHeight:1.6,marginBottom:10}}>{aiSummary.summary}</div>
          {aiSummary.actions?.map((a,i)=><div key={i} style={{fontFamily:"DM Sans",fontSize:13,color:"#e2e8f0",display:"flex",gap:8,marginBottom:5}}><span style={{color:"#7c3aed",fontWeight:700}}>{i+1}.</span>{a}</div>)}
          <div style={{display:"flex",alignItems:"center",gap:7,marginTop:10}}><span style={{fontFamily:"DM Sans",fontSize:11,color:"#475569"}}>Sprint health:</span><span style={{fontFamily:"Syne",fontWeight:700,fontSize:12,color:aiSummary.health==="good"?"#06d6a0":aiSummary.health==="fair"?"#ffd166":"#ff4d6d"}}>{aiSummary.health==="good"?"✅":aiSummary.health==="fair"?"⚠️":"❌"} {aiSummary.health}</span></div>
        </div>
      ):(
        <button onClick={getAI} disabled={aiLoading} style={btn("rgba(124,58,237,0.18)","#a78bfa",{width:"100%",padding:"12px",border:"1px solid rgba(124,58,237,0.3)",marginBottom:16})}>{aiLoading?"✨ Generating…":"✨ Generate AI Coach Summary"}</button>
      )}
      <div style={{display:"flex",gap:10}}>
        <button onClick={()=>{setPhase("lobby");setNotes({went_well:[],improve:[],action_items:[]});setVotes({});setAiSummary(null);}} style={btn("rgba(255,255,255,0.06)","#64748b",{flex:1,padding:"12px"})}>Start New Retro</button>
        <button style={btn("#7c3aed","white",{flex:1,padding:"12px"})}>Export Results</button>
      </div>
    </div>
  );
  return null;
};

// ─────────────────────────────────────────────────────────────────────────────
//  LIVE ACTIVITY
// ─────────────────────────────────────────────────────────────────────────────
const LiveView=({feed})=>(
  <div style={{padding:"20px 16px 48px",maxWidth:540,margin:"0 auto"}}>
    <div style={{fontFamily:"Syne",fontSize:22,fontWeight:800,color:"white",marginBottom:4}}>Live Activity ⚡</div>
    <div style={{fontFamily:"DM Sans",fontSize:13,color:"#475569",marginBottom:18}}>Real-time team updates</div>
    <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:16,marginBottom:14}}>
      <div style={{fontFamily:"Syne",fontSize:9,color:"#475569",letterSpacing:1,marginBottom:12}}>TEAM STATUS</div>
      {TEAM.map(m=>(
        <div key={m.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:11}}>
          <div style={{width:32,height:32,borderRadius:"50%",background:m.color,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Syne",fontWeight:800,fontSize:10,color:"white",flexShrink:0}}>{m.avatar}</div>
          <div style={{flex:1}}><div style={{fontFamily:"DM Sans",fontSize:13,color:"#e2e8f0",fontWeight:500}}>{m.name}</div></div>
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <span style={{width:6,height:6,borderRadius:"50%",background:m.online?"#06d6a0":"#1e293b",boxShadow:m.online?"0 0 6px #06d6a0":"none"}}/>
            <span style={{fontFamily:"DM Sans",fontSize:11,color:m.online?"#06d6a0":"#334155"}}>{m.online?"Online":"Away"}</span>
          </div>
        </div>
      ))}
    </div>
    <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:16}}>
      <div style={{fontFamily:"Syne",fontSize:9,color:"#475569",letterSpacing:1,marginBottom:12}}>ACTIVITY FEED</div>
      {feed.length===0&&<div style={{fontFamily:"DM Sans",fontSize:13,color:"#1e293b",textAlign:"center",padding:"16px 0"}}>Waiting for activity…</div>}
      {feed.map(a=>(
        <div key={a.id} style={{display:"flex",gap:9,marginBottom:9,padding:"8px 11px",background:"rgba(124,58,237,0.06)",borderRadius:10,borderLeft:"2px solid #7c3aed"}}>
          <span style={{width:6,height:6,borderRadius:"50%",background:"#06d6a0",boxShadow:"0 0 5px #06d6a0",marginTop:6,flexShrink:0}}/>
          <div><div style={{fontFamily:"DM Sans",fontSize:13,color:"#e2e8f0"}}>{a.msg}</div><div style={{fontFamily:"DM Sans",fontSize:10,color:"#334155"}}>just now</div></div>
        </div>
      ))}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
//  MODALS
// ─────────────────────────────────────────────────────────────────────────────
const RoomModal=({onClose})=>{
  const code="SPRINT-4X2K",url=`https://sprintvibe.app/join/${code}`;
  const [copied,setCopied]=useState(false);
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.9)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#0d0d1c",border:"1px solid rgba(124,58,237,0.35)",borderRadius:22,padding:26,maxWidth:330,width:"100%",boxShadow:"0 0 70px rgba(124,58,237,0.2)",textAlign:"center"}}>
        <div style={{fontFamily:"Syne",fontSize:10,color:"#7c3aed",letterSpacing:2,marginBottom:8}}>INVITE YOUR TEAM</div>
        <div style={{fontFamily:"Syne",fontSize:19,fontWeight:800,color:"white",marginBottom:3}}>Scan to Join</div>
        <div style={{fontFamily:"DM Sans",fontSize:12,color:"#475569",marginBottom:16}}>Works on iPhone, Android &amp; desktop</div>
        <div style={{background:"white",borderRadius:13,padding:11,display:"inline-block",boxShadow:"0 0 35px rgba(124,58,237,0.3)",marginBottom:13}}><QRCode value={url} size={140}/></div>
        <div style={{background:"rgba(124,58,237,0.12)",borderRadius:11,padding:"8px 14px",marginBottom:9,fontFamily:"Syne",fontSize:17,fontWeight:800,color:"#a78bfa",letterSpacing:4}}>{code}</div>
        <div style={{fontFamily:"DM Sans",fontSize:11,color:"#334155",marginBottom:13,wordBreak:"break-all"}}>{url}</div>
        <button onClick={()=>{navigator.clipboard?.writeText(url).catch(()=>{});setCopied(true);setTimeout(()=>setCopied(false),2000);}} style={btn(copied?"#06d6a0":"#7c3aed",copied?"#0d0d1c":"white",{width:"100%",padding:"12px"})}>{copied?"✓ Copied!":"Copy Invite Link"}</button>
      </div>
    </div>
  );
};

const ExportModal=({stories,onClose})=>{
  const [done,setDone]=useState(null);
  const exportCSV=()=>{ const rows=[["Title","Column","Priority","Points","Tags"]]; Object.entries(stories).forEach(([col,items])=>items.forEach(s=>rows.push([s.title,col,s.priority,s.points||"",s.tags?.join(";")||""]))); const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([rows.map(r=>r.map(c=>`"${c}"`).join(",")).join("\n")],{type:"text/csv"})); a.download="sprintvibe.csv"; a.click(); setDone("csv"); };
  const exportJSON=()=>{ const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([JSON.stringify(stories,null,2)],{type:"application/json"})); a.download="sprintvibe.json"; a.click(); setDone("json"); };
  const plat=[{id:"notion",icon:"📝",name:"Notion",desc:"Export as database",fn:()=>setDone("notion")},{id:"jira",icon:"🔵",name:"Jira",desc:"Push to backlog",fn:()=>setDone("jira")},{id:"linear",icon:"⚡",name:"Linear",desc:"Import to project",fn:()=>setDone("linear")},{id:"slack",icon:"💬",name:"Slack",desc:"Post sprint summary",fn:()=>setDone("slack")},{id:"csv",icon:"📊",name:"CSV",fn:exportCSV,desc:"Spreadsheet"},{id:"json",icon:"{}",name:"JSON",fn:exportJSON,desc:"Raw data"}];
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.9)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#0d0d1c",border:"1px solid rgba(255,255,255,0.08)",borderRadius:22,padding:24,maxWidth:400,width:"100%"}}>
        <div style={{fontFamily:"Syne",fontSize:10,color:"#7c3aed",letterSpacing:2,marginBottom:4}}>INTEGRATIONS</div>
        <div style={{fontFamily:"Syne",fontSize:19,fontWeight:800,color:"white",marginBottom:14}}>Export & Connect</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
          {plat.map(p=>(
            <button key={p.id} onClick={p.fn} style={{background:done===p.id?"rgba(6,214,160,0.09)":"rgba(255,255,255,0.03)",border:`1px solid ${done===p.id?"#06d6a0":"rgba(255,255,255,0.07)"}`,borderRadius:11,padding:"12px",cursor:"pointer",textAlign:"left",transition:"all 0.2s"}}
              onMouseEnter={e=>e.currentTarget.style.borderColor="#7c3aed"} onMouseLeave={e=>e.currentTarget.style.borderColor=done===p.id?"#06d6a0":"rgba(255,255,255,0.07)"}>
              <div style={{fontSize:18,marginBottom:4}}>{done===p.id?"✓":p.icon}</div>
              <div style={{fontFamily:"Syne",fontSize:12,fontWeight:700,color:done===p.id?"#06d6a0":"white",marginBottom:1}}>{p.name}</div>
              <div style={{fontFamily:"DM Sans",fontSize:10,color:"#475569"}}>{done===p.id?"Done!":p.desc}</div>
            </button>
          ))}
        </div>
        <button onClick={onClose} style={btn("rgba(255,255,255,0.05)","#475569",{width:"100%",padding:"10px"})}>Close</button>
      </div>
    </div>
  );
};

const PricingModal=({onClose})=>{
  const plans=[{name:"Solo",price:"$0",color:"#06d6a0",desc:"Solo creators, artists & indie devs",features:["3 projects","Planning poker","Retrospectives","QR join"]},{name:"Pro",price:"$7",color:"#7c3aed",hl:true,desc:"Freelancers & small teams (≤5)",features:["Unlimited projects","All Solo features","AI Coach summary","Notion/Jira export"]},{name:"Team",price:"$19",color:"#ffd166",desc:"Growing teams up to 20",features:["Everything in Pro","20 members","Analytics","Priority support"]},{name:"Corp",price:"$49",color:"#ff4d6d",desc:"Enterprise & agencies",features:["Unlimited members","SSO / SAML","Custom branding","SLA guarantee"]}];
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.94)",zIndex:200,overflowY:"auto",padding:16}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{maxWidth:740,margin:"0 auto",paddingTop:12}}>
        <div style={{textAlign:"center",marginBottom:20}}><div style={{fontFamily:"Syne",fontSize:10,color:"#7c3aed",letterSpacing:2,marginBottom:6}}>PRICING</div><div style={{fontFamily:"Syne",fontSize:24,fontWeight:800,color:"white",marginBottom:6}}>Built for Everyone</div><div style={{fontFamily:"DM Sans",color:"#475569",fontSize:13}}>From solo artists to Fortune 500</div></div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:10,marginBottom:16}}>
          {plans.map(p=>(
            <div key={p.name} style={{background:p.hl?"rgba(124,58,237,0.12)":"rgba(255,255,255,0.03)",border:`1.5px solid ${p.hl?"#7c3aed":"rgba(255,255,255,0.07)"}`,borderRadius:18,padding:16}}>
              {p.hl&&<div style={{fontFamily:"Syne",fontSize:9,color:"#7c3aed",letterSpacing:2,marginBottom:6}}>★ POPULAR</div>}
              <div style={{fontFamily:"Syne",fontSize:14,fontWeight:800,color:p.color,marginBottom:2}}>{p.name}</div>
              <div style={{fontFamily:"Syne",fontSize:24,fontWeight:800,color:"white"}}>{p.price}<span style={{fontSize:11,color:"#475569",fontWeight:400}}>/mo</span></div>
              <div style={{fontFamily:"DM Sans",fontSize:11,color:"#475569",margin:"6px 0 10px",lineHeight:1.4}}>{p.desc}</div>
              {p.features.map(f=><div key={f} style={{fontFamily:"DM Sans",fontSize:11,color:"#94a3b8",marginBottom:4,display:"flex",gap:5}}><span style={{color:p.color}}>✓</span>{f}</div>)}
              <button style={btn(p.hl?"#7c3aed":"rgba(255,255,255,0.05)",p.hl?"white":"#64748b",{width:"100%",padding:"8px",marginTop:12})}>Get Started</button>
            </div>
          ))}
        </div>
        <div style={{textAlign:"center"}}><button onClick={onClose} style={btn("rgba(255,255,255,0.05)","#475569",{padding:"9px 26px"})}>Close</button></div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  ROOT APP
// ─────────────────────────────────────────────────────────────────────────────
export default function SprintVibe(){
  const [stories,setStories]=useState(INIT_STORIES);
  const [modal,setModal]=useState(null);
  const [tab,setTab]=useState("board");
  const [feed,setFeed]=useState([]);
  const [toast,setToast]=useState(null);

  useEffect(()=>{
    const msgs=["Alex K. voted 8 on 'QR code joining'","Jordan M. moved a card → Sprint Ready","Riley C. joined the room","Sam P. added a retro note","Alex K. accepted 13 pts on 'Poker engine'"];
    let i=0;
    const t=setInterval(()=>{const m=msgs[i%msgs.length];setFeed(p=>[{id:Date.now(),msg:m},...p].slice(0,6));setToast(m);setTimeout(()=>setToast(null),3200);i++;},7500);
    return()=>clearInterval(t);
  },[]);

  const drop=(cid,from,to)=>{if(from===to)return;setStories(p=>{const card=p[from]?.find(s=>s.id===cid);if(!card)return p;return{...p,[from]:p[from].filter(s=>s.id!==cid),[to]:[...(p[to]||[]),card]};});};
  const score=(id,pts)=>setStories(p=>{const u={};for(const c in p)u[c]=p[c].map(s=>s.id===id?{...s,points:pts}:s);return u;});
  const addStory=(col,story)=>setStories(p=>({...p,[col]:[...(p[col]||[]),story]}));

  const allPts=Object.values(stories).flat().reduce((a,s)=>a+(parseInt(s.points)||0),0);
  const donePts=(stories.done||[]).reduce((a,s)=>a+(parseInt(s.points)||0),0);
  const prog=allPts?Math.round(donePts/allPts*100):0;
  const online=TEAM.filter(m=>m.online);
  const TABS=[{id:"board",l:"📋 Board"},{id:"poker",l:"🃏 Poker"},{id:"retro",l:"🏁 Retro"},{id:"live",l:"⚡ Live"}];

  return(
    <>
      <FontLoader/>
      <style>{`
        *{-webkit-tap-highlight-color:transparent;}
        @keyframes flipIn{from{opacity:0;transform:rotateY(90deg)}to{opacity:1;transform:rotateY(0)}}
        @keyframes slideUp{from{opacity:0;transform:translateX(-50%) translateY(12px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        @keyframes noteIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:0.4}50%{opacity:1}}
        select option{background:#0d0d1c}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-thumb{background:rgba(124,58,237,0.3);border-radius:2px}
        ::-webkit-scrollbar-track{background:transparent}
        input,textarea,select{-webkit-appearance:none;}
      `}</style>

      <div style={{minHeight:"100vh",background:"#08080f",backgroundImage:"radial-gradient(ellipse 70% 40% at 50% -10%,rgba(124,58,237,0.18) 0%,transparent 60%)",fontFamily:"DM Sans"}}>

        {/* Toast */}
        {toast&&<div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:"rgba(13,13,28,0.97)",border:"1px solid rgba(124,58,237,0.4)",borderRadius:12,padding:"10px 16px",zIndex:500,fontFamily:"DM Sans",fontSize:13,color:"#e2e8f0",display:"flex",alignItems:"center",gap:10,boxShadow:"0 8px 32px rgba(0,0,0,0.5)",animation:"slideUp 0.3s ease",whiteSpace:"nowrap",maxWidth:"calc(100vw - 32px)"}}>
          <span style={{width:7,height:7,borderRadius:"50%",background:"#06d6a0",boxShadow:"0 0 8px #06d6a0",flexShrink:0}}/>{toast}
        </div>}

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div style={{padding:"12px 16px",borderBottom:"1px solid rgba(255,255,255,0.05)",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap",background:"rgba(0,0,0,0.4)",backdropFilter:"blur(16px)",position:"sticky",top:0,zIndex:100}}>
          <div>
            <div style={{fontFamily:"Syne",fontWeight:800,fontSize:17,color:"white",letterSpacing:-0.5}}>Sprint<span style={{color:"#7c3aed"}}>Vibe</span><span style={{fontSize:9,background:"rgba(124,58,237,0.2)",color:"#a78bfa",padding:"2px 6px",borderRadius:4,marginLeft:6,letterSpacing:1}}>BETA</span></div>
            <div style={{fontSize:10,color:"#334155"}}>Sprint 7 — Q2 Launch</div>
          </div>
          {/* Progress */}
          <div style={{flex:1,minWidth:80,maxWidth:160}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:9,color:"#475569"}}>Progress</span><span style={{fontSize:9,color:"#7c3aed",fontFamily:"Syne",fontWeight:700}}>{prog}%</span></div>
            <div style={{background:"rgba(255,255,255,0.07)",borderRadius:4,height:4}}><div style={{width:`${prog}%`,background:"linear-gradient(90deg,#7c3aed,#a78bfa)",height:"100%",borderRadius:4,transition:"width 0.6s"}}/></div>
          </div>
          {/* Avatars */}
          <div style={{display:"flex",alignItems:"center"}}>
            {online.map((m,i)=><div key={m.id} title={m.name} style={{width:26,height:26,borderRadius:"50%",background:m.color,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Syne",fontWeight:800,fontSize:9,color:"white",border:"2px solid #08080f",marginLeft:i>0?-8:0,zIndex:10-i}}>{m.avatar}</div>)}
            <span style={{fontFamily:"DM Sans",fontSize:11,color:"#475569",marginLeft:7}}>{online.length} online</span>
          </div>
          {/* Actions */}
          <div style={{display:"flex",gap:6,marginLeft:"auto",flexWrap:"wrap"}}>
            <button onClick={()=>setModal("room")}   style={btn("#7c3aed","white",{padding:"7px 12px"})}>📱 Invite</button>
            <button onClick={()=>setModal("export")} style={btn("rgba(255,255,255,0.07)","#94a3b8",{padding:"7px 12px"})}>↗</button>
            <button onClick={()=>setModal("pricing")} style={btn("rgba(255,255,255,0.07)","#94a3b8",{padding:"7px 12px"})}>💎</button>
          </div>
        </div>

        {/* ── Compatibility notice (shows once) ──────────────────────────── */}
        {tab==="board"&&(
          <div style={{background:"rgba(6,214,160,0.07)",borderBottom:"1px solid rgba(6,214,160,0.12)",padding:"7px 16px",display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <span style={{fontSize:12}}>✅</span>
            <span style={{fontFamily:"DM Sans",fontSize:12,color:"#64748b"}}>Works on <strong style={{color:"#06d6a0"}}>PC</strong>, <strong style={{color:"#06d6a0"}}>iPhone</strong> &amp; <strong style={{color:"#06d6a0"}}>Android</strong> — drag &amp; drop on desktop, touch-drag on mobile, QR scan from any camera app</span>
          </div>
        )}

        {/* ── Tab bar ────────────────────────────────────────────────────── */}
        <div style={{padding:"12px 16px 0",display:"flex",gap:3,overflowX:"auto"}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"7px 14px",borderRadius:"10px 10px 0 0",background:tab===t.id?"rgba(124,58,237,0.15)":"transparent",border:`1px solid ${tab===t.id?"rgba(124,58,237,0.3)":"rgba(255,255,255,0.05)"}`,borderBottom:tab===t.id?"1px solid rgba(124,58,237,0.15)":"1px solid rgba(255,255,255,0.05)",color:tab===t.id?"#a78bfa":"#334155",cursor:"pointer",fontFamily:"Syne",fontWeight:700,fontSize:12,whiteSpace:"nowrap",flexShrink:0}}>{t.l}</button>
          ))}
        </div>

        {/* ── Tab content ────────────────────────────────────────────────── */}
        {tab==="board"&&(
          <div style={{padding:"16px 16px 48px",overflowX:"auto"}}>
            <div style={{display:"flex",gap:12,minWidth:820}}>
              {COLUMNS.map(col=><DropColumn key={col.id} id={col.id} title={col.title} color={col.color} stories={stories[col.id]||[]} onDrop={drop} onAdd={addStory}/>)}
            </div>
            <div style={{marginTop:10,fontFamily:"DM Sans",fontSize:11,color:"#1e293b"}}>💡 Drag cards between columns · Touch-drag on mobile · Use 🃏 Poker to estimate</div>
          </div>
        )}
        {tab==="poker" &&<PokerSession stories={stories} onScore={score}/>}
        {tab==="retro"  &&<RetroView/>}
        {tab==="live"   &&<LiveView feed={feed}/>}

        {/* ── Modals ─────────────────────────────────────────────────────── */}
        {modal==="room"    &&<RoomModal    onClose={()=>setModal(null)}/>}
        {modal==="export"  &&<ExportModal  stories={stories} onClose={()=>setModal(null)}/>}
        {modal==="pricing" &&<PricingModal onClose={()=>setModal(null)}/>}
      </div>
    </>
  );
}
