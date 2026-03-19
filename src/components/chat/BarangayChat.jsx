// src/components/chat/BarangayChat.jsx
// NLP Chatbot — understands Filipino, Cebuano, English
// Queries live Firestore data across all modules and answers via Groq/Llama 3
import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot, User, Minimize2, Maximize2, Sparkles, Copy, Check, Trash2, ChevronDown } from 'lucide-react';
import { db } from '../../services/firebase';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// ── Fetch relevant context from Firestore ─────────────────────────────────────
const fetchContext = async (message) => {
  const msg = message.toLowerCase();
  const ctx = {};
  try {
    if (msg.includes('clearance') || msg.includes('document') || msg.includes('certificate') ||
        msg.includes('request') || msg.includes('papel') || msg.includes('sertipiko')) {
      const snap = await getDocs(query(collection(db, 'documents'), orderBy('systemInfo.createdAt', 'desc'), limit(20)));
      ctx.documents = snap.docs.map(d => {
        const data = d.data();
        return { requestId: data.requestId, type: data.documentType, requester: data.requester?.name, status: data.status, controlNum: data.document?.controlNumber, purpose: data.purpose };
      });
    }
    if (msg.includes('collection') || msg.includes('garbage') || msg.includes('basura') ||
        msg.includes('schedule') || msg.includes('sakop') || msg.includes('purok') ||
        msg.includes('waste') || msg.includes('collect')) {
      const snap = await getDocs(collection(db, 'waste_schedules'));
      ctx.wasteSchedules = snap.docs.map(d => { const data = d.data(); return { type: data.type, purok: data.purok, days: data.days }; });
    }
    if (msg.includes('evacuation') || msg.includes('emergency') || msg.includes('typhoon') ||
        msg.includes('flood') || msg.includes('shelter') || msg.includes('alert') ||
        msg.includes('likas') || msg.includes('bagyo') || msg.includes('baha')) {
      const alertSnap  = await getDocs(query(collection(db, 'drrm_alerts'),  orderBy('createdAt', 'desc'), limit(5)));
      const centerSnap = await getDocs(collection(db, 'drrm_centers'));
      ctx.alerts  = alertSnap.docs.map(d => ({ ...d.data(), id: d.id }));
      ctx.centers = centerSnap.docs.map(d => { const data = d.data(); return { name: data.name, address: data.address, capacity: data.capacity, status: data.status }; });
    }
    if (msg.includes('ayuda') || msg.includes('aid') || msg.includes('benefit') ||
        msg.includes('senior') || msg.includes('pwd') || msg.includes('4ps') ||
        msg.includes('eligible') || msg.includes('qualified') || msg.includes('tulong')) {
      const snap = await getDocs(collection(db, 'welfare_programs'));
      ctx.welfarePrograms = snap.docs.map(d => { const data = d.data(); return { name: data.name, aidType: data.aidType, description: data.description, status: data.status }; });
    }
    if (msg.includes('appointment') || msg.includes('health') || msg.includes('clinic') ||
        msg.includes('nurse') || msg.includes('doctor') || msg.includes('kalusugan') ||
        msg.includes('checkup') || msg.includes('bakuna') || msg.includes('vaccine')) {
      const snap = await getDocs(query(collection(db, 'health_appointments'), where('status', '==', 'Scheduled'), orderBy('date', 'asc'), limit(10)));
      ctx.appointments = snap.docs.map(d => { const data = d.data(); return { patient: data.patientName, date: data.date, time: data.time, type: data.type, status: data.status }; });
    }
    if (msg.includes('announcement') || msg.includes('notice') || msg.includes('anunsyo') ||
        msg.includes('balita') || msg.includes('news') || msg.includes('advisory')) {
      const snap = await getDocs(query(collection(db, 'announcements'), orderBy('systemInfo.createdAt', 'desc'), limit(5)));
      ctx.announcements = snap.docs.map(d => { const data = d.data(); return { title: data.title, description: data.description, type: data.type, targetGroup: data.targetGroup }; });
    }
    if (msg.includes('event') || msg.includes('meeting') || msg.includes('assembly') ||
        msg.includes('pulong') || msg.includes('aktibidad') || msg.includes('cleanup')) {
      const snap = await getDocs(query(collection(db, 'events'), orderBy('date', 'asc'), limit(10)));
      ctx.events = snap.docs.map(d => { const data = d.data(); return { title: data.title, date: data.date, time: data.time, location: data.location, category: data.category }; });
    }
  } catch (e) {
    console.warn('[Chatbot] Context fetch error:', e.message);
  }
  return ctx;
};

// ── Call Groq ─────────────────────────────────────────────────────────────────
const askGroq = async (messages, context, barangayName) => {
  const contextStr = Object.keys(context).length > 0
    ? '\n\nLIVE BARANGAY DATA:\n' + JSON.stringify(context, null, 2)
    : '';

  const system = `You are the official AI assistant of Barangay ${barangayName || 'e-Barangay'}, Cebu City, Philippines.
You help residents and barangay staff with questions about documents, waste collection, health services, DRRM, social welfare, events, and announcements.

RULES:
- Answer in the SAME language the user uses (Filipino, Cebuano, or English). If they mix languages, match their style.
- Be concise, friendly, and helpful. Use po/opo naturally in Filipino responses.
- Use the live barangay data provided below to give accurate, specific answers.
- For document status: look up the requester's name or request ID in the documents data.
- For waste schedules: find which purok/sitio and what days collection happens.
- For emergencies: provide evacuation center info and alert status.
- If you don't know something specific, be honest and suggest they visit the barangay hall or call the hotline.
- Never make up document statuses, names, or data that isn't in the context.
- Keep responses under 3 short paragraphs unless the question requires more detail.
${contextStr}`;

  const resp = await fetch(GROQ_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}` },
    body: JSON.stringify({
      model:       'llama-3.3-70b-versatile',
      max_tokens:  600,
      temperature: 0.4,
      messages:    [{ role: 'system', content: system }, ...messages],
    }),
  });
  const data = await resp.json();
  return data.choices?.[0]?.message?.content || 'Sorry, I could not process your request right now.';
};

// ── Quick suggestion chips ────────────────────────────────────────────────────
const SUGGESTIONS = [
  { label: '📄 Document status',       text: 'San na ang aking document request?' },
  { label: '🗑️ Garbage schedule',      text: 'Kailan ang garbage collection sa aming sitio?' },
  { label: '🚨 Emergency contacts',    text: 'Sino ang dapat kontakin sa emergency?' },
  { label: '💊 Health appointment',    text: 'Paano mag-schedule ng health checkup?' },
  { label: '📢 Latest announcements',  text: 'Anong mga balita ang latest?' },
  { label: '📅 Upcoming events',       text: 'What events are coming up?' },
];

// ── Render simple markdown (bold, bullet) ────────────────────────────────────
const RenderMessage = ({ text }) => (
  <div>
    {text.split('\n').map((line, i) => {
      const parts = line.split(/\*\*(.*?)\*\*/g);
      const nodes = parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p);
      const isBullet = line.trimStart().startsWith('•') || line.trimStart().startsWith('-');
      return (
        <div key={i} style={{ marginTop: i > 0 && line === '' ? 6 : 1, display: isBullet ? 'flex' : 'block', gap: isBullet ? 6 : 0 }}>
          {isBullet && <span style={{ opacity: 0.5, flexShrink: 0 }}>•</span>}
          <span>{isBullet ? nodes.map((n, j) => typeof n === 'string' ? n.replace(/^[•\-]\s*/, '') : n) : nodes}</span>
        </div>
      );
    })}
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────
export default function BarangayChat({ barangayName }) {
  const [open,      setOpen]      = useState(false);
  const [messages,  setMessages]  = useState([]);
  const [input,     setInput]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [minimized, setMin]       = useState(false);
  const [copiedId,  setCopiedId]  = useState(null);
  const [unread,    setUnread]    = useState(0);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  // Greeting on first open
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        id: 0, role: 'assistant', time: new Date(),
        content: `Kumusta! 👋 Ako ang AI assistant ng Barangay ${barangayName || 'e-Barangay'}.\n\nPwede mo akong tanungin sa **Filipino**, **Cebuano**, o **English** tungkol sa:\n• Document requests at status\n• Waste collection schedules\n• Health appointments\n• Emergency/evacuation info\n• Social welfare programs\n• Events at announcements\n\nAno ang maitutulong ko sa iyo?`,
      }]);
      setUnread(0);
    }
    if (open) setUnread(0);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (open && !minimized) setTimeout(() => inputRef.current?.focus(), 80);
  }, [open, minimized]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');

    const userMsg = { id: Date.now(), role: 'user', content: msg, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const context = await fetchContext(msg);
      const history = [...messages, userMsg].slice(-10).map(m => ({ role: m.role, content: m.content }));
      const reply   = await askGroq(history, context, barangayName);
      const botMsg  = { id: Date.now() + 1, role: 'assistant', content: reply, time: new Date() };
      setMessages(prev => [...prev, botMsg]);
      if (!open || minimized) setUnread(n => n + 1);
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now() + 1, role: 'assistant', time: new Date(),
        content: 'Sorry, may problema sa connection. Pakisubukan ulit.\nSorry, there was a connection issue. Please try again.',
      }]);
    }
    setLoading(false);
  };

  const copyMsg = (id, content) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    setMessages([]);
    setTimeout(() => {
      setMessages([{
        id: 0, role: 'assistant', time: new Date(),
        content: `Chat cleared! Kumusta ulit! Paano kita matutulungan?`,
      }]);
    }, 50);
  };

  const fmt = (d) => d?.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      {/* ── Launcher Button ── */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          title="Ask the Barangay AI Assistant"
          style={{
            position: 'fixed', bottom: 28, right: 28, zIndex: 9998,
            width: 56, height: 56, borderRadius: '50%',
            background: 'linear-gradient(145deg, #2563eb, #7c3aed)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(37,99,235,0.5), 0 2px 8px rgba(0,0,0,0.2)',
            transition: 'transform .2s ease, box-shadow .2s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(37,99,235,0.6), 0 3px 12px rgba(0,0,0,0.2)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)';   e.currentTarget.style.boxShadow = '0 4px 20px rgba(37,99,235,0.5), 0 2px 8px rgba(0,0,0,0.2)'; }}
        >
          <MessageCircle size={24} color="#fff" />
          {/* Pulse ring */}
          <span style={{ position: 'absolute', inset: -5, borderRadius: '50%', border: '2px solid rgba(99,102,241,0.35)', animation: 'brg-pulse 2.4s ease-out infinite' }} />
          {/* Unread badge */}
          {unread > 0 && (
            <span style={{
              position: 'absolute', top: -4, right: -4,
              width: 20, height: 20, borderRadius: '50%',
              background: '#ef4444', color: '#fff',
              fontSize: 11, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid #fff',
            }}>{unread}</span>
          )}
        </button>
      )}

      {/* ── Chat Window ── */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
          width: 380,
          height: minimized ? 64 : 580,
          borderRadius: 20,
          background: 'var(--color-background-primary, #ffffff)',
          border: '1px solid rgba(0,0,0,0.08)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.16), 0 4px 16px rgba(0,0,0,0.08)',
          display: 'flex', flexDirection: 'column',
          transition: 'height .28s cubic-bezier(.4,0,.2,1)',
          overflow: 'hidden',
          fontFamily: '"DM Sans", system-ui, sans-serif',
        }}>

          {/* ── Header ── */}
          <div style={{
            background: 'linear-gradient(135deg, #1d4ed8 0%, #6d28d9 100%)',
            padding: '0 16px',
            height: 64,
            display: 'flex', alignItems: 'center', gap: 10,
            flexShrink: 0,
            borderRadius: minimized ? 20 : '20px 20px 0 0',
          }}>
            {/* Avatar */}
            <div style={{
              width: 38, height: 38, borderRadius: '50%',
              background: 'rgba(255,255,255,0.18)',
              backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, border: '1.5px solid rgba(255,255,255,0.25)',
            }}>
              <Sparkles size={17} color="#fff" />
            </div>

            {/* Title */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>
                Barangay AI Assistant
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 0 2px rgba(74,222,128,.3)', display: 'inline-block' }} />
                <p style={{ margin: 0, fontSize: 10.5, color: 'rgba(255,255,255,0.75)' }}>Online · Fil · Ceb · Eng</p>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 2 }}>
              <button onClick={clearChat} title="Clear chat" style={headerBtnStyle}>
                <Trash2 size={14} />
              </button>
              <button onClick={() => setMin(p => !p)} title={minimized ? 'Expand' : 'Minimize'} style={headerBtnStyle}>
                {minimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
              </button>
              <button onClick={() => { setOpen(false); setMin(false); }} title="Close" style={{ ...headerBtnStyle, marginLeft: 2 }}>
                <X size={16} />
              </button>
            </div>
          </div>

          {/* ── Body (hidden when minimized) ── */}
          {!minimized && (
            <>
              {/* Messages */}
              <div style={{
                flex: 1, overflowY: 'auto', padding: '14px 14px 6px',
                display: 'flex', flexDirection: 'column', gap: 2,
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(0,0,0,0.12) transparent',
              }}>

                {/* Suggestion chips — only on greeting */}
                {messages.length <= 1 && (
                  <div style={{ marginBottom: 10 }}>
                    <p style={{ fontSize: 10.5, color: 'var(--color-text-tertiary, #94a3b8)', margin: '0 0 6px 2px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Quick questions
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {SUGGESTIONS.map(s => (
                        <button
                          key={s.text}
                          onClick={() => send(s.text)}
                          style={{
                            fontSize: 11.5, padding: '5px 11px', borderRadius: 20,
                            border: '1.5px solid rgba(37,99,235,0.18)',
                            background: 'rgba(37,99,235,0.05)',
                            color: '#2563eb',
                            cursor: 'pointer', fontWeight: 500,
                            transition: 'all .15s',
                            fontFamily: 'inherit',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(37,99,235,0.12)'; e.currentTarget.style.borderColor = 'rgba(37,99,235,0.4)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(37,99,235,0.05)'; e.currentTarget.style.borderColor = 'rgba(37,99,235,0.18)'; }}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Message list */}
                {messages.map((m, idx) => {
                  const isUser = m.role === 'user';
                  const isLastBot = !isUser && idx === messages.length - 1;
                  return (
                    <div
                      key={m.id}
                      style={{
                        display: 'flex',
                        flexDirection: isUser ? 'row-reverse' : 'row',
                        alignItems: 'flex-end',
                        gap: 8,
                        marginBottom: 10,
                        animation: 'brg-fadein .22s ease',
                      }}
                    >
                      {/* Avatar dot */}
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                        background: isUser
                          ? 'linear-gradient(135deg, #3b82f6, #6366f1)'
                          : 'linear-gradient(135deg, #1d4ed8, #7c3aed)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.14)',
                      }}>
                        {isUser ? <User size={13} color="#fff" /> : <Bot size={13} color="#fff" />}
                      </div>

                      <div style={{ maxWidth: '78%', display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', gap: 3 }}>
                        {/* Bubble */}
                        <div style={{
                          padding: '10px 14px',
                          borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                          background: isUser
                            ? 'linear-gradient(135deg, #2563eb, #4f46e5)'
                            : 'var(--color-background-secondary, #f8fafc)',
                          color: isUser ? '#fff' : 'var(--color-text-primary, #0f172a)',
                          fontSize: 13, lineHeight: 1.6,
                          border: isUser ? 'none' : '1px solid rgba(0,0,0,0.07)',
                          boxShadow: isUser
                            ? '0 2px 12px rgba(37,99,235,.28)'
                            : '0 1px 4px rgba(0,0,0,.06)',
                          wordBreak: 'break-word',
                        }}>
                          <RenderMessage text={m.content} />
                        </div>

                        {/* Timestamp + copy */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: isUser ? 0 : 2, paddingRight: isUser ? 2 : 0 }}>
                          <span style={{ fontSize: 10, color: 'var(--color-text-tertiary, #94a3b8)' }}>{fmt(m.time)}</span>
                          {!isUser && (
                            <button
                              onClick={() => copyMsg(m.id, m.content)}
                              title="Copy"
                              style={{
                                background: 'none', border: 'none', cursor: 'pointer', padding: '1px 4px',
                                borderRadius: 4, display: 'flex', alignItems: 'center', gap: 3,
                                fontSize: 10, color: copiedId === m.id ? '#10b981' : 'var(--color-text-tertiary, #94a3b8)',
                                transition: 'color .15s',
                              }}
                            >
                              {copiedId === m.id ? <Check size={10} /> : <Copy size={10} />}
                              {copiedId === m.id ? 'Copied' : 'Copy'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Typing indicator */}
                {loading && (
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 10, animation: 'brg-fadein .22s ease' }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Bot size={13} color="#fff" />
                    </div>
                    <div style={{ padding: '12px 16px', borderRadius: '4px 16px 16px 16px', background: 'var(--color-background-secondary, #f8fafc)', border: '1px solid rgba(0,0,0,0.07)', display: 'flex', gap: 5, alignItems: 'center' }}>
                      {[0, 1, 2].map(i => (
                        <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#94a3b8', display: 'inline-block', animation: `brg-dot 1.3s ease-in-out ${i * 0.18}s infinite` }} />
                      ))}
                    </div>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              {/* Scroll-to-bottom hint (subtle) */}
              <div style={{ height: 1, background: 'var(--color-border-tertiary, rgba(0,0,0,0.06))', flexShrink: 0 }} />

              {/* ── Input area ── */}
              <div style={{ padding: '10px 12px 14px', flexShrink: 0, background: 'var(--color-background-primary, #fff)' }}>
                <div style={{
                  display: 'flex', alignItems: 'flex-end', gap: 8,
                  background: 'var(--color-background-secondary, #f8fafc)',
                  border: '1.5px solid rgba(0,0,0,0.09)',
                  borderRadius: 14, padding: '6px 6px 6px 14px',
                  transition: 'border-color .2s, box-shadow .2s',
                }}
                  onFocusCapture={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
                  onBlurCapture={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.09)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => {
                      setInput(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px';
                    }}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                    placeholder="Magtanong dito... / Ask here..."
                    disabled={loading}
                    rows={1}
                    style={{
                      flex: 1, border: 'none', background: 'transparent',
                      resize: 'none', outline: 'none',
                      fontSize: 13, color: 'var(--color-text-primary, #0f172a)',
                      lineHeight: 1.5, padding: '6px 0',
                      fontFamily: 'inherit',
                      minHeight: 32, maxHeight: 96,
                      overflowY: 'hidden',
                    }}
                  />
                  <button
                    onClick={() => send()}
                    disabled={!input.trim() || loading}
                    style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: input.trim() && !loading
                        ? 'linear-gradient(135deg, #2563eb, #4f46e5)'
                        : 'rgba(0,0,0,0.07)',
                      border: 'none',
                      cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all .2s',
                      boxShadow: input.trim() && !loading ? '0 2px 8px rgba(37,99,235,0.35)' : 'none',
                    }}
                    onMouseEnter={e => { if (input.trim() && !loading) e.currentTarget.style.transform = 'scale(1.06)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    <Send size={15} color={input.trim() && !loading ? '#fff' : '#94a3b8'} style={{ marginLeft: 1 }} />
                  </button>
                </div>
                <p style={{ margin: '6px 2px 0', fontSize: 10, color: 'var(--color-text-tertiary, #94a3b8)', textAlign: 'center' }}>
                  Powered by Llama 3 via Groq · Press Enter to send
                </p>
              </div>
            </>
          )}
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes brg-pulse  { 0%{transform:scale(1);opacity:.7} 70%{transform:scale(1.5);opacity:0} 100%{transform:scale(1.5);opacity:0} }
        @keyframes brg-dot    { 0%,80%,100%{transform:scale(.5);opacity:.3} 40%{transform:scale(1);opacity:1} }
        @keyframes brg-fadein { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </>
  );
}

// Small helper for header icon buttons
const headerBtnStyle = {
  background: 'rgba(255,255,255,0.12)',
  border: 'none', cursor: 'pointer',
  width: 28, height: 28, borderRadius: 8,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: 'rgba(255,255,255,0.85)',
  transition: 'background .15s',
  padding: 0,
};