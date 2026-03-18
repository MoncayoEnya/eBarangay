// src/pages/DRRM.jsx
import React, { useState, useEffect, useMemo } from 'react';
import StatCard from '../components/layout/common/StatCard';
import { useDRRM } from '../hooks/useDRRM';
import { useBarangayConfig } from '../hooks/useBarangayConfig';
import BarangayMap from '../components/map/BarangayMap';
import {
  AlertTriangle, AlertCircle, Users, Shield, MapPin, Plus, Edit,
  CheckCircle, Trash2, X, Save, Home, Loader, Bell, Phone,
  ClipboardList, ChevronRight, FileText, Map
} from 'lucide-react';

const ALERT_LEVELS    = ['advisory','warning','critical'];
const CENTER_STATUSES = ['Standby','Active','Full','Closed'];
const DAMAGE_TYPES    = ['House / Structure','Road / Bridge','Farmland','Electrical','Water System','Others'];
const DAMAGE_SEV      = ['Minor','Moderate','Severe','Total Loss'];
const VULN_CATS       = ['Elderly (60+)','PWD','Infant / Child','Pregnant','Chronic Illness','Flood Zone','Landslide Zone','Coastal'];
// PUROKS from useBarangayConfig
const HOTLINES        = [
  {name:'PNP Emergency',number:'911',color:'#2563eb'},
  {name:'Bureau of Fire',number:'(032) 412-1234',color:'#dc2626'},
  {name:'NDRRMC Hotline',number:'8-1384',color:'#d97706'},
  {name:'Red Cross',number:'143',color:'#dc2626'},
  {name:'PDRRMO',number:'(032) 345-6789',color:'#059669'},
  {name:'PhilHealth',number:'1-800-100-7441',color:'#7c3aed'},
];
const TABS = [
  {id:'map',     label:'Emergency Map',      icon:Map},
  {id:'alerts',  label:'Alerts',             icon:Bell},
  {id:'centers', label:'Evacuation Centers', icon:Home},
  {id:'vuln',    label:'Vulnerable',         icon:Users},
  {id:'damage',  label:'Damage Assessment',  icon:ClipboardList},
  {id:'command', label:'Incident Command',   icon:Shield},
  {id:'hotlines',label:'Emergency Hotlines', icon:Phone},
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

const ModalCard = ({ title, subtitle, icon: Icon, headerColor = '#2563EB', headerGradient, children, onClose, maxWidth = 540 }) => {
  const grad = headerGradient || `linear-gradient(135deg, ${headerColor} 0%, ${headerColor}cc 100%)`;
  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.45)', zIndex:1000, backdropFilter:'blur(6px)' }} />
      <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', zIndex:1001, width:'100%', maxWidth, maxHeight:'90vh', background:'#fff', borderRadius:22, boxShadow:'0 24px 64px rgba(15,23,42,0.20), 0 0 0 1.5px rgba(240,244,248,1)', display:'flex', flexDirection:'column', overflow:'hidden', animation:'slideInUp 0.22s cubic-bezier(0.34,1.15,0.64,1)' }}>
        {/* Gradient header */}
        <div style={{ background: grad, padding:'20px 24px 18px', flexShrink:0, position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', right:-20, top:-20, width:100, height:100, borderRadius:'50%', background:'rgba(255,255,255,0.07)', pointerEvents:'none' }} />
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', position:'relative' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              {Icon && (
                <div style={{ width:40, height:40, borderRadius:11, background:'rgba(255,255,255,0.18)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Icon size={20} color="#fff" />
                </div>
              )}
              <div>
                <h3 style={{ fontSize:16, fontWeight:800, margin:0, color:'#fff', letterSpacing:'-0.02em' }}>{title}</h3>
                {subtitle && <p style={{ fontSize:12, color:'rgba(255,255,255,0.72)', margin:'2px 0 0', fontWeight:400 }}>{subtitle}</p>}
              </div>
            </div>
            <button onClick={onClose} style={{ width:30, height:30, borderRadius:8, background:'rgba(255,255,255,0.15)', border:'none', cursor:'pointer', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', transition:'background 0.15s', flexShrink:0 }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.25)'}
              onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.15)'}>
              <X size={16} />
            </button>
          </div>
        </div>
        {/* Body */}
        <div style={{ overflowY:'auto', padding:'22px 24px', flex:1, display:'flex', flexDirection:'column', gap:16 }}>{children}</div>
      </div>
    </>
  );
};

const FG = ({label, required, hint, children}) => (
  <div className="form-group" style={{ marginBottom:0 }}>
    <label className="form-label">
      {label}{required && <span style={{color:'#EF4444', marginLeft:2}}>*</span>}
    </label>
    {children}
    {hint && <span style={{ fontSize:11.5, color:'#94A3B8', display:'block', marginTop:4 }}>{hint}</span>}
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
  const { barangayName, sitiosWithAll, gpsPoints, center, config } = useBarangayConfig();
  const PUROKS = sitiosWithAll.length > 1
    ? sitiosWithAll.filter(s => s !== 'All Areas')
    : ['Purok 1','Purok 2','Purok 3','Purok 4','Purok 5','Purok 6','Purok 7'];

  const alerts      = Array.isArray(hook.alerts)      ? hook.alerts      : [];
  const centers     = Array.isArray(hook.centers)     ? hook.centers     : [];
  const vulnerables = Array.isArray(hook.vulnerables) ? hook.vulnerables : [];
  const damages     = Array.isArray(hook.damages)     ? hook.damages     : [];
  const tasks       = Array.isArray(hook.tasks)       ? hook.tasks       : [];

  const [tab,setTab] = useState('map');
  const [showRoutes, setShowRoutes] = useState(false);

  // Build DRRM map: all sitio/hall/MRF points with flood risk markers
  const drrmMapPoints = useMemo(() => {
    return gpsPoints.map(p => ({ ...p }));
  }, [gpsPoints]);

  // Evacuation routes: each sitio draws a line to the barangay hall
  const allRoutePoints = useMemo(() => {
    const hall = gpsPoints.find(p => p.type === 'hall');
    if (!hall || gpsPoints.length < 2) return [];
    const sitios = gpsPoints.filter(p => p.type === 'sitio' || p.type === 'zone');
    if (!sitios.length) return [];
    // Build one continuous route: hall -> all sitios -> back to hall
    return [
      { lat: hall.lat, lng: hall.lng, label: hall.label },
      ...sitios,
      { lat: hall.lat, lng: hall.lng, label: hall.label + ' (Return)' },
    ];
  }, [gpsPoints]);

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

      {/* MAP TAB */}
      {tab==='map'&&(
        <div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14,flexWrap:'wrap',gap:10}}>
            <div>
              <h3 style={{fontSize:15,fontWeight:700,color:'#0f172a',margin:'0 0 2px'}}>
                Emergency Map — {barangayName ? `Brgy. ${barangayName}, Cebu City` : 'Cebu City'}
              </h3>
              <p style={{fontSize:12,color:'#64748b',margin:0}}>
                Real GPS locations of sitios, flood-risk areas, MRF, and barangay hall. Click any pin for details.
              </p>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowRoutes(r => !r)}
                style={{background: showRoutes ? '#dbeafe' : undefined, color: showRoutes ? '#1d4ed8' : undefined, borderColor: showRoutes ? '#93c5fd' : undefined}}
              >
                <MapPin size={13}/> {showRoutes ? 'Hide Routes' : 'Show Evacuation Routes'}
              </button>
            </div>
          </div>

          {/* Stat ribbon above map */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:14}}>
            {[
              {label:'Evacuation Centers', value: centers.length,                                          color:'#3b82f6', bg:'#eff6ff'},
              {label:'Active Alerts',      value: alerts.filter(a=>a&&a.status==='Active').length,         color:'#ef4444', bg:'#fef2f2'},
              {label:'Flood Risk Sitios',  value: gpsPoints.filter(p=>p.floodRisk).length,                color:'#d97706', bg:'#fffbeb'},
              {label:'Vulnerable Mapped',  value: vulnerables.length,                                     color:'#7c3aed', bg:'#f5f3ff'},
            ].map(s=>(
              <div key={s.label} style={{background:s.bg,borderRadius:10,padding:'10px 14px'}}>
                <div style={{fontSize:22,fontWeight:700,color:s.color}}>{s.value}</div>
                <div style={{fontSize:11,color:'#64748b',marginTop:2}}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Real Leaflet map */}
          {gpsPoints.length === 0 ? (
            <div style={{textAlign:'center',padding:'60px 20px',background:'#f8fafc',borderRadius:12,border:'1px solid #e2e8f0'}}>
              <Map size={48} style={{color:'#cbd5e1',display:'block',margin:'0 auto 14px'}}/>
              <h4 style={{fontSize:15,fontWeight:600,color:'#374151',marginBottom:6}}>No barangay selected</h4>
              <p style={{fontSize:13,color:'#94a3b8',maxWidth:320,margin:'0 auto 16px',lineHeight:1.6}}>
                Go to Settings and select your barangay to see the real map with sitio pins, flood zones, and evacuation routes.
              </p>
              <button className="btn btn-primary btn-sm" onClick={()=>window.location.href='/settings'}>
                Go to Settings
              </button>
            </div>
          ) : (
            <BarangayMap
              barangayName={barangayName}
              points={drrmMapPoints}
              center={center}
              mode="drrm"
              height={480}
              showRoute={showRoutes}
              routePoints={showRoutes ? allRoutePoints : []}
            />
          )}

          {/* Flood risk legend + info */}
          {gpsPoints.some(p => p.floodRisk || p.coastal) && (
            <div style={{marginTop:14,display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:10,padding:'14px 16px'}}>
                <p style={{fontSize:12,fontWeight:700,color:'#991b1b',marginBottom:8}}>Flood Risk Areas in {barangayName||'Barangay'}</p>
                {gpsPoints.filter(p=>p.floodRisk).map((p,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:8,fontSize:12,color:'#dc2626',marginBottom:5}}>
                    <div style={{width:8,height:8,borderRadius:'50%',background:'#dc2626',flexShrink:0}}/>
                    {p.label} — low-lying, flood-prone
                  </div>
                ))}
                {gpsPoints.filter(p=>p.floodRisk).length === 0 && (
                  <p style={{fontSize:12,color:'#94a3b8'}}>No flood risk areas tagged for this barangay.</p>
                )}
              </div>
              <div style={{background:'#ecfeff',border:'1px solid #a5f3fc',borderRadius:10,padding:'14px 16px'}}>
                <p style={{fontSize:12,fontWeight:700,color:'#0e7490',marginBottom:8}}>Coastal / Storm Surge Areas</p>
                {gpsPoints.filter(p=>p.coastal).map((p,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:8,fontSize:12,color:'#0891b2',marginBottom:5}}>
                    <div style={{width:8,height:8,borderRadius:'50%',background:'#06b6d4',flexShrink:0}}/>
                    {p.label} — coastal, storm surge risk
                  </div>
                ))}
                {gpsPoints.filter(p=>p.coastal).length === 0 && (
                  <p style={{fontSize:12,color:'#94a3b8'}}>No coastal areas tagged for this barangay.</p>
                )}
              </div>
            </div>
          )}

          {/* Evacuation routes text guide */}
          {showRoutes && allRoutePoints.length > 0 && (
            <div style={{marginTop:14,background:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:10,padding:'14px 16px'}}>
              <p style={{fontSize:12,fontWeight:700,color:'#1e40af',marginBottom:10}}>Evacuation Route Plan — {barangayName}</p>
              <p style={{fontSize:12,color:'#374151',marginBottom:8,lineHeight:1.6}}>
                Route shown on map: all sitios proceed to the Barangay Hall assembly point. Flood-risk sitios should use elevated paths when water level rises.
              </p>
              <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                {allRoutePoints.filter((_,i)=>i>0&&i<allRoutePoints.length-1).map((p,i)=>(
                  <span key={i} style={{fontSize:11,padding:'3px 10px',borderRadius:20,background:'#dbeafe',color:'#1e40af',fontWeight:500}}>
                    {i+1}. {p.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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
            <p style={{fontSize:13,color:'#374151',margin:'0 0 12px',lineHeight:1.6}}>View real GPS evacuation routes on the interactive Emergency Map. Shows flood-risk zones and the route to the assembly point.</p>
            <button className="btn btn-primary btn-sm" onClick={()=>setTab('map')}><Map size={14}/> Open Emergency Map</button>
          </div>
        </div>
      )}

      {/* ── MODAL: Send Alert ── */}
      {showA&&(
        <ModalCard
          title="Send Emergency Alert"
          subtitle="Notify residents of an emergency situation"
          icon={Bell}
          headerGradient="linear-gradient(135deg, #991B1B 0%, #EF4444 100%)"
          onClose={()=>setShowA(false)}
          maxWidth={560}
        >
          {aErr&&<div style={{display:'flex',alignItems:'center',gap:9,padding:'10px 14px',background:'#FEF2F2',border:'1.5px solid #FECACA',borderRadius:10,fontSize:13,color:'#DC2626',fontWeight:500}}><AlertCircle size={14}/>{aErr}</div>}

          {/* Alert level selector — visual cards */}
          <div>
            <label className="form-label">Alert Level <span style={{color:'#EF4444'}}>*</span></label>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
              {[
                {val:'advisory', label:'Advisory',   desc:'Precautionary info',  bg:'#EFF6FF', color:'#1D4ED8', border:'#BFDBFE'},
                {val:'warning',  label:'Warning',    desc:'Moderate risk',        bg:'#FFFBEB', color:'#92400E', border:'#FDE68A'},
                {val:'critical', label:'Critical',   desc:'Immediate danger',     bg:'#FEF2F2', color:'#991B1B', border:'#FECACA'},
              ].map(l=>(
                <button key={l.val} type="button"
                  onClick={()=>setAF(p=>({...p,level:l.val}))}
                  style={{padding:'10px 10px',borderRadius:11,border:'2px solid '+(aF.level===l.val?l.color:l.border),background:aF.level===l.val?l.bg:'#fff',cursor:'pointer',textAlign:'center',transition:'all 0.15s',boxShadow:aF.level===l.val?`0 0 0 3px ${l.color}22`:'none'}}>
                  <div style={{fontSize:13,fontWeight:700,color:aF.level===l.val?l.color:'#374151',marginBottom:2}}>{l.label}</div>
                  <div style={{fontSize:11,color:'#94A3B8'}}>{l.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <FG label="Title" required>
            <input className="form-input" value={aF.title} onChange={e=>setAF(p=>({...p,title:e.target.value}))} placeholder="e.g. Typhoon Odette Warning"/>
          </FG>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <FG label="Audience" hint="Who should receive this alert">
              <input className="form-input" value={aF.audience} onChange={e=>setAF(p=>({...p,audience:e.target.value}))} placeholder="All Residents"/>
            </FG>
            <FG label="Affected Area">
              <input className="form-input" value={aF.location} onChange={e=>setAF(p=>({...p,location:e.target.value}))} placeholder="e.g. Purok 3, Riverside"/>
            </FG>
          </div>
          <FG label="Message" required hint="Describe the emergency clearly and concisely">
            <textarea className="form-textarea" rows={4} value={aF.message} onChange={e=>setAF(p=>({...p,message:e.target.value}))} placeholder="Explain the emergency situation, what happened, and the current status..."/>
          </FG>
          <FG label="Safety Instructions" hint="What should residents do right now?">
            <textarea className="form-textarea" rows={2} value={aF.instructions} onChange={e=>setAF(p=>({...p,instructions:e.target.value}))} placeholder="e.g. Evacuate immediately to the nearest evacuation center. Bring essential items only."/>
          </FG>

          <div style={{display:'flex',justifyContent:'flex-end',gap:10,paddingTop:4,borderTop:'1.5px solid #F0F4F8',marginTop:4}}>
            <button className="btn btn-secondary btn-md" onClick={()=>setShowA(false)} disabled={aLoad}>Cancel</button>
            <button className="btn btn-md" onClick={saveAlert} disabled={aLoad}
              style={{background:'linear-gradient(135deg,#DC2626,#EF4444)',color:'#fff',border:'none',display:'flex',alignItems:'center',gap:7,padding:'10px 20px',borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer',boxShadow:'0 2px 10px rgba(220,38,38,0.30)'}}>
              {aLoad?<><Loader size={14} className="animate-spin"/>Sending...</>:<><Bell size={14}/>Send Alert</>}
            </button>
          </div>
        </ModalCard>
      )}

      {/* ── MODAL: Evacuation Center ── */}
      {showC&&(
        <ModalCard
          title={editC ? 'Edit Evacuation Center' : 'Add Evacuation Center'}
          subtitle={editC ? 'Update center details and capacity' : 'Register a new emergency evacuation center'}
          icon={Home}
          headerGradient="linear-gradient(135deg, #065F46 0%, #10B981 100%)"
          onClose={()=>{setShowC(false);setEditC(null);}}
          maxWidth={500}
        >
          {cErr&&<div style={{display:'flex',alignItems:'center',gap:9,padding:'10px 14px',background:'#FEF2F2',border:'1.5px solid #FECACA',borderRadius:10,fontSize:13,color:'#DC2626',fontWeight:500}}><AlertCircle size={14}/>{cErr}</div>}

          <FG label="Center Name" required hint="Official name of the evacuation center">
            <input className="form-input" value={cF.name} onChange={e=>setCF(p=>({...p,name:e.target.value}))} placeholder="e.g. Barangay Hall Evacuation Center"/>
          </FG>
          <FG label="Location / Address" hint="Street, landmark, or purok">
            <input className="form-input" value={cF.location} onChange={e=>setCF(p=>({...p,location:e.target.value}))} placeholder="e.g. Main Road, Purok 1 near the chapel"/>
          </FG>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <FG label="Max Capacity" required hint="Maximum number of evacuees">
              <input type="number" className="form-input" value={cF.capacity} onChange={e=>setCF(p=>({...p,capacity:e.target.value}))} min="1" placeholder="e.g. 200"/>
            </FG>
            <div>
              <label className="form-label">Status</label>
              <div style={{display:'flex',flexDirection:'column',gap:6,marginTop:2}}>
                {CENTER_STATUSES.map(s=>{
                  const colors={Standby:{bg:'#F1F5F9',color:'#475569',border:'#CBD5E1'},Active:{bg:'#D1FAE5',color:'#065F46',border:'#6EE7B7'},Full:{bg:'#FEE2E2',color:'#991B1B',border:'#FCA5A5'},Closed:{bg:'#F3F4F6',color:'#6B7280',border:'#D1D5DB'}}[s];
                  return(
                    <button key={s} type="button" onClick={()=>setCF(p=>({...p,status:s}))}
                      style={{padding:'7px 12px',borderRadius:9,border:'2px solid '+(cF.status===s?colors.color:colors.border),background:cF.status===s?colors.bg:'#fff',color:cF.status===s?colors.color:'#64748B',fontSize:12.5,fontWeight:cF.status===s?700:500,cursor:'pointer',textAlign:'left',transition:'all 0.12s'}}>
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <FG label="Amenities Available" hint="Comma-separated list of available facilities">
            <input className="form-input" value={cF.amenities} onChange={e=>setCF(p=>({...p,amenities:e.target.value}))} placeholder="e.g. Running water, CR, Electricity, Medical area"/>
          </FG>

          <div style={{display:'flex',justifyContent:'flex-end',gap:10,paddingTop:4,borderTop:'1.5px solid #F0F4F8',marginTop:4}}>
            <button className="btn btn-secondary btn-md" onClick={()=>{setShowC(false);setEditC(null);}} disabled={cLoad}>Cancel</button>
            <button className="btn btn-md" onClick={saveCenter} disabled={cLoad}
              style={{background:'linear-gradient(135deg,#059669,#10B981)',color:'#fff',border:'none',display:'flex',alignItems:'center',gap:7,padding:'10px 20px',borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer',boxShadow:'0 2px 10px rgba(5,150,105,0.28)'}}>
              {cLoad?<><Loader size={14} className="animate-spin"/>Saving...</>:<><Save size={14}/>{editC?'Update Center':'Add Center'}</>}
            </button>
          </div>
        </ModalCard>
      )}

      {/* ── MODAL: Update Occupancy ── */}
      {showO&&oC&&(
        <ModalCard
          title="Update Occupancy"
          subtitle={`${oC.name || 'Evacuation Center'}`}
          icon={Users}
          headerGradient="linear-gradient(135deg, #0369A1 0%, #0EA5E9 100%)"
          onClose={()=>{setShowO(false);setOC(null);}}
          maxWidth={380}
        >
          <div style={{background:'#F8FAFC',border:'1.5px solid #F0F4F8',borderRadius:12,padding:'16px 18px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
              <span style={{fontSize:13,fontWeight:600,color:'#374151'}}>Current capacity</span>
              <span style={{fontSize:13,fontWeight:700,color:'#0F172A'}}>{Number(oV)||0} / {oC.capacity||0}</span>
            </div>
            {(()=>{
              const pct=oC.capacity>0?Math.min(100,Math.round(((Number(oV)||0)/oC.capacity)*100)):0;
              const barClr=pct>=90?'#EF4444':pct>=60?'#F59E0B':'#10B981';
              return(<><div style={{height:10,background:'#E2E8F0',borderRadius:100,overflow:'hidden',marginBottom:6}}><div style={{height:'100%',width:pct+'%',background:barClr,borderRadius:100,transition:'width 0.4s'}}/></div><div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'#94A3B8'}}><span>{pct}% full</span><span style={{color:barClr,fontWeight:700}}>{pct>=90?'FULL / CRITICAL':pct>=60?'High occupancy':'Available'}</span></div></>);
            })()}
          </div>
          <FG label={`Number of Evacuees (max ${oC.capacity||0})`} required hint="Current number of people inside the center">
            <input type="number" className="form-input" value={oV} onChange={e=>setOV(e.target.value)} min="0" max={oC.capacity||undefined} style={{fontSize:18,fontWeight:700,textAlign:'center'}}/>
          </FG>
          {Number(oV)>Number(oC.capacity||0)&&(
            <div style={{display:'flex',alignItems:'center',gap:8,padding:'9px 13px',background:'#FEF2F2',border:'1.5px solid #FECACA',borderRadius:10,fontSize:13,color:'#DC2626',fontWeight:600}}>
              <AlertTriangle size={14}/> Exceeds maximum capacity of {oC.capacity}
            </div>
          )}
          <div style={{display:'flex',justifyContent:'flex-end',gap:10,paddingTop:4,borderTop:'1.5px solid #F0F4F8',marginTop:4}}>
            <button className="btn btn-secondary btn-md" onClick={()=>{setShowO(false);setOC(null);}}>Cancel</button>
            <button className="btn btn-md" onClick={saveOcc} disabled={oLoad} style={{background:'linear-gradient(135deg,#0369A1,#0EA5E9)',color:'#fff',border:'none',display:'flex',alignItems:'center',gap:7,padding:'10px 20px',borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer'}}>
              {oLoad?<><Loader size={14} className="animate-spin"/>Saving...</>:<><Save size={14}/>Update</>}
            </button>
          </div>
        </ModalCard>
      )}

      {/* ── MODAL: Vulnerable Resident ── */}
      {showV&&(
        <ModalCard
          title="Add Vulnerable Resident"
          subtitle="Register a resident needing special emergency assistance"
          icon={Users}
          headerGradient="linear-gradient(135deg, #5B21B6 0%, #8B5CF6 100%)"
          onClose={()=>setShowV(false)}
          maxWidth={500}
        >
          <FG label="Full Name" required hint="Resident's complete name">
            <input className="form-input" value={vF.name} onChange={e=>setVF(p=>({...p,name:e.target.value}))} placeholder="e.g. Maria Santos"/>
          </FG>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <FG label="Purok / Sitio">
              <select className="form-select" value={vF.purok} onChange={e=>setVF(p=>({...p,purok:e.target.value}))}>
                <option value="">Select purok</option>
                {PUROKS.map(p=><option key={p} value={p}>{p}</option>)}
              </select>
            </FG>
            <FG label="Vulnerability Category">
              <select className="form-select" value={vF.category} onChange={e=>setVF(p=>({...p,category:e.target.value}))}>
                {VULN_CATS.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </FG>
          </div>
          {/* Category badge preview */}
          <div style={{display:'flex',alignItems:'center',gap:8,padding:'10px 14px',background:'#F5F3FF',border:'1.5px solid #DDD6FE',borderRadius:10}}>
            <Shield size={14} color="#7C3AED"/>
            <span style={{fontSize:12.5,color:'#5B21B6',fontWeight:600}}>Category:</span>
            <span style={{fontSize:12.5,color:'#6D28D9',fontWeight:500}}>{vF.category}</span>
          </div>
          <FG label="Emergency Contact Number" hint="Mobile number for emergency coordination">
            <input className="form-input" value={vF.contact} onChange={e=>setVF(p=>({...p,contact:e.target.value}))} placeholder="09XX XXX XXXX"/>
          </FG>
          <FG label="Special Needs / Notes" hint="Medical conditions, mobility issues, required assistance">
            <textarea className="form-textarea" rows={3} value={vF.notes} onChange={e=>setVF(p=>({...p,notes:e.target.value}))} placeholder="e.g. Uses wheelchair, requires oxygen support, hearing impaired..."/>
          </FG>
          <div style={{display:'flex',justifyContent:'flex-end',gap:10,paddingTop:4,borderTop:'1.5px solid #F0F4F8',marginTop:4}}>
            <button className="btn btn-secondary btn-md" onClick={()=>setShowV(false)} disabled={vLoad}>Cancel</button>
            <button className="btn btn-md" onClick={saveVuln} disabled={vLoad||!vF.name.trim()}
              style={{background:'linear-gradient(135deg,#5B21B6,#8B5CF6)',color:'#fff',border:'none',display:'flex',alignItems:'center',gap:7,padding:'10px 20px',borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer',boxShadow:'0 2px 10px rgba(91,33,182,0.25)',opacity:!vF.name.trim()?0.5:1}}>
              {vLoad?<><Loader size={14} className="animate-spin"/>Saving...</>:<><Save size={14}/>Save Profile</>}
            </button>
          </div>
        </ModalCard>
      )}

      {/* ── MODAL: Damage Report ── */}
      {showD&&(
        <ModalCard
          title="Log Damage Report"
          subtitle="Record infrastructure or property damage after a disaster"
          icon={ClipboardList}
          headerGradient="linear-gradient(135deg, #92400E 0%, #F59E0B 100%)"
          onClose={()=>setShowD(false)}
          maxWidth={520}
        >
          {/* Severity visual selector */}
          <div>
            <label className="form-label">Severity <span style={{color:'#EF4444'}}>*</span></label>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
              {[
                {val:'Minor',      label:'Minor',      desc:'Repairable',   color:'#2563EB', bg:'#EFF6FF', border:'#BFDBFE'},
                {val:'Moderate',   label:'Moderate',   desc:'Significant',  color:'#D97706', bg:'#FFFBEB', border:'#FDE68A'},
                {val:'Severe',     label:'Severe',     desc:'Major damage', color:'#DC2626', bg:'#FEF2F2', border:'#FECACA'},
                {val:'Total Loss', label:'Total Loss', desc:'Destroyed',    color:'#7C3AED', bg:'#F5F3FF', border:'#DDD6FE'},
              ].map(s=>(
                <button key={s.val} type="button" onClick={()=>setDF(p=>({...p,severity:s.val}))}
                  style={{padding:'9px 6px',borderRadius:10,border:'2px solid '+(dF.severity===s.val?s.color:s.border),background:dF.severity===s.val?s.bg:'#fff',cursor:'pointer',textAlign:'center',transition:'all 0.15s',boxShadow:dF.severity===s.val?`0 0 0 3px ${s.color}22`:'none'}}>
                  <div style={{fontSize:12,fontWeight:700,color:dF.severity===s.val?s.color:'#374151',marginBottom:2}}>{s.label}</div>
                  <div style={{fontSize:10.5,color:'#94A3B8'}}>{s.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <FG label="Damage Type" required>
              <select className="form-select" value={dF.type} onChange={e=>setDF(p=>({...p,type:e.target.value}))}>
                {DAMAGE_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
              </select>
            </FG>
            <FG label="Exact Location" required hint="Street, purok, landmark">
              <input className="form-input" value={dF.location} onChange={e=>setDF(p=>({...p,location:e.target.value}))} placeholder="e.g. Purok 3, near the bridge"/>
            </FG>
          </div>
          <FG label="Description" hint="Describe the extent and nature of the damage">
            <textarea className="form-textarea" rows={3} value={dF.description} onChange={e=>setDF(p=>({...p,description:e.target.value}))} placeholder="Describe what was damaged, how it happened, and current condition..."/>
          </FG>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <FG label="Affected Families" hint="Number of families impacted">
              <input type="number" className="form-input" value={dF.affectedFamilies} onChange={e=>setDF(p=>({...p,affectedFamilies:e.target.value}))} min="0" placeholder="0"/>
            </FG>
            <FG label="Estimated Cost (₱)" hint="Rough repair/replacement cost">
              <input type="number" className="form-input" value={dF.estimatedCost} onChange={e=>setDF(p=>({...p,estimatedCost:e.target.value}))} min="0" placeholder="0"/>
            </FG>
          </div>
          <div style={{display:'flex',justifyContent:'flex-end',gap:10,paddingTop:4,borderTop:'1.5px solid #F0F4F8',marginTop:4}}>
            <button className="btn btn-secondary btn-md" onClick={()=>setShowD(false)} disabled={dLoad}>Cancel</button>
            <button className="btn btn-md" onClick={saveDmg} disabled={dLoad||!dF.location.trim()}
              style={{background:'linear-gradient(135deg,#92400E,#F59E0B)',color:'#fff',border:'none',display:'flex',alignItems:'center',gap:7,padding:'10px 20px',borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer',boxShadow:'0 2px 10px rgba(217,119,6,0.28)',opacity:!dF.location.trim()?0.5:1}}>
              {dLoad?<><Loader size={14} className="animate-spin"/>Saving...</>:<><FileText size={14}/>Submit Report</>}
            </button>
          </div>
        </ModalCard>
      )}

      {/* ── MODAL: Incident Task ── */}
      {showT&&(
        <ModalCard
          title="Assign Emergency Task"
          subtitle="Delegate a response task to a barangay team member"
          icon={Shield}
          headerGradient="linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)"
          onClose={()=>setShowT(false)}
          maxWidth={480}
        >
          <FG label="Task Description" required hint="Be specific about what needs to be done">
            <input className="form-input" value={tF.title} onChange={e=>setTF(p=>({...p,title:e.target.value}))} placeholder="e.g. Distribute relief goods to all families in Purok 3"/>
          </FG>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <FG label="Assigned To" hint="Person responsible for this task">
              <input className="form-input" value={tF.assignedTo} onChange={e=>setTF(p=>({...p,assignedTo:e.target.value}))} placeholder="e.g. Kagawad Santos"/>
            </FG>
            <div>
              <label className="form-label">Priority</label>
              <div style={{display:'flex',gap:6,marginTop:2}}>
                {[
                  {val:'High',   color:'#DC2626', bg:'#FEF2F2', border:'#FECACA'},
                  {val:'Medium', color:'#D97706', bg:'#FFFBEB', border:'#FDE68A'},
                  {val:'Low',    color:'#059669', bg:'#ECFDF5', border:'#A7F3D0'},
                ].map(p=>(
                  <button key={p.val} type="button" onClick={()=>setTF(f=>({...f,priority:p.val}))}
                    style={{flex:1,padding:'8px 4px',borderRadius:9,border:'2px solid '+(tF.priority===p.val?p.color:p.border),background:tF.priority===p.val?p.bg:'#fff',color:tF.priority===p.val?p.color:'#64748B',fontSize:12,fontWeight:tF.priority===p.val?700:500,cursor:'pointer',transition:'all 0.12s'}}>
                    {p.val}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <FG label="Instructions / Notes" hint="Additional context or step-by-step directions">
            <textarea className="form-textarea" rows={3} value={tF.notes} onChange={e=>setTF(p=>({...p,notes:e.target.value}))} placeholder="e.g. Coordinate with Purok Leader Reyes. Bring the manifold form."/>
          </FG>
          <div style={{display:'flex',justifyContent:'flex-end',gap:10,paddingTop:4,borderTop:'1.5px solid #F0F4F8',marginTop:4}}>
            <button className="btn btn-secondary btn-md" onClick={()=>setShowT(false)} disabled={tLoad}>Cancel</button>
            <button className="btn btn-md" onClick={saveTask} disabled={tLoad||!tF.title.trim()}
              style={{background:'linear-gradient(135deg,#1E3A8A,#3B82F6)',color:'#fff',border:'none',display:'flex',alignItems:'center',gap:7,padding:'10px 20px',borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer',boxShadow:'0 2px 10px rgba(37,99,235,0.28)',opacity:!tF.title.trim()?0.5:1}}>
              {tLoad?<><Loader size={14} className="animate-spin"/>Assigning...</>:<><ChevronRight size={14}/>Assign Task</>}
            </button>
          </div>
        </ModalCard>
      )}

      <style>{`@keyframes drrmPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(1.4)}}`}</style>
    </div>
  );
}