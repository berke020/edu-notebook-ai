import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  BookOpen, UploadCloud, FileText, Image as ImageIcon, XCircle,
  MessageSquare, Sun, Moon, Send, Bot, Zap, CheckCircle,
  AlertCircle, ChevronLeft, ChevronRight, Layers, List,
  RotateCw, GraduationCap, Clock, History, Plus, Edit2, Check, X, Info,
  Brain, Link2, Columns2, Maximize2, Minimize2, Mic, ArrowRight, Video, Search, Tag, Share2, MoreVertical, Eye, Star
} from 'lucide-react';

// Mevcut import satırını güncelle:
import { processDocumentForRAG, searchRelevantContent, fetchBroadContext } from '../services/aiHelper';
import { extractTextFromPDF } from '../services/pdfHelper';
import { apiCall, SYSTEM_PROMPT } from '../services/api';
import { supabase } from '../services/supabaseClient';
import SimpleMarkdownRenderer from './SimpleMarkdownRenderer';

export default function EduNotebook({ initialSessionId = null, onBackHome = null, projectCategory = null, projectConfig = null, projectCourseId = null, onLogout = null, initialFocusMode = false }) {
  // -- State --
  const [user, setUser] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const sessionCreated = useRef(false);
  
  const [sources, setSources] = useState([]);
  const [messages, setMessages] = useState([]);
  const [chatHistory, setChatHistory] = useState([]); 
  const [inputValue, setInputValue] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [hasSentMessage, setHasSentMessage] = useState(false);
  const chatInputRef = useRef(null);
  
  // Title Editing State
  const [currentTitle, setCurrentTitle] = useState("Yeni Çalışma");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState("");

  // UI State
  const [activeTab, setActiveTab] = useState('sources'); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSourcesOpen, setIsMobileSourcesOpen] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(!!initialFocusMode);
  
  // GÜNCELLEME BURADA: Varsayılan olarak TRUE (Dark Mode) yaptık.
  const [isDarkMode, setIsDarkMode] = useState(true); 
  
  const chatEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [editingSourceId, setEditingSourceId] = useState(null);
  const [editingSourceName, setEditingSourceName] = useState('');
  const [previewSourceId, setPreviewSourceId] = useState(null);
  const [sourceInputMode, setSourceInputMode] = useState('file');
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourceText, setSourceText] = useState('');
  const [isPastingText, setIsPastingText] = useState(false);
  const [sourceSearch, setSourceSearch] = useState('');
  const [taggingSourceId, setTaggingSourceId] = useState(null);
  const [tagDraft, setTagDraft] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [shareStatus, setShareStatus] = useState('');
  const [isDictating, setIsDictating] = useState(false);
  const recognitionRef = useRef(null);
  const [outputTemplate, setOutputTemplate] = useState('balanced');
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareRole, setShareRole] = useState('viewer');
  const [shareExpireHours, setShareExpireHours] = useState(72);
  const [sharePassword, setSharePassword] = useState('');
  const [shareMaxViews, setShareMaxViews] = useState(0);
  const [shareDeviceLimit, setShareDeviceLimit] = useState(0);
  const [shareLink, setShareLink] = useState('');
  const [roomAccessRole, setRoomAccessRole] = useState('owner');
  const [sessionOwnerId, setSessionOwnerId] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [shareList, setShareList] = useState([]);
  const [isShareLoading, setIsShareLoading] = useState(false);
  const [shareAccessLogs, setShareAccessLogs] = useState([]);
  const [sharePasswordRequired, setSharePasswordRequired] = useState(false);
  const [sharePasswordInput, setSharePasswordInput] = useState('');
  const [sharePasswordError, setSharePasswordError] = useState('');
  const [pendingShareData, setPendingShareData] = useState(null);
  const [quotaInfo, setQuotaInfo] = useState({ limit: 0, used: 0 });
  const [showExportModal, setShowExportModal] = useState(false);
  const [currentSourceMeta, setCurrentSourceMeta] = useState({ names: [], ids: [] });
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [showTitleEditModal, setShowTitleEditModal] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [isInteractionModalOpen, setIsInteractionModalOpen] = useState(false);
  const [chatSearch, setChatSearch] = useState('');
  const [favoriteTools, setFavoriteTools] = useState([]);
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  const themeStyles = isDarkMode
    ? {
        '--bg': '#0B0F14',
        '--bg-grad': 'radial-gradient(1200px circle at 12% 8%, rgba(245, 184, 75, 0.10), transparent 42%), radial-gradient(900px circle at 88% 0%, rgba(122, 162, 255, 0.14), transparent 35%), linear-gradient(180deg, #0B0F14 0%, #0E141B 100%)',
        '--panel': 'rgba(18, 24, 38, 0.86)',
        '--panel-2': 'rgba(10, 14, 20, 0.9)',
        '--border': 'rgba(255, 255, 255, 0.08)',
        '--text': '#E6E9EF',
        '--muted': '#9AA4B2',
        '--accent': '#F5B84B',
        '--accent-2': '#6EE7B7',
        '--accent-3': '#7AA2FF',
        '--danger': '#F87171'
      }
    : {
        '--bg': '#F3EFE7',
        '--bg-grad': 'radial-gradient(900px circle at 10% 5%, rgba(245, 184, 75, 0.18), transparent 35%), radial-gradient(800px circle at 95% 0%, rgba(14, 116, 144, 0.12), transparent 40%), linear-gradient(180deg, #F3EFE7 0%, #EFE9DE 100%)',
        '--panel': 'rgba(255, 255, 255, 0.92)',
        '--panel-2': 'rgba(247, 243, 236, 0.95)',
        '--border': 'rgba(15, 23, 42, 0.12)',
        '--text': '#141821',
        '--muted': '#5F6A76',
        '--accent': '#D97706',
        '--accent-2': '#0F766E',
        '--accent-3': '#1D4ED8',
        '--danger': '#DC2626'
      };

  const accessToken = useMemo(() => {
    try {
      return new URLSearchParams(window.location.search).get('token') || '';
    } catch {
      return '';
    }
  }, []);
  const isOwner = !!user?.id && !!sessionOwnerId && user.id === sessionOwnerId;
  const canEditRoom = isOwner || roomAccessRole === 'editor';
  const canComment = canEditRoom || roomAccessRole === 'commenter';
  const isReadOnly = !canEditRoom;

  const canDictate = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => {
    setIsFocusMode(!!initialFocusMode);
  }, [initialFocusMode]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const url = new URL(window.location.href);
      if (isFocusMode) {
        url.searchParams.set('focus', '1');
      } else {
        url.searchParams.delete('focus');
      }
      window.history.replaceState({}, '', url.toString());
    } catch {}
  }, [isFocusMode]);

  useEffect(() => {
    if (isFocusMode) {
      setIsMobileToolsOpen(false);
      setIsMobileSourcesOpen(false);
      setIsSidebarOpen(false);
    }
  }, [isFocusMode]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 1023px)');
    const update = () => setIsMobileView(mq.matches);
    update();
    if (mq.addEventListener) {
      mq.addEventListener('change', update);
      return () => mq.removeEventListener('change', update);
    }
    mq.addListener(update);
    return () => mq.removeListener(update);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const vv = window.visualViewport;
    const update = () => {
      const height = vv ? vv.height : window.innerHeight;
      const offsetTop = vv?.offsetTop || 0;
      const rawOffset = Math.max(0, window.innerHeight - height - offsetTop);
      const open = rawOffset > 120;
      setIsKeyboardOpen(open);
      setKeyboardOffset(open ? rawOffset : 0);
      try {
        document.documentElement.style.setProperty('--vh', `${height * 0.01}px`);
        document.documentElement.style.setProperty('--kb', `${open ? rawOffset : 0}px`);
      } catch {}
    };
    update();
    window.addEventListener('resize', update);
    vv?.addEventListener('resize', update);
    vv?.addEventListener('scroll', update);
    return () => {
      window.removeEventListener('resize', update);
      vv?.removeEventListener('resize', update);
      vv?.removeEventListener('scroll', update);
    };
  }, []);

  useEffect(() => {
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, []);

  useEffect(() => {
    if (!isMobileView) setIsInteractionModalOpen(false);
  }, [isMobileView]);

  useEffect(() => {
    try {
      const key = `favorite_tools_${user?.id || 'anon'}`;
      const stored = JSON.parse(localStorage.getItem(key) || '[]');
      if (Array.isArray(stored)) setFavoriteTools(stored);
    } catch {}
  }, [user?.id]);

  const [sessionCategory, setSessionCategory] = useState(null);
  const categoryId = (projectCategory?.id || sessionCategory?.id || 'university');
  const outputTemplateOptions = [
    { id: 'balanced', label: 'Dengeli' },
    { id: 'short', label: 'Kısa' },
    { id: 'detailed', label: 'Detaylı' },
    { id: 'bullet', label: 'Madde' },
    { id: 'exam', label: 'Sınav Odaklı' }
  ];
  const toolsets = {
    primary: [
      { id: 'STORY', label: 'Hikaye', icon: BookOpen },
      { id: 'ELI5', label: 'Basit Anlat', icon: GraduationCap },
      { id: 'VISUAL_CARDS', label: 'Resimli Kartlar', icon: Layers },
      { id: 'RIDDLES', label: 'Bilmece', icon: MessageSquare },
      { id: 'MINI_QUIZ', label: 'Mini Quiz', icon: CheckCircle },
      { id: 'PRESENTATION', label: 'Sunum', icon: Layers }
    ],
    highschool: [
      { id: 'STUDY_NOTES', label: 'Ders Özeti', icon: FileText },
      { id: 'QUIZ_YKS', label: 'Test Çöz', icon: CheckCircle },
      { id: 'MEMORIZE', label: 'Ezber', icon: Brain },
      { id: 'STUDY_PLAN', label: 'Plan', icon: Clock },
      { id: 'TRUE_FALSE', label: 'D/Y', icon: CheckCircle },
      { id: 'PRESENTATION', label: 'Sunum', icon: Layers }
    ],
    university: [
      { id: 'ACADEMIC_SUMMARY', label: 'Akademik Özet', icon: FileText },
      { id: 'ESSAY_OUTLINE', label: 'Makale Taslağı', icon: List },
      { id: 'EXAM_SIM', label: 'Vize/Final', icon: GraduationCap },
      { id: 'CONCEPT_MAP', label: 'Kavram Haritası', icon: Link2 },
      { id: 'CRITIQUE', label: 'Kritik Analiz', icon: Info },
      { id: 'PRESENTATION', label: 'Sunum', icon: Layers }
    ],
    jury: [
      { id: 'PITCH', label: 'Sunum', icon: MessageSquare },
      { id: 'DEFENSE', label: 'Savunma', icon: AlertCircle },
      { id: 'ROLEPLAY', label: 'Sesli Sim', icon: Mic },
      { id: 'STRESS_TEST', label: 'Stres', icon: Clock },
      { id: 'CONCEPT_EXPLAIN', label: 'Konsept', icon: Layers },
      { id: 'ALT_SCENARIOS', label: 'Alternatif', icon: RotateCw },
      { id: 'PRESENTATION', label: 'Sunum', icon: Layers }
    ],
    thesis: [
      { id: 'HARSH_Q', label: 'Sert Hoca', icon: AlertCircle },
      { id: 'ROLEPLAY', label: 'Sesli Sim', icon: Mic },
      { id: 'STRESS_TEST', label: 'Stres', icon: Clock },
      { id: 'METHODOLOGY', label: 'Metodoloji', icon: List },
      { id: 'ELEVATOR', label: 'Asansör', icon: MessageSquare },
      { id: 'LIT_REVIEW', label: 'Literatür', icon: FileText },
      { id: 'PRESENTATION', label: 'Sunum', icon: Layers }
    ],
    meeting: [
      { id: 'MINUTES', label: 'Tutanak', icon: FileText },
      { id: 'ACTIONS', label: 'Aksiyon', icon: CheckCircle },
      { id: 'FOLLOW_UP', label: 'Mail', icon: MessageSquare },
      { id: 'SWOT', label: 'SWOT', icon: Columns2 },
      { id: 'PRESENTATION', label: 'Sunum', icon: Layers }
    ]
  };
  const interactionTools = toolsets[categoryId] || toolsets.university;

  // Right Panel State
  const [interactionType, setInteractionType] = useState(null);
  const [isInteractionLoading, setIsInteractionLoading] = useState(false);
  const [interactionData, setInteractionData] = useState(null);
  const [interactionHistory, setInteractionHistory] = useState([]);
  const [interactionHistoryLoaded, setInteractionHistoryLoaded] = useState(false);
  const [interactionTagDraft, setInteractionTagDraft] = useState('');
  const [currentInteractionMeta, setCurrentInteractionMeta] = useState(null);
  const [presentationTheme, setPresentationTheme] = useState('midnight');
  const [presentationSpeaker, setPresentationSpeaker] = useState('');
  const [presentationDate, setPresentationDate] = useState('');
  const [presentationTimerSec, setPresentationTimerSec] = useState(90);
  const [presentationRunning, setPresentationRunning] = useState(false);
  const [presentationIndex, setPresentationIndex] = useState(0);
  const [presentationPack, setPresentationPack] = useState('focus');
  const [presentationNumberStyle, setPresentationNumberStyle] = useState('simple');
  const [presentationAutoTiming, setPresentationAutoTiming] = useState(true);
  const [presentationSearch, setPresentationSearch] = useState('');
  const [presentationFullScreen, setPresentationFullScreen] = useState(false);
  const [presentationActiveIndex, setPresentationActiveIndex] = useState(0);
  const [presentationLayout, setPresentationLayout] = useState('standard');
  const [presentationComments, setPresentationComments] = useState({});
  const [presentationRatings, setPresentationRatings] = useState({});
  const [presentationShowNotes, setPresentationShowNotes] = useState(true);
  const [presentationBrandName, setPresentationBrandName] = useState('');
  const [presentationBrandMode, setPresentationBrandMode] = useState('watermark');
  const [presentationShareLink, setPresentationShareLink] = useState('');
  const [laserPos, setLaserPos] = useState({ x: 0, y: 0 });
  const [laserVisible, setLaserVisible] = useState(false);
  const [presentationShareExpireHours, setPresentationShareExpireHours] = useState(24);
  const [presentationSharePassword, setPresentationSharePassword] = useState('');
  const [presentationTransition, setPresentationTransition] = useState('fade');
  const [presentationAutoAdvance, setPresentationAutoAdvance] = useState(false);
  const [laserTrail, setLaserTrail] = useState([]);
  const [presentationTone, setPresentationTone] = useState('academic');
  const [showPresentationEditor, setShowPresentationEditor] = useState(false);
  const [isInteractionExpanded, setIsInteractionExpanded] = useState(false);
  const [showCategorySettings, setShowCategorySettings] = useState(false);
  const [localProjectConfig, setLocalProjectConfig] = useState(projectConfig || null);
  const [resumeHint, setResumeHint] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [badgeEarned, setBadgeEarned] = useState(false);
  const [mascotMessage, setMascotMessage] = useState("Aferin! Birlikte öğreniyoruz.");
  const [pomodoro, setPomodoro] = useState({ seconds: 1500, running: false });
  const [ankiQueue, setAnkiQueue] = useState([]);
  const [ankiIndex, setAnkiIndex] = useState(0);
  const [ankiKnown, setAnkiKnown] = useState([]);
  const [ankiUnknown, setAnkiUnknown] = useState([]);
  const [roleplayInput, setRoleplayInput] = useState('');
  const [roleplayResponse, setRoleplayResponse] = useState('');
  const [isRoleplayLoading, setIsRoleplayLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [stressQuestions, setStressQuestions] = useState([]);
  const [stressIndex, setStressIndex] = useState(0);
  const [stressTimer, setStressTimer] = useState(30);
  const [stressRunning, setStressRunning] = useState(true);
  const [stressAutoNext, setStressAutoNext] = useState(true);
  const [stressDuration, setStressDuration] = useState(30);
  const [juryMemory, setJuryMemory] = useState([]);
  const [juryMemoryTag, setJuryMemoryTag] = useState('');
  const [juryMemoryFilter, setJuryMemoryFilter] = useState('');
  const [quizStatsRecorded, setQuizStatsRecorded] = useState(false);
  const [personas, setPersonas] = useState([]);
  const [personaName, setPersonaName] = useState('');
  const [isMobileToolsOpen, setIsMobileToolsOpen] = useState(false);
  const [videoUploads, setVideoUploads] = useState([]);
  const [videoStatus, setVideoStatus] = useState('');
  
  // Sub-states
  const [userQuizAnswers, setUserQuizAnswers] = useState({});
  const [openAnswers, setOpenAnswers] = useState({});
  const [evaluations, setEvaluations] = useState({});
  const [evaluatingIds, setEvaluatingIds] = useState(new Set());
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [examAnswers, setExamAnswers] = useState({});
  const [isGradingExam, setIsGradingExam] = useState(false);
  const [examResult, setExamResult] = useState(null);
  const [earnedBadges, setEarnedBadges] = useState([]);

  // -- INIT --
  useEffect(() => {
    fetchChatHistory();
    scrollToBottom();
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    };
    loadUser();
  }, []);

  useEffect(() => {
    try {
      const key = `badges_${user?.id || 'anon'}`;
      const list = JSON.parse(localStorage.getItem(key) || '[]');
      setEarnedBadges(list);
    } catch {}
  }, [user?.id]);

  useEffect(() => {
    const checkAccess = async () => {
      if (!sessionId || !sessionOwnerId) return;
      if (isOwner) {
        setRoomAccessRole('owner');
        setAccessDenied(false);
        return;
      }
      if (!accessToken) {
        setAccessDenied(true);
        return;
      }
      try {
        const { data } = await supabase
          .from('room_shares')
          .select('*')
          .eq('token', accessToken)
          .maybeSingle();
        if (!data || data.session_id !== sessionId) {
          setAccessDenied(true);
          return;
        }
        if (data.expires_at && new Date(data.expires_at) < new Date()) {
          setAccessDenied(true);
          return;
        }
        if (data.password_hash) {
          const ok = sessionStorage.getItem(`share_pass_${data.token}`) === '1';
          if (!ok) {
            setPendingShareData(data);
            setSharePasswordRequired(true);
            setAccessDenied(false);
            return;
          }
        }
        await finalizeShareAccess(data);
      } catch {
        setAccessDenied(true);
      }
    };
    checkAccess();
  }, [sessionId, sessionOwnerId, isOwner, accessToken]);

  useEffect(() => {
    if (showShareModal) {
      loadShareList();
      loadShareAccess();
    }
  }, [showShareModal, sessionId, isOwner]);

  useEffect(() => {
    if (user?.id) fetchChatHistory();
  }, [user?.id]);

  useEffect(() => {
    if (initialSessionId) {
      loadSession({ id: initialSessionId });
    }
  }, [initialSessionId]);

  useEffect(() => {
    // Proje odası açılınca oturumu erkenden oluştur ki isim düzenleme çalışsın
    const ensureSession = async () => {
      if (sessionId || initialSessionId) return;
      if (!projectCategory && !projectCourseId) return;
      const payload = {
        title: currentTitle || 'Yeni Çalışma',
        course_id: projectCourseId || null,
        category_id: projectCategory?.id || null,
        category_label: projectCategory?.label || null,
        project_config: projectConfig || null
      };
      if (user?.id) payload.user_id = user.id;
      let { data } = await supabase.from('chat_sessions').insert([payload]).select().single();
      if (!data && user?.id) {
        delete payload.user_id;
        const res = await supabase.from('chat_sessions').insert([payload]).select().single();
        data = res.data;
      }
      if (data) {
        setSessionId(data.id);
        fetchChatHistory();
      }
    };
    ensureSession();
  }, [projectCategory, projectCourseId, projectConfig, initialSessionId, sessionId, currentTitle]);

  useEffect(() => {
    setLocalProjectConfig(projectConfig || null);
  }, [projectConfig]);

  useEffect(() => {
    const styleId = 'confetti-anim';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(120vh) rotate(360deg); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const rec = new SpeechRecognition();
    rec.lang = 'tr-TR';
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (event) => {
      let interim = '';
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += transcript + ' ';
        else interim += transcript;
      }
      if (finalText) {
        setInputValue(prev => `${prev}${finalText}`.trimStart());
        requestAnimationFrame(() => autoResizeInput());
      } else if (interim) {
        setInputValue(prev => `${prev}`.trimStart() + interim);
        requestAnimationFrame(() => autoResizeInput());
      }
    };
    rec.onend = () => setIsDictating(false);
    rec.onerror = () => setIsDictating(false);
    recognitionRef.current = rec;
  }, []);

  useEffect(() => {
    if (interactionType === 'MINI_QUIZ' || interactionType === 'STORY' || interactionType === 'ELI5') {
      setMascotMessage("Aferin! Harika gidiyorsun.");
    }
  }, [interactionType]);

  useEffect(() => {
    if (interactionType === 'MEMORIZE' && interactionData?.items) {
      setAnkiQueue(interactionData.items);
      setAnkiIndex(0);
      setAnkiKnown([]);
      setAnkiUnknown([]);
    }
  }, [interactionType, interactionData]);

  useEffect(() => {
    if (interactionType !== 'MINI_QUIZ' || !interactionData?.questions) return;
    const allAnswered = interactionData.questions.every((_, idx) => userQuizAnswers[idx] !== undefined);
    if (allAnswered) {
      recordWeakTopics(interactionData.questions, userQuizAnswers);
      addBadge('Minik Bilgin');
      setShowConfetti(true);
      setBadgeEarned(true);
      setTimeout(() => setShowConfetti(false), 1500);
    }
  }, [interactionType, interactionData, userQuizAnswers]);

  useEffect(() => {
    if (interactionType !== 'QUIZ_YKS' || !interactionData?.questions) return;
    const allAnswered = interactionData.questions.every((_, idx) => userQuizAnswers[idx] !== undefined);
    if (allAnswered && !quizStatsRecorded) {
      const correct = interactionData.questions.reduce((acc, q, idx) => acc + (userQuizAnswers[idx] === q.correctIndex ? 1 : 0), 0);
      updateQuizStats(correct, interactionData.questions.length);
      recordWeakTopics(interactionData.questions, userQuizAnswers);
      setQuizStatsRecorded(true);
    }
    if (!allAnswered) setQuizStatsRecorded(false);
  }, [interactionType, interactionData, userQuizAnswers, quizStatsRecorded]);

  useEffect(() => {
    const cat = projectCategory?.id;
    if (!cat || !['jury','thesis','meeting'].includes(cat)) return;
    const fetchPersonas = async () => {
      const { data } = await supabase.from('personas').select('*').eq('category_id', cat).order('created_at', { ascending: false });
      if (data) setPersonas(data);
    };
    fetchPersonas();
  }, [projectCategory]);

  useEffect(() => {
    const cat = projectCategory?.id;
    if (!cat || !['jury','thesis'].includes(cat) || !sessionId) return;
    const fetchVideos = async () => {
      const { data } = await supabase.from('jury_videos').select('*').eq('session_id', sessionId).order('created_at', { ascending: false });
      if (data) setVideoUploads(data);
    };
    fetchVideos();
  }, [projectCategory, sessionId]);

  useEffect(() => {
    if (interactionType === 'STRESS_TEST' && interactionData?.questions) {
      setStressQuestions(interactionData.questions);
      setStressIndex(0);
      setStressDuration(30);
      setStressTimer(30);
      setStressRunning(true);
    }
  }, [interactionType, interactionData]);

  const loadJuryMemory = async () => {
    if (!sessionId) return;
    try {
      const { data } = await supabase
        .from('jury_memory')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (data && data.length) {
        setJuryMemory(data.map(d => ({ text: d.text, at: d.created_at, tag: d.tag || '' })));
        return;
      }
    } catch {}
    try {
      const key = `jury_memory_${sessionId}`;
      const list = JSON.parse(localStorage.getItem(key) || '[]');
      setJuryMemory(list);
    } catch {}
  };

  useEffect(() => {
    loadJuryMemory();
  }, [sessionId]);

  useEffect(() => {
    if (!pomodoro.running) return;
    if (pomodoro.seconds <= 0) {
      setPomodoro(prev => ({ ...prev, running: false }));
      return;
    }
    const t = setTimeout(() => setPomodoro(prev => ({ ...prev, seconds: prev.seconds - 1 })), 1000);
    return () => clearTimeout(t);
  }, [pomodoro.running, pomodoro.seconds]);

  useEffect(() => {
    if (interactionType !== 'STRESS_TEST' || stressQuestions.length === 0) return;
    if (!stressRunning || stressTimer <= 0) return;
    const t = setTimeout(() => setStressTimer(prev => prev - 1), 1000);
    return () => clearTimeout(t);
  }, [interactionType, stressQuestions, stressTimer, stressRunning]);

  useEffect(() => {
    if (interactionType !== 'STRESS_TEST' || stressQuestions.length === 0) return;
    if (stressTimer > 0) return;
    if (!stressAutoNext) {
      setStressRunning(false);
      return;
    }
    setStressIndex(i => {
      const next = Math.min(stressQuestions.length - 1, i + 1);
      if (next === i) setStressRunning(false);
      return next;
    });
    setStressTimer(stressDuration);
  }, [interactionType, stressTimer, stressAutoNext, stressQuestions.length, stressDuration]);

  useEffect(() => {
    if (interactionType === 'EXAM') setIsInteractionExpanded(true);
  }, [interactionType]);

  useEffect(() => {
    if (sessionId) loadInteractionHistory(sessionId);
  }, [sessionId, user?.id]);

  useEffect(() => {
    const fontId = 'edu-fonts';
    if (!document.getElementById(fontId)) {
      const link = document.createElement('link');
      link.id = fontId;
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Fraunces:wght@600;700&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  const scrollToBottom = () => {
    if (!shouldAutoScroll) return;
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(() => { scrollToBottom(); }, [messages, isChatLoading, shouldAutoScroll]);

  const autoResizeInput = () => {
    const el = chatInputRef.current;
    if (!el) return;
    el.style.height = '0px';
    const next = Math.min(180, el.scrollHeight);
    el.style.height = `${next}px`;
  };

  // -- HISTORY & TITLE MANAGEMENT --
  
  const fetchChatHistory = async () => {
    let data = null;
    let error = null;
    if (user?.id) {
      const res = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      data = res.data;
      error = res.error;
    }
    if (error || !user?.id) {
      const res = await supabase
        .from('chat_sessions')
        .select('*')
        .order('created_at', { ascending: false });
      data = res.data;
      error = res.error;
    }
    
    if (error) console.error("Geçmiş çekilemedi:", error);
    else setChatHistory(data || []);
  };

  const startNewChat = async () => {
    setMessages([]);
    setSources([]);
    setSessionId(null);
    setInteractionType(null);
    setInteractionData(null);
    sessionCreated.current = false;
    setCurrentTitle("Yeni Çalışma");

    const payload = { 
      title: 'Yeni Çalışma',
      course_id: projectCourseId || null,
      category_id: projectCategory?.id || null,
      category_label: projectCategory?.label || null,
      project_config: projectConfig || null
    };
    if (user?.id) payload.user_id = user.id;
    let { data, error } = await supabase
      .from('chat_sessions')
      .insert([payload])
      .select()
      .single();
    if (error && user?.id) {
      delete payload.user_id;
      const res = await supabase.from('chat_sessions').insert([payload]).select().single();
      data = res.data;
      error = res.error;
    }

    if (!error) {
      setSessionId(data.id);
      fetchChatHistory();
    }
  };

  const loadSession = async (session) => {
    setSessionId(session.id);
    if (session.title) setCurrentTitle(session.title);
    // isChatLoading sadece kullanıcı mesajı gönderirken kullanılacak
    // Sohbet açılınca otomatik Kaynaklar sekmesine geç ki dosyaları görsün
    setActiveTab('sources'); 
    
    // 0. SESSION METADATA
    const { data: meta } = await supabase.from('chat_sessions').select('*').eq('id', session.id).maybeSingle();
    if (meta) {
      setCurrentTitle(meta.title || 'Yeni Çalışma');
      if (meta.category_id || meta.category_label) {
        setSessionCategory({ id: meta.category_id, label: meta.category_label });
      }
      if (meta.project_config) setLocalProjectConfig(meta.project_config);
      setSessionOwnerId(meta.user_id || null);
    }

    // 1. MESAJLARI ÇEK
    const { data: msgs, error: msgError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', session.id)
      .order('created_at', { ascending: true });
    
    if (!msgError) {
      const formatted = msgs.map(m => ({ role: m.role, text: m.content }));
      setMessages(formatted);
      const lastUser = [...msgs].reverse().find(m => m.role === 'user');
      if (lastUser) {
        setResumeHint(`Hoş geldin! En son şunu konuşmuştuk: "${lastUser.content?.slice(0, 120)}..." Devam edelim mi?`);
      }
    }

    // 2. DOSYALARI ÇEK (YENİ KISIM)
    const { data: docs, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('session_id', session.id);

    if (!docError && docs) {
      // Veritabanından gelen dosyaları UI formatına çevir
      const loadedSources = docs.map(doc => ({
        id: doc.id, // Veritabanı ID'si
        docId: doc.id,
        name: doc.name,
        originalName: doc.name,
        sourceUrl: doc.source_url || null,
        tags: doc.tags || [],
        mimeType: doc.mime_type || 'application/pdf', // Varsayılan
        isText: (doc.mime_type || '').startsWith('text/'),
        // Not: Base64 verisini DB'de tutmuyoruz (yer kaplamasın diye), 
        // ama RAG zaten çalıştığı için tekrar okumaya gerek yok. 
        // Sadece listede görünmesi yeterli.
        data: null,
        textContent: doc.text_content || null,
        selected: true
      }));
      setSources(loadedSources);
    } else {
      setSources([]);
    }

    // isChatLoading burada kullanılmıyor
  };

  const deleteSession = async (e, id) => {
    e.stopPropagation();
    if(!confirm("Bu sohbeti silmek istediğine emin misin?")) return;

    await supabase.from('chat_sessions').delete().eq('id', id);
    fetchChatHistory();
    if (sessionId === id) startNewChat();
  };

  // -- BAŞLIK DÜZENLEME --
  const startEditingTitle = () => {
    setTempTitle(currentTitle);
    setIsEditingTitle(true);
  };

  const openTitleEditModal = () => {
    setTempTitle(currentTitle);
    setShowTitleEditModal(true);
  };

  const cancelTitleModal = () => {
    setShowTitleEditModal(false);
  };

  const toggleFavoriteTool = (toolId) => {
    setFavoriteTools(prev => {
      const next = prev.includes(toolId) ? prev.filter(id => id !== toolId) : [...prev, toolId];
      try {
        const key = `favorite_tools_${user?.id || 'anon'}`;
        localStorage.setItem(key, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const saveTitle = async () => {
    if (!tempTitle.trim() || !sessionId) {
        setIsEditingTitle(false);
        return;
    }

    setIsSavingTitle(true);
    const { error } = await supabase
        .from('chat_sessions')
        .update({ title: tempTitle })
        .eq('id', sessionId);

    if (!error) {
        setCurrentTitle(tempTitle);
        setChatHistory(prev => prev.map(item => item.id === sessionId ? { ...item, title: tempTitle } : item));
    }
    setIsEditingTitle(false);
    setShowTitleEditModal(false);
    setIsSavingTitle(false);
  };

  const cancelEditingTitle = () => {
    setIsEditingTitle(false);
  };


  // -- FILE HANDLING --
  const ensureSession = async (fallbackTitle) => {
    if (sessionId) return sessionId;
    const payload = {
      title: fallbackTitle,
      course_id: projectCourseId || null,
      category_id: projectCategory?.id || null,
      category_label: projectCategory?.label || null,
      project_config: projectConfig || null
    };
    if (user?.id) payload.user_id = user.id;
    let { data } = await supabase.from('chat_sessions').insert([payload]).select().single();
    if (!data && user?.id) {
      delete payload.user_id;
      const res = await supabase.from('chat_sessions').insert([payload]).select().single();
      data = res.data;
    }
    if (!data?.id) return null;
    setSessionId(data.id);
    setCurrentTitle(fallbackTitle);
    fetchChatHistory();
    return data.id;
  };

  const fetchUrlContent = async (url) => {
    try {
      const res = await fetch(`/api/fetch-url?url=${encodeURIComponent(url)}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  };

  const transcribeMedia = async (file) => {
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/transcribe', { method: 'POST', body: form });
      if (!res.ok) return null;
      const data = await res.json();
      return data?.text || null;
    } catch {
      return null;
    }
  };

  const handleFileUpload = async (e) => {
    if (isReadOnly) return;
    const files = Array.from(e.target.files || []);
    updateActivityStreak();
    if (files.length === 0) return;
    
    const currentSessionId = await ensureSession('Yeni Dosyalı Çalışma');
    if (!currentSessionId) {
      console.error("Sohbet oluşturulamadı.");
      return;
    }

    const newSources = [];
    for (const file of files) {
      console.log(`${file.name} analiz ediliyor...`);
      let extractedText = null;
      if (file.type === 'application/pdf') {
        const pdfResult = await extractTextFromPDF(file);
        if (pdfResult.success) extractedText = pdfResult.text;
      } else if (file.type.startsWith('text/')) {
        try {
          extractedText = await file.text();
        } catch {}
      } else if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
        extractedText = await transcribeMedia(file);
      }

      const reader = new FileReader();
      const promise = new Promise((resolve) => {
        reader.onload = async (event) => {
          const base64Data = event.target.result.split(',')[1];
          const payload = { name: file.name, mime_type: file.type, session_id: currentSessionId, text_content: extractedText || null };
          let { data: fileData, error } = await supabase
            .from('documents')
            .insert([payload]).select().single();
          if (error) {
            const retry = await supabase.from('documents').insert([{ name: file.name, mime_type: file.type, session_id: currentSessionId }]).select().single();
            fileData = retry.data;
          }

          const sourceObj = {
            id: fileData?.id || Math.random().toString(36).substr(2, 9),
            docId: fileData?.id || null,
            name: file.name,
            originalName: file.name,
            tags: [],
            mimeType: file.type,
            data: base64Data,
            isText: file.type.startsWith('text/'),
            textContent: extractedText || null,
            selected: true
          };

          if (!error && extractedText) {
            console.log(`Dosya ID: ${fileData.id} için RAG işlemi başlatılıyor...`);
            processDocumentForRAG(fileData.id, extractedText).then(success => {
              if(success) console.log("RAG entegrasyonu tamamlandı.");
            });
          }
          resolve(sourceObj);
        };
        reader.onerror = () => resolve(null);
      });
      reader.readAsDataURL(file);
      const src = await promise;
      if (src) newSources.push(src);
    }
    setSources(prev => [...prev, ...newSources]);
    e.target.value = '';
  };

  const addUrlSource = async () => {
    if (isReadOnly) return;
    const url = sourceUrl.trim();
    if (!url) return;
    updateActivityStreak();
    const currentSessionId = await ensureSession('Web Kaynağı');
    if (!currentSessionId) return;
    let displayName = 'Web URL';
    try {
      const parsed = new URL(url);
      displayName = parsed.hostname.replace('www.', '');
    } catch {}
    const fetched = await fetchUrlContent(url);
    const textContent = fetched?.text ? `Kaynak: ${url}\n\n${fetched.text}` : `Web URL: ${url}`;
    if (fetched?.title) displayName = fetched.title;
    let fileData = null;
    const insertPayload = { name: displayName, mime_type: 'text/url', session_id: currentSessionId, text_content: textContent, source_url: url };
    let { data, error } = await supabase.from('documents').insert([insertPayload]).select().single();
    if (error) {
      const fallback = { name: displayName, mime_type: 'text/url', session_id: currentSessionId, text_content: textContent };
      const retry = await supabase.from('documents').insert([fallback]).select().single();
      fileData = retry.data || null;
    } else {
      fileData = data;
    }
    const sourceObj = {
      id: fileData?.id || Math.random().toString(36).substr(2, 9),
      docId: fileData?.id || null,
      name: displayName,
      originalName: url,
      sourceUrl: url,
      tags: [],
      mimeType: 'text/url',
      data: null,
      isText: true,
      textContent,
      selected: true
    };
    setSources(prev => [sourceObj, ...prev]);
    setSourceUrl('');
  };

  const addTextSource = async () => {
    if (isReadOnly) return;
    const content = sourceText.trim();
    if (!content) return;
    updateActivityStreak();
    const currentSessionId = await ensureSession('Metin Kaynağı');
    if (!currentSessionId) return;
    const displayName = `Metin Notu ${new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
    const { data: fileData } = await supabase
      .from('documents')
      .insert([{ name: displayName, mime_type: 'text/plain', session_id: currentSessionId, text_content: content }])
      .select()
      .single();
    const sourceObj = {
      id: fileData?.id || Math.random().toString(36).substr(2, 9),
      docId: fileData?.id || null,
      name: displayName,
      originalName: displayName,
      tags: [],
      mimeType: 'text/plain',
      data: null,
      isText: true,
      textContent: content,
      selected: true
    };
    setSources(prev => [sourceObj, ...prev]);
    setSourceText('');
  };

  const pasteClipboardText = async () => {
    setIsPastingText(true);
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) setSourceText(prev => prev ? `${prev}\n${clip}` : clip);
    } catch {}
    setIsPastingText(false);
  };

  const removeSource = (id) => { if (isReadOnly) return; setSources(prev => prev.filter(s => s.id !== id)); };
  const startEditingSource = (file) => {
    setEditingSourceId(file.id);
    setEditingSourceName(file.name || '');
  };
  const cancelEditingSource = () => {
    setEditingSourceId(null);
    setEditingSourceName('');
  };
  const saveEditingSource = async (file) => {
    if (isReadOnly) return;
    const nextName = editingSourceName.trim();
    if (!nextName) return;
    setSources(prev => prev.map(s => s.id === file.id ? { ...s, name: nextName } : s));
    if (file.docId) {
      await supabase.from('documents').update({ name: nextName }).eq('id', file.docId);
    }
    cancelEditingSource();
  };

  const getSelectedSources = () => sources.filter(s => s.selected !== false);
  const getSelectedDocIds = () =>
    getSelectedSources().map(s => s.docId || s.id).filter(Boolean);

  const safeParseJson = (raw) => {
    if (!raw) return null;
    if (typeof raw === 'object') return raw;
    try {
      return JSON.parse(raw);
    } catch {}
    const objMatch = raw.match(/\{[\s\S]*\}/);
    if (objMatch) {
      try { return JSON.parse(objMatch[0]); } catch {}
    }
    const arrMatch = raw.match(/\[[\s\S]*\]/);
    if (arrMatch) {
      try { return JSON.parse(arrMatch[0]); } catch {}
    }
    return null;
  };

  const unwrapHistoryPayload = (payload) => {
    if (payload && typeof payload === 'object' && payload._data !== undefined) return payload._data;
    return payload;
  };

  const getHistoryMeta = (payload) => {
    if (payload && typeof payload === 'object' && payload._meta) return payload._meta;
    return null;
  };

  const getInteractionText = (data) => {
    if (!data) return '';
    if (typeof data === 'string') return data;
    try {
      return JSON.stringify(data, null, 2);
    } catch {
    return String(data);
    }
  };

  const getDeviceId = () => {
    if (typeof window === 'undefined') return '';
    const key = 'edunotebook_device_id';
    let id = localStorage.getItem(key);
    if (!id) {
      id = (crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
      localStorage.setItem(key, id);
    }
    return id;
  };

  const getCacheKey = async ({ toolId, docIds, template, category }) => {
    const raw = JSON.stringify({
      toolId,
      template,
      category,
      docIds: (docIds || []).slice().sort()
    });
    return await hashString(raw);
  };

  const hashString = async (value) => {
    if (!value) return '';
    try {
      if (crypto?.subtle) {
        const enc = new TextEncoder().encode(value);
        const buf = await crypto.subtle.digest('SHA-256', enc);
        return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
      }
    } catch {}
    return value;
  };

  const getTodayKey = () => new Date().toISOString().slice(0, 10);

  const ensureQuota = async () => {
    if (!user?.id) return { allowed: true, limit: 0, used: 0 };
    const today = getTodayKey();
    const DEFAULT_LIMIT = 40;
    let record = null;
    try {
      const { data } = await supabase
        .from('user_quota')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      record = data;
    } catch {}
    if (!record) {
      const payload = { user_id: user.id, daily_limit: DEFAULT_LIMIT, used_today: 0, last_reset: today };
      try { await supabase.from('user_quota').upsert(payload); } catch {}
      setQuotaInfo({ limit: DEFAULT_LIMIT, used: 0 });
      return { allowed: true, limit: DEFAULT_LIMIT, used: 0 };
    }
    let used = record.used_today || 0;
    let limit = record.daily_limit || DEFAULT_LIMIT;
    if (record.last_reset !== today) {
      used = 0;
      try {
        await supabase.from('user_quota').upsert({ user_id: user.id, daily_limit: limit, used_today: 0, last_reset: today });
      } catch {}
    }
    setQuotaInfo({ limit, used });
    if (used >= limit) return { allowed: false, limit, used };
    return { allowed: true, limit, used };
  };

  const consumeQuota = async () => {
    if (!user?.id) return;
    const today = getTodayKey();
    const nextUsed = (quotaInfo.used || 0) + 1;
    try {
      await supabase.from('user_quota').upsert({
        user_id: user.id,
        daily_limit: quotaInfo.limit || 40,
        used_today: nextUsed,
        last_reset: today
      });
      setQuotaInfo(prev => ({ ...prev, used: nextUsed }));
    } catch {}
  };

  const logUsage = async ({ toolId, sessionId, cached }) => {
    if (!user?.id) return;
    try {
      await supabase.from('usage_logs').insert([{
        user_id: user.id,
        session_id: sessionId || null,
        tool_id: toolId,
        cached: !!cached
      }]);
    } catch {}
  };

  const logAudit = async ({ action, entity, entityId, metadata }) => {
    if (!user?.id) return;
    try {
      await supabase.from('audit_logs').insert([{
        user_id: user.id,
        action,
        entity,
        entity_id: entityId ? String(entityId) : null,
        metadata: metadata || {}
      }]);
    } catch {}
  };

  const finalizeShareAccess = async (data) => {
    const deviceId = getDeviceId();
    let accessLogs = [];
    try {
      const res = await supabase
        .from('room_share_access')
        .select('id, device_id')
        .eq('share_id', data.id);
      accessLogs = res.data || [];
    } catch {}
    const totalViews = accessLogs.length;
    const uniqueDevices = new Set(accessLogs.map(l => l.device_id).filter(Boolean)).size;
    const hasDevice = accessLogs.some(l => l.device_id === deviceId);
    if (data.max_views && totalViews >= data.max_views) {
      setShareStatus('Görüntüleme limiti doldu.');
      setAccessDenied(true);
      return;
    }
    if (data.max_devices && !hasDevice && uniqueDevices >= data.max_devices) {
      setShareStatus('Cihaz limiti doldu.');
      setAccessDenied(true);
      return;
    }
    setRoomAccessRole(data.role || 'viewer');
    setAccessDenied(false);
    try {
      await supabase.from('room_share_access').insert([{
        share_id: data.id,
        session_id: data.session_id,
        role: data.role || 'viewer',
        user_id: user?.id || null,
        user_agent: navigator.userAgent,
        device_id: deviceId
      }]);
    } catch {}
  };

  const handleSharePasswordSubmit = async () => {
    if (!pendingShareData) return;
    const hashed = await hashString(sharePasswordInput.trim());
    if (!hashed || hashed !== pendingShareData.password_hash) {
      setSharePasswordError('Parola hatalı.');
      return;
    }
    sessionStorage.setItem(`share_pass_${pendingShareData.token}`, '1');
    setSharePasswordRequired(false);
    setSharePasswordInput('');
    setSharePasswordError('');
    await finalizeShareAccess(pendingShareData);
    setPendingShareData(null);
  };

  const copyInteractionOutput = async () => {
    const text = getInteractionText(interactionData);
    if (!text) return;
    await copyToClipboard(text);
  };

  const shareInteractionOutput = async () => {
    const text = getInteractionText(interactionData);
    if (!text) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: currentToolLabel, text });
      } catch {}
    } else {
      await copyToClipboard(text);
    }
  };

  const scrollToSource = (sourceId) => {
    if (!sourceId) return;
    if (isMobileView) setIsMobileSourcesOpen(true);
    setTimeout(() => {
      const el = document.getElementById(`source-item-${sourceId}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 180);
  };

  const toggleDictation = () => {
    const rec = recognitionRef.current;
    if (!rec) return;
    if (isDictating) {
      rec.stop();
      setIsDictating(false);
    } else {
      setIsDictating(true);
      rec.start();
    }
  };

  const createRoomShare = async () => {
    if (!sessionId) return;
    const token = (crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
    const expiresAt = shareExpireHours ? new Date(Date.now() + shareExpireHours * 3600 * 1000).toISOString() : null;
    const passwordHash = sharePassword ? await hashString(sharePassword.trim()) : null;
    const maxViews = shareMaxViews ? Number(shareMaxViews) : null;
    const maxDevices = shareDeviceLimit ? Number(shareDeviceLimit) : null;
    const payload = {
      session_id: sessionId,
      token,
      role: shareRole,
      created_by: user?.id || null,
      expires_at: expiresAt,
      password_hash: passwordHash || null,
      max_views: maxViews || null,
      max_devices: maxDevices || null
    };
    const { data, error } = await supabase.from('room_shares').insert([payload]).select().single();
    if (error || !data) {
      setShareStatus('Paylaşım oluşturulamadı');
      return;
    }
    logAudit({ action: 'share_created', entity: 'room_share', entityId: data.id, metadata: { role: shareRole, expiresAt, maxViews, maxDevices } });
    const link = `${window.location.origin}/room/${sessionId}?token=${data.token}`;
    setShareLink(link);
    setShareList(prev => [data, ...prev]);
    try {
      await navigator.clipboard.writeText(link);
      setShareStatus('Link kopyalandı');
      setTimeout(() => setShareStatus(''), 2000);
    } catch {
      setShareStatus('Kopyalanamadı');
      setTimeout(() => setShareStatus(''), 2000);
    }
  };

  const loadShareList = async () => {
    if (!sessionId || !isOwner) return;
    setIsShareLoading(true);
    const { data } = await supabase
      .from('room_shares')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });
    if (data) setShareList(data);
    setIsShareLoading(false);
  };

  const loadShareAccess = async () => {
    if (!sessionId || !isOwner) return;
    const { data } = await supabase
      .from('room_share_access')
      .select('*')
      .eq('session_id', sessionId)
      .order('accessed_at', { ascending: false })
      .limit(200);
    if (data) setShareAccessLogs(data);
  };

  const revokeShare = async (shareId) => {
    await supabase.from('room_shares').delete().eq('id', shareId);
    setShareList(prev => prev.filter(s => s.id !== shareId));
    logAudit({ action: 'share_revoked', entity: 'room_share', entityId: shareId });
  };

  const copyShareLink = async (token) => {
    const link = `${window.location.origin}/room/${sessionId}?token=${token}`;
    try {
      await navigator.clipboard.writeText(link);
      setShareStatus('Link kopyalandı');
      setTimeout(() => setShareStatus(''), 2000);
    } catch {
      setShareStatus('Kopyalanamadı');
      setTimeout(() => setShareStatus(''), 2000);
    }
  };

  const startTaggingSource = (file) => {
    setTaggingSourceId(file.id);
    setTagDraft((file.tags || []).join(', '));
  };

  const saveSourceTags = async (file) => {
    if (isReadOnly) return;
    const tags = tagDraft.split(',').map(t => t.trim()).filter(Boolean);
    setSources(prev => prev.map(s => s.id === file.id ? { ...s, tags } : s));
    if (file.docId) {
      try {
        await supabase.from('documents').update({ tags }).eq('id', file.docId);
      } catch {}
    }
    setTaggingSourceId(null);
    setTagDraft('');
  };

  const cancelSourceTags = () => {
    setTaggingSourceId(null);
    setTagDraft('');
  };

  const downloadTextFile = (filename, content, mime = 'text/plain') => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getWeakKeywords = (text) => {
    if (!text) return [];
    const stop = new Set(['ve','veya','ile','için','ama','fakat','ancak','bir','bu','şu','o','olarak','olan','olanı','nedir','ne','nasıl','neden','hangi','kadar','gibi','mı','mi','mu','mü','da','de','ki','eğer','her','en','çok','az','sadece']);
    return text
      .toLowerCase()
      .replace(/[^a-zğüşöçıİĞÜŞÖÇ0-9\s]/gi, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3 && !stop.has(w))
      .slice(0, 4);
  };

  const recordWeakTopics = (questions, answers) => {
    try {
      const key = `weak_topics_${user?.id || 'anon'}`;
      const store = JSON.parse(localStorage.getItem(key) || '{}');
      questions.forEach((q, idx) => {
        if (answers[idx] !== q.correctIndex) {
          const text = q.question || q.text || '';
          const keys = getWeakKeywords(text);
          keys.forEach(k => {
            store[k] = (store[k] || 0) + 1;
          });
        }
      });
      localStorage.setItem(key, JSON.stringify(store));
    } catch {}
  };

  const addBadge = (badge) => {
    try {
      const key = `badges_${user?.id || 'anon'}`;
      const list = JSON.parse(localStorage.getItem(key) || '[]');
      if (!list.includes(badge)) list.push(badge);
      localStorage.setItem(key, JSON.stringify(list));
      setEarnedBadges(list);
    } catch {}
  };

  const saveJuryMemory = async (text, tag = '') => {
    if (!sessionId || !text) return;
    const item = { text: text.slice(0, 500), at: new Date().toISOString(), tag };
    try {
      await supabase.from('jury_memory').insert([{
        session_id: sessionId,
        user_id: user?.id || null,
        category_id: categoryId,
        text: item.text,
        tag: tag || null
      }]);
      await loadJuryMemory();
    } catch {
      const key = `jury_memory_${sessionId}`;
      const list = JSON.parse(localStorage.getItem(key) || '[]');
      const next = [item, ...list].slice(0, 20);
      localStorage.setItem(key, JSON.stringify(next));
      setJuryMemory(next);
    }
  };

  const clearJuryMemory = async () => {
    if (!sessionId) return;
    try {
      await supabase.from('jury_memory').delete().eq('session_id', sessionId);
    } catch {}
    localStorage.removeItem(`jury_memory_${sessionId}`);
    setJuryMemory([]);
  };

  const getSourceIcon = (file) => {
    const mime = file?.mimeType || '';
    if (mime === 'text/url') return Link2;
    if (mime.startsWith('image/')) return ImageIcon;
    if (mime.startsWith('audio/')) return Mic;
    if (mime.startsWith('video/')) return Video;
    if (mime.includes('pdf') || mime.includes('word') || mime.includes('officedocument')) return FileText;
    if (mime.startsWith('text/')) return FileText;
    return FileText;
  };

  const getSourceBadgeClass = (file) => {
    const mime = file?.mimeType || '';
    if (mime === 'text/url') return 'bg-[#1f2a44] text-[var(--accent-3)]';
    if (mime.startsWith('image/')) return 'bg-[#3a2a11] text-[var(--accent)]';
    if (mime.startsWith('audio/')) return 'bg-[#1b2a2f] text-[var(--accent-2)]';
    if (mime.startsWith('video/')) return 'bg-[#2a1b2f] text-[var(--accent-3)]';
    return 'bg-[#172036] text-[var(--accent-3)]';
  };

  const sourceSearchResults = useMemo(() => {
    const q = sourceSearch.trim().toLowerCase();
    if (!q) return [];
    const results = [];
    sources.forEach(src => {
      if (!src.textContent) return;
      const idx = src.textContent.toLowerCase().indexOf(q);
      if (idx === -1) return;
      const start = Math.max(0, idx - 80);
      const end = Math.min(src.textContent.length, idx + 120);
      results.push({
        id: src.id,
        name: src.name,
        snippet: src.textContent.slice(start, end).replace(/\s+/g, ' ').trim()
      });
    });
    return results.slice(0, 6);
  }, [sourceSearch, sources]);

  const allTags = useMemo(() => {
    const set = new Set();
    sources.forEach(s => (s.tags || []).forEach(t => set.add(t)));
    return Array.from(set);
  }, [sources]);

  const visibleSources = useMemo(() => {
    if (!tagFilter) return sources;
    return sources.filter(s => (s.tags || []).includes(tagFilter));
  }, [sources, tagFilter]);

  const sourceTimeline = useMemo(() => {
    if (!sources.length || !interactionHistory.length) return [];
    return sources.map(src => {
      const id = src.docId || src.id;
      const items = interactionHistory.filter(item => {
        const meta = getHistoryMeta(item.payload);
        return meta?.sourceIds?.includes(id);
      });
      return { source: src, items: items.slice(0, 3) };
    }).filter(entry => entry.items.length > 0);
  }, [sources, interactionHistory]);


  const prepareContentParts = (extraText = "", inputSources = null) => {
    const list = inputSources || getSelectedSources();
    const parts = [];
    list.forEach(src => {
      if (src?.data) {
        parts.push({ inlineData: { mimeType: src.mimeType, data: src.data } });
      } else if (src?.textContent) {
        parts.push({ text: src.textContent });
      }
    });
    if (extraText) parts.push({ text: extraText });
    return parts.length > 0 ? parts : null;
  };

  // -- CHAT LOGIC --
  const handleSendMessage = async () => {
    if (!canComment) return;
    if (!inputValue.trim()) return;

    const selectedSources = getSelectedSources();
    if (sources.length > 0 && selectedSources.length === 0) {
      setMessages(prev => [...prev, { role: 'model', text: "Lütfen en az bir kaynak seçin." }]);
      return;
    }

    updateActivityStreak();
    
    let currentSessionId = sessionId;
    if (!currentSessionId) {
        const newTitle = inputValue.substring(0, 30) + '...';
        const payload = { 
          title: newTitle,
          course_id: projectCourseId || null,
          category_id: projectCategory?.id || null,
          category_label: projectCategory?.label || null,
          project_config: projectConfig || null
        };
        if (user?.id) payload.user_id = user.id;
        let { data } = await supabase.from('chat_sessions').insert([payload]).select().single();
        if (!data && user?.id) {
          delete payload.user_id;
          const res = await supabase.from('chat_sessions').insert([payload]).select().single();
          data = res.data;
        }
        setSessionId(data.id);
        setCurrentTitle(newTitle);
        currentSessionId = data.id;
        fetchChatHistory();
    }

    const userText = inputValue;
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setHasSentMessage(true);
    setIsChatLoading(true);

    if (currentSessionId) {
      await supabase.from('chat_messages').insert([{ session_id: currentSessionId, role: 'user', content: userText }]);
    }

    try {
      console.log("Veritabanında alakalı içerik aranıyor...");
      const selectedDocIds = getSelectedDocIds();
      const relevantContext = await searchRelevantContent(userText, selectedDocIds);
      
      let systemInstructionText = SYSTEM_PROMPT;
      let hasContext = false;
      let userPromptParts = [{ text: userText }];

      if (relevantContext) {
        console.log("Alakalı içerik bulundu.");
        systemInstructionText += `\n\nKULLANACAĞIN REFERANS BİLGİLER:\n---\n${relevantContext}\n---`;
        hasContext = true;
      } else if (selectedSources.length > 0) {
           const parts = prepareContentParts(userText, selectedSources);
           if (parts) {
             userPromptParts = parts;
           } else if (selectedDocIds.length > 0) {
             const broadContext = await fetchBroadContext({ sessionId: currentSessionId, docIds: selectedDocIds });
              if (broadContext) {
                systemInstructionText += `\n\nKULLANACAĞIN REFERANS BİLGİLER:\n---\n${broadContext}\n---`;
                hasContext = true;
              }
            }
      }
      
      if (!hasContext && userPromptParts.length === 1 && userPromptParts[0]?.text === userText && selectedSources.length > 0) {
        setMessages(prev => [...prev, { role: 'model', text: "Seçili kaynaklardan içerik okunamadı. Lütfen metin içeren bir dosya seçin veya tekrar yükleyin." }]);
        return;
      }

      const payload = {
        contents: [{ role: "user", parts: userPromptParts }],
        systemInstruction: { parts: [{ text: systemInstructionText }] }
      };

      const result = await apiCall('generateContent', payload);
      const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text || "Bir hata oluştu.";
      
      setMessages(prev => [...prev, { role: 'model', text: responseText, sources: selectedSources.map(s => s.name) }]);

      if (currentSessionId) {
        await supabase.from('chat_messages').insert([{ session_id: currentSessionId, role: 'model', content: responseText }]);
      }

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: "Hata oluştu." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // -- INTERACTION --
 // -- INTERACTION (DÜZELTİLMİŞ VERSİYON) --
  const handleInteraction = async (type) => {
  if (isReadOnly) {
    setInteractionData("Bu oda salt-okunur. Etkileşim araçları kapalı.");
    setIsInteractionLoading(false);
    return;
  }
  setInteractionType(type);
  setIsInteractionLoading(true);
  setInteractionData(null);
  if (isMobileView) {
    setIsInteractionModalOpen(true);
    setIsMobileToolsOpen(false);
  }
  // State temizliği
  setUserQuizAnswers({}); setOpenAnswers({}); setEvaluations({});
  setCurrentCardIndex(0); setIsCardFlipped(false); setExamAnswers({}); setExamResult(null); setIsGradingExam(false);

  try {
      let currentSessionId = sessionId;
      if (!currentSessionId) {
        const payload = { 
          title: 'Etkileşim Çalışması',
          course_id: projectCourseId || null,
          category_id: projectCategory?.id || null,
          category_label: projectCategory?.label || null,
          project_config: projectConfig || null
        };
        if (user?.id) payload.user_id = user.id;
        let { data } = await supabase.from('chat_sessions').insert([payload]).select().single();
        if (!data && user?.id) {
          delete payload.user_id;
          const res = await supabase.from('chat_sessions').insert([payload]).select().single();
          data = res.data;
        }
        if (data?.id) {
          setSessionId(data.id);
          currentSessionId = data.id;
          fetchChatHistory();
        }
      }

      let contextText = "";
      let userPromptParts = null;
      const selectedSources = getSelectedSources();
      const selectedDocIds = getSelectedDocIds();

      if (sources.length > 0 && selectedSources.length === 0) {
        setInteractionData("Lütfen en az bir kaynak seçin.");
        setIsInteractionLoading(false);
        return;
      }

      // 1. ÖNCE EKRANDAKİ KAYNAKLARA BAK (En hızlı yöntem)
      // Not: Metin çıkarımı yapılmadıysa binary dosyalarda text üretmeyiz.
      if (selectedSources.length > 0) {
          console.log("Etkileşim için yerel kaynaklar kullanılıyor.");
          userPromptParts = prepareContentParts("", selectedSources);
      }

      // 2. EĞER EKRAN BOŞSA, VERİTABANINA GİT (Geniş Bağlam)
      if (!userPromptParts) {
        console.log("Yerel kaynak yok, veritabanından geniş bağlam çekiliyor...");
        const dbContext = await fetchBroadContext({ sessionId: currentSessionId, docIds: selectedDocIds });
        if (dbContext) {
            contextText = dbContext;
        }
      }

      // 3. HÂLÂ VERİ YOKSA UYARI VER
      if (!userPromptParts && !contextText) {
          setInteractionData("İşlem yapabilmek için lütfen önce bir kaynak yükleyin.");
          setIsInteractionLoading(false);
          return;
      }

      // Prompt Hazırlığı
      let prompt = "";
      let responseMimeType = "text/plain";

        if (type === 'SUMMARY') prompt = "Aşağıdaki metinleri kullanarak detaylı, maddeler halinde bir özet çıkar.";
        
        else if (type === 'FEYNMAN') {
            prompt = `Aşağıdaki metni "Feynman Tekniği" ile 5 yaşındaki bir çocuğun anlayacağı şekilde anlat. 
            Zor terimleri sadeleştir ve mutlaka 2-3 metafor kullan (ör. hücreyi fabrika gibi anlat). 
            Çıktı düz metin olsun.`;
        }
        else if (type === 'STORY') {
            prompt = `Aşağıdaki konuyu bir masal veya süper kahraman hikayesi gibi anlat. Kısa, eğlenceli ve basit olsun.`;
        }
        else if (type === 'ELI5') {
            prompt = `Aşağıdaki metni 5 yaşındaki bir çocuğun anlayacağı kadar basit anlat. Günlük hayattan 2 örnek ver.`;
        }
        else if (type === 'VISUAL_CARDS') {
            prompt = `Aşağıdaki metinden 6 adet "resimli kart" hazırla. Emoji + kısa tanım.
            JSON format: { "cards": [{ "emoji": "🧪", "term": "...", "meaning": "..." }] }`;
            responseMimeType = "application/json";
        }
        else if (type === 'RIDDLES') {
            prompt = `Aşağıdaki metinden 4 adet "Ben neyim?" bilmece sorusu üret.
            JSON format: { "questions": [{ "id": "r1", "text": "..." }] }`;
            responseMimeType = "application/json";
        }
        else if (type === 'MINI_QUIZ') {
            prompt = `Aşağıdaki metinden 3 adet çok kolay çoktan seçmeli soru üret.
            JSON format: { "questions": [{ "question": "...", "options": ["A","B","C"], "correctIndex": 0 }] }`;
            responseMimeType = "application/json";
        }
        else if (type === 'STUDY_NOTES') {
            prompt = `Aşağıdaki metni sınav notu gibi, kısa madde madde özetle.`;
        }
        else if (type === 'QUIZ_YKS') {
            prompt = `Aşağıdaki metne dayanarak 5 adet YKS formatında çoktan seçmeli soru hazırla.
            Seçenekler A,B,C,D,E olsun.
            JSON format: { "questions": [{ "question": "...", "options": ["A)...","B)...","C)...","D)...","E)..."], "correctIndex": 0 }] }`;
            responseMimeType = "application/json";
        }
        else if (type === 'MEMORIZE') {
            prompt = `Aşağıdaki metinden ezberlenmesi gereken formülleri, tarihleri veya tanımları listele.
            JSON format: { "items": ["...","..."] }`;
            responseMimeType = "application/json";
        }
        else if (type === 'STUDY_PLAN') {
            prompt = `Aşağıdaki metne göre 1 günlük saatlik çalışma planı çıkar (ör. 10:00-10:45 ...).
            JSON format: { "plan": ["10:00-10:45 ...", "..."] }`;
            responseMimeType = "application/json";
        }
        else if (type === 'TRUE_FALSE') {
            prompt = `Aşağıdaki metinden 6 adet Doğru/Yanlış sorusu üret.
            JSON format: { "items": [{ "statement": "...", "isTrue": true }] }`;
            responseMimeType = "application/json";
        }
        else if (type === 'ACADEMIC_SUMMARY') {
            prompt = `Aşağıdaki metni akademik ve literatür diline uygun şekilde detaylı özetle.
            Her paragrafta [1], [2] gibi atıflar kullan ve sonda APA formatında kısa kaynakça ver.`;
        }
        else if (type === 'ESSAY_OUTLINE') {
            prompt = `Aşağıdaki metne dayanarak bir makale taslağı oluştur.
            Bölümlerde (Yılmaz, 2023) gibi örnek atıflar kullan ve en sonda APA formatında örnek kaynakça ver.
            JSON format: { "title": "...", "sections": ["Giriş ... (Yılmaz, 2023)", "..."], "references": ["Yılmaz, A. (2023). ..."] }`;
            responseMimeType = "application/json";
        }
        else if (type === 'EXAM_SIM') {
            prompt = `Aşağıdaki metinden zor düzeyde 3 klasik + 2 yorum sorusu üret.
            JSON format: { "questions": [{ "id": 1, "type": "open", "text": "..." }] }`;
            responseMimeType = "application/json";
        }
        else if (type === 'CONCEPT_MAP') {
            prompt = `Aşağıdaki metindeki kavramlar arası ilişkileri madde madde yaz.
            JSON format: { "links": ["Kavram A -> Kavram B (ilişki)", "..."] }`;
            responseMimeType = "application/json";
        }
        else if (type === 'CRITIQUE') {
            prompt = `Aşağıdaki metindeki argümanların güçlü ve zayıf yanlarını eleştir.
            JSON format: { "strengths": ["..."], "weaknesses": ["..."] }`;
            responseMimeType = "application/json";
        }
        else if (type === 'PITCH') {
            prompt = `Aşağıdaki projeyi jüriye sunmak için 2 dakikalık etkileyici bir sunum metni yaz.`;
        }
        else if (type === 'DEFENSE') {
            prompt = `Aşağıdaki projeye gelebilecek 6 zor jüri sorusu ve her biri için kısa savunma cevabı yaz.
            JSON format: { "qa": [{ "q": "...", "a": "..." }] }`;
            responseMimeType = "application/json";
        }
        else if (type === 'CONCEPT_EXPLAIN') {
            prompt = `Aşağıdaki projedeki tasarım kararlarını felsefi/teknik dille gerekçelendir.`;
        }
        else if (type === 'ALT_SCENARIOS') {
            prompt = `Aşağıdaki proje için 3 alternatif senaryo üret ve her birinin artı/eksi yönlerini yaz.
            JSON format: { "scenarios": [{ "title": "...", "pros": ["..."], "cons": ["..."] }] }`;
            responseMimeType = "application/json";
        }
        else if (type === 'HARSH_Q') {
            prompt = `Tez savunmasında gelebilecek en acımasız 8 soru üret.
            JSON format: { "questions": ["...", "..."] }`;
            responseMimeType = "application/json";
        }
        else if (type === 'METHODOLOGY') {
            prompt = `Aşağıdaki tez metninin metodoloji kısmındaki olası eksikleri tespit et.
            Her madde için risk seviyesi ve kısa düzeltme önerisi ver.
            JSON format: { "issues": ["[Yüksek] ... - Öneri: ...", "[Orta] ... - Öneri: ..."] }`;
            responseMimeType = "application/json";
        }
        else if (type === 'ELEVATOR') {
            prompt = `Tezi 3 dakikada özetleyen kısa bir konuşma yaz (asansör konuşması).`;
        }
        else if (type === 'LIT_REVIEW') {
            prompt = `Aşağıdaki metindeki kaynakça/atıf bilgilerini özetle (ana temalar ve öne çıkan kaynaklar).`;
        }
        else if (type === 'ROLEPLAY') {
            setInteractionData({ mode: 'roleplay' });
            setIsInteractionLoading(false);
            return;
        }
        else if (type === 'STRESS_TEST') {
            prompt = `Aşağıdaki metne dayanarak 8 hızlı jüri/savunma sorusu üret.
            JSON format: { "questions": ["...","..."] }`;
            responseMimeType = "application/json";
        }
        else if (type === 'MINUTES') {
            prompt = `Aşağıdaki metinden toplantı tutanağı çıkar (Kim, Ne dedi?).
            JSON format: { "minutes": ["Kişi: ...", "..."] }`;
            responseMimeType = "application/json";
        }
        else if (type === 'ACTIONS') {
            prompt = `Aşağıdaki metinden aksiyon listesi çıkar.
            Varsa tarih bilgisini "due" alanında ISO formatında belirt, yoksa null yaz.
            JSON format: { "actions": [{ "task": "...", "owner": "...", "due": null }] }`;
            responseMimeType = "application/json";
        }
        else if (type === 'FOLLOW_UP') {
            prompt = `Aşağıdaki metne dayanarak katılımcılara gönderilecek profesyonel bir takip e-postası yaz.`;
        }
        else if (type === 'SWOT') {
            prompt = `Aşağıdaki kararı SWOT analiziyle değerlendir.
            JSON format: { "strengths": ["..."], "weaknesses": ["..."], "opportunities": ["..."], "threats": ["..."] }`;
            responseMimeType = "application/json";
        }
        else if (type === 'MNEMONIC') {
            prompt = `Aşağıdaki metinden ezberlenmesi zor 3-5 terim/listeleri seç ve her biri için akılda kalıcı, komik veya kafiyeli bir mnemonik üret.
            Çıktı JSON formatında olsun:
            { "items": [{ "topic": "Terimler/Listeler", "mnemonic": "..." }] }`;
            responseMimeType = "application/json";
        }
        else if (type === 'CONNECTOR') {
            prompt = `Aşağıdaki metinden birbirinden uzak iki kavram seç ve aralarındaki ilişkiyi kuran bir zincir açıkla.
            Çıktı JSON formatında olsun:
            { "conceptA": "...", "conceptB": "...", "question": "Bu ikisi arasında nasıl bir ilişki var?", "explanation": "..." }`;
            responseMimeType = "application/json";
        }
      else if (type === 'VERSUS') {
            prompt = `Aşağıdaki metinden sık karıştırılan iki kavram seç ve aralarındaki farkları tablo halinde karşılaştır.
            Tabloyu Markdown olarak üret (Başlık satırı + 4-6 satır).`;
        }
      else if (type === 'PRESENTATION') {
            prompt = `Aşağıdaki metne dayanarak 10-12 slaytlık, sunuma hazır bir taslak üret.
            Dil tonu: ${presentationTone === 'academic' ? 'Akademik' : presentationTone === 'story' ? 'Hikayeleştirici' : 'İş / profesyonel'}.
            Her slayt için başlık, maddeler, kısa not ve görsel önerisi ver.
            JSON formatında çıktı ver:
            { "title": "Sunum Başlığı", "slides": [{ "title": "Slayt Başlığı", "bullets": ["Madde 1","Madde 2"], "notes": "Kısa konuşmacı notu", "visual": "Önerilen görsel" }] }`;
            responseMimeType = "application/json";
        }

        if (['DEFENSE','STRESS_TEST','PITCH','HARSH_Q','METHODOLOGY','CONCEPT_EXPLAIN'].includes(type) && juryMemory.length > 0) {
          const memoryBlock = juryMemory.slice(0, 5).map(m => `- ${m.text}`).join('\n');
          prompt += `\n\nGEÇMİŞ JÜRİ/TEZ ELEŞTİRİLERİ:\n${memoryBlock}\nBu eleştirilerle uyumlu, tekrarları yakalayan sorular üret.`;
        }
        
        else if (type === 'QUIZ') { 
            // Cevap anahtarının net olması için promptu sıkılaştırdık
            prompt = `Aşağıdaki metne dayanarak 5 adet çoktan seçmeli soru hazırla. 
            Çıktı SADECE şu JSON formatında olsun: 
            { "questions": [{ "question": "Soru metni...", "options": ["A şıkkı","B şıkkı","C şıkkı","D şıkkı"], "correctIndex": 0, "explanation": "Neden doğru olduğunun kısa açıklaması..." }] }`; 
            responseMimeType = "application/json"; 
        }
      else if (type === 'OPEN') { 
          prompt = `Aşağıdaki metinlerden 3 adet düşündürücü, ucu açık klasik sınav sorusu hazırla. JSON format: { "questions": [{ "id": "q1", "text": "..." }] }`; 
          responseMimeType = "application/json"; 
      }
      else if (type === 'SOCRATIC') {
          prompt = `Bir Sokratik Hoca gibi davran. Aşağıdaki metne dayanarak öğrenciyi cevaba götüren 6-8 yönlendirici soru hazırla.
          ASLA doğrudan cevap verme. JSON format: { "questions": [{ "id": "s1", "text": "..." }] }`;
          responseMimeType = "application/json";
      }
      else if (type === 'FLASHCARDS') { 
          prompt = `Aşağıdaki metinlerden öğrencinin ezberlemesi gereken 8 adet bilgi kartı (Kavram - Açıklama) hazırla. JSON format: { "cards": [{ "front": "...", "back": "..." }] }`; 
          responseMimeType = "application/json"; 
      }
      else if (type === 'GLOSSARY') { 
          prompt = `Metindeki en önemli teknik terimleri ve tanımlarını listele. JSON format: { "terms": [{ "term": "...", "definition": "..." }] }`; 
          responseMimeType = "application/json"; 
      }
    else if (type === 'EXAM') { 
        // Sınav modunda soruların içinde cevabın OLMADIĞINDAN emin oluyoruz
        prompt = `Aşağıdaki metinleri kullanarak zorlu bir sınav hazırla. 
        Yapı: 5 Çoktan Seçmeli (Her biri 10 puan) + 2 Klasik (Her biri 25 puan). Toplam 100 puan.
        Çıktı SADECE şu JSON formatında olsun (Cevapları verme, sadece soruları ver):
        { 
          "examTitle": "Konu Tarama Sınavı", 
          "questions": [
            { "id": 1, "type": "mc", "points": 10, "text": "Soru metni...", "options": ["Seçenek A", "Seçenek B", "Seçenek C", "Seçenek D"] },
            { "id": 6, "type": "open", "points": 25, "text": "Klasik soru metni..." }
          ] 
        }`; 
        responseMimeType = "application/json"; 
    }

      const templateHints = {
        balanced: "Dengeli: ana fikir + kısa açıklamalar + mümkünse örnek.",
        short: "Kısa: en kritik noktaları tek paragrafta özetle.",
        detailed: "Detaylı: kapsamlı açıklama + alt başlıklar + gerekirse örnekler.",
        bullet: "Madde madde: net kısa cümleler ve listeler.",
        exam: "Sınav odaklı: kritik tanımlar, formüller, sık sorulan noktalar."
      };
      if (templateHints[outputTemplate]) {
        prompt += `\n\nŞABLON: ${templateHints[outputTemplate]}`;
      }

      const cacheKey = await getCacheKey({
        toolId: type,
        docIds: selectedDocIds,
        template: outputTemplate,
        category: categoryId
      });
      if (cacheKey) {
        try {
          if (user?.id) {
            const { data: cached } = await supabase
              .from('interaction_cache')
              .select('*')
              .eq('cache_key', cacheKey)
              .eq('user_id', user.id)
              .maybeSingle();
            if (cached && (!cached.expires_at || new Date(cached.expires_at) > new Date())) {
              setInteractionData(cached.payload);
              const meta = cached.meta || {};
              setCurrentSourceMeta({ names: meta.sourceNames || [], ids: meta.sourceIds || [] });
              setCurrentInteractionMeta({ ...meta, cached: true });
              setIsInteractionLoading(false);
              await logUsage({ toolId: type, sessionId: currentSessionId, cached: true });
              return;
            }
          }
        } catch {}
        try {
          const localRaw = localStorage.getItem(`interaction_cache_${cacheKey}`);
          if (localRaw) {
            const local = JSON.parse(localRaw);
            if (!local.expires_at || new Date(local.expires_at) > new Date()) {
              setInteractionData(local.payload);
              const meta = local.meta || {};
              setCurrentSourceMeta({ names: meta.sourceNames || [], ids: meta.sourceIds || [] });
              setCurrentInteractionMeta({ ...meta, cached: true });
              setIsInteractionLoading(false);
              return;
            }
          }
        } catch {}
      }

      const quota = await ensureQuota();
      if (!quota.allowed) {
        setInteractionData(`Günlük limit doldu (${quota.used}/${quota.limit}). Lütfen yarın tekrar dene.`);
        setIsInteractionLoading(false);
        return;
      }

      // Yapay Zeka İsteği (Context Injection)
      const systemInstructionText = contextText
        ? `${SYSTEM_PROMPT}\n\nKULLANACAĞIN KAYNAK METİN:\n---\n${contextText}\n---`
        : SYSTEM_PROMPT;

      const parts = userPromptParts
        ? [...userPromptParts, { text: prompt }]
        : [{ text: prompt }];

      const payload = {
          contents: [{ role: "user", parts }],
          systemInstruction: { parts: [{ text: systemInstructionText }] },
          generationConfig: { responseMimeType }
      };

      const result = await apiCall('generateContent', payload);
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
      
      const textTypes = new Set([
        'SUMMARY','FEYNMAN','VERSUS','STORY','ELI5','STUDY_NOTES','ACADEMIC_SUMMARY','PITCH','CONCEPT_EXPLAIN','ELEVATOR','LIT_REVIEW','FOLLOW_UP'
      ]);
      let finalPayload = text;
      if (textTypes.has(type)) {
        setInteractionData(text);
      } else {
        const parsed = safeParseJson(text);
        if (!parsed) {
          setInteractionData("Çıktı okunamadı. Lütfen tekrar deneyin.");
          setIsInteractionLoading(false);
          return;
        }
        finalPayload = parsed;
        if (type === 'PRESENTATION' && finalPayload?.slides?.length) {
          finalPayload = {
            ...finalPayload,
            slides: finalPayload.slides.map(s => ({ ...s, notes: s.notes || '', longNotes: s.longNotes || '', visual: s.visual || '' }))
          };
          finalPayload = normalizePresentation(finalPayload);
          applyPresentationPack('focus');
        }
        setInteractionData(finalPayload);
      }
      setCurrentSourceMeta({ names: selectedSources.map(s => s.name), ids: selectedDocIds });

      const preview = typeof finalPayload === 'string'
        ? finalPayload.slice(0, 120)
        : (finalPayload?.title || finalPayload?.examTitle || finalPayload?.question || finalPayload?.conceptA || finalPayload?.items?.[0]?.mnemonic || 'Çıktı');
      const nextVersion = interactionHistory.filter(item => item.tool_id === type).length + 1;
      const meta = {
        sourceIds: selectedDocIds,
        sourceNames: selectedSources.map(s => s.name),
        createdAt: new Date().toISOString(),
        version: nextVersion,
        tag: interactionTagDraft.trim() || null,
        template: outputTemplate
      };
      setCurrentInteractionMeta(meta);
      setInteractionTagDraft('');
      await saveInteractionHistory({
        sid: currentSessionId,
        toolId: type,
        toolLabel: getToolLabel(type),
        payload: finalPayload,
        preview,
        meta
      });
      if (cacheKey) {
        const cacheItem = {
          cache_key: cacheKey,
          user_id: user?.id || null,
          session_id: currentSessionId,
          tool_id: type,
          template: outputTemplate,
          payload: finalPayload,
          meta,
          expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()
        };
        try {
          if (user?.id) {
            await supabase.from('interaction_cache').upsert(cacheItem, { onConflict: 'cache_key' });
          }
        } catch {}
        try {
          localStorage.setItem(`interaction_cache_${cacheKey}`, JSON.stringify(cacheItem));
        } catch {}
      }
      await consumeQuota();
      await logUsage({ toolId: type, sessionId: currentSessionId, cached: false });
      if (['DEFENSE','STRESS_TEST','PITCH','HARSH_Q','METHODOLOGY','CONCEPT_EXPLAIN'].includes(type)) {
        const memText = typeof finalPayload === 'string'
          ? finalPayload
          : JSON.stringify(finalPayload);
        saveJuryMemory(memText, type);
      }

  } catch (error) {
      console.error("Etkileşim Hatası:", error);
      setInteractionData("İçerik oluşturulurken bir hata meydana geldi. Lütfen tekrar deneyin.");
  } finally {
      setIsInteractionLoading(false);
  }
};

  const handleEvaluateAnswer = async (questionId, questionText, userAnswer) => {
    if (!userAnswer.trim()) return;
    setEvaluatingIds(prev => new Set(prev).add(questionId));
    const prompt = `KAYNAK KONTROLÜ: SORU: ${questionText} ÖĞRENCİ CEVABI: ${userAnswer} JSON Yanıtla: { "isCorrect": boolean, "feedback": "...", "sourceFact": "..." }`;
    try {
      const selectedSources = getSelectedSources();
      const selectedDocIds = getSelectedDocIds();
      let parts = prepareContentParts(prompt, selectedSources);
      let systemInstructionText = SYSTEM_PROMPT;
      if (!parts && selectedDocIds.length > 0) {
        const broadContext = await fetchBroadContext({ sessionId, docIds: selectedDocIds });
        if (broadContext) {
          systemInstructionText += `\n\nKULLANACAĞIN REFERANS BİLGİLER:\n---\n${broadContext}\n---`;
        }
      }
      if (!parts) parts = [{ text: prompt }];
      const payload = { contents: [{ role: "user", parts }], systemInstruction: { parts: [{ text: systemInstructionText }] }, generationConfig: { responseMimeType: "application/json" } };
      const result = await apiCall('generateContent', payload);
      const parsed = safeParseJson(result.candidates?.[0]?.content?.parts?.[0]?.text);
      if (parsed) {
        setEvaluations(prev => ({ ...prev, [questionId]: parsed }));
      }
    } catch (error) { console.error(error); } finally { setEvaluatingIds(prev => { const next = new Set(prev); next.delete(questionId); return next; }); }
  };

  const handleSubmitExam = async () => {
    if (!interactionData || !interactionData.questions) return;
    setIsGradingExam(true);
    
    // Öğretmene (AI) öğrencinin kağıdını gönderiyoruz
    const prompt = `
    SEN BİR ÖĞRETMENSİN. AŞAĞIDAKİ SINAVI PUANLA.
    
    SORULAR VE CEVAP ANAHTARI (Sen metinden biliyorsun):
    ${JSON.stringify(interactionData.questions)}
    
    ÖĞRENCİNİN CEVAPLARI:
    ${JSON.stringify(examAnswers)}
    
    GÖREV: Her soruyu tek tek değerlendir.
    ÇIKTI JSON FORMATI:
    { 
      "totalScore": 75, 
      "letterGrade": "CB", 
      "generalFeedback": "Genel olarak iyi ama şu konularda eksiğin var...", 
      "results": [
        { "questionId": 1, "isCorrect": true, "score": 10, "feedback": "Doğru cevap." },
        { "questionId": 6, "isCorrect": false, "score": 5, "feedback": "Kısmen doğru ama şu eksik..." }
      ] 
    }`;

    try {
      const selectedSources = getSelectedSources();
      const selectedDocIds = getSelectedDocIds();
      let parts = prepareContentParts("", selectedSources);
      let systemInstructionText = SYSTEM_PROMPT;
      if (!parts && selectedDocIds.length > 0) {
        const broadContext = await fetchBroadContext({ sessionId, docIds: selectedDocIds });
        if (broadContext) {
          systemInstructionText += `\n\nKULLANACAĞIN REFERANS BİLGİLER:\n---\n${broadContext}\n---`;
        }
      }
      parts = parts ? [...parts, { text: prompt }] : [{ text: prompt }];

      const payload = { 
        contents: [{ role: "user", parts }], 
        systemInstruction: { parts: [{ text: systemInstructionText }] },
        generationConfig: { responseMimeType: "application/json" } 
      };
      
      const result = await apiCall('generateContent', payload);
      const parsed = safeParseJson(result.candidates?.[0]?.content?.parts?.[0]?.text);
      if (parsed) setExamResult(parsed);
    } catch (error) { 
        alert("Sınav puanlanırken hata oluştu."); 
        console.error(error);
    } finally { 
        setIsGradingExam(false); 
    }
  };

  const renderTextBlock = (title, content) => (
    <div className="p-4 rounded-2xl bg-[var(--panel-2)] border border-[var(--border)]">
      <div className="text-[10px] tracking-[0.3em] font-bold text-[var(--accent)] mb-3">{title}</div>
      <SimpleMarkdownRenderer content={content} />
    </div>
  );

  useEffect(() => {
    if (!presentationRunning) return;
    if (presentationTimerSec <= 0) return;
    const t = setTimeout(() => setPresentationTimerSec(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [presentationRunning, presentationTimerSec]);

  useEffect(() => {
    if (presentationTimerSec === 0 && presentationRunning) {
      if (presentationAutoAdvance && presentationFullScreen) {
        setPresentationActiveIndex(i => Math.min((interactionData?.slides?.length || 1) - 1, i + 1));
        if (interactionData?.slides?.length) {
          setPresentationTimerSec(estimateSlideSeconds(interactionData.slides[Math.min(interactionData.slides.length - 1, presentationActiveIndex + 1)]));
        }
      } else {
        setPresentationRunning(false);
      }
    }
  }, [presentationTimerSec, presentationRunning]);

  useEffect(() => {
    if (!presentationFullScreen) return;
    const handler = (e) => {
      if (e.key === 'ArrowRight') {
        setPresentationActiveIndex(i => Math.min(interactionData.slides.length - 1, i + 1));
      }
      if (e.key === 'ArrowLeft') {
        setPresentationActiveIndex(i => Math.max(0, i - 1));
      }
      if (e.key === 'Escape') {
        setPresentationFullScreen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [presentationFullScreen, interactionData?.slides?.length]);

  const exportPresentationToPdf = () => {
    if (!interactionData?.slides?.length) return;
    const themeMap = {
      midnight: { bg: '#0B0F14', card: '#111827', text: '#E6E9EF', accent: '#F5B84B' },
      ivory: { bg: '#F7F3EE', card: '#FFFFFF', text: '#141821', accent: '#1D4ED8' },
      slate: { bg: '#0F172A', card: '#1E293B', text: '#E2E8F0', accent: '#6EE7B7' }
    };
    const theme = themeMap[presentationTheme] || themeMap.midnight;
    const html = `
      <html>
        <head>
          <title>${interactionData.title || 'Sunum'}</title>
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; font-family: 'Inter', Arial, sans-serif; background: ${theme.bg}; color: ${theme.text}; }
            .deck { padding: 32px; display: grid; gap: 20px; }
            .slide { background: ${theme.card}; border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 28px; position: relative; }
            .ribbon { height: 6px; width: 80px; border-radius: 6px; background: ${theme.accent}; margin-bottom: 12px; }
            h1 { margin: 0 0 12px; font-size: 30px; color: ${theme.accent}; }
            h2 { margin: 0 0 14px; font-size: 22px; }
            ul { margin: 0; padding-left: 20px; }
            li { margin-bottom: 6px; }
            .footer { margin-top: 16px; font-size: 11px; opacity: 0.6; display: flex; justify-content: space-between; }
            .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
            .visual { border: 1px dashed rgba(255,255,255,0.2); border-radius: 10px; padding: 12px; font-size: 12px; opacity: 0.75; min-height: 80px; }
            @media print {
              body { background: white; color: black; }
              .slide { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="deck">
            <div class="slide">
              <div class="ribbon"></div>
              <h1>${interactionData.title || 'Sunum Başlığı'}</h1>
              <div style="margin-top: 8px; font-size: 14px; opacity: 0.8;">
                ${presentationSpeaker ? `Konuşmacı: ${presentationSpeaker}<br/>` : ''}
                ${presentationDate ? `Tarih: ${presentationDate}` : ''}
              </div>
              <div class="footer">
                <span>${presentationTheme.toUpperCase()} Tema</span>
                <span>Kapak</span>
              </div>
            </div>
            ${interactionData.slides.map((s, i) => `
              <div class="slide">
                <div class="ribbon"></div>
                <h2>${(i + 1) + '. ' + (s.title || '')}</h2>
                ${
                  (s.layout === 'split')
                    ? `<div class="grid2"><ul>${(s.bullets || []).map(b => `<li>${b}</li>`).join('')}</ul><div class="visual">${s.visual || 'Görsel alanı'}</div></div>`
                    : (s.layout === 'visual')
                      ? `<div class="visual">${s.visual || 'Görsel alanı'}</div><ul style="margin-top:12px;">${(s.bullets || []).map(b => `<li>${b}</li>`).join('')}</ul>`
                      : `<ul>${(s.bullets || []).map(b => `<li>${b}</li>`).join('')}</ul>`
                }
                ${s.notes ? `<div style="margin-top: 10px; font-size: 12px; opacity: 0.7;">Notlar: ${s.notes}</div>` : ''}
                ${s.longNotes ? `<div style="margin-top: 6px; font-size: 11px; opacity: 0.6;">Prova: ${s.longNotes}</div>` : ''}
                <div class="footer">
                  <span>${presentationTheme.toUpperCase()} Tema</span>
                  <span>Slayt ${i + 1}</span>
                </div>
              </div>
            `).join('')}
          </div>
          <script>window.onload = () => window.print();</script>
        </body>
      </html>
    `;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();
  };

  const exportPresentationToMarkdown = () => {
    if (!interactionData?.slides?.length) return;
    const md = [
      `# ${interactionData.title || 'Sunum'}`,
      presentationSpeaker ? `**Konuşmacı:** ${presentationSpeaker}` : '',
      presentationDate ? `**Tarih:** ${presentationDate}` : '',
      '',
      ...interactionData.slides.map((s, i) => {
        const bullets = (s.bullets || []).map(b => `- ${b}`).join('\n');
        const visual = s.visual ? `\n> Görsel: ${s.visual}` : '';
        return `## ${i + 1}. ${s.title || ''}\n${bullets}${visual}\n`;
      })
    ].filter(Boolean).join('\n');
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${interactionData.title || 'sunum'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPresentationToPptx = () => {
    if (!interactionData?.slides?.length) return;
    const text = JSON.stringify({
      title: interactionData.title || 'Sunum',
      speaker: presentationSpeaker,
      date: presentationDate,
      slides: interactionData.slides
    }, null, 2);
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${interactionData.title || 'sunum'}.pptx.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const applyGlobalTheme = (theme) => {
    setPresentationTheme(theme);
  };

  const presentationPacks = {
    focus: { label: 'Focus', theme: 'midnight', addCover: true },
    classic: { label: 'Classic', theme: 'ivory', addCover: true },
    board: { label: 'Board', theme: 'slate', addCover: false },
    aurora: { label: 'Aurora', theme: 'midnight', addCover: true },
    minimal: { label: 'Minimal', theme: 'ivory', addCover: false },
    studio: { label: 'Studio', theme: 'slate', addCover: true }
  };

  const applyPresentationPack = (key) => {
    const pack = presentationPacks[key];
    if (!pack) return;
    setPresentationPack(key);
    applyGlobalTheme(pack.theme);
    if (pack.addCover) addCoverAndToc();
  };

  const addSectionSlides = () => {
    if (!interactionData?.slides?.length) return;
    const next = [];
    interactionData.slides.forEach((s, idx) => {
      if (idx % 4 === 0) {
        next.push({ title: `Bölüm ${Math.floor(idx / 4) + 1}`, bullets: [], notes: '', longNotes: '', visual: '' });
      }
      next.push(s);
    });
    setInteractionData(prev => ({ ...prev, slides: next }));
  };

  const addBibliographySlide = () => {
    if (!interactionData?.slides) return;
    const items = sources.map(s => s.name).filter(Boolean);
    setInteractionData(prev => ({
      ...prev,
      slides: [
        ...prev.slides,
        { title: 'Kaynakça', bullets: items.length ? items : ['Yüklenen kaynaklar'], notes: '', longNotes: '', visual: '' }
      ]
    }));
  };
  const normalizePresentation = (data) => {
    if (!data?.slides) return data;
    const hasCover = data.slides.some(s => (s.title || '').toLowerCase().includes('kapak'));
    const hasToc = data.slides.some(s => (s.title || '').toLowerCase().includes('içindekiler'));
    const hasSummary = data.slides.some(s => (s.title || '').toLowerCase().includes('özet'));
    let slides = [...data.slides];
    if (!hasCover || !hasToc) {
      const titles = slides.map(s => s.title).filter(Boolean);
      slides = [
        ...(hasCover ? [] : [{ title: 'Kapak', bullets: [data.title || 'Sunum', presentationSpeaker ? `Konuşmacı: ${presentationSpeaker}` : '', presentationDate ? `Tarih: ${presentationDate}` : ''].filter(Boolean), notes: '', longNotes: '', visual: '' }]),
        ...(hasToc ? [] : [{ title: 'İçindekiler', bullets: titles.length ? titles : ['Giriş', 'Ana Başlıklar', 'Sonuç'], notes: '', longNotes: '', visual: '' }]),
        ...slides
      ];
    }
    if (!hasSummary) {
      slides = [...slides, { title: 'Sunum Özeti', bullets: slides.map(s => s.title).filter(Boolean).slice(0, 6), notes: '', longNotes: '', visual: '' }];
    }
    slides = slides.map(s => {
      const bullets = s.bullets || [];
      const layout = s.layout || (s.visual ? 'visual' : (bullets.length > 4 ? 'split' : 'standard'));
      return { ...s, layout };
    });
    return { ...data, slides };
  };

  const addQASlide = () => {
    if (!interactionData?.slides) return;
    setInteractionData(prev => ({
      ...prev,
      slides: [
        ...prev.slides,
        { title: 'Soru & Cevap', bullets: ['Sorularınızı alabilirim.'], notes: '', longNotes: '', visual: 'Soru işareti ikonları' }
      ]
    }));
  };

  const addSummarySlide = () => {
    if (!interactionData?.slides) return;
    const titles = interactionData.slides.map(s => s.title).filter(Boolean);
    setInteractionData(prev => ({
      ...prev,
      slides: [
        ...prev.slides,
        { title: 'Sunum Özeti', bullets: titles.length ? titles : ['Ana başlıklar'], notes: '', longNotes: '', visual: '' }
      ]
    }));
  };

  const estimateSlideSeconds = (slide) => {
    if (!presentationAutoTiming) return presentationTimerSec;
    const bulletCount = (slide?.bullets || []).length;
    const wordCount = (slide?.bullets || []).join(' ').split(/\s+/).filter(Boolean).length;
    const estimate = 20 + bulletCount * 12 + Math.min(60, Math.ceil(wordCount / 4));
    return Math.max(30, Math.min(120, estimate));
  };

  const formatSlideNumber = (index) => {
    if (presentationNumberStyle === 'section') {
      const section = Math.floor(index / 3) + 1;
      const within = (index % 3) + 1;
      return `${section}.${within}`;
    }
    return `${index + 1}`;
  };

  const duplicateSlide = (index) => {
    if (!interactionData?.slides) return;
    const next = [...interactionData.slides];
    const clone = { ...next[index] };
    next.splice(index + 1, 0, clone);
    setInteractionData(prev => ({ ...prev, slides: next }));
  };

  const filteredSlides = interactionData?.slides?.map((s, i) => ({ ...s, __idx: i }))
    .filter(s => (s.title || '').toLowerCase().includes(presentationSearch.toLowerCase())) || [];

  const ratingSummary = Object.entries(presentationRatings)
    .map(([idx, score]) => ({ idx: Number(idx), score }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  const createShareLink = () => {
    if (!interactionData?.slides?.length) return;
    const id = Math.random().toString(36).slice(2, 10);
    const expiresAt = Date.now() + presentationShareExpireHours * 3600 * 1000;
    const payload = {
      title: interactionData.title || 'Sunum',
      slides: interactionData.slides,
      layout: presentationLayout,
      transition: presentationTransition,
      expiresAt,
      password: presentationSharePassword || null,
      brandName: presentationBrandName || null,
      brandMode: presentationBrandMode || 'watermark'
    };
    localStorage.setItem(`share_${id}`, JSON.stringify(payload));
    setPresentationShareLink(`${window.location.origin}/share/${id}`);
  };

  const presentationTemplates = {
    lecture: {
      label: 'Ders Sunumu',
      slides: ['Giriş', 'Kavramlar', 'Temel Süreç', 'Örnekler', 'Özet']
    },
    defense: {
      label: 'Tez / Jüri Savunma',
      slides: ['Problem', 'Yöntem', 'Bulgular', 'Katkı', 'Sonuç & Gelecek']
    },
    meeting: {
      label: 'Toplantı Özeti',
      slides: ['Gündem', 'Kararlar', 'Aksiyonlar', 'Riskler', 'Kapanış']
    },
    startup: {
      label: 'Startup Pitch',
      slides: ['Problem', 'Çözüm', 'Pazar', 'Ürün', 'İş Modeli', 'Takım', 'Kapanış']
    },
    research: {
      label: 'Araştırma Raporu',
      slides: ['Amaç', 'Literatür', 'Yöntem', 'Bulgular', 'Tartışma', 'Sonuç']
    },
    case: {
      label: 'Vaka Analizi',
      slides: ['Vaka Özeti', 'Sorunlar', 'Analiz', 'Alternatifler', 'Öneri', 'Sonuç']
    },
    training: {
      label: 'Eğitim Atölyesi',
      slides: ['Hedefler', 'Gündem', 'Uygulama', 'Örnekler', 'Değerlendirme', 'Kapanış']
    },
    report: {
      label: 'Dönem Raporu',
      slides: ['Özet', 'Başarılar', 'Riskler', 'Metrikler', 'Plan', 'Kapanış']
    }
  };

  const getIconSuggestions = (title) => {
    const t = (title || '').toLowerCase();
    const hits = [];
    const add = (emoji) => { if (!hits.includes(emoji)) hits.push(emoji); };
    if (t.includes('giriş') || t.includes('tanım')) { add('📌'); add('🧭'); }
    if (t.includes('yöntem') || t.includes('metodoloji')) { add('🧪'); add('⚙️'); }
    if (t.includes('sonuç') || t.includes('özet')) { add('✅'); add('📈'); }
    if (t.includes('risk') || t.includes('problem')) { add('⚠️'); add('🧩'); }
    if (t.includes('plan') || t.includes('takvim')) { add('🗓️'); add('⏱️'); }
    if (t.includes('veri') || t.includes('bulgu')) { add('📊'); add('🔍'); }
    if (t.includes('amaç') || t.includes('hedef')) { add('🎯'); add('🚀'); }
    if (hits.length === 0) { add('✨'); add('📘'); add('🔹'); }
    return hits.slice(0, 3);
  };

  const applyPresentationTemplate = (key) => {
    const tpl = presentationTemplates[key];
    if (!tpl || !interactionData?.slides) return;
    setInteractionData(prev => ({
      ...prev,
      slides: tpl.slides.map(title => ({ title, bullets: [] }))
    }));
  };

  const addCoverAndToc = () => {
    if (!interactionData?.slides) return;
    const titles = interactionData.slides.map(s => s.title).filter(Boolean);
    setInteractionData(prev => ({
      ...prev,
      slides: [
        { title: 'Kapak', bullets: [prev.title || 'Sunum', presentationSpeaker ? `Konuşmacı: ${presentationSpeaker}` : '', presentationDate ? `Tarih: ${presentationDate}` : ''].filter(Boolean) },
        { title: 'İçindekiler', bullets: titles.length ? titles : ['Giriş', 'Ana Başlıklar', 'Sonuç'] },
        ...prev.slides
      ]
    }));
  };

  const addSlide = () => {
    if (!interactionData?.slides) return;
    setInteractionData(prev => ({
      ...prev,
      slides: [...prev.slides, { title: 'Yeni Slayt', bullets: ['Madde 1'] }]
    }));
  };

  const moveSlide = (index, dir) => {
    if (!interactionData?.slides) return;
    const next = [...interactionData.slides];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    const temp = next[index];
    next[index] = next[target];
    next[target] = temp;
    setInteractionData(prev => ({ ...prev, slides: next }));
  };

  const removeSlide = (index) => {
    if (!interactionData?.slides) return;
    setInteractionData(prev => ({
      ...prev,
      slides: prev.slides.filter((_, i) => i !== index)
    }));
  };

  const getToolLabel = (id) => {
    return (interactionTools.find(t => t.id === id)?.label) || id;
  };

  const loadInteractionHistory = async (sid) => {
    if (!sid) return;
    let data = null;
    let error = null;
    try {
      if (user?.id) {
        const res = await supabase
          .from('interaction_history')
          .select('*')
          .eq('session_id', sid)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(30);
        data = res.data;
        error = res.error;
      }
      if (error || !user?.id) {
        const res = await supabase
          .from('interaction_history')
          .select('*')
          .eq('session_id', sid)
          .order('created_at', { ascending: false })
          .limit(30);
        data = res.data;
        error = res.error;
      }
      if (!error && data) {
        setInteractionHistory(data || []);
        setInteractionHistoryLoaded(true);
        return;
      }
    } catch {}
    const local = JSON.parse(localStorage.getItem(`interaction_history_${sid}`) || '[]');
    setInteractionHistory(local);
    setInteractionHistoryLoaded(true);
  };

  const saveInteractionHistory = async ({ sid, toolId, toolLabel, payload, preview, meta }) => {
    if (!sid) return;
    const item = {
      session_id: sid,
      tool_id: toolId,
      tool_label: toolLabel,
      payload: meta ? { _data: payload, _meta: meta } : payload,
      preview
    };
    let saved = null;
    let error = null;
    try {
      if (user?.id) item.user_id = user.id;
      const res = await supabase.from('interaction_history').insert([item]).select().single();
      saved = res.data;
      error = res.error;
    } catch (e) {
      error = e;
    }
    if (!error && saved) {
      setInteractionHistory(prev => [saved, ...prev]);
      return;
    }
    const key = `interaction_history_${sid}`;
    const local = JSON.parse(localStorage.getItem(key) || '[]');
    const localItem = { ...item, id: `local-${Date.now()}`, created_at: new Date().toISOString() };
    const next = [localItem, ...local];
    localStorage.setItem(key, JSON.stringify(next));
    setInteractionHistory(next);
  };

  const clearInteractionHistory = async () => {
    if (!sessionId) return;
    let error = null;
    try {
      let query = supabase.from('interaction_history').delete().eq('session_id', sessionId);
      if (user?.id) query = query.eq('user_id', user.id);
      const res = await query;
      error = res.error;
    } catch (e) {
      error = e;
    }
    const key = `interaction_history_${sessionId}`;
    localStorage.removeItem(key);
    if (error) {
      setInteractionHistory([]);
      return;
    }
    setInteractionHistory([]);
  };

  const speakText = (text) => {
    if (!window.speechSynthesis || !text) return;
    const utter = new SpeechSynthesisUtterance(text.replace(/\n/g, ' '));
    utter.lang = 'tr-TR';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const updateQuizStats = async (correct, total) => {
    if (!total) return;
    let data = null;
    let error = null;
    if (user?.id) {
      const res = await supabase.from('user_stats').select('*').eq('user_id', user.id).maybeSingle();
      data = res.data;
      error = res.error;
    }
    if (error || !user?.id) {
      const res = await supabase.from('user_stats').select('*').eq('id', 1).maybeSingle();
      data = res.data;
      error = res.error;
    }
    const next = {
      quiz_correct: (data?.quiz_correct || 0) + correct,
      quiz_total: (data?.quiz_total || 0) + total,
      updated_at: new Date().toISOString()
    };
    if (user?.id && !error) next.user_id = user.id;
    if (!user?.id || error) next.id = 1;
    await supabase.from('user_stats').upsert(next);

    try {
      const key = `quiz_history_${user?.id || 'anon'}`;
      const today = new Date().toISOString().slice(0, 10);
      const list = JSON.parse(localStorage.getItem(key) || '[]');
      const existing = list.find(item => item.date === today);
      if (existing) {
        existing.correct += correct;
        existing.total += total;
      } else {
        list.push({ date: today, correct, total });
      }
      localStorage.setItem(key, JSON.stringify(list.slice(-30)));
    } catch {}
  };

  const updateActivityStreak = async () => {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const yesterday = new Date(today.getTime() - 86400000).toISOString().slice(0, 10);
    let data = null;
    let error = null;
    if (user?.id) {
      const res = await supabase.from('user_stats').select('*').eq('user_id', user.id).maybeSingle();
      data = res.data;
      error = res.error;
    }
    if (error || !user?.id) {
      const res = await supabase.from('user_stats').select('*').eq('id', 1).maybeSingle();
      data = res.data;
      error = res.error;
    }
    let streak = data?.streak || 0;
    if (data?.last_activity === todayStr) {
      return;
    } else if (data?.last_activity === yesterday) {
      streak += 1;
    } else {
      streak = 1;
    }
    let level = data?.level || 'Çırak Araştırmacı';
    if (streak >= 14) level = 'Usta Araştırmacı';
    if (streak >= 30) level = 'Profesör';
    const payload = {
      streak,
      level,
      last_activity: todayStr,
      updated_at: new Date().toISOString()
    };
    if (user?.id && !error) payload.user_id = user.id;
    if (!user?.id || error) payload.id = 1;
    await supabase.from('user_stats').upsert(payload);
  };

  const savePersona = async () => {
    if (!personaName.trim() || !localProjectConfig || !projectCategory?.id) return;
    const payload = {
      category_id: projectCategory.id,
      name: personaName.trim(),
      profile: localProjectConfig
    };
    const { data } = await supabase.from('personas').insert([payload]).select().single();
    if (data) {
      setPersonas(prev => [data, ...prev]);
      setPersonaName('');
    }
  };

  const applyPersona = (p) => {
    if (p?.profile) setLocalProjectConfig(p.profile);
  };

  const handleRoleplaySubmit = async () => {
    if (!roleplayInput.trim()) return;
    setIsRoleplayLoading(true);
    const personaText = JSON.stringify(localProjectConfig || {});
    const prompt = `ROL: ${projectCategory?.label || 'Jüri'}\nPERSONA: ${personaText}\nÖĞRENCİ SUNUMU: ${roleplayInput}\nYanıt: Sert ama öğretici bir şekilde kısa geri bildirim ver ve 1 takip sorusu sor.`;
    try {
      const selectedSources = getSelectedSources();
      const selectedDocIds = getSelectedDocIds();
      let parts = prepareContentParts(prompt, selectedSources);
      let systemInstructionText = SYSTEM_PROMPT;
      if (!parts && selectedDocIds.length > 0) {
        const broadContext = await fetchBroadContext({ sessionId, docIds: selectedDocIds });
        if (broadContext) {
          systemInstructionText += `\n\nKULLANACAĞIN REFERANS BİLGİLER:\n---\n${broadContext}\n---`;
        }
      }
      if (!parts) parts = [{ text: prompt }];
      const payload = { contents: [{ role: "user", parts }], systemInstruction: { parts: [{ text: systemInstructionText }] } };
      const result = await apiCall('generateContent', payload);
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "Yanıt alınamadı.";
      setRoleplayResponse(text);
      saveJuryMemory(text, 'ROLEPLAY');
    } catch (e) {
      console.error(e);
    } finally {
      setIsRoleplayLoading(false);
    }
  };

  const startSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = 'tr-TR';
    recognition.interimResults = true;
    recognition.continuous = true;
    setIsListening(true);
    recognition.onresult = (event) => {
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += transcript + ' ';
      }
      if (finalText) {
        setRoleplayInput(prev => (prev ? `${prev} ${finalText}` : finalText));
      }
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const downloadText = (filename, content) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printToPdf = (content) => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<pre style="white-space:pre-wrap;font-family:system-ui;padding:24px;">${content}</pre>`);
    w.document.close();
    w.focus();
    w.print();
  };

  const openMailClient = (subject, body) => {
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
  };

  const toIcsDate = (date) => {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}${m}${day}`;
  };

  const exportActionsToIcs = (actions) => {
    const dtstamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//EduNotebook//EN'];
    actions.forEach((a, idx) => {
      const due = a.due || a.due_date || a.date || null;
      const start = toIcsDate(due || new Date(Date.now() + idx * 86400000));
      if (!start) return;
      const endDate = new Date(due || new Date(Date.now() + (idx + 1) * 86400000));
      endDate.setDate(endDate.getDate() + 1);
      const end = toIcsDate(endDate);
      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${Date.now()}-${idx}@edunotebook`);
      lines.push(`DTSTAMP:${dtstamp}`);
      lines.push(`DTSTART;VALUE=DATE:${start}`);
      lines.push(`DTEND;VALUE=DATE:${end}`);
      lines.push(`SUMMARY:${(a.task || 'Görev')}${a.owner ? ` - ${a.owner}` : ''}`);
      lines.push('END:VEVENT');
    });
    lines.push('END:VCALENDAR');
    downloadTextFile('aksiyonlar.ics', lines.join('\n'), 'text/calendar');
  };

  const handleJuryVideoUpload = async (file) => {
    if (!file) return;
    if (!sessionId) {
      setVideoStatus('Önce bir çalışma başlatmalısın.');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setVideoStatus('Video büyük. Storage üzerinden yükleniyor...');
    }
    setVideoStatus('Video yükleniyor...');
    const uploadToStorage = async () => {
      const path = `${sessionId}/${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage.from('jury-videos').upload(path, file, { upsert: true });
      if (error) return null;
      return data?.path || path;
    };
    let filePath = null;
    try {
      filePath = await uploadToStorage();
    } catch {}
    if (filePath) {
      const payload = {
        session_id: sessionId,
        category_id: projectCategory?.id || null,
        file_name: file.name,
        mime_type: file.type,
        storage_bucket: 'jury-videos',
        file_path: filePath
      };
      const { data, error } = await supabase.from('jury_videos').insert([payload]).select().single();
      if (!error && data) {
        setVideoUploads(prev => [data, ...prev]);
        setVideoStatus('Video storage üzerine yüklendi.');
        return;
      }
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result.split(',')[1];
      const payload = {
        session_id: sessionId,
        category_id: projectCategory?.id || null,
        file_name: file.name,
        mime_type: file.type,
        data_base64: base64
      };
      const { data, error } = await supabase.from('jury_videos').insert([payload]).select().single();
      if (!error && data) {
        setVideoUploads(prev => [data, ...prev]);
        setVideoStatus('Video yüklendi (base64).');
      } else {
        setVideoStatus('Yükleme başarısız.');
      }
    };
    reader.readAsDataURL(file);
  };

  const currentToolLabel = interactionTools.find((tool) => tool.id === interactionType)?.label || 'Etkileşim';
  const isMobileOverlay = isMobileView && isInteractionModalOpen;
  const favoriteToolList = interactionTools.filter(t => favoriteTools.includes(t.id));
  const selectedSourcesCount = getSelectedSources().length;
  const normalizedChatSearch = chatSearch.trim().toLowerCase();
  const displayedMessages = normalizedChatSearch
    ? messages.filter(m => (m.text || '').toLowerCase().includes(normalizedChatSearch))
    : messages;
  const toolRecommendations = useMemo(() => {
    const list = [];
    const toolMap = new Map(interactionTools.map(t => [t.id, t]));
    const add = (id, reason) => {
      if (!toolMap.has(id)) return;
      if (list.some(item => item.id === id)) return;
      list.push({ ...toolMap.get(id), reason });
    };
    const nameBlob = sources.map(s => `${s.name || ''} ${s.originalName || ''}`).join(' ').toLowerCase();
    const textBlob = sources.map(s => s.textContent || '').join(' ').toLowerCase();
    const examLike = /(vize|final|sınav|test|quiz|deneme)/.test(nameBlob);
    const formulaLike = /(formül|denklem|teorem|tanım)/.test(textBlob + nameBlob);

    if (categoryId === 'primary') {
      add('STORY', 'Masal gibi anlatım için');
      add('ELI5', 'Basit anlatım için');
      add('MINI_QUIZ', 'Hızlı öğrenme kontrolü');
    }
    if (categoryId === 'highschool') {
      add('STUDY_NOTES', 'Sınav notu çıkar');
      if (examLike) add('QUIZ_YKS', 'Test pratiği için');
      if (formulaLike) add('MEMORIZE', 'Formül ezberi için');
    }
    if (categoryId === 'university') {
      add('ACADEMIC_SUMMARY', 'Akademik özet için');
      add('CONCEPT_MAP', 'Kavram ilişkileri için');
      if (examLike) add('EXAM_SIM', 'Vize/Final provası');
    }
    if (categoryId === 'jury') {
      add('PITCH', 'Sunum metni hazırlama');
      add('DEFENSE', 'Zor sorulara hazırlık');
    }
    if (categoryId === 'thesis') {
      add('METHODOLOGY', 'Metodoloji kontrolü');
      add('HARSH_Q', 'Sert soru simülasyonu');
    }
    if (categoryId === 'meeting') {
      add('MINUTES', 'Toplantı tutanağı');
      add('ACTIONS', 'Aksiyon listesi');
    }
    if (sources.length > 2) {
      add('SUMMARY', 'Çok kaynak varsa özetle');
      add('ACADEMIC_SUMMARY', 'Akademik özetle');
    }
    return list.slice(0, 3);
  }, [interactionTools, categoryId, sources]);
  const shareStatsById = useMemo(() => {
    const map = {};
    shareAccessLogs.forEach(log => {
      const id = log.share_id;
      if (!id) return;
      if (!map[id]) {
        map[id] = { total: 0, devices: new Set(), last: null };
      }
      map[id].total += 1;
      if (log.device_id) map[id].devices.add(log.device_id);
      const at = log.accessed_at ? new Date(log.accessed_at) : null;
      if (at && (!map[id].last || at > map[id].last)) map[id].last = at;
    });
    return map;
  }, [shareAccessLogs]);
  const shareSummaryStats = useMemo(() => {
    const total = shareAccessLogs.length;
    const devices = new Set(shareAccessLogs.map(l => l.device_id).filter(Boolean)).size;
    const last = shareAccessLogs[0]?.accessed_at ? new Date(shareAccessLogs[0].accessed_at) : null;
    return { total, devices, last };
  }, [shareAccessLogs]);

  const renderToolCard = (tool) => {
    const isFavorite = favoriteTools.includes(tool.id);
    return (
      <div key={tool.id} className="flex items-stretch gap-2">
        <button
          onClick={() => handleInteraction(tool.id)}
          disabled={isReadOnly}
          className={`flex-1 flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${interactionType === tool.id ? 'bg-[rgba(245,184,75,0.16)] border-[var(--accent)] text-[var(--accent)]' : 'bg-[var(--panel-2)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--accent-3)]'} ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="flex items-center gap-2">
            <tool.icon size={14} />
            <span>{tool.label}</span>
          </div>
          <ArrowRight size={12} className="opacity-60" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavoriteTool(tool.id);
          }}
          className={`p-2 rounded-xl border transition-colors ${isFavorite ? 'border-[var(--accent)] bg-[rgba(245,184,75,0.16)] text-[var(--accent)]' : 'border-[var(--border)] bg-[var(--panel-2)] text-[var(--muted)] hover:text-[var(--text)]'}`}
          title={isFavorite ? 'Favoriden çıkar' : 'Favorilere ekle'}
        >
          <Star size={12} className={isFavorite ? 'fill-[var(--accent)]' : ''} />
        </button>
      </div>
    );
  };

  return (
    <div
      className={`flex h-[calc(var(--vh,1vh)*100)] overflow-hidden transition-colors duration-300 text-[var(--text)] flex-col lg:flex-row ${isFocusMode ? 'p-0 gap-0' : 'p-3 lg:p-5 gap-3 lg:gap-5'}`}
      style={{
        ...themeStyles,
        backgroundColor: 'var(--bg)',
        backgroundImage: 'var(--bg-grad)',
        fontFamily: '"Space Grotesk", "Sora", sans-serif'
      }}
    >
      {accessDenied && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="p-6 rounded-3xl bg-[var(--panel)] border border-[var(--border)] max-w-md text-center">
            <div className="text-lg font-semibold mb-2">Erişim Reddedildi</div>
            <div className="text-sm text-[var(--muted)] mb-4">Bu odaya erişim için paylaşım linki gerekiyor.</div>
            <button onClick={() => onBackHome && onBackHome()} className="px-4 py-2 rounded-xl bg-[var(--accent)] text-[#1b1b1b] text-sm font-semibold">
              Ana Sayfa
            </button>
          </div>
        </div>
      )}
      {sharePasswordRequired && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-[var(--panel)] border border-[var(--border)] p-5">
            <div className="text-sm font-semibold mb-2">Paylaşım Parolası</div>
            <div className="text-xs text-[var(--muted)] mb-3">Bu oda parola korumalı. Devam etmek için parolayı girin.</div>
            <input
              type="password"
              value={sharePasswordInput}
              onChange={(e) => setSharePasswordInput(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-sm"
              placeholder="Parola"
            />
            {sharePasswordError && <div className="text-[10px] text-[var(--danger)] mt-2">{sharePasswordError}</div>}
            <div className="flex items-center gap-2 mt-4">
              <button onClick={handleSharePasswordSubmit} className="flex-1 px-3 py-2 rounded-xl bg-[var(--accent)] text-[#1b1b1b] text-xs font-semibold">
                Giriş Yap
              </button>
              <button
                onClick={() => { setSharePasswordRequired(false); setAccessDenied(true); }}
                className="flex-1 px-3 py-2 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-xs text-[var(--muted)]"
              >
                Vazgeç
              </button>
            </div>
          </div>
        </div>
      )}
      {showConfetti && (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
          {Array.from({ length: 16 }).map((_, i) => (
            <span
              key={i}
              className="absolute w-2 h-3 rounded-sm animate-[confetti_1.6s_linear_infinite]"
              style={{
                left: `${(i * 7) % 100}%`,
                top: `-10%`,
                backgroundColor: i % 2 === 0 ? '#F5B84B' : '#7AA2FF',
                animationDelay: `${i * 0.1}s`
              }}
            />
          ))}
        </div>
      )}
      {isMobileToolsOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setIsMobileToolsOpen(false)} />
      )}
      {isMobileSourcesOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setIsMobileSourcesOpen(false)} />
      )}
      {showHeaderMenu && (
        <div className="fixed inset-0 z-50 md:hidden flex items-start justify-center pt-20 px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowHeaderMenu(false)} onTouchStart={() => setShowHeaderMenu(false)} />
          <div className="relative w-60 rounded-2xl bg-[var(--panel)] border border-[var(--border)] shadow-xl p-2" onClick={(e) => e.stopPropagation()}>
            {isOwner && (
              <button
                onClick={() => { setShowShareModal(true); setShowHeaderMenu(false); }}
                disabled={!sessionId}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-[var(--text)] hover:bg-[var(--panel-2)]"
              >
                <Share2 size={14} /> Paylaş
              </button>
            )}
            <button
              onClick={() => { sessionId && openTitleEditModal(); setShowHeaderMenu(false); }}
              disabled={!sessionId}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-[var(--text)] hover:bg-[var(--panel-2)]"
            >
              <Edit2 size={14} /> Oda Adını Düzenle
            </button>
            <button
              onClick={() => { setIsFocusMode(prev => !prev); setShowHeaderMenu(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-[var(--text)] hover:bg-[var(--panel-2)]"
            >
              {isFocusMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />} {isFocusMode ? 'Odaktan Çık' : 'Odak Modu'}
            </button>
            <button
              onClick={() => { setIsDarkMode(!isDarkMode); setShowHeaderMenu(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-[var(--text)] hover:bg-[var(--panel-2)]"
            >
              {isDarkMode ? <Sun size={14} /> : <Moon size={14} />} Tema
            </button>
          </div>
        </div>
      )}
      {isMobileOverlay && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setIsInteractionModalOpen(false)} />
      )}
      {/* --- LEFT SIDEBAR --- */}
      {!isFocusMode && (
        <aside
          className={`transition-all duration-300 ease-in-out flex flex-col min-h-0 backdrop-blur-xl shadow-xl bg-[var(--panel)] border border-[var(--border)]
          ${isMobileSourcesOpen ? 'fixed inset-x-3 bottom-4 h-[78vh] z-50 rounded-3xl' : 'hidden'}
          lg:static lg:flex lg:rounded-3xl lg:z-auto lg:h-full
          ${isSidebarOpen ? 'lg:w-80 lg:translate-x-0' : 'lg:w-0 lg:-translate-x-full lg:opacity-0 lg:overflow-hidden'}
          w-full`}
        >
          <div className="p-5 border-b border-[var(--border)] space-y-3">
            <button onClick={() => onBackHome && onBackHome()} className="flex items-center gap-2 text-[var(--accent)] font-bold text-lg" style={{ fontFamily: '"Fraunces", serif' }}>
              <BookOpen size={22} /> <span>EduNotebook</span>
            </button>
            <div className="flex items-center justify-between lg:hidden">
              <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Kaynaklar</div>
              <button onClick={() => setIsMobileSourcesOpen(false)} className="px-3 py-2 rounded-lg bg-[var(--panel-2)] border border-[var(--border)] text-[10px] text-[var(--muted)] min-h-10">
                Kapat
              </button>
            </div>
            <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted)] hidden lg:block">Kaynaklar</div>
          </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'file', label: 'Bilgisayar', icon: UploadCloud },
                { id: 'url', label: 'URL', icon: Link2 },
                { id: 'text', label: 'Metin', icon: FileText }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSourceInputMode(tab.id)}
                  className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    sourceInputMode === tab.id
                      ? 'bg-[var(--accent)] text-[#1b1b1b] border-[var(--accent)]'
                      : 'bg-[var(--panel-2)] border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)]'
                  }`}
                >
                  <tab.icon size={14} /> {tab.label}
                </button>
              ))}
            </div>

            {sourceInputMode === 'file' && (
              <div className="relative group">
              <input
                type="file"
                multiple
                accept=".pdf,.txt,.doc,.docx,.rtf,.jpg,.jpeg,.png,.webp,.mp3,.wav,.m4a,.ogg,.mp4,.mov,.webm"
                onChange={handleFileUpload}
                disabled={isReadOnly}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
                <div className="rounded-2xl p-5 flex items-center gap-4 transition-colors bg-[var(--panel-2)] border border-dashed border-[var(--border)] hover:border-[var(--accent)]">
                  <div className="h-12 w-12 rounded-2xl bg-[var(--panel)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)]">
                    <UploadCloud size={22} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Dosya Yükle</p>
                    <p className="text-xs text-[var(--muted)] mt-1">PDF, Görsel, Ses, Video, Metin • Sürükle & bırak</p>
                  </div>
                  <div className="text-[10px] px-2 py-1 rounded-full bg-[var(--panel)] border border-[var(--border)] text-[var(--muted)]">
                    {sources.length} kaynak
                  </div>
                </div>
              </div>
            )}

            {sourceInputMode === 'url' && (
              <div className="p-4 rounded-2xl border bg-[var(--panel-2)] border-[var(--border)] space-y-2">
                <div className="text-xs text-[var(--muted)]">Web Sitesi URL</div>
                <input
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://ornek.com/konu"
                  className="w-full px-4 py-3 rounded-xl bg-[var(--panel)] border border-[var(--border)] text-sm"
                />
                <div className="flex items-center justify-between">
                  <div className="text-[10px] text-[var(--muted)]">Not: URL içerikleri otomatik çekilmez, referans olarak eklenir.</div>
                <button onClick={addUrlSource} disabled={isReadOnly} className="px-3 py-2 rounded-xl bg-[var(--accent)] text-[#1b1b1b] text-xs font-semibold disabled:opacity-60">
                  Ekle
                </button>
                </div>
              </div>
            )}

            {sourceInputMode === 'text' && (
              <div className="p-4 rounded-2xl border bg-[var(--panel-2)] border-[var(--border)] space-y-2">
                <div className="text-xs text-[var(--muted)]">Kopyalanan Metin</div>
                <textarea
                  value={sourceText}
                  onChange={(e) => setSourceText(e.target.value)}
                  placeholder="Notlarını buraya yapıştır..."
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--panel)] border border-[var(--border)] text-sm"
                />
                <div className="flex items-center justify-between gap-2">
                  <button onClick={pasteClipboardText} disabled={isReadOnly} className="px-3 py-2 rounded-xl bg-[var(--panel)] border border-[var(--border)] text-xs disabled:opacity-60">
                    {isPastingText ? 'Yapıştırılıyor...' : 'Panodan Yapıştır'}
                  </button>
                  <button onClick={addTextSource} disabled={isReadOnly} className="px-3 py-2 rounded-xl bg-[var(--accent)] text-[#1b1b1b] text-xs font-semibold disabled:opacity-60">
                    Metni Kaynağa Ekle
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="p-3 rounded-2xl border bg-[var(--panel-2)] border-[var(--border)]">
            <div className="flex items-center gap-2 text-[var(--muted)] text-xs mb-2">
              <Search size={14} />
              Kaynaklarda Ara
            </div>
            <input
              value={sourceSearch}
              onChange={(e) => setSourceSearch(e.target.value)}
              placeholder="Anahtar kelime..."
              className="w-full px-3 py-2 rounded-xl bg-[var(--panel)] border border-[var(--border)] text-xs"
            />
            {allTags.length > 0 && (
              <select
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className="mt-2 w-full px-3 py-2 rounded-xl bg-[var(--panel)] border border-[var(--border)] text-xs"
              >
                <option value="">Tüm Etiketler</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            )}
            {sourceSearch.trim() && (
              <div className="mt-2 space-y-2 max-h-32 overflow-y-auto pr-1">
                {sourceSearchResults.length === 0 ? (
                  <div className="text-[10px] text-[var(--muted)]">Sonuç bulunamadı.</div>
                ) : (
                  sourceSearchResults.map(res => (
                    <div key={res.id} className="p-2 rounded-xl bg-[var(--panel)] border border-[var(--border)]">
                      <div className="text-[10px] font-semibold">{res.name}</div>
                      <div className="text-[10px] text-[var(--muted)]">{res.snippet}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          <div className="space-y-2">
              {visibleSources.map(file => (
              <React.Fragment key={file.id}>
              <div id={`source-item-${file.docId || file.id}`} className="p-3 rounded-xl border text-sm group bg-[var(--panel-2)] border-[var(--border)]">
                  <div className="flex items-center justify-between gap-3 overflow-hidden">
                  <div className="flex items-center gap-3 overflow-hidden">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={file.selected !== false}
                      onChange={() => setSources(prev => prev.map(s => s.id === file.id ? { ...s, selected: s.selected === false } : s))}
                      className="h-4 w-4 accent-[var(--accent)]"
                    />
                  </label>
                  {(() => {
                    const Icon = getSourceIcon(file);
                    return (
                      <div className="relative">
                        {file.mimeType === 'text/url' && (file.sourceUrl || file.originalName) && (
                          <img
                            src={`https://icon.horse/icon/${(() => {
                              try { return new URL(file.sourceUrl || file.originalName).hostname; } catch { return ''; }
                            })()}`}
                            alt=""
                            className="absolute -right-2 -bottom-2 h-4 w-4 rounded-full border border-[var(--border)] bg-[var(--panel)]"
                          />
                        )}
                        <div className={`p-2 rounded-md ${getSourceBadgeClass(file)}`}>
                          <Icon size={16} />
                        </div>
                      </div>
                    );
                  })()}
                  <div className="flex flex-col overflow-hidden flex-1">
                    {editingSourceId === file.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          value={editingSourceName}
                          onChange={(e) => setEditingSourceName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && saveEditingSource(file)}
                          className="px-2 py-1 rounded-lg bg-[var(--panel)] border border-[var(--border)] text-xs text-[var(--text)]"
                        />
                        <button onClick={() => saveEditingSource(file)} className="p-1 text-[var(--accent-2)] hover:bg-[var(--panel)] rounded"><Check size={14} /></button>
                        <button onClick={cancelEditingSource} className="p-1 text-[var(--danger)] hover:bg-[var(--panel)] rounded"><X size={14} /></button>
                      </div>
                    ) : (
                      <button onClick={() => !isReadOnly && startEditingSource(file)} className="truncate font-medium text-left hover:text-[var(--accent)]">
                        {file.name}
                      </button>
                    )}
                    <div className="text-[10px] text-[var(--muted)] truncate">
                      {file.mimeType === 'text/url'
                        ? (file.sourceUrl || file.originalName || 'URL')
                        : (file.originalName || '')}
                    </div>
                    {Array.isArray(file.tags) && file.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {file.tags.map((t, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-full text-[10px] bg-[var(--panel)] border border-[var(--border)] text-[var(--muted)]">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                    {taggingSourceId === file.id && (
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          value={tagDraft}
                          onChange={(e) => setTagDraft(e.target.value)}
                          placeholder="etiket1, etiket2"
                          className="flex-1 px-2 py-1 rounded-lg bg-[var(--panel)] border border-[var(--border)] text-[10px]"
                        />
                        <button onClick={() => saveSourceTags(file)} className="p-1 text-[var(--accent-2)] hover:bg-[var(--panel)] rounded"><Check size={12} /></button>
                        <button onClick={cancelSourceTags} className="p-1 text-[var(--danger)] hover:bg-[var(--panel)] rounded"><X size={12} /></button>
                      </div>
                    )}
                  </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setPreviewSourceId(prev => prev === file.id ? null : file.id)} className="text-[var(--muted)] hover:text-[var(--accent)] transition-colors p-1">
                      <Eye size={14} />
                    </button>
                    <button onClick={() => !isReadOnly && startTaggingSource(file)} className="text-[var(--muted)] hover:text-[var(--accent-3)] transition-colors p-1 disabled:opacity-40" disabled={isReadOnly}>
                      <Tag size={14} />
                    </button>
                    <button onClick={() => removeSource(file.id)} disabled={isReadOnly} className="text-[var(--muted)] hover:text-[var(--danger)] transition-colors p-1 disabled:opacity-40"><XCircle size={16} /></button>
                  </div>
                </div>
              </div>
              {previewSourceId === file.id && (
                <div className="mt-2 p-3 rounded-xl bg-[var(--panel)] border border-[var(--border)] text-[10px] text-[var(--muted)]">
                  {file.mimeType?.startsWith('image/') && file.data ? (
                    <img src={`data:${file.mimeType};base64,${file.data}`} alt={file.name} className="w-full rounded-lg" />
                  ) : file.textContent ? (
                    <div>{file.textContent.replace(/\s+/g, ' ').slice(0, 220)}...</div>
                  ) : (
                    <div>Önizleme mevcut değil.</div>
                  )}
                </div>
              )}
              </React.Fragment>
              ))}
          </div>
          <div className="mt-4">
            <div className="text-[10px] tracking-[0.3em] font-bold text-[var(--muted)] mb-2">KAYNAK ZAMAN ÇİZGİSİ</div>
            {sourceTimeline.length === 0 ? (
              <div className="text-[10px] text-[var(--muted)]">Henüz kaynaklara bağlı çıktı yok.</div>
            ) : (
              <div className="space-y-3 max-h-40 overflow-y-auto pr-1">
                {sourceTimeline.map(entry => (
                  <div key={entry.source.id} className="p-3 rounded-xl bg-[var(--panel-2)] border border-[var(--border)]">
                    <div className="text-[10px] font-semibold mb-2">{entry.source.name}</div>
                    <div className="space-y-1">
                      {entry.items.map(item => (
                        <div key={item.id} className="text-[10px] text-[var(--muted)]">
                          {item.tool_label || item.tool_id} • {new Date(item.created_at).toLocaleDateString('tr-TR')}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        </aside>
      )}

      {/* --- MAIN AREA --- */}
      <main className={`flex-1 min-h-0 flex flex-col min-w-0 relative overflow-hidden bg-[var(--panel)] lg:h-full ${isFocusMode ? 'rounded-none border-0 shadow-none' : 'rounded-3xl border border-[var(--border)] shadow-xl'}`}>
        <header className="h-16 border-b flex items-center justify-between px-5 z-10 bg-[var(--panel)] border-[var(--border)] backdrop-blur-xl">
          <div className="flex items-center gap-3 overflow-hidden flex-1">
            {!isFocusMode && (
              <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-lg hover:bg-[var(--panel-2)] text-[var(--muted)] flex-shrink-0 hidden lg:inline-flex">
                {isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
              </button>
            )}
            {isFocusMode && (
              <button onClick={() => onBackHome && onBackHome()} className="flex items-center gap-2 text-[var(--accent)] font-semibold text-sm flex-shrink-0" style={{ fontFamily: '"Fraunces", serif' }}>
                <BookOpen size={18} /> EduNotebook
              </button>
            )}
            
            {/* BAŞLIK DÜZENLEME ALANI */}
            <div className="flex items-center gap-2 overflow-hidden w-full">
                <Bot className="text-[var(--accent-3)] flex-shrink-0" size={20}/> 
                
                {isEditingTitle ? (
                    <div className="hidden md:flex items-center gap-1 w-full max-w-md animate-in fade-in slide-in-from-left-2 duration-200">
                        <input 
                            autoFocus
                            value={tempTitle}
                            onChange={(e) => setTempTitle(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && saveTitle()}
                            disabled={isSavingTitle}
                            className="flex-1 text-sm px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[var(--accent-3)] bg-[var(--panel-2)] border-[var(--border)] text-[var(--text)] disabled:opacity-60"
                        />
                        <button onClick={saveTitle} disabled={isSavingTitle} className="p-1 text-[var(--accent-2)] hover:bg-[var(--panel-2)] rounded disabled:opacity-60"><Check size={16}/></button>
                        <button onClick={cancelEditingTitle} disabled={isSavingTitle} className="p-1 text-[var(--danger)] hover:bg-[var(--panel-2)] rounded disabled:opacity-60"><X size={16}/></button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 group md:cursor-pointer pointer-events-none md:pointer-events-auto" onClick={() => sessionId && startEditingTitle()}>
                        <h1 className="font-semibold text-sm md:text-base truncate max-w-[220px] md:max-w-none">{currentTitle}</h1>
                        {sessionId && <Edit2 size={14} className="text-[var(--muted)] opacity-0 group-hover:opacity-100 transition-opacity hidden md:inline-flex" />}
                    </div>
                )}
            </div>

          </div>
          {projectCategory && (
            <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-xs text-[var(--muted)]">
              <span className="text-[var(--accent)] font-semibold">Kategori</span>
              <span className="text-[var(--text)]">{projectCategory.label || projectCategory}</span>
            </div>
          )}
          {!isOwner && roomAccessRole && (
            <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-xs text-[var(--muted)]">
              {roomAccessRole === 'viewer' ? 'Salt-okunur' : roomAccessRole === 'commenter' ? 'Yorumcu' : 'Düzenleyici'}
            </div>
          )}
          <div className="flex items-center gap-2">
            {!isFocusMode && (
              <button
                onClick={() => onBackHome && onBackHome()}
                className="lg:hidden flex items-center gap-2 text-[var(--accent)] font-semibold text-sm"
                style={{ fontFamily: '"Fraunces", serif' }}
              >
                <BookOpen size={18} /> EduNotebook
              </button>
            )}
            {isOwner && (
              <button
                onClick={() => setShowShareModal(true)}
                disabled={!sessionId}
                className="px-3 py-2 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-xs text-[var(--muted)] hover:text-[var(--text)] disabled:opacity-50 hidden md:inline-flex"
              >
                <div className="flex items-center gap-2">
                  <Share2 size={14} />
                  Paylaş
                </div>
              </button>
            )}
            <button
              onClick={() => setIsFocusMode(prev => !prev)}
              className="px-3 py-2 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-xs text-[var(--muted)] hover:text-[var(--text)] hidden md:inline-flex"
            >
              <div className="flex items-center gap-2">
                {isFocusMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                {isFocusMode ? 'Odaktan Çık' : 'Odak Modu'}
              </div>
            </button>
            {shareStatus && (
              <div className="text-[10px] text-[var(--muted)]">{shareStatus}</div>
            )}
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2.5 rounded-full hover:bg-[var(--panel-2)] text-[var(--muted)] transition-colors flex-shrink-0 hidden md:inline-flex">
            {isDarkMode ? <Sun size={20} className="text-[var(--accent)]" /> : <Moon size={20} />}
            </button>
            <div className="relative md:hidden">
              <button
                onClick={(e) => { e.stopPropagation(); setShowHeaderMenu(prev => !prev); }}
                className="p-2.5 rounded-full bg-[var(--panel-2)] border border-[var(--border)] text-[var(--muted)] min-h-10 min-w-10"
              >
                <MoreVertical size={18} />
              </button>
            </div>
          </div>
        </header>

        <div
          ref={chatContainerRef}
          onScroll={() => {
            const el = chatContainerRef.current;
            if (!el) return;
            const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
            setShouldAutoScroll(distanceFromBottom < 120);
          }}
          className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6 bg-[var(--panel)]"
          style={{ overflowAnchor: 'none' }}
        >
          {resumeHint && (
            <div className="p-4 rounded-2xl border bg-[var(--panel-2)] border-[var(--border)] text-sm">
              <div className="text-[10px] tracking-[0.3em] font-bold text-[var(--accent)] mb-2">NERDE KALMIŞTIK?</div>
              <div className="text-[var(--muted)]">{resumeHint}</div>
            </div>
          )}
          {messages.length > 0 && (
            <div className="sticky top-0 z-10 bg-[var(--panel)] pb-4">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--panel-2)] border border-[var(--border)]">
                <Search size={14} className="text-[var(--muted)]" />
                <input
                  value={chatSearch}
                  onChange={(e) => setChatSearch(e.target.value)}
                  placeholder="Sohbette ara..."
                  className="bg-transparent text-xs outline-none w-full text-[var(--text)]"
                />
                {chatSearch && (
                  <button onClick={() => setChatSearch('')} className="text-[10px] text-[var(--muted)]">
                    Temizle
                  </button>
                )}
              </div>
              {chatSearch && (
                <div className="text-[10px] text-[var(--muted)] mt-2">
                  {displayedMessages.length} sonuç bulundu
                </div>
              )}
            </div>
          )}
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-20 h-20 bg-[var(--panel)] border border-[var(--border)] text-[var(--accent)] rounded-2xl flex items-center justify-center mb-4"><BookOpen size={40} /></div>
              <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: '"Fraunces", serif' }}>Odaklı Bir Çalışma Alanı</h3>
              <p className="max-w-md text-sm text-[var(--muted)]">Sol panelden kaynaklarını yükle. Sağ panelde etkileşim araçlarını kullanarak hızlı öğren.</p>
            </div>
          )}
          {displayedMessages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 shadow-sm text-sm ${msg.role === 'user' ? 'bg-[var(--accent)] text-[#1b1b1b] rounded-tr-sm' : 'bg-[var(--panel)] border border-[var(--border)] text-[var(--text)] rounded-tl-sm'}`}>
                {msg.role === 'user' ? (
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[10px] text-[var(--muted)]">
                      <span className="px-2 py-0.5 rounded-full bg-[var(--panel-2)] border border-[var(--border)]">
                        Kaynaklı Yanıt
                      </span>
                      <span>Seçili kaynaklara dayanır</span>
                    </div>
                    <SimpleMarkdownRenderer content={msg.text} />
                  </div>
                )}
                {msg.role === 'model' && Array.isArray(msg.sources) && msg.sources.length > 0 && (
                  <div className="mt-3 text-[10px] text-[var(--muted)]">
                    Kaynaklar: {msg.sources.join(', ')}
                  </div>
                )}
              </div>
            </div>
          ))}
          {chatSearch && displayedMessages.length === 0 && (
            <div className="text-center text-xs text-[var(--muted)]">Sonuç bulunamadı.</div>
          )}
          {hasSentMessage && isChatLoading && <div className="flex justify-start"><div className="p-4 rounded-2xl bg-[var(--panel)] border border-[var(--border)]"><span className="animate-pulse text-[var(--muted)]">Düşünüyor...</span></div></div>}
          <div ref={chatEndRef} />
        </div>

        <div
          className="p-4 border-t bg-[var(--panel)] border-[var(--border)] backdrop-blur-xl"
          style={isMobileView ? { paddingBottom: `calc(env(safe-area-inset-bottom) + var(--kb, 0px))` } : undefined}
        >
          <div className="max-w-3xl mx-auto mb-3 flex items-center justify-between text-[10px] text-[var(--muted)]">
            <div className="flex items-center gap-2">
              <Info size={12} className="text-[var(--accent-3)]" />
              Yanıtlar sadece seçili kaynaklara göre üretilir.
            </div>
            <div>Seçili kaynak: {selectedSourcesCount}</div>
          </div>
          <div className="max-w-3xl mx-auto flex gap-3 items-end">
            <textarea
              ref={chatInputRef}
              rows={1}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                autoResizeInput();
              }}
              onInput={autoResizeInput}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={!canComment ? "Salt-okunur oda" : "Kaynaklara göre soru sor..."}
              disabled={isChatLoading || !canComment}
              className="flex-1 max-h-44 resize-none rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-3)] bg-[var(--panel-2)] border border-[var(--border)] text-[var(--text)] leading-relaxed"
            />
            {canDictate && canComment && (
              <button
                onClick={toggleDictation}
                className={`p-3 rounded-2xl border ${isDictating ? 'bg-[var(--accent-3)] text-white border-[var(--accent-3)]' : 'bg-[var(--panel-2)] text-[var(--muted)] border-[var(--border)] hover:text-[var(--text)]'}`}
              >
                <Mic size={18} />
              </button>
            )}
            <button onClick={handleSendMessage} disabled={!inputValue.trim() || isChatLoading || !canComment} className="p-3 rounded-2xl bg-[var(--accent)] text-[#1b1b1b] hover:brightness-110 disabled:bg-[var(--panel-2)] disabled:text-[var(--muted)]"><Send size={20} /></button>
          </div>
        </div>

        {!isFocusMode && !isKeyboardOpen && (
          <div className="lg:hidden fixed bottom-20 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 bg-[var(--panel)] border border-[var(--border)] rounded-full px-3 py-2 shadow-lg">
            <button onClick={() => setIsMobileSourcesOpen(true)} className="px-4 py-2 rounded-full bg-[var(--panel-2)] border border-[var(--border)] text-xs text-[var(--muted)]">
              Kaynaklar
            </button>
            <button onClick={() => setIsMobileToolsOpen(true)} className="px-4 py-2 rounded-full bg-[var(--accent)] text-[#1b1b1b] text-xs font-semibold">
              Araçlar
            </button>
          </div>
        )}
      </main>

      {categoryId === 'primary' && (
        <div className="fixed bottom-6 right-6 z-30 hidden md:flex items-center gap-3">
          <div className="px-4 py-3 rounded-2xl bg-[var(--panel)] border border-[var(--border)] text-sm">{mascotMessage}</div>
          <div className="w-12 h-12 rounded-full bg-[var(--accent)] text-[#1b1b1b] flex items-center justify-center font-bold">🦉</div>
        </div>
      )}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-[var(--panel)] border border-[var(--border)] p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-semibold">Paylaşım Ayarları</div>
              <button onClick={() => setShowShareModal(false)} className="px-3 py-1 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-xs">Kapat</button>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-[10px] text-[var(--muted)] mb-1">Yetki</div>
                <select value={shareRole} onChange={(e) => setShareRole(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-xs">
                  <option value="viewer">Görüntüleyici (salt-okunur)</option>
                  <option value="commenter">Yorumcu (sohbet açık)</option>
                  <option value="editor">Düzenleyici (tam erişim)</option>
                </select>
              </div>
              <div>
                <div className="text-[10px] text-[var(--muted)] mb-1">Süre (saat)</div>
                <input
                  type="number"
                  min="1"
                  value={shareExpireHours}
                  onChange={(e) => setShareExpireHours(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-xs"
                />
              </div>
              <div>
                <div className="text-[10px] text-[var(--muted)] mb-1">Parola (opsiyonel)</div>
                <input
                  type="password"
                  value={sharePassword}
                  onChange={(e) => setSharePassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-xs"
                  placeholder="••••••"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[10px] text-[var(--muted)] mb-1">Görüntüleme Limiti</div>
                  <input
                    type="number"
                    min="0"
                    value={shareMaxViews}
                    onChange={(e) => setShareMaxViews(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-xs"
                    placeholder="0 = sınırsız"
                  />
                </div>
                <div>
                  <div className="text-[10px] text-[var(--muted)] mb-1">IP/Cihaz Limiti</div>
                  <input
                    type="number"
                    min="0"
                    value={shareDeviceLimit}
                    onChange={(e) => setShareDeviceLimit(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-xs"
                    placeholder="0 = sınırsız"
                  />
                </div>
              </div>
              <button onClick={createRoomShare} className="w-full px-3 py-2 rounded-xl bg-[var(--accent)] text-[#1b1b1b] text-xs font-semibold">
                Paylaşım Linki Oluştur
              </button>
              {shareLink && (
                <div className="p-3 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-[10px] break-all">
                  {shareLink}
                </div>
              )}
              {shareStatus && (
                <div className="text-[10px] text-[var(--muted)]">{shareStatus}</div>
              )}
              <div className="mt-4 p-3 rounded-xl bg-[var(--panel-2)] border border-[var(--border)]">
                <div className="text-[10px] tracking-[0.3em] font-bold text-[var(--muted)] mb-2">GÖRÜNTÜLEME ÖZETİ</div>
                <div className="flex flex-wrap gap-2 text-[10px] text-[var(--muted)]">
                  <span>Toplam: {shareSummaryStats.total}</span>
                  <span>Tekil cihaz: {shareSummaryStats.devices}</span>
                  {shareSummaryStats.last && <span>Son: {shareSummaryStats.last.toLocaleString('tr-TR')}</span>}
                </div>
              </div>
              <div className="mt-4">
                <div className="text-[10px] tracking-[0.3em] font-bold text-[var(--muted)] mb-2">AKTİF PAYLAŞIMLAR</div>
                {isShareLoading ? (
                  <div className="text-[10px] text-[var(--muted)]">Yükleniyor...</div>
                ) : shareList.length === 0 ? (
                  <div className="text-[10px] text-[var(--muted)]">Paylaşım bulunamadı.</div>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {shareList.map(s => (
                      <div key={s.id} className="p-2 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-[10px]">
                        <div className="font-semibold">{s.role || 'viewer'} • {s.expires_at ? new Date(s.expires_at).toLocaleDateString('tr-TR') : 'Süresiz'}</div>
                        <div className="flex flex-wrap gap-2 text-[10px] text-[var(--muted)] mt-1">
                          {s.password_hash && <span>Parola</span>}
                          {s.max_views && <span>Limit: {s.max_views} görüntüleme</span>}
                          {s.max_devices && <span>{s.max_devices} cihaz</span>}
                        </div>
                        {shareStatsById[s.id] && (
                          <div className="flex flex-wrap gap-2 text-[10px] text-[var(--muted)] mt-1">
                            <span>Görüntüleme: {shareStatsById[s.id].total}</span>
                            <span>Tekil: {shareStatsById[s.id].devices.size}</span>
                            {shareStatsById[s.id].last && <span>Son: {shareStatsById[s.id].last.toLocaleString('tr-TR')}</span>}
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <button onClick={() => copyShareLink(s.token)} className="px-2 py-1 rounded-lg bg-[var(--panel)] border border-[var(--border)] text-[10px]">Kopyala</button>
                          <button onClick={() => revokeShare(s.id)} className="px-2 py-1 rounded-lg bg-[var(--panel)] border border-[var(--border)] text-[10px] text-[var(--danger)]">İptal</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-4">
                <div className="text-[10px] tracking-[0.3em] font-bold text-[var(--muted)] mb-2">ERİŞİM GÜNLÜĞÜ</div>
                {shareAccessLogs.length === 0 ? (
                  <div className="text-[10px] text-[var(--muted)]">Henüz erişim yok.</div>
                ) : (
                  <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                    {shareAccessLogs.map(log => (
                      <div key={log.id} className="p-2 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-[10px]">
                        <div className="font-semibold">{log.role || 'viewer'} • {new Date(log.accessed_at).toLocaleString('tr-TR')}</div>
                        {log.user_agent && <div className="text-[var(--muted)] truncate">{log.user_agent}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {showTitleEditModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-[var(--panel)] border border-[var(--border)] p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold">Oda Adını Düzenle</div>
              <button onClick={cancelTitleModal} className="px-3 py-1 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-xs">Kapat</button>
            </div>
            <div className="space-y-3">
              <input
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                placeholder="Yeni oda adı"
                disabled={isSavingTitle}
                className="w-full px-3 py-2 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-sm disabled:opacity-60"
              />
              <div className="flex items-center gap-2">
                <button onClick={saveTitle} disabled={isSavingTitle} className="flex-1 px-3 py-2 rounded-xl bg-[var(--accent)] text-[#1b1b1b] text-xs font-semibold disabled:opacity-60">
                  {isSavingTitle ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
                <button onClick={cancelTitleModal} disabled={isSavingTitle} className="flex-1 px-3 py-2 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-xs text-[var(--muted)] disabled:opacity-60">
                  Vazgeç
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-[var(--panel)] border border-[var(--border)] p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-semibold">Export Merkezi</div>
              <button onClick={() => setShowExportModal(false)} className="px-3 py-1 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-xs">Kapat</button>
            </div>
            {!interactionData ? (
              <div className="text-xs text-[var(--muted)]">Önce bir çıktı üretin.</div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={() => {
                    const content = typeof interactionData === 'string'
                      ? interactionData
                      : JSON.stringify(interactionData, null, 2);
                    printToPdf(content);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--accent)] text-[#1b1b1b] text-xs font-semibold"
                >
                  PDF İndir
                </button>
                <button
                  onClick={() => {
                    const content = typeof interactionData === 'string'
                      ? interactionData
                      : JSON.stringify(interactionData, null, 2);
                    downloadTextFile('cikti.txt', content);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-xs"
                >
                  TXT İndir
                </button>
                {typeof interactionData !== 'string' && (
                  <button
                    onClick={() => downloadTextFile('cikti.json', JSON.stringify(interactionData, null, 2), 'application/json')}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-xs"
                  >
                    JSON İndir
                  </button>
                )}
                {interactionType === 'PRESENTATION' && (
                  <button onClick={exportPresentationToPdf} className="w-full px-3 py-2 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-xs">
                    Sunum PDF
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- RIGHT SIDEBAR (Interaction) --- */}
      {!isFocusMode && (
        <aside className={`flex flex-col min-h-0 bg-[var(--panel)] border border-[var(--border)] backdrop-blur-xl transition-all duration-300 rounded-3xl shadow-xl lg:h-full
          ${isMobileOverlay ? 'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[94vw] h-[90svh] z-50' : isMobileToolsOpen ? 'fixed inset-x-0 bottom-0 h-[75vh] z-50' : 'hidden lg:flex'}
          ${!isMobileOverlay && !isMobileToolsOpen ? (isInteractionExpanded ? 'w-[52vw] max-w-[980px]' : 'w-[30rem]') : 'w-full'}`}>
            {isMobileOverlay && (
              <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
                <div className="text-sm font-semibold">{currentToolLabel}</div>
                <button onClick={() => setIsInteractionModalOpen(false)} className="px-3 py-2 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-xs text-[var(--muted)] min-h-10">
                  Kapat
                </button>
              </div>
            )}
            {/* SAĞ PANEL İÇERİĞİ */}
            <div className={isMobileOverlay ? 'hidden' : ''}>
             <div className="p-5 border-b border-[var(--border)] max-h-[45vh] overflow-y-auto min-h-0">
          <div className="flex items-center justify-between text-[var(--text)]">
            <div className="flex items-center gap-2 font-semibold"><Zap size={18} className="text-[var(--accent)]" /><span>Etkileşim</span></div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowExportModal(true)} className="p-2 rounded-lg border border-[var(--border)] bg-[var(--panel-2)] hover:border-[var(--accent-3)] text-[var(--muted)] text-xs hidden lg:inline-flex">
                Export
              </button>
              <button onClick={() => setIsInteractionExpanded(prev => !prev)} className="p-2 rounded-lg border border-[var(--border)] bg-[var(--panel-2)] hover:border-[var(--accent-3)] text-[var(--muted)] hidden lg:inline-flex">
                {isInteractionExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              {isMobileToolsOpen && (
                <button onClick={() => setIsMobileToolsOpen(false)} className="p-2 rounded-lg border border-[var(--border)] bg-[var(--panel-2)] text-[var(--muted)]">
                  Kapat
                </button>
              )}
            </div>
          </div>
          <div className="mt-2 text-xs text-[var(--muted)]">Seçili kaynaklara göre üret.</div>
          <div className="mt-3">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)] mb-2">Çıktı Şablonu</div>
            <select
              value={outputTemplate}
              onChange={(e) => setOutputTemplate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-xs"
            >
              {outputTemplateOptions.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
          </div>
          {quotaInfo.limit > 0 && (
            <div className="mt-2 text-[10px] text-[var(--muted)]">
              Günlük limit: {quotaInfo.used}/{quotaInfo.limit}
            </div>
          )}
          <div className="mt-3 p-3 rounded-2xl bg-[var(--panel-2)] border border-[var(--border)]">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)] mb-2">Çıktı Etiketi</div>
            <input
              value={interactionTagDraft}
              onChange={(e) => setInteractionTagDraft(e.target.value)}
              placeholder="örn. Hafta-1, Prova, Özet"
              className="w-full px-3 py-2 rounded-xl bg-[var(--panel)] border border-[var(--border)] text-xs"
            />
            <div className="text-[10px] text-[var(--muted)] mt-2">Bu etiket bir sonraki çıktıya eklenir.</div>
          </div>
          {toolRecommendations.length > 0 && (
            <div className="mt-3 p-3 rounded-2xl bg-[var(--panel-2)] border border-[var(--border)]">
              <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)] mb-2">Akıllı Öneriler</div>
              <div className="space-y-2">
                {toolRecommendations.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => handleInteraction(tool.id)}
                    className="w-full text-left p-2 rounded-xl bg-[var(--panel)] border border-[var(--border)] hover:border-[var(--accent-3)]"
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text)]">
                      <tool.icon size={12} /> {tool.label}
                    </div>
                    <div className="text-[10px] text-[var(--muted)] mt-1">{tool.reason}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
          {categoryId === 'primary' && (
            <div className="mt-3 p-3 rounded-2xl bg-[var(--panel-2)] border border-[var(--border)]">
              <div className="text-[10px] tracking-[0.3em] font-bold text-[var(--muted)] mb-2">ROZETLER</div>
              {earnedBadges.length === 0 ? (
                <div className="text-[10px] text-[var(--muted)]">Henüz rozet yok.</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {earnedBadges.map((b) => (
                    <span key={b} className="px-2 py-1 rounded-full text-[10px] bg-[var(--panel)] border border-[var(--border)] text-[var(--muted)]">
                      {b}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
          {projectCategory && !['primary','highschool','university'].includes(projectCategory?.id) && (
            <div className="mb-4">
              <button onClick={() => setShowCategorySettings(prev => !prev)} className="w-full px-3 py-2 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-xs text-[var(--muted)] hover:text-[var(--text)]">
                Ek Ayarları {showCategorySettings ? 'Gizle' : 'Aç'}
              </button>
              {showCategorySettings && localProjectConfig && (
                <div className="mt-3 space-y-3">
                {projectCategory?.id === 'jury' && (
                  <div className="p-3 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] space-y-3">
                    <div className="text-xs text-[var(--muted)]">Jüri Formatı</div>
                    <div className="grid grid-cols-2 gap-2">
                      <input value={localProjectConfig.cadence || ''} onChange={(e) => setLocalProjectConfig(prev => ({ ...prev, cadence: e.target.value }))} placeholder="Sıklık (örn. Haftalık)" className="px-3 py-2 rounded-lg bg-[var(--panel)] border border-[var(--border)] text-xs" />
                      <input value={localProjectConfig.mode || ''} onChange={(e) => setLocalProjectConfig(prev => ({ ...prev, mode: e.target.value }))} placeholder="Format (Online/Yüz Yüze)" className="px-3 py-2 rounded-lg bg-[var(--panel)] border border-[var(--border)] text-xs" />
                    </div>
                    {localProjectConfig.panelists?.map((p, i) => (
                      <div key={i} className="p-2 rounded-lg bg-[var(--panel)] border border-[var(--border)] grid grid-cols-1 gap-2">
                        <input value={p.name} onChange={(e) => {
                          const next = [...localProjectConfig.panelists]; next[i] = { ...next[i], name: e.target.value };
                          setLocalProjectConfig(prev => ({ ...prev, panelists: next }));
                        }} placeholder={`Hoca ${i+1} - Ad Soyad`} className="px-3 py-2 rounded-lg bg-[var(--panel-2)] border border-[var(--border)] text-xs" />
                        <input value={p.demeanor} onChange={(e) => {
                          const next = [...localProjectConfig.panelists]; next[i] = { ...next[i], demeanor: e.target.value };
                          setLocalProjectConfig(prev => ({ ...prev, panelists: next }));
                        }} placeholder="Tavır (sert, yapıcı...)" className="px-3 py-2 rounded-lg bg-[var(--panel-2)] border border-[var(--border)] text-xs" />
                        <input value={p.focus} onChange={(e) => {
                          const next = [...localProjectConfig.panelists]; next[i] = { ...next[i], focus: e.target.value };
                          setLocalProjectConfig(prev => ({ ...prev, panelists: next }));
                        }} placeholder="Odak (tasarım, metodoloji...)" className="px-3 py-2 rounded-lg bg-[var(--panel-2)] border border-[var(--border)] text-xs" />
                      </div>
                    ))}
                    <div className="space-y-2">
                      <div className="text-xs text-[var(--muted)]">Jüri Video Kaydı</div>
                      <input type="file" accept="video/*" className="text-xs w-full" onChange={(e) => handleJuryVideoUpload(e.target.files?.[0])} />
                      {videoStatus && <div className="text-[10px] text-[var(--muted)]">{videoStatus}</div>}
                      {videoUploads.length > 0 && (
                        <div className="space-y-1">
                          {videoUploads.slice(0,3).map(v => (
                            <div key={v.id} className="text-[10px] text-[var(--muted)]">• {v.file_name}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {projectCategory?.id === 'thesis' && (
                  <div className="p-3 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] space-y-2">
                    <input value={localProjectConfig.advisorName || ''} onChange={(e) => setLocalProjectConfig(prev => ({ ...prev, advisorName: e.target.value }))} placeholder="Danışman Adı" className="px-3 py-2 rounded-lg bg-[var(--panel)] border border-[var(--border)] text-xs" />
                    <input value={localProjectConfig.advisorTone || ''} onChange={(e) => setLocalProjectConfig(prev => ({ ...prev, advisorTone: e.target.value }))} placeholder="Danışman Tavrı" className="px-3 py-2 rounded-lg bg-[var(--panel)] border border-[var(--border)] text-xs" />
                    <div className="space-y-2">
                      <div className="text-xs text-[var(--muted)]">Savunma Video Kaydı</div>
                      <input type="file" accept="video/*" className="text-xs w-full" onChange={(e) => handleJuryVideoUpload(e.target.files?.[0])} />
                      {videoStatus && <div className="text-[10px] text-[var(--muted)]">{videoStatus}</div>}
                    </div>
                  </div>
                )}
                {projectCategory?.id === 'meeting' && (
                    <div className="p-3 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] space-y-2">
                      <input value={localProjectConfig.organizer || ''} onChange={(e) => setLocalProjectConfig(prev => ({ ...prev, organizer: e.target.value }))} placeholder="Toplantıyı Yöneten" className="px-3 py-2 rounded-lg bg-[var(--panel)] border border-[var(--border)] text-xs" />
                      <input value={localProjectConfig.goal || ''} onChange={(e) => setLocalProjectConfig(prev => ({ ...prev, goal: e.target.value }))} placeholder="Toplantı Amacı" className="px-3 py-2 rounded-lg bg-[var(--panel)] border border-[var(--border)] text-xs" />
                      <input type="file" accept="audio/*,video/*" className="text-xs w-full" />
                    </div>
                  )}
                  <div className="p-3 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] space-y-2">
                    <div className="text-xs text-[var(--muted)]">Persona Kaydet</div>
                    <div className="flex gap-2">
                      <input value={personaName} onChange={(e) => setPersonaName(e.target.value)} placeholder="Persona adı (örn. Sert Prof. Ahmet)" className="flex-1 px-3 py-2 rounded-lg bg-[var(--panel)] border border-[var(--border)] text-xs" />
                      <button onClick={savePersona} className="px-3 py-2 rounded-lg bg-[var(--accent)] text-[#1b1b1b] text-xs font-semibold">Kaydet</button>
                    </div>
                    {personas.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {personas.slice(0, 5).map(p => (
                          <button key={p.id} onClick={() => applyPersona(p)} className="w-full text-left px-3 py-2 rounded-lg bg-[var(--panel)] border border-[var(--border)] text-xs">
                            {p.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          {(categoryId === 'jury' || categoryId === 'thesis') && (
            <div className="mt-4 p-3 rounded-2xl bg-[var(--panel-2)] border border-[var(--border)]">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] tracking-[0.3em] font-bold text-[var(--muted)]">JÜRI HAFIZASI</div>
                <button onClick={clearJuryMemory} className="text-[10px] px-2 py-1 rounded-lg bg-[var(--panel)] border border-[var(--border)] text-[var(--muted)]">Temizle</button>
              </div>
              <div className="flex gap-2 mb-2">
                <input
                  value={juryMemoryTag}
                  onChange={(e) => setJuryMemoryTag(e.target.value)}
                  placeholder="Hoca adı / etiket"
                  className="flex-1 px-2 py-1 rounded-lg bg-[var(--panel)] border border-[var(--border)] text-[10px]"
                />
                <button
                  onClick={() => {
                    if (juryMemoryTag.trim() && roleplayResponse) {
                      saveJuryMemory(roleplayResponse, juryMemoryTag.trim());
                      setJuryMemoryTag('');
                    }
                  }}
                  className="px-2 py-1 rounded-lg bg-[var(--panel)] border border-[var(--border)] text-[10px]"
                >
                  Etiketle
                </button>
              </div>
              <select
                value={juryMemoryFilter}
                onChange={(e) => setJuryMemoryFilter(e.target.value)}
                className="w-full px-2 py-1 rounded-lg bg-[var(--panel)] border border-[var(--border)] text-[10px] mb-2"
              >
                <option value="">Tüm Etiketler</option>
                {Array.from(new Set(juryMemory.map(m => m.tag).filter(Boolean))).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {juryMemory.length === 0 ? (
                <div className="text-[10px] text-[var(--muted)]">Henüz kayıt yok.</div>
              ) : (
                <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                  {juryMemory.filter(m => !juryMemoryFilter || m.tag === juryMemoryFilter).slice(0, 5).map((m, idx) => (
                    <div key={idx} className="p-2 rounded-xl bg-[var(--panel)] border border-[var(--border)] text-[10px] text-[var(--muted)]">
                      <div className="font-semibold text-[10px] mb-1">{m.tag || 'Etiketsiz'}</div>
                      {m.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {favoriteToolList.length > 0 && (
            <div className="mt-4">
              <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)] mb-2">Favoriler</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {favoriteToolList.map((tool) => renderToolCard(tool))}
              </div>
            </div>
          )}
          <div className="mt-4">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)] mb-2">Tüm Araçlar</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {interactionTools.map((tool) => renderToolCard(tool))}
            </div>
          </div>
          <div className="mt-5">
            <div className="flex items-center justify-between text-xs text-[var(--muted)] mb-2">
              <span className="font-semibold">Etkileşim Geçmişi</span>
              <button onClick={clearInteractionHistory} className="text-[10px] px-2 py-1 rounded-lg bg-[var(--panel-2)] border border-[var(--border)] hover:text-[var(--text)]">
                Temizle
              </button>
            </div>
            {interactionHistory.length === 0 ? (
              <div className="text-xs text-[var(--muted)]">Henüz kayıt yok.</div>
            ) : (
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {interactionHistory.slice(0, 6).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setInteractionType(item.tool_id);
                      setInteractionData(unwrapHistoryPayload(item.payload));
                      const meta = getHistoryMeta(item.payload);
                      if (meta?.sourceNames?.length) {
                        setCurrentSourceMeta({ names: meta.sourceNames, ids: meta.sourceIds || [] });
                      }
                      setCurrentInteractionMeta({
                        ...(meta || {}),
                        createdAt: meta?.createdAt || item.created_at || null,
                        version: meta?.version || null,
                        tag: meta?.tag || null,
                        template: meta?.template || null
                      });
                      setIsInteractionLoading(false);
                      if (isMobileView) {
                        setIsInteractionModalOpen(true);
                        setIsMobileToolsOpen(false);
                      }
                    }}
                    className="w-full text-left p-3 rounded-xl border bg-[var(--panel-2)] border-[var(--border)] hover:border-[var(--accent-3)]"
                  >
                    {(() => {
                      const meta = getHistoryMeta(item.payload);
                      return (
                        <>
                          <div className="text-xs font-semibold text-[var(--text)]">{item.tool_label || item.tool_id}</div>
                          <div className="flex flex-wrap items-center gap-2 text-[10px] text-[var(--muted)] mt-1">
                            {meta?.version && <span>v{meta.version}</span>}
                            {meta?.tag && <span>#{meta.tag}</span>}
                            {item.created_at && <span>{new Date(item.created_at).toLocaleDateString('tr-TR')}</span>}
                          </div>
                          <div className="text-[10px] text-[var(--muted)] truncate mt-1">{item.preview || 'Çıktı'}</div>
                        </>
                      );
                    })()}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        </div>
        {(!isMobileView || isMobileOverlay) && (
        <div className="flex-1 min-h-0 overflow-y-auto p-5 relative">
          {isInteractionLoading ? <div className="text-center mt-10 text-[var(--muted)]">Hazırlanıyor...</div> : !interactionData ? <div className="text-center mt-10 text-[var(--muted)] text-xs">Bir araç seçin.</div> : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {interactionData && (
                <div className="mb-4 p-3 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-[10px] text-[var(--muted)]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-[var(--panel)] border border-[var(--border)] text-[var(--text)]">
                      {currentToolLabel}
                    </span>
                    {currentInteractionMeta?.version && (
                      <span>Versiyon {currentInteractionMeta.version}</span>
                    )}
                    {currentInteractionMeta?.createdAt && (
                      <span>{new Date(currentInteractionMeta.createdAt).toLocaleString('tr-TR')}</span>
                    )}
                    {currentInteractionMeta?.tag && (
                      <span className="px-2 py-0.5 rounded-full bg-[var(--panel)] border border-[var(--border)] text-[var(--text)]">
                        #{currentInteractionMeta.tag}
                      </span>
                    )}
                    {currentInteractionMeta?.template && (
                      <span>Şablon: {currentInteractionMeta.template}</span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button onClick={copyInteractionOutput} className="px-3 py-1.5 rounded-lg bg-[var(--panel)] border border-[var(--border)] text-[10px]">Kopyala</button>
                    <button onClick={shareInteractionOutput} className="px-3 py-1.5 rounded-lg bg-[var(--panel)] border border-[var(--border)] text-[10px]">Paylaş</button>
                    <button onClick={() => printToPdf(getInteractionText(interactionData))} className="px-3 py-1.5 rounded-lg bg-[var(--panel)] border border-[var(--border)] text-[10px]">PDF</button>
                    <button onClick={() => downloadTextFile('cikti.txt', getInteractionText(interactionData))} className="px-3 py-1.5 rounded-lg bg-[var(--panel)] border border-[var(--border)] text-[10px]">TXT</button>
                  </div>
                </div>
              )}
              {currentSourceMeta?.names?.length > 0 && (
                <div className="mb-4 p-3 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-[10px] text-[var(--muted)]">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)] mb-2">Kaynak İzleri</div>
                  <div className="flex flex-wrap gap-2">
                    {currentSourceMeta.names.map((name, idx) => {
                      const fallback = sources.find(s => s.name === name);
                      const sourceId = (currentSourceMeta.ids && currentSourceMeta.ids[idx]) || fallback?.docId || fallback?.id;
                      return (
                        <button
                          key={`${name}-${idx}`}
                          onClick={() => scrollToSource(sourceId)}
                          className="px-2 py-1 rounded-full bg-[var(--panel)] border border-[var(--border)] text-[10px] text-[var(--text)] hover:border-[var(--accent-3)]"
                        >
                          {name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {interactionType === 'SUMMARY' && renderTextBlock('KAYNAK ÖZETİ', interactionData)}
              {interactionType === 'FEYNMAN' && renderTextBlock('FEYNMAN TEKNİĞİ', interactionData)}
              {interactionType === 'STORY' && (
                <div className="p-4 rounded-2xl bg-[var(--panel-2)] border border-[var(--border)]">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-[10px] tracking-[0.3em] font-bold text-[var(--accent)]">HİKAYELEŞTİR</div>
                    <button onClick={() => speakText(interactionData)} className="px-2 py-1 rounded-lg bg-[var(--panel)] border border-[var(--border)] text-[10px] text-[var(--muted)]">Oku</button>
                  </div>
                  <SimpleMarkdownRenderer content={interactionData} />
                </div>
              )}
              {interactionType === 'ELI5' && (
                <div className="p-4 rounded-2xl bg-[var(--panel-2)] border border-[var(--border)]">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-[10px] tracking-[0.3em] font-bold text-[var(--accent)]">BASİT ANLAT</div>
                    <button onClick={() => speakText(interactionData)} className="px-2 py-1 rounded-lg bg-[var(--panel)] border border-[var(--border)] text-[10px] text-[var(--muted)]">Oku</button>
                  </div>
                  <SimpleMarkdownRenderer content={interactionData} />
                </div>
              )}
              {interactionType === 'STUDY_NOTES' && renderTextBlock('DERS ÖZETİ', interactionData)}
              {interactionType === 'ACADEMIC_SUMMARY' && renderTextBlock('AKADEMİK ÖZET', interactionData)}
              {interactionType === 'PITCH' && renderTextBlock('SUNUM METNİ', interactionData)}
              {interactionType === 'CONCEPT_EXPLAIN' && renderTextBlock('KONSEPT AÇIKLAMA', interactionData)}
              {interactionType === 'ELEVATOR' && renderTextBlock('ASANSÖR KONUŞMASI', interactionData)}
              {interactionType === 'LIT_REVIEW' && renderTextBlock('LİTERATÜR TARAMA', interactionData)}
              {interactionType === 'FOLLOW_UP' && (
                <div className="p-4 rounded-2xl bg-[var(--panel-2)] border border-[var(--border)]">
                  <div className="text-[10px] tracking-[0.3em] font-bold text-[var(--accent)] mb-3">FOLLOW-UP MAIL</div>
                  <div className="flex gap-2 mb-3">
                    <button onClick={() => printToPdf(interactionData)} className="px-3 py-2 rounded-lg bg-[var(--panel)] border border-[var(--border)] text-xs">PDF İndir</button>
                    <button onClick={() => openMailClient('Toplantı Özeti', interactionData)} className="px-3 py-2 rounded-lg bg-[var(--panel)] border border-[var(--border)] text-xs">Outlook'a Gönder</button>
                    <button onClick={() => downloadTextFile('followup.txt', interactionData)} className="px-3 py-2 rounded-lg bg-[var(--panel)] border border-[var(--border)] text-xs">TXT</button>
                    <button onClick={() => copyToClipboard(interactionData)} className="px-3 py-2 rounded-lg bg-[var(--panel)] border border-[var(--border)] text-xs">Kopyala</button>
                  </div>
                  <SimpleMarkdownRenderer content={interactionData} />
                </div>
              )}
              {interactionType === 'MNEMONIC' && interactionData.items && (
                <div className="space-y-4">
                  <div className="text-[10px] tracking-[0.3em] font-bold text-[var(--accent)]">MNEMONIK</div>
                  {interactionData.items.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-2xl border bg-[var(--panel-2)] border-[var(--border)]">
                      <div className="text-xs text-[var(--muted)] mb-2">{item.topic}</div>
                      <div className="text-sm font-medium"><SimpleMarkdownRenderer content={item.mnemonic} /></div>
                    </div>
                  ))}
                </div>
              )}
      {interactionType === 'PRESENTATION' && interactionData?.slides && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl border bg-[var(--panel-2)] border-[var(--border)]">
            <div className="text-xs text-[var(--muted)]">SUNUM HAZIR</div>
            <div className="text-sm font-semibold mt-1">{interactionData.title || 'Sunum Başlığı'}</div>
            <div className="text-[10px] text-[var(--muted)] mt-1">{interactionData.slides.length} slayt • Tema: {presentationTheme}</div>
            <div className="flex flex-wrap gap-2 mt-3">
              <button onClick={() => setShowPresentationEditor(true)} className="px-4 py-2 rounded-xl bg-[var(--accent)] text-[#1b1b1b] text-xs font-semibold">Sunumu Düzenle</button>
              <button onClick={exportPresentationToPdf} className="px-3 py-2 rounded-xl bg-[var(--panel)] border border-[var(--border)] text-xs">PDF İndir</button>
              <button onClick={() => { setPresentationFullScreen(true); setPresentationActiveIndex(0); }} className="px-3 py-2 rounded-xl bg-[var(--panel)] border border-[var(--border)] text-xs">Sunum Modu</button>
            </div>
          </div>
          {showPresentationEditor && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
              <div className="w-full max-w-5xl rounded-3xl bg-[var(--panel)] border border-[var(--border)] p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm font-semibold">Sunum Düzenleyici</div>
                  <button onClick={() => setShowPresentationEditor(false)} className="px-3 py-2 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-xs">Kapat</button>
                </div>
                <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
                  <div className="text-xs tracking-[0.3em] font-bold text-[var(--accent)]">SUNUM TASLAĞI</div>
                  <div className="p-4 rounded-2xl border bg-[var(--panel-2)] border-[var(--border)]">
                    <div className="text-xs text-[var(--muted)] mb-2">Sunum Başlığı</div>
                    <input
                      value={interactionData.title || ''}
                      onChange={(e) => setInteractionData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl bg-[var(--panel)] border border-[var(--border)] text-base"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-4 rounded-2xl border bg-[var(--panel-2)] border-[var(--border)]">
                      <div className="text-xs text-[var(--muted)] mb-2">Konuşmacı</div>
                      <input
                        value={presentationSpeaker}
                        onChange={(e) => setPresentationSpeaker(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-[var(--panel)] border border-[var(--border)] text-base"
                        placeholder="Ad Soyad"
                      />
                    </div>
                    <div className="p-4 rounded-2xl border bg-[var(--panel-2)] border-[var(--border)]">
                      <div className="text-xs text-[var(--muted)] mb-2">Tarih</div>
                      <input
                        value={presentationDate}
                        onChange={(e) => setPresentationDate(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-[var(--panel)] border border-[var(--border)] text-base"
                        placeholder="GG.AA.YYYY"
                      />
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl border bg-[var(--panel-2)] border-[var(--border)] flex flex-col gap-3">
                    <div className="text-xs text-[var(--muted)]">Tema</div>
                    <select
                      value={presentationTheme}
                      onChange={(e) => applyGlobalTheme(e.target.value)}
                      className="px-4 py-3 rounded-xl bg-[var(--panel)] border border-[var(--border)] text-base"
                    >
                      <option value="midnight">Midnight</option>
                      <option value="ivory">Ivory</option>
                      <option value="slate">Slate</option>
                    </select>
                    <div className="text-xs text-[var(--muted)]">Slayt Yerleşimi</div>
                    <select
                      value={presentationLayout}
                      onChange={(e) => setPresentationLayout(e.target.value)}
                      className="px-4 py-3 rounded-xl bg-[var(--panel)] border border-[var(--border)] text-base"
                    >
                      <option value="standard">Başlık + Liste</option>
                      <option value="split">İki Kolon</option>
                      <option value="visual">Görsel + Madde</option>
                    </select>
                    <div className="text-xs text-[var(--muted)]">Sunum Tonu</div>
                    <select
                      value={presentationTone}
                      onChange={(e) => setPresentationTone(e.target.value)}
                      className="px-4 py-3 rounded-xl bg-[var(--panel)] border border-[var(--border)] text-base"
                    >
                      <option value="academic">Akademik</option>
                      <option value="story">Hikayeleştir</option>
                      <option value="business">İş / Profesyonel</option>
                    </select>
                    <label className="flex items-center gap-2 text-xs text-[var(--muted)]">
                      <input
                        type="checkbox"
                        checked={presentationShowNotes}
                        onChange={(e) => setPresentationShowNotes(e.target.checked)}
                      />
                      Sunum modunda notları göster
                    </label>
                    <div className="text-xs text-[var(--muted)]">Geçiş Efekti</div>
                    <select
                      value={presentationTransition}
                      onChange={(e) => setPresentationTransition(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-[var(--panel)] border border-[var(--border)] text-sm"
                    >
                      <option value="fade">Fade</option>
                      <option value="slide">Slide</option>
                    </select>
                    <div className="text-xs text-[var(--muted)]">Tema Paketi</div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(presentationPacks).map(([key, pack]) => (
                        <button
                          key={key}
                          onClick={() => applyPresentationPack(key)}
                          className={`px-3 py-2 rounded-xl text-xs border ${presentationPack === key ? 'border-[var(--accent)] bg-[rgba(245,184,75,0.16)] text-[var(--accent)]' : 'border-[var(--border)] bg-[var(--panel)]'}`}
                        >
                          {pack.label}
                        </button>
                      ))}
                    </div>
                    <div className="text-xs text-[var(--muted)]">Şablonlar</div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(presentationTemplates).map(([key, tpl]) => (
                        <button
                          key={key}
                          onClick={() => applyPresentationTemplate(key)}
                          className="px-3 py-2 rounded-xl bg-[var(--panel)] border border-[var(--border)] text-xs hover:border-[var(--accent-3)]"
                        >
                          {tpl.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={addCoverAndToc} className="px-3 py-2 rounded-xl bg-[var(--panel)] border border-[var(--border)] text-xs">
                        Kapak + İçindekiler Ekle
                      </button>
                      <button onClick={addSlide} className="px-3 py-2 rounded-xl bg-[var(--panel)] border border-[var(--border)] text-xs">
                        Slayt Ekle
                      </button>
                      <button onClick={addSummarySlide} className="px-3 py-2 rounded-xl bg-[var(--panel)] border border-[var(--border)] text-xs">
                        Sunum Özeti Ekle
                      </button>
                      <button onClick={addQASlide} className="px-3 py-2 rounded-xl bg-[var(--panel)] border border-[var(--border)] text-xs">
                        Soru & Cevap Ekle
                      </button>
                      <button onClick={addSectionSlides} className="px-3 py-2 rounded-xl bg-[var(--panel)] border border-[var(--border)] text-xs">
                        Bölüm Ayraçları
                      </button>
                      <button onClick={addBibliographySlide} className="px-3 py-2 rounded-xl bg-[var(--panel)] border border-[var(--border)] text-xs">
                        Kaynakça Ekle
                      </button>
                    </div>
                    <div className="text-xs text-[var(--muted)]">Numaralandırma</div>
                    <select
                      value={presentationNumberStyle}
                      onChange={(e) => setPresentationNumberStyle(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-[var(--panel)] border border-[var(--border)] text-sm"
                    >
                      <option value="simple">1, 2, 3</option>
                      <option value="section">1.1, 1.2, 1.3</option>
                    </select>
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs text-[var(--muted)]">Prova Modu (slayt başı sn)</div>
                      <input
                        type="number"
                        min="30"
                        value={presentationTimerSec}
                        onChange={(e) => setPresentationTimerSec(Number(e.target.value))}
                        className="w-20 px-2 py-1 rounded-lg bg-[var(--panel)] border border-[var(--border)] text-xs"
                      />
                    </div>
                    <label className="flex items-center gap-2 text-xs text-[var(--muted)]">
                      <input
                        type="checkbox"
                        checked={presentationAutoTiming}
                        onChange={(e) => setPresentationAutoTiming(e.target.checked)}
                      />
                      Slayta göre otomatik süre öner
                    </label>
                    <label className="flex items-center gap-2 text-xs text-[var(--muted)]">
                      <input
                        type="checkbox"
                        checked={presentationAutoAdvance}
                        onChange={(e) => setPresentationAutoAdvance(e.target.checked)}
                      />
                      Süre dolunca otomatik geç
                    </label>
                    <div className="text-xs text-[var(--muted)]">Marka / Watermark</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <input
                        value={presentationBrandName}
                        onChange={(e) => setPresentationBrandName(e.target.value)}
                        placeholder="Marka adı (ops.)"
                        className="px-3 py-2 rounded-xl bg-[var(--panel)] border border-[var(--border)] text-xs"
                      />
                      <select
                        value={presentationBrandMode}
                        onChange={(e) => setPresentationBrandMode(e.target.value)}
                        className="px-3 py-2 rounded-xl bg-[var(--panel)] border border-[var(--border)] text-xs"
                      >
                        <option value="watermark">Watermark</option>
                        <option value="header">Başlıkta Göster</option>
                        <option value="none">Gizle</option>
                      </select>
                    </div>
                    <button onClick={createShareLink} className="px-3 py-2 rounded-xl bg-[var(--panel)] border border-[var(--border)] text-xs">
                      Sunumu Paylaş (Link)
                    </button>
                    {presentationShareLink && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={async () => {
                            await navigator.clipboard.writeText(presentationShareLink);
                          }}
                          className="px-3 py-2 rounded-xl bg-[var(--panel)] border border-[var(--border)] text-xs"
                        >
                          Linki Kopyala
                        </button>
                        <a href={`${presentationShareLink}/qr`} className="px-3 py-2 rounded-xl bg-[var(--panel)] border border-[var(--border)] text-xs">
                          QR Oluştur
                        </a>
                        <span className="text-[10px] text-[var(--muted)]">
                          Görüntülenme: {localStorage.getItem(`share_${presentationShareLink.split('/').pop()}_views`) || 0}
                        </span>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        value={presentationSharePassword}
                        onChange={(e) => setPresentationSharePassword(e.target.value)}
                        placeholder="Paylaşım şifresi (ops.)"
                        className="px-3 py-2 rounded-xl bg-[var(--panel)] border border-[var(--border)] text-xs"
                      />
                      <input
                        type="number"
                        min="1"
                        value={presentationShareExpireHours}
                        onChange={(e) => setPresentationShareExpireHours(Number(e.target.value))}
                        placeholder="Süre (saat)"
                        className="px-3 py-2 rounded-xl bg-[var(--panel)] border border-[var(--border)] text-xs"
                      />
                    </div>
                    {presentationShareLink && (
                      <div className="text-[10px] text-[var(--muted)] break-all">
                        {presentationShareLink}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => {
                        setPresentationRunning(true);
                        if (interactionData?.slides?.length) {
                          setPresentationTimerSec(estimateSlideSeconds(interactionData.slides[presentationIndex]));
                        } else {
                          setPresentationTimerSec(Math.max(30, presentationTimerSec));
                        }
                      }} className="px-3 py-2 rounded-xl bg-[var(--panel)] border border-[var(--border)] text-xs">
                        Prova Başlat
                      </button>
                      <button onClick={() => setPresentationRunning(false)} className="px-3 py-2 rounded-xl bg-[var(--panel)] border border-[var(--border)] text-xs">
                        Durdur
                      </button>
                      <button onClick={() => { setPresentationIndex(0); setPresentationTimerSec(Math.max(30, presentationTimerSec)); }} className="px-3 py-2 rounded-xl bg-[var(--panel)] border border-[var(--border)] text-xs">
                        Baştan
                      </button>
                    </div>
                    {interactionData?.slides?.length > 0 && (
                      <div className="p-3 rounded-xl bg-[var(--panel)] border border-[var(--border)] text-xs">
                        <div className="text-[var(--muted)] mb-1">Prova Slaytı</div>
                        <div className="font-semibold">{interactionData.slides[presentationIndex]?.title || 'Başlık'}</div>
                        <div className="text-[var(--muted)] mt-1">
                          Kalan: {presentationTimerSec}s • Önerilen: {estimateSlideSeconds(interactionData.slides[presentationIndex])}s
                        </div>
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => {
                            setPresentationIndex(i => Math.max(0, i - 1));
                            setPresentationTimerSec(estimateSlideSeconds(interactionData.slides[Math.max(0, presentationIndex - 1)]));
                          }} className="px-2 py-1 rounded-lg bg-[var(--panel-2)] border border-[var(--border)] text-[10px]">Önceki</button>
                          <button onClick={() => {
                            const nextIdx = Math.min(interactionData.slides.length - 1, presentationIndex + 1);
                            setPresentationIndex(nextIdx);
                            setPresentationTimerSec(estimateSlideSeconds(interactionData.slides[nextIdx]));
                          }} className="px-2 py-1 rounded-lg bg-[var(--panel-2)] border border-[var(--border)] text-[10px]">Sonraki</button>
                        </div>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <button onClick={exportPresentationToPdf} className="px-4 py-2 rounded-xl bg-[var(--accent)] text-[#1b1b1b] text-sm font-semibold">
                        PDF İndir
                      </button>
                      <button onClick={exportPresentationToMarkdown} className="px-3 py-2 rounded-xl bg-[var(--panel)] border border-[var(--border)] text-xs">
                        Markdown
                      </button>
                      <button onClick={exportPresentationToPptx} className="px-3 py-2 rounded-xl bg-[var(--panel)] border border-[var(--border)] text-xs">
                        PPTX (JSON)
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        value={presentationSearch}
                        onChange={(e) => setPresentationSearch(e.target.value)}
                        placeholder="Slayt ara..."
                        className="flex-1 px-4 py-3 rounded-xl bg-[var(--panel)] border border-[var(--border)] text-base"
                      />
                      <button onClick={() => { setPresentationFullScreen(true); setPresentationActiveIndex(0); }} className="px-3 py-2 rounded-xl bg-[var(--panel)] border border-[var(--border)] text-xs">
                        Sunum Modu
                      </button>
                    </div>
                    {ratingSummary.length > 0 && (
                      <div className="p-3 rounded-xl bg-[var(--panel)] border border-[var(--border)] text-xs">
                        <div className="text-[var(--muted)] mb-2">Zayıf Slaytlar</div>
                        {ratingSummary.map(r => (
                          <div key={r.idx} className="text-[var(--muted)]">
                            {formatSlideNumber(r.idx)}. {interactionData.slides[r.idx]?.title || 'Başlık'} • {r.score}★
                          </div>
                        ))}
                      </div>
                    )}
                    {filteredSlides.map((s) => (
                      <div key={s.__idx} className="p-4 rounded-2xl border bg-[var(--panel-2)] border-[var(--border)] space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-[var(--muted)]">Slayt {formatSlideNumber(s.__idx)}</div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => duplicateSlide(s.__idx)} className="px-2 py-1 rounded-lg bg-[var(--panel)] border border-[var(--border)] text-[10px]">Kopyala</button>
                            <button onClick={() => moveSlide(s.__idx, -1)} className="px-2 py-1 rounded-lg bg-[var(--panel)] border border-[var(--border)] text-[10px]">Yukarı</button>
                            <button onClick={() => moveSlide(s.__idx, 1)} className="px-2 py-1 rounded-lg bg-[var(--panel)] border border-[var(--border)] text-[10px]">Aşağı</button>
                            <button onClick={() => removeSlide(s.__idx)} className="px-2 py-1 rounded-lg bg-[var(--panel)] border border-[var(--border)] text-[10px] text-[var(--danger)]">Sil</button>
                          </div>
                        </div>
                        <input
                          value={s.title || ''}
                          onChange={(e) => setInteractionData(prev => {
                            const next = { ...prev, slides: [...prev.slides] };
                            next.slides[s.__idx] = { ...next.slides[s.__idx], title: e.target.value };
                            return next;
                          })}
                          className="w-full px-3 py-2 rounded-xl bg-[var(--panel)] border border-[var(--border)] text-sm"
                        />
                        <div className="flex flex-wrap gap-2">
                          {getIconSuggestions(s.title).map((emo) => (
                            <button
                              key={emo}
                              onClick={() => setInteractionData(prev => {
                                const next = { ...prev, slides: [...prev.slides] };
                                const current = next.slides[s.__idx].title || '';
                                next.slides[s.__idx] = { ...next.slides[s.__idx], title: `${emo} ${current}`.trim() };
                                return next;
                              })}
                              className="px-2 py-1 rounded-lg bg-[var(--panel)] border border-[var(--border)] text-[10px]"
                            >
                              {emo}
                            </button>
                          ))}
                        </div>
                        <textarea
                          value={(s.bullets || []).join('\n')}
                          onChange={(e) => setInteractionData(prev => {
                            const next = { ...prev, slides: [...prev.slides] };
                            next.slides[s.__idx] = { ...next.slides[s.__idx], bullets: e.target.value.split('\n').filter(Boolean) };
                            return next;
                          })}
                          rows={4}
                          className="w-full px-3 py-2 rounded-xl bg-[var(--panel)] border border-[var(--border)] text-sm"
                        />
                        <input
                          value={s.visual || ''}
                          onChange={(e) => setInteractionData(prev => {
                            const next = { ...prev, slides: [...prev.slides] };
                            next.slides[s.__idx] = { ...next.slides[s.__idx], visual: e.target.value };
                            return next;
                          })}
                          placeholder="Görsel önerisi (örn. DNA görseli, hücre şeması)"
                          className="w-full px-3 py-2 rounded-xl bg-[var(--panel)] border border-[var(--border)] text-sm"
                        />
                        <textarea
                          value={s.notes || ''}
                          onChange={(e) => setInteractionData(prev => {
                            const next = { ...prev, slides: [...prev.slides] };
                            next.slides[s.__idx] = { ...next.slides[s.__idx], notes: e.target.value };
                            return next;
                          })}
                          rows={3}
                          placeholder="Konuşmacı notları..."
                          className="w-full px-3 py-2 rounded-xl bg-[var(--panel)] border border-[var(--border)] text-sm"
                        />
                        <textarea
                          value={s.longNotes || ''}
                          onChange={(e) => setInteractionData(prev => {
                            const next = { ...prev, slides: [...prev.slides] };
                            next.slides[s.__idx] = { ...next.slides[s.__idx], longNotes: e.target.value };
                            return next;
                          })}
                          rows={4}
                          placeholder="Uzun notlar (prova için)..."
                          className="w-full px-3 py-2 rounded-xl bg-[var(--panel)] border border-[var(--border)] text-sm"
                        />
                        <textarea
                          value={presentationComments[s.__idx] || ''}
                          onChange={(e) => setPresentationComments(prev => ({ ...prev, [s.__idx]: e.target.value }))}
                          rows={3}
                          placeholder="Geri bildirim / yorum..."
                          className="w-full px-3 py-2 rounded-xl bg-[var(--panel)] border border-[var(--border)] text-sm"
                        />
                        <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                          <span>Değerlendirme:</span>
                          {[1,2,3,4,5].map((star) => (
                            <button
                              key={star}
                              onClick={() => setPresentationRatings(prev => ({ ...prev, [s.__idx]: star }))}
                              className={`text-lg ${presentationRatings[s.__idx] >= star ? 'text-[var(--accent)]' : 'text-[var(--muted)]'}`}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-[var(--muted)]">İpucu: Her satır bir madde olur.</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {interactionType === 'PRESENTATION' && presentationFullScreen && (
        <div
          className="fixed inset-0 z-50 bg-[#0B0F14] text-white flex flex-col"
          onMouseMove={(e) => {
            setLaserPos({ x: e.clientX, y: e.clientY });
            setLaserVisible(true);
            setLaserTrail(prev => {
              const next = [...prev, { x: e.clientX, y: e.clientY, id: Date.now() }];
              return next.slice(-12);
            });
          }}
          onMouseLeave={() => setLaserVisible(false)}
        >
          {laserVisible && (
            <>
              {laserTrail.map((t, i) => (
                <div
                  key={t.id}
                  className="pointer-events-none fixed w-2 h-2 rounded-full bg-[#F5B84B] opacity-40"
                  style={{ left: t.x - 4, top: t.y - 4, opacity: (i + 1) / laserTrail.length * 0.4 }}
                />
              ))}
              <div
                className="pointer-events-none fixed w-3 h-3 rounded-full bg-[#F5B84B] shadow-[0_0_12px_rgba(245,184,75,0.8)]"
                style={{ left: laserPos.x - 6, top: laserPos.y - 6 }}
              />
            </>
          )}
          <div className="px-6 py-4 flex items-center justify-between border-b border-white/10">
            <div className="text-sm">{interactionData.title || 'Sunum'}</div>
            <div className="flex items-center gap-2">
              <button onClick={() => setPresentationFullScreen(false)} className="px-3 py-2 rounded-lg bg-white/10 text-xs">
                Çık
              </button>
            </div>
          </div>
          <div className={`flex-1 flex items-center justify-center px-8 transition-all duration-300 ${presentationTransition === 'fade' ? 'opacity-100' : 'translate-x-0'}`}>
            {interactionData.slides[presentationActiveIndex] && (
              <div className="max-w-3xl w-full">
                <div className="mb-2 inline-block h-1 w-16 rounded-full bg-[#F5B84B]" />
                <div className="text-2xl font-bold mb-4">
                  {formatSlideNumber(presentationActiveIndex)}. {interactionData.slides[presentationActiveIndex].title}
                </div>
                {presentationLayout === 'split' ? (
                  <div className="grid grid-cols-2 gap-6">
                    <ul className="space-y-2 text-sm text-white/80">
                      {(interactionData.slides[presentationActiveIndex].bullets || []).map((b, i) => (
                        <li key={i}>• {b}</li>
                      ))}
                    </ul>
                    <div className="text-xs text-white/60">
                      {interactionData.slides[presentationActiveIndex].visual || 'Görsel alanı'}
                    </div>
                  </div>
                ) : presentationLayout === 'visual' ? (
                  <div>
                    <div className="mb-4 text-xs text-white/60 border border-white/10 rounded-xl p-3">
                      Görsel: {interactionData.slides[presentationActiveIndex].visual || 'Görsel alanı'}
                    </div>
                    <ul className="space-y-2 text-sm text-white/80">
                      {(interactionData.slides[presentationActiveIndex].bullets || []).map((b, i) => (
                        <li key={i}>• {b}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <ul className="space-y-2 text-sm text-white/80">
                    {(interactionData.slides[presentationActiveIndex].bullets || []).map((b, i) => (
                      <li key={i}>• {b}</li>
                    ))}
                  </ul>
                )}
                {presentationShowNotes && interactionData.slides[presentationActiveIndex].notes && (
                  <div className="mt-4 text-xs text-white/50">
                    Notlar: {interactionData.slides[presentationActiveIndex].notes}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="px-6 py-4 flex items-center justify-between border-t border-white/10 text-xs">
            <button
              onClick={() => setPresentationActiveIndex(i => Math.max(0, i - 1))}
              className="px-3 py-2 rounded-lg bg-white/10"
            >
              Önceki
            </button>
            <div className="flex items-center gap-3">
              <div>{presentationActiveIndex + 1} / {interactionData.slides.length}</div>
              <div className="text-white/60">Kalan: {presentationTimerSec}s</div>
              {presentationShowNotes && interactionData.slides[presentationActiveIndex]?.notes && (
                <div className="text-white/50">Not: {interactionData.slides[presentationActiveIndex].notes}</div>
              )}
            </div>
            <button
              onClick={() => setPresentationActiveIndex(i => Math.min(interactionData.slides.length - 1, i + 1))}
              className="px-3 py-2 rounded-lg bg-white/10"
            >
              Sonraki
            </button>
          </div>
          <div className="px-6 py-3 border-t border-white/10 overflow-x-auto">
            <div className="flex gap-2">
              {interactionData.slides.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setPresentationActiveIndex(i)}
                  className={`px-3 py-2 rounded-lg text-[10px] whitespace-nowrap ${i === presentationActiveIndex ? 'bg-[#F5B84B] text-[#1b1b1b]' : 'bg-white/10 text-white/70'}`}
                >
                  {formatSlideNumber(i)}. {s.title || 'Başlık'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
              {interactionType === 'VISUAL_CARDS' && interactionData.cards && (
                <div className="space-y-3">
                  <div className="text-[10px] tracking-[0.3em] font-bold text-[var(--accent)]">RESİMLİ KARTLAR</div>
                  {interactionData.cards.map((c, idx) => (
                    <div key={idx} className="p-4 rounded-2xl border bg-[var(--panel-2)] border-[var(--border)] flex items-start gap-3">
                      <div className="text-2xl">{c.emoji}</div>
                      <div>
                        <div className="text-sm font-semibold">{c.term}</div>
                        <div className="text-xs text-[var(--muted)]">{c.meaning}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {interactionType === 'RIDDLES' && interactionData.questions && (
                <div className="space-y-3">
                  <div className="text-[10px] tracking-[0.3em] font-bold text-[var(--accent)]">BİLMECELER</div>
                  {interactionData.questions.map((q, idx) => (
                    <div key={q.id || idx} className="p-4 rounded-2xl border bg-[var(--panel-2)] border-[var(--border)]">
                      <div className="text-xs text-[var(--muted)] mb-1">Bilmece {idx + 1}</div>
                      <SimpleMarkdownRenderer content={q.text} />
                    </div>
                  ))}
                </div>
              )}
              {interactionType === 'MINI_QUIZ' && interactionData.questions && (
                <div className="space-y-6">
                  {badgeEarned && (
                    <div className="p-3 rounded-xl bg-[rgba(110,231,183,0.18)] border border-[var(--accent-2)] text-xs">
                      🎉 Rozet kazandın: “Minik Bilgin”
                    </div>
                  )}
                  {interactionData.questions.map((q, idx) => {
                    const userAnswer = userQuizAnswers[idx];
                    const isAnswered = userAnswer !== undefined;
                    return (
                      <div key={idx} className="p-4 rounded-2xl border bg-[var(--panel-2)] border-[var(--border)]">
                        <div className="font-bold text-sm mb-3 flex gap-2">
                          <span className="text-[var(--accent-3)]">{idx+1}.</span>
                          <SimpleMarkdownRenderer content={q.question}/>
                        </div>
                        <div className="space-y-2">
                          {q.options.map((opt, optIdx) => {
                            let btnClass = "";
                            let icon = null;
                            if (isAnswered) {
                              if (optIdx === q.correctIndex) { btnClass = "bg-[rgba(110,231,183,0.18)] border-[var(--accent-2)] text-[var(--accent-2)]"; icon = <CheckCircle size={16}/>; }
                              else if (userAnswer === optIdx) { btnClass = "bg-[rgba(248,113,113,0.18)] border-[var(--danger)] text-[var(--danger)]"; icon = <XCircle size={16}/>; }
                              else { btnClass = "opacity-40 border-transparent bg-[var(--panel)] cursor-not-allowed"; }
                            } else {
                              btnClass = "hover:bg-[var(--panel)] hover:border-[var(--accent-3)] border-transparent bg-[var(--panel)]";
                            }
                            return (
                              <button key={optIdx} onClick={() => !isAnswered && setUserQuizAnswers(prev => ({...prev, [idx]: optIdx}))} disabled={isAnswered} className={`w-full text-left p-3 rounded-xl text-xs border transition-all flex items-center justify-between gap-3 ${btnClass}`}>
                                <div className="flex-1"><SimpleMarkdownRenderer content={opt}/></div>
                                {icon}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {interactionType === 'QUIZ_YKS' && interactionData.questions && (
                <div className="space-y-6">
                  {interactionData.questions.map((q, idx) => {
                    const userAnswer = userQuizAnswers[idx];
                    const isAnswered = userAnswer !== undefined;
                    return (
                      <div key={idx} className="p-4 rounded-2xl border bg-[var(--panel-2)] border-[var(--border)]">
                        <div className="font-bold text-sm mb-3 flex gap-2">
                          <span className="text-[var(--accent-3)]">{idx+1}.</span>
                          <SimpleMarkdownRenderer content={q.question}/>
                        </div>
                        <div className="space-y-2">
                          {q.options.map((opt, optIdx) => {
                            let btnClass = "";
                            let icon = null;
                            if (isAnswered) {
                              if (optIdx === q.correctIndex) { btnClass = "bg-[rgba(110,231,183,0.18)] border-[var(--accent-2)] text-[var(--accent-2)]"; icon = <CheckCircle size={16}/>; }
                              else if (userAnswer === optIdx) { btnClass = "bg-[rgba(248,113,113,0.18)] border-[var(--danger)] text-[var(--danger)]"; icon = <XCircle size={16}/>; }
                              else { btnClass = "opacity-40 border-transparent bg-[var(--panel)] cursor-not-allowed"; }
                            } else {
                              btnClass = "hover:bg-[var(--panel)] hover:border-[var(--accent-3)] border-transparent bg-[var(--panel)]";
                            }
                            return (
                              <button key={optIdx} onClick={() => !isAnswered && setUserQuizAnswers(prev => ({...prev, [idx]: optIdx}))} disabled={isAnswered} className={`w-full text-left p-3 rounded-xl text-xs border transition-all flex items-center justify-between gap-3 ${btnClass}`}>
                                <div className="flex-1"><SimpleMarkdownRenderer content={opt}/></div>
                                {icon}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  {interactionData.questions.every((_, idx) => userQuizAnswers[idx] !== undefined) && (
                    <div className="p-4 rounded-2xl border bg-[var(--panel-2)] border-[var(--border)]">
                      <div className="text-[10px] tracking-[0.3em] font-bold text-[var(--accent)] mb-2">YANLIŞ ANALİZİ</div>
                      <div className="text-xs text-[var(--muted)] mb-2">
                        Yanlış cevaplanan sorular ve öne çıkan kelimeler:
                      </div>
                      <div className="space-y-2">
                        {interactionData.questions.map((q, idx) => {
                          if (userQuizAnswers[idx] === q.correctIndex) return null;
                          const keys = getWeakKeywords(q.question || '');
                          return (
                            <div key={`wrong-${idx}`} className="p-3 rounded-xl bg-[var(--panel)] border border-[var(--border)] text-xs">
                              <div className="font-semibold mb-1">Soru {idx + 1}</div>
                              <div className="text-[var(--muted)]">{(q.question || '').slice(0, 120)}...</div>
                              {keys.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {keys.map(k => (
                                    <span key={k} className="px-2 py-0.5 rounded-full text-[10px] bg-[var(--panel-2)] border border-[var(--border)] text-[var(--muted)]">{k}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {interactionType === 'MEMORIZE' && interactionData.items && (
                <div className="space-y-2">
                  <div className="text-[10px] tracking-[0.3em] font-bold text-[var(--accent)]">EZBER LİSTESİ</div>
                  {categoryId === 'highschool' && ankiQueue.length > 0 ? (
                    <div className="p-4 rounded-2xl bg-[var(--panel-2)] border border-[var(--border)]">
                      <div className="text-xs text-[var(--muted)] mb-2">Kart {ankiIndex + 1} / {ankiQueue.length}</div>
                      <div className="text-sm font-semibold mb-4">{ankiQueue[ankiIndex]}</div>
                      <div className="flex gap-2">
                        <button onClick={() => {
                          setAnkiKnown(prev => [...prev, ankiQueue[ankiIndex]]);
                          setAnkiIndex(i => Math.min(ankiQueue.length - 1, i + 1));
                        }} className="px-3 py-2 rounded-lg bg-[var(--accent-2)] text-[#0b0f14] text-xs font-semibold">Biliyorum</button>
                        <button onClick={() => {
                          setAnkiUnknown(prev => [...prev, ankiQueue[ankiIndex]]);
                          setAnkiIndex(i => Math.min(ankiQueue.length - 1, i + 1));
                        }} className="px-3 py-2 rounded-lg bg-[var(--danger)] text-white text-xs font-semibold">Bilmiyorum</button>
                      </div>
                      {ankiIndex === ankiQueue.length - 1 && (ankiKnown.length + ankiUnknown.length + 1 === ankiQueue.length) && (
                        <div className="mt-4 text-xs text-[var(--muted)]">Tur bitti. Bilmiyorum seçtiklerin tekrar gösterilecek.</div>
                      )}
                    </div>
                  ) : (
                    interactionData.items.map((it, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-sm">{it}</div>
                    ))
                  )}
                </div>
              )}
              {interactionType === 'STUDY_PLAN' && interactionData.plan && (
                <div className="space-y-2">
                  <div className="text-[10px] tracking-[0.3em] font-bold text-[var(--accent)]">ÇALIŞMA PLANI</div>
                  <div className="p-3 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] flex items-center justify-between">
                    <div className="text-sm font-semibold">Pomodoro: {formatTime(pomodoro.seconds)}</div>
                    <div className="flex gap-2">
                      <button onClick={() => setPomodoro(prev => ({ ...prev, running: !prev.running }))} className="px-3 py-1 rounded-lg bg-[var(--panel)] border border-[var(--border)] text-xs">
                        {pomodoro.running ? 'Durdur' : 'Başlat'}
                      </button>
                      <button onClick={() => setPomodoro({ seconds: 1500, running: false })} className="px-3 py-1 rounded-lg bg-[var(--panel)] border border-[var(--border)] text-xs">
                        Sıfırla
                      </button>
                    </div>
                  </div>
                  {interactionData.plan.map((p, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-sm">{p}</div>
                  ))}
                </div>
              )}
              {interactionType === 'TRUE_FALSE' && interactionData.items && (
                <div className="space-y-2">
                  <div className="text-[10px] tracking-[0.3em] font-bold text-[var(--accent)]">DOĞRU / YANLIŞ</div>
                  {interactionData.items.map((it, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-sm">
                      {it.statement}
                    </div>
                  ))}
                </div>
              )}
              {interactionType === 'ESSAY_OUTLINE' && interactionData.sections && (
                <div className="space-y-2">
                  <div className="text-[10px] tracking-[0.3em] font-bold text-[var(--accent)]">MAKALE TASLAĞI</div>
                  <div className="text-sm font-semibold">{interactionData.title}</div>
                  {interactionData.sections.map((s, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-sm">{s}</div>
                  ))}
                  {interactionData.references && (
                    <div className="mt-2 p-3 rounded-xl bg-[var(--panel-2)] border border-[var(--border)]">
                      <div className="text-xs text-[var(--muted)] mb-2">Kaynakça (APA)</div>
                      {interactionData.references.map((r, idx) => (
                        <div key={idx} className="text-xs">{r}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {interactionType === 'EXAM_SIM' && interactionData.questions && (
                <div className="space-y-3">
                  <div className="text-[10px] tracking-[0.3em] font-bold text-[var(--accent)]">VİZE / FİNAL</div>
                  {interactionData.questions.map((q, idx) => (
                    <div key={q.id || idx} className="p-4 rounded-2xl bg-[var(--panel-2)] border border-[var(--border)]">
                      <div className="text-xs text-[var(--muted)] mb-1">Soru {idx + 1}</div>
                      <SimpleMarkdownRenderer content={q.text} />
                    </div>
                  ))}
                </div>
              )}
              {interactionType === 'CONCEPT_MAP' && interactionData.links && (
                <div className="space-y-2">
                  <div className="text-[10px] tracking-[0.3em] font-bold text-[var(--accent)]">KAVRAM HARİTASI</div>
                  {interactionData.links.map((l, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-sm flex items-center justify-between gap-2">
                      <span>{l}</span>
                      <button onClick={() => window.open(`https://scholar.google.com/scholar?q=${encodeURIComponent(l)}`, '_blank')} className="text-[10px] text-[var(--accent-3)]">Deep Dive</button>
                    </div>
                  ))}
                </div>
              )}
              {interactionType === 'CRITIQUE' && interactionData && (
                <div className="space-y-4">
                  <div className="text-[10px] tracking-[0.3em] font-bold text-[var(--accent)]">KRİTİK ANALİZ</div>
                  <div className="p-4 rounded-2xl bg-[var(--panel-2)] border border-[var(--border)]">
                    <div className="text-xs text-[var(--muted)] mb-2">Güçlü Yönler</div>
                    {interactionData.strengths?.map((s, idx) => (
                      <div key={idx} className="text-sm mb-1">{s}</div>
                    ))}
                  </div>
                  <div className="p-4 rounded-2xl bg-[var(--panel-2)] border border-[var(--border)]">
                    <div className="text-xs text-[var(--muted)] mb-2">Zayıf Yönler</div>
                    {interactionData.weaknesses?.map((s, idx) => (
                      <div key={idx} className="text-sm mb-1">{s}</div>
                    ))}
                  </div>
                </div>
              )}
              {interactionType === 'DEFENSE' && interactionData.qa && (
                <div className="space-y-3">
                  <div className="text-[10px] tracking-[0.3em] font-bold text-[var(--accent)]">SAVUNMA KALKANI</div>
                  {interactionData.qa.map((qa, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-[var(--panel-2)] border border-[var(--border)]">
                      <div className="text-xs text-[var(--muted)] mb-1">Soru</div>
                      <div className="text-sm mb-2">{qa.q}</div>
                      <div className="text-xs text-[var(--muted)] mb-1">Cevap</div>
                      <div className="text-sm">{qa.a}</div>
                    </div>
                  ))}
                </div>
              )}
              {interactionType === 'ROLEPLAY' && interactionData?.mode === 'roleplay' && (
                <div className="space-y-3">
                  <div className="text-[10px] tracking-[0.3em] font-bold text-[var(--accent)]">SESİMÜLASYON</div>
                  <textarea value={roleplayInput} onChange={(e) => setRoleplayInput(e.target.value)} placeholder="Sunumun/cevabın..." className="w-full p-3 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-sm" rows={4} />
                  <div className="flex gap-2">
                    <button onClick={handleRoleplaySubmit} className="px-3 py-2 rounded-xl bg-[var(--accent)] text-[#1b1b1b] text-xs font-semibold">
                    {isRoleplayLoading ? 'Değerlendiriliyor...' : 'Simülasyonu Başlat'}
                    </button>
                    <button onClick={startSpeechRecognition} className="px-3 py-2 rounded-xl bg-[var(--panel)] border border-[var(--border)] text-xs">
                      {isListening ? 'Dinleniyor...' : 'Mikrofon'}
                    </button>
                    <button onClick={() => setRoleplayInput('')} className="px-3 py-2 rounded-xl bg-[var(--panel)] border border-[var(--border)] text-xs">
                      Temizle
                    </button>
                  </div>
                  {roleplayResponse && (
                    <div className="p-4 rounded-2xl bg-[var(--panel-2)] border border-[var(--border)] text-sm">
                      <SimpleMarkdownRenderer content={roleplayResponse} />
                    </div>
                  )}
                </div>
              )}
              {interactionType === 'STRESS_TEST' && stressQuestions.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] tracking-[0.3em] font-bold text-[var(--accent)]">
                      {categoryId === 'thesis' ? 'SAVUNMA SİMÜLASYONU' : 'STRES TESTİ'}
                    </div>
                    <div className="text-xs text-[var(--muted)]">Süre: {stressTimer}s</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <button onClick={() => setStressRunning(prev => !prev)} className="px-3 py-2 rounded-lg bg-[var(--panel)] border border-[var(--border)]">
                      {stressRunning ? 'Duraklat' : 'Başlat'}
                    </button>
                    <button onClick={() => { setStressTimer(stressDuration); setStressRunning(true); }} className="px-3 py-2 rounded-lg bg-[var(--panel)] border border-[var(--border)]">
                      Sıfırla
                    </button>
                    <label className="flex items-center gap-2">
                      <span className="text-[var(--muted)]">Oto Geç</span>
                      <input type="checkbox" checked={stressAutoNext} onChange={(e) => setStressAutoNext(e.target.checked)} />
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--muted)]">Süre</span>
                      <input
                        type="number"
                        min="10"
                        value={stressDuration}
                        onChange={(e) => { const v = Number(e.target.value); setStressDuration(v); setStressTimer(v); }}
                        className="w-16 px-2 py-1 rounded-lg bg-[var(--panel)] border border-[var(--border)] text-xs"
                      />
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-[var(--panel-2)] border border-[var(--border)] text-sm">
                    {stressQuestions[stressIndex]}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setStressTimer(stressDuration); setStressIndex(i => Math.max(0, i - 1)); }} className="px-3 py-2 rounded-lg bg-[var(--panel)] border border-[var(--border)] text-xs">Geri</button>
                    <button onClick={() => { setStressTimer(stressDuration); setStressIndex(i => Math.min(stressQuestions.length - 1, i + 1)); }} className="px-3 py-2 rounded-lg bg-[var(--panel)] border border-[var(--border)] text-xs">Sonraki</button>
                  </div>
                </div>
              )}
              {interactionType === 'ALT_SCENARIOS' && interactionData.scenarios && (
                <div className="space-y-3">
                  <div className="text-[10px] tracking-[0.3em] font-bold text-[var(--accent)]">ALTERNATİF SENARYOLAR</div>
                  {interactionData.scenarios.map((sc, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-[var(--panel-2)] border border-[var(--border)]">
                      <div className="text-sm font-semibold mb-2">{sc.title}</div>
                      <div className="text-xs text-[var(--muted)]">Artılar</div>
                      {sc.pros?.map((p, i) => <div key={i} className="text-sm">{p}</div>)}
                      <div className="text-xs text-[var(--muted)] mt-2">Eksiler</div>
                      {sc.cons?.map((c, i) => <div key={i} className="text-sm">{c}</div>)}
                    </div>
                  ))}
                </div>
              )}
              {interactionType === 'HARSH_Q' && interactionData.questions && (
                <div className="space-y-2">
                  <div className="text-[10px] tracking-[0.3em] font-bold text-[var(--accent)]">SERT HOCA MODU</div>
                  {interactionData.questions.map((q, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-sm">{q}</div>
                  ))}
                </div>
              )}
              {interactionType === 'METHODOLOGY' && interactionData.issues && (
                <div className="space-y-2">
                  <div className="text-[10px] tracking-[0.3em] font-bold text-[var(--accent)]">METODOLOJİ KONTROLÜ</div>
                  {interactionData.issues.map((q, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-sm">{q}</div>
                  ))}
                </div>
              )}
              {interactionType === 'MINUTES' && interactionData.minutes && (
                <div className="space-y-2">
                  <div className="text-[10px] tracking-[0.3em] font-bold text-[var(--accent)]">TOPLANTI TUTANAĞI</div>
                  <div className="flex gap-2">
                    <button onClick={() => printToPdf(interactionData.minutes.join('\n'))} className="px-3 py-2 rounded-lg bg-[var(--panel)] border border-[var(--border)] text-xs">PDF İndir</button>
                    <button onClick={() => downloadText('tutanak.txt', interactionData.minutes.join('\n'))} className="px-3 py-2 rounded-lg bg-[var(--panel)] border border-[var(--border)] text-xs">TXT İndir</button>
                  </div>
                  {interactionData.minutes.map((m, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-sm">{m}</div>
                  ))}
                </div>
              )}
              {interactionType === 'ACTIONS' && interactionData.actions && (
                <div className="space-y-2">
                  <div className="text-[10px] tracking-[0.3em] font-bold text-[var(--accent)]">AKSİYON LİSTESİ</div>
                  <div className="flex gap-2">
                    <button onClick={() => downloadTextFile('aksiyonlar.txt', interactionData.actions.map(a => `${a.task} (${a.owner})`).join('\n'))} className="px-3 py-2 rounded-lg bg-[var(--panel)] border border-[var(--border)] text-xs">TXT İndir</button>
                    <button onClick={() => downloadTextFile('aksiyonlar.csv', `task,owner\n${interactionData.actions.map(a => `"${a.task}","${a.owner}"`).join('\n')}`, 'text/csv')} className="px-3 py-2 rounded-lg bg-[var(--panel)] border border-[var(--border)] text-xs">CSV İndir</button>
                    <button onClick={() => exportActionsToIcs(interactionData.actions)} className="px-3 py-2 rounded-lg bg-[var(--panel)] border border-[var(--border)] text-xs">Takvime Aktar</button>
                    <button onClick={() => copyToClipboard(interactionData.actions.map(a => `${a.task} (${a.owner})`).join('\n'))} className="px-3 py-2 rounded-lg bg-[var(--panel)] border border-[var(--border)] text-xs">Kopyala</button>
                  </div>
                  {interactionData.actions.map((a, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-[var(--panel-2)] border border-[var(--border)] text-sm">
                      {a.task} <span className="text-[var(--muted)]">({a.owner})</span> {a.due && <span className="text-[var(--muted)]">• {a.due}</span>}
                    </div>
                  ))}
                </div>
              )}
              {interactionType === 'SWOT' && interactionData && (
                <div className="space-y-3">
                  <div className="text-[10px] tracking-[0.3em] font-bold text-[var(--accent)]">SWOT</div>
                  {['strengths','weaknesses','opportunities','threats'].map((k) => (
                    <div key={k} className="p-4 rounded-2xl bg-[var(--panel-2)] border border-[var(--border)]">
                      <div className="text-xs text-[var(--muted)] mb-2">{k.toUpperCase()}</div>
                      {interactionData[k]?.map((t, idx) => (
                        <div key={idx} className="text-sm">{t}</div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
              {interactionType === 'CONNECTOR' && interactionData && (
                <div className="space-y-4">
                  <div className="text-[10px] tracking-[0.3em] font-bold text-[var(--accent)]">İLİŞKİ KURUCU</div>
                  <div className="p-4 rounded-2xl border bg-[var(--panel-2)] border-[var(--border)]">
                    <div className="text-xs text-[var(--muted)] mb-2">Kavramlar</div>
                    <div className="text-sm font-semibold mb-3">{interactionData.conceptA} ↔ {interactionData.conceptB}</div>
                    <div className="text-xs text-[var(--muted)] mb-1">Soru</div>
                    <div className="text-sm mb-3"><SimpleMarkdownRenderer content={interactionData.question} /></div>
                    <div className="text-xs text-[var(--muted)] mb-1">Bağlantı</div>
                    <div className="text-sm"><SimpleMarkdownRenderer content={interactionData.explanation} /></div>
                  </div>
                </div>
              )}
              {interactionType === 'VERSUS' && (
                <div className="p-4 rounded-2xl bg-[var(--panel-2)] border border-[var(--border)]">
                  <div className="text-[10px] tracking-[0.3em] font-bold text-[var(--accent)] mb-3">KARŞILAŞTIRMA</div>
                  <SimpleMarkdownRenderer content={interactionData} />
                </div>
              )}
              {/* --- QUIZ (GÜNCELLENDİ: Koyu Mod Düzeltmesi) --- */}
              {interactionType === 'QUIZ' && interactionData.questions && (
                  <div className="space-y-6">
                  {interactionData.questions.map((q, idx) => {
                      const userAnswer = userQuizAnswers[idx];
                      const isAnswered = userAnswer !== undefined;
                      
                      return (
                        <div key={idx} className="p-4 rounded-2xl border bg-[var(--panel-2)] border-[var(--border)]">
                            <div className="font-bold text-sm mb-3 flex gap-2">
                                <span className="text-[var(--accent-3)]">{idx+1}.</span> 
                                <SimpleMarkdownRenderer content={q.question}/>
                            </div>
                            
                            <div className="space-y-2">
                                {q.options.map((opt, optIdx) => {
                                    let btnClass = "";
                                    let icon = null;

                                    if (isAnswered) {
                                        if (optIdx === q.correctIndex) {
                                            // DOĞRU ŞIK: Yeşil arka plan
                                            btnClass = "bg-[rgba(110,231,183,0.18)] border-[var(--accent-2)] text-[var(--accent-2)]";
                                            icon = <CheckCircle size={16} className="flex-shrink-0"/>;
                                        } else if (userAnswer === optIdx) {
                                            // SEÇİLEN YANLIŞ ŞIK: Kırmızı arka plan
                                            btnClass = "bg-[rgba(248,113,113,0.18)] border-[var(--danger)] text-[var(--danger)]";
                                            icon = <XCircle size={16} className="flex-shrink-0"/>;
                                        } else {
                                            // DİĞER ŞIKLAR (DÜZELTME BURADA):
                                            // Arka plan rengini koru, sadece opaklığı düşür ve tıklamayı engelle.
                                            btnClass = "opacity-40 border-transparent bg-[var(--panel)] cursor-not-allowed";
                                        }
                                    } else {
                                        // Henüz cevaplanmadıysa
                                        btnClass = "hover:bg-[var(--panel)] hover:border-[var(--accent-3)] border-transparent bg-[var(--panel)]";
                                    }

                                    return (
                                        <button 
                                            key={optIdx} 
                                            onClick={() => !isAnswered && setUserQuizAnswers(prev => ({...prev, [idx]: optIdx}))} 
                                            disabled={isAnswered}
                                        className={`w-full text-left p-3 rounded-xl text-xs border transition-all flex items-center justify-between gap-3 ${btnClass}`}
                                    >
                                            <div className="flex-1"><SimpleMarkdownRenderer content={opt}/></div>
                                            {icon}
                                        </button>
                                    );
                                })}
                            </div>
                            
                            {isAnswered && q.explanation && (
                                <div className="mt-3 text-[11px] p-3 rounded-xl border flex gap-2 bg-[var(--panel)] border-[var(--border)] text-[var(--muted)]">
                                    <Info size={14} className="flex-shrink-0 mt-0.5 text-[var(--accent-3)]"/>
                                    <div><span className="font-bold">Açıklama:</span> {q.explanation}</div>
                                </div>
                            )}
                        </div>
                      );
                  })}
                  </div>
              )}
               {interactionType === 'OPEN' && interactionData.questions && (
                <div className="space-y-6">
                {interactionData.questions.map((q) => {
                const evalResult = evaluations[q.id];
                const isEvaluating = evaluatingIds.has(q.id);
                return (
                <div key={q.id} className="p-4 rounded-2xl border bg-[var(--panel-2)] border-[var(--border)]">
                <div className="text-sm font-medium mb-2"><SimpleMarkdownRenderer content={q.text} /></div>
                <textarea value={openAnswers[q.id] || ''} onChange={(e) => setOpenAnswers(prev => ({ ...prev, [q.id]: e.target.value }))} disabled={!!evalResult || isEvaluating} placeholder="Cevabınız..." className="w-full p-3 text-sm rounded-xl border resize-none h-24 focus:ring-2 focus:ring-[var(--accent-3)] focus:outline-none mb-3 bg-[var(--panel)] border-[var(--border)] text-[var(--text)]" />
                {!evalResult ? <button onClick={() => handleEvaluateAnswer(q.id, q.text, openAnswers[q.id])} className="mt-2 text-xs bg-[var(--accent)] text-[#1b1b1b] p-2.5 rounded-xl hover:brightness-110">Kontrol Et</button> : 
                <div className={`mt-2 p-2 text-xs rounded-xl border ${evalResult.isCorrect ? 'bg-[rgba(110,231,183,0.18)] border-[var(--accent-2)] text-[var(--accent-2)]' : 'bg-[rgba(248,113,113,0.18)] border-[var(--danger)] text-[var(--danger)]'}`}>{evalResult.feedback}</div>}
                </div>
                );
                })}
                </div>
               )}
               
               {/* Flashcards */}
                {interactionType === 'FLASHCARDS' && interactionData.cards && (
                <div className="flex flex-col items-center">
                <div className="w-full mb-4 flex justify-between text-xs font-bold text-[var(--muted)]"><span>KART {currentCardIndex + 1} / {interactionData.cards.length}</span><span className="flex items-center gap-1"><RotateCw size={12}/> Tıkla ve Çevir</span></div>
                <div onClick={() => setIsCardFlipped(!isCardFlipped)} className="w-full h-64 perspective-1000 cursor-pointer group">
                <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isCardFlipped ? 'rotate-y-180' : ''}`} style={{ transformStyle: 'preserve-3d', transform: isCardFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
                <div className="absolute inset-0 w-full h-full backface-hidden rounded-2xl border shadow-sm flex flex-col items-center justify-center p-6 text-center bg-[var(--panel-2)] border-[var(--border)]" style={{ backfaceVisibility: 'hidden' }}>
                <h4 className="text-[var(--accent-3)] font-bold mb-4 uppercase tracking-widest text-xs">Kavram / Soru</h4>
                <SimpleMarkdownRenderer content={interactionData.cards[currentCardIndex].front} />
                </div>
                <div className="absolute inset-0 w-full h-full backface-hidden rounded-2xl border shadow-sm flex flex-col items-center justify-center p-6 text-center bg-[var(--accent-3)] border-[var(--accent-3)] text-[#0b0f14]" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                <h4 className="text-[#0b0f14]/70 font-bold mb-4 uppercase tracking-widest text-xs">Açıklama / Cevap</h4>
                <SimpleMarkdownRenderer content={interactionData.cards[currentCardIndex].back} />
                </div>
                </div>
                </div>
                <div className="flex gap-4 mt-6">
                <button onClick={() => { setCurrentCardIndex(Math.max(0, currentCardIndex - 1)); setIsCardFlipped(false); }} disabled={currentCardIndex === 0} className="p-3 rounded-full bg-[var(--panel-2)] border border-[var(--border)] hover:border-[var(--accent-3)] hover:text-[var(--accent-3)] disabled:opacity-30 transition-colors"><ChevronLeft size={20} /></button>
                <button onClick={() => { setCurrentCardIndex(Math.min(interactionData.cards.length - 1, currentCardIndex + 1)); setIsCardFlipped(false); }} disabled={currentCardIndex === interactionData.cards.length - 1} className="p-3 rounded-full bg-[var(--panel-2)] border border-[var(--border)] hover:border-[var(--accent-3)] hover:text-[var(--accent-3)] disabled:opacity-30 transition-colors"><ChevronRight size={20} /></button>
                </div>
                </div>
                )}

               {interactionType === 'SOCRATIC' && interactionData.questions && (
                <div className="space-y-4">
                  <div className="text-[10px] tracking-[0.3em] font-bold text-[var(--accent)]">SOKRATİK HOCA</div>
                  {interactionData.questions.map((q, idx) => (
                    <div key={q.id || idx} className="p-4 rounded-2xl border bg-[var(--panel-2)] border-[var(--border)]">
                      <div className="text-xs text-[var(--muted)] mb-2">Soru {idx + 1}</div>
                      <div className="text-sm font-medium"><SimpleMarkdownRenderer content={q.text} /></div>
                    </div>
                  ))}
                </div>
               )}

                {/* Glossary */}
                {interactionType === 'GLOSSARY' && interactionData.terms && (
                <div className="space-y-3">
                <div className="text-xs uppercase font-bold text-[var(--muted)] mb-2">Önemli Kavramlar</div>
                {interactionData.terms.map((item, idx) => (
                <div key={idx} className="p-4 rounded-2xl border flex flex-col gap-1 bg-[var(--panel-2)] border-[var(--border)]">
                <SimpleMarkdownRenderer content={item.term} />
                <div className="text-xs leading-relaxed text-[var(--muted)]"><SimpleMarkdownRenderer content={item.definition} /></div>
                </div>
                ))}
                </div>
                )}
                
                {/* Exam */}
                {interactionType === 'EXAM' && interactionData.questions && (
                <div className="space-y-8 pb-10">
                <div className="flex items-center justify-between border-b pb-4 border-[var(--border)]">
                <div><h3 className="text-sm font-bold uppercase tracking-wider text-[var(--accent)]">{interactionData.examTitle}</h3><p className="text-xs text-[var(--muted)] mt-1">Sınav: 5 Test (50p) + 2 Klasik (50p) = 100 Puan</p></div>
                {!examResult && <div className="bg-[rgba(122,162,255,0.18)] text-[var(--accent-3)] px-3 py-1 rounded text-xs font-bold flex items-center gap-1"><Clock size={12} /> Sınav Modu</div>}
                </div>
                {isGradingExam && (<div className="absolute inset-0 bg-[rgba(11,15,20,0.8)] z-20 flex flex-col items-center justify-center backdrop-blur-sm"><div className="w-12 h-12 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin mb-4"></div><p className="font-bold animate-pulse">Sınav kağıdın okunuyor...</p></div>)}
                {examResult && (
                <div className="bg-[linear-gradient(135deg,#F5B84B_0%,#7AA2FF_100%)] rounded-2xl p-6 text-[#0b0f14] shadow-lg animate-in zoom-in duration-300">
                <div className="flex justify-between items-start mb-4">
                <div><p className="text-[#0b0f14]/70 text-xs font-bold uppercase">Sınav Sonucu</p><h2 className="text-3xl font-bold mt-1">{examResult.totalScore}<span className="text-lg opacity-70">/100</span></h2></div>
                <div className="bg-white/30 backdrop-blur px-3 py-1 rounded-lg text-2xl font-bold">{examResult.letterGrade}</div>
                </div>
                <p className="text-sm opacity-90 leading-relaxed mb-4 border-t border-white/30 pt-4">{examResult.generalFeedback}</p>
                <button onClick={() => { setExamResult(null); setExamAnswers({}); }} className="w-full bg-white text-[#0b0f14] py-2 rounded-lg text-xs font-bold hover:bg-white/90 transition-colors">Yeni Sınav Başlat</button>
                </div>
                )}
                {!examResult && (
                <>
                <div className="space-y-6">
                {interactionData.questions.map((q, idx) => (
                <div key={q.id} className="p-5 rounded-2xl border relative bg-[var(--panel-2)] border-[var(--border)]">
                <span className="absolute top-4 right-4 text-[10px] font-bold text-[var(--muted)] border border-[var(--border)] px-2 py-0.5 rounded-full">{q.points} Puan</span>
                <div className="text-sm font-bold mb-4 pr-12 flex gap-2"><span className="text-[var(--accent-3)] whitespace-nowrap">Soru {idx + 1}.</span><SimpleMarkdownRenderer content={q.text} /></div>
                {q.type === 'mc' ? (
                <div className="space-y-2">
                {q.options.map((opt, optIdx) => (
                <label key={optIdx} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${examAnswers[q.id] === optIdx ? 'bg-[rgba(122,162,255,0.16)] border-[var(--accent-3)] text-[var(--accent-3)]' : 'bg-[var(--panel)] border-transparent hover:border-[var(--accent-3)]'}`}>
                <input type="radio" name={`q-${q.id}`} checked={examAnswers[q.id] === optIdx} onChange={() => setExamAnswers(prev => ({ ...prev, [q.id]: optIdx }))} className="hidden" />
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${examAnswers[q.id] === optIdx ? 'border-[var(--accent-3)]' : 'border-[var(--border)]'}`}>{examAnswers[q.id] === optIdx && <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent-3)]" />}</div>
                <div className="text-xs font-medium"><SimpleMarkdownRenderer content={opt} /></div>
                </label>
                ))}
                </div>
                ) : (
                <textarea value={examAnswers[q.id] || ''} onChange={(e) => setExamAnswers(prev => ({ ...prev, [q.id]: e.target.value }))} placeholder="Cevabınızı detaylı bir şekilde yazın..." className="w-full p-3 text-sm rounded-xl border resize-none h-32 focus:ring-2 focus:ring-[var(--accent-3)] focus:outline-none bg-[var(--panel)] border-[var(--border)] text-[var(--text)]" />
                )}
                </div>
                ))}
                </div>
                <div className="sticky bottom-0 bg-[var(--panel)] backdrop-blur p-4 border-t border-[var(--border)] -mx-5 -mb-5 mt-4 flex justify-end">
                <button onClick={handleSubmitExam} className="bg-[var(--accent)] text-[#1b1b1b] px-6 py-3 rounded-2xl font-bold text-sm hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"><CheckCircle size={18} />Sınavı Bitir ve Puanla</button>
                </div>
                </>
                )}
                </div>
                )}
            </div>
          )}
        </div>
        )}
        </aside>
      )}
    </div>
  );
}
