import { useState, useEffect, useRef } from "react";
import { supabase, createRoom, findRoom, joinRoom, leaveRoom,
         castPokerVote, revealPokerVotes, getPokerVotes,
         addRetroNote, voteRetroNote, getRetroNotes,
         getParticipants, setPhase, generateCode,
         signUp, signIn, signInWithGoogle, signOut } from "./lib/supabase";

// ─────────────────────────────────────────────────────────────
//  FONTS
// ─────────────────────────────────────────────────────────────
const FontLoader = () => {
  useEffect(() => {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@400;500;600&display=swap";
    document.head.appendChild(l);
  }, []);
  return null;
};

// ─────────────────────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────────────────────
const POKER_VALUES = ["1","2","3","5","8","13","21","40","?","☕"];
const COLUMNS = [
  { id:"backlog",     title:"Backlog",      color:"#64748b" },
  { id:"sprint",      title:"Sprint Ready", color:"#ffd166" },
  { id:"in_progress", title:"In Progress",  color:"#7c3aed" },
  { id:"done",        title:"Done ✓",       color:"#06d6a0" },
];
const RETRO_COLS = [
  { id:"went_well",    label:"Went Well",   emoji:"✅", color:"#06d6a0" },
  { id:"improve",      label:"To Improve",  emoji:"🔧", color:"#ffd166" },
  { id:"action_items", label:"Action Items",emoji:"⚡", color:"#ff4d6d" },
];
const TIMER_PRESETS = [
  { label:"1 min",  seconds:60  },
  { label:"2 min",  seconds:120 },
  { label:"3 min",  seconds:180 },
  { label:"5 min",  seconds:300 },
  { label:"10 min", seconds:600 },
  { label:"No limit", seconds:0 },
];
const COLORS = ["#7c3aed","#06d6a0","#ffd166","#ff4d6d","#38bdf8","#fb7185","#a3e635","#f97316"];

// ─────────────────────────────────────────────────────────────
//  STYLE HELPERS
// ─────────────────────────────────────────────────────────────
const btn = (bg, color="white", ex={}) => ({
  background:bg, color, border:"none", borderRadius:10,
  padding:"8px 14px", cursor:"pointer",
  fontFamily:"Syne", fontWeight:700, fontSize:12,
  transition:"all 0.18s", ...ex,
});
const inp = (ex={}) => ({
  background:"rgba(255,255,255,0.06)",
  border:"1px solid rgba(255,255,255,0.1)",
  borderRadius:9, padding:"9px 12px",
  color:"white", fontFamily:"DM Sans", fontSize:13,
  outline:"none", width:"100%", boxSizing:"border-box", ...ex,
});

// ─────────────────────────────────────────────────────────────
//  QR CODE SVG
// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
//  REAL QR CODE — generated via free API, scannable on any phone
// ─────────────────────────────────────────────────────────────
const QRCode = ({ value, size=150 }) => {
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&margin=10&bgcolor=ffffff&color=0d0d1c`;
  return (
    <img
      src={url}
      width={size}
      height={size}
      alt="Scan to join"
      style={{ display:"block", borderRadius:8 }}
    />
  );
};

// ─────────────────────────────────────────────────────────────
//  COUNTDOWN RING
// ─────────────────────────────────────────────────────────────
const CountdownRing = ({ seconds, total, label, warn=60, danger=30 }) => {
  const r=28, circ=2*Math.PI*r;
  const pct=total>0?Math.max(0,seconds/total):0;
  const stroke=seconds<=danger?"#ff4d6d":seconds<=warn?"#ffd166":"#7c3aed";
  const mm=Math.floor(seconds/60), ss=String(seconds%60).padStart(2,"0");
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
      <svg width={70} height={70} style={{transform:"rotate(-90deg)"}}>
        <circle cx={35} cy={35} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={5}/>
        <circle cx={35} cy={35} r={r} fill="none" stroke={stroke} strokeWidth={5}
          strokeDasharray={circ} strokeDashoffset={circ*(1-pct)} strokeLinecap="round"
          style={{transition:"stroke-dashoffset 1s linear,stroke 0.3s"}}/>
      </svg>
      <div style={{position:"relative",marginTop:-52,display:"flex",flexDirection:"column",alignItems:"center"}}>
        <div style={{fontFamily:"Syne",fontWeight:800,fontSize:15,color:stroke}}>{mm}:{ss}</div>
      </div>
      <div style={{fontFamily:"DM Sans",fontSize:10,color:"#475569",marginTop:20}}>{label}</div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  PHASE TIMER HOOK
// ─────────────────────────────────────────────────────────────
const usePhaseTimer = (active, totalSeconds) => {
  const [remaining, setRemaining] = useState(totalSeconds);
  const [paused, setPaused] = useState(false);
  const ref = useRef(null);
  useEffect(() => { setRemaining(totalSeconds); setPaused(false); }, [totalSeconds]);
  useEffect(() => {
    if (!active || paused || remaining <= 0 || totalSeconds === 0) { clearInterval(ref.current); return; }
    ref.current = setInterval(() => setRemaining(r => r <= 1 ? (clearInterval(ref.current), 0) : r - 1), 1000);
    return () => clearInterval(ref.current);
  }, [active, paused, remaining, totalSeconds]);
  return { remaining, paused, pause:()=>setPaused(true), resume:()=>setPaused(false), reset:()=>setRemaining(totalSeconds) };
};

// ─────────────────────────────────────────────────────────────
//  QR JOIN BANNER
// ─────────────────────────────────────────────────────────────
const QRJoinBanner = ({ roomCode, url, participants=[] }) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  return(
    <div style={{background:"rgba(124,58,237,0.08)",border:"1px solid rgba(124,58,237,0.25)",borderRadius:16,overflow:"hidden",marginBottom:20}}>
      <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",cursor:"pointer"}} onClick={()=>setExpanded(e=>!e)}>
        <div style={{width:8,height:8,borderRadius:"50%",background:"#06d6a0",boxShadow:"0 0 8px #06d6a0",flexShrink:0}}/>
        <div style={{flex:1}}>
          <span style={{fontFamily:"Syne",fontWeight:700,fontSize:13,color:"white"}}>Room: </span>
          <span style={{fontFamily:"Syne",fontWeight:800,fontSize:13,color:"#a78bfa",letterSpacing:2}}>{roomCode}</span>
          <span style={{fontFamily:"DM Sans",fontSize:12,color:"#475569",marginLeft:10}}>{participants.length} in room</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <button onClick={e=>{e.stopPropagation();navigator.clipboard?.writeText(url).catch(()=>{});setCopied(true);setTimeout(()=>setCopied(false),2000);}}
            style={btn(copied?"#06d6a0":"rgba(124,58,237,0.3)",copied?"#0d0d1c":"#a78bfa",{padding:"5px 12px",fontSize:11})}>
            {copied?"✓ Copied":"📋 Copy Link"}
          </button>
          <span style={{color:"#475569",fontSize:14,transform:expanded?"rotate(180deg)":"none",transition:"transform 0.2s"}}>▾</span>
        </div>
      </div>
      {expanded&&(
        <div style={{borderTop:"1px solid rgba(124,58,237,0.2)",padding:20,display:"flex",gap:20,alignItems:"flex-start",flexWrap:"wrap"}}>
          <div style={{background:"white",borderRadius:12,padding:10,boxShadow:"0 0 30px rgba(124,58,237,0.35)",flexShrink:0}}>
            <QRCode value={url} size={120}/>
          </div>
          <div style={{flex:1,minWidth:160}}>
            <div style={{fontFamily:"Syne",fontSize:11,color:"#64748b",letterSpacing:1,marginBottom:8}}>SCAN TO JOIN</div>
            <div style={{fontFamily:"DM Sans",fontSize:13,color:"#94a3b8",lineHeight:1.6,marginBottom:10}}>Works on iPhone, Android &amp; desktop — no app needed.</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {participants.map(p=>(
                <div key={p.id} style={{display:"flex",alignItems:"center",gap:5,background:"rgba(255,255,255,0.04)",borderRadius:8,padding:"4px 10px"}}>
                  <span style={{width:5,height:5,borderRadius:"50%",background:p.online?"#06d6a0":"#334155",boxShadow:p.online?"0 0 5px #06d6a0":"none"}}/>
                  <span style={{fontFamily:"DM Sans",fontSize:11,color:"#94a3b8"}}>{p.display_name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  ONBOARDING SCREEN — shown before anything else
// ─────────────────────────────────────────────────────────────
const Onboarding = ({ onEnter }) => {
  // Read ?join=CODE from URL immediately
  const urlCode = new URLSearchParams(window.location.search).get("join") || "";

  const [mode, setMode] = useState(urlCode ? "join" : "welcome");
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState(urlCode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGuest = async (type) => {
    if (!name.trim()) { setError("Please enter your name first"); return; }
    setLoading(true); setError("");
    try {
      const userId = `guest_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const color  = COLORS[Math.floor(Math.random()*COLORS.length)];
      if (type === "create") {
        const room = await createRoom("board", userId);
        await joinRoom(room.id, userId, name.trim(), "host");
        onEnter({ userId, displayName:name.trim(), color, room, role:"host" });
      } else {
        if (!roomCode.trim()) { setError("Please enter a room code"); setLoading(false); return; }
        const room = await findRoom(roomCode.trim());
        await joinRoom(room.id, userId, name.trim(), "participant");
        onEnter({ userId, displayName:name.trim(), color, room, role:"participant" });
      }
    } catch(e) {
      setError(type==="join" ? "Room not found — check the code and try again" : "Something went wrong. Please try again.");
    } finally { setLoading(false); }
  };

  const handleAuth = async (isSignUp) => {
    if (!email.trim()||!password.trim()) { setError("Please fill in all fields"); return; }
    setLoading(true); setError("");
    try {
      const { data, error:authErr } = isSignUp
        ? await signUp(email, password, name||email.split("@")[0])
        : await signIn(email, password);
      if (authErr) throw authErr;
      const user = data.user;
      const displayName = user.user_metadata?.display_name || email.split("@")[0];
      const color = COLORS[Math.floor(Math.random()*COLORS.length)];
      const room = await createRoom("board", user.id);
      await joinRoom(room.id, user.id, displayName, "host");
      onEnter({ userId:user.id, displayName, color, room, role:"host", user });
    } catch(e) { setError(e.message||"Authentication failed"); }
    finally { setLoading(false); }
  };

  const S = { maxWidth:440, margin:"0 auto", padding:"20px 16px 48px" };

  if (mode==="welcome") return(
    <div style={S}>
      <div style={{textAlign:"center",marginBottom:40,paddingTop:40}}>
        <div style={{fontFamily:"Syne",fontWeight:800,fontSize:36,color:"white",letterSpacing:-1,marginBottom:8}}>
          Sprint<span style={{color:"#7c3aed"}}>Vibe</span>
        </div>
        <div style={{fontFamily:"DM Sans",fontSize:15,color:"#64748b",lineHeight:1.6}}>
          Sprint planning, poker &amp; retrospectives<br/>for every team — from solo to corporate
        </div>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:24}}>
        <button onClick={()=>setMode("create")} style={btn("#7c3aed","white",{padding:"16px",fontSize:15,borderRadius:14})}>
          🚀 Create a new room
        </button>
        <button onClick={()=>setMode("join")} style={btn("rgba(255,255,255,0.06)","white",{padding:"16px",fontSize:15,borderRadius:14,border:"1px solid rgba(255,255,255,0.1)"})}>
          🔗 Join with a room code
        </button>
        <button onClick={()=>setMode("login")} style={btn("rgba(255,255,255,0.03)","#64748b",{padding:"16px",fontSize:15,borderRadius:14,border:"1px solid rgba(255,255,255,0.06)"})}>
          🔐 Sign in / Create account
        </button>
      </div>

      <div style={{textAlign:"center",fontFamily:"DM Sans",fontSize:12,color:"#334155"}}>
        No account needed to create or join a room
      </div>
    </div>
  );

  if (mode==="create"||mode==="join") return(
    <div style={S}>
      {!urlCode && <button onClick={()=>setMode("welcome")} style={btn("rgba(255,255,255,0.06)","#64748b",{marginBottom:24})}>← Back</button>}

      {/* Special header when joining via QR */}
      {mode==="join" && urlCode ? (
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:40,marginBottom:10}}>👋</div>
          <div style={{fontFamily:"Syne",fontSize:24,fontWeight:800,color:"white",marginBottom:6}}>You're invited!</div>
          <div style={{fontFamily:"DM Sans",fontSize:13,color:"#64748b",marginBottom:12}}>Enter your name to join the room</div>
          <div style={{background:"rgba(124,58,237,0.12)",border:"1px solid rgba(124,58,237,0.3)",borderRadius:12,padding:"10px 16px",display:"inline-block"}}>
            <div style={{fontFamily:"DM Sans",fontSize:10,color:"#64748b",marginBottom:2}}>ROOM CODE</div>
            <div style={{fontFamily:"Syne",fontSize:20,fontWeight:800,color:"#a78bfa",letterSpacing:3}}>{roomCode}</div>
          </div>
        </div>
      ) : (
        <>
          <div style={{fontFamily:"Syne",fontSize:24,fontWeight:800,color:"white",marginBottom:6}}>
            {mode==="create"?"Create a Room":"Join a Room"}
          </div>
          <div style={{fontFamily:"DM Sans",fontSize:13,color:"#64748b",marginBottom:24}}>
            {mode==="create"?"You'll be the host — share the room code with your team":"Enter the room code your host shared with you"}
          </div>
        </>
      )}

      <div style={{marginBottom:14}}>
        <div style={{fontFamily:"DM Sans",fontSize:11,color:"#475569",marginBottom:6}}>Your name</div>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Alex" style={inp()} autoFocus/>
      </div>

      {/* Only show room code input if NOT coming from QR */}
      {mode==="join" && !urlCode && (
        <div style={{marginBottom:14}}>
          <div style={{fontFamily:"DM Sans",fontSize:11,color:"#475569",marginBottom:6}}>Room code</div>
          <input value={roomCode} onChange={e=>setRoomCode(e.target.value.toUpperCase())} placeholder="e.g. BOARD-7X9P" style={inp({fontFamily:"Syne",letterSpacing:2,fontSize:15})}/>
        </div>
      )}

      {error&&<div style={{background:"rgba(255,77,109,0.1)",border:"1px solid rgba(255,77,109,0.2)",borderRadius:9,padding:"9px 12px",marginBottom:14,fontFamily:"DM Sans",fontSize:13,color:"#ff4d6d"}}>{error}</div>}

      <button onClick={()=>handleGuest(mode)} disabled={loading}
        style={btn("#7c3aed","white",{width:"100%",padding:"14px",fontSize:14,opacity:loading?0.6:1})}>
        {loading?"Joining…":mode==="create"?"Create Room & Enter →":"Join Room →"}
      </button>
    </div>
  );

  if (mode==="login") return(
    <div style={S}>
      <button onClick={()=>setMode("welcome")} style={btn("rgba(255,255,255,0.06)","#64748b",{marginBottom:24})}>← Back</button>
      <div style={{fontFamily:"Syne",fontSize:24,fontWeight:800,color:"white",marginBottom:6}}>Sign In</div>
      <div style={{fontFamily:"DM Sans",fontSize:13,color:"#64748b",marginBottom:24}}>Save your rooms and access them from any device</div>

      <button onClick={()=>signInWithGoogle()} style={btn("rgba(255,255,255,0.07)","white",{width:"100%",padding:"13px",fontSize:13,marginBottom:16,border:"1px solid rgba(255,255,255,0.1)"})}>
        🌐 Continue with Google
      </button>

      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
        <div style={{flex:1,height:1,background:"rgba(255,255,255,0.06)"}}/>
        <span style={{fontFamily:"DM Sans",fontSize:12,color:"#334155"}}>or email</span>
        <div style={{flex:1,height:1,background:"rgba(255,255,255,0.06)"}}/>
      </div>

      {["Email","Password"].map(f=>(
        <div key={f} style={{marginBottom:12}}>
          <div style={{fontFamily:"DM Sans",fontSize:11,color:"#475569",marginBottom:5}}>{f}</div>
          <input type={f==="Password"?"password":"email"}
            value={f==="Email"?email:password}
            onChange={e=>f==="Email"?setEmail(e.target.value):setPassword(e.target.value)}
            placeholder={f==="Email"?"you@example.com":"••••••••"}
            style={inp()}/>
        </div>
      ))}

      {error&&<div style={{background:"rgba(255,77,109,0.1)",border:"1px solid rgba(255,77,109,0.2)",borderRadius:9,padding:"9px 12px",marginBottom:14,fontFamily:"DM Sans",fontSize:13,color:"#ff4d6d"}}>{error}</div>}

      <div style={{display:"flex",gap:10,marginTop:4}}>
        <button onClick={()=>handleAuth(false)} disabled={loading} style={btn("#7c3aed","white",{flex:1,padding:"12px"})}>
          {loading?"…":"Sign In"}
        </button>
        <button onClick={()=>handleAuth(true)} disabled={loading} style={btn("rgba(255,255,255,0.06)","#94a3b8",{flex:1,padding:"12px"})}>
          {loading?"…":"Sign Up"}
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  KANBAN CARD
// ─────────────────────────────────────────────────────────────
const KanbanCard = ({ story, columnId, onDrop }) => {
  const [dragging,setDragging]=useState(false);
  const PC={high:"#ff4d6d",medium:"#ffd166",low:"#06d6a0"};
  const tr=useRef(null);
  const onTS=e=>{const t=e.touches[0];tr.current={x:t.clientX,y:t.clientY};};
  const onTE=e=>{if(!tr.current)return;const t=e.changedTouches[0];const col=document.elementFromPoint(t.clientX,t.clientY)?.closest("[data-col]");if(col&&col.dataset.col!==columnId)onDrop(story.id,columnId,col.dataset.col);tr.current=null;};
  return(
    <div draggable onDragStart={e=>{setDragging(true);e.dataTransfer.setData("cid",story.id);e.dataTransfer.setData("from",columnId);}} onDragEnd={()=>setDragging(false)} onTouchStart={onTS} onTouchEnd={onTE}
      style={{background:dragging?"rgba(124,58,237,0.14)":"rgba(255,255,255,0.06)",border:`1px solid ${dragging?"#7c3aed":"rgba(255,255,255,0.09)"}`,borderRadius:12,padding:"11px 13px",marginBottom:9,cursor:"grab",opacity:dragging?0.5:1,transition:"all 0.18s",userSelect:"none",touchAction:"none"}}>
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

// ─────────────────────────────────────────────────────────────
//  DROP COLUMN
// ─────────────────────────────────────────────────────────────
const DropColumn = ({ id, title, stories, color, onDrop, onAdd }) => {
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
    <div data-col={id} onDragOver={e=>{e.preventDefault();setOver(true);}} onDragLeave={e=>{if(!e.currentTarget.contains(e.relatedTarget))setOver(false);}} onDrop={e=>{e.preventDefault();setOver(false);const cid=e.dataTransfer.getData("cid");const fr=e.dataTransfer.getData("from");if(cid&&fr!==id)onDrop(cid,fr,id);}}
      style={{flex:"0 0 250px",background:over?"rgba(124,58,237,0.09)":"rgba(255,255,255,0.025)",border:`1.5px solid ${over?"#7c3aed":"rgba(255,255,255,0.07)"}`,borderRadius:16,padding:14,transition:"all 0.2s",minHeight:420,display:"flex",flexDirection:"column"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
        <span style={{width:9,height:9,borderRadius:3,background:color}}/><span style={{fontFamily:"Syne",fontWeight:700,color:"#e2e8f0",fontSize:13}}>{title}</span>
        <span style={{marginLeft:"auto",background:"rgba(255,255,255,0.07)",borderRadius:20,padding:"1px 8px",fontSize:11,color:"#475569"}}>{stories.length}</span>
      </div>
      <div style={{flex:1}}>
        {stories.map(s=><KanbanCard key={s.id} story={s} columnId={id} onDrop={onDrop}/>)}
        {stories.length===0&&!adding&&<div style={{textAlign:"center",color:"#1e293b",fontSize:12,marginTop:32,fontFamily:"DM Sans"}}>No stories yet</div>}
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

// ─────────────────────────────────────────────────────────────
//  PLANNING POKER
// ─────────────────────────────────────────────────────────────
const PokerSession = ({ stories, session, roomUrl }) => {
  const { userId, displayName, room, role } = session;
  const [step, setStep] = useState("pick");
  const [ticket, setTicket] = useState(null);
  const [myVote, setMyVote] = useState(null);
  const [liveVotes, setLiveVotes] = useState([]);
  const [revealed, setRevealed] = useState(false);
  const PC = { high:"#ff4d6d", medium:"#ffd166", low:"#06d6a0" };

  // Subscribe to live votes
  useEffect(() => {
    if (!ticket || !room) return;
    const load = async () => {
      const votes = await getPokerVotes(room.id, ticket.id);
      setLiveVotes(votes);
    };
    load();
    const ch = supabase.channel(`poker:${room.id}:${ticket.id}`)
      .on("postgres_changes", { event:"*", schema:"public", table:"poker_votes", filter:`room_id=eq.${room.id}` }, load)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [ticket, room]);

  const castVote = async (val) => {
    setMyVote(val);
    await castPokerVote(room.id, ticket.id, ticket.title, userId, displayName, val);
  };

  const reveal = async () => {
    await revealPokerVotes(room.id, ticket.id);
    setRevealed(true);
  };

  const allStories = Object.entries(stories).flatMap(([col,items])=>items.map(s=>({...s,col})));
  const myVoteRecord = liveVotes.find(v => v.user_id === userId);
  const allVotesRevealed = liveVotes.length > 0 && liveVotes.every(v => v.revealed);
  const nums = allVotesRevealed ? liveVotes.map(v=>parseFloat(v.vote)).filter(n=>!isNaN(n)) : [];
  const avg = nums.length ? (nums.reduce((a,b)=>a+b,0)/nums.length).toFixed(1) : null;
  const fib = [1,2,3,5,8,13,21,40];
  const suggested = avg ? fib.reduce((p,c)=>Math.abs(c-avg)<Math.abs(p-avg)?c:p) : null;

  if (step==="pick") return(
    <div style={{padding:"20px 16px 48px"}}>
      <QRJoinBanner roomCode={room.code} url={roomUrl} participants={[]}/>
      <div style={{textAlign:"center",marginBottom:28}}>
        <div style={{fontSize:36,marginBottom:8}}>🃏</div>
        <div style={{fontFamily:"Syne",fontSize:24,fontWeight:800,color:"white",marginBottom:6}}>Sprint Poker</div>
        <div style={{fontFamily:"DM Sans",fontSize:13,color:"#475569",maxWidth:320,margin:"0 auto",lineHeight:1.6}}>
          {allStories.length===0 ? "Add stories to your board first, then come back here to estimate them." : "Pick a ticket to estimate with your team."}
        </div>
      </div>
      {allStories.length===0 ? (
        <div style={{textAlign:"center",padding:"40px 20px",background:"rgba(255,255,255,0.03)",border:"1px dashed rgba(255,255,255,0.08)",borderRadius:16,maxWidth:400,margin:"0 auto"}}>
          <div style={{fontSize:32,marginBottom:12}}>📋</div>
          <div style={{fontFamily:"Syne",fontSize:14,fontWeight:700,color:"#475569",marginBottom:6}}>No stories yet</div>
          <div style={{fontFamily:"DM Sans",fontSize:13,color:"#334155"}}>Go to the Board tab and add some stories first</div>
        </div>
      ) : (
        <div style={{maxWidth:540,margin:"0 auto"}}>
          {COLUMNS.map(col=>{const cs=stories[col.id]||[];if(!cs.length)return null;return(
            <div key={col.id} style={{marginBottom:22}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <span style={{width:8,height:8,borderRadius:3,background:col.color}}/>
                <span style={{fontFamily:"Syne",fontSize:11,fontWeight:700,color:"#64748b",letterSpacing:1}}>{col.title.toUpperCase()}</span>
              </div>
              {cs.map(story=>(
                <button key={story.id} onClick={()=>{setTicket(story);setMyVote(null);setLiveVotes([]);setRevealed(false);setStep("vote");}}
                  style={{width:"100%",marginBottom:7,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:"13px 16px",cursor:"pointer",textAlign:"left",transition:"all 0.18s",display:"flex",alignItems:"center",gap:12}}
                  onMouseEnter={e=>{e.currentTarget.style.background="rgba(124,58,237,0.12)";e.currentTarget.style.borderColor="#7c3aed";}}
                  onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.04)";e.currentTarget.style.borderColor="rgba(255,255,255,0.07)";}}>
                  <span style={{width:8,height:8,borderRadius:"50%",background:PC[story.priority]||"#888",flexShrink:0}}/>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:"DM Sans",fontSize:14,fontWeight:600,color:"#e2e8f0",marginBottom:2}}>{story.title}</div>
                    {story.description&&<div style={{fontFamily:"DM Sans",fontSize:12,color:"#475569"}}>{story.description}</div>}
                  </div>
                  {story.points?<span style={{background:"#7c3aed",color:"white",borderRadius:6,padding:"2px 8px",fontSize:11,fontFamily:"Syne",fontWeight:700}}>{story.points}pt</span>:<span style={{background:"rgba(255,255,255,0.05)",color:"#475569",borderRadius:6,padding:"2px 8px",fontSize:11}}>no est.</span>}
                  <span style={{color:"#334155",fontSize:18}}>›</span>
                </button>
              ))}
            </div>
          );})}
        </div>
      )}
    </div>
  );

  if (step==="vote") return(
    <div style={{padding:"20px 16px 48px",maxWidth:540,margin:"0 auto"}}>
      <button onClick={()=>setStep("pick")} style={btn("rgba(255,255,255,0.06)","#64748b",{marginBottom:16})}>← Back</button>
      <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,padding:"13px 16px",marginBottom:24}}>
        <span style={{width:8,height:8,borderRadius:"50%",background:PC[ticket.priority]||"#888",display:"inline-block",marginRight:8}}/>
        <span style={{fontFamily:"Syne",fontSize:15,fontWeight:800,color:"white"}}>{ticket.title}</span>
        {ticket.description&&<div style={{fontFamily:"DM Sans",fontSize:12,color:"#475569",marginTop:4}}>{ticket.description}</div>}
      </div>

      {/* Live participant vote cards */}
      {liveVotes.length > 0 && (
        <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:24}}>
          {liveVotes.map(v=>(
            <div key={v.id} style={{textAlign:"center",minWidth:64}}>
              <div style={{width:64,height:88,borderRadius:12,marginBottom:6,border:`2px solid ${v.vote?"#7c3aed":"rgba(255,255,255,0.08)"}`,background:v.vote?"rgba(124,58,237,0.2)":"rgba(255,255,255,0.03)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:v.revealed?22:16,fontFamily:"Syne",fontWeight:800,color:"white",transition:"all 0.3s"}}>
                {v.revealed ? v.vote : v.vote ? "✓" : "…"}
              </div>
              <div style={{fontFamily:"DM Sans",fontSize:10,color:"#475569"}}>{v.display_name.split(" ")[0]}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{fontFamily:"DM Sans",fontSize:12,color:"#475569",textAlign:"center",marginBottom:12}}>
        {myVoteRecord ? `You voted ${myVoteRecord.vote} · ${liveVotes.length} vote${liveVotes.length!==1?"s":""} cast` : "Pick your estimate"}
      </div>

      <div style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center",marginBottom:24}}>
        {POKER_VALUES.map(v=>(
          <button key={v} onClick={()=>castVote(v)} style={{width:52,height:70,borderRadius:12,cursor:"pointer",border:`2px solid ${myVoteRecord?.vote===v?"#7c3aed":"rgba(255,255,255,0.1)"}`,background:myVoteRecord?.vote===v?"#7c3aed":"rgba(255,255,255,0.04)",color:"white",fontFamily:"Syne",fontWeight:800,fontSize:16,transition:"all 0.18s",transform:myVoteRecord?.vote===v?"translateY(-8px) scale(1.08)":"none",boxShadow:myVoteRecord?.vote===v?"0 12px 28px rgba(124,58,237,0.5)":"none"}}>{v}</button>
        ))}
      </div>

      {role==="host" && liveVotes.length>0 && !allVotesRevealed && (
        <button onClick={reveal} style={btn("#7c3aed","white",{width:"100%",padding:"13px",fontSize:14})}>
          🃏 Reveal All Cards ({liveVotes.length} vote{liveVotes.length!==1?"s":""})
        </button>
      )}

      {allVotesRevealed && avg && (
        <>
          <div style={{background:"rgba(6,214,160,0.08)",border:"1px solid rgba(6,214,160,0.25)",borderRadius:14,padding:"16px 20px",marginBottom:18,textAlign:"center"}}>
            <div style={{fontFamily:"DM Sans",fontSize:11,color:"#64748b",marginBottom:3}}>Team Average</div>
            <div style={{fontFamily:"Syne",fontSize:40,fontWeight:800,color:"#06d6a0",lineHeight:1,marginBottom:3}}>{avg}</div>
            <div style={{fontFamily:"DM Sans",fontSize:13,color:"#475569"}}>Suggested: <strong style={{color:"white"}}>{suggested} pts</strong></div>
          </div>
          <div style={{fontFamily:"DM Sans",fontSize:12,color:"#64748b",textAlign:"center",marginBottom:10}}>Accept a point value:</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center",marginBottom:22}}>
            {POKER_VALUES.filter(v=>!isNaN(parseFloat(v))).map(v=>(
              <button key={v} onClick={()=>setStep("pick")}
                style={{width:52,height:52,borderRadius:12,cursor:"pointer",border:`2px solid ${v===String(suggested)?"#06d6a0":"rgba(255,255,255,0.1)"}`,background:v===String(suggested)?"rgba(6,214,160,0.15)":"rgba(255,255,255,0.04)",color:v===String(suggested)?"#06d6a0":"white",fontFamily:"Syne",fontWeight:800,fontSize:15,transition:"all 0.18s"}}>
                {v}
              </button>
            ))}
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>{setStep("vote");setMyVote(null);setLiveVotes([]);setRevealed(false);}} style={btn("rgba(255,255,255,0.06)","#94a3b8",{flex:1,padding:"12px"})}>↩ Re-vote</button>
            <button onClick={()=>setStep("pick")} style={btn("rgba(255,255,255,0.06)","#64748b",{flex:1,padding:"12px"})}>Next ticket →</button>
          </div>
        </>
      )}
    </div>
  );
  return null;
};

// ─────────────────────────────────────────────────────────────
//  RETROSPECTIVE
// ─────────────────────────────────────────────────────────────
const RetroView = ({ session, roomUrl }) => {
  const { userId, displayName, room, role } = session;
  const [phase, setPhaseLocal] = useState("lobby");
  const [notes, setNotes] = useState({ went_well:[], improve:[], action_items:[] });
  const [myInputs, setMyInputs] = useState({ went_well:"", improve:"", action_items:"" });
  const [votes, setVotes] = useState({});
  const [mood, setMood] = useState(null);
  const [activeDiscuss, setActiveDiscuss] = useState(null);
  const [aiSummary, setAiSummary] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [phaseTimeLimits, setPhaseTimeLimits] = useState({ collect:300, vote:180, discuss:300 });
  const MOODS = ["😩","😕","😐","🙂","🚀"];

  const collectTimer = usePhaseTimer(phase==="collect", phaseTimeLimits.collect);
  const voteTimer    = usePhaseTimer(phase==="vote",    phaseTimeLimits.vote);
  const discussTimer = usePhaseTimer(phase==="discuss", phaseTimeLimits.discuss);

  // Subscribe to live retro notes
  useEffect(() => {
    if (!room) return;
    const load = async () => {
      const raw = await getRetroNotes(room.id);
      const grouped = { went_well:[], improve:[], action_items:[] };
      raw.forEach(n => { if(grouped[n.column_id]) grouped[n.column_id].push(n); });
      setNotes(grouped);
    };
    load();
    const ch = supabase.channel(`retro:${room.id}`)
      .on("postgres_changes", { event:"*", schema:"public", table:"retro_notes", filter:`room_id=eq.${room.id}` }, load)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [room]);

  // Subscribe to phase changes from host
  useEffect(() => {
    if (!room) return;
    const ch = supabase.channel(`room-phase:${room.id}`)
      .on("postgres_changes", { event:"UPDATE", schema:"public", table:"rooms", filter:`id=eq.${room.id}` },
        payload => { if(payload.new.phase) setPhaseLocal(payload.new.phase); })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [room]);

  const advancePhase = async (newPhase) => {
    setPhaseLocal(newPhase);
    await setPhase(room.id, newPhase);
  };

  const addNote = async (col) => {
    const t = myInputs[col].trim(); if(!t) return;
    setMyInputs(i=>({...i,[col]:""}));
    await addRetroNote(room.id, col, t, userId, displayName);
  };

  const castVote = async (noteId) => {
    setVotes(v=>({...v,[noteId]:(v[noteId]||0)+1}));
    await voteRetroNote(room.id, noteId, userId);
  };

  const totalNotes = Object.values(notes).flat().length;
  const allNotes   = RETRO_COLS.flatMap(col=>notes[col.id].map(n=>({...n,col:col.id})));
  const topNotes   = [...allNotes].sort((a,b)=>(votes[b.id]||0)-(votes[a.id]||0)).slice(0,6);
  const totalVotes = Object.values(votes).reduce((a,b)=>a+b,0);

  const getAI = async () => {
    setAiLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:600,system:`You are an agile coach. Return ONLY valid JSON no markdown: {"summary":"2 sentences","actions":["a1","a2","a3"],"health":"good|fair|poor"}`,messages:[{role:"user",content:`Went Well:${notes.went_well.map(n=>n.text).join(",")}\nImprove:${notes.improve.map(n=>n.text).join(",")}\nActions:${notes.action_items.map(n=>n.text).join(",")}`}]})});
      const data = await res.json();
      setAiSummary(JSON.parse(data.content.map(b=>b.text||"").join("").replace(/```json|```/g,"").trim()));
    } catch { setAiSummary({summary:"Great sprint! Focus on the action items you identified to keep improving.",actions:["Follow up on top voted items","Schedule action item owners","Review at next sprint start"],health:"good"}); }
    finally { setAiLoading(false); }
  };

  const TimerBar = ({ phaseId, timer }) => {
    const limit = phaseTimeLimits[phaseId];
    return(
      <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"10px 14px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",marginBottom:16}}>
        {role==="host" ? (
          // HOST — sees preset chips + pause button
          <>
            <span style={{fontFamily:"Syne",fontSize:10,color:"#475569",letterSpacing:1,flexShrink:0}}>⏱ TIME LIMIT</span>
            {TIMER_PRESETS.map(p=>{
              const active=limit===p.seconds;
              return <button key={p.label} onClick={()=>setPhaseTimeLimits(prev=>({...prev,[phaseId]:p.seconds}))} style={{padding:"4px 11px",borderRadius:7,cursor:"pointer",fontFamily:"Syne",fontWeight:700,fontSize:11,background:active?"#7c3aed":"rgba(255,255,255,0.05)",border:`1px solid ${active?"#7c3aed":"rgba(255,255,255,0.08)"}`,color:active?"white":"#64748b",transition:"all 0.15s"}}>{p.label}</button>;
            })}
            {limit>0 && <>
              <CountdownRing seconds={timer.remaining} total={limit} label="" warn={60} danger={30}/>
              <button onClick={()=>timer.paused?timer.resume():timer.pause()} style={btn("rgba(255,255,255,0.06)","#94a3b8",{padding:"5px 10px",fontSize:10})}>{timer.paused?"▶ Resume":"⏸ Pause"}</button>
            </>}
          </>
        ) : (
          // PARTICIPANT — sees countdown only, no controls
          <>
            <span style={{fontFamily:"Syne",fontSize:10,color:"#475569",letterSpacing:1,flexShrink:0}}>⏱ TIME</span>
            {limit>0
              ? <CountdownRing seconds={timer.remaining} total={limit} label="" warn={60} danger={30}/>
              : <span style={{fontFamily:"DM Sans",fontSize:12,color:"#334155"}}>No time limit set</span>
            }
          </>
        )}
      </div>
    );
  };

  // LOBBY
  if (phase==="lobby") return(
    <div style={{padding:"20px 16px 48px",maxWidth:580,margin:"0 auto"}}>
      <QRJoinBanner roomCode={room.code} url={roomUrl} participants={[]}/>
      <div style={{textAlign:"center",marginBottom:28}}>
        <div style={{fontSize:36,marginBottom:8}}>🏁</div>
        <div style={{fontFamily:"Syne",fontSize:24,fontWeight:800,color:"white",marginBottom:6}}>Sprint Retrospective</div>
        <div style={{fontFamily:"DM Sans",fontSize:13,color:"#475569",lineHeight:1.6}}>{role==="host"?"You're the facilitator. Share the room code so your team can join, then start when everyone is ready.":"Waiting for the host to start the retrospective…"}</div>
      </div>
      {role==="host" ? (
        <>
          <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:16,marginBottom:20}}>
            <div style={{fontFamily:"Syne",fontSize:11,color:"white",fontWeight:700,marginBottom:10}}>Quick mood check</div>
            <div style={{display:"flex",gap:8}}>{MOODS.map((m,i)=><button key={m} onClick={()=>setMood(i)} style={{fontSize:24,background:mood===i?"rgba(124,58,237,0.18)":"none",border:`2px solid ${mood===i?"#7c3aed":"rgba(255,255,255,0.07)"}`,borderRadius:11,padding:"6px 10px",cursor:"pointer",transform:mood===i?"scale(1.2) translateY(-2px)":"none",transition:"all 0.2s"}}>{m}</button>)}</div>
          </div>
          <button onClick={()=>advancePhase("collect")} style={btn("#7c3aed","white",{width:"100%",padding:"14px",fontSize:15})}>Start Retrospective →</button>
        </>
      ) : (
        <div style={{textAlign:"center",padding:32,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16}}>
          <div style={{fontSize:28,marginBottom:8,animation:"pulse 2s ease infinite"}}>⏳</div>
          <div style={{fontFamily:"Syne",fontSize:13,fontWeight:700,color:"#64748b"}}>Waiting for host to start…</div>
        </div>
      )}
    </div>
  );

  // COLLECT
  if (phase==="collect") return(
    <div style={{padding:"20px 16px 48px"}}>
      <div style={{marginBottom:16}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:12,marginBottom:12}}>
          <div>
            <div style={{fontFamily:"Syne",fontSize:10,color:"#7c3aed",letterSpacing:2,marginBottom:3}}>PHASE 1 OF 3</div>
            <div style={{fontFamily:"Syne",fontSize:20,fontWeight:800,color:"white"}}>Collect Notes</div>
            <div style={{fontFamily:"DM Sans",fontSize:12,color:"#475569"}}>{totalNotes} notes · add yours below</div>
          </div>
          {role==="host"&&<button onClick={()=>advancePhase("vote")} style={btn("#7c3aed","white",{padding:"8px 16px"})}>End → Vote</button>}
        </div>
        <TimerBar phaseId="collect" timer={collectTimer}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:14}}>
        {RETRO_COLS.map(col=>(
          <div key={col.id} style={{background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:14,display:"flex",flexDirection:"column",minHeight:300}}>
            <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:12,paddingBottom:10,borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
              <span style={{fontSize:15}}>{col.emoji}</span>
              <span style={{fontFamily:"Syne",fontSize:13,fontWeight:700,color:col.color}}>{col.label}</span>
              <span style={{marginLeft:"auto",background:"rgba(255,255,255,0.06)",borderRadius:20,padding:"1px 7px",fontSize:11,color:"#475569"}}>{notes[col.id].length}</span>
            </div>
            <div style={{flex:1,marginBottom:10}}>
              {notes[col.id].length===0&&<div style={{textAlign:"center",color:"#1e293b",fontSize:12,fontFamily:"DM Sans",marginTop:20}}>No notes yet…</div>}
              {notes[col.id].map(n=>(
                <div key={n.id} style={{background:n.user_id===userId?"rgba(124,58,237,0.12)":"rgba(255,255,255,0.04)",border:`1px solid ${n.user_id===userId?"rgba(124,58,237,0.3)":"rgba(255,255,255,0.06)"}`,borderRadius:9,padding:"8px 11px",marginBottom:7,borderLeft:`3px solid ${col.color}`,animation:"noteIn 0.35s ease"}}>
                  <div style={{fontFamily:"DM Sans",fontSize:13,color:"#e2e8f0",lineHeight:1.4,marginBottom:3}}>{n.text}</div>
                  <div style={{fontFamily:"DM Sans",fontSize:10,color:"#475569"}}>{n.user_id===userId?"You":n.display_name}</div>
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

  // VOTE
  if (phase==="vote") return(
    <div style={{padding:"20px 16px 48px",maxWidth:660,margin:"0 auto"}}>
      <div style={{marginBottom:16}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:12,marginBottom:12}}>
          <div>
            <div style={{fontFamily:"Syne",fontSize:10,color:"#7c3aed",letterSpacing:2,marginBottom:3}}>PHASE 2 OF 3</div>
            <div style={{fontFamily:"Syne",fontSize:20,fontWeight:800,color:"white"}}>Dot Voting</div>
            <div style={{fontFamily:"DM Sans",fontSize:12,color:"#475569"}}>5 votes · {totalVotes}/5 used</div>
          </div>
          {role==="host"&&<button onClick={()=>{setActiveDiscuss(topNotes[0]);advancePhase("discuss");}} style={btn("#7c3aed","white",{padding:"8px 16px"})}>End → Discuss</button>}
        </div>
        <TimerBar phaseId="vote" timer={voteTimer}/>
      </div>
      {RETRO_COLS.map(col=>{const cn=notes[col.id];if(!cn.length)return null;return(
        <div key={col.id} style={{marginBottom:24}}>
          <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:10}}><span style={{fontSize:13}}>{col.emoji}</span><span style={{fontFamily:"Syne",fontSize:11,fontWeight:700,color:col.color,letterSpacing:1}}>{col.label.toUpperCase()}</span></div>
          {cn.map(n=>{const vc=votes[n.id]||n.votes||0;const canVote=totalVotes<5;return(
            <div key={n.id} style={{display:"flex",alignItems:"center",gap:12,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12,padding:"11px 14px",marginBottom:7,borderLeft:`3px solid ${col.color}`}}>
              <div style={{flex:1,fontFamily:"DM Sans",fontSize:13,color:"#e2e8f0",lineHeight:1.4}}>{n.text}</div>
              <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                {vc>0&&<div style={{display:"flex",gap:3}}>{Array.from({length:vc}).map((_,i)=><span key={i} style={{width:9,height:9,borderRadius:"50%",background:col.color,boxShadow:`0 0 5px ${col.color}`}}/>)}</div>}
                <button onClick={()=>canVote&&castVote(n.id)} style={{width:30,height:30,borderRadius:8,border:`1px solid ${vc>0?col.color:"rgba(255,255,255,0.1)"}`,background:vc>0?`${col.color}22`:"rgba(255,255,255,0.04)",color:canVote?"white":"#334155",cursor:canVote?"pointer":"default",fontFamily:"Syne",fontWeight:800,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
              </div>
            </div>
          );})}
        </div>
      );})}
    </div>
  );

  // DISCUSS
  if (phase==="discuss") return(
    <div style={{padding:"20px 16px 48px",maxWidth:660,margin:"0 auto"}}>
      <div style={{marginBottom:16}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:12,marginBottom:12}}>
          <div>
            <div style={{fontFamily:"Syne",fontSize:10,color:"#7c3aed",letterSpacing:2,marginBottom:3}}>PHASE 3 OF 3</div>
            <div style={{fontFamily:"Syne",fontSize:20,fontWeight:800,color:"white"}}>Discussion</div>
            <div style={{fontFamily:"DM Sans",fontSize:12,color:"#475569"}}>Work through the top voted items</div>
          </div>
          {role==="host"&&<button onClick={()=>advancePhase("done")} style={btn("#7c3aed","white",{padding:"8px 16px"})}>Wrap Up →</button>}
        </div>
        <TimerBar phaseId="discuss" timer={discussTimer}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:10,marginBottom:24}}>
        {topNotes.map((n,i)=>{const col=RETRO_COLS.find(c=>c.id===n.col);const isAct=activeDiscuss?.id===n.id;return(
          <button key={n.id} onClick={()=>setActiveDiscuss(n)} style={{background:isAct?"rgba(124,58,237,0.18)":"rgba(255,255,255,0.04)",border:`1.5px solid ${isAct?"#7c3aed":"rgba(255,255,255,0.07)"}`,borderRadius:13,padding:"13px",cursor:"pointer",textAlign:"left",transition:"all 0.2s",borderLeft:`4px solid ${col?.color||"#64748b"}`}}>
            <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:6}}>
              <span style={{fontFamily:"Syne",fontWeight:800,fontSize:12,color:isAct?"#a78bfa":"#64748b"}}>#{i+1}</span>
              <span style={{fontSize:10,color:"#475569",marginLeft:"auto"}}>{votes[n.id]||n.votes||0}v</span>
            </div>
            <div style={{fontFamily:"DM Sans",fontSize:12,color:"#e2e8f0",lineHeight:1.4}}>{n.text}</div>
          </button>
        );})}
      </div>
      {activeDiscuss&&(
        <div style={{background:"rgba(124,58,237,0.1)",border:"1px solid rgba(124,58,237,0.3)",borderRadius:16,padding:20}}>
          <div style={{fontFamily:"Syne",fontSize:10,color:"#7c3aed",letterSpacing:2,marginBottom:7}}>NOW DISCUSSING</div>
          <div style={{fontFamily:"Syne",fontSize:17,fontWeight:800,color:"white",marginBottom:14}}>{activeDiscuss.text}</div>
          {["What's the root cause?","Who owns this action?","What does success look like?"].map(q=>(
            <div key={q} style={{fontFamily:"DM Sans",fontSize:13,color:"#94a3b8",display:"flex",gap:9,marginBottom:7,padding:"7px 11px",background:"rgba(255,255,255,0.03)",borderRadius:8}}><span style={{color:"#7c3aed",flexShrink:0}}>›</span>{q}</div>
          ))}
        </div>
      )}
    </div>
  );

  // DONE
  if (phase==="done") return(
    <div style={{padding:"20px 16px 48px",maxWidth:580,margin:"0 auto"}}>
      <div style={{textAlign:"center",marginBottom:24}}>
        <div style={{fontSize:36,marginBottom:8}}>🎉</div>
        <div style={{fontFamily:"Syne",fontSize:24,fontWeight:800,color:"white",marginBottom:6}}>Retrospective Complete</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:20}}>
        {[{l:"Notes",v:totalNotes,c:"#7c3aed"},{l:"Votes",v:totalVotes,c:"#ffd166"},{l:"Discussed",v:Math.min(topNotes.length,6),c:"#06d6a0"}].map(s=>(
          <div key={s.l} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:13,padding:13,textAlign:"center"}}>
            <div style={{fontFamily:"Syne",fontSize:26,fontWeight:800,color:s.c}}>{s.v}</div>
            <div style={{fontFamily:"DM Sans",fontSize:11,color:"#475569",marginTop:2}}>{s.l}</div>
          </div>
        ))}
      </div>
      {aiSummary ? (
        <div style={{background:"rgba(124,58,237,0.08)",border:"1px solid rgba(124,58,237,0.2)",borderRadius:14,padding:16,marginBottom:16}}>
          <div style={{fontFamily:"Syne",fontSize:10,color:"#7c3aed",letterSpacing:2,marginBottom:7}}>✨ AI COACH SUMMARY</div>
          <div style={{fontFamily:"DM Sans",fontSize:13,color:"#94a3b8",lineHeight:1.6,marginBottom:10}}>{aiSummary.summary}</div>
          {aiSummary.actions?.map((a,i)=><div key={i} style={{fontFamily:"DM Sans",fontSize:13,color:"#e2e8f0",display:"flex",gap:8,marginBottom:5}}><span style={{color:"#7c3aed",fontWeight:700}}>{i+1}.</span>{a}</div>)}
        </div>
      ):(
        <button onClick={getAI} disabled={aiLoading} style={btn("rgba(124,58,237,0.18)","#a78bfa",{width:"100%",padding:"12px",border:"1px solid rgba(124,58,237,0.3)",marginBottom:16})}>{aiLoading?"✨ Generating…":"✨ Generate AI Coach Summary"}</button>
      )}
      <div style={{display:"flex",gap:10}}>
        <button onClick={()=>advancePhase("lobby")} style={btn("rgba(255,255,255,0.06)","#64748b",{flex:1,padding:"12px"})}>Start New Retro</button>
        <button style={btn("#7c3aed","white",{flex:1,padding:"12px"})}>Export Results</button>
      </div>
    </div>
  );
  return null;
};

// ─────────────────────────────────────────────────────────────
//  PRICING MODAL
// ─────────────────────────────────────────────────────────────
const PricingModal = ({ onClose }) => {
  const [annual, setAnnual] = useState(false);
  const plans = [
    { name:"Solo", price:0, color:"#06d6a0", desc:"Solo creators, artists & indie devs",
      features:["3 projects","Planning poker","Retrospectives","QR join","5 AI estimates/mo"] },
    { name:"Pro", price:annual?59:7, color:"#7c3aed", hl:true, desc:"Freelancers & small teams (≤5)",
      features:["Unlimited projects","All Solo features","Unlimited AI estimates","Notion/Jira/Linear export","Slack integration","Custom room branding"] },
    { name:"Team", price:annual?159:19, color:"#ffd166", desc:"Growing teams up to 20",
      features:["Everything in Pro","20 members","Analytics dashboard","Priority support","Custom workflows","Session history"] },
    { name:"Corporate", price:annual?399:49, color:"#ff4d6d", desc:"Enterprise & agencies",
      features:["Unlimited members","SSO / SAML","Dedicated success mgr","Custom branding","SLA guarantee","On-premise option"] },
  ];
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.94)",zIndex:200,overflowY:"auto",padding:16}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{maxWidth:780,margin:"0 auto",paddingTop:16}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontFamily:"Syne",fontSize:10,color:"#7c3aed",letterSpacing:2,marginBottom:7}}>PRICING</div>
          <div style={{fontFamily:"Syne",fontSize:26,fontWeight:800,color:"white",marginBottom:7}}>Built for Everyone</div>
          <div style={{fontFamily:"DM Sans",color:"#475569",fontSize:13,marginBottom:16}}>From solo artists to Fortune 500 — no one gets priced out</div>
          {/* Annual toggle */}
          <div style={{display:"flex",alignItems:"center",gap:10,justifyContent:"center"}}>
            <span style={{fontFamily:"DM Sans",fontSize:12,color:annual?"#475569":"white"}}>Monthly</span>
            <div onClick={()=>setAnnual(a=>!a)} style={{width:44,height:24,borderRadius:12,background:annual?"#7c3aed":"rgba(255,255,255,0.1)",cursor:"pointer",position:"relative",transition:"all 0.2s"}}>
              <div style={{width:18,height:18,borderRadius:"50%",background:"white",position:"absolute",top:3,left:annual?23:3,transition:"left 0.2s"}}/>
            </div>
            <span style={{fontFamily:"DM Sans",fontSize:12,color:annual?"white":"#475569"}}>Annual <span style={{color:"#06d6a0",fontWeight:600}}>Save 30%</span></span>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(168px,1fr))",gap:12,marginBottom:20}}>
          {plans.map(p=>(
            <div key={p.name} style={{background:p.hl?"rgba(124,58,237,0.12)":"rgba(255,255,255,0.03)",border:`1.5px solid ${p.hl?"#7c3aed":"rgba(255,255,255,0.07)"}`,borderRadius:20,padding:18,boxShadow:p.hl?"0 0 40px rgba(124,58,237,0.12)":"none"}}>
              {p.hl&&<div style={{fontFamily:"Syne",fontSize:9,color:"#7c3aed",letterSpacing:2,marginBottom:7}}>★ MOST POPULAR</div>}
              <div style={{fontFamily:"Syne",fontSize:15,fontWeight:800,color:p.color,marginBottom:2}}>{p.name}</div>
              <div style={{fontFamily:"Syne",fontSize:26,fontWeight:800,color:"white"}}>
                {p.price===0?"Free":`$${p.price}`}
                {p.price>0&&<span style={{fontSize:11,color:"#475569",fontWeight:400}}>/mo</span>}
              </div>
              <div style={{fontFamily:"DM Sans",fontSize:11,color:"#475569",margin:"7px 0 12px",lineHeight:1.4}}>{p.desc}</div>
              {p.features.map(f=><div key={f} style={{fontFamily:"DM Sans",fontSize:11,color:"#94a3b8",marginBottom:5,display:"flex",gap:6}}><span style={{color:p.color}}>✓</span>{f}</div>)}
              <button style={btn(p.hl?"#7c3aed":"rgba(255,255,255,0.05)",p.hl?"white":"#64748b",{width:"100%",padding:"9px",marginTop:14})}>
                {p.price===0?"Get Started Free":"Subscribe Now"}
              </button>
            </div>
          ))}
        </div>
        <div style={{textAlign:"center",fontFamily:"DM Sans",fontSize:12,color:"#334155",marginBottom:16}}>🎨 Solo creators & artists — Pro free for 3 months, no credit card needed</div>
        <div style={{textAlign:"center"}}><button onClick={onClose} style={btn("rgba(255,255,255,0.05)","#475569",{padding:"9px 26px"})}>Close</button></div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  ANALYTICS VIEW
// ─────────────────────────────────────────────────────────────
const AnalyticsView = ({ stories, session }) => {
  const allStories = Object.values(stories).flat();
  const estimated  = allStories.filter(s=>s.points).length;
  const totalPts   = allStories.reduce((a,s)=>a+(parseInt(s.points)||0),0);
  const donePts    = (stories.done||[]).reduce((a,s)=>a+(parseInt(s.points)||0),0);
  const prog       = totalPts ? Math.round(donePts/totalPts*100) : 0;
  const byPriority = { high:0, medium:0, low:0 };
  allStories.forEach(s=>{ if(byPriority[s.priority]!==undefined) byPriority[s.priority]++; });

  const Stat = ({label,value,color,sub}) => (
    <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:16,textAlign:"center"}}>
      <div style={{fontFamily:"Syne",fontSize:28,fontWeight:800,color:color||"white"}}>{value}</div>
      <div style={{fontFamily:"DM Sans",fontSize:11,color:"#475569",marginTop:3}}>{label}</div>
      {sub&&<div style={{fontFamily:"DM Sans",fontSize:10,color:"#334155",marginTop:2}}>{sub}</div>}
    </div>
  );

  return(
    <div style={{padding:"20px 16px 48px",maxWidth:640,margin:"0 auto"}}>
      <div style={{fontFamily:"Syne",fontSize:22,fontWeight:800,color:"white",marginBottom:4}}>Analytics 📊</div>
      <div style={{fontFamily:"DM Sans",fontSize:13,color:"#475569",marginBottom:24}}>Room: <span style={{color:"#a78bfa"}}>{session.room?.code}</span></div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,marginBottom:24}}>
        <Stat label="Total Stories"   value={allStories.length}  color="#7c3aed"/>
        <Stat label="Estimated"       value={estimated}           color="#a78bfa" sub={`${allStories.length-estimated} remaining`}/>
        <Stat label="Sprint Points"   value={totalPts}            color="#ffd166"/>
        <Stat label="Completed"       value={`${prog}%`}          color="#06d6a0" sub={`${donePts}/${totalPts} pts`}/>
      </div>

      {/* Priority breakdown */}
      <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:18,marginBottom:16}}>
        <div style={{fontFamily:"Syne",fontSize:11,color:"#64748b",letterSpacing:1,marginBottom:14}}>PRIORITY BREAKDOWN</div>
        {[{k:"high",l:"High Priority",c:"#ff4d6d"},{k:"medium",l:"Medium Priority",c:"#ffd166"},{k:"low",l:"Low Priority",c:"#06d6a0"}].map(p=>(
          <div key={p.k} style={{marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
              <span style={{fontFamily:"DM Sans",fontSize:12,color:"#94a3b8"}}>{p.l}</span>
              <span style={{fontFamily:"Syne",fontSize:12,fontWeight:700,color:p.c}}>{byPriority[p.k]}</span>
            </div>
            <div style={{background:"rgba(255,255,255,0.06)",borderRadius:4,height:6}}>
              <div style={{width:`${allStories.length?Math.round(byPriority[p.k]/allStories.length*100):0}%`,background:p.c,height:"100%",borderRadius:4,transition:"width 0.6s"}}/>
            </div>
          </div>
        ))}
      </div>

      {/* Column breakdown */}
      <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:18,marginBottom:16}}>
        <div style={{fontFamily:"Syne",fontSize:11,color:"#64748b",letterSpacing:1,marginBottom:14}}>BOARD STATUS</div>
        {COLUMNS.map(col=>(
          <div key={col.id} style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
            <span style={{width:9,height:9,borderRadius:3,background:col.color,flexShrink:0}}/>
            <span style={{fontFamily:"DM Sans",fontSize:13,color:"#e2e8f0",flex:1}}>{col.title}</span>
            <span style={{fontFamily:"Syne",fontSize:13,fontWeight:700,color:col.color}}>{(stories[col.id]||[]).length}</span>
            <span style={{fontFamily:"DM Sans",fontSize:11,color:"#475569"}}>stories</span>
          </div>
        ))}
      </div>

      {/* Upgrade prompt if no stories */}
      {allStories.length===0&&(
        <div style={{background:"rgba(124,58,237,0.08)",border:"1px solid rgba(124,58,237,0.2)",borderRadius:14,padding:18,textAlign:"center"}}>
          <div style={{fontSize:28,marginBottom:8}}>📈</div>
          <div style={{fontFamily:"Syne",fontSize:14,fontWeight:700,color:"white",marginBottom:6}}>No data yet</div>
          <div style={{fontFamily:"DM Sans",fontSize:13,color:"#475569"}}>Add stories to your board to see analytics</div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  SHARE / INVITE MODAL  (for demoing to teammates)
// ─────────────────────────────────────────────────────────────
const ShareModal = ({ session, roomUrl, onClose }) => {
  const [copied, setCopied] = useState(false);
  const copy = (text) => { navigator.clipboard?.writeText(text).catch(()=>{}); setCopied(true); setTimeout(()=>setCopied(false),2000); };
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.9)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#0d0d1c",border:"1px solid rgba(124,58,237,0.35)",borderRadius:22,padding:26,maxWidth:380,width:"100%",boxShadow:"0 0 70px rgba(124,58,237,0.2)"}}>
        <div style={{fontFamily:"Syne",fontSize:10,color:"#7c3aed",letterSpacing:2,marginBottom:10}}>SHARE & INVITE</div>
        <div style={{fontFamily:"Syne",fontSize:20,fontWeight:800,color:"white",marginBottom:4}}>Invite Your Team</div>
        <div style={{fontFamily:"DM Sans",fontSize:12,color:"#475569",marginBottom:20}}>Anyone with the link or code can join from any device — no account needed</div>

        {/* QR Code */}
        <div style={{textAlign:"center",marginBottom:16}}>
          <div style={{background:"white",borderRadius:13,padding:11,display:"inline-block",boxShadow:"0 0 35px rgba(124,58,237,0.3)"}}>
            <QRCode value={roomUrl} size={140}/>
          </div>
        </div>

        {/* Room code */}
        <div style={{background:"rgba(124,58,237,0.12)",borderRadius:11,padding:"10px 16px",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontFamily:"DM Sans",fontSize:10,color:"#64748b",marginBottom:2}}>ROOM CODE</div>
            <div style={{fontFamily:"Syne",fontSize:20,fontWeight:800,color:"#a78bfa",letterSpacing:3}}>{session.room?.code}</div>
          </div>
          <button onClick={()=>copy(session.room?.code)} style={btn("rgba(124,58,237,0.3)","#a78bfa",{fontSize:11,padding:"6px 12px"})}>Copy</button>
        </div>

        {/* Full link */}
        <div style={{background:"rgba(255,255,255,0.04)",borderRadius:10,padding:"10px 14px",marginBottom:16,display:"flex",alignItems:"center",gap:10}}>
          <div style={{fontFamily:"DM Sans",fontSize:11,color:"#475569",flex:1,wordBreak:"break-all"}}>{roomUrl}</div>
          <button onClick={()=>copy(roomUrl)} style={btn(copied?"#06d6a0":"rgba(255,255,255,0.08)",copied?"#0d0d1c":"#94a3b8",{padding:"6px 12px",fontSize:11,flexShrink:0})}>{copied?"✓":"Copy"}</button>
        </div>

        {/* How to join instructions */}
        <div style={{background:"rgba(255,255,255,0.03)",borderRadius:12,padding:14,marginBottom:16}}>
          <div style={{fontFamily:"Syne",fontSize:10,color:"#64748b",letterSpacing:1,marginBottom:10}}>HOW YOUR TEAMMATE JOINS</div>
          {["Open the link on any device — phone, tablet or laptop","Or scan the QR code with their phone camera","Enter their name and click Join Room","They're in instantly — no account needed"].map((s,i)=>(
            <div key={i} style={{display:"flex",gap:10,marginBottom:7,alignItems:"flex-start"}}>
              <div style={{width:18,height:18,borderRadius:6,background:"rgba(124,58,237,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Syne",fontWeight:800,fontSize:10,color:"#a78bfa",flexShrink:0}}>{i+1}</div>
              <div style={{fontFamily:"DM Sans",fontSize:12,color:"#94a3b8",lineHeight:1.4}}>{s}</div>
            </div>
          ))}
        </div>
        <button onClick={onClose} style={btn("#7c3aed","white",{width:"100%",padding:"12px"})}>Done</button>
      </div>
    </div>
  );
};
// ─────────────────────────────────────────────────────────────
//  SETTINGS VIEW
// ─────────────────────────────────────────────────────────────
const SettingsView = ({ session, roomUrl, participants, onShowPricing }) => {
  const [copied, setCopied] = useState(false);
  const copy = (text) => { navigator.clipboard?.writeText(text).catch(()=>{}); setCopied(true); setTimeout(()=>setCopied(false),2000); };
  const ROLE_COLOR = { host:"#7c3aed", participant:"#06d6a0" };

  return(
    <div style={{padding:"20px 16px 48px",maxWidth:600,margin:"0 auto"}}>
      <div style={{fontFamily:"Syne",fontSize:22,fontWeight:800,color:"white",marginBottom:4}}>Settings ⚙️</div>
      <div style={{fontFamily:"DM Sans",fontSize:13,color:"#475569",marginBottom:24}}>Room details and team</div>

      {/* ── Who's in the room ── */}
      <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:18,marginBottom:16}}>
        <div style={{fontFamily:"Syne",fontSize:10,color:"#64748b",letterSpacing:1,marginBottom:14}}>
          WHO'S IN THE ROOM ({participants.length})
        </div>
        {participants.length===0&&(
          <div style={{fontFamily:"DM Sans",fontSize:13,color:"#334155",textAlign:"center",padding:"12px 0"}}>No one else has joined yet — share the room code!</div>
        )}
        {participants.map(p=>(
          <div key={p.id} style={{display:"flex",alignItems:"center",gap:12,marginBottom:10,padding:"10px 12px",background:"rgba(255,255,255,0.03)",borderRadius:11}}>
            <div style={{width:36,height:36,borderRadius:"50%",background:p.color||"#7c3aed",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Syne",fontWeight:800,fontSize:11,color:"white",flexShrink:0}}>
              {p.avatar||p.display_name?.slice(0,2).toUpperCase()}
            </div>
            <div style={{flex:1}}>
              <div style={{fontFamily:"DM Sans",fontSize:13,color:"#e2e8f0",fontWeight:500}}>
                {p.display_name}
                {p.user_id===session.userId&&<span style={{fontFamily:"DM Sans",fontSize:11,color:"#475569",marginLeft:6}}>(you)</span>}
              </div>
              <span style={{fontFamily:"Syne",fontSize:9,fontWeight:700,color:ROLE_COLOR[p.role]||"#64748b",background:`${ROLE_COLOR[p.role]||"#64748b"}22`,borderRadius:4,padding:"1px 6px",textTransform:"uppercase",letterSpacing:1}}>{p.role}</span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:5}}>
              <span style={{width:7,height:7,borderRadius:"50%",background:p.online?"#06d6a0":"#334155",boxShadow:p.online?"0 0 6px #06d6a0":"none"}}/>
              <span style={{fontFamily:"DM Sans",fontSize:11,color:p.online?"#06d6a0":"#334155"}}>{p.online?"Online":"Away"}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Room info ── */}
      <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:18,marginBottom:16}}>
        <div style={{fontFamily:"Syne",fontSize:10,color:"#64748b",letterSpacing:1,marginBottom:14}}>ROOM INFO</div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,padding:"10px 14px",background:"rgba(124,58,237,0.08)",border:"1px solid rgba(124,58,237,0.2)",borderRadius:11}}>
          <div>
            <div style={{fontFamily:"DM Sans",fontSize:10,color:"#64748b",marginBottom:3}}>ROOM CODE</div>
            <div style={{fontFamily:"Syne",fontSize:18,fontWeight:800,color:"#a78bfa",letterSpacing:3}}>{session.room?.code}</div>
          </div>
          <button onClick={()=>copy(session.room?.code)} style={btn("rgba(124,58,237,0.3)","#a78bfa",{fontSize:11,padding:"6px 12px"})}>Copy</button>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:11}}>
          <div style={{fontFamily:"DM Sans",fontSize:11,color:"#475569",flex:1,wordBreak:"break-all"}}>{roomUrl}</div>
          <button onClick={()=>copy(roomUrl)} style={btn(copied?"#06d6a0":"rgba(255,255,255,0.08)",copied?"#0d0d1c":"#94a3b8",{padding:"6px 12px",fontSize:11,flexShrink:0})}>{copied?"✓ Copied":"Copy Link"}</button>
        </div>
      </div>

      {/* ── Subscription ── */}
      <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:18}}>
        <div style={{fontFamily:"Syne",fontSize:10,color:"#64748b",letterSpacing:1,marginBottom:14}}>SUBSCRIPTION</div>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
          <div style={{width:40,height:40,borderRadius:12,background:"rgba(6,214,160,0.15)",border:"1px solid rgba(6,214,160,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🆓</div>
          <div>
            <div style={{fontFamily:"Syne",fontSize:14,fontWeight:700,color:"#06d6a0"}}>Solo Plan — Free</div>
            <div style={{fontFamily:"DM Sans",fontSize:12,color:"#475569"}}>3 projects · 5 AI estimates/mo · QR join</div>
          </div>
        </div>
        <button onClick={onShowPricing} style={btn("#7c3aed","white",{width:"100%",padding:"12px",fontSize:13})}>💎 Upgrade Plan</button>
      </div>
    </div>
  );
};

export default function SprintVibe() {
  const [session, setSession]   = useState(null);
  const [stories, setStories]   = useState({ backlog:[], sprint:[], in_progress:[], done:[] });
  const [tab, setTab]           = useState("board");
  const [modal, setModal]       = useState(null);
  const [participants, setParticipants] = useState([]);

  // Real URL — uses your actual Vercel domain so QR codes work on iPhone/Android
  const roomUrl = session
    ? `${window.location.protocol}//${window.location.host}?join=${session.room?.code}`
    : "";

  // Handle deep-link join via ?join=CODE in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const joinCode = params.get("join");
    if (joinCode) {
      // Pre-fill the room code so the join screen is ready
      window.pendingJoinCode = joinCode;
    }
  }, []);

  const handleEnter = (sess) => {
    setSession(sess);
    setTab("board");
  };

  const handleLeave = async () => {
    if (session) await leaveRoom(session.room.id, session.userId);
    setSession(null);
    setStories({ backlog:[], sprint:[], in_progress:[], done:[] });
  };

  const drop = (cid,from,to) => { if(from===to)return; setStories(p=>{ const card=p[from]?.find(s=>s.id===cid); if(!card)return p; return{...p,[from]:p[from].filter(s=>s.id!==cid),[to]:[...(p[to]||[]),card]}; }); };
  const addStory = (col,story) => setStories(p=>({...p,[col]:[...(p[col]||[]),story]}));

  // Live participants — loads on join, updates in real time
  useEffect(() => {
    if (!session?.room?.id) return;
    const load = async () => {
      const { data } = await supabase.from("participants").select("*").eq("room_id", session.room.id).order("joined_at");
      if (data) setParticipants(data);
    };
    load();
    const ch = supabase.channel(`participants:${session.room.id}`)
      .on("postgres_changes", { event:"*", schema:"public", table:"participants", filter:`room_id=eq.${session.room.id}` }, load)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [session?.room?.id]);

  const allPts  = Object.values(stories).flat().reduce((a,s)=>a+(parseInt(s.points)||0),0);
  const donePts = (stories.done||[]).reduce((a,s)=>a+(parseInt(s.points)||0),0);
  const prog    = allPts ? Math.round(donePts/allPts*100) : 0;

  const TABS = [
    { id:"board",     l:"📋 Board"     },
    { id:"poker",     l:"🃏 Poker"     },
    { id:"retro",     l:"🏁 Retro"     },
    { id:"analytics", l:"📊 Analytics" },
    { id:"settings",  l:"⚙️ Settings"  },
  ];

  // Show onboarding if no session
  if (!session) return(
    <>
      <FontLoader/>
      <style>{`*{-webkit-tap-highlight-color:transparent;}body{margin:0;background:#08080f;}@keyframes pulse{0%,100%{opacity:0.4}50%{opacity:1}}select option{background:#0d0d1c}::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-thumb{background:rgba(124,58,237,0.3);border-radius:2px}`}</style>
      <div style={{minHeight:"100vh",background:"#08080f",backgroundImage:"radial-gradient(ellipse 70% 40% at 50% -10%,rgba(124,58,237,0.18) 0%,transparent 60%)"}}>
        <Onboarding onEnter={handleEnter}/>
        <div style={{textAlign:"center",paddingBottom:32}}>
          <button onClick={()=>setModal("pricing")} style={btn("rgba(255,255,255,0.04)","#64748b",{fontSize:12,border:"1px solid rgba(255,255,255,0.06)"})}>💎 View Pricing</button>
        </div>
      </div>
      {modal==="pricing"&&<PricingModal onClose={()=>setModal(null)}/>}
    </>
  );

  return(
    <>
      <FontLoader/>
      <style>{`*{-webkit-tap-highlight-color:transparent;}body{margin:0;background:#08080f;}@keyframes flipIn{from{opacity:0;transform:rotateY(90deg)}to{opacity:1;transform:rotateY(0)}}@keyframes slideUp{from{opacity:0;transform:translateX(-50%) translateY(12px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}@keyframes noteIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes pulse{0%,100%{opacity:0.4}50%{opacity:1}}select option{background:#0d0d1c}::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-thumb{background:rgba(124,58,237,0.3);border-radius:2px}input,textarea,select{-webkit-appearance:none;}`}</style>

      <div style={{minHeight:"100vh",background:"#08080f",backgroundImage:"radial-gradient(ellipse 70% 40% at 50% -10%,rgba(124,58,237,0.18) 0%,transparent 60%)",fontFamily:"DM Sans"}}>

        {/* Header */}
        <div style={{padding:"12px 16px",borderBottom:"1px solid rgba(255,255,255,0.05)",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap",background:"rgba(0,0,0,0.4)",backdropFilter:"blur(16px)",position:"sticky",top:0,zIndex:100}}>
          <div>
            <div style={{fontFamily:"Syne",fontWeight:800,fontSize:17,color:"white",letterSpacing:-0.5}}>Sprint<span style={{color:"#7c3aed"}}>Vibe</span></div>
            <div style={{fontSize:10,color:"#334155"}}>Room: <span style={{color:"#7c3aed",letterSpacing:1}}>{session.room?.code}</span></div>
          </div>

          {/* Progress */}
          {allPts>0&&(
            <div style={{flex:1,minWidth:80,maxWidth:160}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:9,color:"#475569"}}>Progress</span><span style={{fontSize:9,color:"#7c3aed",fontFamily:"Syne",fontWeight:700}}>{prog}%</span></div>
              <div style={{background:"rgba(255,255,255,0.07)",borderRadius:4,height:4}}><div style={{width:`${prog}%`,background:"linear-gradient(90deg,#7c3aed,#a78bfa)",height:"100%",borderRadius:4,transition:"width 0.6s"}}/></div>
            </div>
          )}

          {/* Right side — share, participants count, user, leave */}
          <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <button onClick={()=>setModal("share")} style={btn("#7c3aed","white",{padding:"6px 12px",fontSize:11})}>📱 Share</button>
            {/* Live participant avatars */}
            <div style={{display:"flex",alignItems:"center"}}>
              {participants.slice(0,4).map((p,i)=>(
                <div key={p.id} title={p.display_name} style={{width:26,height:26,borderRadius:"50%",background:p.color||"#7c3aed",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Syne",fontWeight:800,fontSize:9,color:"white",border:"2px solid #08080f",marginLeft:i>0?-8:0,zIndex:10-i}}>
                  {p.avatar||p.display_name?.slice(0,2).toUpperCase()}
                </div>
              ))}
              {participants.length>0&&<span style={{fontFamily:"DM Sans",fontSize:11,color:"#475569",marginLeft:8}}>{participants.length} in room</span>}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:7,background:"rgba(255,255,255,0.05)",borderRadius:10,padding:"5px 10px"}}>
              <div style={{width:22,height:22,borderRadius:"50%",background:session.color,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Syne",fontWeight:800,fontSize:9,color:"white"}}>
                {session.displayName.slice(0,2).toUpperCase()}
              </div>
              <span style={{fontFamily:"DM Sans",fontSize:12,color:"#e2e8f0"}}>{session.displayName}</span>
              {session.role==="host"&&<span style={{fontFamily:"Syne",fontSize:9,color:"#7c3aed",background:"rgba(124,58,237,0.15)",borderRadius:4,padding:"1px 5px"}}>HOST</span>}
            </div>
            <button onClick={handleLeave} style={btn("rgba(255,77,109,0.15)","#ff4d6d",{padding:"6px 12px",fontSize:11})}>Leave</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{padding:"12px 16px 0",display:"flex",gap:3,overflowX:"auto"}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"7px 14px",borderRadius:"10px 10px 0 0",background:tab===t.id?"rgba(124,58,237,0.15)":"transparent",border:`1px solid ${tab===t.id?"rgba(124,58,237,0.3)":"rgba(255,255,255,0.05)"}`,borderBottom:tab===t.id?"1px solid rgba(124,58,237,0.15)":"1px solid rgba(255,255,255,0.05)",color:tab===t.id?"#a78bfa":"#334155",cursor:"pointer",fontFamily:"Syne",fontWeight:700,fontSize:12,whiteSpace:"nowrap",flexShrink:0}}>{t.l}</button>
          ))}
        </div>

        {/* Content */}
        {tab==="board"&&(
          <div style={{padding:"16px 16px 48px",overflowX:"auto"}}>

            {/* Who's in the room — always visible on board */}
            {participants.length>0&&(
              <div style={{marginBottom:16,background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:"12px 16px",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                <span style={{fontFamily:"Syne",fontSize:10,color:"#475569",letterSpacing:1,flexShrink:0}}>IN ROOM</span>
                {participants.map(p=>(
                  <div key={p.id} style={{display:"flex",alignItems:"center",gap:7,background:"rgba(255,255,255,0.04)",borderRadius:9,padding:"5px 10px"}}>
                    <div style={{width:22,height:22,borderRadius:"50%",background:p.color||"#7c3aed",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Syne",fontWeight:800,fontSize:9,color:"white",flexShrink:0}}>
                      {p.avatar||p.display_name?.slice(0,2).toUpperCase()}
                    </div>
                    <span style={{fontFamily:"DM Sans",fontSize:12,color:"#e2e8f0"}}>{p.display_name}</span>
                    {p.role==="host"&&<span style={{fontFamily:"Syne",fontSize:8,color:"#7c3aed",background:"rgba(124,58,237,0.15)",borderRadius:4,padding:"1px 5px"}}>HOST</span>}
                    <span style={{width:6,height:6,borderRadius:"50%",background:p.online?"#06d6a0":"#334155",boxShadow:p.online?"0 0 5px #06d6a0":"none"}}/>
                  </div>
                ))}
              </div>
            )}

            {Object.values(stories).flat().length===0&&(
              <div style={{textAlign:"center",padding:"48px 20px",maxWidth:400,margin:"0 auto"}}>
                <div style={{fontSize:40,marginBottom:12}}>📋</div>
                <div style={{fontFamily:"Syne",fontSize:18,fontWeight:800,color:"white",marginBottom:8}}>Your board is empty</div>
                <div style={{fontFamily:"DM Sans",fontSize:13,color:"#475569",lineHeight:1.6,marginBottom:20}}>Add your first story to get started. Click "+ Add Story" in any column below.</div>
              </div>
            )}
            <div style={{display:"flex",gap:12,minWidth:820}}>
              {COLUMNS.map(col=><DropColumn key={col.id} id={col.id} title={col.title} color={col.color} stories={stories[col.id]||[]} onDrop={drop} onAdd={addStory}/>)}
            </div>
          </div>
        )}
        {tab==="poker"     &&<PokerSession  stories={stories} session={session} roomUrl={roomUrl}/>}
        {tab==="retro"     &&<RetroView     session={session} roomUrl={roomUrl}/>}
        {tab==="analytics" &&<AnalyticsView stories={stories} session={session}/>}
        {tab==="settings"  &&<SettingsView  session={session} roomUrl={roomUrl} participants={participants} onShowPricing={()=>setModal("pricing")}/>}

        {/* Modals */}
        {modal==="pricing"&&<PricingModal onClose={()=>setModal(null)}/>}
        {modal==="share"  &&<ShareModal session={session} roomUrl={roomUrl} onClose={()=>setModal(null)}/>}
      </div>
    </>
  );
}
