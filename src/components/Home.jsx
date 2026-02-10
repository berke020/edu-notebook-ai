import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Plus, History, User, ArrowRight, Search, CheckCircle, Users, GraduationCap, Briefcase, Flame, Calendar, Folder, BarChart3 } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

export default function Home({ onLogout }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);
  const [query, setQuery] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [newCourseName, setNewCourseName] = useState('');
  const [events, setEvents] = useState([]);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [stats, setStats] = useState({ streak: 0, level: 'Çırak Araştırmacı', quizCorrect: 0, quizTotal: 0, lastActivity: null });
  const [statsLoaded, setStatsLoaded] = useState(false);
  const [communityNotes, setCommunityNotes] = useState([]);
  const [profile, setProfile] = useState(null);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDate, setGoalDate] = useState('');
  const [goalPlan, setGoalPlan] = useState(null);
  const [quizTrend, setQuizTrend] = useState([]);
  const [weakTopics, setWeakTopics] = useState([]);
  const [communityQuery, setCommunityQuery] = useState('');
  const [sessionTagDrafts, setSessionTagDrafts] = useState({});
  const [sessionTags, setSessionTags] = useState({});
  const [selectedDay, setSelectedDay] = useState(null);
  const [dayEvents, setDayEvents] = useState([]);
  const [profileDraft, setProfileDraft] = useState({
    full_name: '',
    role_label: '',
    education_level: 'university',
    institution: '',
    department: '',
    goal: '',
    focus_topics: '',
    weekly_goal_hours: 6,
    daily_goal_minutes: 45,
    study_style: 'karma',
    favorite_tools: [],
    pomodoro_work: 25,
    pomodoro_break: 5,
    reminder_pref: 'sessiz'
  });
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const [categoryConfig, setCategoryConfig] = useState({
    jury: {
      cadence: 'Haftalık',
      mode: 'Online',
      recording: true,
      panelists: Array.from({ length: 4 }, () => ({
        name: '',
        role: '',
        demeanor: '',
        focus: '',
        notes: ''
      }))
    },
    thesis: {
      advisorName: '',
      advisorTone: '',
      panelists: Array.from({ length: 3 }, () => ({
        name: '',
        role: '',
        demeanor: '',
        focus: '',
        notes: ''
      })),
      defenseFormat: 'Yüz Yüze'
    },
    meeting: {
      organizer: '',
      goal: '',
      attendees: Array.from({ length: 5 }, () => ({
        name: '',
        role: '',
        demeanor: '',
        notes: ''
      })),
      hasRecording: false
    }
  });

  useEffect(() => {
    const init = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const currentUser = userData?.user || null;
      setUser(currentUser);
      try {
        const goalKey = `goal_plan_${currentUser?.id || 'anon'}`;
        const storedGoal = JSON.parse(localStorage.getItem(goalKey) || 'null');
        if (storedGoal) {
          setGoalTitle(storedGoal.title || '');
          setGoalDate(storedGoal.date || '');
          setGoalPlan(storedGoal);
        }
        const quizKey = `quiz_history_${currentUser?.id || 'anon'}`;
        const trend = JSON.parse(localStorage.getItem(quizKey) || '[]');
        setQuizTrend(trend.slice(-7));
        const weakKey = `weak_topics_${currentUser?.id || 'anon'}`;
        const weak = JSON.parse(localStorage.getItem(weakKey) || '{}');
        const entries = Object.entries(weak).sort((a, b) => b[1] - a[1]).slice(0, 6);
        setWeakTopics(entries);
      } catch {}

      const fetchRecent = async () => {
        let data = null;
        let error = null;
        if (currentUser?.id) {
          const res = await supabase
            .from('chat_sessions')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false })
            .limit(50);
          data = res.data;
          error = res.error;
        }
        if (error || !currentUser?.id) {
          const res = await supabase
            .from('chat_sessions')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);
          data = res.data;
          error = res.error;
        }
        if (!error) {
          setRecentSessions(data || []);
          const dbTags = {};
          (data || []).forEach(s => {
            if (s.tags && Array.isArray(s.tags)) dbTags[s.id] = s.tags;
          });
          setSessionTags(prev => ({ ...dbTags, ...prev }));
        }
      };

      const fetchCourses = async () => {
        let data = null;
        let error = null;
        if (currentUser?.id) {
          const res = await supabase.from('courses').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false });
          data = res.data;
          error = res.error;
        }
        if (error || !currentUser?.id) {
          const res = await supabase.from('courses').select('*').order('created_at', { ascending: false });
          data = res.data;
          error = res.error;
        }
        if (!error) setCourses(data || []);
        else {
          const local = JSON.parse(localStorage.getItem('local_courses') || '[]');
          setCourses(local);
        }
      };

      const fetchEvents = async () => {
        let data = null;
        let error = null;
        if (currentUser?.id) {
          const res = await supabase.from('events').select('*').eq('user_id', currentUser.id).order('event_date', { ascending: true }).limit(6);
          data = res.data;
          error = res.error;
        }
        if (error || !currentUser?.id) {
          const res = await supabase.from('events').select('*').order('event_date', { ascending: true }).limit(6);
          data = res.data;
          error = res.error;
        }
        if (!error) setEvents(data || []);
        else {
          const local = JSON.parse(localStorage.getItem('local_events') || '[]');
          setEvents(local);
        }
      };

      const fetchStats = async () => {
        let data = null;
        let error = null;
        if (currentUser?.id) {
          const res = await supabase.from('user_stats').select('*').eq('user_id', currentUser.id).maybeSingle();
          data = res.data;
          error = res.error;
        }
        if (error || !currentUser?.id) {
          const res = await supabase.from('user_stats').select('*').eq('id', 1).maybeSingle();
          data = res.data;
          error = res.error;
        }
        if (data) {
          setStats({
            streak: data.streak || 0,
            level: data.level || 'Çırak Araştırmacı',
            quizCorrect: data.quiz_correct || 0,
            quizTotal: data.quiz_total || 0,
            lastActivity: data.last_activity || null
          });
          setStatsLoaded(true);
        } else {
          setStatsLoaded(false);
        }
      };

      const fetchCommunityNotes = async () => {
        const { data, error } = await supabase
          .from('community_notes')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(6);
        if (!error && data) setCommunityNotes(data || []);
        else {
          const local = JSON.parse(localStorage.getItem('community_notes') || '[]');
          setCommunityNotes(local);
        }
      };

      const fetchProfile = async () => {
        if (!currentUser?.id) return;
        const { data } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', currentUser.id)
          .maybeSingle();
        if (data) {
          setProfile(data);
          setProfileDraft({
            full_name: data.full_name || '',
            role_label: data.role_label || '',
            education_level: data.education_level || 'university',
            institution: data.institution || '',
            department: data.department || '',
            goal: data.goal || '',
            focus_topics: data.focus_topics || '',
            weekly_goal_hours: data.weekly_goal_hours || 6,
            daily_goal_minutes: data.daily_goal_minutes || 45,
            study_style: data.study_style || 'karma',
            favorite_tools: data.favorite_tools || [],
            pomodoro_work: data.pomodoro_work || 25,
            pomodoro_break: data.pomodoro_break || 5,
            reminder_pref: data.reminder_pref || 'sessiz'
          });
        } else {
          setProfile(null);
          setProfileDraft(prev => ({
            ...prev,
            full_name: currentUser.user_metadata?.full_name || '',
            role_label: ''
          }));
        }
      };

      await Promise.all([fetchRecent(), fetchCourses(), fetchEvents(), fetchStats(), fetchCommunityNotes(), fetchProfile()]);
    };
    init();
  }, []);

  useEffect(() => {
    if (statsLoaded) return;
    const days = new Set((recentSessions || []).map(s => new Date(s.created_at).toDateString()));
    const streak = days.size;
    setStats(prev => ({ ...prev, streak }));
  }, [recentSessions, statsLoaded]);

  useEffect(() => {
    try {
      const key = `quiz_history_${user?.id || 'anon'}`;
      const trend = JSON.parse(localStorage.getItem(key) || '[]');
      setQuizTrend(trend.slice(-7));
      const weakKey = `weak_topics_${user?.id || 'anon'}`;
      const weak = JSON.parse(localStorage.getItem(weakKey) || '{}');
      const entries = Object.entries(weak).sort((a, b) => b[1] - a[1]).slice(0, 6);
      setWeakTopics(entries);
    } catch {}
  }, [stats.quizTotal, user]);

  const courseMap = useMemo(() => {
    const map = new Map();
    courses.forEach(c => map.set(c.id, c));
    return map;
  }, [courses]);

  const filteredSessions = recentSessions.filter(s =>
    (!selectedCourseId || s.course_id === selectedCourseId) &&
    (s.title || '').toLowerCase().includes(query.toLowerCase())
  );
  const lastSession = recentSessions[0];

  const courseSessionCounts = useMemo(() => {
    const counts = new Map();
    recentSessions.forEach(s => {
      const key = s.course_id || 'general';
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return counts;
  }, [recentSessions]);

  const nextEvent = useMemo(() => {
    const upcoming = (events || [])
      .map(e => ({ ...e, date: new Date(e.event_date) }))
      .filter(e => !Number.isNaN(e.date.getTime()))
      .sort((a, b) => a.date - b.date)
      .find(e => e.date >= new Date());
    return upcoming || null;
  }, [events]);

  const formatRelative = (dateStr) => {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '';
    const diff = Math.ceil((d.getTime() - Date.now()) / 86400000);
    if (diff === 0) return 'bugün';
    if (diff === 1) return 'yarın';
    if (diff < 0) return `${Math.abs(diff)} gün önce`;
    return `${diff} gün sonra`;
  };

  const miniCalendar = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const first = new Date(year, month, 1);
    const startDay = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    return { cells, monthLabel: now.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }) };
  }, [events]);

  const eventDates = useMemo(() => {
    const set = new Set();
    events.forEach(ev => {
      const key = new Date(ev.event_date).toDateString();
      set.add(key);
    });
    return set;
  }, [events]);

  const filteredCommunityNotes = useMemo(() => {
    if (!communityQuery.trim()) return communityNotes;
    return communityNotes.filter(note => communityNoteText(note).toLowerCase().includes(communityQuery.toLowerCase()));
  }, [communityNotes, communityQuery]);

  useEffect(() => {
    try {
      const key = `session_tags_${user?.id || 'anon'}`;
      const stored = JSON.parse(localStorage.getItem(key) || '{}');
      if (stored && Object.keys(stored).length > 0) {
        setSessionTags(prev => ({ ...stored, ...prev }));
      }
    } catch {}
  }, [user?.id]);

  const saveSessionTags = async (sessionId) => {
    const raw = sessionTagDrafts[sessionId] || '';
    const tags = raw.split(',').map(t => t.trim()).filter(Boolean);
    const next = { ...sessionTags, [sessionId]: tags };
    setSessionTags(next);
    try {
      const key = `session_tags_${user?.id || 'anon'}`;
      localStorage.setItem(key, JSON.stringify(next));
    } catch {}
    await persistSessionTags(sessionId, tags);
  };

  const persistSessionTags = async (sessionId, tags) => {
    try {
      await supabase.from('chat_sessions').update({ tags }).eq('id', sessionId);
    } catch {}
  };

  const buildGoalPlan = () => {
    if (!goalTitle.trim() || !goalDate) return;
    const target = new Date(goalDate);
    const today = new Date();
    const diffDays = Math.max(1, Math.ceil((target.getTime() - today.getTime()) / 86400000));
    const steps = [];
    const labels = [
      'Kaynakları topla ve incele',
      'Özet çıkar ve ana kavramları belirle',
      'Quiz çöz ve yanlışlara dön',
      'Kavram haritası ve mnemonikler üret',
      'Sınav/deneme simülasyonu yap'
    ];
    const total = Math.min(diffDays, 7);
    for (let i = 0; i < total; i++) {
      const label = labels[i % labels.length];
      steps.push(`Gün ${i + 1}: ${label}`);
    }
    const plan = { title: goalTitle.trim(), date: goalDate, days: diffDays, steps };
    setGoalPlan(plan);
    try {
      const key = `goal_plan_${user?.id || 'anon'}`;
      localStorage.setItem(key, JSON.stringify(plan));
    } catch {}
  };

  const addCourse = async () => {
    if (!newCourseName.trim()) return;
    const payload = { name: newCourseName.trim() };
    if (user?.id) payload.user_id = user.id;
    let { data, error } = await supabase.from('courses').insert([payload]).select().single();
    if (error && user?.id) {
      delete payload.user_id;
      const res = await supabase.from('courses').insert([payload]).select().single();
      data = res.data;
      error = res.error;
    }
    if (!error && data) {
      setCourses(prev => [data, ...prev]);
      setNewCourseName('');
    } else {
      const local = { id: `local-${Date.now()}`, name: newCourseName.trim() };
      const next = [local, ...courses];
      localStorage.setItem('local_courses', JSON.stringify(next));
      setCourses(next);
      setNewCourseName('');
    }
  };

  const addEvent = async () => {
    if (!newEventTitle.trim() || !newEventDate) return;
    const payload = { title: newEventTitle.trim(), event_date: newEventDate, course_id: selectedCourseId || null };
    if (user?.id) payload.user_id = user.id;
    let { data, error } = await supabase.from('events').insert([payload]).select().single();
    if (error && user?.id) {
      delete payload.user_id;
      const res = await supabase.from('events').insert([payload]).select().single();
      data = res.data;
      error = res.error;
    }
    if (!error && data) {
      setEvents(prev => [...prev, data].sort((a,b) => new Date(a.event_date) - new Date(b.event_date)));
      setNewEventTitle('');
      setNewEventDate('');
    } else {
      const local = { id: `local-${Date.now()}`, title: newEventTitle.trim(), event_date: newEventDate, course_id: selectedCourseId || null };
      const next = [...events, local].sort((a,b) => new Date(a.event_date) - new Date(b.event_date));
      localStorage.setItem('local_events', JSON.stringify(next));
      setEvents(next);
      setNewEventTitle('');
      setNewEventDate('');
    }
  };

  const closeDayModal = () => {
    setSelectedDay(null);
    setDayEvents([]);
  };

  const filtered = filteredSessions;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const categories = [
    { id: 'primary', label: 'İlk-Orta Okul', desc: 'Temel öğrenme, sade anlatım', icon: GraduationCap },
    { id: 'highschool', label: 'Lise', desc: 'Ders odaklı çalışma', icon: BookOpen },
    { id: 'university', label: 'Üniversite', desc: 'Derin içerik, akademik', icon: Briefcase },
    { id: 'jury', label: 'Jüri', desc: 'Sunum + jüri simülasyonu', icon: Users },
    { id: 'thesis', label: 'Tez Savunma', desc: 'Savunma simülasyonu', icon: Users },
    { id: 'meeting', label: 'Toplantı', desc: 'Toplantı simülasyonu', icon: Users }
  ];

  const isSchoolCategory = (id) => ['primary', 'highschool', 'university'].includes(id);
  const canStart = !!selectedCategory;
  const todayStr = new Date().toISOString().slice(0, 10);
  const streakAtRisk = stats.lastActivity && stats.lastActivity !== todayStr;

  const profileName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')?.[0] || 'Kullanıcı';
  const planLabel = (user?.app_metadata?.plan || user?.user_metadata?.plan || 'BASIC').toString().toUpperCase();
  const categoryMeta = {
    primary: { label: 'İlk-Orta Okul', role: 'Öğrenci' },
    highschool: { label: 'Lise', role: 'Öğrenci' },
    university: { label: 'Üniversite', role: 'Üniversite Öğrencisi' },
    jury: { label: 'Jüri', role: 'Sunum Hazırlığı' },
    thesis: { label: 'Tez Savunma', role: 'Araştırmacı' },
    meeting: { label: 'Toplantı', role: 'Profesyonel' }
  };
  const categoryCounts = useMemo(() => {
    return (recentSessions || []).reduce((acc, s) => {
      const key = s.category_id || 'university';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }, [recentSessions]);
  const weeklyCategoryCounts = useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return (recentSessions || []).reduce((acc, s) => {
      if (new Date(s.created_at).getTime() < cutoff) return acc;
      const key = s.category_id || 'university';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }, [recentSessions]);
  const topCategories = useMemo(() => {
    return Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]).map(([id]) => id);
  }, [categoryCounts]);
  const primaryCategory = topCategories[0] || 'university';
  const roleLabel = profile?.role_label || categoryMeta[primaryCategory]?.role || 'Öğrenci';
  const focusText = (profile?.focus_topics && profile.focus_topics.trim().length > 0)
    ? profile.focus_topics
    : topCategories.length > 0
    ? topCategories.slice(0, 3).map(id => categoryMeta[id]?.label || id).join(', ')
    : 'Genel Öğrenme';
  const weeklyCount = useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return (recentSessions || []).filter(s => new Date(s.created_at).getTime() >= cutoff).length;
  }, [recentSessions]);
  const topWeeklyCategory = useMemo(() => {
    const entries = Object.entries(weeklyCategoryCounts).sort((a, b) => b[1] - a[1]);
    return entries[0] ? { id: entries[0][0], count: entries[0][1] } : null;
  }, [weeklyCategoryCounts]);
  const profileSummary = topWeeklyCategory
    ? `Bu hafta ${categoryMeta[topWeeklyCategory.id]?.label || topWeeklyCategory.id} odağında ${topWeeklyCategory.count} çalışma yaptın.`
    : 'Bu hafta yeni bir çalışma başlat ve serini koru.';
  const profileGoalLine = profile?.goal ? profile.goal : 'Hedef belirle, çalışma odanı kişiselleştir.';
  const profileInstitution = profile?.institution || '';
  const profileDepartment = profile?.department || '';
  const profileEduLabel = profile?.education_level
    ? categoryMeta[profile.education_level]?.label || profile.education_level
    : (categoryMeta[primaryCategory]?.label || 'Üniversite');
  const profileMetaLine = `${profileEduLabel}${profileInstitution ? ` • ${profileInstitution}` : ''}${profileDepartment ? ` • ${profileDepartment}` : ''}`;
  const saveProfile = async () => {
    if (!user?.id) return;
    const payload = {
      user_id: user.id,
      ...profileDraft,
      updated_at: new Date().toISOString()
    };
    const { data, error } = await supabase.from('user_profiles').upsert(payload).select().single();
    if (!error && data) {
      setProfile(data);
      setShowProfileEdit(false);
    }
  };
  const toggleFavoriteTool = (toolId) => {
    setProfileDraft(prev => {
      const set = new Set(prev.favorite_tools || []);
      if (set.has(toolId)) set.delete(toolId);
      else set.add(toolId);
      return { ...prev, favorite_tools: Array.from(set) };
    });
  };

  const communityNoteText = (note) => {
    if (!note) return '';
    const payload = note.payload || {};
    if (typeof payload === 'string') return payload;
    if (payload.text) return payload.text;
    if (payload.title) return payload.title;
    if (payload.summary) return payload.summary;
    if (payload.note) return payload.note;
    if (Array.isArray(payload.items) && payload.items.length > 0) return payload.items[0];
    if (Array.isArray(payload.questions) && payload.questions.length > 0) return payload.questions[0]?.question || payload.questions[0];
    return note.note_type || 'Topluluk notu';
  };

  return (
    <div
      className="min-h-screen text-[var(--text)]"
      style={{
        '--bg': '#0B0F14',
        '--bg-grad': 'radial-gradient(1200px circle at 12% 8%, rgba(245, 184, 75, 0.10), transparent 42%), radial-gradient(900px circle at 88% 0%, rgba(122, 162, 255, 0.14), transparent 35%), linear-gradient(180deg, #0B0F14 0%, #0E141B 100%)',
        '--panel': 'rgba(18, 24, 38, 0.86)',
        '--panel-2': 'rgba(10, 14, 20, 0.9)',
        '--border': 'rgba(255, 255, 255, 0.08)',
        '--text': '#E6E9EF',
        '--muted': '#9AA4B2',
        '--accent': '#F5B84B',
        '--accent-2': '#6EE7B7',
        '--accent-3': '#7AA2FF'
      }}
    >
      <div
        className="min-h-screen"
        style={{
          backgroundColor: 'var(--bg)',
          backgroundImage: 'var(--bg-grad)',
          fontFamily: '"Space Grotesk", "Sora", sans-serif'
        }}
      >
        <header className="flex flex-col md:flex-row md:items-center justify-between px-4 md:px-8 py-4 md:py-6 gap-3 md:gap-4">
          <div className="flex items-center gap-3 text-[var(--accent)] font-bold text-lg md:text-xl" style={{ fontFamily: '"Fraunces", serif' }}>
            <BookOpen size={22} className="md:hidden" />
            <BookOpen size={26} className="hidden md:block" />
            <span className="truncate">EduNotebook</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full md:w-auto">
            {planLabel !== 'TEAM' && (
              <button
                onClick={() => navigate('/#pricing')}
                className="px-3 py-2 md:px-4 rounded-xl bg-[var(--panel)] border border-[var(--border)] text-xs md:text-sm text-[var(--muted)] hover:text-[var(--text)] whitespace-nowrap"
              >
                Planlar
              </button>
            )}
            <button onClick={onLogout} className="px-3 py-2 md:px-4 rounded-xl bg-[var(--panel)] border border-[var(--border)] text-xs md:text-sm text-[var(--muted)] hover:text-[var(--text)] whitespace-nowrap">
              Çıkış
            </button>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--panel)] border border-[var(--border)] max-w-full">
              <User size={16} className="text-[var(--accent-3)]" />
              <span className="text-xs md:text-sm truncate max-w-[120px] md:max-w-none">{profileName}</span>
            </div>
          </div>
        </header>

        <main className="px-8 pb-12">
          <section className="grid grid-cols-12 gap-6 mb-8 items-stretch">
            <div className="col-span-12 lg:col-span-8">
              <div className="p-7 rounded-3xl bg-[var(--panel)] border border-[var(--border)] min-h-[260px] flex flex-col">
                <div>
                  <div className="text-xs tracking-[0.3em] font-bold text-[var(--muted)] mb-4">KONTROL PANELI</div>
                  <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: '"Fraunces", serif' }}>
                    Bugünün çalışma planını başlat.
                  </h1>
                  <p className="text-sm text-[var(--muted)] mb-5 max-w-2xl">
                    Kaynaklarını yükle, seçili dokümanlara göre ilerle. Hedefe göre plan, zayıf konu takibi ve
                    hızlı tekrar tek yerde.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 mt-2">
                  <button onClick={() => setShowCategoryPicker(true)} className="px-5 py-3 rounded-2xl bg-[var(--accent)] text-[#1b1b1b] font-semibold flex items-center gap-2 hover:brightness-110">
                    <Plus size={18} /> Yeni Konu Başlat
                  </button>
                  {lastSession && (
                    <button onClick={() => navigate(`/room/${lastSession.id}`)} className="px-5 py-3 rounded-2xl bg-[var(--panel-2)] border border-[var(--border)] text-sm text-[var(--text)] hover:border-[var(--accent-3)]">
                      Hızlı Devam
                    </button>
                  )}
                  {lastSession && (
                    <button onClick={() => navigate(`/room/${lastSession.id}?focus=1`)} className="px-5 py-3 rounded-2xl bg-[var(--panel)] border border-[var(--border)] text-sm text-[var(--text)] hover:border-[var(--accent-3)]">
                      Odak Modu
                    </button>
                  )}
                </div>
                <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-[var(--panel-2)] border border-[var(--border)]">
                    <div className="text-[10px] tracking-[0.3em] font-bold text-[var(--muted)] mb-2">GÜNÜN ODAĞI</div>
                    <div className="text-sm font-semibold">{goalPlan?.title || 'Odak başlığı seçilmedi'}</div>
                    <div className="text-[10px] text-[var(--muted)] mt-1">
                      {goalPlan?.date ? `Hedef: ${new Date(goalPlan.date).toLocaleDateString('tr-TR')}` : 'Bir hedef tarihi belirleyin.'}
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-[var(--panel-2)] border border-[var(--border)]">
                    <div className="text-[10px] tracking-[0.3em] font-bold text-[var(--muted)] mb-2">YAKLAŞAN ETKİNLİK</div>
                    <div className="text-sm font-semibold">{nextEvent?.title || 'Etkinlik yok'}</div>
                    <div className="text-[10px] text-[var(--muted)] mt-1">
                      {nextEvent ? `${nextEvent.date.toLocaleDateString('tr-TR')} • ${formatRelative(nextEvent.event_date)}` : 'Takvime etkinlik ekleyin.'}
                    </div>
                  </div>
                </div>
                <div className="mt-5 p-4 rounded-2xl bg-[var(--panel-2)] border border-[var(--border)]">
                  <div className="text-[10px] tracking-[0.3em] font-bold text-[var(--muted)] mb-3">MİNİ TAKVİM</div>
                  <div className="flex items-center justify-between text-[10px] text-[var(--muted)] mb-2">
                    <span>{miniCalendar.monthLabel}</span>
                    <span>{events.length} etkinlik</span>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-[10px] text-center">
                    {['P','S','Ç','P','C','C','P'].map(d => (
                      <div key={d} className="text-[var(--muted)]">{d}</div>
                    ))}
                    {miniCalendar.cells.map((d, idx) => {
                      if (!d) return <div key={`e-${idx}`} />;
                      const isToday = d.toDateString() === new Date().toDateString();
                      const hasEvent = eventDates.has(d.toDateString());
                      return (
                        <div
                          key={d.toDateString()}
                          onClick={() => {
                            setSelectedDay(d);
                            const list = events.filter(ev => new Date(ev.event_date).toDateString() === d.toDateString());
                            setDayEvents(list);
                          }}
                          className={`py-1 rounded-lg cursor-pointer ${isToday ? 'bg-[var(--accent)] text-[#1b1b1b]' : hasEvent ? 'bg-[var(--panel)] border border-[var(--border)] text-[var(--text)]' : 'text-[var(--muted)] hover:bg-[var(--panel)]'}`}
                        >
                          {d.getDate()}
                        </div>
                      );
                    })}
                  </div>
                </div>
                {lastSession && (
                  <div className="mt-6 p-4 rounded-2xl bg-[var(--panel-2)] border border-[var(--border)] flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[10px] tracking-[0.3em] font-bold text-[var(--muted)]">NERDE KALMIŞTIK?</div>
                      <div className="text-sm font-semibold mt-2">{lastSession.title || 'Son Çalışma'}</div>
                      <div className="text-xs text-[var(--muted)]">Son güncelleme: {formatRelative(lastSession.created_at)}</div>
                    </div>
                    <button onClick={() => navigate(`/room/${lastSession.id}`)} className="px-4 py-2 rounded-xl bg-[var(--panel)] border border-[var(--border)] text-xs text-[var(--text)] hover:border-[var(--accent-3)]">
                      Devam Et
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="col-span-12 lg:col-span-4">
              <div className="p-6 rounded-3xl bg-[var(--panel)] border border-[var(--border)] min-h-[260px] flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs tracking-[0.3em] font-bold text-[var(--muted)]">PROFIL</div>
                  <span className="text-[10px] px-2 py-1 rounded-full bg-[rgba(110,231,183,0.15)] text-[var(--accent-2)]">{planLabel}</span>
                </div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-[var(--panel-2)] border border-[var(--border)] flex items-center justify-center font-semibold">
                      {profileName?.slice(0, 1)?.toUpperCase() || 'E'}
                    </div>
                    <div>
                      <div className="text-lg font-semibold">{profileName}</div>
                      <div className="text-[10px] text-[var(--muted)]">{roleLabel} • {focusText}</div>
                    </div>
                  </div>
                  <button onClick={() => setShowProfileEdit(true)} className="text-[10px] px-2 py-1 rounded-lg bg-[var(--panel-2)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]">
                    Düzenle
                  </button>
                </div>
                <div className="text-[10px] text-[var(--muted)] mb-3">{profileMetaLine}</div>
                <div className="mb-4 p-3 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-xs text-[var(--muted)]">
                  {profileGoalLine}
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {topCategories.slice(0, 4).map((id) => (
                    <span key={id} className="text-[10px] px-2 py-1 rounded-full bg-[var(--panel-2)] border border-[var(--border)] text-[var(--muted)]">
                      {categoryMeta[id]?.label || id}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2 mb-4 text-xs">
                  <Flame size={16} className="text-[var(--accent)]" />
                  <span className="font-semibold">{stats.streak} Günlük Seri</span>
                  <span className="text-[var(--muted)]">• {stats.level}</span>
                </div>
                <div className="mb-4 p-3 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-xs text-[var(--muted)]">
                  {profileSummary}
                </div>
                {streakAtRisk && (
                  <div className="mb-4 p-3 rounded-xl bg-[rgba(248,113,113,0.12)] border border-[var(--border)] text-xs text-[var(--muted)]">
                    Bugün çalışmadın. Serin bozulabilir!
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-[var(--panel-2)] border border-[var(--border)]">
                    <div className="text-[var(--muted)]">Bu Hafta</div>
                    <div className="text-lg font-bold">{weeklyCount}</div>
                    <div className="text-[var(--muted)]">Çalışma</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--panel-2)] border border-[var(--border)]">
                    <div className="text-[var(--muted)]">Quiz</div>
                    <div className="text-lg font-bold">{stats.quizTotal || 0}</div>
                    <div className="text-[var(--muted)]">Soru</div>
                  </div>
                </div>
                <div className="mt-4 p-3 rounded-xl bg-[var(--panel-2)] border border-[var(--border)]">
                  <div className="flex items-center gap-2 text-xs font-semibold mb-2">
                    <BarChart3 size={14} className="text-[var(--accent-3)]" />
                    Başarı Grafiği
                  </div>
                  <div className="h-2 w-full rounded-full bg-black/20 overflow-hidden">
                    <div className="h-full bg-[var(--accent-3)]" style={{ width: `${Math.min(100, Math.round((stats.quizCorrect / Math.max(1, stats.quizTotal)) * 100))}%` }} />
                  </div>
                  <div className="text-[10px] text-[var(--muted)] mt-2">Doğruluk: {Math.round((stats.quizCorrect / Math.max(1, stats.quizTotal)) * 100)}%</div>
                  <div className="mt-3 grid grid-cols-7 gap-1 items-end">
                    {quizTrend.length === 0 ? (
                      <div className="text-[10px] text-[var(--muted)]">Henüz trend yok.</div>
                    ) : (
                      quizTrend.map((d, idx) => {
                        const pct = Math.round((d.correct / Math.max(1, d.total)) * 100);
                        return (
                          <div key={`${d.date}-${idx}`} className="h-12 flex items-end">
                            <div className="w-full rounded bg-[rgba(122,162,255,0.25)]" style={{ height: `${Math.max(10, pct)}%` }} />
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
                <div className="mt-4 p-3 rounded-xl bg-[var(--panel-2)] border border-[var(--border)]">
                  <div className="flex items-center gap-2 text-xs font-semibold mb-2">
                    <BarChart3 size={14} className="text-[var(--accent)]" />
                    Zayıf Konular
                  </div>
                  {weakTopics.length === 0 ? (
                    <div className="text-[10px] text-[var(--muted)]">Henüz veri yok.</div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {weakTopics.map(([topic, count]) => (
                        <span key={topic} className="text-[10px] px-2 py-1 rounded-full bg-[var(--panel)] border border-[var(--border)] text-[var(--muted)]">
                          {topic} • {count}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-4">
              <div className="p-6 rounded-3xl bg-[var(--panel)] border border-[var(--border)]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 font-bold text-[var(--text)]">
                    <Folder size={16} className="text-[var(--accent-3)]" />
                    Dersler / Projeler
                  </div>
                </div>
                <div className="flex gap-2 mb-4">
                  <input value={newCourseName} onChange={(e) => setNewCourseName(e.target.value)} placeholder="Yeni ders adı (örn. Biyoloji 101)" className="flex-1 px-3 py-2 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-xs" />
                  <button onClick={addCourse} className="px-3 py-2 rounded-xl bg-[var(--accent)] text-[#1b1b1b] text-xs font-semibold">Ekle</button>
                </div>
                <div className="space-y-2">
                  <button onClick={() => setSelectedCourseId(null)} className={`w-full text-left p-3 rounded-xl border text-xs ${!selectedCourseId ? 'border-[var(--accent)] bg-[rgba(245,184,75,0.12)]' : 'border-[var(--border)] bg-[var(--panel-2)]'}`}>Tüm Dersler</button>
                  {courses.map((c) => (
                    <button key={c.id} onClick={() => setSelectedCourseId(c.id)} className={`w-full text-left p-3 rounded-xl border text-xs ${selectedCourseId === c.id ? 'border-[var(--accent)] bg-[rgba(245,184,75,0.12)]' : 'border-[var(--border)] bg-[var(--panel-2)]'}`}>
                      <div className="flex items-center justify-between">
                        <span>{c.name}</span>
                        <span className="text-[10px] text-[var(--muted)]">{courseSessionCounts.get(c.id) || 0} çalışma</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-6 p-6 rounded-3xl bg-[var(--panel)] border border-[var(--border)]">
                <div className="flex items-center gap-2 font-bold text-[var(--text)] mb-4">
                  <Calendar size={16} className="text-[var(--accent)]" />
                  Yaklaşan Etkinlikler
                </div>
                {nextEvent && (
                  <div className="mb-4 p-3 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-xs">
                    <div className="font-semibold">{nextEvent.title}</div>
                    <div className="text-[var(--muted)]">
                      {nextEvent.date.toLocaleDateString('tr-TR')} • {formatRelative(nextEvent.event_date)}
                    </div>
                  </div>
                )}
                <div className="flex gap-2 mb-3">
                  <input value={newEventTitle} onChange={(e) => setNewEventTitle(e.target.value)} placeholder="Etkinlik (örn. Vize)" className="flex-1 px-3 py-2 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-xs" />
                  <input type="date" value={newEventDate} onChange={(e) => setNewEventDate(e.target.value)} className="px-2 py-2 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-xs" />
                </div>
                <button onClick={addEvent} className="w-full px-3 py-2 rounded-xl bg-[var(--accent)] text-[#1b1b1b] text-xs font-semibold">Ekle</button>
                <div className="mt-4 space-y-2">
                  {events.map((ev) => {
                    const daysLeft = Math.ceil((new Date(ev.event_date) - new Date()) / (1000*60*60*24));
                    return (
                      <div key={ev.id} className="p-3 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-xs">
                        <div className="font-semibold">{ev.title}</div>
                        <div className="text-[var(--muted)]">{new Date(ev.event_date).toLocaleDateString('tr-TR')} • {daysLeft >= 0 ? `${daysLeft} gün kaldı` : 'Geçti'}</div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-6 pt-4 border-t border-[var(--border)]">
                  <div className="text-xs font-bold text-[var(--text)] mb-3">Hedefe Göre Planlama</div>
                  <div className="flex gap-2 mb-3">
                    <input value={goalTitle} onChange={(e) => setGoalTitle(e.target.value)} placeholder="Hedef (örn. Biyoloji Vize)" className="flex-1 px-3 py-2 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-xs" />
                    <input type="date" value={goalDate} onChange={(e) => setGoalDate(e.target.value)} className="px-2 py-2 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-xs" />
                  </div>
                  <button onClick={buildGoalPlan} className="w-full px-3 py-2 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-xs text-[var(--text)] hover:border-[var(--accent-3)]">
                    Plan Oluştur
                  </button>
                  {goalPlan && (
                    <div className="mt-3 space-y-2">
                      <div className="text-[10px] text-[var(--muted)]">Toplam {goalPlan.days} gün • {goalPlan.title}</div>
                      {goalPlan.steps.map((step, idx) => (
                        <div key={idx} className="p-2 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-[10px]">
                          {step}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="col-span-12 lg:col-span-8">
              <div className="p-6 rounded-3xl bg-[var(--panel)] border border-[var(--border)]">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2 font-bold text-[var(--text)]">
                    <History size={16} className="text-[var(--accent-3)]" />
                    Geçmiş Çalışmalar
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--panel-2)] border border-[var(--border)]">
                    <Search size={14} className="text-[var(--muted)]" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Ara..."
                      className="bg-transparent text-xs outline-none text-[var(--text)] placeholder:text-[var(--muted)]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {paged.length === 0 && (
                    <div className="text-xs text-[var(--muted)]">Henüz çalışma yok.</div>
                  )}
                  {paged.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => navigate(`/room/${s.id}`)}
                      className="p-4 rounded-2xl bg-[var(--panel-2)] border border-[var(--border)] text-left hover:border-[var(--accent-3)] transition"
                    >
                      <div className="text-sm font-semibold truncate">{s.title || 'İsimsiz Sohbet'}</div>
                      <div className="text-[10px] text-[var(--muted)] mt-2">
                        {new Date(s.created_at).toLocaleDateString('tr-TR')} • {courseMap.get(s.course_id)?.name || 'Genel'}
                      </div>
                      <div className="text-[10px] text-[var(--muted)] mt-1">Son güncelleme: {formatRelative(s.created_at)}</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(sessionTags[s.id] || []).slice(0, 3).map((tag) => (
                          <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--panel)] border border-[var(--border)] text-[var(--muted)]">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          value={sessionTagDrafts[s.id] ?? (sessionTags[s.id] || []).join(', ')}
                          onChange={(e) => setSessionTagDrafts(prev => ({ ...prev, [s.id]: e.target.value }))}
                          placeholder="etiket1, etiket2"
                          className="flex-1 px-2 py-1 rounded-lg bg-[var(--panel)] border border-[var(--border)] text-[10px]"
                        />
                        <button onClick={(e) => { e.stopPropagation(); saveSessionTags(s.id); }} className="px-2 py-1 rounded-lg bg-[var(--panel)] border border-[var(--border)] text-[10px]">
                          Kaydet
                        </button>
                      </div>
                      <div className="mt-3 text-[10px] text-[var(--accent-3)] flex items-center gap-1">
                        Devam Et <ArrowRight size={12} />
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-4">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-2 rounded-lg bg-[var(--panel-2)] border border-[var(--border)] text-xs">Önceki</button>
                  <div className="text-xs text-[var(--muted)]">{page} / {totalPages}</div>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="px-3 py-2 rounded-lg bg-[var(--panel-2)] border border-[var(--border)] text-xs">Sonraki</button>
                </div>
              </div>
              <div className="mt-6 p-6 rounded-3xl bg-[var(--panel)] border border-[var(--border)]">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs tracking-[0.3em] font-bold text-[var(--muted)]">TOPLULUK NOTLARI</div>
                  <div className="text-[10px] text-[var(--muted)]">{communityNotes.length} not</div>
                </div>
                <div className="text-xs text-[var(--muted)] mb-3">Aynı dokümanı kullananlardan öne çıkan notlar (beta).</div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] mb-3">
                  <Search size={12} className="text-[var(--muted)]" />
                  <input
                    value={communityQuery}
                    onChange={(e) => setCommunityQuery(e.target.value)}
                    placeholder="Notlarda ara..."
                    className="bg-transparent text-xs outline-none text-[var(--text)] placeholder:text-[var(--muted)]"
                  />
                </div>
                <div className="space-y-2">
                  {filteredCommunityNotes.length === 0 && (
                    <div className="p-3 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-xs text-[var(--muted)]">
                      Henüz topluluk notu yok. İlk notları sen başlatabilirsin.
                    </div>
                  )}
                  {filteredCommunityNotes.map((note) => (
                    <div key={note.id} className="p-3 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-xs">
                      {communityNoteText(note)}
                    </div>
                  ))}
                </div>
                {communityNotes.length > 0 && (
                  <div className="mt-3 text-[10px] text-[var(--muted)]">Notlar anonim ve doküman bazlıdır.</div>
                )}
              </div>
            </div>
          </section>
        </main>
      </div>

      {selectedDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={closeDayModal}>
          <div className="w-full max-w-lg rounded-3xl bg-[var(--panel)] border border-[var(--border)] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs tracking-[0.3em] font-bold text-[var(--muted)]">GÜNLÜK ETKİNLİKLER</div>
                <div className="text-lg font-semibold mt-2">
                  {selectedDay.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
              <button onClick={closeDayModal} className="px-3 py-2 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-xs text-[var(--muted)]">
                Kapat
              </button>
            </div>
            {dayEvents.length === 0 ? (
              <div className="p-4 rounded-2xl bg-[var(--panel-2)] border border-[var(--border)] text-xs text-[var(--muted)]">
                Bu gün için kayıtlı etkinlik yok.
              </div>
            ) : (
              <div className="space-y-3">
                {dayEvents.map(ev => (
                  <div key={ev.id} className="p-4 rounded-2xl bg-[var(--panel-2)] border border-[var(--border)]">
                    <div className="text-sm font-semibold">{ev.title}</div>
                    <div className="text-[10px] text-[var(--muted)] mt-1">
                      {courseMap.get(ev.course_id)?.name || 'Genel'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showCategoryPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-4xl rounded-3xl bg-[var(--panel)] border border-[var(--border)] p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-xs tracking-[0.3em] font-bold text-[var(--muted)]">KATEGORI SECIMI</div>
                <h2 className="text-2xl font-bold mt-2" style={{ fontFamily: '"Fraunces", serif' }}>Projeni hangi bağlamda başlatacaksın?</h2>
              </div>
              <button onClick={() => { setShowCategoryPicker(false); setSelectedCategory(null); }} className="px-3 py-2 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-sm text-[var(--muted)]">
                Kapat
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {categories.map((c) => {
                const Icon = c.icon;
                const active = selectedCategory === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategory(c.id)}
                    className={`p-4 rounded-2xl border text-left transition ${active ? 'border-[var(--accent)] bg-[rgba(245,184,75,0.12)]' : 'border-[var(--border)] bg-[var(--panel-2)] hover:border-[var(--accent-3)]'}`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Icon size={18} className="text-[var(--accent-3)]" />
                      <div className="text-sm font-semibold">{c.label}</div>
                      {active && <CheckCircle size={16} className="text-[var(--accent)] ml-auto" />}
                    </div>
                    <div className="text-xs text-[var(--muted)]">{c.desc}</div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 p-4 rounded-2xl bg-[var(--panel-2)] border border-[var(--border)]">
              <div className="text-xs tracking-[0.3em] font-bold text-[var(--muted)] mb-3">DERS / PROJE</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <select
                  value={selectedCourseId || ''}
                  onChange={(e) => setSelectedCourseId(e.target.value || null)}
                  className="px-3 py-2 rounded-xl bg-[var(--panel)] border border-[var(--border)] text-sm"
                >
                  <option value="">Genel (Ders seçme)</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <input value={newCourseName} onChange={(e) => setNewCourseName(e.target.value)} placeholder="Yeni ders adı" className="flex-1 px-3 py-2 rounded-xl bg-[var(--panel)] border border-[var(--border)] text-sm" />
                  <button onClick={addCourse} className="px-3 py-2 rounded-xl bg-[var(--accent)] text-[#1b1b1b] text-xs font-semibold">Ekle</button>
                </div>
              </div>
            </div>

            {!isSchoolCategory(selectedCategory) && selectedCategory && (
              <div className="mt-6 p-4 rounded-2xl bg-[var(--panel-2)] border border-[var(--border)]">
                <div className="text-xs tracking-[0.3em] font-bold text-[var(--muted)] mb-2">EK AYARLAR</div>
                <div className="text-xs text-[var(--muted)]">Detaylı ayarlar projeyi başlattıktan sonra açılacaktır.</div>
              </div>
            )}

                <div className="flex items-center justify-between mt-6">
                  <div className="text-xs text-[var(--muted)]">
                    {selectedCategory ? `Seçilen: ${categories.find(c => c.id === selectedCategory)?.label}` : 'Lütfen bir kategori seç.'}
                  </div>
                  <button
                disabled={!canStart}
                onClick={() => {
                  const selected = categories.find(c => c.id === selectedCategory) || null;
                  const config = isSchoolCategory(selectedCategory) ? null : (categoryConfig[selectedCategory] || null);
                  const create = async () => {
                    const payload = {
                      title: 'Yeni Çalışma',
                      course_id: selectedCourseId || null,
                      category_id: selected?.id || null,
                      category_label: selected?.label || null,
                      project_config: config || null
                    };
                    if (user?.id) payload.user_id = user.id;
                    let { data } = await supabase.from('chat_sessions').insert([payload]).select().single();
                    if (!data && user?.id) {
                      delete payload.user_id;
                      const res = await supabase.from('chat_sessions').insert([payload]).select().single();
                      data = res.data;
                    }
                    if (data?.id) navigate(`/room/${data.id}`);
                  };
                  create();
                }}
                className="px-5 py-3 rounded-2xl bg-[var(--accent)] text-[#1b1b1b] font-semibold disabled:opacity-40"
              >
                Başlat
              </button>
            </div>
          </div>
        </div>
      )}

      {showProfileEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-3xl bg-[var(--panel)] border border-[var(--border)] p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-xs tracking-[0.3em] font-bold text-[var(--muted)]">PROFIL AYARLARI</div>
                <h2 className="text-2xl font-bold mt-2" style={{ fontFamily: '"Fraunces", serif' }}>Kendine özel çalışma odanı ayarla</h2>
              </div>
              <button onClick={() => setShowProfileEdit(false)} className="px-3 py-2 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-sm text-[var(--muted)]">
                Kapat
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-[var(--muted)]">Ad Soyad</label>
                <input value={profileDraft.full_name} onChange={(e) => setProfileDraft(prev => ({ ...prev, full_name: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-[var(--muted)]">Rol (örn. Üniversite Öğrencisi)</label>
                <input value={profileDraft.role_label} onChange={(e) => setProfileDraft(prev => ({ ...prev, role_label: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-[var(--muted)]">Kademe</label>
                <select value={profileDraft.education_level} onChange={(e) => setProfileDraft(prev => ({ ...prev, education_level: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-sm">
                  <option value="primary">İlk-Orta Okul</option>
                  <option value="highschool">Lise</option>
                  <option value="university">Üniversite</option>
                  <option value="jury">Jüri</option>
                  <option value="thesis">Tez Savunma</option>
                  <option value="meeting">Toplantı</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-[var(--muted)]">Okul / Kurum</label>
                <input value={profileDraft.institution} onChange={(e) => setProfileDraft(prev => ({ ...prev, institution: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-[var(--muted)]">Bölüm / Alan</label>
                <input value={profileDraft.department} onChange={(e) => setProfileDraft(prev => ({ ...prev, department: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-[var(--muted)]">Odak Dersler / Konular</label>
                <input value={profileDraft.focus_topics} onChange={(e) => setProfileDraft(prev => ({ ...prev, focus_topics: e.target.value }))} placeholder="Biyoloji, Matematik..." className="w-full px-3 py-2 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-sm" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs text-[var(--muted)]">Hedef</label>
                <input value={profileDraft.goal} onChange={(e) => setProfileDraft(prev => ({ ...prev, goal: e.target.value }))} placeholder="Örn. YKS biyoloji netini 15'e çıkar" className="w-full px-3 py-2 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-[var(--muted)]">Haftalık Hedef (saat)</label>
                <input type="number" min="1" value={profileDraft.weekly_goal_hours} onChange={(e) => setProfileDraft(prev => ({ ...prev, weekly_goal_hours: Number(e.target.value) }))} className="w-full px-3 py-2 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-[var(--muted)]">Günlük Hedef (dk)</label>
                <input type="number" min="10" value={profileDraft.daily_goal_minutes} onChange={(e) => setProfileDraft(prev => ({ ...prev, daily_goal_minutes: Number(e.target.value) }))} className="w-full px-3 py-2 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-[var(--muted)]">Çalışma Tarzı</label>
                <select value={profileDraft.study_style} onChange={(e) => setProfileDraft(prev => ({ ...prev, study_style: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-sm">
                  <option value="gorsel">Görsel</option>
                  <option value="metin">Metin</option>
                  <option value="quiz">Quiz</option>
                  <option value="karma">Karma</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-[var(--muted)]">Hatırlatma</label>
                <select value={profileDraft.reminder_pref} onChange={(e) => setProfileDraft(prev => ({ ...prev, reminder_pref: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-sm">
                  <option value="sessiz">Sessiz</option>
                  <option value="gunluk">Günlük</option>
                  <option value="haftalik">Haftalık</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-[var(--muted)]">Pomodoro</label>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" min="15" value={profileDraft.pomodoro_work} onChange={(e) => setProfileDraft(prev => ({ ...prev, pomodoro_work: Number(e.target.value) }))} className="px-3 py-2 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-sm" />
                  <input type="number" min="3" value={profileDraft.pomodoro_break} onChange={(e) => setProfileDraft(prev => ({ ...prev, pomodoro_break: Number(e.target.value) }))} className="px-3 py-2 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-sm" />
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs text-[var(--muted)]">Favori Araçlar</label>
                <div className="flex flex-wrap gap-2">
                  {['SUMMARY','QUIZ','OPEN','FLASHCARDS','MNEMONIC','CONNECTOR','VERSUS','STUDY_NOTES','EXAM_SIM','PITCH'].map((toolId) => (
                    <button
                      key={toolId}
                      onClick={() => toggleFavoriteTool(toolId)}
                      className={`text-[10px] px-3 py-2 rounded-full border ${profileDraft.favorite_tools?.includes(toolId) ? 'border-[var(--accent)] bg-[rgba(245,184,75,0.16)] text-[var(--accent)]' : 'border-[var(--border)] bg-[var(--panel-2)] text-[var(--muted)]'}`}
                    >
                      {toolId}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div className="text-xs text-[var(--muted)]">Bilgiler kaydedildikçe çalışma odan kişiselleşir.</div>
              <button onClick={saveProfile} className="px-5 py-3 rounded-2xl bg-[var(--accent)] text-[#1b1b1b] font-semibold">Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
