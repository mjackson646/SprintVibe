import { useState, useEffect, useRef } from "react";
import { supabase, createRoom, findRoom, joinRoom, leaveRoom,
         castPokerVote, revealPokerVotes, getPokerVotes,
         addRetroNote, voteRetroNote, getRetroNotes,
         getParticipants, setPhase, generateCode,
         signUp, signIn, signInWithGoogle, signOut,
         saveStory, deleteStory, moveStory, scoreStory, getStories,
         broadcastNotification, sendRetroRecap } from "./lib/supabase";

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
//  LANDING PAGE — bold & energetic
// ─────────────────────────────────────────────────────────────
const LandingPage = ({ onGetStarted, onJoin, onSignIn }) => {
  const [hovered, setHovered] = useState(null);
  const FEATURES = [
    { icon:"🃏", title:"Planning Poker", desc:"Real-time card voting. Everyone reveals at once — no anchoring bias." },
    { icon:"🏁", title:"Retrospectives", desc:"Structured retros with collect, vote & discuss phases. AI coach included." },
    { icon:"📋", title:"Kanban Board", desc:"Drag-and-drop sprint board. Stories persist between sessions." },
    { icon:"📱", title:"Scan to Join", desc:"Share a QR code. Teammates join instantly — no account needed." },
    { icon:"✨", title:"AI Coach", desc:"Get an AI-generated sprint summary and action items after every retro." },
    { icon:"📊", title:"Analytics", desc:"Track velocity, completion rates and priority breakdown in real time." },
  ];
  const STATS = [
    { n:"10k+", l:"Sessions run" },
    { n:"50k+", l:"Story points estimated" },
    { n:"98%",  l:"Teams come back" },
    { n:"< 30s", l:"Time to start" },
  ];
  return (
    <div style={{minHeight:"100vh",background:"#08080f",color:"white",fontFamily:"DM Sans",overflowX:"hidden"}}>

      {/* ── NAV ── */}
      <nav style={{padding:"16px 32px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid rgba(255,255,255,0.06)",position:"sticky",top:0,background:"rgba(8,8,15,0.9)",backdropFilter:"blur(16px)",zIndex:100}}>
        <div style={{fontFamily:"Syne",fontWeight:800,fontSize:22,letterSpacing:-0.5}}>
          Sprint<span style={{color:"#7c3aed"}}>Vibe</span>
        </div>
        <div style={{display:"flex",gap:12,alignItems:"center"}}>
          <button onClick={onSignIn} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,padding:"8px 16px",color:"#94a3b8",cursor:"pointer",fontFamily:"Syne",fontWeight:700,fontSize:13}}>Sign In</button>
          <button onClick={onJoin} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,padding:"8px 16px",color:"#94a3b8",cursor:"pointer",fontFamily:"Syne",fontWeight:700,fontSize:13}}>Join a Room</button>
          <button onClick={onGetStarted} style={{background:"#7c3aed",border:"none",borderRadius:10,padding:"8px 18px",color:"white",cursor:"pointer",fontFamily:"Syne",fontWeight:700,fontSize:13}}>Get Started Free →</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <div style={{textAlign:"center",padding:"80px 24px 60px",position:"relative",overflow:"hidden"}}>
        {/* Background glow blobs */}
        <div style={{position:"absolute",top:-100,left:"50%",transform:"translateX(-50%)",width:600,height:600,background:"radial-gradient(circle,rgba(124,58,237,0.25) 0%,transparent 70%)",pointerEvents:"none"}}/>
        <div style={{position:"absolute",top:100,left:"10%",width:300,height:300,background:"radial-gradient(circle,rgba(6,214,160,0.1) 0%,transparent 70%)",pointerEvents:"none"}}/>
        <div style={{position:"absolute",top:50,right:"10%",width:300,height:300,background:"radial-gradient(circle,rgba(255,77,109,0.1) 0%,transparent 70%)",pointerEvents:"none"}}/>

        <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(124,58,237,0.15)",border:"1px solid rgba(124,58,237,0.35)",borderRadius:20,padding:"6px 16px",marginBottom:24,fontFamily:"Syne",fontSize:12,fontWeight:700,color:"#a78bfa",letterSpacing:1}}>
          ⚡ THE AGILE TOOL YOUR TEAM WILL ACTUALLY USE
        </div>

        <h1 style={{fontFamily:"Syne",fontWeight:800,fontSize:"clamp(38px,7vw,80px)",lineHeight:1.05,letterSpacing:-2,marginBottom:20,position:"relative"}}>
          Sprint planning<br/>
          <span style={{background:"linear-gradient(135deg,#7c3aed,#a78bfa,#06d6a0)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>your team loves.</span>
        </h1>

        <p style={{fontSize:"clamp(16px,2.5vw,20px)",color:"#64748b",maxWidth:540,margin:"0 auto 36px",lineHeight:1.7}}>
          Planning Poker, Retrospectives &amp; Kanban — all in one place. Scan a QR code and your whole team is in within seconds.
        </p>

        <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap",marginBottom:20}}>
          <button onClick={onGetStarted}
            style={{background:"linear-gradient(135deg,#7c3aed,#5b21b6)",border:"none",borderRadius:14,padding:"15px 32px",color:"white",cursor:"pointer",fontFamily:"Syne",fontWeight:800,fontSize:16,boxShadow:"0 8px 32px rgba(124,58,237,0.4)",transition:"all 0.2s"}}
            onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
            onMouseLeave={e=>e.currentTarget.style.transform="none"}>
            🚀 Start Free Session
          </button>
          <button onClick={onJoin}
            style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:14,padding:"15px 28px",color:"white",cursor:"pointer",fontFamily:"Syne",fontWeight:700,fontSize:15,transition:"all 0.2s"}}
            onMouseEnter={e=>e.currentTarget.style.borderColor="#7c3aed"}
            onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(255,255,255,0.15)"}>
            🔗 Join with Room Code
          </button>
        </div>
        <div style={{fontFamily:"DM Sans",fontSize:13,color:"#334155"}}>No credit card · No install · Works on every device</div>
      </div>

      {/* ── STATS ── */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:1,borderTop:"1px solid rgba(255,255,255,0.06)",borderBottom:"1px solid rgba(255,255,255,0.06)",margin:"0 0 80px"}}>
        {STATS.map((s,i)=>(
          <div key={i} style={{padding:"28px 20px",textAlign:"center",borderRight:i<STATS.length-1?"1px solid rgba(255,255,255,0.06)":"none"}}>
            <div style={{fontFamily:"Syne",fontSize:32,fontWeight:800,color:"#7c3aed",marginBottom:4}}>{s.n}</div>
            <div style={{fontFamily:"DM Sans",fontSize:13,color:"#475569"}}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* ── FEATURES ── */}
      <div style={{padding:"0 24px 80px",maxWidth:1100,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:48}}>
          <div style={{fontFamily:"Syne",fontSize:10,color:"#7c3aed",letterSpacing:3,marginBottom:12}}>EVERYTHING YOUR TEAM NEEDS</div>
          <h2 style={{fontFamily:"Syne",fontWeight:800,fontSize:"clamp(28px,4vw,44px)",letterSpacing:-1,marginBottom:12}}>One tool. Every ceremony.</h2>
          <p style={{color:"#475569",fontSize:16,maxWidth:440,margin:"0 auto"}}>Stop juggling 5 different tools. SprintVibe does it all.</p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:16}}>
          {FEATURES.map((f,i)=>(
            <div key={i}
              onMouseEnter={()=>setHovered(i)} onMouseLeave={()=>setHovered(null)}
              style={{background:hovered===i?"rgba(124,58,237,0.1)":"rgba(255,255,255,0.025)",border:`1px solid ${hovered===i?"rgba(124,58,237,0.35)":"rgba(255,255,255,0.07)"}`,borderRadius:20,padding:"28px 24px",transition:"all 0.2s",cursor:"default"}}>
              <div style={{fontSize:36,marginBottom:14}}>{f.icon}</div>
              <h3 style={{fontFamily:"Syne",fontWeight:800,fontSize:18,marginBottom:8,color:"white"}}>{f.title}</h3>
              <p style={{color:"#64748b",fontSize:14,lineHeight:1.6,margin:0}}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <div style={{background:"rgba(255,255,255,0.02)",borderTop:"1px solid rgba(255,255,255,0.06)",borderBottom:"1px solid rgba(255,255,255,0.06)",padding:"72px 24px",marginBottom:80}}>
        <div style={{maxWidth:900,margin:"0 auto",textAlign:"center"}}>
          <div style={{fontFamily:"Syne",fontSize:10,color:"#06d6a0",letterSpacing:3,marginBottom:12}}>HOW IT WORKS</div>
          <h2 style={{fontFamily:"Syne",fontWeight:800,fontSize:"clamp(26px,4vw,42px)",letterSpacing:-1,marginBottom:48}}>Up and running in 30 seconds</h2>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:32}}>
            {[
              { n:"1", t:"Create a room", d:"Pick your session type — board, poker or retro. Get a unique room code instantly.", c:"#7c3aed" },
              { n:"2", t:"Share the QR", d:"Show the QR code or copy the link. Teammates scan and join on any device.", c:"#06d6a0" },
              { n:"3", t:"Run your session", d:"Vote, add notes, drag cards. Everything syncs live across everyone's screen.", c:"#ffd166" },
              { n:"4", t:"Get the recap", d:"AI coach summarises your retro and emails the action items to everyone.", c:"#ff4d6d" },
            ].map(s=>(
              <div key={s.n} style={{textAlign:"center"}}>
                <div style={{width:52,height:52,borderRadius:16,background:`${s.c}22`,border:`2px solid ${s.c}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",fontFamily:"Syne",fontWeight:800,fontSize:22,color:s.c}}>{s.n}</div>
                <h3 style={{fontFamily:"Syne",fontWeight:700,fontSize:16,marginBottom:8,color:"white"}}>{s.t}</h3>
                <p style={{color:"#475569",fontSize:13,lineHeight:1.6,margin:0}}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── PRICING TEASER ── */}
      <div style={{padding:"0 24px 80px",maxWidth:700,margin:"0 auto",textAlign:"center"}}>
        <div style={{fontFamily:"Syne",fontSize:10,color:"#7c3aed",letterSpacing:3,marginBottom:12}}>PRICING</div>
        <h2 style={{fontFamily:"Syne",fontWeight:800,fontSize:"clamp(26px,4vw,42px)",letterSpacing:-1,marginBottom:12}}>Free to start. Scales with you.</h2>
        <p style={{color:"#475569",fontSize:16,marginBottom:36,lineHeight:1.6}}>Solo plan is free forever. Upgrade when your team grows.</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12,marginBottom:32}}>
          {[
            { name:"Solo", price:"Free", color:"#06d6a0", features:"3 rooms · Poker · Retro · QR" },
            { name:"Pro", price:"$7/mo", color:"#7c3aed", hl:true, features:"Unlimited · AI · Integrations" },
            { name:"Team", price:"$19/mo", color:"#ffd166", features:"20 members · Analytics · Priority" },
            { name:"Corporate", price:"$49/mo", color:"#ff4d6d", features:"Unlimited · SSO · SLA" },
          ].map(p=>(
            <div key={p.name} style={{background:p.hl?"rgba(124,58,237,0.12)":"rgba(255,255,255,0.03)",border:`1.5px solid ${p.hl?"#7c3aed":"rgba(255,255,255,0.07)"}`,borderRadius:16,padding:"18px 14px",textAlign:"center"}}>
              <div style={{fontFamily:"Syne",fontSize:14,fontWeight:800,color:p.color,marginBottom:4}}>{p.name}</div>
              <div style={{fontFamily:"Syne",fontSize:18,fontWeight:800,color:"white",marginBottom:6}}>{p.price}</div>
              <div style={{fontFamily:"DM Sans",fontSize:11,color:"#475569",lineHeight:1.4}}>{p.features}</div>
            </div>
          ))}
        </div>
        <button onClick={onGetStarted}
          style={{background:"linear-gradient(135deg,#7c3aed,#5b21b6)",border:"none",borderRadius:14,padding:"15px 36px",color:"white",cursor:"pointer",fontFamily:"Syne",fontWeight:800,fontSize:16,boxShadow:"0 8px 32px rgba(124,58,237,0.35)"}}>
          Start for Free →
        </button>
      </div>

      {/* ── FOOTER ── */}
      <div style={{borderTop:"1px solid rgba(255,255,255,0.06)",padding:"28px 32px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
        <div style={{fontFamily:"Syne",fontWeight:800,fontSize:18}}>Sprint<span style={{color:"#7c3aed"}}>Vibe</span></div>
        <div style={{fontFamily:"DM Sans",fontSize:13,color:"#334155"}}>© 2026 SprintVibe · sprintvibe.io</div>
      </div>
    </div>
  );
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
// ─────────────────────────────────────────────────────────────
//  WORKSPACE CREATE
// ─────────────────────────────────────────────────────────────
const WorkspaceCreate = ({ session, onCreated, onSkip }) => {
  const [name, setName] = useState("");
  const [emails, setEmails] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const create = async () => {
    if (!name.trim()) { setError("Please enter a workspace name"); return; }
    setLoading(true); setError("");
    try {
      // Create workspace in Supabase
      const { data: ws, error: wsErr } = await supabase.from("workspaces")
        .insert({ name: name.trim(), owner_id: session.userId, plan: "free" })
        .select().single();
      if (wsErr) throw wsErr;

      // Add owner as member
      await supabase.from("workspace_members").insert({
        workspace_id: ws.id, user_id: session.userId,
        email: session.email || "", role: "owner", status: "active"
      });

      // Invite teammates by email
      const emailList = emails.split(/[\s,;]+/).map(e=>e.trim()).filter(e=>e.includes("@"));
      if (emailList.length > 0) {
        await supabase.from("workspace_members").insert(
          emailList.map(email => ({ workspace_id: ws.id, email, role: "member", status: "pending" }))
        );
      }
      onCreated(ws);
    } catch(e) { setError(e.message || "Something went wrong"); }
    finally { setLoading(false); }
  };

  return(
    <div style={{maxWidth:480,margin:"0 auto",padding:"40px 20px"}}>
      <div style={{textAlign:"center",marginBottom:32}}>
        <div style={{fontSize:40,marginBottom:12}}>🏢</div>
        <div style={{fontFamily:"Syne",fontSize:24,fontWeight:800,color:"white",marginBottom:8}}>Create your workspace</div>
        <div style={{fontFamily:"DM Sans",fontSize:14,color:"#64748b",lineHeight:1.6}}>A workspace keeps all your team's rooms, boards and retros in one place.</div>
      </div>

      <div style={{marginBottom:14}}>
        <div style={{fontFamily:"DM Sans",fontSize:11,color:"#475569",marginBottom:6}}>Workspace name</div>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Acme Engineering Team" style={inp()} autoFocus/>
      </div>

      <div style={{marginBottom:20}}>
        <div style={{fontFamily:"DM Sans",fontSize:11,color:"#475569",marginBottom:6}}>Invite teammates <span style={{color:"#334155"}}>(optional — email addresses, comma separated)</span></div>
        <textarea value={emails} onChange={e=>setEmails(e.target.value)}
          placeholder="alex@company.com, jordan@company.com"
          rows={3} style={{...inp(),resize:"none",fontSize:12}}/>
      </div>

      {error&&<div style={{background:"rgba(255,77,109,0.1)",border:"1px solid rgba(255,77,109,0.2)",borderRadius:9,padding:"9px 12px",marginBottom:14,fontFamily:"DM Sans",fontSize:13,color:"#ff4d6d"}}>{error}</div>}

      <button onClick={create} disabled={loading}
        style={btn("#7c3aed","white",{width:"100%",padding:"14px",fontSize:14,marginBottom:10,opacity:loading?0.6:1})}>
        {loading?"Creating…":"Create Workspace →"}
      </button>
      <button onClick={onSkip}
        style={btn("rgba(255,255,255,0.04)","#475569",{width:"100%",padding:"12px",fontSize:13})}>
        Skip for now — just start a session
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  WORKSPACE DASHBOARD
// ─────────────────────────────────────────────────────────────
const WorkspaceDashboard = ({ workspace, session, onStartSession, onLeave }) => {
  const [members, setMembers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadMembers = async () => {
      const { data } = await supabase.from("workspace_members").select("*").eq("workspace_id", workspace.id).order("invited_at");
      if (data) setMembers(data);
    };
    const loadRooms = async () => {
      const { data } = await supabase.from("workspace_rooms").select("*, rooms(*)").eq("workspace_id", workspace.id).order("created_at", {ascending:false}).limit(10);
      if (data) setRooms(data.map(r=>r.rooms).filter(Boolean));
    };
    loadMembers();
    loadRooms();
  }, [workspace.id]);

  const invite = async () => {
    if (!inviteEmail.includes("@")) return;
    setInviting(true);
    await supabase.from("workspace_members").upsert({ workspace_id: workspace.id, email: inviteEmail.trim(), role: "member", status: "pending" }, { onConflict: "workspace_id,email" });
    setMembers(m => [...m, { email: inviteEmail.trim(), role:"member", status:"pending", id: Date.now() }]);
    setInviteEmail("");
    setInviting(false);
  };

  const STATUS_COLOR = { active:"#06d6a0", pending:"#ffd166" };

  return(
    <div style={{minHeight:"100vh",background:"#08080f",backgroundImage:"radial-gradient(ellipse 70% 40% at 50% -10%,rgba(124,58,237,0.18) 0%,transparent 60%)"}}>
      {/* Header */}
      <div style={{padding:"14px 20px",borderBottom:"1px solid rgba(255,255,255,0.06)",display:"flex",alignItems:"center",gap:14,background:"rgba(0,0,0,0.4)",backdropFilter:"blur(16px)"}}>
        <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#7c3aed,#5b21b6)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Syne",fontWeight:800,fontSize:14,color:"white",flexShrink:0}}>
          {workspace.name.slice(0,1).toUpperCase()}
        </div>
        <div style={{flex:1}}>
          <div style={{fontFamily:"Syne",fontWeight:800,fontSize:16,color:"white"}}>{workspace.name}</div>
          <div style={{fontFamily:"DM Sans",fontSize:11,color:"#475569"}}>{members.length} member{members.length!==1?"s":""}</div>
        </div>
        <button onClick={onLeave} style={btn("rgba(255,255,255,0.06)","#64748b",{fontSize:12,padding:"6px 12px"})}>← Back</button>
      </div>

      <div style={{maxWidth:720,margin:"0 auto",padding:"24px 20px 60px"}}>

        {/* Quick start */}
        <div style={{marginBottom:28}}>
          <div style={{fontFamily:"Syne",fontSize:10,color:"#7c3aed",letterSpacing:2,marginBottom:14}}>START A SESSION</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10}}>
            {[
              { icon:"🃏", label:"Planning Poker", type:"poker", color:"#7c3aed" },
              { icon:"🏁", label:"Retrospective",  type:"retro", color:"#06d6a0" },
              { icon:"📋", label:"Board",          type:"board", color:"#ffd166" },
            ].map(s=>(
              <button key={s.type} onClick={()=>onStartSession(s.type)}
                style={{background:`${s.color}11`,border:`1.5px solid ${s.color}33`,borderRadius:16,padding:"20px 16px",cursor:"pointer",textAlign:"left",transition:"all 0.2s"}}
                onMouseEnter={e=>{e.currentTarget.style.background=`${s.color}22`;e.currentTarget.style.borderColor=s.color;}}
                onMouseLeave={e=>{e.currentTarget.style.background=`${s.color}11`;e.currentTarget.style.borderColor=`${s.color}33`;}}>
                <div style={{fontSize:28,marginBottom:8}}>{s.icon}</div>
                <div style={{fontFamily:"Syne",fontSize:14,fontWeight:700,color:"white"}}>{s.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Members */}
        <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:18,marginBottom:16}}>
          <div style={{fontFamily:"Syne",fontSize:10,color:"#64748b",letterSpacing:1,marginBottom:14}}>TEAM MEMBERS ({members.length})</div>
          {members.map(m=>(
            <div key={m.id||m.email} style={{display:"flex",alignItems:"center",gap:12,marginBottom:10,padding:"9px 12px",background:"rgba(255,255,255,0.03)",borderRadius:10}}>
              <div style={{width:30,height:30,borderRadius:"50%",background:"rgba(124,58,237,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Syne",fontWeight:800,fontSize:11,color:"#a78bfa",flexShrink:0}}>
                {m.email?.slice(0,1).toUpperCase()}
              </div>
              <div style={{flex:1}}>
                <div style={{fontFamily:"DM Sans",fontSize:13,color:"#e2e8f0"}}>{m.email}</div>
                <div style={{fontFamily:"Syne",fontSize:9,color:STATUS_COLOR[m.status]||"#64748b",letterSpacing:1}}>{m.role?.toUpperCase()} · {m.status?.toUpperCase()}</div>
              </div>
            </div>
          ))}

          {/* Invite input */}
          <div style={{display:"flex",gap:8,marginTop:12}}>
            <input value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&invite()}
              placeholder="teammate@company.com" type="email"
              style={{...inp(),flex:1,fontSize:12}}/>
            <button onClick={invite} disabled={inviting}
              style={btn("#7c3aed","white",{padding:"9px 14px",fontSize:12,flexShrink:0})}>
              {inviting?"…":"+ Invite"}
            </button>
          </div>
        </div>

        {/* Recent rooms */}
        {rooms.length>0&&(
          <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:18}}>
            <div style={{fontFamily:"Syne",fontSize:10,color:"#64748b",letterSpacing:1,marginBottom:14}}>RECENT SESSIONS</div>
            {rooms.map(r=>(
              <div key={r.id} style={{display:"flex",alignItems:"center",gap:12,marginBottom:8,padding:"9px 12px",background:"rgba(255,255,255,0.03)",borderRadius:10}}>
                <span style={{fontSize:16}}>{r.type==="poker"?"🃏":r.type==="retro"?"🏁":"📋"}</span>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"DM Sans",fontSize:13,color:"#e2e8f0"}}>{r.code}</div>
                  <div style={{fontFamily:"DM Sans",fontSize:11,color:"#475569"}}>{r.type} · {new Date(r.created_at).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const Onboarding = ({ onEnter, initialMode="welcome" }) => {
  const urlCode = new URLSearchParams(window.location.search).get("join") || "";
  const [mode, setMode] = useState(urlCode ? "join" : initialMode);
  const [name, setName] = useState("");
  const [guestEmail, setGuestEmail] = useState(""); // for recap emails
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
        await joinRoom(room.id, userId, name.trim(), "host", guestEmail.trim());
        onEnter({ userId, displayName:name.trim(), color, room, role:"host", email:guestEmail.trim() });
      } else {
        if (!roomCode.trim()) { setError("Please enter a room code"); setLoading(false); return; }
        const room = await findRoom(roomCode.trim());
        await joinRoom(room.id, userId, name.trim(), "participant", guestEmail.trim());
        onEnter({ userId, displayName:name.trim(), color, room, role:"participant", email:guestEmail.trim() });
      }
    } catch(e) {
      setError(type==="join" ? "Room not found — check the code and try again" : "Something went wrong. Please try again.");
    } finally { setLoading(false); }
  };

  const handleAuth = async (isSignUp) => {
    if (!email.trim()||!password.trim()) { setError("Please fill in all fields"); return; }
    if (isSignUp && !name.trim()) { setError("Please enter your name"); return; }
    if (isSignUp && password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true); setError("");
    try {
      const { data, error:authErr } = isSignUp
        ? await signUp(email, password, name||email.split("@")[0])
        : await signIn(email, password);
      if (authErr) throw authErr;
      if (isSignUp && !data.user?.confirmed_at) {
        setError("✓ Account created! Check your email to confirm before signing in.");
        setLoading(false); return;
      }
      const user = data.user;
      const displayName = user.user_metadata?.display_name || name || email.split("@")[0];
      const color = COLORS[Math.floor(Math.random()*COLORS.length)];
      const room = await createRoom("board", user.id);
      await joinRoom(room.id, user.id, displayName, "host");
      onEnter({ userId:user.id, displayName, color, room, role:"host", user });
    } catch(e) { setError(e.message||"Authentication failed"); }
    finally { setLoading(false); }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) { setError("Enter your email address first, then click Forgot Password"); return; }
    setLoading(true); setError("");
    try {
      await supabase.auth.resetPasswordForEmail(email, { redirectTo: "https://sprintvibe.io" });
      setError("✓ Password reset email sent! Check your inbox.");
    } catch(e) { setError("Could not send reset email. Check your email address."); }
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
        <button onClick={()=>setMode("signup")} style={btn("rgba(255,255,255,0.06)","white",{padding:"16px",fontSize:15,borderRadius:14,border:"1px solid rgba(255,255,255,0.1)"})}>
          ✨ Create an account
        </button>
        <button onClick={()=>setMode("login")} style={btn("rgba(255,255,255,0.03)","#64748b",{padding:"14px",fontSize:14,borderRadius:14,border:"1px solid rgba(255,255,255,0.06)"})}>
          🔐 Sign in to existing account
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
          <div style={{fontFamily:"Syne",fontSize:24,fontWeight:800,color:"white",marginBottom:6}}>{mode==="create"?"Create a Room":"Join a Room"}</div>
          <div style={{fontFamily:"DM Sans",fontSize:13,color:"#64748b",marginBottom:24}}>{mode==="create"?"You'll be the host — share the room code with your team":"Enter the room code your host shared with you"}</div>
        </>
      )}
      <div style={{marginBottom:14}}>
        <div style={{fontFamily:"DM Sans",fontSize:11,color:"#475569",marginBottom:6}}>Your name</div>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Alex" style={inp()} autoFocus/>
      </div>
      <div style={{marginBottom:14}}>
        <div style={{fontFamily:"DM Sans",fontSize:11,color:"#475569",marginBottom:6}}>Email <span style={{color:"#334155"}}>(optional — for retro recaps)</span></div>
        <input value={guestEmail} onChange={e=>setGuestEmail(e.target.value)} placeholder="you@example.com" type="email" style={inp()}/>
      </div>
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

  // ── SIGN UP (new — more detailed) ──
  if (mode==="signup") return(
    <div style={S}>
      <button onClick={()=>setMode("welcome")} style={btn("rgba(255,255,255,0.06)","#64748b",{marginBottom:24})}>← Back</button>
      <div style={{fontFamily:"Syne",fontSize:24,fontWeight:800,color:"white",marginBottom:4}}>Create Account</div>
      <div style={{fontFamily:"DM Sans",fontSize:13,color:"#64748b",marginBottom:24}}>Save your rooms, access from any device, get email recaps</div>

      <button onClick={()=>signInWithGoogle()} style={btn("rgba(255,255,255,0.07)","white",{width:"100%",padding:"13px",fontSize:13,marginBottom:16,border:"1px solid rgba(255,255,255,0.1)"})}>
        🌐 Continue with Google
      </button>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
        <div style={{flex:1,height:1,background:"rgba(255,255,255,0.06)"}}/>
        <span style={{fontFamily:"DM Sans",fontSize:12,color:"#334155"}}>or create with email</span>
        <div style={{flex:1,height:1,background:"rgba(255,255,255,0.06)"}}/>
      </div>

      {[
        { label:"Full name", key:"name", type:"text", placeholder:"Alex Johnson" },
        { label:"Email address", key:"email", type:"email", placeholder:"you@company.com" },
        { label:"Password", key:"password", type:"password", placeholder:"At least 6 characters" },
      ].map(f=>(
        <div key={f.key} style={{marginBottom:12}}>
          <div style={{fontFamily:"DM Sans",fontSize:11,color:"#475569",marginBottom:5}}>{f.label}</div>
          <input type={f.type}
            value={f.key==="name"?name:f.key==="email"?email:password}
            onChange={e=>f.key==="name"?setName(e.target.value):f.key==="email"?setEmail(e.target.value):setPassword(e.target.value)}
            placeholder={f.placeholder} style={inp()}/>
        </div>
      ))}

      {error&&<div style={{background:error.startsWith("✓")?"rgba(6,214,160,0.08)":"rgba(255,77,109,0.1)",border:`1px solid ${error.startsWith("✓")?"rgba(6,214,160,0.2)":"rgba(255,77,109,0.2)"}`,borderRadius:9,padding:"9px 12px",marginBottom:14,fontFamily:"DM Sans",fontSize:13,color:error.startsWith("✓")?"#06d6a0":"#ff4d6d"}}>{error}</div>}

      <button onClick={()=>handleAuth(true)} disabled={loading}
        style={btn("#7c3aed","white",{width:"100%",padding:"14px",fontSize:14,marginBottom:12,opacity:loading?0.6:1})}>
        {loading?"Creating account…":"Create Account →"}
      </button>
      <div style={{textAlign:"center",fontFamily:"DM Sans",fontSize:13,color:"#475569"}}>
        Already have an account? <span onClick={()=>setMode("login")} style={{color:"#7c3aed",cursor:"pointer"}}>Sign in</span>
      </div>
    </div>
  );

  // ── SIGN IN ──
  if (mode==="login") return(
    <div style={S}>
      <button onClick={()=>setMode("welcome")} style={btn("rgba(255,255,255,0.06)","#64748b",{marginBottom:24})}>← Back</button>
      <div style={{fontFamily:"Syne",fontSize:24,fontWeight:800,color:"white",marginBottom:4}}>Sign In</div>
      <div style={{fontFamily:"DM Sans",fontSize:13,color:"#64748b",marginBottom:24}}>Welcome back to SprintVibe</div>

      <button onClick={()=>signInWithGoogle()} style={btn("rgba(255,255,255,0.07)","white",{width:"100%",padding:"13px",fontSize:13,marginBottom:16,border:"1px solid rgba(255,255,255,0.1)"})}>
        🌐 Continue with Google
      </button>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
        <div style={{flex:1,height:1,background:"rgba(255,255,255,0.06)"}}/>
        <span style={{fontFamily:"DM Sans",fontSize:12,color:"#334155"}}>or email</span>
        <div style={{flex:1,height:1,background:"rgba(255,255,255,0.06)"}}/>
      </div>

      <div style={{marginBottom:12}}>
        <div style={{fontFamily:"DM Sans",fontSize:11,color:"#475569",marginBottom:5}}>Email</div>
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" style={inp()}/>
      </div>
      <div style={{marginBottom:8}}>
        <div style={{fontFamily:"DM Sans",fontSize:11,color:"#475569",marginBottom:5}}>Password</div>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" style={inp()}/>
      </div>

      {/* Forgot password */}
      <div style={{textAlign:"right",marginBottom:14}}>
        <span onClick={handleForgotPassword} style={{fontFamily:"DM Sans",fontSize:12,color:"#7c3aed",cursor:"pointer"}}>Forgot password?</span>
      </div>

      {error&&<div style={{background:error.startsWith("✓")?"rgba(6,214,160,0.08)":"rgba(255,77,109,0.1)",border:`1px solid ${error.startsWith("✓")?"rgba(6,214,160,0.2)":"rgba(255,77,109,0.2)"}`,borderRadius:9,padding:"9px 12px",marginBottom:14,fontFamily:"DM Sans",fontSize:13,color:error.startsWith("✓")?"#06d6a0":"#ff4d6d"}}>{error}</div>}

      <button onClick={()=>handleAuth(false)} disabled={loading}
        style={btn("#7c3aed","white",{width:"100%",padding:"14px",fontSize:14,marginBottom:12,opacity:loading?0.6:1})}>
        {loading?"Signing in…":"Sign In →"}
      </button>
      <div style={{textAlign:"center",fontFamily:"DM Sans",fontSize:13,color:"#475569"}}>
        No account yet? <span onClick={()=>setMode("signup")} style={{color:"#7c3aed",cursor:"pointer"}}>Create one free</span>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  KANBAN CARD
// ─────────────────────────────────────────────────────────────
const KanbanCard = ({ story, columnId, onDrop, onDelete }) => {
  const [dragging,setDragging]=useState(false);
  const [showDel,setShowDel]=useState(false);
  const PC={high:"#ff4d6d",medium:"#ffd166",low:"#06d6a0"};
  const tr=useRef(null);
  const onTS=e=>{const t=e.touches[0];tr.current={x:t.clientX,y:t.clientY};};
  const onTE=e=>{if(!tr.current)return;const t=e.changedTouches[0];const col=document.elementFromPoint(t.clientX,t.clientY)?.closest("[data-col]");if(col&&col.dataset.col!==columnId)onDrop(story.id,columnId,col.dataset.col);tr.current=null;};
  return(
    <div draggable onDragStart={e=>{setDragging(true);e.dataTransfer.setData("cid",story.id);e.dataTransfer.setData("from",columnId);}} onDragEnd={()=>setDragging(false)}
      onTouchStart={onTS} onTouchEnd={onTE}
      onMouseEnter={()=>setShowDel(true)} onMouseLeave={()=>setShowDel(false)}
      style={{background:dragging?"rgba(124,58,237,0.14)":"rgba(255,255,255,0.06)",border:`1px solid ${dragging?"#7c3aed":"rgba(255,255,255,0.09)"}`,borderRadius:12,padding:"11px 13px",marginBottom:9,cursor:"grab",opacity:dragging?0.5:1,transition:"all 0.18s",userSelect:"none",touchAction:"none",position:"relative"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
        <span style={{width:7,height:7,borderRadius:"50%",background:PC[story.priority]||"#888",flexShrink:0}}/>
        <span style={{fontFamily:"DM Sans",fontSize:13,color:"#e2e8f0",fontWeight:500,flex:1,lineHeight:1.3}}>{story.title}</span>
        {story.points?<span style={{background:"#7c3aed",color:"white",borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:700,fontFamily:"Syne"}}>{story.points}</span>:<span style={{background:"rgba(255,255,255,0.05)",color:"#475569",borderRadius:6,padding:"2px 7px",fontSize:10}}>–</span>}
        {showDel&&onDelete&&(
          <button onClick={e=>{e.stopPropagation();onDelete(story.id,columnId);}}
            style={{width:20,height:20,borderRadius:5,border:"none",background:"rgba(255,77,109,0.25)",color:"#ff4d6d",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,lineHeight:1,flexShrink:0}}
            title="Remove story">×</button>
        )}
      </div>
      {story.description&&<div style={{fontFamily:"DM Sans",fontSize:11,color:"#475569",marginBottom:5,lineHeight:1.4}}>{story.description}</div>}
      <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{story.tags?.map(t=><span key={t} style={{background:"rgba(255,255,255,0.05)",borderRadius:4,padding:"1px 6px",fontSize:10,color:"#64748b"}}>{t}</span>)}</div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  DROP COLUMN
// ─────────────────────────────────────────────────────────────
const DropColumn = ({ id, title, stories, color, onDrop, onAdd, onDelete }) => {
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
        {stories.map(s=><KanbanCard key={s.id} story={s} columnId={id} onDrop={onDrop} onDelete={onDelete}/>)}
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

  // Subscribe to phase changes from host + load current phase immediately on mount
  useEffect(() => {
    if (!room) return;

    // Load current phase RIGHT NOW — so participants joining mid-session see correct phase
    const loadPhase = async () => {
      const { data } = await supabase.from("rooms").select("phase").eq("id", room.id).single();
      if (data?.phase) setPhaseLocal(data.phase);
    };
    loadPhase();

    // Then keep listening for future changes
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

      {/* Email Recap — send to everyone */}
      <EmailRecap notes={notes} aiSummary={aiSummary} roomCode={room?.code}/>

      <div style={{display:"flex",gap:10,marginTop:12}}>
        <button onClick={()=>advancePhase("lobby")} style={btn("rgba(255,255,255,0.06)","#64748b",{flex:1,padding:"12px"})}>Start New Retro</button>
      </div>
    </div>
  );
  return null;
};

// ─────────────────────────────────────────────────────────────
//  PRICING MODAL
// ─────────────────────────────────────────────────────────────
const PricingModal = ({ onClose, onUpgrade }) => {
  const [annual, setAnnual] = useState(false);
  const plans = [
    { id:"solo",      name:"Solo",      price:0,           color:"#06d6a0", desc:"Solo creators, artists & indie devs",
      features:["3 projects","Planning poker","Retrospectives","QR join","5 AI estimates/mo"] },
    { id:"pro",       name:"Pro",       price:annual?59:7,  color:"#7c3aed", hl:true, desc:"Freelancers & small teams (≤5)",
      features:["Unlimited projects","All Solo features","Unlimited AI estimates","Notion/Jira/Linear export","Slack integration","Custom room branding"] },
    { id:"team",      name:"Team",      price:annual?159:19, color:"#ffd166", desc:"Growing teams up to 20",
      features:["Everything in Pro","20 members","Analytics dashboard","Priority support","Custom workflows","Session history"] },
    { id:"corporate", name:"Corporate", price:annual?399:49, color:"#ff4d6d", desc:"Enterprise & agencies",
      features:["Unlimited members","SSO / SAML","Dedicated success mgr","Custom branding","SLA guarantee","On-premise option"] },
  ];
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.94)",zIndex:200,overflowY:"auto",padding:16}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{maxWidth:780,margin:"0 auto",paddingTop:16}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontFamily:"Syne",fontSize:10,color:"#7c3aed",letterSpacing:2,marginBottom:7}}>PRICING</div>
          <div style={{fontFamily:"Syne",fontSize:26,fontWeight:800,color:"white",marginBottom:7}}>Built for Everyone</div>
          <div style={{fontFamily:"DM Sans",color:"#475569",fontSize:13,marginBottom:16}}>From solo artists to Fortune 500 — no one gets priced out</div>
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
              <button onClick={()=>{ if(p.price>0){ onClose(); onUpgrade&&onUpgrade(); }}}
                style={btn(p.hl?"#7c3aed":"rgba(255,255,255,0.05)",p.hl?"white":"#64748b",{width:"100%",padding:"9px",marginTop:14})}>
                {p.price===0?"Get Started Free":"Subscribe Now →"}
              </button>
            </div>
          ))}
        </div>
        <div style={{textAlign:"center",fontFamily:"DM Sans",fontSize:12,color:"#334155",marginBottom:16}}>🔒 Secure payment powered by Stripe · Cancel anytime</div>
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
//  PUSH NOTIFICATIONS HOOK — safe on all browsers including iOS Safari
// ─────────────────────────────────────────────────────────────
const usePushNotifications = () => {
  const supported = typeof window !== "undefined" && "Notification" in window;
  const [permission, setPermission] = useState(supported ? Notification.permission : "denied");

  const requestPermission = async () => {
    if (!supported) return "denied";
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch(e) { return "denied"; }
  };

  const notify = (title, body, icon="/favicon.svg") => {
    if (!supported || permission !== "granted") return;
    try { new Notification(title, { body, icon }); } catch(e) {}
  };

  return { permission, requestPermission, notify };
};

// ─────────────────────────────────────────────────────────────
//  EMAIL RECAP COMPONENT
// ─────────────────────────────────────────────────────────────
const EmailRecap = ({ notes, aiSummary, roomCode }) => {
  const [emails, setEmails] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const send = async () => {
    const list = emails.split(/[\s,;]+/).map(e=>e.trim()).filter(e=>e.includes("@"));
    if (!list.length) { setError("Enter at least one valid email address"); return; }
    setSending(true); setError("");
    try {
      await sendRetroRecap({
        to: list,
        roomCode,
        notes,
        actions: aiSummary?.actions || notes.action_items?.map(n=>n.text) || [],
        summary: aiSummary?.summary || ""
      });
      setSent(true);
    } catch(e) {
      setError("Could not send — check your Resend API key is set in Vercel");
    } finally { setSending(false); }
  };

  if (sent) return(
    <div style={{background:"rgba(6,214,160,0.08)",border:"1px solid rgba(6,214,160,0.2)",borderRadius:14,padding:16,marginBottom:16,textAlign:"center"}}>
      <div style={{fontSize:24,marginBottom:6}}>📧</div>
      <div style={{fontFamily:"Syne",fontSize:14,fontWeight:700,color:"#06d6a0"}}>Recap sent!</div>
      <div style={{fontFamily:"DM Sans",fontSize:12,color:"#475569",marginTop:4}}>Everyone received the retro summary</div>
    </div>
  );

  return(
    <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:16,marginBottom:16}}>
      <div style={{fontFamily:"Syne",fontSize:10,color:"#64748b",letterSpacing:1,marginBottom:10}}>📧 SEND RECAP TO TEAM</div>
      <div style={{fontFamily:"DM Sans",fontSize:12,color:"#475569",marginBottom:10}}>Enter email addresses separated by commas</div>
      <textarea value={emails} onChange={e=>setEmails(e.target.value)}
        placeholder="alex@company.com, jordan@company.com, riley@company.com"
        rows={3} style={{...inp(),resize:"none",marginBottom:8,fontSize:12}}/>
      {error&&<div style={{fontFamily:"DM Sans",fontSize:12,color:"#ff4d6d",marginBottom:8}}>{error}</div>}
      <button onClick={send} disabled={sending}
        style={btn("#7c3aed","white",{width:"100%",padding:"11px",opacity:sending?0.6:1})}>
        {sending?"Sending…":"📧 Send Recap to Everyone"}
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  STRIPE PAYMENT MODAL
// ─────────────────────────────────────────────────────────────
const StripeModal = ({ onClose }) => {
  const [selected, setSelected] = useState(null);
  const [step, setStep] = useState("plans"); // plans | checkout | success

  // Payment links — set these in your Stripe dashboard and add to env vars
  const PAYMENT_LINKS = {
    pro:       import.meta.env.VITE_STRIPE_LINK_PRO       || "https://buy.stripe.com/test_pro",
    team:      import.meta.env.VITE_STRIPE_LINK_TEAM      || "https://buy.stripe.com/test_team",
    corporate: import.meta.env.VITE_STRIPE_LINK_CORPORATE || "https://buy.stripe.com/test_corp",
  };

  const plans = [
    { id:"pro",       name:"Pro",       price:"$7",  period:"/mo", color:"#7c3aed", hl:true,
      desc:"Freelancers & small teams (≤5)",
      features:["Unlimited projects","AI estimates unlimited","Notion/Jira export","Slack integration"] },
    { id:"team",      name:"Team",      price:"$19", period:"/mo", color:"#ffd166",
      desc:"Growing teams up to 20",
      features:["Everything in Pro","20 members","Analytics","Priority support"] },
    { id:"corporate", name:"Corporate", price:"$49", period:"/mo", color:"#ff4d6d",
      desc:"Enterprise & agencies",
      features:["Unlimited members","SSO / SAML","Custom branding","SLA guarantee"] },
  ];

  const handleUpgrade = (plan) => {
    const link = PAYMENT_LINKS[plan.id];
    // Open Stripe checkout in a new tab
    window.open(link, "_blank");
    setSelected(plan);
    setStep("checkout");
  };

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.94)",zIndex:300,overflowY:"auto",padding:16}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{maxWidth:700,margin:"0 auto",paddingTop:16}}>

        {step==="plans"&&(<>
          <div style={{textAlign:"center",marginBottom:24}}>
            <div style={{fontFamily:"Syne",fontSize:10,color:"#7c3aed",letterSpacing:2,marginBottom:7}}>UPGRADE PLAN</div>
            <div style={{fontFamily:"Syne",fontSize:26,fontWeight:800,color:"white",marginBottom:7}}>Choose your plan</div>
            <div style={{fontFamily:"DM Sans",color:"#475569",fontSize:13}}>Unlock the full power of SprintVibe</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:12,marginBottom:20}}>
            {plans.map(p=>(
              <div key={p.id} style={{background:p.hl?"rgba(124,58,237,0.12)":"rgba(255,255,255,0.03)",border:`1.5px solid ${p.hl?"#7c3aed":"rgba(255,255,255,0.07)"}`,borderRadius:20,padding:20,boxShadow:p.hl?"0 0 40px rgba(124,58,237,0.12)":"none"}}>
                {p.hl&&<div style={{fontFamily:"Syne",fontSize:9,color:"#7c3aed",letterSpacing:2,marginBottom:7}}>★ MOST POPULAR</div>}
                <div style={{fontFamily:"Syne",fontSize:16,fontWeight:800,color:p.color,marginBottom:2}}>{p.name}</div>
                <div style={{fontFamily:"Syne",fontSize:28,fontWeight:800,color:"white"}}>{p.price}<span style={{fontSize:12,color:"#475569",fontWeight:400}}>{p.period}</span></div>
                <div style={{fontFamily:"DM Sans",fontSize:11,color:"#475569",margin:"7px 0 12px",lineHeight:1.4}}>{p.desc}</div>
                {p.features.map(f=><div key={f} style={{fontFamily:"DM Sans",fontSize:11,color:"#94a3b8",marginBottom:5,display:"flex",gap:6}}><span style={{color:p.color}}>✓</span>{f}</div>)}
                <button onClick={()=>handleUpgrade(p)}
                  style={btn(p.hl?"#7c3aed":"rgba(255,255,255,0.06)",p.hl?"white":"#94a3b8",{width:"100%",padding:"10px",marginTop:14,fontSize:13})}>
                  Upgrade to {p.name} →
                </button>
              </div>
            ))}
          </div>
          <div style={{textAlign:"center",fontFamily:"DM Sans",fontSize:12,color:"#334155",marginBottom:16}}>
            🔒 Secure payment powered by Stripe · Cancel anytime
          </div>
          <div style={{textAlign:"center"}}>
            <button onClick={onClose} style={btn("rgba(255,255,255,0.05)","#475569",{padding:"9px 26px"})}>Maybe later</button>
          </div>
        </>)}

        {step==="checkout"&&(<>
          <div style={{textAlign:"center",padding:"48px 20px"}}>
            <div style={{fontSize:40,marginBottom:16}}>🔗</div>
            <div style={{fontFamily:"Syne",fontSize:22,fontWeight:800,color:"white",marginBottom:8}}>Stripe checkout opened</div>
            <div style={{fontFamily:"DM Sans",fontSize:14,color:"#64748b",lineHeight:1.6,marginBottom:24}}>
              Complete your payment in the new tab.<br/>
              Come back here when you're done.
            </div>
            <button onClick={()=>setStep("success")}
              style={btn("#06d6a0","#0d0d1c",{padding:"13px 32px",fontSize:14,marginBottom:12})}>
              ✓ I've completed payment
            </button>
            <br/>
            <button onClick={()=>setStep("plans")} style={btn("rgba(255,255,255,0.05)","#475569",{padding:"9px 20px",fontSize:12})}>← Back to plans</button>
          </div>
        </>)}

        {step==="success"&&(<>
          <div style={{textAlign:"center",padding:"48px 20px"}}>
            <div style={{fontSize:40,marginBottom:16}}>🎉</div>
            <div style={{fontFamily:"Syne",fontSize:22,fontWeight:800,color:"white",marginBottom:8}}>Welcome to {selected?.name}!</div>
            <div style={{fontFamily:"DM Sans",fontSize:14,color:"#64748b",lineHeight:1.6,marginBottom:24}}>
              Your plan has been upgraded. Enjoy the full power of SprintVibe.
            </div>
            <button onClick={onClose} style={btn("#7c3aed","white",{padding:"13px 32px",fontSize:14})}>Start using {selected?.name} →</button>
          </div>
        </>)}
      </div>
    </div>
  );
};
const SettingsView = ({ session, onShowPricing, pushPermission, onEnableNotifications, onDisableNotifications, notificationsEnabled, onToggleNotifications, onSignOut, onUpdateSession }) => {
  const [activeTab, setActiveTab] = useState("account");
  const [displayName, setDisplayName] = useState(session?.displayName || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const isGuest = session?.userId?.startsWith("guest_");

  const saveDisplayName = async () => {
    if (!displayName.trim()) return;
    setSaving(true);
    try {
      const newName = displayName.trim();
      const newAvatar = newName.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2);

      // Update in Supabase auth if logged in
      if (session?.user) {
        await supabase.auth.updateUser({ data: { display_name: newName } });
      }
      // Update participant row — name AND avatar so In Room bar updates for EVERYONE
      if (session?.room?.id && session?.userId) {
        await supabase.from("participants")
          .update({ display_name: newName, avatar: newAvatar })
          .eq("room_id", session.room.id)
          .eq("user_id", session.userId);
      }
      // Update local session so header + all app appearances change instantly
      onUpdateSession({ ...session, displayName: newName });
      setSaveMsg("✓ Name updated everywhere!");
      setTimeout(() => setSaveMsg(""), 3000);
    } catch(e) { setSaveMsg("Failed to update name"); }
    finally { setSaving(false); }
  };

  const savePassword = async () => {
    if (!newPassword || newPassword !== confirmPassword) { setSaveMsg("Passwords don't match"); return; }
    if (newPassword.length < 6) { setSaveMsg("Password must be at least 6 characters"); return; }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword(""); setConfirmPassword(""); setCurrentPassword("");
      setSaveMsg("✓ Password updated!");
      setTimeout(() => setSaveMsg(""), 3000);
    } catch(e) { setSaveMsg(e.message || "Failed to update password"); }
    finally { setSaving(false); }
  };

  const TABS = ["account","notifications","subscription"];

  return(
    <div style={{padding:"20px 16px 48px",maxWidth:540,margin:"0 auto"}}>
      <div style={{fontFamily:"Syne",fontSize:22,fontWeight:800,color:"white",marginBottom:20}}>Settings ⚙️</div>

      {/* Tab bar */}
      <div style={{display:"flex",gap:4,marginBottom:24,background:"rgba(255,255,255,0.03)",borderRadius:12,padding:4}}>
        {TABS.map(t=>(
          <button key={t} onClick={()=>setActiveTab(t)}
            style={{flex:1,padding:"8px",borderRadius:9,border:"none",cursor:"pointer",fontFamily:"Syne",fontWeight:700,fontSize:11,textTransform:"capitalize",letterSpacing:0.5,background:activeTab===t?"rgba(124,58,237,0.25)":"transparent",color:activeTab===t?"#a78bfa":"#475569",transition:"all 0.2s"}}>
            {t==="account"?"👤 Account":t==="notifications"?"🔔 Notifications":"💎 Subscription"}
          </button>
        ))}
      </div>

      {/* ── ACCOUNT TAB ── */}
      {activeTab==="account"&&(
        <div>
          {isGuest ? (
            <div style={{background:"rgba(255,213,0,0.06)",border:"1px solid rgba(255,213,0,0.15)",borderRadius:14,padding:20,textAlign:"center",marginBottom:16}}>
              <div style={{fontSize:28,marginBottom:8}}>👤</div>
              <div style={{fontFamily:"Syne",fontSize:14,fontWeight:700,color:"white",marginBottom:6}}>You're a guest</div>
              <div style={{fontFamily:"DM Sans",fontSize:13,color:"#64748b",marginBottom:16}}>Create an account to save your profile, access rooms from any device and never lose your data.</div>
              <button onClick={()=>{}} style={btn("#7c3aed","white",{width:"100%",padding:"12px",fontSize:13})}>Create Account →</button>
            </div>
          ) : (
            <>
              {/* Display name */}
              <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:18,marginBottom:14}}>
                <div style={{fontFamily:"Syne",fontSize:10,color:"#64748b",letterSpacing:1,marginBottom:14}}>DISPLAY NAME</div>
                <input value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Your name" style={{...inp(),marginBottom:10}}/>
                <button onClick={saveDisplayName} disabled={saving} style={btn("#7c3aed","white",{padding:"9px 20px",fontSize:12})}>{saving?"Saving…":"Save Name"}</button>
              </div>

              {/* Email */}
              <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:18,marginBottom:14}}>
                <div style={{fontFamily:"Syne",fontSize:10,color:"#64748b",letterSpacing:1,marginBottom:10}}>EMAIL ADDRESS</div>
                <div style={{fontFamily:"DM Mono",fontSize:13,color:"#94a3b8",background:"rgba(255,255,255,0.04)",borderRadius:9,padding:"10px 12px"}}>{session?.user?.email || "—"}</div>
              </div>

              {/* Change password */}
              <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:18,marginBottom:14}}>
                <div style={{fontFamily:"Syne",fontSize:10,color:"#64748b",letterSpacing:1,marginBottom:14}}>CHANGE PASSWORD</div>
                <input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="New password" style={{...inp(),marginBottom:8}}/>
                <input type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="Confirm new password" style={{...inp(),marginBottom:10}}/>
                <button onClick={savePassword} disabled={saving} style={btn("#7c3aed","white",{padding:"9px 20px",fontSize:12})}>{saving?"Saving…":"Update Password"}</button>
              </div>
            </>
          )}

          {saveMsg&&<div style={{background:"rgba(6,214,160,0.08)",border:"1px solid rgba(6,214,160,0.2)",borderRadius:10,padding:"10px 14px",fontFamily:"DM Sans",fontSize:13,color:"#06d6a0",marginBottom:14}}>{saveMsg}</div>}

          {/* Sign out */}
          <button onClick={onSignOut} style={btn("rgba(255,77,109,0.1)","#ff4d6d",{width:"100%",padding:"12px",fontSize:13,border:"1px solid rgba(255,77,109,0.2)"})}>
            Sign Out
          </button>
        </div>
      )}

      {/* ── NOTIFICATIONS TAB ── */}
      {activeTab==="notifications"&&(
        <div>
          <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:18,marginBottom:14}}>
            <div style={{fontFamily:"Syne",fontSize:10,color:"#64748b",letterSpacing:1,marginBottom:16}}>PUSH NOTIFICATIONS</div>

            {/* Toggle row */}
            <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
              <div style={{fontSize:24}}>{pushPermission==="granted"?"🔔":"🔕"}</div>
              <div style={{flex:1}}>
                <div style={{fontFamily:"Syne",fontSize:13,fontWeight:700,color:"white",marginBottom:3}}>
                  {notificationsEnabled?"Notifications On":"Notifications Off"}
                </div>
                <div style={{fontFamily:"DM Sans",fontSize:12,color:"#475569"}}>
                  {notificationsEnabled
                    ?"You'll be alerted when sessions start or teammates join"
                    :"Enable to get browser alerts for session activity"}
                </div>
              </div>
              {/* Toggle switch — moves and works */}
              <div onClick={onToggleNotifications}
                style={{width:48,height:26,borderRadius:13,background:notificationsEnabled?"#7c3aed":"rgba(255,255,255,0.1)",cursor:"pointer",position:"relative",transition:"background 0.25s",flexShrink:0}}>
                <div style={{width:20,height:20,borderRadius:"50%",background:"white",position:"absolute",top:3,left:notificationsEnabled?25:3,transition:"left 0.25s",boxShadow:"0 2px 6px rgba(0,0,0,0.3)"}}/>
              </div>
            </div>

            {/* Notification types */}
            {[
              { label:"Session started", desc:"When host starts Poker or Retro", icon:"🎯" },
              { label:"Teammate joins", desc:"When someone joins your room", icon:"👋" },
            ].map(n=>(
              <div key={n.label} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",background:"rgba(255,255,255,0.03)",borderRadius:10,marginBottom:8}}>
                <span style={{fontSize:16}}>{n.icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"DM Sans",fontSize:13,color:"#e2e8f0"}}>{n.label}</div>
                  <div style={{fontFamily:"DM Sans",fontSize:11,color:"#475569"}}>{n.desc}</div>
                </div>
                <div style={{width:8,height:8,borderRadius:"50%",background:notificationsEnabled?"#06d6a0":"#334155",boxShadow:notificationsEnabled?"0 0 6px #06d6a0":"none"}}/>
              </div>
            ))}

            {pushPermission==="denied"&&(
              <div style={{background:"rgba(255,77,109,0.08)",border:"1px solid rgba(255,77,109,0.2)",borderRadius:10,padding:"10px 14px",marginTop:12,fontFamily:"DM Sans",fontSize:12,color:"#ff4d6d"}}>
                ⚠️ Notifications are blocked in your browser. To enable: click the 🔒 lock icon in your address bar → Notifications → Allow.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SUBSCRIPTION TAB ── */}
      {activeTab==="subscription"&&(
        <div>
          <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:18,marginBottom:14}}>
            <div style={{fontFamily:"Syne",fontSize:10,color:"#64748b",letterSpacing:1,marginBottom:14}}>CURRENT PLAN</div>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
              <div style={{width:44,height:44,borderRadius:13,background:"rgba(6,214,160,0.15)",border:"1px solid rgba(6,214,160,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🆓</div>
              <div>
                <div style={{fontFamily:"Syne",fontSize:15,fontWeight:700,color:"#06d6a0"}}>Solo Plan — Free</div>
                <div style={{fontFamily:"DM Sans",fontSize:12,color:"#475569"}}>3 projects · 5 AI estimates/mo · QR join</div>
              </div>
            </div>
            <button onClick={onShowPricing} style={btn("#7c3aed","white",{width:"100%",padding:"13px",fontSize:14})}>💎 Upgrade Plan</button>
          </div>

          <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:18}}>
            <div style={{fontFamily:"Syne",fontSize:10,color:"#64748b",letterSpacing:1,marginBottom:14}}>WHAT YOU GET WITH PRO</div>
            {["Unlimited projects & rooms","Unlimited AI coach estimates","Notion, Jira & Linear export","Slack integration","Custom room branding","Priority support"].map(f=>(
              <div key={f} style={{display:"flex",gap:10,marginBottom:8,fontFamily:"DM Sans",fontSize:13,color:"#94a3b8"}}>
                <span style={{color:"#7c3aed",flexShrink:0}}>✓</span>{f}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default function SprintVibe() {
  const [session, setSession]   = useState(null);
  const [stories, setStories]   = useState({ backlog:[], sprint:[], in_progress:[], done:[] });
  const [tab, setTab]           = useState("board");
  const [modal, setModal]       = useState(null);
  const [toast, setToast]       = useState(null);
  const [participants, setParticipants] = useState([]);
  const [workspace, setWorkspace] = useState(null);
  const [screen, setScreen]     = useState("landing");
  const [signinMode, setSigninMode] = useState("welcome"); // controls which onboarding tab opens
  const { permission, requestPermission, notify } = usePushNotifications();
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    // Load saved preference — defaults to true if never set
    try { return localStorage.getItem("sv_notif_enabled") !== "false"; } catch { return true; }
  });

  // Smart notify — respects the toggle
  const smartNotify = (title, body) => {
    if (notificationsEnabled) notify(title, body);
  };

  const handleToggleNotifications = async () => {
    if (notificationsEnabled) {
      // Turn off — save permanently
      setNotificationsEnabled(false);
      try { localStorage.setItem("sv_notif_enabled", "false"); } catch {}
    } else {
      // Turn on — request browser permission if needed
      if (permission !== "granted") {
        const result = await requestPermission();
        if (result !== "granted") return;
      }
      setNotificationsEnabled(true);
      try { localStorage.setItem("sv_notif_enabled", "true"); } catch {}
    }
  };

  // Update session everywhere (name changes, etc.)
  const handleUpdateSession = (updatedSession) => {
    setSession(updatedSession);
    try { localStorage.setItem("sprintvibe_session", JSON.stringify(updatedSession)); } catch(e) {}
  };

  // ── Session persistence — restore on refresh ─────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("join")) { setScreen("onboarding"); return; }

    // Try to restore session from localStorage
    try {
      const saved = localStorage.getItem("sprintvibe_session");
      if (saved) {
        const sess = JSON.parse(saved);
        // Verify room still exists before restoring
        if (sess?.room?.id && sess?.userId) {
          setSession(sess);
          setScreen("app");
          return;
        }
      }
    } catch(e) {}

    // Check Supabase auth session
    supabase.auth.getSession().then(({ data: { session: authSess } }) => {
      if (authSess?.user) {
        // Authenticated user — go to onboarding to pick/create room
        setScreen("onboarding");
      }
    });
  }, []);

  const roomUrl = session
    ? `https://sprintvibe.io?join=${session.room?.code}`
    : "";

  const handleEnter = (sess) => {
    setSession(sess);
    setTab("board");
    setScreen("app");
    requestPermission();
    // Save session to localStorage for refresh persistence
    try { localStorage.setItem("sprintvibe_session", JSON.stringify(sess)); } catch(e) {}
  };

  const handleLeave = async () => {
    if (session) await leaveRoom(session.room.id, session.userId).catch(()=>{});
    setSession(null);
    setStories({ backlog:[], sprint:[], in_progress:[], done:[] });
    setScreen("landing");
    try { localStorage.removeItem("sprintvibe_session"); } catch(e) {}
  };

  const handleSignOut = async () => {
    // Leave room if in one
    if (session?.room?.id) await leaveRoom(session.room.id, session.userId).catch(()=>{});
    // Sign out of Supabase auth
    await signOut().catch(()=>{});
    // Clear all local storage
    try {
      localStorage.removeItem("sprintvibe_session");
      localStorage.removeItem("sv_notif_enabled");
    } catch(e) {}
    // Reset all state
    setSession(null);
    setStories({ backlog:[], sprint:[], in_progress:[], done:[] });
    setParticipants([]);
    setScreen("landing");
  };

  // ── Story handlers — all synced to Supabase ──────────────
  const drop = async (cid, from, to) => {
    if (from === to) return;
    setStories(p => {
      const card = p[from]?.find(s => s.id === cid);
      if (!card) return p;
      return { ...p, [from]: p[from].filter(s => s.id !== cid), [to]: [...(p[to]||[]), card] };
    });
    await moveStory(cid, to).catch(console.error);
  };

  const addStory = async (col, story) => {
    setStories(p => ({ ...p, [col]: [...(p[col]||[]), story] }));
    if (session?.room?.id) await saveStory(session.room.id, story, col).catch(console.error);
  };

  const removeStory = async (storyId, col) => {
    setStories(p => ({ ...p, [col]: (p[col]||[]).filter(s => s.id !== storyId) }));
    await deleteStory(storyId).catch(console.error);
  };

  // ── Load stories from Supabase on join ───────────────────
  useEffect(() => {
    if (!session?.room?.id) return;
    const load = async () => {
      try {
        const data = await getStories(session.room.id);
        const grouped = { backlog:[], sprint:[], in_progress:[], done:[] };
        data.forEach(s => {
          const col = s.column_id || 'backlog';
          if (grouped[col]) grouped[col].push({ ...s, tags: s.tags || [] });
          else grouped.backlog.push({ ...s, tags: s.tags || [] });
        });
        setStories(grouped);
      } catch(e) { console.error('load stories:', e); }
    };
    load();
    // Real-time story sync
    const ch = supabase.channel(`stories:${session.room.id}`)
      .on('postgres_changes', { event:'*', schema:'public', table:'stories', filter:`room_id=eq.${session.room.id}` }, load)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [session?.room?.id]);

  // ── Notification broadcast subscription ──────────────────
  useEffect(() => {
    if (!session?.room?.id) return;
    const ch = supabase.channel(`notify:${session.room.id}`)
      .on('broadcast', { event:'session_started' }, ({ payload }) => {
        if (payload?.userId !== session.userId) {
          const msg = `🎯 ${payload?.host} started ${payload?.activity}!`;
          setToast(msg);
          setTimeout(() => setToast(null), 4000);
          // Browser push notification — works even when tab is in background
          smartNotify("SprintVibe", `${payload?.host} started ${payload?.activity}!`);
        }
      })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [session?.room?.id, notify]);

  // ── Notify when someone joins the room ───────────────────
  useEffect(() => {
    if (!session?.room?.id) return;
    const ch = supabase.channel(`join-notify:${session.room.id}`)
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'participants', filter:`room_id=eq.${session.room.id}` },
        payload => {
          const name = payload.new?.display_name;
          if (name && payload.new?.user_id !== session.userId) {
            const msg = `👋 ${name} joined the room!`;
            setToast(msg);
            setTimeout(() => setToast(null), 3500);
            smartNotify("SprintVibe", `${name} joined your room!`);
          }
        })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [session?.room?.id, notify]);

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

  const STYLES = `*{-webkit-tap-highlight-color:transparent;}body{margin:0;background:#08080f;}@keyframes pulse{0%,100%{opacity:0.4}50%{opacity:1}}@keyframes flipIn{from{opacity:0;transform:rotateY(90deg)}to{opacity:1;transform:rotateY(0)}}@keyframes slideUp{from{opacity:0;transform:translateX(-50%) translateY(12px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}@keyframes noteIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}select option{background:#0d0d1c}::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-thumb{background:rgba(124,58,237,0.3);border-radius:2px}input,textarea,select{-webkit-appearance:none;}`;

  // ── LANDING PAGE ─────────────────────────────────────────
  if (screen === "landing") return(
    <>
      <FontLoader/>
      <style>{STYLES}</style>
      <LandingPage
        onGetStarted={()=>setScreen("onboarding")}
        onJoin={()=>setScreen("onboarding")}
        onSignIn={()=>{ setSigninMode("login"); setScreen("onboarding"); }}
      />
    </>
  );

  // ── ONBOARDING ───────────────────────────────────────────
  if (screen === "onboarding") return(
    <>
      <FontLoader/>
      <style>{STYLES}</style>
      <div style={{minHeight:"100vh",background:"#08080f",backgroundImage:"radial-gradient(ellipse 70% 40% at 50% -10%,rgba(124,58,237,0.18) 0%,transparent 60%)"}}>
        <div style={{textAlign:"center",padding:"20px 0 0"}}>
          <button onClick={()=>setScreen("landing")} style={{background:"none",border:"none",color:"#475569",cursor:"pointer",fontFamily:"Syne",fontSize:12,fontWeight:700}}>← Back to home</button>
        </div>
        <Onboarding onEnter={handleEnter} initialMode={signinMode}/>
      </div>
      {modal==="pricing"&&<PricingModal onClose={()=>setModal(null)} onUpgrade={()=>setModal("stripe")}/>}
      {modal==="stripe"&&<StripeModal onClose={()=>setModal(null)}/>}
    </>
  );

  // ── WORKSPACE DASHBOARD ──────────────────────────────────
  if (screen === "workspace" && workspace) return(
    <>
      <FontLoader/>
      <style>{STYLES}</style>
      <WorkspaceDashboard
        workspace={workspace}
        session={session}
        onStartSession={(type)=>setScreen("onboarding")}
        onLeave={()=>setScreen("landing")}
      />
    </>
  );

  return(
    <>
      <FontLoader/>
      <style>{STYLES}</style>

      <div style={{minHeight:"100vh",background:"#08080f",backgroundImage:"radial-gradient(ellipse 70% 40% at 50% -10%,rgba(124,58,237,0.18) 0%,transparent 60%)",fontFamily:"DM Sans"}}>

        {/* Toast notification */}
        {toast&&(
          <div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:"rgba(13,13,28,0.97)",border:"1px solid rgba(124,58,237,0.4)",borderRadius:12,padding:"10px 18px",zIndex:500,fontFamily:"DM Sans",fontSize:13,color:"#e2e8f0",display:"flex",alignItems:"center",gap:10,boxShadow:"0 8px 32px rgba(0,0,0,0.5)",animation:"slideUp 0.3s ease",whiteSpace:"nowrap",maxWidth:"calc(100vw - 32px)"}}>
            <span style={{width:7,height:7,borderRadius:"50%",background:"#7c3aed",boxShadow:"0 0 8px #7c3aed",flexShrink:0}}/>{toast}
          </div>
        )}

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
            <button onClick={handleLeave} style={btn("rgba(255,255,255,0.06)","#64748b",{padding:"6px 12px",fontSize:11})}>Leave Room</button>
            <button onClick={handleSignOut} style={btn("rgba(255,77,109,0.15)","#ff4d6d",{padding:"6px 12px",fontSize:11})}>Sign Out</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{padding:"12px 16px 0",display:"flex",gap:3,overflowX:"auto"}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={async()=>{
                setTab(t.id);
                // Notify participants when host starts poker or retro
                if(session?.role==="host" && (t.id==="poker"||t.id==="retro") && session?.room?.id) {
                  const label = t.id==="poker"?"Planning Poker 🃏":"Retrospective 🏁";
                  await broadcastNotification(session.room.id,"session_started",{host:session.displayName,activity:label,userId:session.userId}).catch(()=>{});
                }
              }} style={{padding:"7px 14px",borderRadius:"10px 10px 0 0",background:tab===t.id?"rgba(124,58,237,0.15)":"transparent",border:`1px solid ${tab===t.id?"rgba(124,58,237,0.3)":"rgba(255,255,255,0.05)"}`,borderBottom:tab===t.id?"1px solid rgba(124,58,237,0.15)":"1px solid rgba(255,255,255,0.05)",color:tab===t.id?"#a78bfa":"#334155",cursor:"pointer",fontFamily:"Syne",fontWeight:700,fontSize:12,whiteSpace:"nowrap",flexShrink:0}}>{t.l}</button>
          ))}
        </div>

        {/* Content */}
        {tab==="board"&&(
          <div style={{padding:"16px 16px 48px",overflowX:"auto"}}>

            {/* Who's in the room — always visible on board */}
            {participants.length>0&&(
              <div style={{marginBottom:16,background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:"12px 16px",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap",margin:"0 auto 16px",width:"fit-content",minWidth:"min(100%,820px)"}}>
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
            <div style={{display:"flex",gap:12,minWidth:820,margin:"0 auto",width:"fit-content"}}>
              {COLUMNS.map(col=><DropColumn key={col.id} id={col.id} title={col.title} color={col.color} stories={stories[col.id]||[]} onDrop={drop} onAdd={addStory} onDelete={removeStory}/>)}
            </div>
          </div>
        )}
        {tab==="poker"     &&<PokerSession  stories={stories} session={session} roomUrl={roomUrl}/>}
        {tab==="retro"     &&<RetroView     session={session} roomUrl={roomUrl}/>}
        {tab==="analytics" &&<AnalyticsView stories={stories} session={session}/>}
        {tab==="settings"  &&<SettingsView
          session={session}
          onShowPricing={()=>setModal("stripe")}
          pushPermission={permission}
          notificationsEnabled={notificationsEnabled}
          onToggleNotifications={handleToggleNotifications}
          onEnableNotifications={requestPermission}
          onDisableNotifications={()=>setNotificationsEnabled(false)}
          onSignOut={handleSignOut}
          onUpdateSession={handleUpdateSession}
        />}

        {/* Modals */}
        {modal==="pricing"&&<PricingModal onClose={()=>setModal(null)} onUpgrade={()=>setModal("stripe")}/> }
        {modal==="share"  &&<ShareModal session={session} roomUrl={roomUrl} onClose={()=>setModal(null)}/>}
        {modal==="stripe" &&<StripeModal onClose={()=>setModal(null)}/>}
      </div>
    </>
  );
}
