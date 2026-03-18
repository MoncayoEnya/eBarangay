// src/pages/WasteManagement.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import StatCard from '../components/layout/common/StatCard';
import { useWaste } from '../hooks/useWaste';
import { useBarangayConfig } from '../hooks/useBarangayConfig';
import BarangayMap from '../components/map/BarangayMap';
import { sendSMS } from '../services/smsService';
import { solveCVRP, getCVRPInsights } from '../services/cvrpService';
import { db } from '../services/firebase';
import {
  collection, addDoc, getDocs, updateDoc, doc,
  serverTimestamp, query, orderBy, onSnapshot
} from 'firebase/firestore';
import {
  Route, Truck, Flag, PieChart, Plus, Leaf, Trash2, Recycle,
  MapPin, User, Clock, Edit, CheckCircle, X, Save, Brain,
  Navigation, BarChart2, BookOpen, Calendar, Zap, Loader, Star,
  Shield, AlertTriangle, Bell, Crosshair, AlertCircle
} from 'lucide-react';

const WASTE_TYPES    = ['Biodegradable', 'Non-Biodegradable', 'Recyclable', 'Special Waste'];
const VEHICLE_STATUS = ['Active', 'Standby', 'Maintenance'];
const REPORT_TYPES   = ['Uncollected', 'IllegalDumping', 'OverflowingBin', 'Other'];
const DAYS_OF_WEEK   = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const TYPE_COLORS    = { 'Biodegradable':'success','Non-Biodegradable':'error','Recyclable':'primary','Special Waste':'warning' };
const TYPE_ICONS     = { 'Biodegradable':Leaf,'Non-Biodegradable':Trash2,'Recyclable':Recycle,'Special Waste':Flag };

const EMPTY_SCHED   = { type:'Biodegradable', description:'', days:[], purok:'All Areas', color:'success', reminderEnabled: false };
const EMPTY_VEH     = { name:'', plateNumber:'', driver:'', route:'', startTime:'6:00 AM', status:'Standby', assignedPuroks:[] };
const EMPTY_REPORT  = { title:'', description:'', location:'', purok:'', reportType:'Uncollected', reporter:'', priority:'Normal', gpsLat:'', gpsLng:'' };
const EMPTY_CLEANUP = { title:'', date:'', time:'7:00 AM', location:'', coordinator:'', targetArea:'', maxVolunteers:50, description:'' };

const TABS = [
  { id:'schedules',  label:'Collection Schedules', icon:Calendar  },
  { id:'vehicles',   label:'Fleet & Routes',       icon:Truck     },
  { id:'reports',    label:'Citizen Reports',      icon:Flag      },
  { id:'compliance', label:'Compliance',           icon:Shield    },
  { id:'cleanup',    label:'Clean-up Drives',      icon:Star      },
  { id:'education',  label:'Eco Education',        icon:BookOpen  },
  { id:'analytics',  label:'Analytics',            icon:BarChart2 },
];

// ─── HAVERSINE ────────────────────────────────────────────────────────────────
const haversineKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

// ─── AI ROUTE OPTIMIZER ──────────────────────────────────────────────────────
function AIRouteOptimizer({ vehicles, schedules, onClose, gpsPoints, barangayName }) {
  const [loading,     setLoading]     = useState(false);
  const [results,     setResults]     = useState(null);
  const [insights,    setInsights]    = useState(null);
  const [wasteType,   setWasteType]   = useState('Biodegradable');
  const [activeRoute, setActiveRoute] = useState(0);

  const generate = async () => {
    setLoading(true); setResults(null); setInsights(null);
    if (!gpsPoints?.length) { alert('No GPS points. Set barangay in Settings → Barangay Profile.'); setLoading(false); return; }
    if (!vehicles.length)   { alert('No vehicles registered. Add in Fleet & Routes tab.'); setLoading(false); return; }

    const depot  = gpsPoints.find(p => p.type === 'hall') || gpsPoints[0];
    const stops  = gpsPoints.filter(p => p.type === 'sitio' || p.type === 'zone');
    const routes = solveCVRP(depot, stops, vehicles, wasteType);
    setResults(routes);
    setActiveRoute(0);
    const ai = await getCVRPInsights(routes, barangayName, wasteType);
    setInsights(ai);
    setLoading(false);
  };

  const totalDist = results ? results.reduce((s,r) => s + parseFloat(r.distKm), 0).toFixed(1) : 0;
  const totalTime = results ? Math.max(...results.map(r => r.estMinutes)) : 0;
  const avgUtil   = results ? Math.round(results.reduce((s,r) => s + r.utilization, 0) / results.length) : 0;

  return (
    <div className="modal-overlay" onClick={onClose} style={{backdropFilter:'blur(8px)',background:'rgba(15,23,42,0.55)'}}>
      <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:22,width:'100%',maxWidth:840,width:'95vw',maxHeight:'92vh',display:'flex',flexDirection:'column',boxShadow:'0 24px 64px rgba(15,23,42,0.22),0 0 0 1.5px rgba(240,244,248,1)',overflow:'hidden',animation:'slideInUp 0.22s cubic-bezier(0.34,1.15,0.64,1)'}}>

        {/* Gradient Header */}
        <div style={{background:'linear-gradient(135deg,#1E3A8A,#3B82F6,#6366F1)',padding:'20px 26px 18px',flexShrink:0,position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',right:-30,top:-30,width:130,height:130,borderRadius:'50%',background:'rgba(255,255,255,0.07)',pointerEvents:'none'}}/>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',position:'relative'}}>
            <div style={{display:'flex',alignItems:'center',gap:14}}>
              <div style={{width:46,height:46,borderRadius:13,background:'rgba(255,255,255,0.18)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <Brain size={22} color="#fff"/>
              </div>
              <div>
                <h2 style={{fontSize:17,fontWeight:800,color:'#fff',margin:0,letterSpacing:'-0.025em'}}>CVRP Route Optimizer</h2>
                <p style={{fontSize:12,color:'rgba(255,255,255,0.72)',margin:'3px 0 0',fontWeight:400}}>
                  Clarke-Wright Savings Algorithm · Capacitated VRP · {barangayName ? `Brgy. ${barangayName}` : 'Select barangay in Settings'}
                </p>
              </div>
            </div>
            <button onClick={onClose} style={{width:32,height:32,borderRadius:9,background:'rgba(255,255,255,0.15)',border:'none',cursor:'pointer',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',transition:'background 0.15s'}}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.28)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.15)'}>
              <X size={17}/>
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{flex:1,overflowY:'auto',padding:'22px 26px'}}>
          {!gpsPoints?.length && (
            <div style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',background:'#FFFBEB',border:'1.5px solid #FDE68A',borderRadius:12,marginBottom:18}}>
              <AlertTriangle size={16} color="#D97706" style={{flexShrink:0}}/>
              <span style={{fontSize:13,color:'#92400E',fontWeight:500}}>No barangay GPS data. Go to <strong>Settings → Barangay Profile</strong> to configure your location.</span>
            </div>
          )}

          {/* Algorithm info banner */}
          <div style={{background:'linear-gradient(135deg,#F5F3FF,#EFF6FF)',border:'1.5px solid #C4B5FD',borderRadius:12,padding:'12px 16px',marginBottom:20,display:'flex',alignItems:'flex-start',gap:10}}>
            <div style={{width:28,height:28,borderRadius:8,background:'#EDE9FE',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1}}>
              <Brain size={14} color="#6366F1"/>
            </div>
            <div>
              <p style={{fontSize:12.5,fontWeight:700,color:'#4C1D95',margin:'0 0 3px'}}>Clarke-Wright Savings Algorithm</p>
              <p style={{fontSize:12,color:'#5B21B6',margin:0,lineHeight:1.55}}>savings[i,j] = dist(depot,i) + dist(depot,j) − dist(i,j) · Merges routes greedily respecting truck capacity · O(n² log n) complexity · Solves Capacitated VRP (NP-hard) via polynomial approximation</p>
            </div>
          </div>

          {/* Controls */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr auto',gap:14,alignItems:'end',marginBottom:22,padding:'18px 20px',background:'#F8FAFC',borderRadius:14,border:'1.5px solid #F0F4F8'}}>
            <div className="form-group" style={{margin:0}}>
              <label className="form-label">Waste Type</label>
              <select className="form-select" value={wasteType} onChange={e=>setWasteType(e.target.value)}>
                {WASTE_TYPES.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group" style={{margin:0}}>
              <label className="form-label">Fleet ({vehicles.length} vehicles registered)</label>
              <div style={{padding:'9px 13px',background:'#fff',borderRadius:10,border:'1.5px solid #E2E8F0',fontSize:13,color:'#475569',minHeight:42,display:'flex',alignItems:'center'}}>
                {vehicles.length===0 ? <span style={{color:'#94A3B8',fontStyle:'italic'}}>No vehicles — add in Fleet tab</span> : vehicles.map(v=>`${v.name} (${v.capacityKg||800}kg)`).join(', ')}
              </div>
            </div>
            <button onClick={generate} disabled={loading||!vehicles.length||!gpsPoints?.length}
              style={{padding:'10px 22px',borderRadius:10,border:'none',background: loading?'#E2E8F0':'linear-gradient(135deg,#3B82F6,#6366F1)',color:loading?'#94A3B8':'#fff',fontSize:14,fontWeight:700,cursor:loading||!vehicles.length||!gpsPoints?.length?'not-allowed':'pointer',display:'flex',alignItems:'center',gap:8,whiteSpace:'nowrap',height:42,transition:'all 0.15s',boxShadow:loading?'none':'0 4px 14px rgba(59,130,246,0.35)'}}>
              {loading?<><Loader size={15} style={{animation:'spin 1s linear infinite'}}/> Solving…</>:<><Zap size={15}/> Solve CVRP</>}
            </button>
          </div>

          {/* Results */}
          {results && <>
            {/* Summary stats */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:18}}>
              {[['Routes',results.length,'#3B82F6','#EFF6FF'],['Total Distance',`${totalDist} km`,'#8B5CF6','#F5F3FF'],['Max Completion',`${totalTime} min`,'#10B981','#ECFDF5'],['Avg Utilization',`${avgUtil}%`,avgUtil>=75?'#059669':'#D97706',avgUtil>=75?'#ECFDF5':'#FFFBEB']].map(([l,v,c,bg])=>(
                <div key={l} style={{background:bg,border:`1.5px solid ${c}30`,borderRadius:12,padding:'12px 14px',textAlign:'center'}}>
                  <div style={{fontSize:22,fontWeight:800,color:c,letterSpacing:'-0.03em',lineHeight:1}}>{v}</div>
                  <div style={{fontSize:11.5,color:'#64748B',marginTop:5,fontWeight:500}}>{l}</div>
                </div>
              ))}
            </div>

            {/* Route tabs */}
            <div style={{display:'flex',gap:6,marginBottom:16,flexWrap:'wrap'}}>
              {results.map((r,i)=>(
                <button key={i} onClick={()=>setActiveRoute(i)}
                  style={{padding:'7px 14px',borderRadius:100,fontSize:12.5,fontWeight:600,border:'2px solid '+(activeRoute===i?'#3B82F6':'#E2E8F0'),cursor:'pointer',transition:'all .15s',background:activeRoute===i?'linear-gradient(135deg,#3B82F6,#6366F1)':'#fff',color:activeRoute===i?'#fff':'#64748B',boxShadow:activeRoute===i?'0 3px 10px rgba(59,130,246,0.30)':'none'}}>
                  🚛 {r.vehicle?.name||`Truck ${i+1}`} — {r.stopCount} stops ({r.utilization}%)
                </button>
              ))}
            </div>

            {results[activeRoute] && (()=>{
              const r = results[activeRoute];
              return (
                <div style={{background:'#FAFBFE',border:'1.5px solid #F0F4F8',borderRadius:16,padding:'18px 20px',marginBottom:16}}>
                  {/* Capacity bar */}
                  <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:14}}>
                    <span style={{fontSize:12,color:'#64748B',fontWeight:500,minWidth:110}}>Capacity used</span>
                    <div style={{flex:1,height:10,background:'#E2E8F0',borderRadius:100,overflow:'hidden'}}>
                      <div style={{height:'100%',width:`${r.utilization}%`,background:r.utilization>90?'#EF4444':r.utilization>70?'#F59E0B':'#10B981',borderRadius:100,transition:'width .5s'}}/>
                    </div>
                    <span style={{fontSize:12,fontWeight:700,color:'#0F172A',minWidth:140,textAlign:'right'}}>{r.totalLoad}kg / {r.capacityKg}kg ({r.utilization}%)</span>
                  </div>
                  <BarangayMap barangayName={barangayName} points={gpsPoints}
                    center={gpsPoints[0]?{lat:gpsPoints[0].lat,lng:gpsPoints[0].lng}:{lat:10.3312,lng:123.9050}}
                    mode="waste" height={280} routePoints={r.stops} showRoute={true}/>
                  <div style={{marginTop:14}}>
                    <p style={{fontSize:11,fontWeight:700,color:'#94A3B8',marginBottom:8,textTransform:'uppercase',letterSpacing:'.08em'}}>
                      Stop Sequence — {r.distKm} km · ~{r.estMinutes} min
                    </p>
                    <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                      {r.stops.map((stop,i)=>(
                        <div key={i} style={{display:'flex',alignItems:'center',gap:6,background:stop.isDepot?'#ECFDF5':'#F8FAFC',borderRadius:100,padding:'4px 11px',fontSize:11.5,border:`1.5px solid ${stop.isDepot?'#A7F3D0':'#E2E8F0'}`,fontWeight:500}}>
                          <span style={{width:18,height:18,borderRadius:'50%',background:i===0?'#10B981':i===r.stops.length-1?'#F59E0B':'#3B82F6',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:800,flexShrink:0}}>{i+1}</span>
                          {stop.label||stop.name}
                          {stop.demand&&<span style={{fontSize:10,color:'#94A3B8',fontWeight:400}}>~{stop.demand}kg</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}

            {insights&&(
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <div style={{background:'#ECFDF5',border:'1.5px solid #A7F3D0',borderRadius:14,padding:'16px 18px'}}>
                  <p style={{fontSize:12.5,fontWeight:700,color:'#065F46',marginBottom:10,display:'flex',alignItems:'center',gap:6}}>
                    <span>💡</span> AI Tips · Start: {insights.recommended_start_time} · Fuel: ~{insights.total_fuel_liters}L
                  </p>
                  {(insights.tips||[]).map((t,i)=><p key={i} style={{fontSize:12.5,color:'#047857',marginBottom:6,paddingLeft:12,borderLeft:'2.5px solid #10B981',lineHeight:1.5}}>{t}</p>)}
                </div>
                <div style={{background:'#FFFBEB',border:'1.5px solid #FDE68A',borderRadius:14,padding:'16px 18px'}}>
                  <p style={{fontSize:12.5,fontWeight:700,color:'#92400E',marginBottom:10,display:'flex',alignItems:'center',gap:6}}>
                    <span>⚠️</span> Risk Areas
                  </p>
                  {(insights.risk_areas||[]).map((r,i)=><p key={i} style={{fontSize:12.5,color:'#B45309',marginBottom:6,paddingLeft:12,borderLeft:'2.5px solid #F59E0B',lineHeight:1.5}}>{r}</p>)}
                </div>
              </div>
            )}
          </>}

          {!results&&!loading&&(
            <div style={{textAlign:'center',padding:'48px 0',color:'#94A3B8'}}>
              <Navigation size={52} style={{margin:'0 auto 16px',display:'block',opacity:0.2}}/>
              <p style={{fontSize:14,fontWeight:600,color:'#64748B',margin:'0 0 6px'}}>Ready to optimize routes</p>
              <p style={{fontSize:13,color:'#94A3B8',maxWidth:400,margin:'0 auto',lineHeight:1.65}}>Select waste type and click <strong style={{color:'#3B82F6'}}>Solve CVRP</strong> to run the Clarke-Wright algorithm on your barangay's real GPS coordinates.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{padding:'14px 26px',borderTop:'1.5px solid #F0F4F8',display:'flex',alignItems:'center',justifyContent:'flex-end',background:'#FAFBFE',flexShrink:0,gap:10}}>
          <button className="btn btn-secondary btn-md" onClick={onClose}>Close</button>
          {results&&(
            <button className="btn btn-primary btn-md" onClick={()=>{
              const text=results.map((r,i)=>`Route ${i+1} — ${r.vehicle?.name||'Truck'}\n`+r.stops.map((s,j)=>`  ${j+1}. ${s.label||s.name}${s.demand?` (~${s.demand}kg)`:''}`).join('\n')+`\n  Load: ${r.totalLoad}kg · ${r.distKm}km · ~${r.estMinutes}min`).join('\n\n');
              navigator.clipboard?.writeText(text);
            }} style={{display:'flex',alignItems:'center',gap:8}}>
              <Navigation size={14}/> Copy All Routes
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── COMPLIANCE TAB (Firestore-backed) ───────────────────────────────────────
function ComplianceTab({ puroks }) {
  const [violations, setViolations] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showAdd, setShowAdd]       = useState(false);
  const [form, setForm]             = useState({ household:'', purok: puroks[0]||'Purok 1', address:'', type:'Mixed Waste', status:'Warning' });
  const SC = { Warning:'#f59e0b', Notice:'#3b82f6', Violation:'#ef4444', Compliant:'#10b981' };

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'waste_violations'), orderBy('date', 'desc')),
      snap => { setViolations(snap.docs.map(d=>({id:d.id,...d.data()}))); setLoading(false); },
      () => setLoading(false)
    );
    return () => unsub();
  }, []);

  const logViolation = async () => {
    if (!form.household.trim()) return;
    await addDoc(collection(db, 'waste_violations'), {
      ...form, count: 1, date: new Date().toISOString().split('T')[0], createdAt: serverTimestamp(),
    });
    setShowAdd(false);
    setForm({ household:'', purok: puroks[0]||'Purok 1', address:'', type:'Mixed Waste', status:'Warning' });
  };

  const resolveViolation = async (id) => {
    await updateDoc(doc(db, 'waste_violations', id), { status:'Compliant' });
  };

  return (
    <div style={{marginTop:16}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div><h3 style={{fontWeight:700,fontSize:15,margin:0}}>Segregation Compliance Tracker</h3><p style={{fontSize:12,color:'var(--color-text-tertiary)',marginTop:2}}>Per Cebu City ENRO Ordinance No. 2386</p></div>
        <button className="btn btn-primary btn-sm" onClick={()=>setShowAdd(true)}><Plus size={14}/> Log Violation</button>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:20}}>
        {[['Warnings',violations.filter(v=>v.status==='Warning').length,'#f59e0b','#fffbeb'],
          ['Notices',violations.filter(v=>v.status==='Notice').length,'#3b82f6','#eff6ff'],
          ['Violations',violations.filter(v=>v.status==='Violation').length,'#ef4444','#fef2f2'],
          ['Compliant',violations.filter(v=>v.status==='Compliant').length,'#10b981','#f0fdf4']
        ].map(([l,v,c,bg])=>(
          <div key={l} style={{background:bg,borderRadius:10,padding:'12px 14px'}}>
            <div style={{fontSize:22,fontWeight:700,color:c}}>{v}</div>
            <div style={{fontSize:11,color:'var(--color-text-secondary)',marginTop:2}}>{l}</div>
          </div>
        ))}
      </div>

      {loading ? <p style={{color:'var(--color-text-secondary)',fontSize:13}}>Loading...</p> : (
        <div className="card"><div className="card-body" style={{padding:0}}>
          <table className="data-table" style={{width:'100%'}}>
            <thead><tr><th>Household</th><th>Purok</th><th>Violation</th><th>Date</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {violations.length===0 ? (
                <tr><td colSpan="6"><div className="empty-state"><Shield className="empty-state-icon"/><h3 className="empty-state-title">No violations logged</h3></div></td></tr>
              ) : violations.map(v=>(
                <tr key={v.id}>
                  <td><div style={{fontWeight:600,fontSize:13}}>{v.household}</div><div style={{fontSize:11,color:'var(--color-text-tertiary)'}}>{v.address}</div></td>
                  <td><span style={{fontSize:12}}>{v.purok}</span></td>
                  <td><span style={{fontSize:12}}>{v.type}</span></td>
                  <td><span style={{fontSize:12,color:'var(--color-text-secondary)'}}>{v.date}</span></td>
                  <td><span style={{fontSize:11,fontWeight:600,padding:'3px 10px',borderRadius:20,background:SC[v.status]+'22',color:SC[v.status]}}>{v.status}</span></td>
                  <td>{v.status!=='Compliant'&&<button className="btn btn-secondary btn-sm" style={{fontSize:11}} onClick={()=>resolveViolation(v.id)}><CheckCircle size={12}/> Resolved</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div></div>
      )}

      <div style={{marginTop:20}}>
        <h4 style={{fontWeight:600,fontSize:12,marginBottom:12,color:'var(--color-text-secondary)',textTransform:'uppercase',letterSpacing:'0.05em'}}>Cebu City Segregation Guidelines (ENRO)</h4>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:10}}>
          {[['#10b981','Biodegradable','#f0fdf4',['Food scraps','Garden waste','Fruit peels','Leftovers']],
            ['#3b82f6','Recyclable','#eff6ff',['Paper/cardboard','Plastic bottles','Glass','Metal cans']],
            ['#ef4444','Residual','#fef2f2',['Used diapers','Soiled paper','Candy wrappers','Broken ceramics']],
            ['#8b5cf6','Special Waste','#f5f3ff',['Batteries','Electronics','Chemicals','Medicines']]
          ].map(([c,l,bg,items])=>(
            <div key={l} style={{background:bg,borderRadius:10,padding:14,borderLeft:`4px solid ${c}`}}>
              <p style={{fontWeight:700,color:c,fontSize:13,marginBottom:8}}>{l}</p>
              {items.map(i=><p key={i} style={{fontSize:12,color:'var(--color-text-secondary)',marginBottom:3}}>• {i}</p>)}
            </div>
          ))}
        </div>
      </div>

      {showAdd&&(
        <div className="modal-overlay" onClick={()=>setShowAdd(false)} style={{backdropFilter:'blur(8px)',background:'rgba(15,23,42,0.50)'}}>
          <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:22,width:'100%',maxWidth:460,maxHeight:'92vh',display:'flex',flexDirection:'column',boxShadow:'0 24px 64px rgba(15,23,42,0.20)',overflow:'hidden',animation:'slideInUp 0.22s cubic-bezier(0.34,1.15,0.64,1)'}}>
            <div style={{background:'linear-gradient(135deg,#DC2626,#EF4444)',padding:'20px 24px 18px',flexShrink:0,position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',right:-20,top:-20,width:90,height:90,borderRadius:'50%',background:'rgba(255,255,255,0.08)',pointerEvents:'none'}}/>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',position:'relative'}}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <div style={{width:42,height:42,borderRadius:12,background:'rgba(255,255,255,0.18)',display:'flex',alignItems:'center',justifyContent:'center'}}><AlertTriangle size={20} color="#fff"/></div>
                  <div>
                    <h2 style={{fontSize:17,fontWeight:800,color:'#fff',margin:0,letterSpacing:'-0.025em'}}>Log Violation</h2>
                    <p style={{fontSize:12.5,color:'rgba(255,255,255,0.72)',margin:'2px 0 0'}}>Record a waste management violation</p>
                  </div>
                </div>
                <button onClick={()=>setShowAdd(false)} style={{width:30,height:30,borderRadius:8,background:'rgba(255,255,255,0.15)',border:'none',cursor:'pointer',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center'}}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.28)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.15)'}><X size={16}/></button>
              </div>
            </div>
            <div style={{flex:1,overflowY:'auto',padding:'22px 24px',display:'flex',flexDirection:'column',gap:16}}>
              <div className="form-group"><label className="form-label">Household Name <span style={{color:'#EF4444'}}>*</span></label><input className="form-input" value={form.household} onChange={e=>setForm(p=>({...p,household:e.target.value}))} placeholder="Last, First name" style={{fontSize:15,fontWeight:500}}/></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <div className="form-group"><label className="form-label">Purok/Sitio</label><select className="form-select" value={form.purok} onChange={e=>setForm(p=>({...p,purok:e.target.value}))}>{puroks.filter(x=>x!=='All Areas'&&x!=='All Puroks').map(p=><option key={p}>{p}</option>)}</select></div>
                <div className="form-group"><label className="form-label">Violation Type</label><select className="form-select" value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))}>{['Mixed Waste','No Segregation','Illegal Dumping','Wrong Schedule','Other'].map(t=><option key={t}>{t}</option>)}</select></div>
              </div>
              <div className="form-group"><label className="form-label">Address</label><input className="form-input" value={form.address} onChange={e=>setForm(p=>({...p,address:e.target.value}))} placeholder="Street address or landmark"/></div>
              <div>
                <label className="form-label">Notice Level</label>
                <div style={{display:'flex',gap:8,marginTop:4}}>
                  {[{v:'Warning',bg:'#FFFBEB',color:'#92400E',border:'#FDE68A'},{v:'Notice',bg:'#DBEAFE',color:'#1D4ED8',border:'#BFDBFE'},{v:'Violation',bg:'#FEF2F2',color:'#991B1B',border:'#FECACA'}].map(s=>{
                    const a=form.status===s.v;
                    return<button key={s.v} type="button" onClick={()=>setForm(p=>({...p,status:s.v}))} style={{flex:1,padding:'9px 6px',borderRadius:10,border:'2px solid '+(a?s.color:s.border),background:a?s.bg:'#fff',color:a?s.color:'#64748B',fontSize:12.5,fontWeight:a?700:500,cursor:'pointer',transition:'all 0.12s'}}>{s.v}</button>;
                  })}
                </div>
              </div>
            </div>
            <div style={{padding:'14px 24px',borderTop:'1.5px solid #F0F4F8',display:'flex',justifyContent:'flex-end',background:'#FAFBFE',flexShrink:0,gap:10}}>
              <button className="btn btn-secondary btn-md" onClick={()=>setShowAdd(false)}>Cancel</button>
              <button className="btn btn-md" onClick={logViolation} style={{background:'linear-gradient(135deg,#DC2626,#EF4444)',color:'#fff',border:'none',display:'flex',alignItems:'center',gap:7,padding:'10px 20px',borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer',minWidth:130}}>
                <Save size={15}/> Log Violation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CLEANUP TAB (Firestore-backed) ──────────────────────────────────────────
function CleanupTab({ puroks }) {
  const [drives, setDrives]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]          = useState(EMPTY_CLEANUP);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'waste_cleanups'), orderBy('date', 'asc')),
      snap => { setDrives(snap.docs.map(d=>({id:d.id,...d.data()}))); setLoading(false); },
      () => setLoading(false)
    );
    return () => unsub();
  }, []);

  const save = async () => {
    if (!form.title.trim()) return;
    await addDoc(collection(db, 'waste_cleanups'), { ...form, registered:0, status:'Open', createdAt:serverTimestamp() });
    setShowModal(false);
    setForm(EMPTY_CLEANUP);
  };

  const register = async (d) => {
    await updateDoc(doc(db, 'waste_cleanups', d.id), { registered: Math.min((d.registered||0)+1, d.maxVolunteers) });
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this drive?')) return;
    const { deleteDoc: del } = await import('firebase/firestore');
    await del(doc(db, 'waste_cleanups', id));
  };

  return (
    <div style={{marginTop:16}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div><h3 style={{fontWeight:700,fontSize:15,margin:0}}>Community Clean-up Drives</h3><p style={{fontSize:12,color:'var(--color-text-tertiary)',marginTop:2}}>Coordinate and manage volunteer events</p></div>
        <button className="btn btn-primary btn-sm" onClick={()=>{setForm(EMPTY_CLEANUP);setShowModal(true);}}><Plus size={14}/> Schedule Drive</button>
      </div>
      {loading ? <p style={{color:'var(--color-text-secondary)',fontSize:13}}>Loading...</p> :
        drives.length===0 ? (
          <div className="empty-state"><Star className="empty-state-icon"/><h3 className="empty-state-title">No drives scheduled</h3><button className="btn btn-primary btn-sm mt-3" onClick={()=>{setForm(EMPTY_CLEANUP);setShowModal(true);}}>Schedule First Drive</button></div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:14}}>
            {drives.map(d=>{
              const pct=Math.round(((d.registered||0)/d.maxVolunteers)*100);
              return (
                <div key={d.id} className="card" style={{borderTop:'3px solid #10b981'}}>
                  <div className="card-body">
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
                      <div><h4 style={{fontWeight:700,fontSize:14,marginBottom:2}}>{d.title}</h4><p style={{fontSize:12,color:'var(--color-text-tertiary)'}}>{d.location}</p></div>
                      <span style={{fontSize:11,fontWeight:600,padding:'3px 10px',borderRadius:20,background:d.status==='Upcoming'?'#dbeafe':'#d1fae5',color:d.status==='Upcoming'?'#1d4ed8':'#065f46'}}>{d.status}</span>
                    </div>
                    <p style={{fontSize:12,color:'var(--color-text-secondary)',marginBottom:10,lineHeight:1.5}}>{d.description}</p>
                    <div style={{display:'flex',flexDirection:'column',gap:4,marginBottom:10}}>
                      {[[Calendar,`${d.date} • ${d.time}`],[MapPin,d.targetArea||d.location],[User,`Coord: ${d.coordinator}`]].map(([Icon,text])=>(
                        <div key={text} style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'var(--color-text-secondary)'}}><Icon size={11}/>{text}</div>
                      ))}
                    </div>
                    <div style={{marginBottom:10}}>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:4,fontSize:12,color:'var(--color-text-secondary)'}}><span>Volunteers</span><span style={{fontWeight:600}}>{d.registered||0}/{d.maxVolunteers}</span></div>
                      <div style={{height:6,background:'var(--color-border)',borderRadius:3,overflow:'hidden'}}><div style={{height:'100%',width:`${pct}%`,background:pct>80?'#10b981':'#3b82f6',borderRadius:3}}/></div>
                    </div>
                    <div style={{display:'flex',gap:8}}>
                      <button className="btn btn-primary btn-sm" style={{flex:1}} onClick={()=>register(d)}><CheckCircle size={12}/> Register</button>
                      <button className="btn-icon" style={{color:'var(--color-error)'}} onClick={()=>remove(d.id)}><Trash2 size={13}/></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      }
      {showModal&&(
        <div className="modal-overlay" onClick={()=>setShowModal(false)} style={{backdropFilter:'blur(8px)',background:'rgba(15,23,42,0.50)'}}>
          <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:22,width:'100%',maxWidth:520,maxHeight:'92vh',display:'flex',flexDirection:'column',boxShadow:'0 24px 64px rgba(15,23,42,0.20)',overflow:'hidden',animation:'slideInUp 0.22s cubic-bezier(0.34,1.15,0.64,1)'}}>
            <div style={{background:'linear-gradient(135deg,#065F46,#10B981)',padding:'20px 24px 18px',flexShrink:0,position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',right:-20,top:-20,width:90,height:90,borderRadius:'50%',background:'rgba(255,255,255,0.08)',pointerEvents:'none'}}/>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',position:'relative'}}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <div style={{width:42,height:42,borderRadius:12,background:'rgba(255,255,255,0.18)',display:'flex',alignItems:'center',justifyContent:'center'}}><Calendar size={20} color="#fff"/></div>
                  <div>
                    <h2 style={{fontSize:17,fontWeight:800,color:'#fff',margin:0,letterSpacing:'-0.025em'}}>Schedule Clean-up Drive</h2>
                    <p style={{fontSize:12.5,color:'rgba(255,255,255,0.72)',margin:'2px 0 0'}}>Organize a community clean-up event</p>
                  </div>
                </div>
                <button onClick={()=>setShowModal(false)} style={{width:30,height:30,borderRadius:8,background:'rgba(255,255,255,0.15)',border:'none',cursor:'pointer',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center'}}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.28)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.15)'}><X size={16}/></button>
              </div>
            </div>
            <div style={{flex:1,overflowY:'auto',padding:'22px 24px',display:'flex',flexDirection:'column',gap:16}}>
              <div className="form-group"><label className="form-label">Event Title <span style={{color:'#EF4444'}}>*</span></label><input className="form-input" value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} placeholder="e.g. Monthly Coastal Clean-up" style={{fontSize:15,fontWeight:500}}/></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <div className="form-group"><label className="form-label">Date</label><input type="date" className="form-input" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))}/></div>
                <div className="form-group"><label className="form-label">Time</label><input className="form-input" value={form.time} onChange={e=>setForm(p=>({...p,time:e.target.value}))} placeholder="7:00 AM"/></div>
              </div>
              <div className="form-group"><label className="form-label">Location</label><input className="form-input" value={form.location} onChange={e=>setForm(p=>({...p,location:e.target.value}))} placeholder="Specific location or landmark"/></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <div className="form-group"><label className="form-label">Target Area</label><select className="form-select" value={form.targetArea} onChange={e=>setForm(p=>({...p,targetArea:e.target.value}))}>{puroks.map(p=><option key={p}>{p}</option>)}</select></div>
                <div className="form-group"><label className="form-label">Max Volunteers</label><input type="number" className="form-input" value={form.maxVolunteers} onChange={e=>setForm(p=>({...p,maxVolunteers:Number(e.target.value)}))} min={5} max={500} style={{fontWeight:700,fontSize:16}}/></div>
              </div>
              <div className="form-group"><label className="form-label">Coordinator</label><input className="form-input" value={form.coordinator} onChange={e=>setForm(p=>({...p,coordinator:e.target.value}))} placeholder="Kagawad name"/></div>
              <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" rows={3} value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} placeholder="Event details, what to bring, goals..."/></div>
            </div>
            <div style={{padding:'14px 24px',borderTop:'1.5px solid #F0F4F8',display:'flex',justifyContent:'flex-end',background:'#FAFBFE',flexShrink:0,gap:10}}>
              <button className="btn btn-secondary btn-md" onClick={()=>setShowModal(false)}>Cancel</button>
              <button className="btn btn-md" onClick={save} style={{background:'linear-gradient(135deg,#065F46,#10B981)',color:'#fff',border:'none',display:'flex',alignItems:'center',gap:7,padding:'10px 20px',borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer',minWidth:130}}>
                <Save size={15}/> Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── EDUCATION TAB ────────────────────────────────────────────────────────────
function EducationTab() {
  const arts = [
    {id:1,title:'Proper Waste Segregation in Cebu City',cat:'Segregation',time:'3 min',IconC:Recycle,color:'#3b82f6',bg:'#eff6ff',summary:'Learn the 4-color bin system under Cebu City Ordinance No. 2386 — biodegradable (green), recyclable (blue), residual (black), and special waste (yellow).'},
    {id:2,title:'Why Composting Matters for Your Community',cat:'Composting',time:'5 min',IconC:Leaf,color:'#10b981',bg:'#f0fdf4',summary:'Composting kitchen and garden waste reduces garbage volume by up to 40% and creates natural fertilizer for home gardens and community plots.'},
    {id:3,title:'How to Report Illegal Dumping Effectively',cat:'Reporting',time:'2 min',IconC:Flag,color:'#f59e0b',bg:'#fffbeb',summary:'Step-by-step guide for filing an illegal dumping report with photo evidence and GPS location through the barangay system.'},
    {id:4,title:'Understanding Cebu City MRF System',cat:'Recycling',time:'4 min',IconC:BarChart2,color:'#8b5cf6',bg:'#f5f3ff',summary:'Materials Recovery Facilities process recyclables collected from every barangay. Learn what happens to your separated waste after collection.'},
    {id:5,title:'Eco-Bag and Zero Plastic Initiative',cat:'Plastics',time:'3 min',IconC:Shield,color:'#06b6d4',bg:'#ecfeff',summary:'Cebu City plastic ordinance bans single-use plastics in markets and stores. Learn about eco-bag programs and compliant alternatives.'},
    {id:6,title:'Dengue Prevention Through Proper Waste Disposal',cat:'Health',time:'4 min',IconC:AlertTriangle,color:'#ef4444',bg:'#fef2f2',summary:'Stagnant water in improperly disposed containers breeds mosquitoes. Proper waste disposal directly reduces dengue risk in your area.'},
  ];
  return (
    <div style={{marginTop:16}}>
      <div style={{marginBottom:20}}><h3 style={{fontWeight:700,fontSize:15,margin:'0 0 4px'}}>Environmental Education Content</h3><p style={{fontSize:12,color:'var(--color-text-tertiary)'}}>Resources on proper waste disposal and environmental protection for Cebu City residents</p></div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:14,marginBottom:20}}>
        {arts.map(a=>{
          const ArtIcon = a.IconC;
          return (
            <div key={a.id} className="card" style={{cursor:'pointer',borderLeft:`4px solid ${a.color}`,transition:'box-shadow .2s'}} onMouseEnter={e=>e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)'} onMouseLeave={e=>e.currentTarget.style.boxShadow=''}>
              <div className="card-body">
                <div style={{display:'flex',gap:10,marginBottom:10}}>
                  <div style={{width:36,height:36,borderRadius:8,background:a.bg,border:`1px solid ${a.color}33`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><ArtIcon size={18} color={a.color}/></div>
                  <div><span style={{fontSize:10,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',color:a.color,background:a.color+'18',padding:'2px 8px',borderRadius:20}}>{a.cat}</span><div style={{fontSize:11,color:'var(--color-text-tertiary)',marginTop:3}}>{a.time} read</div></div>
                </div>
                <h4 style={{fontWeight:700,fontSize:14,marginBottom:8,lineHeight:1.4}}>{a.title}</h4>
                <p style={{fontSize:12,color:'var(--color-text-secondary)',lineHeight:1.6}}>{a.summary}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{background:'linear-gradient(135deg,#065f46,#0f766e)',borderRadius:12,padding:'16px 20px',color:'#fff'}}>
        <p style={{fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:6,opacity:0.7}}>Eco Tip of the Day</p>
        <p style={{fontSize:14,fontWeight:500,lineHeight:1.6}}>A single household in Cebu produces approximately 0.5 to 0.8 kg of waste daily. If every sitio properly segregates at the source, the barangay can reduce landfill-bound waste by up to <strong>60%</strong>.</p>
      </div>
    </div>
  );
}

// ─── ANALYTICS TAB ────────────────────────────────────────────────────────────
function AnalyticsTab({ schedules, vehicles, reports, puroks }) {
  const resolved = reports.filter(r=>r.status==='Resolved').length;
  const pending  = reports.filter(r=>r.status==='Pending').length;
  const inProg   = reports.filter(r=>r.status==='In Progress').length;
  const total    = reports.length || 1;
  const Bar = ({label,value,max,color}) => (
    <div style={{marginBottom:10}}>
      <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:4}}><span style={{color:'var(--color-text-secondary)'}}>{label}</span><span style={{fontWeight:600}}>{value}</span></div>
      <div style={{height:8,background:'var(--color-border)',borderRadius:4}}><div style={{height:'100%',width:`${(value/(max||1))*100}%`,background:color,borderRadius:4,transition:'width .7s ease'}}/></div>
    </div>
  );
  return (
    <div style={{marginTop:16}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(270px,1fr))',gap:16}}>
        <div className="card"><div className="card-header"><h3 className="table-title">Reports by Type</h3></div><div className="card-body">
          {REPORT_TYPES.map(t=><Bar key={t} label={t.replace(/([A-Z])/g,' $1').trim()} value={reports.filter(r=>r.reportType===t).length} max={Math.max(...REPORT_TYPES.map(tt=>reports.filter(r=>r.reportType===tt).length),1)} color="#3b82f6"/>)}
        </div></div>
        <div className="card"><div className="card-header"><h3 className="table-title">Resolution Rate</h3></div><div className="card-body">
          <div style={{textAlign:'center',marginBottom:16}}><div style={{fontSize:42,fontWeight:800,color:'#10b981'}}>{Math.round((resolved/total)*100)}%</div><div style={{fontSize:12,color:'var(--color-text-tertiary)'}}>Reports Resolved</div></div>
          <Bar label="Resolved" value={resolved} max={total} color="#10b981"/>
          <Bar label="In Progress" value={inProg} max={total} color="#f59e0b"/>
          <Bar label="Pending" value={pending} max={total} color="#ef4444"/>
        </div></div>
        <div className="card"><div className="card-header"><h3 className="table-title">Fleet Overview</h3></div><div className="card-body">
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:12}}>
            {[['Active','#10b981','#f0fdf4'],['Standby','#f59e0b','#fffbeb'],['Maintenance','#ef4444','#fef2f2']].map(([s,c,bg])=>(
              <div key={s} style={{background:bg,borderRadius:8,padding:'10px 8px',textAlign:'center'}}>
                <div style={{fontSize:22,fontWeight:800,color:c}}>{vehicles.filter(v=>v.status===s).length}</div>
                <div style={{fontSize:10,color:'var(--color-text-secondary)'}}>{s}</div>
              </div>
            ))}
          </div>
          {vehicles.length===0 ? <p style={{fontSize:12,color:'var(--color-text-tertiary)',textAlign:'center'}}>No vehicles yet.</p> :
            vehicles.map(v=>(
              <div key={v.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 0',borderBottom:'1px solid var(--color-border)',fontSize:12}}>
                <div><span style={{fontWeight:600}}>{v.name}</span><span style={{color:'var(--color-text-tertiary)',marginLeft:6}}>{v.plateNumber}</span></div>
                <span style={{fontSize:11,padding:'2px 8px',borderRadius:20,fontWeight:600,background:v.status==='Active'?'#d1fae5':v.status==='Maintenance'?'#fef2f2':'#fef3c7',color:v.status==='Active'?'#065f46':v.status==='Maintenance'?'#991b1b':'#92400e'}}>{v.status}</span>
              </div>
            ))
          }
        </div></div>
        <div className="card"><div className="card-header"><h3 className="table-title">Schedule Coverage by Sitio</h3></div><div className="card-body">
          {puroks.filter(p=>p!=='All Areas'&&p!=='All Puroks').map(purok=>(
            <Bar key={purok} label={purok} value={schedules.filter(s=>s.purok===purok||s.purok==='All Areas'||s.purok==='All Puroks').length} max={4} color="#8b5cf6"/>
          ))}
          {schedules.length===0&&<p style={{fontSize:12,color:'var(--color-text-tertiary)'}}>No schedules yet.</p>}
        </div></div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function WasteManagement() {
  const {
    schedules, vehicles, reports, loading, error, stats,
    loadAll, addSchedule, editSchedule, removeSchedule,
    addVehicle, editVehicle, removeVehicle,
    fileReport, markResolved, removeReport,
  } = useWaste();

  const { barangayName, sitiosWithAll, gpsPoints, center, config } = useBarangayConfig();

  // Dynamic puroks from real barangay config
  const PUROKS = sitiosWithAll.length > 1
    ? sitiosWithAll
    : ['All Areas','Sitio 1','Sitio 2','Sitio 3','Sitio 4','Sitio 5'];

  const [activeTab,  setActiveTab]  = useState('schedules');
  const [showSched,  setShowSched]  = useState(false);
  const [showVeh,    setShowVeh]    = useState(false);
  const [showRep,    setShowRep]    = useState(false);
  const [showRoute,  setShowRoute]  = useState(false);
  const [editSched,  setEditSched]  = useState(null);
  const [editVeh,    setEditVeh]    = useState(null);
  const [schedForm,  setSchedForm]  = useState(EMPTY_SCHED);
  const [vehForm,    setVehForm]    = useState(EMPTY_VEH);
  const [repForm,    setRepForm]    = useState(EMPTY_REPORT);
  const [saving,     setSaving]     = useState(false);
  const [formErr,    setFormErr]    = useState('');
  const [toast,      setToast]      = useState(null);
  const [repFilter,  setRepFilter]  = useState('All');
  const [gpsCapturing, setGpsCapturing] = useState(false);

  // Live vehicle tracking — simulated positions based on assigned puroks + real GPS
  const [vehicleLocations, setVehicleLocations] = useState({});

  useEffect(() => { loadAll(); }, []);

  // Simulate vehicle positions near their assigned puroks on the real map
  useEffect(() => {
    if (!gpsPoints.length || !vehicles.length) return;
    const locs = {};
    vehicles.forEach(v => {
      if (v.status !== 'Active') return;
      // Find a GPS point matching an assigned purok, or use barangay center
      const assignedPt = gpsPoints.find(p =>
        v.assignedPuroks?.some(pu => p.label?.includes(pu) || p.name?.includes(pu))
      ) || gpsPoints.find(p => p.type === 'sitio') || center;
      // Small jitter so multiple trucks don't stack exactly
      locs[v.id] = {
        lat: assignedPt.lat + (Math.random() - 0.5) * 0.0015,
        lng: assignedPt.lng + (Math.random() - 0.5) * 0.0015,
        name: v.name, driver: v.driver, status: v.status,
      };
    });
    setVehicleLocations(locs);

    // Refresh positions every 30s to simulate movement
    const interval = setInterval(() => {
      setVehicleLocations(prev => {
        const updated = {};
        Object.entries(prev).forEach(([id, loc]) => {
          updated[id] = {
            ...loc,
            lat: loc.lat + (Math.random() - 0.5) * 0.0008,
            lng: loc.lng + (Math.random() - 0.5) * 0.0008,
          };
        });
        return updated;
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [gpsPoints, vehicles, center]);

  const notify = (msg, type='success') => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  const fmt = (ts) => {
    if (!ts) return '';
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    const diff = Date.now() - d.getTime();
    const m = Math.floor(diff/60000);
    if (m < 60)   return `${m}m ago`;
    if (m < 1440) return `${Math.floor(m/60)}h ago`;
    return `${Math.floor(m/1440)}d ago`;
  };

  // GPS capture for report filing
  const captureGPS = () => {
    if (!navigator.geolocation) return;
    setGpsCapturing(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setRepForm(p => ({ ...p, gpsLat: pos.coords.latitude.toFixed(6), gpsLng: pos.coords.longitude.toFixed(6) }));
        setGpsCapturing(false);
      },
      () => setGpsCapturing(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // SMS reminder on schedule save
  const saveS = async () => {
    if (!schedForm.type || schedForm.days.length===0) { setFormErr('Select type and at least one day.'); return; }
    setSaving(true);
    const r = editSched
      ? await editSchedule(editSched.id, { ...schedForm, color: TYPE_COLORS[schedForm.type]||'primary' })
      : await addSchedule({ ...schedForm, color: TYPE_COLORS[schedForm.type]||'primary' });
    setSaving(false);
    if (r.success) {
      setShowSched(false);
      notify(editSched ? 'Schedule updated!' : 'Schedule added!');
      // If reminder enabled, send SMS to residents (requires SMS gateway)
      if (schedForm.reminderEnabled && !editSched) {
        try {
          const snap = await getDocs(query(collection(db, 'residents'), orderBy('systemInfo.createdAt', 'desc')));
          const numbers = snap.docs.map(d=>d.data()?.contactNumber).filter(n=>n&&/^(09|\+639)\d{9}$/.test(String(n).replace(/\s|-/g,'')));
          if (numbers.length > 0) {
            await sendSMS([...new Set(numbers)],
              `Collection reminder — ${schedForm.type} waste pickup for ${schedForm.purok} on ${schedForm.days.map(d=>d.day).join(', ')}. Brgy. ${barangayName}`
            );
            notify('Schedule added + SMS reminder sent!');
          }
        } catch (_) {}
      }
    } else setFormErr(r.error||'Error.');
  };

  const openAS  = () => { setSchedForm({...EMPTY_SCHED, purok: PUROKS[0]}); setEditSched(null); setFormErr(''); setShowSched(true); };
  const openES  = (s) => { setSchedForm({type:s.type,description:s.description||'',days:s.days||[],purok:s.purok||PUROKS[0],color:s.color||'success',reminderEnabled:s.reminderEnabled||false}); setEditSched(s); setFormErr(''); setShowSched(true); };
  const togDay  = (day) => setSchedForm(p=>({...p,days:p.days.some(d=>d.day===day)?p.days.filter(d=>d.day!==day):[...p.days,{day,time:'6:00 AM'}]}));
  const openAV  = () => { setVehForm(EMPTY_VEH); setEditVeh(null); setFormErr(''); setShowVeh(true); };
  const openEV  = (v) => { setVehForm({name:v.name,plateNumber:v.plateNumber||'',driver:v.driver||'',route:v.route||'',startTime:v.startTime||'6:00 AM',status:v.status,assignedPuroks:v.assignedPuroks||[]}); setEditVeh(v); setFormErr(''); setShowVeh(true); };
  const togPurok= (p) => setVehForm(prev=>({...prev,assignedPuroks:prev.assignedPuroks?.includes(p)?prev.assignedPuroks.filter(x=>x!==p):[...(prev.assignedPuroks||[]),p]}));
  const saveV   = async () => { if(!vehForm.name.trim()){setFormErr('Name required.');return;} setSaving(true); const r=editVeh?await editVehicle(editVeh.id,vehForm):await addVehicle(vehForm); setSaving(false); if(r.success){setShowVeh(false);notify(editVeh?'Vehicle updated!':'Vehicle registered!');}else setFormErr(r.error||'Error.'); };
  const saveR   = async () => { if(!repForm.title.trim()){setFormErr('Title required.');return;} setSaving(true); const r=await fileReport({...repForm,color:repForm.reportType==='IllegalDumping'?'warning':'error'}); setSaving(false); if(r.success){setShowRep(false);setRepForm(EMPTY_REPORT);notify('Report filed!');}else setFormErr(r.error||'Error.'); };

  const filtReps = repFilter==='All' ? reports : reports.filter(r=>r.status===repFilter);
  const PC = { High:'#ef4444', Normal:'#3b82f6', Low:'#10b981' };

  // Build vehicle tracker points for the map
  const vehicleMapPoints = Object.entries(vehicleLocations).map(([id, loc]) => ({
    lat: loc.lat, lng: loc.lng,
    label: `🚛 ${loc.name}`,
    name: loc.name,
    type: 'vehicle',
  }));

  return (
    <div className="page-container">
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes slideIn{from{transform:translateX(40px);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>

      {toast&&<div style={{position:'fixed',top:24,right:24,zIndex:9999,background:toast.type==='success'?'#10b981':'#ef4444',color:'#fff',padding:'10px 20px',borderRadius:10,fontSize:13,fontWeight:600,boxShadow:'0 4px 20px rgba(0,0,0,0.15)',display:'flex',alignItems:'center',gap:8,animation:'slideIn .3s ease'}}><CheckCircle size={14}/>{toast.msg}</div>}

      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Waste Management & Collection</h1>
          <p className="page-subtitle">
            {barangayName ? `Brgy. ${barangayName}, Cebu City` : '⚠️ No barangay selected — go to Settings → Barangay Profile'}
            {' · '}Collection, compliance, fleet & environmental services
          </p>
        </div>
        <div className="d-flex gap-2" style={{flexWrap:'wrap'}}>
          <button className="btn btn-secondary btn-md" onClick={()=>setShowRoute(true)} style={{background:'linear-gradient(135deg,#ede9fe,#dbeafe)',border:'1px solid #c4b5fd',color:'#5b21b6'}}><Brain size={14}/> AI Route Optimizer</button>
          <button className="btn btn-secondary btn-md" onClick={()=>{setFormErr('');setRepForm({...EMPTY_REPORT,purok:PUROKS.find(p=>p!=='All Areas')||''}); setShowRep(true);}}><Flag size={14}/> File Report</button>
          <button className="btn btn-primary btn-md" onClick={openAS}><Plus size={15}/> Add Schedule</button>
        </div>
      </div>

      {!barangayName && (
        <div style={{background:'#fffbeb',border:'1px solid #fde68a',borderRadius:12,padding:'12px 16px',marginBottom:20,display:'flex',alignItems:'center',gap:10}}>
          <AlertTriangle size={18} color="#d97706"/>
          <span style={{fontSize:13,color:'#92400e'}}>
            <strong>No barangay configured.</strong> The map will show a default location. Go to <strong>Settings → Barangay Profile</strong> and set your barangay name to get accurate GPS coordinates, real sitio names, and correct collection routes.
          </span>
        </div>
      )}

      <div className="stats-grid">
        <StatCard title="Schedules"       value={stats?.schedules||schedules.length}  icon={Route}     iconBg="icon-bg-success"   badge="Active"      badgeColor="badge-success"/>
        <StatCard title="Active Vehicles"  value={stats?.activeVehicles||vehicles.filter(v=>v.status==='Active').length} icon={Truck} iconBg="icon-bg-primary" badge="On duty" badgeColor="badge-primary"/>
        <StatCard title="Pending Reports"  value={stats?.pendingReports||reports.filter(r=>r.status==='Pending').length} icon={Flag}  iconBg="icon-bg-warning"  badge="Need action" badgeColor="badge-warning"/>
        <StatCard title="Total Reports"    value={reports.length}                      icon={BarChart2} iconBg="icon-bg-secondary" badge="All time"     badgeColor="badge-gray"/>
      </div>

      <div className="filters-section mb-0" style={{overflowX:'auto'}}>
        <div className="filter-buttons-group" style={{flexWrap:'nowrap',minWidth:'max-content'}}>
          {TABS.map(({id,label,icon:Icon})=>(
            <button key={id} className={`filter-btn ${activeTab===id?'active':''}`} onClick={()=>setActiveTab(id)} style={{display:'flex',alignItems:'center',gap:6}}>
              <Icon size={13}/>{label}
            </button>
          ))}
        </div>
      </div>

      {error&&<div className="alert alert-error mb-4 mt-4">{error}</div>}

      {/* ── SCHEDULES ── */}
      {activeTab==='schedules'&&(
        <div className="card mt-4">
          <div className="card-header"><h3 className="table-title">Collection Schedules</h3><button className="btn btn-primary btn-sm" onClick={openAS}><Plus size={14}/> Add</button></div>
          <div className="card-body">
            {loading ? <p className="text-secondary">Loading...</p> : schedules.length===0 ? (
              <div className="empty-state"><Recycle className="empty-state-icon"/><h3 className="empty-state-title">No schedules yet</h3><button className="btn btn-primary btn-md mt-4" onClick={openAS}><Plus size={15}/> Add First Schedule</button></div>
            ) : (
              <div className="grid-auto">
                {schedules.map(s=>{
                  const color = TYPE_COLORS[s.type]||'primary';
                  const Icon  = TYPE_ICONS[s.type]||Recycle;
                  return (
                    <div key={s.id} className="card" style={{borderLeft:`4px solid var(--color-${color})`}}>
                      <div className="card-body">
                        <div className="d-flex justify-between align-start mb-3">
                          <div className={`icon-bg-${color}`} style={{width:44,height:44,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:'var(--radius-lg)'}}><Icon size={22}/></div>
                          <div className="d-flex gap-2">
                            <button className="btn-icon" onClick={()=>openES(s)}><Edit size={14}/></button>
                            <button className="btn-icon" style={{color:'var(--color-error)'}} onClick={()=>{if(window.confirm('Delete schedule?'))removeSchedule(s.id);}}><Trash2 size={14}/></button>
                          </div>
                        </div>
                        <h4 className="fw-bold text-primary mb-1">{s.type}</h4>
                        <p className="text-secondary mb-3" style={{fontSize:'var(--font-size-sm)'}}>{s.description}</p>
                        <div className="mb-2">
                          {(s.days||[]).map((d,i)=>(
                            <div key={i} className="d-flex justify-between align-center mb-1">
                              <span className="text-secondary" style={{fontSize:'var(--font-size-sm)'}}>{d.day}</span>
                              <span className={`badge badge-${color}`}>{d.time}</span>
                            </div>
                          ))}
                        </div>
                        <p className="text-tertiary d-flex align-center gap-1" style={{fontSize:'var(--font-size-xs)'}}><MapPin size={11}/>{s.purok}</p>
                        {s.reminderEnabled && <p style={{fontSize:11,color:'#3b82f6',display:'flex',alignItems:'center',gap:4,marginTop:4}}><Bell size={11}/> SMS reminder enabled</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── VEHICLES + LIVE MAP ── */}
      {activeTab==='vehicles'&&(
        <div style={{marginTop:16,display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          <div className="card">
            <div className="card-header"><h3 className="table-title">Fleet Registry</h3><button className="btn btn-primary btn-sm" onClick={openAV}><Plus size={14}/> Add Vehicle</button></div>
            <div className="card-body">
              {vehicles.length===0 ? (
                <div className="empty-state"><Truck className="empty-state-icon"/><h3 className="empty-state-title">No vehicles</h3><button className="btn btn-primary btn-sm mt-3" onClick={openAV}>Add Vehicle</button></div>
              ) : (
                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  {vehicles.map(v=>(
                    <div key={v.id} style={{padding:'12px 14px',border:'1px solid var(--color-border)',borderRadius:10}}>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                        <div>
                          <span style={{fontWeight:700,fontSize:14}}>{v.name}</span>
                          <span style={{fontSize:12,color:'var(--color-text-tertiary)',marginLeft:8}}>{v.plateNumber}</span>
                          {vehicleLocations[v.id] && (
                            <span style={{fontSize:10,fontWeight:600,padding:'1px 7px',borderRadius:20,background:'#d1fae5',color:'#065f46',marginLeft:6}}>📍 Live</span>
                          )}
                        </div>
                        <div style={{display:'flex',gap:6,alignItems:'center'}}>
                          <span style={{fontSize:11,fontWeight:600,padding:'2px 9px',borderRadius:20,background:v.status==='Active'?'#d1fae5':v.status==='Maintenance'?'#fef2f2':'#fef3c7',color:v.status==='Active'?'#065f46':v.status==='Maintenance'?'#991b1b':'#92400e'}}>{v.status}</span>
                          <button className="btn-icon" onClick={()=>openEV(v)}><Edit size={13}/></button>
                          <button className="btn-icon" style={{color:'var(--color-error)'}} onClick={()=>{if(window.confirm('Remove?'))removeVehicle(v.id);}}><Trash2 size={13}/></button>
                        </div>
                      </div>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:4}}>
                        {[[User,v.driver||'No driver'],[Route,v.route||'No route'],[Clock,v.startTime]].map(([Icon,text])=>(
                          <div key={text} style={{display:'flex',alignItems:'center',gap:4,fontSize:11,color:'var(--color-text-secondary)'}}><Icon size={10}/>{text}</div>
                        ))}
                      </div>
                      {v.assignedPuroks?.length>0&&(
                        <div style={{marginTop:6,display:'flex',flexWrap:'wrap',gap:4}}>
                          {v.assignedPuroks.map(p=><span key={p} style={{fontSize:10,fontWeight:600,padding:'2px 7px',borderRadius:20,background:'#dbeafe',color:'#1d4ed8'}}>{p}</span>)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="table-title">
                Live Route Map — {barangayName ? `Brgy. ${barangayName}` : 'No barangay selected'}
              </h3>
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                {Object.keys(vehicleLocations).length > 0 && (
                  <span style={{fontSize:11,fontWeight:600,padding:'3px 10px',borderRadius:20,background:'#d1fae5',color:'#065f46',display:'flex',alignItems:'center',gap:4}}>
                    <span style={{width:6,height:6,borderRadius:'50%',background:'#10b981',display:'inline-block'}}/>
                    {Object.keys(vehicleLocations).length} vehicle{Object.keys(vehicleLocations).length>1?'s':''} live
                  </span>
                )}
                <button className="btn btn-secondary btn-sm" style={{fontSize:11,background:'linear-gradient(135deg,#ede9fe,#dbeafe)',border:'1px solid #c4b5fd',color:'#5b21b6'}} onClick={()=>setShowRoute(true)}><Brain size={12}/> AI Optimize</button>
              </div>
            </div>
            <div className="card-body" style={{padding:0}}>
              <BarangayMap
                barangayName={barangayName}
                points={[...gpsPoints, ...vehicleMapPoints]}
                center={center}
                mode="waste"
                height={440}
              />
            </div>
            {!barangayName && (
              <div style={{padding:'10px 14px',background:'#fffbeb',borderTop:'1px solid #fde68a',fontSize:12,color:'#92400e'}}>
                ⚠️ Map shows default Cebu City location. Set your barangay in <strong>Settings → Barangay Profile</strong> for accurate GPS.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── REPORTS ── */}
      {activeTab==='reports'&&(
        <div className="card mt-4">
          <div className="card-header">
            <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
              <h3 className="table-title" style={{margin:0}}>Citizen Reports</h3>
              <div style={{display:'flex',gap:5}}>
                {['All','Pending','In Progress','Resolved'].map(f=>(
                  <button key={f} onClick={()=>setRepFilter(f)} style={{fontSize:11,padding:'3px 10px',borderRadius:20,border:'1px solid',cursor:'pointer',fontWeight:repFilter===f?700:400,background:repFilter===f?'#3b82f6':'transparent',color:repFilter===f?'#fff':'var(--color-text-secondary)',borderColor:repFilter===f?'#3b82f6':'var(--color-border)'}}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={()=>{setFormErr('');setRepForm({...EMPTY_REPORT,purok:PUROKS.find(p=>p!=='All Areas')||''});setShowRep(true);}}><Plus size={14}/> File</button>
          </div>
          <div className="card-body">
            {loading ? <p className="text-secondary">Loading...</p> : filtReps.length===0 ? (
              <div className="empty-state"><Flag className="empty-state-icon"/><h3 className="empty-state-title">No reports {repFilter!=='All'?`with status "${repFilter}"`:'filed yet'}</h3></div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {filtReps.map(r=>(
                  <div key={r.id} style={{display:'flex',alignItems:'flex-start',gap:12,padding:'14px 16px',border:'1px solid var(--color-border)',borderRadius:10,borderLeft:`4px solid ${PC[r.priority]||'#3b82f6'}`}}>
                    <div className={`icon-bg-${r.color||'error'}`} style={{width:36,height:36,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:9,flexShrink:0}}><Flag size={15}/></div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:4,flexWrap:'wrap',gap:6}}>
                        <div>
                          <span style={{fontWeight:700,fontSize:13}}>{r.title}</span>
                          {r.priority&&r.priority!=='Normal'&&<span style={{fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:20,background:PC[r.priority]+'22',color:PC[r.priority],marginLeft:8}}>{r.priority}</span>}
                        </div>
                        <div style={{display:'flex',gap:6,alignItems:'center'}}>
                          <span style={{fontSize:11,padding:'2px 8px',borderRadius:20,fontWeight:600,background:r.status==='Resolved'?'#d1fae5':r.status==='In Progress'?'#dbeafe':'#fef3c7',color:r.status==='Resolved'?'#065f46':r.status==='In Progress'?'#1d4ed8':'#92400e'}}>{r.status}</span>
                          {r.status!=='Resolved'&&<button className="btn-icon" style={{color:'var(--color-success)'}} onClick={async()=>{await markResolved(r.id);notify('Report resolved!');}}><CheckCircle size={14}/></button>}
                          <button className="btn-icon" style={{color:'var(--color-error)'}} onClick={()=>{if(window.confirm('Delete?'))removeReport(r.id);}}><Trash2 size={14}/></button>
                        </div>
                      </div>
                      <p style={{fontSize:12,color:'var(--color-text-secondary)',marginBottom:5,lineHeight:1.5}}>{r.description}</p>
                      <div style={{display:'flex',gap:10,flexWrap:'wrap',fontSize:11,color:'var(--color-text-tertiary)'}}>
                        {r.purok&&<span style={{display:'flex',alignItems:'center',gap:3}}><MapPin size={10}/>{r.purok}</span>}
                        {r.location&&<span style={{display:'flex',alignItems:'center',gap:3}}><MapPin size={10}/>{r.location}</span>}
                        {r.gpsLat&&<span style={{display:'flex',alignItems:'center',gap:3}}><Crosshair size={10}/>GPS: {r.gpsLat}, {r.gpsLng}</span>}
                        {r.reporter&&<span style={{display:'flex',alignItems:'center',gap:3}}><User size={10}/>{r.reporter}</span>}
                        <span style={{display:'flex',alignItems:'center',gap:3}}><Clock size={10}/>{fmt(r.systemInfo?.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab==='compliance'&&<ComplianceTab puroks={PUROKS}/>}
      {activeTab==='cleanup'   &&<CleanupTab puroks={PUROKS}/>}
      {activeTab==='education' &&<EducationTab/>}
      {activeTab==='analytics' &&<AnalyticsTab schedules={schedules} vehicles={vehicles} reports={reports} puroks={PUROKS}/>}

      {/* ══ SCHEDULE MODAL ══ */}
      {showSched&&(
        <div className="modal-overlay" onClick={()=>setShowSched(false)} style={{backdropFilter:'blur(8px)',background:'rgba(15,23,42,0.50)'}}>
          <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:22,width:'100%',maxWidth:540,maxHeight:'92vh',display:'flex',flexDirection:'column',boxShadow:'0 24px 64px rgba(15,23,42,0.20)',overflow:'hidden',animation:'slideInUp 0.22s cubic-bezier(0.34,1.15,0.64,1)'}}>
            <div style={{background:'linear-gradient(135deg,#1D4ED8,#3B82F6)',padding:'20px 24px 18px',flexShrink:0,position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',right:-20,top:-20,width:90,height:90,borderRadius:'50%',background:'rgba(255,255,255,0.08)',pointerEvents:'none'}}/>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',position:'relative'}}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <div style={{width:42,height:42,borderRadius:12,background:'rgba(255,255,255,0.18)',display:'flex',alignItems:'center',justifyContent:'center'}}><Recycle size={20} color="#fff"/></div>
                  <div>
                    <h2 style={{fontSize:17,fontWeight:800,color:'#fff',margin:0,letterSpacing:'-0.025em'}}>{editSched?'Edit Schedule':'Add Collection Schedule'}</h2>
                    <p style={{fontSize:12.5,color:'rgba(255,255,255,0.72)',margin:'2px 0 0'}}>Set waste collection days and times</p>
                  </div>
                </div>
                <button onClick={()=>setShowSched(false)} style={{width:30,height:30,borderRadius:8,background:'rgba(255,255,255,0.15)',border:'none',cursor:'pointer',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center'}}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.28)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.15)'}><X size={16}/></button>
              </div>
            </div>
            <div style={{flex:1,overflowY:'auto',padding:'22px 24px',display:'flex',flexDirection:'column',gap:16}}>
              {formErr&&<div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:'#FEF2F2',border:'1.5px solid #FECACA',borderRadius:10,fontSize:13,color:'#DC2626',fontWeight:500}}><AlertCircle size={14}/>{formErr}</div>}
              <div className="form-group"><label className="form-label">Waste Type <span style={{color:'#EF4444'}}>*</span></label><select className="form-select" value={schedForm.type} onChange={e=>setSchedForm(p=>({...p,type:e.target.value}))}>{WASTE_TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <div className="form-group"><label className="form-label">Description</label><input className="form-input" value={schedForm.description} onChange={e=>setSchedForm(p=>({...p,description:e.target.value}))} placeholder="e.g. Kitchen & garden waste"/></div>
                <div className="form-group"><label className="form-label">Coverage Area</label><select className="form-select" value={schedForm.purok} onChange={e=>setSchedForm(p=>({...p,purok:e.target.value}))}>{PUROKS.map(p=><option key={p}>{p}</option>)}</select></div>
              </div>
              <div className="form-group">
                <label className="form-label">Collection Days <span style={{color:'#EF4444'}}>*</span></label>
                <div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:6}}>
                  {DAYS_OF_WEEK.map(day=>{const sel=schedForm.days.some(d=>d.day===day);return(<button key={day} type="button" onClick={()=>togDay(day)} style={{padding:'7px 14px',borderRadius:100,fontSize:12.5,fontWeight:sel?700:500,border:'2px solid '+(sel?'#2563EB':'#E2E8F0'),background:sel?'#EFF6FF':'#fff',color:sel?'#1D4ED8':'#64748B',cursor:'pointer',transition:'all 0.12s'}}>{day}</button>);})}
                </div>
              </div>
              {schedForm.days.length>0&&(
                <div className="form-group"><label className="form-label">Collection Times</label>
                  <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:4}}>
                    {schedForm.days.map(d=>(<div key={d.day} style={{display:'flex',alignItems:'center',gap:10}}><span style={{fontSize:13,fontWeight:600,color:'#1D4ED8',minWidth:96,padding:'8px 12px',background:'#EFF6FF',borderRadius:8,textAlign:'center'}}>{d.day}</span><input className="form-input" style={{flex:1}} value={d.time} onChange={e=>setSchedForm(p=>({...p,days:p.days.map(x=>x.day===d.day?{...x,time:e.target.value}:x)}))} placeholder="6:00 AM"/></div>))}
                  </div>
                </div>
              )}
              <div style={{display:'flex',alignItems:'center',gap:12,padding:'12px 15px',background:'#EFF6FF',borderRadius:12,border:'1.5px solid #BFDBFE',cursor:'pointer'}} onClick={()=>setSchedForm(p=>({...p,reminderEnabled:!p.reminderEnabled}))}>
                <Bell size={16} color="#2563EB" style={{flexShrink:0}}/>
                <div style={{flex:1}}><p style={{fontSize:13,fontWeight:600,color:'#1D4ED8',margin:0}}>SMS Reminder</p><p style={{fontSize:12,color:'#3B82F6',margin:'2px 0 0'}}>Notify residents before collection day</p></div>
                <div style={{width:44,height:24,borderRadius:100,background:schedForm.reminderEnabled?'#2563EB':'#CBD5E1',position:'relative',transition:'background 0.2s',flexShrink:0}}><div style={{width:18,height:18,borderRadius:'50%',background:'#fff',position:'absolute',top:3,left:schedForm.reminderEnabled?23:3,transition:'left 0.2s',boxShadow:'0 1px 4px rgba(0,0,0,0.15)'}}/></div>
              </div>
            </div>
            <div style={{padding:'14px 24px',borderTop:'1.5px solid #F0F4F8',display:'flex',justifyContent:'flex-end',background:'#FAFBFE',flexShrink:0,gap:10}}>
              <button className="btn btn-secondary btn-md" onClick={()=>setShowSched(false)} disabled={saving}>Cancel</button>
              <button className="btn btn-primary btn-md" onClick={saveS} disabled={saving} style={{minWidth:150}}><Save size={15}/>{saving?'Saving…':editSched?'Update Schedule':'Add Schedule'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ VEHICLE MODAL ══ */}
      {showVeh&&(
        <div className="modal-overlay" onClick={()=>setShowVeh(false)} style={{backdropFilter:'blur(8px)',background:'rgba(15,23,42,0.50)'}}>
          <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:22,width:'100%',maxWidth:540,maxHeight:'92vh',display:'flex',flexDirection:'column',boxShadow:'0 24px 64px rgba(15,23,42,0.20)',overflow:'hidden',animation:'slideInUp 0.22s cubic-bezier(0.34,1.15,0.64,1)'}}>
            <div style={{background:'linear-gradient(135deg,#5B21B6,#8B5CF6)',padding:'20px 24px 18px',flexShrink:0,position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',right:-20,top:-20,width:90,height:90,borderRadius:'50%',background:'rgba(255,255,255,0.08)',pointerEvents:'none'}}/>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',position:'relative'}}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <div style={{width:42,height:42,borderRadius:12,background:'rgba(255,255,255,0.18)',display:'flex',alignItems:'center',justifyContent:'center'}}><Truck size={20} color="#fff"/></div>
                  <div>
                    <h2 style={{fontSize:17,fontWeight:800,color:'#fff',margin:0,letterSpacing:'-0.025em'}}>{editVeh?'Edit Vehicle':'Register Vehicle'}</h2>
                    <p style={{fontSize:12.5,color:'rgba(255,255,255,0.72)',margin:'2px 0 0'}}>Add a garbage collection vehicle to the fleet</p>
                  </div>
                </div>
                <button onClick={()=>setShowVeh(false)} style={{width:30,height:30,borderRadius:8,background:'rgba(255,255,255,0.15)',border:'none',cursor:'pointer',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center'}}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.28)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.15)'}><X size={16}/></button>
              </div>
            </div>
            <div style={{flex:1,overflowY:'auto',padding:'22px 24px',display:'flex',flexDirection:'column',gap:16}}>
              {formErr&&<div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:'#FEF2F2',border:'1.5px solid #FECACA',borderRadius:10,fontSize:13,color:'#DC2626',fontWeight:500}}><AlertCircle size={14}/>{formErr}</div>}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <div className="form-group"><label className="form-label">Vehicle Name <span style={{color:'#EF4444'}}>*</span></label><input className="form-input" value={vehForm.name} onChange={e=>setVehForm(p=>({...p,name:e.target.value}))} placeholder="Garbage Truck #1" style={{fontSize:14,fontWeight:500}}/></div>
                <div className="form-group"><label className="form-label">Plate Number</label><input className="form-input" value={vehForm.plateNumber} onChange={e=>setVehForm(p=>({...p,plateNumber:e.target.value}))} placeholder="ABC-1234"/></div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <div className="form-group"><label className="form-label">Driver</label><input className="form-input" value={vehForm.driver} onChange={e=>setVehForm(p=>({...p,driver:e.target.value}))} placeholder="Driver name"/></div>
                <div>
                  <label className="form-label">Status</label>
                  <div style={{display:'flex',gap:6,marginTop:4}}>
                    {VEHICLE_STATUS.map(s=>{const colors={Active:{bg:'#ECFDF5',color:'#065F46',border:'#A7F3D0'},Maintenance:{bg:'#FFFBEB',color:'#92400E',border:'#FDE68A'},Inactive:{bg:'#F1F5F9',color:'#475569',border:'#CBD5E1'}}[s]||{bg:'#F1F5F9',color:'#475569',border:'#CBD5E1'};const a=vehForm.status===s;return<button key={s} type="button" onClick={()=>setVehForm(p=>({...p,status:s}))} style={{flex:1,padding:'7px 4px',borderRadius:9,border:'2px solid '+(a?colors.color:colors.border),background:a?colors.bg:'#fff',color:a?colors.color:'#64748B',fontSize:11.5,fontWeight:a?700:500,cursor:'pointer',transition:'all 0.12s'}}>{s}</button>;})}
                  </div>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <div className="form-group"><label className="form-label">Route Description</label><input className="form-input" value={vehForm.route} onChange={e=>setVehForm(p=>({...p,route:e.target.value}))} placeholder="Main St. → Sitio A"/></div>
                <div className="form-group"><label className="form-label">Start Time</label><input className="form-input" value={vehForm.startTime} onChange={e=>setVehForm(p=>({...p,startTime:e.target.value}))} placeholder="6:00 AM"/></div>
              </div>
              <div className="form-group">
                <label className="form-label">Assigned Sitios / Puroks</label>
                <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:6}}>
                  {PUROKS.filter(p=>p!=='All Areas'&&p!=='All Puroks').map(p=>{const sel=vehForm.assignedPuroks?.includes(p);return(<button key={p} type="button" onClick={()=>togPurok(p)} style={{padding:'5px 12px',borderRadius:100,fontSize:12,fontWeight:sel?700:500,border:'2px solid '+(sel?'#7C3AED':'#E2E8F0'),background:sel?'#F5F3FF':'#fff',color:sel?'#5B21B6':'#64748B',cursor:'pointer',transition:'all 0.12s'}}>{p}</button>);})}
                </div>
              </div>
            </div>
            <div style={{padding:'14px 24px',borderTop:'1.5px solid #F0F4F8',display:'flex',justifyContent:'flex-end',background:'#FAFBFE',flexShrink:0,gap:10}}>
              <button className="btn btn-secondary btn-md" onClick={()=>setShowVeh(false)} disabled={saving}>Cancel</button>
              <button className="btn btn-md" onClick={saveV} disabled={saving} style={{background:'linear-gradient(135deg,#5B21B6,#8B5CF6)',color:'#fff',border:'none',display:'flex',alignItems:'center',gap:7,padding:'10px 20px',borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer',minWidth:150}}>
                <Save size={15}/>{saving?'Saving…':editVeh?'Update Vehicle':'Register Vehicle'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ REPORT MODAL ══ */}
      {showRep&&(
        <div className="modal-overlay" onClick={()=>setShowRep(false)} style={{backdropFilter:'blur(8px)',background:'rgba(15,23,42,0.50)'}}>
          <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:22,width:'100%',maxWidth:540,maxHeight:'92vh',display:'flex',flexDirection:'column',boxShadow:'0 24px 64px rgba(15,23,42,0.20)',overflow:'hidden',animation:'slideInUp 0.22s cubic-bezier(0.34,1.15,0.64,1)'}}>
            <div style={{background:'linear-gradient(135deg,#92400E,#F59E0B)',padding:'20px 24px 18px',flexShrink:0,position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',right:-20,top:-20,width:90,height:90,borderRadius:'50%',background:'rgba(255,255,255,0.08)',pointerEvents:'none'}}/>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',position:'relative'}}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <div style={{width:42,height:42,borderRadius:12,background:'rgba(255,255,255,0.18)',display:'flex',alignItems:'center',justifyContent:'center'}}><Flag size={20} color="#fff"/></div>
                  <div>
                    <h2 style={{fontSize:17,fontWeight:800,color:'#fff',margin:0,letterSpacing:'-0.025em'}}>File a Report</h2>
                    <p style={{fontSize:12.5,color:'rgba(255,255,255,0.72)',margin:'2px 0 0'}}>Report a waste management issue in your area</p>
                  </div>
                </div>
                <button onClick={()=>setShowRep(false)} style={{width:30,height:30,borderRadius:8,background:'rgba(255,255,255,0.15)',border:'none',cursor:'pointer',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center'}}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.28)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.15)'}><X size={16}/></button>
              </div>
            </div>
            <div style={{flex:1,overflowY:'auto',padding:'22px 24px',display:'flex',flexDirection:'column',gap:16}}>
              {formErr&&<div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:'#FEF2F2',border:'1.5px solid #FECACA',borderRadius:10,fontSize:13,color:'#DC2626',fontWeight:500}}><AlertCircle size={14}/>{formErr}</div>}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <div className="form-group"><label className="form-label">Report Type</label><select className="form-select" value={repForm.reportType} onChange={e=>setRepForm(p=>({...p,reportType:e.target.value}))}>{REPORT_TYPES.map(t=><option key={t} value={t}>{t.replace(/([A-Z])/g,' $1').trim()}</option>)}</select></div>
                <div>
                  <label className="form-label">Priority</label>
                  <div style={{display:'flex',gap:6,marginTop:4}}>
                    {[{v:'High',bg:'#FEF2F2',color:'#991B1B',border:'#FECACA'},{v:'Normal',bg:'#EFF6FF',color:'#1D4ED8',border:'#BFDBFE'},{v:'Low',bg:'#F1F5F9',color:'#475569',border:'#CBD5E1'}].map(p=>{const a=repForm.priority===p.v;return<button key={p.v} type="button" onClick={()=>setRepForm(f=>({...f,priority:p.v}))} style={{flex:1,padding:'7px 4px',borderRadius:9,border:'2px solid '+(a?p.color:p.border),background:a?p.bg:'#fff',color:a?p.color:'#64748B',fontSize:12,fontWeight:a?700:500,cursor:'pointer',transition:'all 0.12s'}}>{p.v}</button>;})}
                  </div>
                </div>
              </div>
              <div className="form-group"><label className="form-label">Title <span style={{color:'#EF4444'}}>*</span></label><input className="form-input" value={repForm.title} onChange={e=>setRepForm(p=>({...p,title:e.target.value}))} placeholder="Brief title of the issue" style={{fontSize:14,fontWeight:500}}/></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <div className="form-group"><label className="form-label">Sitio/Purok</label><select className="form-select" value={repForm.purok} onChange={e=>setRepForm(p=>({...p,purok:e.target.value}))}>{PUROKS.map(p=><option key={p}>{p}</option>)}</select></div>
                <div className="form-group"><label className="form-label">Specific Location</label><input className="form-input" value={repForm.location} onChange={e=>setRepForm(p=>({...p,location:e.target.value}))} placeholder="Street/landmark"/></div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr auto',gap:10,alignItems:'end'}}>
                <div className="form-group" style={{margin:0}}><label className="form-label">GPS Latitude</label><input className="form-input" value={repForm.gpsLat} onChange={e=>setRepForm(p=>({...p,gpsLat:e.target.value}))} placeholder="Auto-filled"/></div>
                <div className="form-group" style={{margin:0}}><label className="form-label">GPS Longitude</label><input className="form-input" value={repForm.gpsLng} onChange={e=>setRepForm(p=>({...p,gpsLng:e.target.value}))} placeholder="Auto-filled"/></div>
                <button type="button" onClick={captureGPS} disabled={gpsCapturing} style={{padding:'8px 14px',borderRadius:10,border:'1.5px solid #2563EB',background:'#EFF6FF',color:'#1D4ED8',cursor:'pointer',display:'flex',alignItems:'center',gap:6,fontSize:13,fontWeight:600,whiteSpace:'nowrap',height:42}}>
                  {gpsCapturing?<Loader size={14} style={{animation:'spin 0.8s linear infinite'}}/>:<Crosshair size={14}/>}{gpsCapturing?'Getting…':'Get GPS'}
                </button>
              </div>
              <div className="form-group"><label className="form-label">Reporter Name <span style={{fontSize:11.5,color:'#94A3B8',fontWeight:400}}>(optional)</span></label><input className="form-input" value={repForm.reporter} onChange={e=>setRepForm(p=>({...p,reporter:e.target.value}))} placeholder="Your name"/></div>
              <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" rows={3} value={repForm.description} onChange={e=>setRepForm(p=>({...p,description:e.target.value}))} placeholder="Describe the issue in detail..."/></div>
            </div>
            <div style={{padding:'14px 24px',borderTop:'1.5px solid #F0F4F8',display:'flex',justifyContent:'flex-end',background:'#FAFBFE',flexShrink:0,gap:10}}>
              <button className="btn btn-secondary btn-md" onClick={()=>setShowRep(false)} disabled={saving}>Cancel</button>
              <button className="btn btn-md" onClick={saveR} disabled={saving} style={{background:'linear-gradient(135deg,#92400E,#F59E0B)',color:'#fff',border:'none',display:'flex',alignItems:'center',gap:7,padding:'10px 20px',borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer',minWidth:150}}>
                <Save size={15}/>{saving?'Submitting…':'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRoute&&<AIRouteOptimizer vehicles={vehicles} schedules={schedules} onClose={()=>setShowRoute(false)} gpsPoints={gpsPoints} barangayName={barangayName}/>}
    </div>
  );
}