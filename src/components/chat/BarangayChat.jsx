// src/components/chat/BarangayChat.jsx
// NLP Chatbot — understands Filipino, Cebuano, English
// Queries live Firestore data across all modules and answers via Groq/Llama 3
import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Loader, Bot, User, Minimize2, Sparkles } from 'lucide-react';
import { db } from '../../services/firebase';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// ── Fetch relevant context from Firestore based on the user's question ────────
const fetchContext = async (message) => {
  const msg = message.toLowerCase();
  const ctx = {};

  try {
    // Document status queries
    if (msg.includes('clearance') || msg.includes('document') || msg.includes('certificate') ||
        msg.includes('request') || msg.includes('papel') || msg.includes('sertipiko')) {
      const snap = await getDocs(query(collection(db, 'documents'), orderBy('systemInfo.createdAt', 'desc'), limit(20)));
      ctx.documents = snap.docs.map(d => {
        const data = d.data();
        return {
          requestId:    data.requestId,
          type:         data.documentType,
          requester:    data.requester?.name,
          status:       data.status,
          controlNum:   data.document?.controlNumber,
          purpose:      data.purpose,
        };
      });
    }

    // Waste/collection schedule queries
    if (msg.includes('collection') || msg.includes('garbage') || msg.includes('basura') ||
        msg.includes('schedule') || msg.includes('sakop') || msg.includes('purok') ||
        msg.includes('waste') || msg.includes('collect')) {
      const snap = await getDocs(collection(db, 'waste_schedules'));
      ctx.wasteSchedules = snap.docs.map(d => {
        const data = d.data();
        return { type: data.type, purok: data.purok, days: data.days };
      });
    }

    // DRRM / emergency / evacuation queries
    if (msg.includes('evacuation') || msg.includes('emergency') || msg.includes('typhoon') ||
        msg.includes('flood') || msg.includes('shelter') || msg.includes('alert') ||
        msg.includes('likas') || msg.includes('bagyo') || msg.includes('baha')) {
      const alertSnap  = await getDocs(query(collection(db, 'drrm_alerts'),  orderBy('createdAt', 'desc'), limit(5)));
      const centerSnap = await getDocs(collection(db, 'drrm_centers'));
      ctx.alerts  = alertSnap.docs.map(d => ({ ...d.data(), id: d.id }));
      ctx.centers = centerSnap.docs.map(d => {
        const data = d.data();
        return { name: data.name, address: data.address, capacity: data.capacity, status: data.status };
      });
    }

    // Social welfare / aid eligibility
    if (msg.includes('ayuda') || msg.includes('aid') || msg.includes('benefit') ||
        msg.includes('senior') || msg.includes('pwd') || msg.includes('4ps') ||
        msg.includes('eligible') || msg.includes('qualified') || msg.includes('tulong')) {
      const snap = await getDocs(collection(db, 'welfare_programs'));
      ctx.welfarePrograms = snap.docs.map(d => {
        const data = d.data();
        return { name: data.name, aidType: data.aidType, description: data.description, status: data.status };
      });
    }

    // Health / appointments
    if (msg.includes('appointment') || msg.includes('health') || msg.includes('clinic') ||
        msg.includes('nurse') || msg.includes('doctor') || msg.includes('kalusugan') ||
        msg.includes('checkup') || msg.includes('bakuna') || msg.includes('vaccine')) {
      const snap = await getDocs(query(collection(db, 'health_appointments'),
        where('status', '==', 'Scheduled'), orderBy('date', 'asc'), limit(10)));
      ctx.appointments = snap.docs.map(d => {
        const data = d.data();
        return { patient: data.patientName, date: data.date, time: data.time, type: data.type, status: data.status };
      });
    }

    // Announcements
    if (msg.includes('announcement') || msg.includes('notice') || msg.includes('anunsyo') ||
        msg.includes('balita') || msg.includes('news') || msg.includes('advisory')) {
      const snap = await getDocs(query(collection(db, 'announcements'), orderBy('systemInfo.createdAt', 'desc'), limit(5)));
      ctx.announcements = snap.docs.map(d => {
        const data = d.data();
        return { title: data.title, description: data.description, type: data.type, targetGroup: data.targetGroup };
      });
    }

    // Events
    if (msg.includes('event') || msg.includes('meeting') || msg.includes('assembly') ||
        msg.includes('pulong') || msg.includes('aktibidad') || msg.includes('cleanup')) {
      const snap = await getDocs(query(collection(db, 'events'), orderBy('date', 'asc'), limit(10)));
      ctx.events = snap.docs.map(d => {
        const data = d.data();
        return { title: data.title, date: data.date, time: data.time, location: data.location, category: data.category };
      });
    }

  } catch (e) {
    console.warn('[Chatbot] Context fetch error:', e.message);
  }

  return ctx;
};

// ── Call Groq with context ────────────────────────────────────────────────────
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

// ── Suggested questions ───────────────────────────────────────────────────────
const SUGGESTIONS = [
  'Kailan ang garbage collection sa aming sitio?',
  'San na ang aking document request?',
  'Anong mga documents ang pwede i-request?',
  'Sino ang dapat kontakin sa emergency?',
  'Am I eligible for senior citizen aid?',
  'What events are coming up?',
];

// ── Main Component ─────────────────────────────────────────────────────────────
export default function BarangayChat({ barangayName }) {
  const [open,     setOpen]     = useState(false);
  const [messages, setMessages] = useState([]);
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [minimized, setMin]     = useState(false);
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);

  // Greeting on first open
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: `Kumusta! 👋 Ako ang AI assistant ng Barangay ${barangayName || 'e-Barangay'}.\n\nPwede mo akong tanungin sa Filipino, Cebuano, o English tungkol sa:\n• Document requests at status\n• Waste collection schedules\n• Health appointments\n• Emergency/evacuation info\n• Social welfare programs\n• Events at announcements\n\nAno ang maitutulong ko sa iyo?`,
        time: new Date(),
      }]);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (open && !minimized) inputRef.current?.focus();
  }, [open, minimized]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');

    const userMsg = { role: 'user', content: msg, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const context  = await fetchContext(msg);
      const history  = [...messages, userMsg].slice(-10).map(m => ({ role: m.role, content: m.content }));
      const reply    = await askGroq(history, context, barangayName);
      setMessages(prev => [...prev, { role: 'assistant', content: reply, time: new Date() }]);
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, may problema sa connection. Pakisubukan ulit. / Sorry, there was a connection issue. Please try again.',
        time: new Date(),
      }]);
    }
    setLoading(false);
  };

  const fmt = (d) => d?.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      {/* ── Floating bubble ── */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={{
            position: 'fixed', bottom: 28, right: 28, zIndex: 9998,
            width: 58, height: 58, borderRadius: '50%',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 6px 24px rgba(59,130,246,0.45)',
            transition: 'transform .2s, box-shadow .2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(59,130,246,0.55)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)';    e.currentTarget.style.boxShadow = '0 6px 24px rgba(59,130,246,0.45)'; }}
          title="Ask the Barangay AI Assistant"
        >
          <MessageCircle size={26} color="#fff" />
          {/* Pulse ring */}
          <span style={{
            position: 'absolute', inset: -4, borderRadius: '50%',
            border: '2px solid rgba(139,92,246,0.4)',
            animation: 'chatPulse 2s ease-out infinite',
          }} />
        </button>
      )}

      {/* ── Chat window ── */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
          width: 380, borderRadius: 20,
          background: 'var(--color-background-primary)',
          border: '1px solid var(--color-border-tertiary)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
          display: 'flex', flexDirection: 'column',
          height: minimized ? 60 : 560,
          transition: 'height .25s ease',
          overflow: 'hidden',
        }}>

          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            padding: '14px 18px', borderRadius: '20px 20px 0 0',
            display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
          }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={18} color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#fff' }}>Barangay AI Assistant</p>
              <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>Filipino · Cebuano · English</p>
            </div>
            <button onClick={() => setMin(p => !p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.8)', padding: 4 }}>
              <Minimize2 size={16} />
            </button>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.8)', padding: 4 }}>
              <X size={18} />
            </button>
          </div>

          {!minimized && <>
            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* Suggestions — only show if only 1 message (greeting) */}
              {messages.length <= 1 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
                  {SUGGESTIONS.map(s => (
                    <button key={s} onClick={() => send(s)} style={{
                      fontSize: 11, padding: '5px 10px', borderRadius: 20,
                      border: '1px solid var(--color-border-tertiary)',
                      background: 'var(--color-background-secondary)',
                      color: 'var(--color-text-secondary)',
                      cursor: 'pointer', textAlign: 'left',
                      transition: 'background .15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--color-background-secondary)'}>
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, flexDirection: m.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-end' }}>
                  {/* Avatar */}
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: m.role === 'user' ? '#3b82f6' : 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {m.role === 'user' ? <User size={14} color="#fff" /> : <Bot size={14} color="#fff" />}
                  </div>
                  {/* Bubble */}
                  <div style={{
                    maxWidth: '75%',
                    background: m.role === 'user'
                      ? 'linear-gradient(135deg, #3b82f6, #6366f1)'
                      : 'var(--color-background-secondary)',
                    color:  m.role === 'user' ? '#fff' : 'var(--color-text-primary)',
                    borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    padding: '10px 14px',
                    fontSize: 13,
                    lineHeight: 1.55,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}>
                    {m.content}
                    <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4, textAlign: 'right' }}>{fmt(m.time)}</div>
                  </div>
                </div>
              ))}

              {loading && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Bot size={14} color="#fff" />
                  </div>
                  <div style={{ background: 'var(--color-background-secondary)', borderRadius: '18px 18px 18px 4px', padding: '12px 16px', display: 'flex', gap: 4, alignItems: 'center' }}>
                    {[0,1,2].map(i => (
                      <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#94a3b8', display: 'inline-block', animation: `chatDot 1.2s ease-in-out ${i*0.2}s infinite` }} />
                    ))}
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{
              padding: '12px 14px', borderTop: '1px solid var(--color-border-tertiary)',
              display: 'flex', gap: 8, flexShrink: 0,
              background: 'var(--color-background-primary)',
            }}>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder="Magtanong dito... / Ask here..."
                disabled={loading}
                style={{
                  flex: 1, padding: '9px 14px', borderRadius: 24,
                  border: '1.5px solid var(--color-border-tertiary)',
                  background: 'var(--color-background-secondary)',
                  fontSize: 13, color: 'var(--color-text-primary)',
                  outline: 'none',
                }}
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || loading}
                style={{
                  width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                  background: input.trim() ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : '#e2e8f0',
                  border: 'none', cursor: input.trim() ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background .2s',
                }}>
                <Send size={16} color={input.trim() ? '#fff' : '#94a3b8'} />
              </button>
            </div>
          </>}
        </div>
      )}

      <style>{`
        @keyframes chatPulse { 0%{transform:scale(1);opacity:.8} 70%{transform:scale(1.4);opacity:0} 100%{transform:scale(1.4);opacity:0} }
        @keyframes chatDot   { 0%,80%,100%{transform:scale(.6);opacity:.4} 40%{transform:scale(1);opacity:1} }
      `}</style>
    </>
  );
}