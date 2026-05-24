import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import bannerImg from './assets/banner.png';
import logoImg from './assets/logo.png';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const COUNTDOWN_MS = 55 * 24 * 60 * 60 * 1000;

function getTimeLeft(launchDate) {
  const diff = launchDate.getTime() - Date.now();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function useCountdown() {
  const [launchDate] = useState(() => new Date(Date.now() + COUNTDOWN_MS));
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(launchDate));

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getTimeLeft(launchDate)), 1000);
    return () => clearInterval(timer);
  }, [launchDate]);

  return timeLeft;
}

// 3D Canvas component rendering dynamic luxury golden particles
function GoldParticleScene() {
  const pointsRef = useRef();
  const count = 350;

  // Generate random stable coordinates and custom individual speeds for particles
  const [positions, speeds] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 4.5;      // x
      pos[i * 3 + 1] = (Math.random() - 0.5) * 4.5;  // y
      pos[i * 3 + 2] = (Math.random() - 0.5) * 2.5;  // z
      spd[i] = 0.15 + Math.random() * 0.7;           // float speed
    }
    return [pos, spd];
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (!pointsRef.current) return;

    const positionAttr = pointsRef.current.geometry?.attributes?.position;
    if (!positionAttr) return;

    // Rotate the particle system slowly over time
    pointsRef.current.rotation.y = t * 0.04;
    pointsRef.current.rotation.x = Math.sin(t * 0.02) * 0.08;

    const array = positionAttr.array;
    for (let i = 0; i < count; i++) {
      const idx = i * 3 + 1; // Y axis index
      // Subtle float wave physics
      array[idx] += Math.sin(t * speeds[i] + i) * 0.0012;

      // Mouse interactive sway
      const px = i * 3;     // X axis index
      const pz = i * 3 + 2; // Z axis index
      array[px] += (state.pointer.x * 0.4 - array[px]) * 0.006;
      array[pz] += (state.pointer.y * 0.2 - array[pz]) * 0.006;
    }
    positionAttr.needsUpdate = true;
  });

  return (
    <group position={[0, 0, 0]}>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="position"
            count={positions.length / 3}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#D4AF37"
          size={0.06}
          sizeAttenuation={true}
          transparent={true}
          opacity={0.7}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}

// Crisp, futuristic BATTLEONE SVG Vector Logo
function BattleOneLogo({ className = "h-8" }) {
  return (
    <svg
      viewBox="0 0 480 90"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Sleek, premium angular geometric shield monogram on the left */}
      <g>
        {/* Outer shield structure */}
        <path
          d="M15 10 L50 28 L50 62 L15 80 L15 62 L38 52 L38 35 L15 25 Z"
          fill="#1A1A1A"
        />
        {/* Inner champagne-gold core block indicating '1' */}
        <path
          d="M44 15 L44 48 L32 54 L24 49 L32 44 L32 32 Z"
          fill="#D4AF37"
        />
        {/* Shadow boundary plate */}
        <path
          d="M15 10 L15 25 L32 32 L32 44 L24 49 L15 46 L15 32 L5 37 L5 60 L15 64 L15 80 L2 72 L2 18 Z"
          fill="#1A1A1A"
          opacity="0.8"
        />
      </g>
      
      {/* Modern, futuristic typography for BATTLEONE wordmark */}
      <text
        x="72"
        y="60"
        fill="#1A1A1A"
        fontFamily="Space Grotesk, sans-serif"
        fontWeight="800"
        fontSize="48"
        letterSpacing="0.22em"
      >
        BATTLEONE
      </text>
    </svg>
  );
}

// Social icon component styled for the light luxury theme
function SocialIcon({ children, href = "#" }) {
  return (
    <a
      href={href}
      aria-label="Social Link"
      className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white/40 text-black/80 backdrop-blur-md transition-all duration-300 hover:scale-105 hover:border-[#D4AF37]/50 hover:bg-white hover:text-[#D4AF37] hover:shadow-sm"
    >
      {children}
    </a>
  );
}

export default function App() {
  const countdown = useCountdown();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState(
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );

  // Subscriber Database and Admin Modal States
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [subscribers, setSubscribers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [fallbackNotice, setFallbackNotice] = useState('');

  // Supabase Auth and Loader States
  const [adminUser, setAdminUser] = useState(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const subscribeRef = useRef(null);
  const isAdminRoute = currentPath === '/admin';

  const getLocalSubscribers = () => {
    try {
      const data = localStorage.getItem('battleone_subscribers');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  };

  const saveLocalSubscriber = (cleanedEmail) => {
    const list = getLocalSubscribers();
    const exists = list.some(s => s.email.toLowerCase() === cleanedEmail.toLowerCase());

    if (exists) {
      setSubscribers(list);
      return { success: true, isDuplicate: true, fallback: true };
    }

    const newEntry = { email: cleanedEmail, timestamp: new Date().toISOString() };
    const updated = [newEntry, ...list];
    localStorage.setItem('battleone_subscribers', JSON.stringify(updated));
    setSubscribers(updated);
    return { success: true, isDuplicate: false, fallback: true };
  };

  const filteredSubscribers = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return subscribers.filter((sub) => sub.email.toLowerCase().includes(term));
  }, [searchTerm, subscribers]);

  // Fetch subscriber records from Supabase or Local Storage fallback
  const fetchSubscribers = async () => {
    if (!isSupabaseConfigured) {
      setSubscribers(getLocalSubscribers());
      setFallbackNotice('');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('subscribers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formatted = data.map(row => ({
        email: row.email,
        timestamp: row.created_at
      }));
      setSubscribers(formatted);
      setFallbackNotice('');
    } catch (err) {
      console.error('Error fetching subscribers:', err.message);
      setSubscribers(getLocalSubscribers());
      setFallbackNotice('Supabase access is unavailable, so the admin is showing locally saved emails.');
      setLoginError('Failed to fetch subscriber list from database.');
    }
  };

  const navigate = (path) => {
    if (typeof window === 'undefined') return;
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Sync user session and fetch emails if logged in
  useEffect(() => {
    if (!isAdminOpen) return;

    if (isAdminRoute) {
      setAdminUser(null);
      setLoginError('');
      return;
    }

    if (isSupabaseConfigured) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setAdminUser(session?.user ?? null);
        if (session?.user) {
          fetchSubscribers();
        }
      });
    } else {
      fetchSubscribers();
    }
  }, [isAdminOpen, isAdminRoute]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncPath = () => setCurrentPath(window.location.pathname);
    syncPath();

    window.addEventListener('popstate', syncPath);
    return () => window.removeEventListener('popstate', syncPath);
  }, []);

  useEffect(() => {
    if (isAdminRoute) {
      setIsAdminOpen(true);
      setAdminUser(null);
      setLoginEmail('');
      setLoginPassword('');
      setLoginError('');
      setFallbackNotice('');
    } else {
      setIsAdminOpen(false);
    }
  }, [isAdminRoute]);

  const scrollToSubscribe = () => {
    subscribeRef.current?.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => {
      const input = subscribeRef.current?.querySelector('input[type="email"]');
      if (input) input.focus();
    }, 600);
  };

  const addSubscriber = async (emailVal) => {
    const cleanedEmail = emailVal.trim();

    if (!isSupabaseConfigured) {
      return saveLocalSubscriber(cleanedEmail);
    }

    try {
      const { error } = await supabase
        .from('subscribers')
        .insert([{ email: cleanedEmail }]);

      if (error) {
        if (error.code === '23505') {
          saveLocalSubscriber(cleanedEmail);
          return { success: true, isDuplicate: true };
        }

        if (error.code === '42501' || error.message?.includes('row-level security')) {
          setFallbackNotice('Supabase insert is blocked by row-level security, so your email was saved locally for this session.');
          return saveLocalSubscriber(cleanedEmail);
        }

        throw error;
      }

      setFallbackNotice('');
      saveLocalSubscriber(cleanedEmail);

      if (isAdminOpen && adminUser) {
        fetchSubscribers();
      }
      return { success: true, isDuplicate: false };
    } catch (err) {
      console.error('Database write error:', err.message);
      setFallbackNotice('Supabase is unavailable right now, so your email was saved locally for this session.');
      return saveLocalSubscriber(cleanedEmail);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      setLoginError('Admin login is unavailable because Supabase is not configured. Add your credentials to .env to enable access.');
      return;
    }

    setLoginError('');
    setIsLoggingIn(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword
      });
      if (error) throw error;
      setAdminUser(data.user);
      setLoginEmail('');
      setLoginPassword('');
      fetchSubscribers();
    } catch (err) {
      setLoginError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAdminLogout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setAdminUser(null);
    setSubscribers([]);
  };

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyAllEmails = () => {
    if (subscribers.length === 0) return;
    const emails = subscribers.map(s => s.email).join(', ');
    navigator.clipboard.writeText(emails);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const downloadCSV = () => {
    if (subscribers.length === 0) return;
    const headers = 'Email,Signup Date\n';
    const rows = subscribers.map(s => `"${s.email}","${new Date(s.timestamp).toLocaleString()}"`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `battleone_subscribers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearDatabase = async () => {
    if (!window.confirm('Are you sure you want to delete ALL subscribers? This action is permanent and cannot be undone.')) {
      return;
    }
    
    if (!isSupabaseConfigured) {
      localStorage.removeItem('battleone_subscribers');
      setSubscribers([]);
      return;
    }
    
    try {
      const { error } = await supabase
        .from('subscribers')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
        
      if (error) throw error;
      setSubscribers([]);
    } catch (err) {
      alert('Error clearing database: ' + err.message);
    }
  };

  const loadMockSignups = () => {
    const mocks = [
      { email: 'aarav.sharma@example.in', timestamp: new Date(Date.now() - 3600000 * 2).toISOString() },
      { email: 'priya.patel@mumbaifashion.com', timestamp: new Date(Date.now() - 3600000 * 24).toISOString() },
      { email: 'kabir.singh@streetwear.co.in', timestamp: new Date(Date.now() - 3600000 * 48).toISOString() },
      { email: 'ananya.sen@vogue.in', timestamp: new Date(Date.now() - 3600000 * 72).toISOString() },
      { email: 'rahul.mehta@architectural.in', timestamp: new Date(Date.now() - 3600000 * 120).toISOString() },
    ];
    if (isSupabaseConfigured) {
      alert('Mock data can only be loaded in Local Mock mode. Fill your Supabase database table with live signups.');
      return;
    }
    localStorage.setItem('battleone_subscribers', JSON.stringify(mocks));
    setSubscribers(mocks);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) return;
    const res = await addSubscriber(email);
    if (res.success) {
      setIsDuplicate(res.isDuplicate);
      setIsSubmitted(true);
    } else {
      alert('Submission failed. Check your internet connection or database setup.');
    }
  };

  // Simulate loader reveal
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 1300);
    return () => clearTimeout(timer);
  }, []);

  // Monitor scroll height to inject glassmorphic navbar style
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 30) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Capture normalized cursor positions for 2.5D Parallax
  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth) - 0.5;
      const y = (e.clientY / window.innerHeight) - 0.5;
      setMousePos({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsMobileMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Typography word reveal config for "COMING SOON"
  const titleWords = ["COMING", "SOON"];
  const wordVariants = {
    initial: { opacity: 0, y: 35 },
    animate: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.15 + i * 0.2,
        duration: 1.1,
        ease: [0.16, 1, 0.3, 1],
      },
    }),
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#FAF9F6] text-[#1A1A1A]">
      {/* High-fashion static film-grain noise and sweep ambient lighting */}
      <div className="noise-overlay" />
      <div className="light-sweep" />

      {/* Decorative ambient gold radial light glow elements */}
      <div className="pointer-events-none absolute left-[-10rem] top-[-10rem] h-96 w-96 rounded-full bg-[#D4AF37]/5 blur-[120px]" />
      <div className="pointer-events-none absolute right-[-5rem] bottom-[-5rem] h-[30rem] w-[30rem] rounded-full bg-[#E6C787]/6 blur-[150px]" />

      {/* Page Loader */}
      <AnimatePresence>
        {!isLoaded && (
          <motion.div
            key="loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.7, ease: 'easeInOut' }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#FAF9F6]"
          >
            <div className="w-64 text-center">
              {/* Sleek logo image pulsing and glowing */}
              <motion.div
                animate={{ opacity: [0.6, 1, 0.6], scale: [0.97, 1.03, 0.97] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className="mb-8 flex justify-center"
              >
                <img src={logoImg} alt="BATTLEONE Logo" className="h-20 w-auto rounded-2xl object-contain mix-blend-darken shadow-sm" />
              </motion.div>
              <span className="font-sans text-[0.68rem] uppercase tracking-[0.45em] text-[#1A1A1A]/90 font-semibold">
                INITIATING CAMPAIGN
              </span>
              <div className="mt-4 h-[1px] w-full overflow-hidden rounded-full bg-black/5">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-black via-[#D4AF37] to-black"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1.1, ease: 'easeInOut' }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 flex min-h-screen flex-col justify-between">
        
        {/* Minimal Transparent & Glassmorphic Navbar */}
        <header
          className={`fixed inset-x-0 top-0 z-40 px-4 py-3 transition-all duration-300 sm:px-8 lg:px-12 ${
            isScrolled
              ? 'bg-white/40 border-b border-black/5 py-2.5 sm:py-3 shadow-[0_10px_30px_rgba(26,26,26,0.02)] backdrop-blur-md'
              : 'bg-transparent py-3 sm:py-4'
          }`}
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <motion.div 
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="flex items-center"
            >
              <img 
                src={logoImg} 
                alt="BATTLEONE Logo" 
                onClick={() => navigate('/')}
                className="h-10 sm:h-12 md:h-14 w-auto rounded-xl object-contain mix-blend-darken cursor-pointer select-none active:scale-95 transition-transform duration-100" 
                title="Go to homepage"
              />
            </motion.div>

            <nav className="hidden gap-8 font-sans text-xs uppercase tracking-[0.3em] text-black/90 font-medium md:flex">
              {['Home', 'Collection', 'Concept', 'Contact'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="relative py-1 transition-all duration-300 hover:text-black"
                >
                  {item}
                  <span className="absolute bottom-0 left-0 h-[1px] w-0 bg-[#D4AF37] transition-all duration-300 hover:w-full" />
                </a>
              ))}
            </nav>

            <motion.div
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="flex items-center gap-3"
            >
              <button 
                aria-label="Request Access Button"
                onClick={scrollToSubscribe}
                className="hidden rounded-full border border-black/10 bg-white/20 px-5 py-2 font-sans text-[0.65rem] uppercase tracking-[0.3em] transition-all duration-300 hover:border-black hover:bg-black hover:text-white md:block cursor-pointer"
              >
                Request Access
              </button>
              {/* Mobile hamburger menu button */}
              <button
                aria-label="Toggle Menu"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="flex md:hidden h-9 w-9 items-center justify-center rounded-full border border-black/10 hover:border-black transition duration-300 cursor-pointer"
              >
                <div className="flex flex-col items-center justify-center gap-1">
                  <span className={`block h-[2px] w-4 bg-black rounded-full transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-[3px]' : ''}`} />
                  <span className={`block h-[2px] w-4 bg-black rounded-full transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-[3px]' : ''}`} />
                </div>
              </button>
            </motion.div>
          </div>

          {/* Mobile Menu Dropdown */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.nav
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="md:hidden overflow-hidden mt-3 mx-auto max-w-7xl"
              >
                <div className="flex flex-col gap-1 rounded-2xl border border-black/5 bg-white/70 p-4 backdrop-blur-xl shadow-lg">
                  {['Home', 'Collection', 'Concept', 'Contact'].map((item) => (
                    <a
                      key={item}
                      href={`#${item.toLowerCase()}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="py-2.5 px-3 font-sans text-xs uppercase tracking-[0.3em] text-black/80 font-medium rounded-xl hover:bg-[#D4AF37]/10 hover:text-black transition-all duration-200"
                    >
                      {item}
                    </a>
                  ))}
                  <div className="mt-2 pt-2 border-t border-black/5">
                    <button 
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        scrollToSubscribe();
                      }}
                      className="w-full rounded-full bg-black px-5 py-2.5 font-sans text-[0.65rem] uppercase tracking-[0.3em] text-[#FAF9F6] transition-all duration-300 hover:bg-[#D4AF37] hover:text-black cursor-pointer"
                    >
                      Request Access
                    </button>
                  </div>
                </div>
              </motion.nav>
            )}
          </AnimatePresence>
        </header>

        {/* Main Content Layout */}
        <main className="mx-auto flex w-full max-w-7xl flex-1 items-center px-4 pb-8 pt-24 sm:px-8 sm:pb-10 sm:pt-28 lg:px-12 lg:pt-32">
          <div className="grid w-full gap-8 sm:gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            
            {/* Left Side: Brand Story, Countdown, and Form */}
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
              className="space-y-6 sm:space-y-8 order-2 lg:order-1"
            >
              {/* Premium Badge Tagline */}
              <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/35 bg-[#D4AF37]/5 px-3 py-1 sm:px-4 sm:py-1.5 font-sans text-[0.55rem] sm:text-[0.63rem] uppercase tracking-[0.3em] sm:tracking-[0.4em] text-[#D4AF37] shadow-sm">
                <span className="h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full bg-[#D4AF37] animate-pulse-slow" />
                LIMITED CAPSULE LAUNCH 01
              </div>

              {/* Main Headline Block */}
              <div className="space-y-3 sm:space-y-4">
                <motion.h1 
                  className="font-serif text-[2.6rem] font-light leading-[1.05] tracking-wide sm:text-6xl md:text-7xl"
                >
                  <div className="flex flex-wrap gap-x-3 sm:gap-x-4 overflow-hidden py-1">
                    {titleWords.map((word, wordIdx) => (
                      <motion.span
                        key={wordIdx}
                        custom={wordIdx}
                        variants={wordVariants}
                        initial="initial"
                        animate="animate"
                        className="inline-block font-serif font-semibold tracking-[0.1em]"
                      >
                        {word}
                      </motion.span>
                    ))}
                  </div>
                </motion.h1>

                <p className="max-w-xl font-sans text-[0.82rem] sm:text-sm leading-relaxed tracking-wider text-black/85 font-medium sm:text-base">
                  {`Next-generation premium streetwear is arriving soon. A visual masterwork where architectural silhouettes intersect with dynamic technical tailoring. Quietly disruptive, cinematic, and engineered to exist beyond trend bounds.`}
                </p>
              </div>

              {/* Premium Countdown Timer cards */}
              <div className="grid grid-cols-4 gap-2 sm:gap-3 max-w-sm sm:max-w-md">
                {[
                  ['Days', countdown.days],
                  ['Hours', countdown.hours],
                  ['Mins', countdown.minutes],
                  ['Secs', countdown.seconds],
                ].map(([label, value]) => (
                  <motion.div
                    key={label}
                    whileHover={{ scale: 1.03, borderColor: '#D4AF37' }}
                    className="flex flex-col items-center justify-center rounded-xl sm:rounded-2xl border border-black/5 bg-white/45 p-2.5 sm:p-4 text-center shadow-[0_15px_40px_rgba(26,26,26,0.01)] backdrop-blur-md transition-all duration-300"
                  >
                    <div className="font-sans text-xl sm:text-2xl font-bold tracking-tight text-black md:text-3xl">
                      {String(value).padStart(2, '0')}
                    </div>
                    <div className="mt-0.5 sm:mt-1 font-sans text-[0.5rem] sm:text-[0.6rem] uppercase tracking-[0.2em] sm:tracking-[0.25em] text-[#D4AF37] font-medium">
                      {label}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Glowing Early Access registration */}
              <div ref={subscribeRef} className="relative max-w-lg rounded-2xl sm:rounded-3xl border border-black/5 bg-white/30 p-4 sm:p-5 shadow-[0_20px_50px_rgba(26,26,26,0.02)] backdrop-blur-xl">
                <div className="absolute inset-0 -z-10 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-transparent via-[#D4AF37]/5 to-transparent blur-xl" />
                
                <AnimatePresence mode="wait">
                  {!isSubmitted ? (
                    <motion.div
                      key="form"
                      initial={{ opacity: 1 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-3 sm:space-y-4"
                    >
                      <h3 className="font-serif text-base sm:text-lg italic text-black font-bold">Apply for Exclusive Early Access</h3>
                      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="ENTER EMAIL FOR LAUNCH DETAILS"
                          className="w-full flex-1 rounded-full border border-black/15 bg-white/80 px-4 sm:px-5 py-3 sm:py-3.5 font-sans text-[0.65rem] sm:text-xs tracking-wider text-black outline-none placeholder:text-black/55 focus:border-[#D4AF37] focus:shadow-glow transition duration-300 font-medium"
                        />
                        <button
                          type="submit"
                          className="group relative overflow-hidden rounded-full bg-black px-6 sm:px-7 py-3 sm:py-3.5 font-sans text-[0.65rem] sm:text-xs font-semibold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-[#FAF9F6] shadow-sm transition-all duration-300 hover:bg-[#D4AF37] hover:text-black"
                        >
                          <span className="relative z-10">Notify Me</span>
                          <span className="absolute inset-0 -translate-x-full bg-white opacity-10 transition-transform duration-300 group-hover:translate-x-0" />
                        </button>
                      </form>
                      <p className="font-sans text-[0.62rem] sm:text-[0.68rem] tracking-wide text-black/70 font-medium">
                        Private launch codes, editorial catalogs, and early collections landing in sequence.
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="py-4 text-center"
                    >
                      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#D4AF37]/15">
                        <span className="text-[#D4AF37] font-semibold">✓</span>
                      </div>
                      <h3 className="font-serif text-lg sm:text-xl italic text-black font-semibold">
                        {isDuplicate ? 'Already Enrolled' : 'Access Granted'}
                      </h3>
                      <p className="mt-2 font-sans text-[0.68rem] sm:text-xs tracking-wider text-black/90 font-medium">
                        {isDuplicate
                          ? `You're already on the list! The address ${email} is registered in the BATTLEONE manifest.`
                          : `Thank you. Your address ${email} has been signed into the BATTLEONE capsule manifest.`
                        }
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </motion.section>

            {/* Right Side: Animated Campaign model container with 3D particles */}
            <section className="relative flex justify-center lg:justify-end order-1 lg:order-2">
              
              {/* Campaign Model Frame Container with interactive 2.5D Parallax */}
              <div 
                style={{
                  transform: `perspective(1000px) rotateY(${mousePos.x * 12}deg) rotateX(${mousePos.y * -12}deg) translateY(${mousePos.y * 5}px)`,
                  transition: 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)'
                }}
                className="relative h-[320px] sm:h-[400px] md:h-[450px] w-full max-w-[320px] sm:max-w-[380px] md:max-w-[420px] overflow-hidden rounded-[24px] sm:rounded-[32px] md:rounded-[38px] border border-white bg-white/40 shadow-[0_30px_70px_rgba(26,26,26,0.06)] backdrop-blur-sm lg:h-[500px]"
              >
                
                {/* 3D Particle system Canvas inside the campaign frame */}
                <div className="absolute inset-0 z-20 pointer-events-none mix-blend-screen hidden sm:block">
                  <Canvas camera={{ position: [0, 0, 3.2], fov: 45 }} gl={{ alpha: true, antialias: true }}>
                    <ambientLight intensity={0.8} />
                    <directionalLight position={[2, 2, 2]} intensity={1.5} color="#FAF9F6" />
                    <Suspense fallback={null}>
                      <GoldParticleScene />
                    </Suspense>
                  </Canvas>
                </div>

                {/* Parallax Campaign Model Image Container */}
                <div className="absolute inset-0 z-10 overflow-hidden bg-white/10">
                  <motion.img
                    src={bannerImg}
                    alt="BATTLEONE Luxury Streetwear Model"
                    style={{
                      x: mousePos.x * 20,
                      y: mousePos.y * 20,
                      scale: 1.05
                    }}
                    transition={{ type: 'spring', stiffness: 70, damping: 25 }}
                    className="h-full w-full object-cover object-center"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  
                  {/* Subtle golden ambient glows behind and over the model */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#FAF9F6] via-transparent to-transparent opacity-35" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.08),_transparent_65%)]" />
                </div>

                <div className="absolute bottom-3 left-3 right-3 sm:bottom-6 sm:left-6 sm:right-6 z-30 flex items-end justify-between rounded-2xl sm:rounded-3xl border border-white bg-white/80 p-3 sm:p-5 shadow-[0_15px_35px_rgba(26,26,26,0.03)] backdrop-blur-md">
                  <div>
                    <span className="font-sans text-[0.5rem] sm:text-[0.62rem] uppercase tracking-[0.2em] sm:tracking-[0.25em] text-[#D4AF37] font-bold">CAPSULE LOOK</span>
                    <h4 className="mt-0.5 sm:mt-1 font-serif text-sm sm:text-lg italic text-black font-bold">01 Peach Cargo Pants</h4>
                  </div>
                  <div className="text-right">
                    <span className="font-sans text-[0.5rem] sm:text-[0.62rem] uppercase tracking-[0.2em] sm:tracking-[0.25em] text-black/80 font-bold">SEQUENCE</span>
                    <h4 className="mt-0.5 sm:mt-1 font-sans text-sm sm:text-base font-bold text-black">A/W 26</h4>
                  </div>
                </div>

              </div>
            </section>

          </div>
        </main>

        {/* Elegant Footer bar */}
        <footer className="px-4 pb-4 sm:px-8 sm:pb-6 lg:px-12">
          <div className="mx-auto max-w-7xl rounded-2xl sm:rounded-3xl border border-black/5 bg-white/45 px-4 py-3 sm:px-5 sm:py-4 text-[0.65rem] sm:text-xs tracking-wider text-black/80 backdrop-blur-md">
            {/* Desktop footer: single row */}
            <div className="hidden sm:flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="font-sans font-bold uppercase tracking-widest text-[#D4AF37]">SYSTEM ACTIVE</p>
                </div>
                <span className="text-black/35 font-light">|</span>
                <p className="font-medium text-black/90">“Architecture is wearable. The future of culture has arrived.”</p>
              </div>
              
              <div className="flex items-center gap-4">
                <SocialIcon href="https://www.instagram.com/battleone.official/">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                  </svg>
                </SocialIcon>
                <SocialIcon href="https://youtube.com/@battleone.official?si=HKJRW5Ju4oH1E_wd">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.163a3.003 3.003 0 00-2.11-2.11C19.53 3.545 12 3.545 12 3.545s-7.53 0-9.388.508a3.003 3.003 0 00-2.11 2.11C0 8.017 0 12 0 12s0 3.983.502 5.837a3.003 3.003 0 002.11 2.11c1.858.507 9.388.507 9.388.507s7.53 0 9.388-.507a3.003 3.003 0 002.11-2.11C24 15.983 24 12 24 12s0-3.983-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </SocialIcon>
              </div>
            </div>

            {/* Mobile footer: stacked layout */}
            <div className="flex sm:hidden flex-col gap-3 items-center text-center">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="font-sans font-bold uppercase tracking-widest text-[#D4AF37] text-[0.6rem]">SYSTEM ACTIVE</p>
                </div>
              </div>
              <p className="font-medium text-black/90 text-[0.62rem] leading-relaxed">“Architecture is wearable. The future of culture has arrived.”</p>
              <div className="flex items-center gap-3">
                <SocialIcon href="https://instagram.com">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                  </svg>
                </SocialIcon>
                <SocialIcon href="https://youtube.com/@battleone.official?si=HKJRW5Ju4oH1E_wd">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.163a3.003 3.003 0 00-2.11-2.11C19.53 3.545 12 3.545 12 3.545s-7.53 0-9.388.508a3.003 3.003 0 00-2.11 2.11C0 8.017 0 12 0 12s0 3.983.502 5.837a3.003 3.003 0 002.11 2.11c1.858.507 9.388.507 9.388.507s7.53 0 9.388-.507a3.003 3.003 0 002.11-2.11C24 15.983 24 12 24 12s0-3.983-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </SocialIcon>
              </div>
            </div>
          </div>
        </footer>

        {/* Admin Panel Modal */}
        <AnimatePresence>
          {isAdminOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4"
            >
              <motion.div
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                transition={{ type: 'spring', duration: 0.5 }}
                className="relative w-full max-w-2xl rounded-3xl border border-zinc-800 bg-zinc-950 p-6 text-white shadow-2xl max-h-[90vh] flex flex-col"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-zinc-900">
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-[#D4AF37]/10 px-2.5 py-1 text-[0.55rem] uppercase tracking-widest text-[#D4AF37] border border-[#D4AF37]/20 font-bold">
                      ADMIN CONSOLE
                    </span>
                    <h2 className="font-serif text-lg sm:text-xl italic font-semibold text-zinc-100">Subscriber Manifest</h2>
                  </div>
                  <button
                    onClick={() => navigate('/')}
                    className="rounded-full bg-zinc-900 hover:bg-zinc-800 p-2 text-zinc-400 hover:text-white transition duration-300"
                    aria-label="Close Admin Modal"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {!isSupabaseConfigured && (
                  <div className="mt-4 rounded-xl border border-amber-950/40 bg-amber-950/20 p-3 text-[0.7rem] text-amber-400 font-medium">
                    ⚠️ Running in LOCAL MOCK MODE. Setup credentials in your `.env` file to connect the live, secure Supabase cloud database.
                  </div>
                )}

                {fallbackNotice && (
                  <div className="mt-4 rounded-xl border border-amber-950/40 bg-amber-950/20 p-3 text-[0.7rem] text-amber-300 font-medium">
                    {fallbackNotice}
                  </div>
                )}

                {!adminUser ? (
                  /* Admin Login Form */
                  <div className="flex-1 flex flex-col justify-center py-6">
                    <div className="text-center mb-6">
                      <h3 className="font-serif text-base italic text-zinc-300">Authorized Personnel Only</h3>
                      <p className="mt-1.5 font-sans text-[0.68rem] uppercase tracking-widest text-zinc-500 font-bold">
                        Please log in to access the subscriber manifest.
                      </p>
                    </div>
                    
                    <form onSubmit={handleAdminLogin} className="space-y-4 max-w-sm mx-auto w-full">
                      <div>
                        <label className="block text-[0.62rem] uppercase tracking-widest text-zinc-400 font-bold mb-1.5">
                          Admin Email Address
                        </label>
                        <input
                          type="email"
                          required
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          placeholder=""
                          autoComplete="off"
                          spellCheck={false}
                          className="w-full rounded-xl border border-zinc-850 bg-zinc-900 px-4 py-3 font-sans text-xs text-white outline-none focus:border-[#D4AF37] transition duration-300 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[0.62rem] uppercase tracking-widest text-zinc-400 font-bold mb-1.5">
                          Password
                        </label>
                        <input
                          type="password"
                          required
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full rounded-xl border border-zinc-850 bg-zinc-900 px-4 py-3 font-sans text-xs text-white outline-none focus:border-[#D4AF37] transition duration-300 font-medium"
                        />
                      </div>
                      
                      {loginError && (
                        <div className="rounded-xl border border-red-950/40 bg-red-950/20 p-3 text-xs text-red-400 font-medium">
                          {loginError}
                        </div>
                      )}
                      
                      <button
                        type="submit"
                        disabled={isLoggingIn}
                        className="w-full rounded-full bg-[#D4AF37] py-3.5 text-black font-sans text-[0.68rem] font-bold uppercase tracking-widest transition-all duration-300 hover:bg-[#B3922E] disabled:opacity-50 cursor-pointer"
                      >
                        {isLoggingIn ? 'Verifying Identity...' : 'Access Manifest'}
                      </button>
                    </form>
                  </div>
                ) : (
                  /* Subscriber Database UI */
                  <>
                    {/* Stats & Actions Toolbar */}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-sans text-zinc-400 font-medium">Subscribers:</span>
                        <span className="font-sans font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded-full border border-[#D4AF37]/15">
                          {subscribers.length}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={downloadCSV}
                          disabled={subscribers.length === 0}
                          className="rounded-full border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 px-3.5 py-1.5 font-sans font-bold uppercase tracking-wider text-zinc-300 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed hover:text-white cursor-pointer"
                        >
                          Export CSV
                        </button>
                        <button
                          onClick={copyAllEmails}
                          disabled={subscribers.length === 0}
                          className="rounded-full border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 px-3.5 py-1.5 font-sans font-bold uppercase tracking-wider text-zinc-300 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed hover:text-white cursor-pointer"
                        >
                          {copiedAll ? 'Copied!' : 'Copy All'}
                        </button>
                        <button
                          onClick={clearDatabase}
                          disabled={subscribers.length === 0}
                          className="rounded-full border border-red-950/40 bg-red-950/20 hover:bg-red-950/40 px-3.5 py-1.5 font-sans font-bold uppercase tracking-wider text-red-400 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        >
                          Clear All
                        </button>
                        {isSupabaseConfigured && (
                          <button
                            onClick={handleAdminLogout}
                            className="rounded-full border border-zinc-800 bg-zinc-900 hover:bg-zinc-850 px-3.5 py-1.5 font-sans font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition-all duration-300 cursor-pointer"
                          >
                            Sign Out
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Search Bar */}
                    <div className="mt-4">
                      <input
                        type="text"
                        placeholder="SEARCH SUBSCRIBERS..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-xl border border-zinc-900 bg-zinc-900/50 px-4 py-2.5 font-sans text-xs uppercase tracking-wider text-white outline-none focus:border-[#D4AF37]/45 transition duration-300"
                      />
                    </div>

                    {/* Subscriber List Table */}
                    <div className="mt-4 flex-1 overflow-y-auto max-h-[350px] border border-zinc-900 rounded-2xl bg-zinc-950/40">
                      {filteredSubscribers.length > 0 ? (
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-zinc-900 bg-zinc-900/30 text-[0.63rem] uppercase tracking-widest text-zinc-400 font-bold">
                              <th className="py-3 px-4 w-12 text-center">#</th>
                              <th className="py-3 px-4">Email Address</th>
                              <th className="py-3 px-4 hidden sm:table-cell">Signed Up At</th>
                              <th className="py-3 px-4 text-center w-20">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-900 font-sans text-xs">
                            {filteredSubscribers.map((sub, index) => (
                              <tr key={index} className="hover:bg-zinc-900/10 transition-colors duration-150">
                                <td className="py-3 px-4 text-center text-zinc-500 font-medium">{filteredSubscribers.length - index}</td>
                                <td className="py-3 px-4 font-medium text-zinc-200 select-all">{sub.email}</td>
                                <td className="py-3 px-4 text-zinc-400 hidden sm:table-cell">
                                  {new Date(sub.timestamp).toLocaleString(undefined, { 
                                    dateStyle: 'medium', 
                                    timeStyle: 'short' 
                                  })}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <button
                                    onClick={() => copyToClipboard(sub.email, index)}
                                    className="inline-flex items-center justify-center rounded-lg bg-zinc-900 hover:bg-zinc-800 p-1.5 text-zinc-400 hover:text-[#D4AF37] transition duration-300 cursor-pointer"
                                    title="Copy Email"
                                  >
                                    {copiedIndex === index ? (
                                      <span className="text-[0.6rem] font-bold px-1 text-[#D4AF37]">Copied</span>
                                    ) : (
                                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                      </svg>
                                    )}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-500 gap-3">
                          <svg className="h-8 w-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                          <div className="text-xs uppercase tracking-wider font-semibold">No Subscribers Found</div>
                          {subscribers.length === 0 && (
                            <button
                              onClick={loadMockSignups}
                              className="mt-2 rounded-full border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800/80 px-4 py-2 font-sans text-[0.62rem] uppercase tracking-wider text-[#D4AF37] font-semibold transition duration-300 cursor-pointer"
                            >
                              Load Test Signups
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Modal Footer */}
                <div className="mt-5 pt-3 border-t border-zinc-900 flex justify-between items-center text-[0.65rem] text-zinc-500 uppercase tracking-widest font-semibold">
                  <div>BATTLEONE Manifest Core v1.0</div>
                  {subscribers.length > 0 && (
                    <button 
                      onClick={loadMockSignups}
                      className="text-[#D4AF37]/70 hover:text-[#D4AF37] transition duration-200"
                    >
                      Reset with Mock Data
                    </button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
