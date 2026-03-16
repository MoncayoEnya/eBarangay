// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import StatCard from '../components/layout/common/StatCard';
import ResidentFormModal from '../components/residents/ResidentFormModal';
import DocumentFormModal from '../components/documents/DocumentFormModal';
import IncidentFormModal from '../components/incidents/IncidentFormModal';
import { useDocuments }  from '../hooks/useDocuments';
import { useIncidents }  from '../hooks/useIncidents';
import { useResidents }  from '../hooks/useResidents';
import { useEvents }     from '../hooks/useEvents';
import {
  Users, FileText, AlertCircle, Calendar,
  UserPlus, FilePlus, Flag, Megaphone, Bell,
  ArrowRight, ChevronRight, Loader, Eye, MapPin, Clock,
} from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────
const formatRelativeTime = (ts) => {
  if (!ts) return 'Just now';
  try {
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60)     return `${diff}s ago`;
    if (diff < 3600)   return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 172800) return 'Yesterday';
    return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
  } catch { return 'Recently'; }
};

const formatNumber = (n) =>
  n != null ? Number(n).toLocaleString('en-PH') : '—';

// event.date is stored as "YYYY-MM-DD" string in your eventsService
const parseEventDate = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T00:00:00');
  return isNaN(d) ? null : d;
};

const docStatusColor = (s) => ({
  Approved:   { bg: '#ecfdf5', color: '#065f46' },
  Released:   { bg: '#ecfdf5', color: '#065f46' },
  Denied:     { bg: '#fef2f2', color: '#991b1b' },
  Processing: { bg: '#eff6ff', color: '#1e40af' },
}[s] || { bg: '#fffbeb', color: '#92400e' });

const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

// ── Sub-components ────────────────────────────────────────────
const Card = ({ children, style = {} }) => (
  <div style={{
    background: '#fff', borderRadius: 14,
    border: '1px solid #f0f4f8',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    overflow: 'hidden', ...style,
  }}>{children}</div>
);

const CardHeader = ({ title, sub, action }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 20px', borderBottom: '1px solid #f8fafc',
  }}>
    <div>
      <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{title}</span>
      {sub && <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 8 }}>{sub}</span>}
    </div>
    {action}
  </div>
);

const LinkBtn = ({ label, onClick }) => (
  <button onClick={onClick} style={{
    display: 'flex', alignItems: 'center', gap: 4, background: 'none',
    border: 'none', cursor: 'pointer', color: '#3b82f6', fontSize: 13, fontWeight: 600,
  }}>{label} <ArrowRight size={14} /></button>
);

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <p style={{ fontWeight: 600, color: '#0f172a', marginBottom: 2 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.fill, margin: 0 }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
};

const EmptyState = ({ icon: Icon, text }) => (
  <div style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>
    <Icon size={34} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.3 }} />
    <p style={{ fontSize: 14, fontWeight: 500 }}>{text}</p>
  </div>
);

// ── Dashboard ─────────────────────────────────────────────────
const Dashboard = () => {
  const navigate = useNavigate();

  const {
    documents, loading: docsLoading,
    loadDocuments, stats: docStats, loadStatistics: loadDocStats,
  } = useDocuments();
  const {
    incidents, loadIncidents,
    stats: incidentStats, loadStatistics: loadIncidentStats,
  } = useIncidents();
  const { stats: residentStats, loadStatistics: loadResidentStats } = useResidents();
  const { events, loadEvents } = useEvents();

  const [pageLoading, setPageLoading]                   = useState(true);
  const [activeDocTab, setActiveDocTab]                 = useState('All');
  const [showAddResidentModal, setShowAddResidentModal] = useState(false);
  const [showIssueDocModal,    setShowIssueDocModal]    = useState(false);
  const [showIncidentModal,    setShowIncidentModal]    = useState(false);

  useEffect(() => {
    (async () => {
      await Promise.all([
        loadDocuments({ limit: 6 }),
        loadIncidents(5, true),
        loadResidentStats(),
        loadEvents(),
      ]);
      setPageLoading(false);
      loadDocStats();
      loadIncidentStats();
    })();
  }, []);

  // ── Doc tabs ──
  const DOC_TABS = ['All', 'Pending', 'Approved', 'Processing', 'Denied'];
  const tabCount = (tab) => {
    if (tab === 'All') return docStats?.total ?? documents.length;
    return docStats?.[tab.toLowerCase()] ?? documents.filter(d => d.status === tab).length;
  };
  const handleTabChange = async (tab) => {
    setActiveDocTab(tab);
    await loadDocuments(tab === 'All' ? { limit: 6 } : { status: tab, limit: 6 });
  };

  // ── Chart data from real stats ──
  const docPieData = [
    { name: 'Pending',    value: docStats?.pending    || 0, fill: '#f59e0b' },
    { name: 'Processing', value: docStats?.processing || 0, fill: '#3b82f6' },
    { name: 'Approved',   value: docStats?.approved   || 0, fill: '#10b981' },
    { name: 'Released',   value: docStats?.released   || 0, fill: '#06b6d4' },
    { name: 'Denied',     value: docStats?.denied     || 0, fill: '#ef4444' },
  ].filter(d => d.value > 0);

  // residentStats.byPurok = { 'Purok 1': 120, 'Purok 2': 98, ... }
  const purokBarData = Object.entries(residentStats?.byPurok || {})
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // incidentStats.byCategory = { 'Theft': 5, 'Dispute': 3, ... }
  const incidentBarData = Object.entries(incidentStats?.byCategory || {})
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  // ── Upcoming events — date is "YYYY-MM-DD" string per eventsService ──
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const upcomingEvents = [...(events || [])]
    .filter(e => { const d = parseEventDate(e.date); return d && d >= today; })
    .sort((a, b) => parseEventDate(a.date) - parseEventDate(b.date))
    .slice(0, 3);

  const upcomingCount = (events || []).filter(e => {
    const d = parseEventDate(e.date);
    return d && d >= today;
  }).length;

  // ── Active incidents ──
  const activeIncidents = incidents.filter(i => i.status !== 'Resolved').slice(0, 3);
  const sevStyle = (i) => {
    if (i.severity === 'Urgent' || i.priority === 'High')
      return { border: '#ef4444', bg: '#fef2f2', badge: { bg: '#fee2e2', color: '#991b1b' }, label: 'URGENT' };
    if (i.status === 'Under Mediation')
      return { border: '#3b82f6', bg: '#eff6ff', badge: { bg: '#dbeafe', color: '#1e40af' }, label: 'MEDIATION' };
    return { border: '#f59e0b', bg: '#fffbeb', badge: { bg: '#fef3c7', color: '#92400e' }, label: 'OPEN' };
  };

  // ── Stat cards ──
  const statCards = [
    {
      label: 'Total Residents',
      value: residentStats ? formatNumber(residentStats.total) : '—',
      badge: residentStats ? `${residentStats.male || 0}M / ${residentStats.female || 0}F` : 'Loading...',
      badgeColor: 'badge-success', icon: Users, iconBg: 'icon-bg-primary', nav: '/residents',
    },
    {
      label: 'Pending Documents',
      value: String(docStats?.pending ?? documents.filter(d => d.status === 'Pending').length),
      badge: 'Needs attention', badgeColor: 'badge-warning', icon: FileText, iconBg: 'icon-bg-warning', nav: '/documents',
    },
    {
      label: 'Active Incidents',
      value: String(incidentStats?.open ?? incidents.filter(i => i.status === 'Open').length),
      badge: 'Requires action', badgeColor: 'badge-error', icon: AlertCircle, iconBg: 'icon-bg-error', nav: '/incidents',
    },
    {
      label: 'Upcoming Events',
      value: String(upcomingCount),
      badge: 'This month', badgeColor: 'badge-gray', icon: Calendar, iconBg: 'icon-bg-secondary', nav: '/events',
    },
  ];

  const quickActions = [
    { label: 'Add New Resident',    icon: UserPlus,  bg: '#eff6ff', color: '#1e40af', action: () => setShowAddResidentModal(true) },
    { label: 'Issue Document',      icon: FilePlus,  bg: '#f0fdf4', color: '#166534', action: () => setShowIssueDocModal(true) },
    { label: 'Report Incident',     icon: Flag,      bg: '#fffbeb', color: '#92400e', action: () => setShowIncidentModal(true) },
    { label: 'Create Announcement', icon: Megaphone, bg: '#f5f3ff', color: '#6b21a8', action: () => navigate('/announcements') },
    { label: 'Send DRRM Alert',     icon: Bell,      bg: '#fef2f2', color: '#991b1b', action: () => navigate('/drrm') },
  ];

  if (pageLoading) return (
    <div className="loading-container" style={{ height: '60vh' }}>
      <Loader size={32} style={{ color: '#3b82f6', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  return (
    <div className="page-container">

      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Dashboard Overview</h1>
          <p className="page-subtitle">Welcome back! Here's what's happening in your barangay today.</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        {statCards.map((s, i) => (
          <StatCard key={i} title={s.label} value={s.value} icon={s.icon}
            iconBg={s.iconBg} badge={s.badge} badgeColor={s.badgeColor}
            onClick={() => navigate(s.nav)} />
        ))}
      </div>

      {/* Row 1 — Documents list + Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, marginBottom: 20 }}>

        <Card>
          <CardHeader title="Recent Document Requests"
            action={<LinkBtn label="View All" onClick={() => navigate('/documents')} />} />

          {/* Status tabs */}
          <div style={{ display: 'flex', gap: 6, padding: '12px 20px', borderBottom: '1px solid #f8fafc', overflowX: 'auto' }}>
            {DOC_TABS.map(tab => {
              const active = activeDocTab === tab;
              const count  = tabCount(tab);
              return (
                <button key={tab} onClick={() => handleTabChange(tab)} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 12px', borderRadius: 20, border: 'none',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                  background: active ? '#3b82f6' : '#f8fafc',
                  color:      active ? '#fff'    : '#64748b',
                  boxShadow:  active ? '0 2px 8px rgba(59,130,246,0.28)' : 'none',
                  transition: 'all 0.15s',
                }}>
                  {tab}
                  {tab !== 'All' && count > 0 && (
                    <span style={{
                      padding: '1px 6px', borderRadius: 10, fontSize: 11,
                      background: active ? 'rgba(255,255,255,0.25)' : '#e8ecf0',
                      color:      active ? '#fff' : '#94a3b8',
                    }}>{count}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Doc rows */}
          <div style={{ padding: '8px 0' }}>
            {docsLoading
              ? [1, 2, 3].map(i => (
                  <div key={i} style={{ display: 'flex', gap: 14, padding: '12px 20px' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f1f5f9', flexShrink: 0 }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ height: 13, width: '50%', borderRadius: 6, background: '#f1f5f9' }} />
                      <div style={{ height: 11, width: '30%', borderRadius: 6, background: '#f8fafc' }} />
                    </div>
                  </div>
                ))
              : documents.length === 0
              ? <EmptyState icon={FileText} text={`No ${activeDocTab === 'All' ? '' : activeDocTab} requests yet`} />
              : documents.slice(0, 6).map(doc => {
                  const st = docStatusColor(doc.status);
                  return (
                    <div key={doc.id}
                      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 20px', cursor: 'pointer', transition: 'background 0.12s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fafbfc'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      onClick={() => navigate('/documents')}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: st.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FileText size={18} color={st.color} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                          {doc.documentType || 'Document Request'}
                        </p>
                        <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>
                          {doc.requester?.name || 'N/A'} · {formatRelativeTime(doc.systemInfo?.requestDate || doc.systemInfo?.createdAt)}
                        </p>
                      </div>
                      <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: st.bg, color: st.color, whiteSpace: 'nowrap' }}>
                        {doc.status || 'Pending'}
                      </span>
                      <Eye size={15} color="#cbd5e1" />
                    </div>
                  );
                })
            }
          </div>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader title="Quick Actions" />
          <div style={{ padding: 12 }}>
            {quickActions.map((a, i) => {
              const Icon = a.icon;
              return (
                <button key={i} onClick={a.action} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  width: '100%', padding: '11px 14px', marginBottom: 6,
                  border: 'none', borderRadius: 10, cursor: 'pointer',
                  background: a.bg, color: a.color,
                  fontSize: 13, fontWeight: 600, textAlign: 'left',
                  transition: 'filter 0.15s, transform 0.12s',
                }}
                onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(0.95)'; e.currentTarget.style.transform = 'translateX(2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.filter = 'none';             e.currentTarget.style.transform = 'none'; }}>
                  <Icon size={17} strokeWidth={2} style={{ flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{a.label}</span>
                  <ChevronRight size={14} style={{ opacity: 0.4 }} />
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Row 2 — Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* Documents by status — Donut */}
        <Card>
          <CardHeader title="Documents by Status" sub={`Total: ${docStats?.total || 0}`} />
          <div style={{ padding: '8px 0 16px' }}>
            {docPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie data={docPieData} cx="50%" cy="50%" innerRadius={48} outerRadius={72}
                    paddingAngle={3} dataKey="value">
                    {docPieData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 190, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>
                No document data yet
              </div>
            )}
          </div>
        </Card>

        {/* Residents by Purok — Bar */}
        <Card>
          <CardHeader title="Residents by Purok" sub={`Total: ${formatNumber(residentStats?.total || 0)}`} />
          <div style={{ padding: '16px 8px 8px' }}>
            {purokBarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={purokBarData} barSize={18}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                    tickFormatter={v => v.replace('Purok ', 'P')} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="value" name="Residents" radius={[4, 4, 0, 0]}>
                    {purokBarData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 190, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>
                No resident data yet
              </div>
            )}
          </div>
        </Card>

        {/* Incidents by Category — Horizontal Bar */}
        <Card>
          <CardHeader title="Incidents by Category" sub={`Total: ${incidentStats?.total || 0}`} />
          <div style={{ padding: '16px 8px 8px' }}>
            {incidentBarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={incidentBarData} layout="vertical" barSize={14}>
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }}
                    axisLine={false} tickLine={false} width={82} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="value" name="Cases" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 190, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>
                No incident data yet
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Row 3 — Active Incidents + Upcoming Events */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        <Card>
          <CardHeader title="Active Incidents"
            action={<LinkBtn label="View All" onClick={() => navigate('/incidents')} />} />
          <div style={{ padding: 12 }}>
            {activeIncidents.length === 0
              ? <EmptyState icon={AlertCircle} text="No active incidents — all clear!" />
              : activeIncidents.map((incident, i) => {
                  const ss = sevStyle(incident);
                  return (
                    <div key={incident.id || i}
                      style={{ padding: '12px 14px', marginBottom: 8, borderRadius: 10, borderLeft: `3px solid ${ss.border}`, background: ss.bg, cursor: 'pointer', transition: 'transform 0.12s' }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'translateX(3px)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                      onClick={() => navigate('/incidents')}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0 }}>
                          {incident.title || incident.category || 'Incident'}
                        </p>
                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: ss.badge.bg, color: ss.badge.color, whiteSpace: 'nowrap' }}>
                          {ss.label}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 14, marginTop: 6 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#64748b' }}>
                          <MapPin size={12} />{incident.location || incident.complainant?.purok || 'Unknown'}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#64748b' }}>
                          <Clock size={12} />{formatRelativeTime(incident.systemInfo?.dateFiled || incident.systemInfo?.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })
            }
          </div>
        </Card>

        <Card>
          <CardHeader title="Upcoming Events"
            action={<LinkBtn label="View Calendar" onClick={() => navigate('/events')} />} />
          <div style={{ padding: 12 }}>
            {upcomingEvents.length === 0
              ? <EmptyState icon={Calendar} text="No upcoming events yet" />
              : upcomingEvents.map((event, i) => {
                  const d     = parseEventDate(event.date);
                  const month = d ? d.toLocaleString('en-PH', { month: 'short' }).toUpperCase() : '—';
                  const day   = d ? d.getDate() : '—';
                  const color = CHART_COLORS[i % CHART_COLORS.length];
                  return (
                    <div key={event.id || i}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: 10, marginBottom: 4, borderRadius: 10, cursor: 'pointer', transition: 'background 0.12s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      onClick={() => navigate('/events')}>
                      <div style={{ width: 50, height: 50, borderRadius: 12, background: color, color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 9, fontWeight: 700, opacity: 0.85, letterSpacing: '0.05em' }}>{month}</span>
                        <span style={{ fontSize: 20, fontWeight: 800, lineHeight: 1 }}>{day}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {event.title}
                        </p>
                        <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 2px' }}>
                          {event.location || 'Barangay Hall'}{event.time ? ` · ${event.time}` : ''}
                        </p>
                        <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
                          {event.rsvps || 0} registered
                        </p>
                      </div>
                    </div>
                  );
                })
            }
          </div>
        </Card>
      </div>

      {/* Modals */}
      <ResidentFormModal isOpen={showAddResidentModal} onClose={() => setShowAddResidentModal(false)}
        onSuccess={() => { setShowAddResidentModal(false); navigate('/residents'); }} />
      <DocumentFormModal isOpen={showIssueDocModal} onClose={() => setShowIssueDocModal(false)}
        onSuccess={() => { setShowIssueDocModal(false); loadDocuments({ limit: 6 }); loadDocStats(); }} />
      <IncidentFormModal isOpen={showIncidentModal} onClose={() => setShowIncidentModal(false)}
        onSuccess={() => { setShowIncidentModal(false); loadIncidents(5, true); loadIncidentStats(); }} />
    </div>
  );
};

export default Dashboard;