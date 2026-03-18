// src/components/health/OutbreakWarning.jsx
// Disease Outbreak Early Warning System
// CS Concepts: CUSUM (Cumulative Sum) statistical process control,
// EWMA (Exponentially Weighted Moving Average), Geo-clustering, Anomaly detection

import React, { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, Activity, TrendingUp, MapPin, Bell, CheckCircle, Loader, Brain } from 'lucide-react';

const DISEASE_LIST = ['Dengue', 'Influenza', 'Diarrhea', 'COVID-19', 'Typhoid', 'Tuberculosis', 'Measles', 'Chickenpox'];
const ALERT_COLORS = { CRITICAL: '#dc2626', WARNING: '#d97706', WATCH: '#2563eb', NORMAL: '#16a34a' };
const ALERT_BG     = { CRITICAL: '#fef2f2', WARNING: '#fffbeb', WATCH: '#eff6ff', NORMAL: '#f0fdf4' };

/**
 * CUSUM Algorithm (Cumulative Sum Control Chart)
 * Detects when a process has shifted from its baseline mean.
 *
 * C+ = max(0, C+_prev + (x - μ - k))   — detects upward shift
 * where:
 *   x  = current observation (weekly case count)
 *   μ  = baseline mean (historical average)
 *   k  = allowance parameter (typically 0.5 * shift to detect)
 *   h  = decision interval (threshold, typically 4–5)
 *
 * When C+ > h → alarm: case count has significantly exceeded baseline
 */
const runCUSUM = (weeklyCounts, k = 0.5, h = 4) => {
  if (weeklyCounts.length < 2) return { alarm: false, cusumValues: [], level: 'NORMAL' };

  const mean = weeklyCounts.slice(0, -1).reduce((a, b) => a + b, 0) / Math.max(weeklyCounts.slice(0, -1).length, 1);
  const std  = Math.sqrt(weeklyCounts.slice(0, -1).reduce((a, b) => a + (b - mean)**2, 0) / Math.max(weeklyCounts.slice(0, -1).length, 1)) || 1;

  // Normalize k relative to std
  const kAdj = k * std;

  let cusum = 0;
  const cusumValues = [];

  for (const x of weeklyCounts) {
    cusum = Math.max(0, cusum + (x - mean - kAdj));
    cusumValues.push(parseFloat(cusum.toFixed(2)));
  }

  const latest = cusumValues[cusumValues.length - 1];
  const threshold = h * std;

  let level = 'NORMAL';
  if (latest > threshold * 2)     level = 'CRITICAL';
  else if (latest > threshold * 1.5) level = 'WARNING';
  else if (latest > threshold)    level = 'WATCH';

  return { alarm: latest > threshold, cusumValues, level, latest: parseFloat(latest.toFixed(2)), threshold: parseFloat(threshold.toFixed(2)), mean: parseFloat(mean.toFixed(1)) };
};

/**
 * EWMA Algorithm (Exponentially Weighted Moving Average)
 * Smoothed trend that weights recent data more heavily.
 * z_t = λ * x_t + (1-λ) * z_{t-1}   where λ = smoothing factor (0.2)
 */
const runEWMA = (values, lambda = 0.2) => {
  if (!values.length) return [];
  const ewma = [values[0]];
  for (let i = 1; i < values.length; i++) {
    ewma.push(parseFloat((lambda * values[i] + (1 - lambda) * ewma[i-1]).toFixed(2)));
  }
  return ewma;
};

/**
 * Geo-clustering: find which puroks have the most cases
 * Simple frequency clustering — counts per purok
 */
const clusterByPurok = (cases) => {
  const counts = {};
  cases.forEach(c => {
    const p = c.purok || 'Unknown';
    counts[p] = (counts[p] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([purok, count]) => ({ purok, count }))
    .sort((a, b) => b.count - a.count);
};

/**
 * Build weekly case counts from raw case records
 */
const buildWeeklyData = (cases, disease, weeksBack = 8) => {
  const now     = new Date();
  const weeks   = Array.from({ length: weeksBack }, (_, i) => {
    const end   = new Date(now);
    end.setDate(end.getDate() - i * 7);
    const start = new Date(end);
    start.setDate(start.getDate() - 7);
    return { start, end, count: 0, label: `W-${weeksBack - i}` };
  }).reverse();

  const filtered = cases.filter(c => !disease || c.disease === disease);

  filtered.forEach(c => {
    const ts = c.dateOnset || c.createdAt;
    if (!ts) return;
    const d = ts.toDate ? ts.toDate() : new Date(ts.seconds ? ts.seconds * 1000 : ts);
    for (const week of weeks) {
      if (d >= week.start && d < week.end) { week.count++; break; }
    }
  });

  return weeks;
};

// ── Main Component ─────────────────────────────────────────────────────────────
export default function OutbreakWarning({ diseases = [], barangayName = '' }) {
  const [selectedDisease, setSelectedDisease] = useState('All');
  const [aiAdvisory, setAiAdvisory]   = useState('');
  const [loadingAI, setLoadingAI]     = useState(false);
  const [expanded, setExpanded]       = useState(null);

  // Run CUSUM per disease
  const analysisResults = useMemo(() => {
    return DISEASE_LIST.map(disease => {
      const diseaseCases = diseases.filter(c => c.disease === disease);
      const weekly       = buildWeeklyData(diseaseCases, disease, 8);
      const counts       = weekly.map(w => w.count);
      const cusum        = runCUSUM(counts);
      const ewma         = runEWMA(counts);
      const clusters     = clusterByPurok(diseaseCases);
      const activeCases  = diseaseCases.filter(c => c.status === 'Active').length;

      return {
        disease,
        counts,
        weeklyLabels: weekly.map(w => w.label),
        cusum,
        ewma,
        clusters,
        activeCases,
        totalCases: diseaseCases.length,
      };
    }).filter(r => r.totalCases > 0 || r.cusum.level !== 'NORMAL');
  }, [diseases]);

  // Summary counts
  const criticalCount = analysisResults.filter(r => r.cusum.level === 'CRITICAL').length;
  const warningCount  = analysisResults.filter(r => r.cusum.level === 'WARNING').length;
  const watchCount    = analysisResults.filter(r => r.cusum.level === 'WATCH').length;

  // Generate AI health advisory
  const generateAdvisory = async () => {
    setLoadingAI(true);
    setAiAdvisory('');
    try {
      const alerts = analysisResults.filter(r => r.cusum.level !== 'NORMAL');
      if (!alerts.length) { setAiAdvisory('No current disease alerts detected. All disease counts are within normal baseline levels.'); setLoadingAI(false); return; }

      const summary = alerts.map(r =>
        `${r.disease}: ${r.activeCases} active cases, CUSUM=${r.cusum.latest} (threshold=${r.cusum.threshold}), level=${r.cusum.level}, hotspot puroks: ${r.clusters.slice(0,2).map(c=>c.purok).join(', ')}`
      ).join('\n');

      const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 500,
          messages: [
            { role: 'system', content: 'You are a public health advisor for a Philippine barangay. Write a brief, clear health advisory for the barangay captain in professional Filipino-English code-switching style. Max 3 short paragraphs.' },
            { role: 'user', content: `Barangay ${barangayName}. Disease surveillance CUSUM analysis results:\n${summary}\n\nWrite a brief health advisory for the captain to review and send to residents. Include recommended preventive actions.` }
          ]
        })
      });
      const data = await resp.json();
      setAiAdvisory(data.choices?.[0]?.message?.content || 'Unable to generate advisory.');
    } catch (_) {
      setAiAdvisory('Unable to generate AI advisory at this time. Please check the disease data manually and draft an advisory as needed.');
    }
    setLoadingAI(false);
  };

  if (!diseases.length) {
    return (
      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <CheckCircle size={18} color="#16a34a" />
        <div>
          <p style={{ fontWeight: 600, fontSize: 14, color: '#166534', margin: 0 }}>No disease cases recorded</p>
          <p style={{ fontSize: 12, color: '#16a34a', margin: 0 }}>Start logging cases in the Disease Surveillance tab to enable outbreak detection.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Summary stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {[
          ['Total Diseases Tracked', analysisResults.length, '#3b82f6', '#eff6ff'],
          ['Critical Alerts',  criticalCount, '#dc2626', '#fef2f2'],
          ['Warnings',         warningCount,  '#d97706', '#fffbeb'],
          ['Under Watch',      watchCount,    '#2563eb', '#eff6ff'],
        ].map(([l, v, c, bg]) => (
          <div key={l} style={{ background: bg, borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: c }}>{v}</div>
            <div style={{ fontSize: 11, color: c, marginTop: 2, opacity: 0.8 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Algorithm explanation badge */}
      <div style={{ background: '#f5f3ff', border: '1px solid #c4b5fd', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Activity size={15} color="#7c3aed" />
        <span style={{ fontSize: 12, color: '#5b21b6' }}>
          <strong>CUSUM Algorithm</strong> — Cumulative Sum control chart detects when weekly case counts exceed the historical baseline by a statistically significant amount. EWMA smooths noise to show true trends.
        </span>
      </div>

      {/* Disease alert cards */}
      {analysisResults.length === 0 ? (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: 20, textAlign: 'center' }}>
          <CheckCircle size={28} color="#16a34a" style={{ marginBottom: 8 }} />
          <p style={{ color: '#166534', fontWeight: 600, margin: 0 }}>All disease counts are within normal baseline levels</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {analysisResults.map(r => {
            const isExp   = expanded === r.disease;
            const alertC  = ALERT_COLORS[r.cusum.level];
            const alertBg = ALERT_BG[r.cusum.level];
            const maxCount = Math.max(...r.counts, 1);

            return (
              <div key={r.disease} style={{ background: '#fff', border: `1px solid ${alertC}44`, borderRadius: 12, overflow: 'hidden', borderLeft: `4px solid ${alertC}` }}>
                {/* Card header */}
                <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
                  onClick={() => setExpanded(isExp ? null : r.disease)}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: alertBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {r.cusum.level === 'NORMAL' ? <CheckCircle size={18} color={alertC} /> : <AlertTriangle size={18} color={alertC} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{r.disease}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: alertBg, color: alertC }}>
                        {r.cusum.level}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                      {r.activeCases} active · {r.totalCases} total · CUSUM: {r.cusum.latest} (threshold: {r.cusum.threshold})
                    </div>
                  </div>
                  {/* Mini sparkline */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 28 }}>
                    {r.counts.map((c, i) => (
                      <div key={i} style={{ width: 6, borderRadius: 2, background: i === r.counts.length - 1 ? alertC : '#cbd5e1', height: `${Math.max(4, (c / maxCount) * 28)}px`, transition: 'height .3s' }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 18, color: '#94a3b8' }}>{isExp ? '▲' : '▼'}</span>
                </div>

                {/* Expanded detail */}
                {isExp && (
                  <div style={{ padding: '0 16px 16px', borderTop: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>

                      {/* Weekly bar chart */}
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.04em' }}>Weekly Case Count (8 weeks)</p>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 80 }}>
                          {r.counts.map((c, i) => (
                            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                              <span style={{ fontSize: 9, color: '#94a3b8' }}>{c}</span>
                              <div style={{ width: '100%', borderRadius: 3, background: i === r.counts.length - 1 ? alertC : '#dbeafe', height: `${Math.max(4, (c / maxCount) * 60)}px`, transition: 'height .4s' }} />
                              <span style={{ fontSize: 9, color: '#94a3b8' }}>{r.weeklyLabels[i]}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* CUSUM chart */}
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.04em' }}>CUSUM Statistic</p>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 80, position: 'relative' }}>
                          {/* Threshold line */}
                          <div style={{ position: 'absolute', left: 0, right: 0, bottom: `${(r.cusum.threshold / Math.max(...r.cusum.cusumValues, r.cusum.threshold, 0.1)) * 60}px`, height: 1, background: '#ef4444', borderTop: '1px dashed #ef4444', zIndex: 1 }} />
                          {r.cusum.cusumValues.map((v, i) => {
                            const maxV = Math.max(...r.cusum.cusumValues, r.cusum.threshold, 0.1);
                            const pct  = (v / maxV) * 60;
                            const overThresh = v > r.cusum.threshold;
                            return (
                              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                                <span style={{ fontSize: 9, color: overThresh ? alertC : '#94a3b8' }}>{v.toFixed(1)}</span>
                                <div style={{ width: '100%', borderRadius: 3, background: overThresh ? alertC : '#94a3b8', height: `${Math.max(2, pct)}px` }} />
                              </div>
                            );
                          })}
                        </div>
                        <p style={{ fontSize: 10, color: '#ef4444', marginTop: 4 }}>— threshold ({r.cusum.threshold})</p>
                      </div>
                    </div>

                    {/* Purok clusters */}
                    {r.clusters.length > 0 && (
                      <div style={{ marginTop: 12 }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={12} /> Purok/Sitio Hotspots (Geo-clustering)
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {r.clusters.map((c, i) => (
                            <span key={c.purok} style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: i === 0 ? alertBg : '#f1f5f9', color: i === 0 ? alertC : '#475569', border: `1px solid ${i === 0 ? alertC + '44' : 'transparent'}` }}>
                              {c.purok} ({c.count})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Baseline info */}
                    <div style={{ marginTop: 12, background: '#f8fafc', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#475569' }}>
                      Historical baseline mean: <strong>{r.cusum.mean} cases/week</strong> · Current CUSUM: <strong style={{ color: alertC }}>{r.cusum.latest}</strong> · Alert threshold: <strong>{r.cusum.threshold}</strong>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* AI Advisory Generator */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Brain size={16} color="#7c3aed" />
            <span style={{ fontWeight: 600, fontSize: 14 }}>AI Health Advisory Generator</span>
          </div>
          <button className="btn btn-primary btn-sm" onClick={generateAdvisory} disabled={loadingAI}
            style={{ background: 'linear-gradient(135deg,#7c3aed,#3b82f6)', border: 'none' }}>
            {loadingAI ? <><Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> Generating...</> : <><Bell size={13} /> Generate Advisory</>}
          </button>
        </div>
        {aiAdvisory ? (
          <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
            {aiAdvisory}
          </div>
        ) : (
          <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
            Click "Generate Advisory" to create an AI-drafted health bulletin for the Barangay Captain to review and send to residents.
          </p>
        )}
      </div>
    </div>
  );
}