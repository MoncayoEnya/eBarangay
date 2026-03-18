// src/pages/Settings.jsx — e-Barangay Cebu — Full M7 Implementation
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  Building2, Users, Bell, CreditCard, Database, FileText,
  Save, Plus, Edit2, Trash2, X, Loader, CheckCircle,
  AlertCircle, Shield, Phone, MapPin,
  ChevronRight, Lock, Eye, EyeOff, Download, Search,
  ClipboardList, Hash, Calendar, BarChart2, TrendingUp,
  Activity, Heart, Recycle, FileBarChart
} from 'lucide-react';
import {
  getBarangayProfile, saveBarangayProfile,
  getOfficials, saveOfficial, deleteOfficial,
  getAllUsers, updateUserProfile, deactivateUser, activateUser,
  getDocumentFees, saveDocumentFees,
  getNotificationSettings, saveNotificationSettings,
  getAuditLogs, getRBACPermissions, saveRBACPermissions,
  getPaymentConfig, savePaymentConfig,
  getSMSConfig, saveSMSConfig,
} from '../services/settingsService';
import { getResidentStatistics } from '../services/residentsService';
import { getDocumentStatistics } from '../services/documentsService';
import { getIncidentStatistics } from '../services/incidentsService';
import { getHealthStatistics } from '../services/healthService';
import { getWelfareStatistics } from '../services/welfareService';
import { getWasteStats } from '../services/wasteService';
import { useBarangayConfig } from '../hooks/useBarangayConfig';
import { CEBU_BARANGAY_NAMES, getSitios, getGPSPoints } from '../data/cebuBarangays';
import BarangayMap from '../components/map/BarangayMap';
import { db } from '../services/firebase';
import { doc, setDoc, serverTimestamp, collection } from 'firebase/firestore';
import { createUserWithEmailAndPassword, updatePassword, getAuth, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

// ─── constants ────────────────────────────────────────────────────────────────
const ROLES = ['admin','staff','treasurer','kagawad','health_worker'];
const ROLE_LABELS = { admin:'Administrator', staff:'Staff / Secretary', treasurer:'Treasurer', kagawad:'Kagawad', health_worker:'Health Worker' };
const ROLE_COLORS = { admin:'#dc2626', staff:'#3b82f6', treasurer:'#d97706', kagawad:'#7c3aed', health_worker:'#059669' };
const MODULES = [
  { id:'residents',     label:'Residents'       },
  { id:'documents',     label:'Documents'       },
  { id:'incidents',     label:'Incidents'       },
  { id:'announcements', label:'Announcements'   },
  { id:'events',        label:'Events'          },
  { id:'health',        label:'Health Services' },
  { id:'welfare',       label:'Social Welfare'  },
  { id:'waste',         label:'Waste Mgmt'      },
  { id:'finance',       label:'Finance'         },
  { id:'drrm',          label:'DRRM'            },
  { id:'settings',      label:'Settings'        },
];
const AUDIT_ACTIONS = ['All','Login','Logout','Create','Update','Delete','Approve','Deny','Export'];
const AUDIT_MODULES = ['All','Residents','Documents','Incidents','Announcements','Events','Health','Welfare','Finance','DRRM','Settings'];

// ─── helpers ──────────────────────────────────────────────────────────────────
const initials = (name) => (name||'').split(' ').filter(Boolean).map(n=>n[0]).join('').slice(0,2).toUpperCase()||'?';
const avatarBg = (role) => ROLE_COLORS[role]||'#3b82f6';
const fmtTs = (ts) => {
  if (!ts) return '—';
  try {
    const d = ts.toDate ? ts.toDate() : ts.seconds ? new Date(ts.seconds*1000) : new Date(ts);
    return d.toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'})+' '+d.toLocaleTimeString('en-PH',{hour:'2-digit',minute:'2-digit'});
  } catch { return '—'; }
};

// ─── reusable ui ─────────────────────────────────────────────────────────────
const Toast = ({msg,type,onClose}) => {
  useEffect(()=>{const t=setTimeout(onClose,3500);return()=>clearTimeout(t);},[]);
  return (
    <div style={{position:'fixed',bottom:24,right:24,zIndex:9999,display:'flex',alignItems:'center',gap:10,padding:'12px 20px',background:type==='error'?'#fef2f2':'#f0fdf4',border:`1px solid ${type==='error'?'#fecaca':'#bbf7d0'}`,borderRadius:12,boxShadow:'0 8px 24px rgba(0,0,0,.1)',fontSize:14,fontWeight:500,color:type==='error'?'#dc2626':'#166534',maxWidth:360}}>
      {type==='error'?<AlertCircle size={16}/>:<CheckCircle size={16}/>}
      <span style={{flex:1}}>{msg}</span>
      <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'inherit'}}><X size={14}/></button>
    </div>
  );
};

const Card = ({title,subtitle,action,children,noPad}) => (
  <div style={{background:'#fff',border:'1px solid #f1f5f9',borderRadius:16,marginBottom:18,overflow:'hidden'}}>
    {(title||action)&&(
      <div style={{padding:'16px 22px',borderBottom:'1px solid #f1f5f9',display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
        <div>
          <h3 style={{fontSize:15,fontWeight:700,color:'#0f172a',margin:'0 0 2px'}}>{title}</h3>
          {subtitle&&<p style={{fontSize:13,color:'#64748b',margin:0}}>{subtitle}</p>}
        </div>
        {action}
      </div>
    )}
    <div style={noPad?{}:{padding:'18px 22px'}}>{children}</div>
  </div>
);

const FG = ({label,required,hint,children}) => (
  <div className="form-group">
    <label className="form-label">{label}{required&&<span style={{color:'#ef4444'}}> *</span>}</label>
    {children}
    {hint&&<p style={{fontSize:12,color:'#94a3b8',margin:'3px 0 0'}}>{hint}</p>}
  </div>
);

const G2 = ({children,gap=14}) => <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap}}>{children}</div>;

const Toggle = ({checked,onChange}) => (
  <div onClick={onChange} style={{width:44,height:24,borderRadius:999,background:checked?'#3b82f6':'#e2e8f0',cursor:'pointer',position:'relative',transition:'background .2s',flexShrink:0}}>
    <div style={{position:'absolute',width:18,height:18,borderRadius:'50%',background:'#fff',top:3,left:checked?23:3,transition:'left .2s',boxShadow:'0 1px 3px rgba(0,0,0,.2)'}}/>
  </div>
);

const Modal = ({title,onClose,children,maxWidth=480}) => (
  <>
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(15,23,42,.3)',zIndex:1000}}/>
    <div style={{position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',zIndex:1001,width:'100%',maxWidth,maxHeight:'90vh',background:'#fff',borderRadius:18,boxShadow:'0 24px 64px rgba(0,0,0,.18)',display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <div style={{padding:'18px 24px',borderBottom:'1px solid #f1f5f9',display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0}}>
        <h3 style={{fontSize:16,fontWeight:700,margin:0,color:'#0f172a'}}>{title}</h3>
        <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'#64748b'}}><X size={20}/></button>
      </div>
      <div style={{overflowY:'auto',padding:'20px 24px',flex:1}}>{children}</div>
    </div>
  </>
);

const Btn = ({children,variant='primary',size='md',disabled,onClick,style={}}) => (
  <button onClick={onClick} disabled={disabled}
    className={`btn btn-${variant} btn-${size}`} style={style}>
    {children}
  </button>
);

// ─── main component ───────────────────────────────────────────────────────────
export default function Settings() {
  const { currentUser } = useAuth();
  const { barangayName: activeBrgy, selectBarangay, sitios: activeSitios, gpsPoints, config, center: brgyCenter } = useBarangayConfig();
  const [tab, setTab]     = useState('profile');
  const [toast, setToast] = useState(null);
  const showToast = (msg, type='success') => setToast({msg,type});

  // profile
  const [profile, setProfile]   = useState({barangayName:'',municipality:'Cebu City',province:'Cebu',region:'Region VII - Central Visayas',address:'',contactNumber:'',email:'',zipCode:'6000',website:'',tagline:'Serbisyo para sa Bayan'});
  const [captainName, setCaptain] = useState('');
  const [officials, setOfficials] = useState([]);
  const [profLoad, setProfLoad]   = useState(false);
  const [offLoad, setOffLoad]     = useState(false);
  const [showOffModal, setShowOffModal] = useState(false);
  const [editOff, setEditOff]     = useState(null);
  const [offForm, setOffForm]     = useState({name:'',position:'',contactNumber:'',order:0});
  const logoRef = useRef();
  const [logoPreview, setLogoPreview] = useState(null);

  // users
  const [users, setUsers]       = useState([]);
  const [usersLoad, setUsersLoad] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [uForm, setUForm]       = useState({name:'',email:'',role:'staff',phone:''});
  const [uPw, setUPw]           = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [uSaving, setUSaving]   = useState(false);
  const [uErr, setUErr]         = useState('');

  // change password
  const [showPwModal, setShowPwModal] = useState(false);
  const [pwForm, setPwForm]     = useState({current:'',next:'',confirm:''});
  const [pwErr, setPwErr]       = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [showCurPw, setShowCurPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  // rbac
  const [perms, setPerms]       = useState({});
  const [permsSaving, setPermsSaving] = useState(false);

  // audit logs
  const [logs, setLogs]         = useState([]);
  const [logsLoad, setLogsLoad] = useState(false);
  const [logFilter, setLogFilter] = useState({action:'All',module:'All',search:''});

  // notifications
  const [notif, setNotif]       = useState({emailOnNewDocument:true,emailOnNewIncident:true,emailOnAlert:true,smsOnAlert:false,smsOnDocument:false,reminderDays:3});
  const [notifSaving, setNotifSaving] = useState(false);

  // fees
  const [fees, setFees]         = useState([]);
  const [feesLoad, setFeesLoad] = useState(false);
  const [feesSaving, setFeesSaving] = useState(false);

  // payment
  const [payment, setPayment]   = useState({provider:'paymongo',publicKey:'',secretKey:'',gcashEnabled:false,cardEnabled:false,testMode:true});
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  // sms
  const [sms, setSms]           = useState({provider:'semaphore',apiKey:'',senderName:'EBARANGAY',enabled:false,templates:{alert:'EMERGENCY ALERT: {message}',document:'Your {docType} is ready for pickup. Ref: {refNo}',event:'Reminder: {eventName} on {date} at {location}'}});
  const [smsSaving, setSmsSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // analytics
  const [kpi, setKpi]           = useState(null);
  const [kpiLoad, setKpiLoad]   = useState(false);

  // reports
  const [rptModule, setRptModule] = useState('residents');
  const [rptFrom,   setRptFrom]   = useState('');
  const [rptTo,     setRptTo]     = useState('');
  const [rptData,   setRptData]   = useState(null);
  const [rptLoad,   setRptLoad]   = useState(false);

  // ── load on tab ──
  useEffect(() => {
    if (tab==='profile')       { loadProfile(); loadOfficials(); }
    if (tab==='users')         { loadUsers(); loadRBAC(); }
    if (tab==='audit')         loadLogs();
    if (tab==='notifications') { loadNotif(); loadSMS(); }
    if (tab==='services')      loadFees();
    if (tab==='payment')       loadPayment();
    if (tab==='analytics')     loadKPI();
  }, [tab]);

  const loadProfile   = async () => { const r=await getBarangayProfile(); if(r.success&&r.data){setProfile(p=>({...p,...r.data}));if(r.data.captainName)setCaptain(r.data.captainName);if(r.data.logoUrl)setLogoPreview(r.data.logoUrl);} };
  const loadOfficials = async () => { const r=await getOfficials(); if(r.success)setOfficials(r.data||[]); };
  const loadUsers     = async () => { setUsersLoad(true); const r=await getAllUsers(); if(r.success)setUsers(r.data||[]); setUsersLoad(false); };
  const loadRBAC      = async () => { const r=await getRBACPermissions(); if(r.success&&r.data)setPerms(r.data); };
  const loadLogs      = async () => { setLogsLoad(true); const r=await getAuditLogs(200); if(r.success)setLogs(r.data||[]); setLogsLoad(false); };
  const loadNotif     = async () => { const r=await getNotificationSettings(); if(r.success&&r.data)setNotif(r.data); };
  const loadFees      = async () => { setFeesLoad(true); const r=await getDocumentFees(); if(r.success)setFees(r.data||[]); setFeesLoad(false); };
  const loadPayment   = async () => { const r=await getPaymentConfig(); if(r.success&&r.data)setPayment(r.data); };
  const loadSMS       = async () => { const r=await getSMSConfig(); if(r.success&&r.data)setSms(r.data); };
  const loadKPI = async () => {
    setKpiLoad(true);
    try {
      const [res, docs, inc, health, welfare, waste] = await Promise.all([
        getResidentStatistics(), getDocumentStatistics(), getIncidentStatistics(),
        getHealthStatistics(), getWelfareStatistics(), getWasteStats(),
      ]);
      setKpi({
        residents: res.success ? res.data : null,
        documents: docs.success ? docs.data : null,
        incidents: inc.success ? inc.data : null,
        health:    health.success ? health.data : null,
        welfare:   welfare.success ? welfare.data : null,
        waste:     waste.success ? waste.data : null,
      });
    } catch(_) {}
    setKpiLoad(false);
  };

  // ── save handlers ──
  const saveProfile = async () => {
    setProfLoad(true);
    const r = await saveBarangayProfile({...profile, captainName, logoUrl: logoPreview||''});
    setProfLoad(false);
    if(r.success) showToast('Barangay profile saved successfully');
    else showToast(r.error||'Failed to save','error');
  };

  const saveNotif = async () => {
    setNotifSaving(true);
    const r = await saveNotificationSettings(notif);
    setNotifSaving(false);
    if(r.success) showToast('Notification settings saved');
    else showToast(r.error||'Failed','error');
  };

  const saveFees = async () => {
    setFeesSaving(true);
    const r = await saveDocumentFees(fees);
    setFeesSaving(false);
    if(r.success) showToast('Document fees updated');
    else showToast(r.error||'Failed','error');
  };

  const savePayment = async () => {
    setPaymentSaving(true);
    const r = await savePaymentConfig(payment);
    setPaymentSaving(false);
    if(r.success) showToast('Payment gateway settings saved');
    else showToast(r.error||'Failed','error');
  };

  const saveSMSSettings = async () => {
    setSmsSaving(true);
    const r = await saveSMSConfig(sms);
    setSmsSaving(false);
    if(r.success) showToast('SMS gateway settings saved');
    else showToast(r.error||'Failed','error');
  };

  const saveRBAC = async () => {
    setPermsSaving(true);
    const r = await saveRBACPermissions(perms);
    setPermsSaving(false);
    if(r.success) showToast('Permissions saved');
    else showToast(r.error||'Failed','error');
  };

  // ── officials ──
  const openAddOff  = () => { setOffForm({name:'',position:'',contactNumber:'',order:officials.length}); setEditOff(null); setShowOffModal(true); };
  const openEditOff = (o) => { setOffForm({name:o.name||'',position:o.position||'',contactNumber:o.contactNumber||'',order:o.order||0}); setEditOff(o); setShowOffModal(true); };
  const saveOff = async () => {
    if(!offForm.name.trim()||!offForm.position.trim()) return;
    setOffLoad(true);
    const r = await saveOfficial(editOff?{...offForm,id:editOff.id}:offForm);
    setOffLoad(false);
    if(r.success){setShowOffModal(false);loadOfficials();showToast('Official saved');}
    else showToast(r.error||'Failed','error');
  };
  const delOff = async (id) => {
    if(!window.confirm('Remove this official?')) return;
    const r = await deleteOfficial(id);
    if(r.success){loadOfficials();showToast('Official removed');}
    else showToast(r.error||'Failed','error');
  };

  // ── users ──
  const openAddUser  = () => { setUForm({name:'',email:'',role:'staff',phone:''}); setUPw(''); setEditUser(null); setUErr(''); setShowUserModal(true); };
  const openEditUser = (u) => { setUForm({name:u.name||'',email:u.email||'',role:u.role||'staff',phone:u.phone||''}); setEditUser(u); setUErr(''); setShowUserModal(true); };
  const saveUser = async () => {
    if(!uForm.name.trim()||!uForm.email.trim()){setUErr('Name and email required.');return;}
    setUSaving(true); setUErr('');
    try {
      if(editUser) {
        const r = await updateUserProfile(editUser.id,{name:uForm.name,role:uForm.role,phone:uForm.phone});
        if(r.success){setShowUserModal(false);loadUsers();showToast('User updated');}
        else setUErr(r.error||'Failed');
      } else {
        if(!uPw||uPw.length<6){setUErr('Password must be at least 6 characters.');setUSaving(false);return;}
        const authInst = getAuth();
        const cred = await createUserWithEmailAndPassword(authInst,uForm.email,uPw);
        await setDoc(doc(db,'users',cred.user.uid),{name:uForm.name,email:uForm.email,role:uForm.role,phone:uForm.phone,isActive:true,assignedModules:[],createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
        setShowUserModal(false);loadUsers();showToast('User account created successfully');
      }
    } catch(err) {
      const map={'auth/email-already-in-use':'Email already registered.','auth/invalid-email':'Invalid email.','auth/weak-password':'Password too weak.'};
      setUErr(map[err.code]||err.message);
    }
    setUSaving(false);
  };
  const toggleUser = async (u) => {
    const r = u.isActive===false ? await activateUser(u.id) : await deactivateUser(u.id);
    if(r.success){loadUsers();showToast(u.isActive===false?'User activated':'User deactivated');}
    else showToast(r.error||'Failed','error');
  };

  // ── change password ──
  const handleChangePassword = async () => {
    if(!pwForm.current){setPwErr('Enter your current password.');return;}
    if(pwForm.next.length<6){setPwErr('New password must be at least 6 characters.');return;}
    if(pwForm.next!==pwForm.confirm){setPwErr('New passwords do not match.');return;}
    setPwSaving(true); setPwErr('');
    try {
      const authInst = getAuth();
      const user = authInst.currentUser;
      const credential = EmailAuthProvider.credential(user.email, pwForm.current);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, pwForm.next);
      setShowPwModal(false);
      setPwForm({current:'',next:'',confirm:''});
      showToast('Password changed successfully');
    } catch(err) {
      const map={'auth/wrong-password':'Incorrect current password.','auth/too-many-requests':'Too many attempts. Try later.'};
      setPwErr(map[err.code]||err.message);
    }
    setPwSaving(false);
  };

  // ── logo upload ──
  const handleLogo = (e) => {
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  // ── audit filter ──
  const filteredLogs = logs.filter(l => {
    const matchAction = logFilter.action==='All'||l.action===logFilter.action;
    const matchModule = logFilter.module==='All'||(l.module||'').toLowerCase().includes(logFilter.module.toLowerCase());
    const matchSearch = !logFilter.search||(l.userName||'').toLowerCase().includes(logFilter.search.toLowerCase())||(l.details||'').toLowerCase().includes(logFilter.search.toLowerCase());
    return matchAction&&matchModule&&matchSearch;
  });

  const TABS = [
    {id:'profile',       label:'Barangay Profile',  icon:Building2   },
    {id:'users',         label:'User Management',   icon:Users       },
    {id:'audit',         label:'Audit Logs',        icon:ClipboardList},
    {id:'notifications', label:'Notifications',     icon:Bell        },
    {id:'services',      label:'Services & Fees',   icon:FileText    },
    {id:'payment',       label:'Payment Gateway',   icon:CreditCard  },
    {id:'analytics',     label:'KPI Dashboard',     icon:BarChart2   },
    {id:'reports',       label:'Reports',           icon:FileBarChart },
    {id:'backup',        label:'Backup & Security', icon:Database    },
  ];

  // ─── render ───────────────────────────────────────────────────────────────
  return (
    <div className="page-container">
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Settings & Administration</h1>
          <p className="page-subtitle">e-Barangay Cebu — System configuration and management</p>
        </div>
        <button className="btn btn-secondary btn-md" onClick={()=>setShowPwModal(true)}>
          <Lock size={16}/>Change Password
        </button>
      </div>

      <div style={{display:'flex',gap:20,alignItems:'flex-start',flexWrap:'wrap'}}>

        {/* Side nav */}
        <div style={{width:220,flexShrink:0}}>
          <div style={{background:'#fff',border:'1px solid #f1f5f9',borderRadius:14,overflow:'hidden',marginBottom:12}}>
            {TABS.map(t=>{
              const Icon=t.icon;const active=tab===t.id;
              return(
                <button key={t.id} onClick={()=>setTab(t.id)} style={{display:'flex',alignItems:'center',gap:10,width:'100%',padding:'11px 16px',background:active?'#eff6ff':'none',border:'none',borderLeft:active?'3px solid #3b82f6':'3px solid transparent',cursor:'pointer',fontSize:13,fontWeight:active?600:500,color:active?'#1d4ed8':'#4a5568',transition:'all .15s',textAlign:'left'}}>
                  <Icon size={15} style={{color:active?'#2563eb':'#94a3b8',flexShrink:0}}/>{t.label}
                  {active&&<ChevronRight size={13} style={{marginLeft:'auto',color:'#3b82f6'}}/>}
                </button>
              );
            })}
          </div>

          {currentUser&&(
            <div style={{background:'#fff',border:'1px solid #f1f5f9',borderRadius:14,padding:'14px 16px'}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
                <div style={{width:38,height:38,borderRadius:11,background:avatarBg(currentUser.profile?.role),color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,flexShrink:0}}>
                  {initials(currentUser.profile?.name||currentUser.email||'')}
                </div>
                <div style={{minWidth:0}}>
                  <p style={{fontSize:13,fontWeight:600,color:'#0f172a',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{currentUser.profile?.name||'User'}</p>
                  <p style={{fontSize:11,color:'#94a3b8',margin:0}}>{ROLE_LABELS[currentUser.profile?.role]||'Staff'}</p>
                </div>
              </div>
              <p style={{fontSize:11,color:'#94a3b8',margin:0,overflow:'hidden',textOverflow:'ellipsis'}}>{currentUser.email}</p>
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{flex:1,minWidth:0}}>

          {/* ══ PROFILE ══ */}
          {tab==='profile'&&(
            <>
              {/* ── ACTIVE BARANGAY SELECTOR ── */}
              <Card title="Active Barangay" subtitle="Select which Cebu City barangay this system manages — this controls all location dropdowns, GPS routes, and sitio names across every module">
                <div style={{display:'grid',gridTemplateColumns:'1fr auto',gap:14,alignItems:'end',marginBottom:activeBrgy ? 16 : 0}}>
                  <FG label="Select Barangay" required>
                    <select className="form-select" value={profile.barangayName||activeBrgy||''} onChange={e=>{
                      setProfile(p=>({...p,barangayName:e.target.value}));
                      selectBarangay(e.target.value);
                    }}>
                      <option value="">-- Choose a Barangay --</option>
                      {CEBU_BARANGAY_NAMES.map(b=><option key={b} value={b}>{b}, Cebu City</option>)}
                    </select>
                  </FG>
                  <div style={{paddingBottom:2}}>
                    {activeBrgy ? (
                      <div style={{padding:'10px 14px',background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:10,fontSize:13,fontWeight:600,color:'#166534',whiteSpace:'nowrap'}}>
                        <CheckCircle size={14} style={{display:'inline',marginRight:6,verticalAlign:'middle'}}/>
                        Active: Brgy. {activeBrgy}
                      </div>
                    ) : (
                      <div style={{padding:'10px 14px',background:'#fffbeb',border:'1px solid #fde68a',borderRadius:10,fontSize:13,color:'#92400e'}}>
                        No barangay selected
                      </div>
                    )}
                  </div>
                </div>

                {activeBrgy && getSitios(activeBrgy).length > 0 && (
                  <div style={{background:'#f8fafc',borderRadius:10,padding:'14px 16px',border:'1px solid #f1f5f9'}}>
                    <p style={{fontSize:12,fontWeight:600,color:'#374151',marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>
                      Sitios / Zones in Brgy. {activeBrgy}
                    </p>
                    <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                      {getSitios(activeBrgy).map(s=>(
                        <span key={s} style={{fontSize:12,padding:'4px 10px',borderRadius:20,background:'#dbeafe',color:'#1e40af',fontWeight:500}}>{s}</span>
                      ))}
                    </div>
                    <p style={{fontSize:11,color:'#94a3b8',marginTop:10}}>
                      These sitio names will appear in resident address forms, waste management routes, DRRM vulnerability mapping, incident reports, and all location dropdowns across the system.
                    </p>
                  </div>
                )}

                {activeBrgy && gpsPoints.length > 0 && (
                  <div style={{marginTop:14}}>
                    <p style={{fontSize:12,fontWeight:600,color:'#374151',marginBottom:8,textTransform:'uppercase',letterSpacing:'0.05em'}}>
                      Live Map — Brgy. {activeBrgy}, Cebu City
                    </p>
                    <BarangayMap
                      barangayName={activeBrgy}
                      points={gpsPoints}
                      center={brgyCenter || {lat:10.3157,lng:123.8910}}
                      mode="view"
                      height={380}
                    />
                    <p style={{fontSize:11,color:'#94a3b8',marginTop:8}}>
                      Click any pin to see details. These GPS coordinates power the route maps in Waste Management and evacuation planning in DRRM.
                    </p>
                  </div>
                )}
              </Card>

              <Card title="e-Barangay Identity" subtitle="Branding and basic barangay information for Cebu"
                action={<Btn onClick={saveProfile} disabled={profLoad} size="sm">{profLoad?<><Loader size={14} className="animate-spin"/>Saving...</>:<><Save size={14}/>Save Profile</>}</Btn>}>
                {/* Logo */}
                <div style={{display:'flex',alignItems:'flex-start',gap:20,marginBottom:20,padding:'16px 18px',background:'#f8fafc',borderRadius:12,border:'1px solid #f1f5f9'}}>
                  <div style={{width:80,height:80,borderRadius:14,overflow:'hidden',border:'2px solid #e2e8f0',background:'#eff6ff',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    {logoPreview ? <img src={logoPreview} alt="Logo" style={{width:'100%',height:'100%',objectFit:'cover'}}/> : <Building2 size={32} color="#94a3b8"/>}
                  </div>
                  <div>
                    <p style={{fontSize:14,fontWeight:600,color:'#0f172a',margin:'0 0 4px'}}>Barangay Logo</p>
                    <p style={{fontSize:12,color:'#64748b',margin:'0 0 10px'}}>Appears on printed documents and certificates. JPG or PNG, max 2MB.</p>
                    <input type="file" accept="image/*" ref={logoRef} onChange={handleLogo} style={{display:'none'}}/>
                    <div style={{display:'flex',gap:8}}>
                      <button className="btn btn-secondary btn-sm" onClick={()=>logoRef.current.click()}>Upload Logo</button>
                      {logoPreview&&<button className="btn btn-secondary btn-sm" style={{color:'#ef4444'}} onClick={()=>setLogoPreview(null)}>Remove</button>}
                    </div>
                  </div>
                </div>

                <G2>
                  <FG label="Barangay Name" required><input className="form-input" value={profile.barangayName} onChange={e=>setProfile(p=>({...p,barangayName:e.target.value}))} placeholder="e.g. Barangay Lahug"/></FG>
                  <FG label="City / Municipality" required><input className="form-input" value={profile.municipality} onChange={e=>setProfile(p=>({...p,municipality:e.target.value}))} placeholder="Cebu City"/></FG>
                  <FG label="Province"><input className="form-input" value={profile.province} onChange={e=>setProfile(p=>({...p,province:e.target.value}))} placeholder="Cebu"/></FG>
                  <FG label="Region"><input className="form-input" value={profile.region} onChange={e=>setProfile(p=>({...p,region:e.target.value}))} placeholder="Region VII - Central Visayas"/></FG>
                  <FG label="ZIP Code"><input className="form-input" value={profile.zipCode} onChange={e=>setProfile(p=>({...p,zipCode:e.target.value}))} placeholder="6000"/></FG>
                  <FG label="Contact Number"><input className="form-input" value={profile.contactNumber} onChange={e=>setProfile(p=>({...p,contactNumber:e.target.value}))} placeholder="(032) 123-4567"/></FG>
                </G2>
                <FG label="Complete Address"><input className="form-input" value={profile.address} onChange={e=>setProfile(p=>({...p,address:e.target.value}))} placeholder="Barangay Hall address, street, city"/></FG>
                <G2>
                  <FG label="Official Email"><input type="email" className="form-input" value={profile.email} onChange={e=>setProfile(p=>({...p,email:e.target.value}))} placeholder="barangay@cebucity.gov.ph"/></FG>
                  <FG label="Website (optional)"><input className="form-input" value={profile.website} onChange={e=>setProfile(p=>({...p,website:e.target.value}))} placeholder="https://ebarangay.cebu.ph"/></FG>
                </G2>
                <FG label="Tagline / Motto" hint="Displayed on the login page and printed documents"><input className="form-input" value={profile.tagline} onChange={e=>setProfile(p=>({...p,tagline:e.target.value}))} placeholder="Serbisyo para sa Bayan"/></FG>
              </Card>

              <Card title="Barangay Officials" subtitle="Captain and council members — printed on all official documents"
                action={<button className="btn btn-secondary btn-sm" onClick={openAddOff}><Plus size={14}/>Add Official</button>}>
                <FG label="Punong Barangay (Captain)" required>
                  <input className="form-input" value={captainName} onChange={e=>setCaptain(e.target.value)} placeholder="Hon. Juan Dela Cruz"/>
                </FG>
                <p style={{fontSize:12,color:'#94a3b8',marginTop:4,marginBottom:16}}>This name appears on all official barangay certificates and clearances.</p>
                {officials.length>0?(
                  <div style={{display:'flex',flexDirection:'column',gap:8}}>
                    {[...officials].sort((a,b)=>(a.order||0)-(b.order||0)).map(o=>(
                      <div key={o.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',background:'#f8fafc',borderRadius:10,border:'1px solid #f1f5f9'}}>
                        <div style={{width:36,height:36,borderRadius:10,background:'linear-gradient(135deg,#3b82f6,#6366f1)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,flexShrink:0}}>{initials(o.name)}</div>
                        <div style={{flex:1,minWidth:0}}>
                          <p style={{fontSize:14,fontWeight:600,color:'#0f172a',margin:0}}>{o.name}</p>
                          <p style={{fontSize:12,color:'#64748b',margin:0}}>{o.position}{o.contactNumber?' · '+o.contactNumber:''}</p>
                        </div>
                        <button className="btn-icon btn-icon-sm" onClick={()=>openEditOff(o)}><Edit2 size={14}/></button>
                        <button className="btn-icon btn-icon-sm" style={{color:'#ef4444'}} onClick={()=>delOff(o.id)}><Trash2 size={14}/></button>
                      </div>
                    ))}
                  </div>
                ):(
                  <p style={{fontSize:13,color:'#94a3b8',textAlign:'center',padding:'12px 0'}}>No additional officials added. Click "Add Official" to add kagawads and SK officials.</p>
                )}
              </Card>
            </>
          )}

          {/* ══ USERS ══ */}
          {tab==='users'&&(
            <>
              <Card title="System Users" subtitle="Manage staff accounts for e-Barangay"
                action={<Btn onClick={openAddUser} size="sm"><Plus size={14}/>Add User</Btn>}>
                <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16}}>
                  {Object.entries(ROLE_LABELS).map(([r,l])=>(
                    <span key={r} style={{fontSize:11,fontWeight:600,padding:'3px 10px',borderRadius:999,background:ROLE_COLORS[r]+'18',color:ROLE_COLORS[r],border:`1px solid ${ROLE_COLORS[r]}30`}}>{l}</span>
                  ))}
                </div>
                {usersLoad?<div style={{textAlign:'center',padding:24}}><Loader size={24} className="animate-spin" style={{color:'#3b82f6'}}/></div>
                :users.length===0?<p style={{textAlign:'center',color:'#94a3b8',fontSize:13,padding:'20px 0'}}>No users found.</p>
                :<div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {users.map(u=>{
                    const rc=ROLE_COLORS[u.role]||'#3b82f6';
                    return(
                      <div key={u.id} style={{display:'flex',alignItems:'center',gap:14,padding:'13px 18px',background:'#fff',border:'1px solid #f1f5f9',borderRadius:12,opacity:u.isActive===false?.55:1}}>
                        <div style={{width:42,height:42,borderRadius:12,background:avatarBg(u.role),color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,flexShrink:0}}>{initials(u.name)}</div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:2,flexWrap:'wrap'}}>
                            <span style={{fontSize:14,fontWeight:600,color:'#0f172a'}}>{u.name||'Unnamed'}</span>
                            <span style={{fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:999,background:rc+'18',color:rc}}>{ROLE_LABELS[u.role]||u.role}</span>
                            {u.isActive===false&&<span style={{fontSize:11,padding:'2px 8px',borderRadius:999,background:'#f3f4f6',color:'#6b7280',fontWeight:600}}>Inactive</span>}
                          </div>
                          <p style={{fontSize:12,color:'#64748b',margin:0}}>{u.email}{u.phone?' · '+u.phone:''}</p>
                        </div>
                        <div style={{display:'flex',gap:6,flexShrink:0}}>
                          <button className="btn btn-secondary btn-sm" onClick={()=>openEditUser(u)}><Edit2 size={13}/>Edit</button>
                          <button className="btn btn-secondary btn-sm" style={{color:u.isActive===false?'#059669':'#dc2626'}} onClick={()=>toggleUser(u)}>
                            {u.isActive===false?'Activate':'Deactivate'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>}
              </Card>

              {/* RBAC */}
              <Card title="Role-Based Access Control (RBAC)" subtitle="Define which modules each role can access"
                action={<Btn onClick={saveRBAC} disabled={permsSaving} size="sm">{permsSaving?<><Loader size={14} className="animate-spin"/>Saving...</>:<><Save size={14}/>Save Permissions</>}</Btn>}>
                <div style={{overflowX:'auto'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                    <thead>
                      <tr>
                        <th style={{padding:'8px 12px',textAlign:'left',background:'#f8fafc',borderBottom:'1px solid #f1f5f9',fontWeight:600,color:'#374151',minWidth:130}}>Module</th>
                        {ROLES.map(r=>(
                          <th key={r} style={{padding:'8px 10px',textAlign:'center',background:'#f8fafc',borderBottom:'1px solid #f1f5f9',fontWeight:600,color:ROLE_COLORS[r],minWidth:90,fontSize:11}}>
                            {ROLE_LABELS[r].split(' ')[0]}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {MODULES.map((m,i)=>(
                        <tr key={m.id} style={{background:i%2===0?'#fff':'#fafbfc'}}>
                          <td style={{padding:'9px 12px',fontWeight:500,color:'#374151',borderBottom:'1px solid #f8fafc'}}>{m.label}</td>
                          {ROLES.map(r=>{
                            const checked = perms[r]?.[m.id]===true;
                            const isAdminSettings = r==='admin'&&m.id==='settings';
                            return(
                              <td key={r} style={{padding:'9px 10px',textAlign:'center',borderBottom:'1px solid #f8fafc'}}>
                                {isAdminSettings?(
                                  <CheckCircle size={16} color="#10b981" style={{margin:'0 auto',display:'block'}} title="Always enabled for Admin"/>
                                ):(
                                  <Toggle checked={checked} onChange={()=>{
                                    setPerms(p=>({...p,[r]:{...(p[r]||{}),[m.id]:!checked}}));
                                  }}/>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p style={{fontSize:12,color:'#94a3b8',marginTop:12}}>Note: Admin always has full access. Changes take effect on the user's next login.</p>
              </Card>
            </>
          )}

          {/* ══ AUDIT LOGS ══ */}
          {tab==='audit'&&(
            <Card title="Audit Logs" subtitle="Track all user activities within e-Barangay"
              action={<button className="btn btn-secondary btn-sm" onClick={loadLogs}><Download size={14}/>Refresh</button>}>
              {/* Filters */}
              <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap'}}>
                <div style={{position:'relative',flex:1,minWidth:200}}>
                  <Search size={14} style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',color:'#94a3b8'}}/>
                  <input className="form-input" style={{paddingLeft:34}} placeholder="Search by user or details..." value={logFilter.search} onChange={e=>setLogFilter(p=>({...p,search:e.target.value}))}/>
                </div>
                <select className="form-select" style={{width:130}} value={logFilter.action} onChange={e=>setLogFilter(p=>({...p,action:e.target.value}))}>
                  {AUDIT_ACTIONS.map(a=><option key={a} value={a}>{a}</option>)}
                </select>
                <select className="form-select" style={{width:140}} value={logFilter.module} onChange={e=>setLogFilter(p=>({...p,module:e.target.value}))}>
                  {AUDIT_MODULES.map(m=><option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              {logsLoad?<div style={{textAlign:'center',padding:24}}><Loader size={24} className="animate-spin" style={{color:'#3b82f6'}}/></div>
              :filteredLogs.length===0?(
                <div style={{textAlign:'center',padding:'32px 0'}}>
                  <ClipboardList size={36} style={{color:'#cbd5e1',display:'block',margin:'0 auto 10px'}}/>
                  <p style={{fontSize:13,color:'#94a3b8'}}>{logs.length===0?'No audit logs yet. Actions will appear here as users interact with the system.':'No logs match your filter.'}</p>
                </div>
              ):(
                <div style={{maxHeight:480,overflowY:'auto'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                    <thead style={{position:'sticky',top:0,background:'#f8fafc',zIndex:1}}>
                      <tr>
                        <th style={{padding:'8px 12px',textAlign:'left',fontWeight:600,color:'#374151',borderBottom:'1px solid #f1f5f9'}}>Timestamp</th>
                        <th style={{padding:'8px 12px',textAlign:'left',fontWeight:600,color:'#374151',borderBottom:'1px solid #f1f5f9'}}>User</th>
                        <th style={{padding:'8px 12px',textAlign:'left',fontWeight:600,color:'#374151',borderBottom:'1px solid #f1f5f9'}}>Action</th>
                        <th style={{padding:'8px 12px',textAlign:'left',fontWeight:600,color:'#374151',borderBottom:'1px solid #f1f5f9'}}>Module</th>
                        <th style={{padding:'8px 12px',textAlign:'left',fontWeight:600,color:'#374151',borderBottom:'1px solid #f1f5f9'}}>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs.map((l,i)=>{
                        const actionColors={Login:'#059669',Logout:'#64748b',Create:'#3b82f6',Update:'#d97706',Delete:'#dc2626',Approve:'#059669',Deny:'#dc2626',Export:'#7c3aed'};
                        const ac=actionColors[l.action]||'#64748b';
                        return(
                          <tr key={l.id||i} style={{borderBottom:'1px solid #f8fafc',background:i%2===0?'#fff':'#fafbfc'}}>
                            <td style={{padding:'8px 12px',color:'#64748b',whiteSpace:'nowrap',fontSize:12}}>{fmtTs(l.timestamp)}</td>
                            <td style={{padding:'8px 12px',fontWeight:500,color:'#0f172a'}}>{l.userName||'System'}</td>
                            <td style={{padding:'8px 12px'}}><span style={{fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:999,background:ac+'18',color:ac}}>{l.action||'—'}</span></td>
                            <td style={{padding:'8px 12px',color:'#64748b'}}>{l.module||'—'}</td>
                            <td style={{padding:'8px 12px',color:'#64748b',maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l.details||'—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              <p style={{fontSize:12,color:'#94a3b8',marginTop:10,textAlign:'right'}}>{filteredLogs.length} of {logs.length} entries shown</p>
            </Card>
          )}

          {/* ══ NOTIFICATIONS ══ */}
          {tab==='notifications'&&(
            <>
              <Card title="Email Notifications" subtitle="Configure when to send email alerts to administrators"
                action={<Btn onClick={saveNotif} disabled={notifSaving} size="sm">{notifSaving?<><Loader size={14} className="animate-spin"/>Saving...</>:<><Save size={14}/>Save</>}</Btn>}>
                {[
                  {key:'emailOnNewDocument',label:'New document request',desc:'When a resident submits a document request'},
                  {key:'emailOnNewIncident',label:'New incident / blotter',desc:'When a new incident report is created'},
                  {key:'emailOnAlert',label:'Emergency alert sent',desc:'When an emergency DRRM alert is broadcast'},
                ].map(item=>(
                  <div key={item.key} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0',borderBottom:'1px solid #f8fafc'}}>
                    <div>
                      <p style={{fontSize:14,fontWeight:500,color:'#0f172a',margin:0}}>{item.label}</p>
                      <p style={{fontSize:12,color:'#94a3b8',margin:'2px 0 0'}}>{item.desc}</p>
                    </div>
                    <Toggle checked={notif[item.key]||false} onChange={()=>setNotif(p=>({...p,[item.key]:!p[item.key]}))}/>
                  </div>
                ))}

                <p style={{fontSize:13,fontWeight:600,color:'#374151',margin:'18px 0 10px',paddingBottom:8,borderBottom:'1px solid #f1f5f9'}}>SMS Notification Triggers</p>
                {[
                  {key:'smsOnAlert',    label:'SMS on Emergency Alert',  desc:'Send SMS to residents when DRRM alert is broadcast'},
                  {key:'smsOnDocument', label:'SMS on Document Ready',   desc:'Send SMS when a requested document is ready for pickup'},
                ].map(item=>(
                  <div key={item.key} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0',borderBottom:'1px solid #f8fafc'}}>
                    <div>
                      <p style={{fontSize:14,fontWeight:500,color:'#0f172a',margin:0}}>{item.label}</p>
                      <p style={{fontSize:12,color:'#94a3b8',margin:'2px 0 0'}}>{item.desc}</p>
                    </div>
                    <Toggle checked={notif[item.key]||false} onChange={()=>setNotif(p=>({...p,[item.key]:!p[item.key]}))}/>
                  </div>
                ))}

                <div style={{marginTop:16}}>
                  <FG label="Reminder days before document expiry">
                    <input type="number" className="form-input" style={{maxWidth:100}} value={notif.reminderDays||3} onChange={e=>setNotif(p=>({...p,reminderDays:Number(e.target.value)}))} min="1" max="30"/>
                  </FG>
                </div>
              </Card>

              <Card title="SMS Gateway Configuration" subtitle="Semaphore or other Philippine SMS providers">
                <div style={{display:'flex',gap:10,marginBottom:20,padding:'12px 16px',background:sms.enabled?'#f0fdf4':'#f8fafc',border:`1px solid ${sms.enabled?'#bbf7d0':'#f1f5f9'}`,borderRadius:10,alignItems:'center',justifyContent:'space-between'}}>
                  <div>
                    <p style={{fontSize:14,fontWeight:600,color:'#0f172a',margin:0}}>SMS Gateway {sms.enabled?'Enabled':'Disabled'}</p>
                    <p style={{fontSize:12,color:'#64748b',margin:'2px 0 0'}}>Send SMS alerts and notifications to residents</p>
                  </div>
                  <Toggle checked={sms.enabled||false} onChange={()=>setSms(p=>({...p,enabled:!p.enabled}))}/>
                </div>
                <G2>
                  <FG label="Provider">
                    <select className="form-select" value={sms.provider} onChange={e=>setSms(p=>({...p,provider:e.target.value}))}>
                      <option value="semaphore">Semaphore (Philippines)</option>
                      <option value="movider">Movider</option>
                      <option value="twilio">Twilio</option>
                      <option value="other">Other</option>
                    </select>
                  </FG>
                  <FG label="Sender Name / ID" hint="Max 11 characters">
                    <input className="form-input" value={sms.senderName} onChange={e=>setSms(p=>({...p,senderName:e.target.value.slice(0,11)}))} placeholder="EBARANGAY"/>
                  </FG>
                </G2>
                <FG label="API Key" required>
                  <div style={{position:'relative'}}>
                    <input type={showApiKey?'text':'password'} className="form-input" value={sms.apiKey} onChange={e=>setSms(p=>({...p,apiKey:e.target.value}))} placeholder="Enter your API key" style={{paddingRight:42}}/>
                    <button type="button" onClick={()=>setShowApiKey(p=>!p)} tabIndex={-1} style={{position:'absolute',right:11,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#94a3b8',display:'flex'}}>
                      {showApiKey?<EyeOff size={16}/>:<Eye size={16}/>}
                    </button>
                  </div>
                </FG>

                <p style={{fontSize:13,fontWeight:600,color:'#374151',margin:'20px 0 12px',padding:'0 0 8px',borderBottom:'1px solid #f1f5f9'}}>Message Templates</p>
                {[
                  {key:'alert',label:'Emergency Alert',vars:'{message}'},
                  {key:'document',label:'Document Ready',vars:'{docType}, {refNo}'},
                  {key:'event',label:'Event Reminder',vars:'{eventName}, {date}, {location}'},
                ].map(t=>(
                  <FG key={t.key} label={t.label} hint={`Available variables: ${t.vars}`}>
                    <textarea className="form-textarea" rows={2} value={(sms.templates&&sms.templates[t.key])||''} onChange={e=>setSms(p=>({...p,templates:{...(p.templates||{}),[t.key]:e.target.value}}))}/>
                  </FG>
                ))}

                <div style={{display:'flex',justifyContent:'flex-end',marginTop:8}}>
                  <Btn onClick={saveSMSSettings} disabled={smsSaving} size="sm">{smsSaving?<><Loader size={14} className="animate-spin"/>Saving...</>:<><Save size={14}/>Save SMS Settings</>}</Btn>
                </div>
              </Card>
            </>
          )}

          {/* ══ SERVICES & FEES ══ */}
          {tab==='services'&&(
            <Card title="Document Services & Fees" subtitle="Configure document types, fees and processing time for e-Barangay Cebu"
              action={<Btn onClick={saveFees} disabled={feesSaving} size="sm">{feesSaving?<><Loader size={14} className="animate-spin"/>Saving...</>:<><Save size={14}/>Save Fees</>}</Btn>}>
              {feesLoad?<div style={{textAlign:'center',padding:24}}><Loader size={24} className="animate-spin" style={{color:'#3b82f6'}}/></div>:(
                <>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 90px 90px',gap:8,marginBottom:8,padding:'0 4px'}}>
                    <span style={{fontSize:11,fontWeight:600,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'.05em'}}>Document Type</span>
                    <span style={{fontSize:11,fontWeight:600,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'.05em',textAlign:'right'}}>Fee (₱)</span>
                    <span style={{fontSize:11,fontWeight:600,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'.05em',textAlign:'right'}}>Days</span>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:8}}>
                    {fees.map((fee,i)=>(
                      <div key={fee.id||i} style={{display:'grid',gridTemplateColumns:'1fr 90px 90px',gap:8,alignItems:'center',padding:'11px 14px',background:'#f8fafc',borderRadius:10,border:'1px solid #f1f5f9'}}>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <div style={{width:7,height:7,borderRadius:'50%',background:'#3b82f6',flexShrink:0}}/>
                          <span style={{fontSize:14,fontWeight:500,color:'#0f172a'}}>{fee.name}</span>
                          {fee.fee===0&&<span style={{fontSize:11,padding:'1px 7px',borderRadius:999,background:'#d1fae5',color:'#065f46',fontWeight:600}}>Free</span>}
                        </div>
                        <input type="number" value={fee.fee} onChange={e=>setFees(prev=>prev.map((f,j)=>j===i?{...f,fee:Number(e.target.value)}:f))} style={{padding:'6px 10px',border:'1.5px solid #e2e8f0',borderRadius:8,fontSize:13,textAlign:'right',outline:'none',width:'100%'}} min="0"/>
                        <input type="number" value={fee.processingDays} onChange={e=>setFees(prev=>prev.map((f,j)=>j===i?{...f,processingDays:Number(e.target.value)}:f))} style={{padding:'6px 10px',border:'1.5px solid #e2e8f0',borderRadius:8,fontSize:13,textAlign:'right',outline:'none',width:'100%'}} min="1"/>
                      </div>
                    ))}
                  </div>
                  <p style={{fontSize:12,color:'#94a3b8',marginTop:12}}>Fee = 0 means the document is issued for free. Processing days is shown to residents when requesting.</p>
                </>
              )}
            </Card>
          )}

          {/* ══ PAYMENT GATEWAY ══ */}
          {tab==='payment'&&(
            <Card title="Payment Gateway Configuration" subtitle="Set up online payment processors for document fees"
              action={<Btn onClick={savePayment} disabled={paymentSaving} size="sm">{paymentSaving?<><Loader size={14} className="animate-spin"/>Saving...</>:<><Save size={14}/>Save</>}</Btn>}>

              <div style={{display:'flex',gap:10,marginBottom:20,padding:'14px 18px',background:payment.testMode?'#fffbeb':'#f0fdf4',border:`1px solid ${payment.testMode?'#fde68a':'#bbf7d0'}`,borderRadius:12,alignItems:'center',justifyContent:'space-between'}}>
                <div>
                  <p style={{fontSize:14,fontWeight:700,color:payment.testMode?'#92400e':'#166534',margin:0}}>{payment.testMode?'Test Mode Active':'Live Mode Active'}</p>
                  <p style={{fontSize:12,color:payment.testMode?'#d97706':'#16a34a',margin:'2px 0 0'}}>{payment.testMode?'No real transactions — safe for testing':'Real payments enabled — use caution'}</p>
                </div>
                <Toggle checked={!payment.testMode} onChange={()=>setPayment(p=>({...p,testMode:!p.testMode}))}/>
              </div>

              <FG label="Payment Provider">
                <select className="form-select" value={payment.provider} onChange={e=>setPayment(p=>({...p,provider:e.target.value}))}>
                  <option value="paymongo">PayMongo (Philippines)</option>
                  <option value="paynamics">PayNamics</option>
                  <option value="dragonpay">DragonPay</option>
                  <option value="none">None / Cash Only</option>
                </select>
              </FG>

              {payment.provider!=='none'&&(
                <>
                  <FG label="Public Key" hint="Used on the frontend — safe to expose">
                    <input className="form-input" value={payment.publicKey} onChange={e=>setPayment(p=>({...p,publicKey:e.target.value}))} placeholder="pk_test_..."/>
                  </FG>
                  <FG label="Secret Key" hint="Keep this confidential — never share publicly">
                    <div style={{position:'relative'}}>
                      <input type={showSecret?'text':'password'} className="form-input" value={payment.secretKey} onChange={e=>setPayment(p=>({...p,secretKey:e.target.value}))} placeholder="sk_test_..." style={{paddingRight:42}}/>
                      <button type="button" onClick={()=>setShowSecret(p=>!p)} tabIndex={-1} style={{position:'absolute',right:11,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#94a3b8',display:'flex'}}>
                        {showSecret?<EyeOff size={16}/>:<Eye size={16}/>}
                      </button>
                    </div>
                  </FG>

                  <p style={{fontSize:13,fontWeight:600,color:'#374151',margin:'18px 0 12px',padding:'0 0 8px',borderBottom:'1px solid #f1f5f9'}}>Payment Methods</p>
                  {[
                    {key:'gcashEnabled',label:'GCash',desc:'Allow residents to pay via GCash e-wallet'},
                    {key:'cardEnabled',label:'Credit / Debit Card',desc:'Allow Visa, Mastercard payments'},
                  ].map(item=>(
                    <div key={item.key} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0',borderBottom:'1px solid #f8fafc'}}>
                      <div>
                        <p style={{fontSize:14,fontWeight:500,color:'#0f172a',margin:0}}>{item.label}</p>
                        <p style={{fontSize:12,color:'#94a3b8',margin:'2px 0 0'}}>{item.desc}</p>
                      </div>
                      <Toggle checked={payment[item.key]||false} onChange={()=>setPayment(p=>({...p,[item.key]:!p[item.key]}))}/>
                    </div>
                  ))}
                </>
              )}

              <div style={{marginTop:20,padding:'14px 18px',background:'#f8fafc',border:'1px solid #f1f5f9',borderRadius:12}}>
                <p style={{fontSize:13,fontWeight:600,color:'#374151',margin:'0 0 6px'}}>Getting Started with PayMongo</p>
                <p style={{fontSize:12,color:'#64748b',margin:0,lineHeight:1.6}}>1. Register at <strong>paymongo.com</strong> as a merchant<br/>2. Complete KYC verification<br/>3. Get your API keys from the PayMongo dashboard<br/>4. Paste your keys above and save<br/>5. Switch to Live Mode when ready to accept real payments</p>
              </div>
            </Card>
          )}

          {/* ══ KPI ANALYTICS DASHBOARD ══ */}
          {tab==='analytics'&&(
            <>
              <Card title="KPI Analytics Dashboard" subtitle="Live key performance indicators across all barangay modules"
                action={<button className="btn btn-secondary btn-sm" onClick={loadKPI}><TrendingUp size={14}/>Refresh</button>}>
                {kpiLoad ? (
                  <div style={{textAlign:'center',padding:40}}><Loader size={28} style={{color:'#3b82f6',animation:'spin 1s linear infinite',display:'block',margin:'0 auto'}}/><p style={{fontSize:13,color:'#94a3b8',marginTop:12}}>Loading data from all modules...</p></div>
                ) : !kpi ? (
                  <div style={{textAlign:'center',padding:40}}><BarChart2 size={36} style={{color:'#cbd5e1',display:'block',margin:'0 auto 10px'}}/><p style={{fontSize:13,color:'#94a3b8'}}>Click Refresh to load KPI data</p></div>
                ) : (
                  <>
                    {/* Module KPI cards */}
                    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:12,marginBottom:24}}>
                      {[
                        {label:'Total Residents',    value:kpi.residents?.total ?? '—',         sub:`${kpi.residents?.male ?? 0}M / ${kpi.residents?.female ?? 0}F`,        color:'#3b82f6', bg:'#eff6ff', Icon:Users},
                        {label:'Documents Issued',   value:kpi.documents?.released ?? '—',      sub:`${kpi.documents?.pending ?? 0} pending`,                               color:'#8b5cf6', bg:'#f5f3ff', Icon:FileText},
                        {label:'Open Incidents',     value:kpi.incidents?.open ?? '—',          sub:`${kpi.incidents?.total ?? 0} total`,                                    color:'#ef4444', bg:'#fef2f2', Icon:AlertCircle},
                        {label:'Health Patients',    value:kpi.health?.totalPatients ?? '—',    sub:`${kpi.health?.scheduledAppointments ?? 0} appointments`,                color:'#10b981', bg:'#f0fdf4', Icon:Activity},
                        {label:'Active Beneficiaries',value:kpi.welfare?.totalBeneficiaries ?? '—', sub:`${kpi.welfare?.activePrograms ?? 0} programs`,                    color:'#f59e0b', bg:'#fffbeb', Icon:Heart},
                        {label:'Pending Reports',    value:kpi.waste?.pendingReports ?? '—',    sub:`${kpi.waste?.activeVehicles ?? 0} vehicles active`,                    color:'#06b6d4', bg:'#ecfeff', Icon:Recycle},
                        {label:'Voters',             value:kpi.residents?.voters ?? '—',        sub:`of ${kpi.residents?.total ?? 0} residents`,                            color:'#64748b', bg:'#f8fafc', Icon:ClipboardList},
                        {label:'Senior Citizens',    value:kpi.residents?.seniorCitizens ?? '—',sub:`${kpi.residents?.pwd ?? 0} PWDs`,                                      color:'#d97706', bg:'#fffbeb', Icon:Shield},
                      ].map(({label,value,sub,color,bg,Icon}) => (
                        <div key={label} style={{background:bg,borderRadius:12,padding:'16px 18px',border:`1px solid ${color}22`}}>
                          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                            <div style={{width:32,height:32,borderRadius:8,background:color+'22',display:'flex',alignItems:'center',justifyContent:'center'}}><Icon size={16} color={color}/></div>
                            <span style={{fontSize:12,fontWeight:600,color:'#64748b'}}>{label}</span>
                          </div>
                          <div style={{fontSize:28,fontWeight:800,color,lineHeight:1,marginBottom:4}}>{value}</div>
                          <div style={{fontSize:12,color:'#94a3b8'}}>{sub}</div>
                        </div>
                      ))}
                    </div>

                    {/* Document breakdown bar chart */}
                    {kpi.documents && (
                      <div style={{background:'#f8fafc',borderRadius:12,padding:'18px 20px',marginBottom:16}}>
                        <p style={{fontSize:13,fontWeight:700,color:'#0f172a',marginBottom:14}}>Document Requests by Status</p>
                        {[
                          {label:'Released',   value:kpi.documents.released  ?? 0, color:'#10b981'},
                          {label:'Approved',   value:kpi.documents.approved  ?? 0, color:'#3b82f6'},
                          {label:'Processing', value:kpi.documents.processing?? 0, color:'#f59e0b'},
                          {label:'Pending',    value:kpi.documents.pending   ?? 0, color:'#94a3b8'},
                          {label:'Denied',     value:kpi.documents.denied    ?? 0, color:'#ef4444'},
                        ].map(({label,value,color}) => {
                          const max = Math.max(kpi.documents.total, 1);
                          return (
                            <div key={label} style={{display:'flex',alignItems:'center',gap:12,marginBottom:10}}>
                              <span style={{fontSize:12,color:'#64748b',minWidth:80}}>{label}</span>
                              <div style={{flex:1,height:10,background:'#e2e8f0',borderRadius:5,overflow:'hidden'}}>
                                <div style={{height:'100%',width:`${(value/max)*100}%`,background:color,borderRadius:5,transition:'width .6s ease'}}/>
                              </div>
                              <span style={{fontSize:12,fontWeight:700,color,minWidth:28,textAlign:'right'}}>{value}</span>
                            </div>
                          );
                        })}
                        {kpi.documents.totalRevenue > 0 && (
                          <p style={{fontSize:13,color:'#059669',fontWeight:600,marginTop:10}}>Total Document Revenue: PHP {(kpi.documents.totalRevenue||0).toLocaleString('en-PH')}</p>
                        )}
                      </div>
                    )}

                    {/* Incident breakdown */}
                    {kpi.incidents && (
                      <div style={{background:'#f8fafc',borderRadius:12,padding:'18px 20px',marginBottom:16}}>
                        <p style={{fontSize:13,fontWeight:700,color:'#0f172a',marginBottom:14}}>Incident Cases by Status</p>
                        {[
                          {label:'Open',           value:kpi.incidents.open           ?? 0, color:'#ef4444'},
                          {label:'Under Mediation',value:kpi.incidents.underMediation ?? 0, color:'#f59e0b'},
                          {label:'Resolved',       value:kpi.incidents.resolved       ?? 0, color:'#10b981'},
                        ].map(({label,value,color}) => {
                          const max = Math.max(kpi.incidents.total, 1);
                          return (
                            <div key={label} style={{display:'flex',alignItems:'center',gap:12,marginBottom:10}}>
                              <span style={{fontSize:12,color:'#64748b',minWidth:130}}>{label}</span>
                              <div style={{flex:1,height:10,background:'#e2e8f0',borderRadius:5,overflow:'hidden'}}>
                                <div style={{height:'100%',width:`${(value/max)*100}%`,background:color,borderRadius:5,transition:'width .6s ease'}}/>
                              </div>
                              <span style={{fontSize:12,fontWeight:700,color,minWidth:28,textAlign:'right'}}>{value}</span>
                            </div>
                          );
                        })}
                        {kpi.incidents.avgResolutionTime > 0 && (
                          <p style={{fontSize:12,color:'#64748b',marginTop:8}}>Avg. resolution time: {kpi.incidents.avgResolutionTime} days</p>
                        )}
                      </div>
                    )}

                    {/* Health + Welfare row */}
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                      {kpi.health && (
                        <div style={{background:'#f0fdf4',borderRadius:12,padding:'16px 18px',border:'1px solid #bbf7d0'}}>
                          <p style={{fontSize:13,fontWeight:700,color:'#166534',marginBottom:12}}>Health Services Summary</p>
                          {[
                            ['Total Patients',          kpi.health.totalPatients ?? 0],
                            ['Scheduled Appointments',  kpi.health.scheduledAppointments ?? 0],
                            ['Total Immunizations',     kpi.health.totalImmunizations ?? 0],
                            ['Active Disease Cases',    kpi.health.activeDiseases ?? 0],
                            ['Low Stock Medicines',     kpi.health.lowStockMedicines ?? 0],
                          ].map(([l,v]) => (
                            <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid #dcfce7',fontSize:13}}>
                              <span style={{color:'#166534'}}>{l}</span>
                              <span style={{fontWeight:700,color:'#166534'}}>{v}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {kpi.welfare && (
                        <div style={{background:'#fffbeb',borderRadius:12,padding:'16px 18px',border:'1px solid #fde68a'}}>
                          <p style={{fontSize:13,fontWeight:700,color:'#92400e',marginBottom:12}}>Social Welfare Summary</p>
                          {[
                            ['Total Programs',        kpi.welfare.totalPrograms       ?? 0],
                            ['Active Programs',       kpi.welfare.activePrograms      ?? 0],
                            ['Total Beneficiaries',   kpi.welfare.totalBeneficiaries  ?? 0],
                            ['Total Aid Distributed', 'PHP ' + (kpi.welfare.totalDistributed ?? 0).toLocaleString('en-PH')],
                          ].map(([l,v]) => (
                            <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid #fef3c7',fontSize:13}}>
                              <span style={{color:'#92400e'}}>{l}</span>
                              <span style={{fontWeight:700,color:'#92400e'}}>{v}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </Card>
            </>
          )}

          {/* ══ REPORTS ══ */}
          {tab==='reports'&&(
            <>
              <Card title="Customizable Reports" subtitle="Generate and export reports from any module with date filters">
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr auto',gap:12,alignItems:'end',marginBottom:20,padding:'16px 18px',background:'#f8fafc',borderRadius:12,border:'1px solid #f1f5f9'}}>
                  <FG label="Module" required>
                    <select className="form-select" value={rptModule} onChange={e=>{setRptModule(e.target.value);setRptData(null);}}>
                      {[
                        {v:'residents',  l:'Residents'},
                        {v:'documents',  l:'Documents'},
                        {v:'incidents',  l:'Incidents'},
                        {v:'health',     l:'Health Services'},
                        {v:'welfare',    l:'Social Welfare'},
                        {v:'waste',      l:'Waste Management'},
                      ].map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                  </FG>
                  <FG label="Date From">
                    <input type="date" className="form-input" value={rptFrom} onChange={e=>setRptFrom(e.target.value)}/>
                  </FG>
                  <FG label="Date To">
                    <input type="date" className="form-input" value={rptTo} onChange={e=>setRptTo(e.target.value)}/>
                  </FG>
                  <button className="btn btn-primary btn-md" disabled={rptLoad}
                    onClick={async()=>{
                      setRptLoad(true); setRptData(null);
                      try {
                        let result = null;
                        if (rptModule==='residents') { const r=await getResidentStatistics(); result=r.data; }
                        else if (rptModule==='documents') { const r=await getDocumentStatistics(); result=r.data; }
                        else if (rptModule==='incidents') { const r=await getIncidentStatistics(); result=r.data; }
                        else if (rptModule==='health')    { const r=await getHealthStatistics();   result=r.data; }
                        else if (rptModule==='welfare')   { const r=await getWelfareStatistics();  result=r.data; }
                        else if (rptModule==='waste')     { const r=await getWasteStats();         result=r.data; }
                        setRptData(result);
                      } catch(_) {}
                      setRptLoad(false);
                    }}>
                    {rptLoad ? <><Loader size={14} style={{animation:'spin 1s linear infinite'}}/>Generating...</> : <><FileBarChart size={14}/>Generate</>}
                  </button>
                </div>

                {rptData && (
                  <div>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
                      <p style={{fontSize:14,fontWeight:700,color:'#0f172a',margin:0,textTransform:'capitalize'}}>{rptModule} Report — {new Date().toLocaleDateString('en-PH',{year:'numeric',month:'long',day:'numeric'})}</p>
                      <button className="btn btn-secondary btn-sm" onClick={()=>{
                        const rows = Object.entries(rptData).map(([k,v])=>`${k}\t${typeof v==='object'?JSON.stringify(v):v}`).join('\n');
                        const blob = new Blob([`${rptModule.toUpperCase()} REPORT\nGenerated: ${new Date().toLocaleString('en-PH')}\nDate Range: ${rptFrom||'All'} to ${rptTo||'All'}\n\n${rows}`],{type:'text/plain'});
                        const a = document.createElement('a'); a.href=URL.createObjectURL(blob);
                        a.download=`${rptModule}_report_${new Date().toISOString().split('T')[0]}.txt`; a.click();
                      }}>
                        <Download size={13}/>Export TXT
                      </button>
                    </div>

                    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:10,marginBottom:16}}>
                      {Object.entries(rptData)
                        .filter(([k,v]) => typeof v === 'number')
                        .map(([k,v]) => (
                          <div key={k} style={{background:'#f8fafc',borderRadius:10,padding:'12px 14px',border:'1px solid #f1f5f9'}}>
                            <div style={{fontSize:22,fontWeight:800,color:'#0f172a'}}>{v.toLocaleString('en-PH')}</div>
                            <div style={{fontSize:11,color:'#94a3b8',marginTop:3,textTransform:'capitalize'}}>{k.replace(/([A-Z])/g,' $1').toLowerCase()}</div>
                          </div>
                        ))
                      }
                    </div>

                    {Object.entries(rptData)
                      .filter(([k,v]) => v && typeof v==='object' && !Array.isArray(v))
                      .map(([k,v]) => (
                        <div key={k} style={{marginBottom:14,background:'#f8fafc',borderRadius:10,padding:'14px 16px',border:'1px solid #f1f5f9'}}>
                          <p style={{fontSize:12,fontWeight:700,color:'#374151',marginBottom:10,textTransform:'capitalize'}}>{k.replace(/([A-Z])/g,' $1')}</p>
                          <div style={{display:'flex',flexDirection:'column',gap:6}}>
                            {Object.entries(v).map(([subk,subv])=>(
                              <div key={subk} style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:13}}>
                                <span style={{color:'#64748b',textTransform:'capitalize'}}>{subk.replace(/([A-Z])/g,' $1')}</span>
                                <span style={{fontWeight:600,color:'#0f172a'}}>{typeof subv==='number'?subv.toLocaleString('en-PH'):String(subv)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    }

                    <div style={{padding:'12px 16px',background:'#eff6ff',borderRadius:10,border:'1px solid #bfdbfe',fontSize:12,color:'#1e40af'}}>
                      Report generated on {new Date().toLocaleString('en-PH')} | Module: {rptModule} | Date filter: {rptFrom||'All'} to {rptTo||'All'}
                    </div>
                  </div>
                )}

                {!rptData && !rptLoad && (
                  <div style={{textAlign:'center',padding:'40px 0',color:'#94a3b8'}}>
                    <FileBarChart size={40} style={{display:'block',margin:'0 auto 12px',opacity:0.3}}/>
                    <p style={{fontSize:13}}>Select a module and click Generate to build your report.</p>
                  </div>
                )}
              </Card>

              {/* Quick report templates */}
              <Card title="Quick Report Templates" subtitle="Pre-configured common reports for barangay operations">
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:10}}>
                  {[
                    {label:'Monthly Resident Summary',    module:'residents', desc:'Total residents by gender, purok, and civil status'},
                    {label:'Document Issuance Report',    module:'documents', desc:'Documents released, pending, and total revenue collected'},
                    {label:'Incident Resolution Report',  module:'incidents', desc:'Open vs resolved cases and average resolution time'},
                    {label:'Health Service Summary',      module:'health',    desc:'Patient count, immunizations, and disease cases'},
                    {label:'Beneficiary Aid Report',      module:'welfare',   desc:'Total beneficiaries and aid distributed by program'},
                    {label:'Waste Collection Summary',    module:'waste',     desc:'Active vehicles, schedules, and pending reports'},
                  ].map(t=>(
                    <div key={t.label} style={{padding:'14px 16px',background:'#f8fafc',borderRadius:10,border:'1px solid #f1f5f9',cursor:'pointer',transition:'box-shadow .2s'}}
                      onMouseEnter={e=>e.currentTarget.style.boxShadow='0 2px 12px rgba(0,0,0,0.08)'}
                      onMouseLeave={e=>e.currentTarget.style.boxShadow=''}
                      onClick={()=>{setRptModule(t.module);}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                        <span style={{fontSize:13,fontWeight:600,color:'#0f172a'}}>{t.label}</span>
                        <ChevronRight size={14} color="#94a3b8"/>
                      </div>
                      <p style={{fontSize:12,color:'#64748b',margin:0,lineHeight:1.5}}>{t.desc}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}

          {/* ══ BACKUP & SECURITY ══ */}
          {tab==='backup'&&(
            <Card title="Backup, Security & System Information" subtitle="e-Barangay Cebu — System infrastructure details">
              <div style={{display:'flex',flexDirection:'column',gap:14}}>
                <div style={{padding:'18px 20px',background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:12}}>
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
                    <Database size={18} color="#16a34a"/>
                    <h4 style={{fontSize:14,fontWeight:700,color:'#166534',margin:0}}>Cloud Storage & Backup</h4>
                  </div>
                  {['Automatic daily backups via Firestore','Data replicated across multiple Google data centers','99.999% uptime SLA','Point-in-time recovery available','256-bit AES encryption at rest','TLS 1.3 encryption in transit'].map((item,i)=>(
                    <div key={i} style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                      <CheckCircle size={13} color="#16a34a"/>
                      <span style={{fontSize:13,color:'#166534'}}>{item}</span>
                    </div>
                  ))}
                </div>

                <div style={{padding:'18px 20px',background:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:12}}>
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
                    <Shield size={18} color="#1d4ed8"/>
                    <h4 style={{fontSize:14,fontWeight:700,color:'#1e40af',margin:0}}>Security Configuration</h4>
                  </div>
                  <G2 gap={10}>
                    {[
                      {label:'Authentication',  value:'Firebase Auth'},
                      {label:'Database',        value:'Cloud Firestore'},
                      {label:'Hosting',         value:'Vercel / Firebase'},
                      {label:'Password Policy', value:'Min. 6 characters'},
                      {label:'Session Timeout', value:'24 hours'},
                      {label:'HTTPS',           value:'Enforced'},
                    ].map(item=>(
                      <div key={item.label}>
                        <p style={{fontSize:11,fontWeight:600,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'.05em',margin:'0 0 2px'}}>{item.label}</p>
                        <p style={{fontSize:13,fontWeight:500,color:'#1e40af',margin:0}}>{item.value}</p>
                      </div>
                    ))}
                  </G2>
                </div>

                <div style={{padding:'18px 20px',background:'#fff',border:'1px solid #f1f5f9',borderRadius:12}}>
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
                    <FileText size={18} color="#374151"/>
                    <h4 style={{fontSize:14,fontWeight:700,color:'#0f172a',margin:0}}>Data Export</h4>
                  </div>
                  <p style={{fontSize:13,color:'#64748b',margin:'0 0 12px'}}>Export module data for offline backup and reporting.</p>
                  <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                    <button className="btn btn-secondary btn-sm" onClick={()=>window.location.href='/residents'}><Users size={13}/>Export Residents</button>
                    <button className="btn btn-secondary btn-sm" onClick={()=>window.location.href='/documents'}><FileText size={13}/>Export Documents</button>
                  </div>
                </div>

                <div style={{padding:'18px 20px',background:'#f8fafc',border:'1px solid #f1f5f9',borderRadius:12}}>
                  <p style={{fontSize:12,fontWeight:600,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'.05em',margin:'0 0 12px'}}>About e-Barangay Cebu</p>
                  <G2 gap={10}>
                    {[
                      {label:'System Name',   value:'e-Barangay'},
                      {label:'Version',       value:'v1.0.0'},
                      {label:'Region',        value:'Central Visayas (Region VII)'},
                      {label:'City',          value:'Cebu City'},
                      {label:'Stack',         value:'React + Firebase'},
                      {label:'School Project',value:'Capstone / Thesis'},
                    ].map(item=>(
                      <div key={item.label} style={{display:'flex',gap:8,fontSize:13}}>
                        <span style={{color:'#94a3b8',minWidth:110,flexShrink:0}}>{item.label}:</span>
                        <span style={{color:'#374151',fontWeight:500}}>{item.value}</span>
                      </div>
                    ))}
                  </G2>
                </div>
              </div>
            </Card>
          )}

        </div>
      </div>

      {/* ══ MODALS ══ */}

      {/* Official modal */}
      {showOffModal&&(
        <Modal title={editOff?'Edit Official':'Add Official'} onClose={()=>setShowOffModal(false)} maxWidth={440}>
          <FG label="Full Name" required><input className="form-input" value={offForm.name} onChange={e=>setOffForm(p=>({...p,name:e.target.value}))} placeholder="Hon. Juan Dela Cruz"/></FG>
          <FG label="Position / Title" required><input className="form-input" value={offForm.position} onChange={e=>setOffForm(p=>({...p,position:e.target.value}))} placeholder="e.g. Kagawad, SK Chairman, BPSO"/></FG>
          <FG label="Contact Number"><input className="form-input" value={offForm.contactNumber} onChange={e=>setOffForm(p=>({...p,contactNumber:e.target.value}))} placeholder="09XX XXX XXXX"/></FG>
          <FG label="Display Order" hint="Lower number appears first"><input type="number" className="form-input" value={offForm.order} onChange={e=>setOffForm(p=>({...p,order:Number(e.target.value)}))} min="0"/></FG>
          <div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:8}}>
            <button className="btn btn-secondary btn-md" onClick={()=>setShowOffModal(false)} disabled={offLoad}>Cancel</button>
            <button className="btn btn-primary btn-md" onClick={saveOff} disabled={offLoad||!offForm.name.trim()||!offForm.position.trim()}>
              {offLoad?<><Loader size={14} className="animate-spin"/>Saving...</>:<><Save size={14}/>Save</>}
            </button>
          </div>
        </Modal>
      )}

      {/* User modal */}
      {showUserModal&&(
        <Modal title={editUser?'Edit User Account':'Add New User Account'} onClose={()=>setShowUserModal(false)}>
          {uErr&&<div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:9,padding:'9px 14px',marginBottom:14,fontSize:13,color:'#dc2626'}}>{uErr}</div>}
          <G2>
            <FG label="Full Name" required><input className="form-input" value={uForm.name} onChange={e=>setUForm(p=>({...p,name:e.target.value}))} placeholder="Juan Dela Cruz"/></FG>
            <FG label="Role" required>
              <select className="form-select" value={uForm.role} onChange={e=>setUForm(p=>({...p,role:e.target.value}))}>
                {ROLES.map(r=><option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
            </FG>
          </G2>
          <FG label="Email Address" required>
            <input type="email" className="form-input" value={uForm.email} onChange={e=>setUForm(p=>({...p,email:e.target.value}))} placeholder="user@email.com" disabled={!!editUser}/>
            {editUser&&<p style={{fontSize:11,color:'#94a3b8',margin:'3px 0 0'}}>Email cannot be changed after creation.</p>}
          </FG>
          <FG label="Phone Number"><input className="form-input" value={uForm.phone} onChange={e=>setUForm(p=>({...p,phone:e.target.value}))} placeholder="09XX XXX XXXX"/></FG>
          {!editUser&&(
            <FG label="Initial Password" required>
              <div style={{position:'relative'}}>
                <input type={showPw?'text':'password'} className="form-input" value={uPw} onChange={e=>setUPw(e.target.value)} placeholder="Min. 6 characters" style={{paddingRight:42}}/>
                <button type="button" onClick={()=>setShowPw(p=>!p)} tabIndex={-1} style={{position:'absolute',right:11,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#94a3b8',display:'flex'}}>
                  {showPw?<EyeOff size={16}/>:<Eye size={16}/>}
                </button>
              </div>
              <p style={{fontSize:12,color:'#94a3b8',margin:'3px 0 0'}}>User will log in with this password. They can change it later.</p>
            </FG>
          )}
          <div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:8}}>
            <button className="btn btn-secondary btn-md" onClick={()=>setShowUserModal(false)} disabled={uSaving}>Cancel</button>
            <button className="btn btn-primary btn-md" onClick={saveUser} disabled={uSaving}>
              {uSaving?<><Loader size={14} className="animate-spin"/>{editUser?'Updating...':'Creating...'}</>:<><Save size={14}/>{editUser?'Update User':'Create Account'}</>}
            </button>
          </div>
        </Modal>
      )}

      {/* Change password modal */}
      {showPwModal&&(
        <Modal title="Change Your Password" onClose={()=>{setShowPwModal(false);setPwForm({current:'',next:'',confirm:''});setPwErr('');}} maxWidth={420}>
          {pwErr&&<div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:9,padding:'9px 14px',marginBottom:14,fontSize:13,color:'#dc2626'}}>{pwErr}</div>}
          <FG label="Current Password" required>
            <div style={{position:'relative'}}>
              <input type={showCurPw?'text':'password'} className="form-input" value={pwForm.current} onChange={e=>setPwForm(p=>({...p,current:e.target.value}))} placeholder="Enter current password" style={{paddingRight:42}}/>
              <button type="button" onClick={()=>setShowCurPw(p=>!p)} tabIndex={-1} style={{position:'absolute',right:11,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#94a3b8',display:'flex'}}>
                {showCurPw?<EyeOff size={16}/>:<Eye size={16}/>}
              </button>
            </div>
          </FG>
          <FG label="New Password" required>
            <div style={{position:'relative'}}>
              <input type={showNewPw?'text':'password'} className="form-input" value={pwForm.next} onChange={e=>setPwForm(p=>({...p,next:e.target.value}))} placeholder="Min. 6 characters" style={{paddingRight:42}}/>
              <button type="button" onClick={()=>setShowNewPw(p=>!p)} tabIndex={-1} style={{position:'absolute',right:11,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#94a3b8',display:'flex'}}>
                {showNewPw?<EyeOff size={16}/>:<Eye size={16}/>}
              </button>
            </div>
          </FG>
          <FG label="Confirm New Password" required>
            <input type="password" className="form-input" value={pwForm.confirm} onChange={e=>setPwForm(p=>({...p,confirm:e.target.value}))} placeholder="Repeat new password"/>
            {pwForm.next&&pwForm.confirm&&(pwForm.next===pwForm.confirm?<p style={{fontSize:12,color:'#16a34a',margin:'4px 0 0',display:'flex',alignItems:'center',gap:4}}><CheckCircle size={12}/>Passwords match</p>:<p style={{fontSize:12,color:'#dc2626',margin:'4px 0 0'}}>Passwords do not match</p>)}
          </FG>
          <div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:8}}>
            <button className="btn btn-secondary btn-md" onClick={()=>setShowPwModal(false)} disabled={pwSaving}>Cancel</button>
            <button className="btn btn-primary btn-md" onClick={handleChangePassword} disabled={pwSaving}>
              {pwSaving?<><Loader size={14} className="animate-spin"/>Changing...</>:<><Lock size={14}/>Change Password</>}
            </button>
          </div>
        </Modal>
      )}

      {toast&&<Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
    </div>
  );
}