// src/pages/DRRM.jsx
import React, { useState, useEffect } from 'react';
import StatCard from '../components/layout/common/StatCard';
import { useDRRM } from '../hooks/useDRRM';
import {
  AlertTriangle, AlertCircle, Users, Shield, MapPin, Plus, Edit,
  CheckCircle, Trash2, X, Save, Home, Loader, Bell, Phone,
  ClipboardList, ChevronRight, FileText
} from 'lucide-react';

const ALERT_LEVELS    = ['advisory','warning','critical'];
const CENTER_STATUSES = ['Standby','Active','Full','Closed'];
const DAMAGE_TYPES    = ['House / Structure','Road / Bridge','Farmland','Electrical','Water System','Others'];
const DAMAGE_SEV      = ['Minor','Moderate','Severe','Total Loss'];
const VULN_CATS       = ['Elderly (60+)','PWD','Infant / Child','Pregnant','Chronic Illness','Flood Zone','Landslide Zone','Coastal'];
const PUROKS          = ['Purok 1','Purok 2','Purok 3','Purok 4','Purok 5','Purok 6','Purok 7','Purok 8','Purok 9','Purok 10'];
const HOTLINES        = [
  {name:'PNP Emergency',number:'911',color:'#2563eb'},
  {name:'Bureau of Fire',number:'(032) 412-1234',color:'#dc2626'},
  {name:'NDRRMC Hotline',number:'8-1384',color:'#d97706'},
  {name:'Red Cross',number:'143',color:'#dc2626'},
  {name:'PDRRMO',number:'(032) 345-6789',color:'#059669'},
  {name:'PhilHealth',number:'1-800-100-7441',color:'#7c3aed'},
];
const TABS = [
  {id:'alerts',label:'Alerts',icon:Bell},
  {id:'centers',label:'Evacuation Centers',icon:Home},
  {id:'vuln',label:'Vulnerable Residents',icon:Users},
  {id:'damage',label:'Damage Assessment',icon:ClipboardList},
  {id:'command',label:'Incident Command',icon:Shield},
  {id:'hotlines',label:'Emergency Hotlines',icon:Phone},
];

const levelSt  = (l) => ({advisory:{bg:'#eff6ff',color:'#1d4ed8',bar:'#3b82f6',border:'#bfdbfe'},warning:{bg:'#fffbeb',color:'#92400e',bar:'#f59e0b',border:'#fde68a'},critical:{bg:'#fef2f2',color:'#991b1b',bar:'#ef4444',border:'#fecaca'}}[l]||{bg:'#fffbeb',color:'#92400e',bar:'#f59e0b',border:'#fde68a'});
const statusSt = (s) => ({Active:{bg:'#d1fae5',color:'#065f46'},Standby:{bg:'#f1f5f9',color:'#475569'},Full:{bg:'#fee2e2',color:'#991b1b'},Closed:{bg:'#f3f4f6',color:'#6b7280'}}[s]||{bg:'#f1f5f9',color:'#475569'});
const sevClr   = (s) => ({Minor:'#3b82f6',Moderate:'#f59e0b',Severe:'#ef4444','Total Loss':'#7c3aed'}[s]||'#3b82f6');

const fmtTime = (ts) => {
  if (!ts) return '';
  try {
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    const m = Math.floor((Date.now()-d.getTime())/60000);
    if (m<1) return 'Just now';
    if (m<60) return m+'m ago';
    if (m<1440) return Math.floor(m/60)+'h ago';
    return d.toLocaleDateString('en-PH',{month:'short',day:'numeric'});
  } catch { return ''; }
};

const Bdg = ({label,bg,color}) => <span style={{fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:999,background:bg,color,textTransform:'uppercase',letterSpacing:'.04em'}}>{label}</span>;

const ModalCard = ({title,children,onClose,maxWidth=540}) => (
  <>
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.3)',zIndex:1000}}/>
    <div style={{position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',zIndex:1001,width:'100%',maxWidth,maxHeight:'90vh',background:'#fff',borderRadius:18,boxShadow:'0 24px 64px rgba(0,0,0,0.2)',display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <div style={{padding:'18px 24px',borderBottom:'1px solid #f1f5f9',display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0}}>
        <h3 style={{fontSize:16,fontWeight:700,margin:0,color:'#0f172a'}}>{title}</h3>
        <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'#64748b'}}><X size={20}/></button>
      </div>
      <div style={{overflowY:'auto',padding:'20px 24px',flex:1}}>{children}</div>
    </div>
  </>
);

const FG = ({label,required,children}) => (
  <div className="form-group">
    <label className="form-label">{label}{required&&<span style={{color:'#ef4444'}}> *</span>}</label>
    {children}
  </div>
);

const Empty = ({icon:Icon,title,desc,action}) => (
  <div style={{textAlign:'center',padding:'40px 20px'}}>
    <Icon size={40} style={{color:'#cbd5e1',margin:'0 auto 12px',display:'block'}}/>
    <h3 style={{fontSize:15,fontWeight:600,color:'#374151',margin:'0 0 6px'}}>{title}</h3>
    <p style={{fontSize:13,color:'#94a3b8',margin:'0 0 16px'}}>{desc}</p>
    {action}
  </div>
);

export default function DRRM() {
  const hook = useDRRM();
  const alerts      = Array.isArray(hook.alerts)      ? hook.alerts      : [];
  const centers     = Array.isArray(hook.centers)     ? hook.centers     : [];
  const vulnerables = Array.isArray(hook.vulnerables) ? hook.vulnerables : [];
  const damages     = Array.isArray(hook.damages)     ? hook.damages     : [];
  const tasks       = Array.isArray(hook.tasks)       ? hook.tasks       : [];

  const [tab,setTab] = useState('alerts');

  const [showA,setShowA]   = useState(false);
  const [aF,setAF]         = useState({title:'',message:'',level:'warning',audience:'All Residents',location:'',instructions:''});
  const [aErr,setAErr]     = useState('');
  const [aLoad,setALoad]   = useState(false);

  const [showC,setShowC]   = useState(false);
  const [editC,setEditC]   = useState(null);
  const [cF,setCF]         = useState({name:'',location:'',capacity:'',status:'Standby',amenities:''});
  const [cErr,setCErr]     = useState('');
  const [cLoad,setCLoad]   = useState(false);

  const [showO,setShowO]   = useState(false);
  const [oC,setOC]         = useState(null);
  const [oV,setOV]         = useState('0');
  const [oLoad,setOLoad]   = useState(false);

  const [showV,setShowV]   = useState(false);
  const [vF,setVF]         = useState({name:'',purok:'',category:'Elderly (60+)',contact:'',notes:''});
  const [vLoad,setVLoad]   = useState(false);

  const [showD,setShowD]   = useState(false);
  const [dF,setDF]         = useState({type:'House / Structure',severity:'Minor',location:'',description:'',affectedFamilies:'',estimatedCost:''});
  const [dLoad,setDLoad]   = useState(false);

  const [showT,setShowT]   = useState(false);
  const [tF,setTF]         = useState({title:'',assignedTo:'',priority:'Medium',status:'Pending',notes:''});
  const [tLoad,setTLoad]   = useState(false);

  useEffect(()=>{ if(hook.loadAll) hook.loadAll(); },[]);

  const activeAlerts  = alerts.filter(a=>a&&a.status==='Active').length;
  const totalEvac     = centers.reduce((s,c)=>s+Number((c&&c.occupancy)||0),0);
  const totalCap      = centers.reduce((s,c)=>s+Number((c&&c.capacity)||0),0);

  const saveAlert = async()=>{
    if(!aF.title.trim()||!aF.message.trim()){setAErr('Title and message required.');return;}
    setALoad(true);
    const r = await hook.sendAlert(aF);
    setALoad(false);
    if(r&&r.success){setShowA(false);setAF({title:'',message:'',level:'warning',audience:'All Residents',location:'',instructions:''});setAErr('');}
    else setAErr((r&&r.error)||'Failed.');
  };

  const openAddC  = ()=>{setCF({name:'',location:'',capacity:'',status:'Standby',amenities:''});setEditC(null);setCErr('');setShowC(true);};
  const openEditC = (c)=>{if(!c)return;setCF({name:c.name||'',location:c.location||'',capacity:c.capacity||'',status:c.status||'Standby',amenities:c.amenities||''});setEditC(c);setCErr('');setShowC(true);};
  const saveCenter = async()=>{
    if(!cF.name.trim()||!cF.capacity){setCErr('Name and capacity required.');return;}
    setCLoad(true);
    const r = (editC&&editC.id) ? await hook.editCenter(editC.id,cF) : await hook.addCenter(cF);
    setCLoad(false);
    if(r&&r.success){setShowC(false);setEditC(null);}
    else setCErr((r&&r.error)||'Failed.');
  };

  const openOcc = (c)=>{if(!c)return;setOC(c);setOV(String(c.occupancy||0));setShowO(true);};
  const saveOcc = async()=>{
    if(!oC||!oC.id){setShowO(false);setOC(null);return;}
    setOLoad(true);
    await hook.setOccupancy(oC.id,Number(oV));
    setOLoad(false);
    setShowO(false);
    setOC(null);
  };

  const saveVuln = async()=>{
    if(!vF.name.trim())return;
    setVLoad(true);
    await hook.addVulnerable(vF);
    setVLoad(false);
    setVF({name:'',purok:'',category:'Elderly (60+)',contact:'',notes:''});
    setShowV(false);
  };

  const saveDmg = async()=>{
    if(!dF.location.trim())return;
    setDLoad(true);
    await hook.addDamage(dF);
    setDLoad(false);
    setDF({type:'House / Structure',severity:'Minor',location:'',description:'',affectedFamilies:'',estimatedCost:''});
    setShowD(false);
  };

  const saveTask = async()=>{
    if(!tF.title.trim())return;
    setTLoad(true);
    await hook.addTask(tF);
    setTLoad(false);
    setTF({title:'',assignedTo:'',priority:'Medium',status:'Pending',notes:''});
    setShowT(false);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Disaster Risk Reduction &amp; Management</h1>
          <p className="page-subtitle">Emergency response, preparedness and recovery</p>
        </div>
        <button className="btn btn-primary btn-md" onClick={()=>{setAErr('');setShowA(true);}}>
          <Bell size={17}/> Send Alert
        </button>
      </div>

      {hook.error&&(
        <div style={{display:'flex',gap:10,alignItems:'center',padding:'11px 16px',background:'#fef2f2',border:'1px solid #fecaca',borderRadius:12,marginBottom:20}}>
          <AlertCircle size={15} color="#dc2626"/>
          <span style={{fontSize:13,color:'#dc2626',flex:1}}>{hook.error}</span>
          <button onClick={()=>hook.clearError&&hook.clearError()} style={{background:'none',border:'none',cursor:'pointer'}}><X size={15} color="#dc2626"/></button>
        </div>
      )}

      <div className="stats-grid">
        <StatCard title="Active Alerts"  value={activeAlerts}       icon={Bell}    iconBg="icon-bg-error"     badge={activeAlerts>0?'Requires action':'All clear'} badgeColor={activeAlerts>0?'badge-error':'badge-success'}/>
        <StatCard title="Total Evacuees" value={totalEvac}          icon={Users}   iconBg="icon-bg-warning"   badge={'of '+totalCap+' capacity'} badgeColor="badge-warning"/>
        <StatCard title="Evac Centers"   value={centers.length}     icon={Home}    iconBg="icon-bg-primary"   badge="Registered" badgeColor="badge-primary"/>
        <StatCard title="Vulnerable"     value={vulnerables.length} icon={Shield}  iconBg="icon-bg-secondary" badge="Profiled"    badgeColor="badge-gray"/>
      </div>

      {activeAlerts>0&&(
        <div style={{display:'flex',alignItems:'center',gap:12,padding:'12px 18px',background:'#fef2f2',border:'1px solid #fca5a5',borderRadius:12,marginBottom:20}}>
          <div style={{width:9,height:9,borderRadius:'50%',background:'#ef4444',flexShrink:0,animation:'drrmPulse 1.5s infinite'}}/>
          <span style={{fontSize:14,fontWeight:700,color:'#991b1b'}}>{activeAlerts} active alert{activeAlerts>1?'s':''}</span>
          <button className="btn btn-secondary btn-sm" style={{marginLeft:'auto'}} onClick={()=>setTab('alerts')}>View</button>
        </div>
      )}

      <div style={{display:'flex',borderBottom:'1px solid #f1f5f9',marginBottom:20,overflowX:'auto'}}>
        {TABS.map(t=>{const Icon=t.icon;return(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{display:'flex',alignItems:'center',gap:7,padding:'10px 16px',background:'none',border:'none',borderBottom:tab===t.id?'2.5px solid #3b82f6':'2.5px solid transparent',cursor:'pointer',whiteSpace:'nowrap',fontSize:13,fontWeight:tab===t.id?600:500,color:tab===t.id?'#1d4ed8':'#64748b',marginBottom:-1}}>
            <Icon size={15}/>{t.label}
          </button>
        );})}
      </div>

      {/* ALERTS */}
      {tab==='alerts'&&(
        <div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <h3 style={{fontSize:15,fontWeight:700,color:'#0f172a',margin:0}}>Emergency Alerts</h3>
            <button className="btn btn-primary btn-sm" onClick={()=>{setAErr('');setShowA(true);}}><Plus size={15}/>New Alert</button>
          </div>
          {hook.loading&&alerts.length===0?<div className="empty-state"><Loader size={28} className="animate-spin" style={{color:'#3b82f6'}}/></div>
          :alerts.length===0?<Empty icon={Bell} title="No alerts" desc="Send an alert to notify residents" action={<button className="btn btn-primary btn-sm" onClick={()=>setShowA(true)}><Plus size={14}/>Send Alert</button>}/>
          :<div style={{display:'flex',flexDirection:'column',gap:10}}>
            {alerts.map(a=>{if(!a)return null;const ls=levelSt(a.level);return(
              <div key={a.id||String(Math.random())} style={{background:'#fff',border:'1px solid '+ls.border,borderLeft:'4px solid '+ls.bar,borderRadius:14,padding:'16px 20px'}}>
                <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'flex-start'}}>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',gap:8,marginBottom:8,flexWrap:'wrap',alignItems:'center'}}>
                      <Bdg label={a.level||'warning'} bg={ls.bg} color={ls.color}/>
                      <Bdg label={a.status||'Active'} bg={a.status==='Active'?'#d1fae5':'#f1f5f9'} color={a.status==='Active'?'#065f46':'#475569'}/>
                      <span style={{fontSize:12,color:'#94a3b8'}}>{fmtTime(a.systemInfo&&a.systemInfo.createdAt)}</span>
                    </div>
                    <h4 style={{fontSize:15,fontWeight:700,color:'#0f172a',margin:'0 0 5px'}}>{a.title||'—'}</h4>
                    <p style={{fontSize:13,color:'#374151',margin:'0 0 8px',lineHeight:1.6}}>{a.message||''}</p>
                    <div style={{display:'flex',gap:14,fontSize:12,color:'#64748b',flexWrap:'wrap'}}>
                      {a.audience&&<span>{a.audience}</span>}
                      {a.location&&<span><MapPin size={11} style={{verticalAlign:'middle',marginRight:2}}/>{a.location}</span>}
                    </div>
                  </div>
                  <div style={{display:'flex',gap:6,flexShrink:0}}>
                    {a.status==='Active'&&a.id&&<button className="btn btn-secondary btn-sm" onClick={()=>hook.resolve(a.id)} style={{color:'#059669'}}><CheckCircle size={14}/>Resolve</button>}
                    {a.id&&<button className="btn-icon btn-icon-sm" style={{color:'#ef4444'}} onClick={()=>window.confirm('Delete?')&&hook.removeAlert(a.id)}><Trash2 size={15}/></button>}
                  </div>
                </div>
              </div>
            );})}
          </div>}
        </div>
      )}

      {/* CENTERS */}
      {tab==='centers'&&(
        <div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <h3 style={{fontSize:15,fontWeight:700,color:'#0f172a',margin:0}}>Evacuation Centers</h3>
            <button className="btn btn-primary btn-sm" onClick={openAddC}><Plus size={15}/>Add Center</button>
          </div>
          {centers.length===0?<Empty icon={Home} title="No centers" desc="Add evacuation centers for emergency use" action={<button className="btn btn-primary btn-sm" onClick={openAddC}><Plus size={14}/>Add Center</button>}/>
          :<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:14}}>
            {centers.map(c=>{if(!c)return null;
              const pct=c.capacity>0?Math.min(100,Math.round(((c.occupancy||0)/c.capacity)*100)):0;
              const bClr=pct>=90?'#ef4444':pct>=60?'#f59e0b':'#10b981';
              const ss=statusSt(c.status);
              return(
                <div key={c.id||String(Math.random())} style={{background:'#fff',border:'1px solid #f1f5f9',borderRadius:16,overflow:'hidden'}}>
                  <div style={{padding:'16px 18px 12px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
                      <div><h4 style={{fontSize:15,fontWeight:700,color:'#0f172a',margin:'0 0 3px'}}>{c.name}</h4><p style={{fontSize:12,color:'#64748b',margin:0}}>{c.location||'No location'}</p></div>
                      <Bdg label={c.status||'Standby'} bg={ss.bg} color={ss.color}/>
                    </div>
                    <div style={{marginBottom:10}}>
                      <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'#64748b',marginBottom:5}}>
                        <span>Occupancy</span><span style={{fontWeight:700,color:'#0f172a'}}>{c.occupancy||0} / {c.capacity}</span>
                      </div>
                      <div style={{height:7,background:'#f1f5f9',borderRadius:4,overflow:'hidden'}}>
                        <div style={{height:'100%',width:pct+'%',background:bClr,borderRadius:4,transition:'width .4s'}}/>
                      </div>
                      <span style={{fontSize:11,color:'#94a3b8'}}>{pct}% capacity</span>
                    </div>
                    {c.amenities&&<p style={{fontSize:12,color:'#64748b',margin:'0 0 8px',background:'#f8fafc',padding:'6px 10px',borderRadius:8}}>{c.amenities}</p>}
                  </div>
                  <div style={{padding:'10px 18px',background:'#fafafa',borderTop:'1px solid #f1f5f9',display:'flex',gap:8}}>
                    <button className="btn btn-secondary btn-sm" style={{flex:1}} onClick={()=>openOcc(c)}>Update Occupancy</button>
                    <button className="btn-icon btn-icon-sm" onClick={()=>openEditC(c)}><Edit size={15}/></button>
                    {c.id&&<button className="btn-icon btn-icon-sm" style={{color:'#ef4444'}} onClick={()=>window.confirm('Delete?')&&hook.removeCenter(c.id)}><Trash2 size={15}/></button>}
                  </div>
                </div>
              );
            })}
          </div>}
        </div>
      )}

      {/* VULNERABLE */}
      {tab==='vuln'&&(
        <div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <h3 style={{fontSize:15,fontWeight:700,color:'#0f172a',margin:0}}>Vulnerable Residents</h3>
            <button className="btn btn-primary btn-sm" onClick={()=>setShowV(true)}><Plus size={15}/>Add Profile</button>
          </div>
          {vulnerables.length===0?<Empty icon={Users} title="No profiles yet" desc="Add residents needing special emergency assistance" action={<button className="btn btn-primary btn-sm" onClick={()=>setShowV(true)}><Plus size={14}/>Add Profile</button>}/>
          :<div className="data-table-card">
            <table className="data-table">
              <thead><tr><th>Name</th><th>Purok</th><th>Category</th><th>Contact</th><th>Notes</th><th></th></tr></thead>
              <tbody>
                {vulnerables.map(v=>{if(!v)return null;return(
                  <tr key={v.id||String(Math.random())}>
                    <td style={{fontWeight:600}}>{v.name}</td>
                    <td className="text-secondary">{v.purok||'—'}</td>
                    <td><Bdg label={v.category} bg="#fef3c7" color="#92400e"/></td>
                    <td className="text-secondary">{v.contact||'—'}</td>
                    <td className="text-secondary" style={{maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{v.notes||'—'}</td>
                    <td>{v.id&&<button className="btn-icon btn-icon-sm" style={{color:'#ef4444'}} onClick={()=>hook.removeVulnerable(v.id)}><Trash2 size={14}/></button>}</td>
                  </tr>
                );})}
              </tbody>
            </table>
          </div>}
        </div>
      )}

      {/* DAMAGE */}
      {tab==='damage'&&(
        <div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <h3 style={{fontSize:15,fontWeight:700,color:'#0f172a',margin:0}}>Damage Assessment</h3>
            <button className="btn btn-primary btn-sm" onClick={()=>setShowD(true)}><Plus size={15}/>Report Damage</button>
          </div>
          {damages.length===0?<Empty icon={ClipboardList} title="No damage reports" desc="Log damage reports after a disaster event" action={<button className="btn btn-primary btn-sm" onClick={()=>setShowD(true)}><Plus size={14}/>Log Report</button>}/>
          :<div style={{display:'flex',flexDirection:'column',gap:10}}>
            {damages.map(d=>{if(!d)return null;const c=sevClr(d.severity);return(
              <div key={d.id||String(Math.random())} style={{background:'#fff',border:'1px solid #f1f5f9',borderLeft:'4px solid '+c,borderRadius:14,padding:'14px 18px',display:'flex',justifyContent:'space-between',gap:12,alignItems:'flex-start'}}>
                <div>
                  <div style={{display:'flex',gap:8,marginBottom:6,flexWrap:'wrap',alignItems:'center'}}>
                    <Bdg label={d.type} bg="#f1f5f9" color="#374151"/>
                    <Bdg label={d.severity} bg={c} color="#fff"/>
                  </div>
                  <p style={{fontSize:14,fontWeight:600,margin:'0 0 3px',color:'#0f172a'}}>{d.location}</p>
                  {d.description&&<p style={{fontSize:13,color:'#64748b',margin:'0 0 3px'}}>{d.description}</p>}
                  <div style={{fontSize:12,color:'#94a3b8',display:'flex',gap:12}}>
                    {d.affectedFamilies>0&&<span>Families: {d.affectedFamilies}</span>}
                    {d.estimatedCost>0&&<span>Est: &#8369;{Number(d.estimatedCost).toLocaleString()}</span>}
                  </div>
                </div>
                {d.id&&<button className="btn-icon btn-icon-sm" style={{color:'#ef4444',flexShrink:0}} onClick={()=>hook.removeDamage(d.id)}><Trash2 size={15}/></button>}
              </div>
            );})}
          </div>}
        </div>
      )}

      {/* COMMAND */}
      {tab==='command'&&(
        <div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <h3 style={{fontSize:15,fontWeight:700,color:'#0f172a',margin:0}}>Incident Command</h3>
            <button className="btn btn-primary btn-sm" onClick={()=>setShowT(true)}><Plus size={15}/>Assign Task</button>
          </div>
          {tasks.length===0?<Empty icon={Shield} title="No tasks" desc="Assign emergency response tasks to team members" action={<button className="btn btn-primary btn-sm" onClick={()=>setShowT(true)}><Plus size={14}/>Assign Task</button>}/>
          :<div style={{display:'flex',flexDirection:'column',gap:8}}>
            {tasks.map(t=>{if(!t)return null;
              const pClr={High:'#ef4444',Medium:'#f59e0b',Low:'#10b981'}[t.priority]||'#94a3b8';
              const done=t.status==='Done';
              return(
                <div key={t.id||String(Math.random())} style={{background:'#fff',border:'1px solid #f1f5f9',borderRadius:12,padding:'13px 18px',display:'flex',gap:12,alignItems:'flex-start',opacity:done?0.65:1}}>
                  <div onClick={()=>t.id&&hook.toggleTask(t.id,t.status)} style={{width:20,height:20,borderRadius:6,border:'2px solid '+(done?'#10b981':'#cbd5e1'),background:done?'#10b981':'#fff',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0,marginTop:2}}>
                    {done&&<CheckCircle size={12} color="#fff"/>}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:3,flexWrap:'wrap'}}>
                      <span style={{fontSize:14,fontWeight:600,color:'#0f172a',textDecoration:done?'line-through':'none'}}>{t.title}</span>
                      <Bdg label={t.priority||'Medium'} bg={pClr+'20'} color={pClr}/>
                    </div>
                    <div style={{fontSize:12,color:'#64748b',display:'flex',gap:12}}>
                      {t.assignedTo&&<span>Assigned: {t.assignedTo}</span>}
                      {t.notes&&<span>{t.notes}</span>}
                    </div>
                  </div>
                  {t.id&&<button className="btn-icon btn-icon-sm" style={{color:'#ef4444',flexShrink:0}} onClick={()=>hook.removeTask(t.id)}><Trash2 size={14}/></button>}
                </div>
              );
            })}
          </div>}
        </div>
      )}

      {/* HOTLINES */}
      {tab==='hotlines'&&(
        <div>
          <h3 style={{fontSize:15,fontWeight:700,color:'#0f172a',margin:'0 0 16px'}}>Emergency Contact Directory</h3>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:12}}>
            {HOTLINES.map((h,i)=>(
              <div key={i} style={{background:'#fff',border:'1px solid #f1f5f9',borderLeft:'4px solid '+h.color,borderRadius:14,padding:'16px 20px',display:'flex',alignItems:'center',gap:14}}>
                <div style={{width:42,height:42,borderRadius:11,background:h.color+'15',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <Phone size={18} color={h.color}/>
                </div>
                <div style={{flex:1}}>
                  <p style={{fontSize:13,fontWeight:600,color:'#374151',margin:'0 0 2px'}}>{h.name}</p>
                  <p style={{fontSize:18,fontWeight:800,color:h.color,margin:0}}>{h.number}</p>
                </div>
                <a href={'tel:'+h.number} style={{width:34,height:34,borderRadius:9,background:h.color+'15',display:'flex',alignItems:'center',justifyContent:'center',color:h.color,textDecoration:'none',flexShrink:0}}>
                  <ChevronRight size={16}/>
                </a>
              </div>
            ))}
          </div>
          <div style={{marginTop:20,padding:'18px 22px',background:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:14}}>
            <h4 style={{fontSize:14,fontWeight:700,color:'#1e40af',margin:'0 0 10px',display:'flex',alignItems:'center',gap:8}}><MapPin size={16}/>Evacuation Routes</h4>
            {[{purok:'Purok 1-3',route:'Proceed to Barangay Hall via Main Road. Avoid low-lying areas near the creek.'},{purok:'Purok 4-6',route:'Go to Elementary School via the highland footpath behind Purok 5.'},{purok:'Purok 7-10',route:'Use alternate road through Purok 8 to reach the covered court.'}].map((r,i)=>(
              <div key={i} style={{background:'#fff',borderRadius:9,padding:'10px 14px',border:'1px solid #bfdbfe',marginBottom:i<2?8:0}}>
                <span style={{fontSize:12,fontWeight:700,color:'#1d4ed8',marginRight:8}}>{r.purok}:</span>
                <span style={{fontSize:13,color:'#374151'}}>{r.route}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: Alert */}
      {showA&&(
        <ModalCard title="Send Emergency Alert" onClose={()=>setShowA(false)} maxWidth={540}>
          {aErr&&<div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:9,padding:'9px 14px',marginBottom:14,fontSize:13,color:'#dc2626'}}>{aErr}</div>}
          <FG label="Alert Level" required><select className="form-select" value={aF.level} onChange={e=>setAF(p=>({...p,level:e.target.value}))}>{ALERT_LEVELS.map(l=><option key={l} value={l}>{l.charAt(0).toUpperCase()+l.slice(1)}</option>)}</select></FG>
          <FG label="Title" required><input className="form-input" value={aF.title} onChange={e=>setAF(p=>({...p,title:e.target.value}))} placeholder="e.g. Typhoon Warning"/></FG>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <FG label="Audience"><input className="form-input" value={aF.audience} onChange={e=>setAF(p=>({...p,audience:e.target.value}))}/></FG>
            <FG label="Affected Area"><input className="form-input" value={aF.location} onChange={e=>setAF(p=>({...p,location:e.target.value}))}/></FG>
          </div>
          <FG label="Message" required><textarea className="form-textarea" rows={4} value={aF.message} onChange={e=>setAF(p=>({...p,message:e.target.value}))} placeholder="Detailed alert message..."/></FG>
          <FG label="Safety Instructions"><textarea className="form-textarea" rows={2} value={aF.instructions} onChange={e=>setAF(p=>({...p,instructions:e.target.value}))} placeholder="What should residents do?"/></FG>
          <div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:4}}>
            <button className="btn btn-secondary btn-md" onClick={()=>setShowA(false)} disabled={aLoad}>Cancel</button>
            <button className="btn btn-primary btn-md" onClick={saveAlert} disabled={aLoad}>{aLoad?<><Loader size={14} className="animate-spin"/>Sending...</>:<><Bell size={14}/>Send Alert</>}</button>
          </div>
        </ModalCard>
      )}

      {/* MODAL: Center */}
      {showC&&(
        <ModalCard title={editC?'Edit Center':'Add Evacuation Center'} onClose={()=>{setShowC(false);setEditC(null);}} maxWidth={480}>
          {cErr&&<div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:9,padding:'9px 14px',marginBottom:14,fontSize:13,color:'#dc2626'}}>{cErr}</div>}
          <FG label="Center Name" required><input className="form-input" value={cF.name} onChange={e=>setCF(p=>({...p,name:e.target.value}))} placeholder="e.g. Barangay Hall"/></FG>
          <FG label="Location"><input className="form-input" value={cF.location} onChange={e=>setCF(p=>({...p,location:e.target.value}))} placeholder="e.g. Main Road, Purok 1"/></FG>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <FG label="Max Capacity" required><input type="number" className="form-input" value={cF.capacity} onChange={e=>setCF(p=>({...p,capacity:e.target.value}))} min="1"/></FG>
            <FG label="Status"><select className="form-select" value={cF.status} onChange={e=>setCF(p=>({...p,status:e.target.value}))}>{CENTER_STATUSES.map(s=><option key={s} value={s}>{s}</option>)}</select></FG>
          </div>
          <FG label="Amenities"><input className="form-input" value={cF.amenities} onChange={e=>setCF(p=>({...p,amenities:e.target.value}))} placeholder="e.g. Has water, CR, electricity"/></FG>
          <div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:4}}>
            <button className="btn btn-secondary btn-md" onClick={()=>{setShowC(false);setEditC(null);}} disabled={cLoad}>Cancel</button>
            <button className="btn btn-primary btn-md" onClick={saveCenter} disabled={cLoad}>{cLoad?<><Loader size={14} className="animate-spin"/>Saving...</>:<><Save size={14}/>{editC?'Update':'Add Center'}</>}</button>
          </div>
        </ModalCard>
      )}

      {/* MODAL: Occupancy */}
      {showO&&oC&&(
        <ModalCard title={'Update Occupancy — '+(oC.name||'')} onClose={()=>{setShowO(false);setOC(null);}} maxWidth={360}>
          <FG label={'Current Evacuees (max '+(oC.capacity||0)+')'}>
            <input type="number" className="form-input" value={oV} onChange={e=>setOV(e.target.value)} min="0" max={oC.capacity||undefined}/>
          </FG>
          {Number(oV)>Number(oC.capacity||0)&&<p style={{fontSize:12,color:'#dc2626',margin:'4px 0 0'}}>Exceeds maximum capacity</p>}
          <div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:12}}>
            <button className="btn btn-secondary btn-md" onClick={()=>{setShowO(false);setOC(null);}}>Cancel</button>
            <button className="btn btn-primary btn-md" onClick={saveOcc} disabled={oLoad}>{oLoad?<><Loader size={14} className="animate-spin"/>Saving...</>:<><Save size={14}/>Update</>}</button>
          </div>
        </ModalCard>
      )}

      {/* MODAL: Vulnerable */}
      {showV&&(
        <ModalCard title="Add Vulnerable Resident" onClose={()=>setShowV(false)} maxWidth={480}>
          <FG label="Full Name" required><input className="form-input" value={vF.name} onChange={e=>setVF(p=>({...p,name:e.target.value}))} placeholder="Juan Dela Cruz"/></FG>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <FG label="Purok"><select className="form-select" value={vF.purok} onChange={e=>setVF(p=>({...p,purok:e.target.value}))}><option value="">Select</option>{PUROKS.map(p=><option key={p} value={p}>{p}</option>)}</select></FG>
            <FG label="Category"><select className="form-select" value={vF.category} onChange={e=>setVF(p=>({...p,category:e.target.value}))}>{VULN_CATS.map(c=><option key={c} value={c}>{c}</option>)}</select></FG>
          </div>
          <FG label="Contact"><input className="form-input" value={vF.contact} onChange={e=>setVF(p=>({...p,contact:e.target.value}))} placeholder="09XX XXX XXXX"/></FG>
          <FG label="Notes / Special Needs"><textarea className="form-textarea" rows={2} value={vF.notes} onChange={e=>setVF(p=>({...p,notes:e.target.value}))} placeholder="e.g. Uses wheelchair..."/></FG>
          <div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:4}}>
            <button className="btn btn-secondary btn-md" onClick={()=>setShowV(false)} disabled={vLoad}>Cancel</button>
            <button className="btn btn-primary btn-md" onClick={saveVuln} disabled={vLoad||!vF.name.trim()}>{vLoad?<><Loader size={14} className="animate-spin"/>Saving...</>:<><Save size={14}/>Save Profile</>}</button>
          </div>
        </ModalCard>
      )}

      {/* MODAL: Damage */}
      {showD&&(
        <ModalCard title="Log Damage Report" onClose={()=>setShowD(false)} maxWidth={500}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <FG label="Type"><select className="form-select" value={dF.type} onChange={e=>setDF(p=>({...p,type:e.target.value}))}>{DAMAGE_TYPES.map(t=><option key={t} value={t}>{t}</option>)}</select></FG>
            <FG label="Severity"><select className="form-select" value={dF.severity} onChange={e=>setDF(p=>({...p,severity:e.target.value}))}>{DAMAGE_SEV.map(s=><option key={s} value={s}>{s}</option>)}</select></FG>
          </div>
          <FG label="Location" required><input className="form-input" value={dF.location} onChange={e=>setDF(p=>({...p,location:e.target.value}))} placeholder="e.g. 123 Rizal St., Purok 3"/></FG>
          <FG label="Description"><textarea className="form-textarea" rows={2} value={dF.description} onChange={e=>setDF(p=>({...p,description:e.target.value}))} placeholder="Describe the damage..."/></FG>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <FG label="Affected Families"><input type="number" className="form-input" value={dF.affectedFamilies} onChange={e=>setDF(p=>({...p,affectedFamilies:e.target.value}))} min="0"/></FG>
            <FG label="Estimated Cost (PHP)"><input type="number" className="form-input" value={dF.estimatedCost} onChange={e=>setDF(p=>({...p,estimatedCost:e.target.value}))} min="0"/></FG>
          </div>
          <div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:4}}>
            <button className="btn btn-secondary btn-md" onClick={()=>setShowD(false)} disabled={dLoad}>Cancel</button>
            <button className="btn btn-primary btn-md" onClick={saveDmg} disabled={dLoad||!dF.location.trim()}>{dLoad?<><Loader size={14} className="animate-spin"/>Saving...</>:<><Save size={14}/>Submit</>}</button>
          </div>
        </ModalCard>
      )}

      {/* MODAL: Task */}
      {showT&&(
        <ModalCard title="Assign Emergency Task" onClose={()=>setShowT(false)} maxWidth={460}>
          <FG label="Task" required><input className="form-input" value={tF.title} onChange={e=>setTF(p=>({...p,title:e.target.value}))} placeholder="e.g. Distribute relief goods to Purok 3"/></FG>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <FG label="Assigned To"><input className="form-input" value={tF.assignedTo} onChange={e=>setTF(p=>({...p,assignedTo:e.target.value}))} placeholder="e.g. Kagawad Santos"/></FG>
            <FG label="Priority"><select className="form-select" value={tF.priority} onChange={e=>setTF(p=>({...p,priority:e.target.value}))}>{['High','Medium','Low'].map(p=><option key={p} value={p}>{p}</option>)}</select></FG>
          </div>
          <FG label="Notes"><textarea className="form-textarea" rows={2} value={tF.notes} onChange={e=>setTF(p=>({...p,notes:e.target.value}))} placeholder="Additional instructions..."/></FG>
          <div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:4}}>
            <button className="btn btn-secondary btn-md" onClick={()=>setShowT(false)} disabled={tLoad}>Cancel</button>
            <button className="btn btn-primary btn-md" onClick={saveTask} disabled={tLoad||!tF.title.trim()}>{tLoad?<><Loader size={14} className="animate-spin"/>Saving...</>:<><Save size={14}/>Assign</>}</button>
          </div>
        </ModalCard>
      )}

      <style>{`@keyframes drrmPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(1.4)}}`}</style>
    </div>
  );
}