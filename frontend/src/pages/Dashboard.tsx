import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { GlassCard } from "../components/GlassCard";
import { MoodSelector } from "../components/MoodSelector";
import { MoodLineChart } from "../components/VisualCharts";
import { 
  Heart, MessageSquare, ArrowRight, Activity, Smile, 
  Sparkles, Wind, Compass, Search, 
  Check, UserCheck, Clock, MapPin, Users, Flame,
  Target, Calendar, Code, Database, Award, Terminal, 
  Camera, Lightbulb, ShieldAlert, BookOpen, UserCheck2, CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TimelineItem {
  date: string;
  score: number;
  notes?: string;
}

interface MoodStats {
  average_mood: number;
  counts: Record<number, number>;
  timeline: TimelineItem[];
}

// BVRIT Realistic Student Clubs
const BVRIT_CLUBS = [
  {
    id: 1,
    name: "Coding Brigade BVRIT",
    category: "Technical",
    members: 420,
    description: "Coding contests, DSA practice, hackathons, placement preparation, and core workshops.",
    icon: <Code className="w-5 h-5 text-indigo-400" />,
    gradient: "from-indigo-500/10 via-brand-500/5 to-transparent",
    border: "border-indigo-500/20"
  },
  {
    id: 2,
    name: "Data Science Visionary Hub",
    category: "Technical",
    members: 310,
    description: "AI, Machine Learning, Data Science, NLP, and Computer Vision hands-on hackathons.",
    icon: <Database className="w-5 h-5 text-cyan-400" />,
    gradient: "from-cyan-500/10 via-blue-500/5 to-transparent",
    border: "border-cyan-500/20"
  },
  {
    id: 3,
    name: "ISTE Student Chapter",
    category: "Professional",
    members: 280,
    description: "Technical events, national seminars, paper presentations, and innovation challenges.",
    icon: <Award className="w-5 h-5 text-amber-400" />,
    gradient: "from-amber-500/10 via-yellow-500/5 to-transparent",
    border: "border-amber-500/20"
  },
  {
    id: 4,
    name: "CSI Student Chapter",
    category: "Technical",
    members: 350,
    description: "Programming competitions, industrial talks by experts, and algorithmic coding sessions.",
    icon: <Terminal className="w-5 h-5 text-blue-400" />,
    gradient: "from-blue-500/10 via-indigo-500/5 to-transparent",
    border: "border-blue-500/20"
  },
  {
    id: 5,
    name: "NSS BVRIT",
    category: "Social Service",
    members: 500,
    description: "Blood donation camps, village development near Narsapur, and community awareness drives.",
    icon: <Heart className="w-5 h-5 text-rose-400" />,
    gradient: "from-rose-500/10 via-red-500/5 to-transparent",
    border: "border-rose-500/20"
  },
  {
    id: 6,
    name: "Sports Club",
    category: "Sports",
    members: 390,
    description: "Inter-college Cricket tournaments, Volleyball, Badminton leagues, and Athletics track meets.",
    icon: <Activity className="w-5 h-5 text-emerald-400" />,
    gradient: "from-emerald-500/10 via-teal-500/5 to-transparent",
    border: "border-emerald-500/20"
  },
  {
    id: 7,
    name: "Cultural Club",
    category: "Cultural",
    members: 260,
    description: "Dance, Music bands, Drama theater groups, and annual literary fest celebrations.",
    icon: <Sparkles className="w-5 h-5 text-fuchsia-400" />,
    gradient: "from-fuchsia-500/10 via-purple-500/5 to-transparent",
    border: "border-fuchsia-500/20"
  },
  {
    id: 8,
    name: "Photography & Media Club",
    category: "Creative",
    members: 180,
    description: "Photography workshops, videography editing, short films, and campus event coverage.",
    icon: <Camera className="w-5 h-5 text-purple-400" />,
    gradient: "from-purple-500/10 via-pink-500/5 to-transparent",
    border: "border-purple-500/20"
  },
  {
    id: 9,
    name: "Entrepreneurship & Innovation Cell",
    category: "Innovation",
    members: 220,
    description: "Startup mentoring, ideathons, business model pitch competitions, and incubator visits.",
    icon: <Lightbulb className="w-5 h-5 text-orange-400" />,
    gradient: "from-orange-500/10 via-amber-500/5 to-transparent",
    border: "border-orange-500/20"
  }
];

// Realistic BVRIT Faculty Mentors & Support Staff
const BVRIT_FACULTY_SUPPORT = [
  {
    role: "Faculty Coordinator",
    name: "Dr. A. Satish Babu",
    dept: "Department of Computer Science & Engineering",
    email: "support@bvrit.ac.in",
    icon: <UserCheck2 className="w-4 h-4 text-indigo-400" />
  },
  {
    role: "Student Counselor",
    name: "Ms. L. Pallavi",
    dept: "Student Wellness Cell",
    email: "wellness@bvrit.ac.in",
    icon: <Heart className="w-4 h-4 text-rose-400" />
  },
  {
    role: "Academic Mentor",
    name: "Mr. K. Praveen Kumar",
    dept: "Training & Placement Cell",
    email: "training@bvrit.ac.in",
    icon: <Award className="w-4 h-4 text-amber-400" />
  }
];

// BVRIT Wellness Resources Cards
const BVRIT_WELLNESS_RESOURCES = [
  { title: "Student Counseling Cell", desc: "Confidential emotional counseling and stress release sessions.", icon: <Heart className="w-4 h-4 text-rose-400" /> },
  { title: "Department Mentors", desc: "Academic guidance and personal mentorship from CSE, IT, ECE, EEE, and Mech faculties.", icon: <UserCheck className="w-4 h-4 text-indigo-400" /> },
  { title: "Anti-Ragging Committee", desc: "24/7 campus safety enforcement, anti-ragging helpline, and student protection.", icon: <ShieldAlert className="w-4 h-4 text-emerald-400" /> },
  { title: "Women's Grievance Cell", desc: "Dedicated safety cell providing counseling, support, and empowerment.", icon: <Sparkles className="w-4 h-4 text-fuchsia-400" /> },
  { title: "Training & Placement Mentors", desc: "Interview stress management, mock drive prep, and career path counseling.", icon: <Award className="w-4 h-4 text-amber-400" /> },
  { title: "Academic Counselors", desc: "GPA performance counseling, attendance recovery support, and study planning.", icon: <BookOpen className="w-4 h-4 text-blue-400" /> }
];

// BVRIT Upcoming Technical Events
const BVRIT_EVENTS = [
  {
    id: 1,
    title: "BVRIT National Hackathon 2026",
    date: "July 15, 2026",
    location: "Auditorium Block, BVRIT Narsapur",
    organizer: "Coding Brigade & CSI Chapter",
    category: "Hackathon"
  },
  {
    id: 2,
    title: "NLP & Applied AI Bootcamp",
    date: "July 22, 2026",
    location: "Seminar Hall 2, CSE Block",
    organizer: "Data Science Visionary Hub",
    category: "Workshop"
  },
  {
    id: 3,
    title: "Placement Sprint Prep Drive",
    date: "August 05, 2026",
    location: "T&P Cell Lab 3",
    organizer: "Training & Placement Cell",
    category: "Placement"
  },
  {
    id: 4,
    title: "AI & Machine Learning Student Meetup",
    date: "August 18, 2026",
    location: "CSE Dept Computer Lab 5",
    organizer: "ISTE BVRIT Chapter",
    category: "Meetup"
  }
];

export const Dashboard: React.FC = () => {
  const { user, api, chatSessions, refreshSessions, setActiveChatId } = useApp();
  const navigate = useNavigate();
  
  // Tabs: "wellness" | "life" | "calm"
  const [activeTab, setActiveTab] = useState<"wellness" | "life" | "calm">("wellness");
  
  const [moodStats, setMoodStats] = useState<MoodStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Breathing timer state
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState<"inhale" | "hold" | "exhale">("inhale");
  const [breathingSeconds, setBreathingSeconds] = useState(4);
  const [completedCycles, setCompletedCycles] = useState(0);

  // Interactive state
  const [joinedClubs, setJoinedClubs] = useState<Record<number, boolean>>({});
  const [registeredEvents, setRegisteredEvents] = useState<Record<number, boolean>>({});
  const [clubSearch, setClubSearch] = useState("");

  // Goal tracker state
  const [goals, setGoals] = useState([
    { id: 1, text: "Practice 4-7-8 breathing before study block", done: true },
    { id: 2, text: "Attend Coding Brigade placement webinar", done: false },
    { id: 3, text: "Log mood journal entry after classes", done: true }
  ]);

  const toggleGoal = (id: number) => {
    setGoals(goals.map(g => g.id === id ? { ...g, done: !g.done } : g));
  };

  const fetchStats = async () => {
    try {
      const res = await api.get("/mood/stats");
      setMoodStats(res.data);
    } catch (e) {
      console.error("Failed to load mood stats:", e);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
    refreshSessions();
  }, []);

  // 4-7-8 Breathing interval loop
  useEffect(() => {
    let interval: any = null;
    if (breathingActive) {
      interval = setInterval(() => {
        setBreathingSeconds((prev) => {
          if (prev <= 1) {
            if (breathingPhase === "inhale") {
              setBreathingPhase("hold");
              return 7;
            } else if (breathingPhase === "hold") {
              setBreathingPhase("exhale");
              return 8;
            } else {
              setBreathingPhase("inhale");
              setCompletedCycles((c) => c + 1);
              return 4;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setBreathingPhase("inhale");
      setBreathingSeconds(4);
    }
    return () => clearInterval(interval);
  }, [breathingActive, breathingPhase]);

  const toggleBreathing = () => {
    setBreathingActive(!breathingActive);
    if (!breathingActive) {
      setCompletedCycles(0);
    }
  };

  const getMoodLabel = (score: number) => {
    if (score >= 4.5) return "Feeling Awesome! 😄";
    if (score >= 3.5) return "Stable & Positive 🙂";
    if (score >= 2.5) return "Feeling Neutral 😐";
    if (score >= 1.5) return "Feeling Anxious 😰";
    if (score > 0) return "Feeling Low/Sad 😢";
    return "No logs yet.";
  };

  const handleStartNewChat = async () => {
    try {
      const res = await api.post("/chat/sessions", { title: "New Wellness Session" });
      const newChat = res.data;
      setActiveChatId(newChat.id);
      await refreshSessions();
      navigate("/chat");
    } catch (err) {
      console.error("Failed to start new chat:", err);
    }
  };

  const handleOpenChat = (id: number) => {
    setActiveChatId(id);
    navigate("/chat");
  };

  const toggleJoinClub = (id: number) => {
    setJoinedClubs(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleRegisterEvent = (id: number) => {
    setRegisteredEvents(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredClubs = BVRIT_CLUBS.filter(club => 
    club.name.toLowerCase().includes(clubSearch.toLowerCase()) ||
    club.category.toLowerCase().includes(clubSearch.toLowerCase()) ||
    club.description.toLowerCase().includes(clubSearch.toLowerCase())
  );

  const recentChats = chatSessions.slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 dot-grid dark:bg-slate-950 bg-slate-50 flex-1 w-full relative text-slate-800 dark:text-slate-100">
      
      {/* Decorative Orbs */}
      <div className="absolute top-20 right-1/4 w-80 h-80 rounded-full bg-indigo-500/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-40 left-10 w-96 h-96 rounded-full bg-fuchsia-500/5 blur-[120px] pointer-events-none" />

      {/* Hero Welcome Banner */}
      <div className="glass-card flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 sm:p-8 rounded-3xl border dark:border-slate-850 border-slate-200 bg-gradient-to-r from-brand-500/10 via-indigo-600/5 to-transparent relative z-10 shadow-sm">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] font-bold tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5" /> B V Raju Institute of Technology (BVRIT)
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold dark:text-slate-100 text-slate-900 flex items-center gap-2">
            Welcome, <span className="capitalize text-indigo-400">{user?.username}</span>! 👋
          </h1>
          <p className="text-xs sm:text-sm dark:text-slate-400 text-slate-600 leading-relaxed">
            Your personalized wellness portal at BVRIT Narsapur. Track daily stress curves, access faculty mentors, or join technical student clubs.
          </p>
        </div>

        {/* Action button & streak stats */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shrink-0">
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl dark:bg-slate-900/60 bg-white border dark:border-slate-850 border-slate-200">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
              <Flame className="w-5 h-5 fill-orange-500" />
            </div>
            <div>
              <div className="text-xs font-extrabold">5 Day Streak!</div>
              <div className="text-[10px] text-slate-500">Wellness Active</div>
            </div>
          </div>

          <button
            onClick={handleStartNewChat}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-600 hover:to-indigo-700 text-white font-bold text-xs transition-all hover:scale-102 shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-4.5 h-4.5" /> Chat with MindMate
          </button>
        </div>
      </div>

      {/* Dynamic Tab Navigation */}
      <div className="flex border-b dark:border-slate-850 border-slate-200 gap-8 relative z-10 overflow-x-auto pb-0.5">
        <button
          onClick={() => setActiveTab("wellness")}
          className={`pb-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 focus:outline-none flex items-center gap-2 shrink-0 ${
            activeTab === "wellness" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-350"
          }`}
        >
          <Activity className="w-4 h-4" /> Wellness Center & Analytics
        </button>
        <button
          onClick={() => setActiveTab("life")}
          className={`pb-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 focus:outline-none flex items-center gap-2 shrink-0 ${
            activeTab === "life" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-350"
          }`}
        >
          <Compass className="w-4 h-4" /> Explore Student Life at BVRIT
        </button>
        <button
          onClick={() => setActiveTab("calm")}
          className={`pb-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 focus:outline-none flex items-center gap-2 shrink-0 ${
            activeTab === "calm" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-350"
          }`}
        >
          <Wind className="w-4 h-4" /> Meditation & Calm Space
        </button>
      </div>

      {/* Tab Contents */}
      <AnimatePresence mode="wait">
        
        {/* --- TAB 1: WELLNESS CENTER & ANALYTICS --- */}
        {activeTab === "wellness" && (
          <motion.div
            key="wellness"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10"
          >
            {/* Left Column: Mood Logging & Recent Chats */}
            <div className="space-y-8 lg:col-span-1">
              
              {/* Daily Mood Log */}
              <GlassCard className="p-6">
                <h2 className="text-xs font-bold dark:text-slate-200 text-slate-800 flex items-center gap-2 mb-6 border-b dark:border-slate-850 pb-3 uppercase tracking-wider">
                  <Smile className="w-4.5 h-4.5 text-indigo-400" />
                  Daily Mood Log
                </h2>
                <MoodSelector onLoggedSuccess={fetchStats} />
              </GlassCard>

              {/* Goal Tracker */}
              <GlassCard className="p-6">
                <h2 className="text-xs font-bold dark:text-slate-200 text-slate-800 flex items-center gap-2 mb-4 border-b dark:border-slate-850 pb-3 uppercase tracking-wider">
                  <Target className="w-4.5 h-4.5 text-indigo-400" />
                  Daily Wellness Goals
                </h2>
                <div className="space-y-3">
                  {goals.map(g => (
                    <div
                      key={g.id}
                      onClick={() => toggleGoal(g.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                        g.done
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 line-through"
                          : "dark:bg-slate-950/40 bg-slate-100/50 border-slate-200 dark:border-slate-850 text-slate-300"
                      }`}
                    >
                      <span>{g.text}</span>
                      {g.done && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />}
                    </div>
                  ))}
                </div>
              </GlassCard>

              {/* Recent Conversations */}
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-4 border-b dark:border-slate-850 pb-3">
                  <h2 className="text-xs font-bold dark:text-slate-200 text-slate-800 flex items-center gap-2 uppercase tracking-wider">
                    <MessageSquare className="w-4.5 h-4.5 text-indigo-400" />
                    Recent AI Chats
                  </h2>
                  {chatSessions.length > 4 && (
                    <Link to="/chat" className="text-xs text-indigo-400 hover:underline flex items-center gap-0.5">
                      All <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>

                {chatSessions.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500">
                    No support chats logged yet. Start one above!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentChats.map((chat) => (
                      <div
                        key={chat.id}
                        onClick={() => handleOpenChat(chat.id)}
                        className="group p-3 rounded-xl dark:bg-slate-950/40 bg-slate-100/50 hover:bg-indigo-500/5 dark:hover:bg-indigo-500/5 border dark:border-slate-850 border-slate-200 transition-all duration-200 cursor-pointer flex items-center justify-between"
                      >
                        <div className="truncate pr-4">
                          <div className="text-xs font-semibold dark:text-slate-200 text-slate-800 truncate group-hover:text-indigo-400 transition-colors">
                            {chat.title}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {new Date(chat.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>

            </div>

            {/* Right Column: Mood Curve & Wellness Resources */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Mood Curve Graph */}
              <GlassCard className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b dark:border-slate-850 pb-4">
                  <h2 className="text-xs font-bold dark:text-slate-200 text-slate-800 flex items-center gap-2 uppercase tracking-wider">
                    <Activity className="w-4.5 h-4.5 text-indigo-400" />
                    BVRIT Mood History & Stress Curve
                  </h2>
                  {!loadingStats && moodStats && (
                    <div className="flex items-center gap-2 border dark:border-slate-850 border-slate-200 px-3.5 py-1.5 rounded-xl dark:bg-slate-900/60 bg-slate-100">
                      <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                      <span className="text-xs font-bold dark:text-slate-200 text-slate-800">
                        Avg: {moodStats.average_mood} / 5
                      </span>
                      <span className="text-xs text-slate-500 font-medium border-l border-slate-200 dark:border-slate-850 pl-2">
                        {getMoodLabel(moodStats.average_mood)}
                      </span>
                    </div>
                  )}
                </div>

                {loadingStats ? (
                  <div className="h-64 flex items-center justify-center">
                    <span className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                  </div>
                ) : (
                  <MoodLineChart timeline={moodStats?.timeline || []} />
                )}
              </GlassCard>

              {/* Student Wellness Resources Section */}
              <GlassCard className="p-6 space-y-6">
                <div className="border-b dark:border-slate-850 pb-4">
                  <h2 className="text-sm font-bold dark:text-slate-100 text-slate-900 flex items-center gap-2 uppercase tracking-wider">
                    <ShieldAlert className="w-4.5 h-4.5 text-indigo-400" />
                    Student Wellness Resources
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Dedicated support channels available across BVRIT campus blocks.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {BVRIT_WELLNESS_RESOURCES.map((res, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl dark:bg-slate-950/40 bg-slate-100/50 border dark:border-slate-850 border-slate-200/80 hover:border-indigo-500/30 transition-all space-y-1.5"
                    >
                      <div className="flex items-center gap-2">
                        {res.icon}
                        <h4 className="font-bold text-xs dark:text-slate-200 text-slate-900">{res.title}</h4>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{res.desc}</p>
                    </div>
                  ))}
                </div>

                {/* Important Indian Emergency Note */}
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs leading-relaxed flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-rose-200 mb-0.5">Important Emergency Note:</span>
                    If you are experiencing a mental health emergency, please contact your nearest healthcare provider, trusted family member, faculty mentor, or local emergency services immediately.
                  </div>
                </div>
              </GlassCard>

            </div>
          </motion.div>
        )}

        {/* --- TAB 2: EXPLORE STUDENT LIFE AT BVRIT --- */}
        {activeTab === "life" && (
          <motion.div
            key="life"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-10 relative z-10"
          >
            {/* Header */}
            <div className="border-b dark:border-slate-850 pb-4">
              <h2 className="text-xl font-bold dark:text-slate-100 text-slate-900 flex items-center gap-2">
                <Compass className="w-5 h-5 text-indigo-400" />
                Explore Student Life at BVRIT
              </h2>
              <p className="text-xs text-slate-500 mt-1">Discover BVRIT technical clubs, student communities, and upcoming campus hackathons.</p>
            </div>

            {/* Upcoming Technical Events Section */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold dark:text-slate-350 text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400" />
                Upcoming Technical Events & Hackathons
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {BVRIT_EVENTS.map((event) => {
                  const isRegistered = registeredEvents[event.id];
                  return (
                    <GlassCard key={event.id} className="p-6 flex flex-col justify-between space-y-4 border hover:border-indigo-500/30 transition-all">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-1 rounded-full text-[9px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase">
                            {event.category}
                          </span>
                          <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {event.date}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm dark:text-slate-100 text-slate-900">{event.title}</h4>
                        <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 pt-1">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" /> {event.location}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-indigo-400 shrink-0" /> Organized by: {event.organizer}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleRegisterEvent(event.id)}
                        className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                          isRegistered
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-600 hover:to-indigo-700 text-white shadow-md"
                        }`}
                      >
                        {isRegistered ? <><Check className="w-4 h-4" /> Registered</> : "Register Now"}
                      </button>
                    </GlassCard>
                  );
                })}
              </div>
            </div>

            {/* BVRIT Student Clubs Section */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b dark:border-slate-850 pb-4">
                <h3 className="text-xs font-bold dark:text-slate-350 text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" />
                  BVRIT Student Clubs & Chapters ({BVRIT_CLUBS.length})
                </h3>

                <div className="relative max-w-xs w-full">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search BVRIT clubs..."
                    value={clubSearch}
                    onChange={(e) => setClubSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl dark:bg-slate-950/60 bg-slate-100 border dark:border-slate-800 border-slate-300 focus:outline-none text-xs dark:text-slate-100 text-slate-900 placeholder-slate-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filteredClubs.map((club) => {
                  const isJoined = joinedClubs[club.id];
                  return (
                    <motion.div
                      key={club.id}
                      whileHover={{ y: -3 }}
                      className={`glass-card p-6 rounded-2xl border ${club.border} bg-gradient-to-br ${club.gradient} flex flex-col justify-between space-y-4 shadow-sm`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="w-10 h-10 rounded-xl dark:bg-slate-900/80 bg-white shadow-sm flex items-center justify-center">
                            {club.icon}
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase">
                            {club.category}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-bold text-sm dark:text-slate-100 text-slate-900">{club.name}</h4>
                          <span className="text-[10px] text-slate-500 font-medium">{club.members} BVRIT Students</span>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          {club.description}
                        </p>
                      </div>

                      <button
                        onClick={() => toggleJoinClub(club.id)}
                        className={`w-full py-2.5 rounded-xl font-bold text-xs border transition-all flex items-center justify-center gap-1.5 ${
                          isJoined 
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                            : "dark:bg-slate-900/80 bg-white border-slate-300 dark:border-slate-800 hover:border-indigo-500/40 text-slate-300 hover:text-indigo-400"
                        }`}
                      >
                        {isJoined ? <><Check className="w-4 h-4" /> Joined Club</> : "Join Community"}
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Student Support & Faculty Mentors Section */}
            <GlassCard className="p-8 space-y-6 border dark:border-slate-850">
              <div className="border-b dark:border-slate-850 pb-4">
                <h3 className="text-sm font-bold dark:text-slate-100 text-slate-900 flex items-center gap-2 uppercase tracking-wider">
                  <UserCheck className="w-4 h-4 text-indigo-400" />
                  Student Support & Faculty Mentors
                </h3>
                <p className="text-xs text-slate-500 mt-1">Reach out to designated BVRIT mentors for academic and wellness advice.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {BVRIT_FACULTY_SUPPORT.map((faculty, idx) => (
                  <div key={idx} className="p-5 rounded-2xl dark:bg-slate-950/40 bg-slate-100/50 border dark:border-slate-850 border-slate-200 space-y-2">
                    <div className="flex items-center gap-2">
                      {faculty.icon}
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">{faculty.role}</span>
                    </div>
                    <h4 className="font-extrabold text-sm dark:text-slate-100 text-slate-900">{faculty.name}</h4>
                    <p className="text-[11px] text-slate-500">{faculty.dept}</p>
                    <a href={`mailto:${faculty.email}`} className="text-xs text-indigo-400 font-semibold hover:underline block pt-1">
                      {faculty.email}
                    </a>
                  </div>
                ))}
              </div>

              {/* Office Location and Hours */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t dark:border-slate-850 text-xs">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block dark:text-slate-200 text-slate-800">Office Location:</span>
                    <span className="text-slate-500 dark:text-slate-400 leading-relaxed block">
                      Student Counseling Cell, BVRIT Campus, Narsapur, Telangana.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block dark:text-slate-200 text-slate-800">Office Hours:</span>
                    <span className="text-slate-500 dark:text-slate-400 leading-relaxed block">
                      Monday – Friday: 9:30 AM – 4:30 PM
                    </span>
                  </div>
                </div>
              </div>
            </GlassCard>

          </motion.div>
        )}

        {/* --- TAB 3: CALM SPACE & BREATHING --- */}
        {activeTab === "calm" && (
          <motion.div
            key="calm"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="max-w-3xl mx-auto w-full relative z-10"
          >
            <GlassCard className="p-10 flex flex-col items-center justify-center text-center space-y-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-500 via-indigo-400 to-fuchsia-500" />
              
              <div className="max-w-md space-y-2">
                <h2 className="text-xl font-bold dark:text-slate-100 text-slate-900">Guided 4-7-8 Somatic Breathing Timer</h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Calm placement interview jitters or midterm anxiety. Inhale for 4 seconds, hold for 7 seconds, and exhale completely for 8 seconds.
                </p>
              </div>

              <div className="relative w-72 h-72 flex items-center justify-center my-6">
                <motion.div
                  animate={{
                    scale: breathingActive && breathingPhase === "inhale" ? [1, 1.45] : breathingActive && breathingPhase === "hold" ? 1.45 : 1,
                    opacity: breathingActive ? [0.1, 0.25, 0.1] : 0.1
                  }}
                  transition={{
                    duration: breathingPhase === "inhale" ? 4 : breathingPhase === "hold" ? 7 : 8,
                    repeat: breathingActive ? Infinity : 0
                  }}
                  className="absolute w-56 h-56 rounded-full bg-indigo-500/20 blur-xl"
                />

                <div 
                  className={`w-44 h-44 rounded-full bg-gradient-to-tr from-indigo-600 via-brand-500 to-fuchsia-500 shadow-2xl flex flex-col items-center justify-center text-white border-2 border-white/20 transition-all duration-[4000ms] ease-in-out
                    ${breathingActive && breathingPhase === "inhale" ? "scale-125" : ""}
                    ${breathingActive && breathingPhase === "hold" ? "scale-125 shadow-indigo-500/30" : ""}
                    ${breathingActive && breathingPhase === "exhale" ? "scale-100 duration-[8000ms]" : ""}
                  `}
                >
                  <Wind className={`w-8 h-8 mb-2 ${breathingActive ? "animate-pulse" : ""}`} />
                  <span className="text-lg font-bold capitalize tracking-wider">{breathingActive ? breathingPhase : "Ready"}</span>
                  <span className="text-2xl font-extrabold mt-1">{breathingActive ? `${breathingSeconds}s` : "04"}</span>
                </div>
              </div>

              <div className="space-y-4 w-full max-w-sm">
                {breathingActive && (
                  <div className="text-xs font-semibold text-indigo-400">
                    Completed Relaxation Cycles: {completedCycles}
                  </div>
                )}
                
                <button
                  onClick={toggleBreathing}
                  className={`w-full py-3.5 rounded-xl font-bold text-xs transition-all duration-300 ${
                    breathingActive 
                      ? "bg-slate-900 text-rose-400 border border-rose-500/20" 
                      : "bg-gradient-to-r from-brand-500 to-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  }`}
                >
                  {breathingActive ? "Stop Exercise" : "Start 4-7-8 Breathing"}
                </button>
              </div>
            </GlassCard>
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
};

export default Dashboard;
