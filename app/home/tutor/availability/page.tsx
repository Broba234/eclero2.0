"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type ApiSlot = { dayOfWeek: number; start: string; end: string };

const DAYS = [
  { label: "Mon", idx: 1 },
  { label: "Tue", idx: 2 },
  { label: "Wed", idx: 3 },
  { label: "Thu", idx: 4 },
  { label: "Fri", idx: 5 },
  { label: "Sat", idx: 6 },
  { label: "Sun", idx: 0 },
];

function generateTimes(start = 7, end = 22, stepMinutes = 30) {
  const out: string[] = [];
  for (let h = start; h <= end; h++) {
    for (let m = 0; m < 60; m += stepMinutes) {
      if (h === end && m > 0) break;
      const hh = String(h).padStart(2, '0');
      const mm = String(m).padStart(2, '0');
      out.push(`${hh}:${mm}`);
    }
  }
  return out; // inclusive start, exclusive end in grouping logic
}

const TIMES = generateTimes(7, 22, 30);

function addMinutes(t: string, minutes: number) {
  const [h, m] = t.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const nh = Math.floor(total / 60);
  const nm = total % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}

export default function TutorAvailability() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [timezone, setTimezone] = useState<string>('UTC');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [email, setEmail] = useState<string>('');

  // Range helper for batch apply
  const [rangeStart, setRangeStart] = useState<string>('09:00');
  const [rangeEnd, setRangeEnd] = useState<string>('17:00');

  const ALLOWED_TZS: { value: string; label: string }[] = [
    { value: 'America/New_York', label: 'ET (Eastern)' },
    { value: 'America/Chicago', label: 'CT (Central)' },
    { value: 'America/Denver', label: 'MT (Mountain)' },
    { value: 'America/Los_Angeles', label: 'PT (Pacific)' },
    { value: 'UTC', label: 'UTC' },
  ];

  function mapSystemTzToAllowed(sysTz: string | undefined): string {
    const s = sysTz || '';
    const map: { re: RegExp; target: string }[] = [
      { re: /^America\/(New_York|Toronto|Detroit|Montreal|Nassau|Indiana|Kentucky|Louisville)/, target: 'America/New_York' },
      { re: /^America\/(Chicago|Winnipeg|Mexico_City|Guatemala|Belize)/, target: 'America/Chicago' },
      { re: /^America\/(Denver|Phoenix|Edmonton)/, target: 'America/Denver' },
      { re: /^America\/(Los_Angeles|Vancouver|Tijuana)/, target: 'America/Los_Angeles' },
    ];
    for (const m of map) if (m.re.test(s)) return m.target;
    return 'UTC';
  }

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email) {
          setLoading(false);
          return;
        }
        setEmail(user.email);
        const res = await fetch(`/api/tutor-availability/get?email=${encodeURIComponent(user.email)}`);
        if (res.ok) {
          const data = await res.json();
          const savedTz: string | undefined = data.timezone;
          const allowedValues = ALLOWED_TZS.map(t => t.value);
          if (savedTz && allowedValues.includes(savedTz)) {
            setTimezone(savedTz);
          } else {
            setTimezone(mapSystemTzToAllowed(Intl.DateTimeFormat().resolvedOptions().timeZone));
          }
          // Mark all 30-min slots covered by intervals as selected
          const next = new Set<string>();
          (data.slots as ApiSlot[]).forEach((s) => {
            let t = s.start;
            while (t < s.end) {
              next.add(`${s.dayOfWeek}-${t}`);
              t = addMinutes(t, 30);
            }
          });
          setSelected(next);
        } else {
          setTimezone(mapSystemTzToAllowed(Intl.DateTimeFormat().resolvedOptions().timeZone));
        }
      } catch (e) {
        setTimezone(mapSystemTzToAllowed(Intl.DateTimeFormat().resolvedOptions().timeZone));
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const toggleCell = (dayIdx: number, time: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      const key = `${dayIdx}-${time}`;
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const toggleDayAll = (dayIdx: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      const allSelected = TIMES.every(t => next.has(`${dayIdx}-${t}`));
      TIMES.forEach(t => {
        const k = `${dayIdx}-${t}`;
        if (allSelected) next.delete(k); else next.add(k);
      });
      return next;
    });
  };

  const applyRangeAllDays = () => {
    if (rangeEnd <= rangeStart) return;
    setSelected(prev => {
      const next = new Set(prev);
      DAYS.forEach(({ idx }) => {
        let t = rangeStart;
        while (t < rangeEnd) {
          next.add(`${idx}-${t}`);
          t = addMinutes(t, 30);
        }
      });
      return next;
    });
  };

  const clearAll = () => setSelected(new Set());

  function buildIntervals(): ApiSlot[] {
    // For each day, merge contiguous 30-min slots
    const out: ApiSlot[] = [];
    DAYS.forEach(({ idx }) => {
      const times = TIMES.filter(t => selected.has(`${idx}-${t}`));
      if (!times.length) return;
      // iterate groups
      let groupStart: string | null = null;
      let prev: string | null = null;
      const flush = () => {
        if (groupStart && prev) {
          out.push({ dayOfWeek: idx, start: groupStart, end: addMinutes(prev, 30) });
        }
        groupStart = null;
        prev = null;
      };
      for (const t of times) {
        if (!groupStart) {
          groupStart = t;
          prev = t;
        } else {
          // check continuity with prev
          const nextOfPrev = addMinutes(prev!, 30);
          if (t === nextOfPrev) {
            prev = t;
          } else {
            flush();
            groupStart = t;
            prev = t;
          }
        }
      }
      flush();
    });
    return out;
  }

  const save = async () => {
    try {
      setSaving(true);
      const slots = buildIntervals();
      const res = await fetch('/api/tutor-availability/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: email, timezone, slots }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt);
      }
      setMessage('Availability saved');
      setTimeout(() => setMessage(''), 2500);
    } catch (e: any) {
      setMessage('Error saving availability');
      setTimeout(() => setMessage(''), 3500);
    } finally {
      setSaving(false);
    }
  };

  const reload = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tutor-availability/get?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        setTimezone(data.timezone || timezone);
        const next = new Set<string>();
        (data.slots as ApiSlot[]).forEach((s) => {
          let t = s.start;
          while (t < s.end) {
            next.add(`${s.dayOfWeek}-${t}`);
            t = addMinutes(t, 30);
          }
        });
        setSelected(next);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-white/90">Loading availability…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Availability</h1>
            <p className="text-gray-300 mt-1">Set your weekly recurring tutoring times.</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-gray-300 text-sm">Timezone</label>
            <select
              value={timezone}
              onChange={e => setTimezone(e.target.value)}
              className="bg-white/10 border border-white/30 text-white rounded-lg px-3 py-2 backdrop-blur-sm"
            >
              {ALLOWED_TZS.map(tz => (
                <option key={tz.value} value={tz.value} className="bg-gray-900">{tz.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-4 sm:p-5" style={{ boxShadow: '0 8px 32px 0 rgba(31,38,135,0.37)' }}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <span className="text-gray-200 text-sm">Range</span>
              <select value={rangeStart} onChange={e => setRangeStart(e.target.value)} className="bg-white/10 border border-white/30 text-white rounded-lg px-2 py-1">
                {TIMES.slice(0, -1).map(t => <option key={t} value={t} className="bg-gray-900">{t}</option>)}
              </select>
              <span className="text-gray-400">→</span>
              <select value={rangeEnd} onChange={e => setRangeEnd(e.target.value)} className="bg-white/10 border border-white/30 text-white rounded-lg px-2 py-1">
                {TIMES.slice(1).map(t => <option key={t} value={t} className="bg-gray-900">{t}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={applyRangeAllDays} className="px-3 py-2 rounded-full text-white bg-white/10 border border-white/30 hover:bg-white/20 transition">Apply to all days</button>
              <button onClick={clearAll} className="px-3 py-2 rounded-full text-gray-200 border border-white/20 hover:bg-white/10 transition">Clear all</button>
            </div>
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <button onClick={reload} className="px-3 py-2 rounded-full text-white bg-white/10 border border-white/30 hover:bg-white/20 transition">Cancel</button>
              <button onClick={save} disabled={saving} className="px-4 py-2 rounded-full text-white font-semibold bg-gradient-to-r from-blue-400 to-purple-500 hover:from-blue-500 hover:to-purple-600 transition disabled:opacity-50">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
          {message && <div className="mt-3 text-sm text-blue-200">{message}</div>}
        </div>

        {/* Grid */}
        <div className="mt-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-2 sm:p-4 overflow-x-auto" style={{ boxShadow: '0 8px 32px 0 rgba(31,38,135,0.37)' }}>
          <div className="min-w-[760px]">
            {/* Header row */}
            <div className="grid" style={{ gridTemplateColumns: `80px repeat(${DAYS.length}, 1fr)` }}>
              <div />
              {DAYS.map(d => (
                <div key={d.idx} className="flex items-center justify-between px-2 py-2">
                  <span className="text-gray-200 font-semibold">{d.label}</span>
                  <button onClick={() => toggleDayAll(d.idx)} className="text-xs text-blue-300 hover:text-purple-300">All</button>
                </div>
              ))}
            </div>

            {/* Time rows */}
            {TIMES.map((t, i) => (
              <div key={t} className="grid items-center" style={{ gridTemplateColumns: `80px repeat(${DAYS.length}, 1fr)` }}>
                <div className="text-right pr-2 py-1 text-xs text-gray-300">{t}</div>
                {DAYS.map(d => {
                  const key = `${d.idx}-${t}`;
                  const isOn = selected.has(key);
                  return (
                    <button
                      key={key}
                      onClick={() => toggleCell(d.idx, t)}
                      className={`h-7 m-1 rounded-lg border transition ${
                        isOn ? 'bg-blue-600/80 border-blue-300 hover:bg-blue-600' : 'bg-white/5 border-white/15 hover:bg-white/10'
                      }`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
