import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { 
  Brain, Heart, Sparkles, MessageSquare, ChevronDown, Award, Users, 
  Calendar, ShieldCheck, Mail, MapPin, Star, GraduationCap, ArrowRight
} from "lucide-react";
import { motion } from "framer-motion";

export const LandingPage: React.FC = () => {
  const { token } = useApp();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const stats = [
    { value: "24/7", label: "Campus AI Companion", icon: <Calendar className="w-5 h-5" /> },
    { value: "5,000+", label: "BVRIT Students Supported", icon: <Users className="w-5 h-5" /> },
    { value: "98%", label: "Placement Prep Positive Impact", icon: <Award className="w-5 h-5" /> },
    { value: "100%", label: "Confidential & Secure", icon: <ShieldCheck className="w-5 h-5" /> },
  ];

  const testimonials = [
    {
      name: "Ananya R.",
      dept: "Computer Science & Engineering (CSE)",
      year: "3rd Year B.Tech",
      quote: "During my semester examinations, I felt overwhelmed and anxious. The guided breathing exercises and motivational support in MindMate helped me calm down and regain my focus. It has become one of my daily wellness companions.",
      rating: 5,
      avatar: "A"
    },
    {
      name: "Rahul K.",
      dept: "Information Technology (IT)",
      year: "2nd Year B.Tech",
      quote: "As a first-year student, adjusting to college life wasn't easy. MindMate's wellness suggestions, study tips, and campus resources helped me manage stress and stay motivated throughout the semester.",
      rating: 5,
      avatar: "R"
    },
    {
      name: "Srinivas M.",
      dept: "Electronics & Communication Engineering (ECE)",
      year: "4th Year B.Tech",
      quote: "Preparing for placement drives was intense. MindMate's AI mock conversations and stress tracking helped me maintain high confidence right before technical interviews.",
      rating: 5,
      avatar: "S"
    }
  ];

  const faqs = [
    {
      q: "Is MindMate AI a replacement for professional clinical therapy?",
      a: "No. MindMate is designed specifically as an emotional support companion for BVRIT students. It provides stress management guidelines, study tips, guided breathing exercises, and connects you directly to BVRIT faculty mentors and counseling cells. It does not provide medical diagnosis."
    },
    {
      q: "How does MindMate help BVRIT students during placements and exams?",
      a: "MindMate tracks your daily stress trends and intent levels using advanced NLP. If you express anxiety regarding placements or midterms, it automatically recommends somatic study breaks, Pomodoro focus techniques, and confidence affirmations."
    },
    {
      q: "How does the Semantic Search (RAG) feature work?",
      a: "MindMate utilizes Sentence Transformers and Vector Databases (FAISS / ChromaDB) to search BVRIT's verified wellness guides and academic stress datasets, delivering contextual solutions with citations."
    },
    {
      q: "Are my chat logs and mood entries private?",
      a: "Yes. All student interaction logs are encrypted securely. Credentials are protected using bcrypt password hashing and JWT authentication."
    }
  ];

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen dot-grid dark:bg-slate-950 bg-slate-50 flex flex-col relative overflow-hidden text-slate-800 dark:text-slate-100">
      
      {/* Decorative Blur Orbs */}
      <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-40 right-1/4 w-80 h-80 rounded-full bg-fuchsia-600/10 blur-[100px] pointer-events-none" />

      {/* Header bar */}
      <header className="w-full max-w-7xl mx-auto px-6 h-20 flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-500 via-indigo-600 to-fuchsia-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Brain className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg leading-tight bg-gradient-to-r from-brand-500 via-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">
              MindMate AI
            </span>
            <span className="text-[9px] font-bold tracking-wider text-slate-400 dark:text-slate-400 uppercase">
              BVRIT Narsapur
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {token ? (
            <Link
              to="/dashboard"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-indigo-600 text-white font-semibold text-xs transition-all hover:scale-103 shadow-lg shadow-indigo-500/25 flex items-center gap-2"
            >
              Go to BVRIT Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-400">
                Log In
              </Link>
              <Link
                to="/register"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-600 hover:to-indigo-700 text-white font-semibold text-xs transition-all hover:scale-103 shadow-lg shadow-indigo-500/25"
              >
                Student Portal Sign Up
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-12 pb-20 text-center z-10 flex-1 flex flex-col justify-center items-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-xs font-bold tracking-wider uppercase mb-6 shadow-sm">
            <GraduationCap className="w-4 h-4" /> Dedicated Wellness Portal for BVRIT Narsapur
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-none mb-6">
            Intelligent Wellness & AI Support for <br />
            <span className="bg-gradient-to-r from-brand-500 via-indigo-400 to-fuchsia-500 bg-clip-text text-transparent">
              B V Raju Institute of Technology
            </span>
          </h1>
          <p className="text-sm sm:text-base dark:text-slate-400 text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            Conquer semester exams, placement stress, and campus life transitions. MindMate provides personalized emotional support, guided breathing tools, and connects you directly with BVRIT faculty mentors.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to={token ? "/chat" : "/register"}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-600 hover:to-indigo-700 text-white font-bold text-xs transition-all shadow-xl shadow-indigo-600/25 hover:scale-102 flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4.5 h-4.5" /> Start Chatting with MindMate
            </Link>
            <a
              href="#features"
              className="w-full sm:w-auto px-8 py-4 rounded-xl dark:bg-slate-900/50 bg-white border dark:border-slate-850 border-slate-300 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-all hover:scale-102 flex items-center justify-center"
            >
              Explore Student Resources
            </a>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="w-full max-w-6xl mt-20 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * idx, duration: 0.5 }}
              className="glass-card dark:bg-slate-900/40 bg-white/80 border dark:border-slate-850 border-slate-200 p-6 rounded-2xl flex flex-col items-center justify-center backdrop-blur-md shadow-sm hover:border-indigo-500/30 transition-all"
            >
              <div className="w-10 h-10 rounded-xl dark:bg-indigo-500/10 bg-indigo-500/5 text-indigo-400 flex items-center justify-center mb-3">
                {s.icon}
              </div>
              <div className="text-2xl font-extrabold dark:text-slate-100 text-slate-900 mb-1">{s.value}</div>
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20 z-10 w-full border-t dark:border-slate-900 border-slate-200">
        <div className="text-center mb-16 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold">Tailored Engineering & Wellness Features</h2>
          <p className="dark:text-slate-400 text-slate-600 max-w-xl mx-auto text-xs sm:text-sm">
            Designed to empower BVRIT students across technical departments, placement drives, and daily campus wellness.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-card dark:bg-slate-900/30 bg-white border dark:border-slate-850 border-slate-200/80 p-8 rounded-2xl hover:-translate-y-1 transition-all duration-300 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-6">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold mb-3">Hybrid NLP Pipeline</h3>
            <p className="text-xs dark:text-slate-400 text-slate-600 leading-relaxed">
              Analyzes student queries in real-time, detecting sentiment, emotion (Anxiety, Stress, Sadness), and intent (Exam Stress, Placement Worry) to deliver adaptive support.
            </p>
          </div>

          <div className="glass-card dark:bg-slate-900/30 bg-white border dark:border-slate-850 border-slate-200/80 p-8 rounded-2xl hover:-translate-y-1 transition-all duration-300 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-fuchsia-500/10 text-fuchsia-400 flex items-center justify-center mb-6">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold mb-3">BVRIT Vector Knowledge (RAG)</h3>
            <p className="text-xs dark:text-slate-400 text-slate-600 leading-relaxed">
              Queries semantic vector embeddings (FAISS / ChromaDB) pre-loaded with BVRIT academic guidelines, wellness catalogs, and counseling procedures.
            </p>
          </div>

          <div className="glass-card dark:bg-slate-900/30 bg-white border dark:border-slate-850 border-slate-200/80 p-8 rounded-2xl hover:-translate-y-1 transition-all duration-300 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6">
              <Heart className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold mb-3">Interactive Wellness Dashboards</h3>
            <p className="text-xs dark:text-slate-400 text-slate-600 leading-relaxed">
              Log daily moods, track stress curves, practice 4-7-8 breathing exercises, and access BVRIT technical student clubs and event hubs.
            </p>
          </div>
        </div>
      </section>

      {/* Student Testimonials (BVRIT Students) */}
      <section className="max-w-7xl mx-auto px-6 py-20 z-10 w-full border-t dark:border-slate-900 border-slate-200 bg-gradient-to-b from-indigo-500/5 to-transparent rounded-3xl p-8 sm:p-12">
        <div className="text-center mb-12 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
            Student Experiences
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold">What BVRIT Students Say About MindMate</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -4 }}
              className="glass-card dark:bg-slate-900/60 bg-white p-6 rounded-2xl border dark:border-slate-850 border-slate-200 flex flex-col justify-between shadow-sm"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {t.year}
                  </span>
                </div>
                <p className="text-xs italic dark:text-slate-300 text-slate-700 leading-relaxed">
                  "{t.quote}"
                </p>
              </div>

              <div className="pt-4 mt-4 border-t dark:border-slate-850 border-slate-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  {t.avatar}
                </div>
                <div>
                  <h4 className="font-bold text-xs dark:text-slate-200 text-slate-900">{t.name}</h4>
                  <p className="text-[10px] text-slate-500 truncate max-w-[180px]">{t.dept}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQs */}
      <section className="max-w-4xl mx-auto px-6 py-20 z-10 w-full">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((f, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div
                key={idx}
                className="glass-card dark:bg-slate-900/40 bg-white border dark:border-slate-850 border-slate-200 rounded-xl overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left focus:outline-none"
                >
                  <span className="font-semibold text-xs sm:text-sm dark:text-slate-200 text-slate-800">{f.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
                </button>
                <div
                  className={`px-6 transition-all duration-300 overflow-hidden ${
                    isOpen ? "pb-5 max-h-40 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <p className="text-xs dark:text-slate-400 text-slate-600 leading-relaxed pt-2 border-t dark:border-slate-850 border-slate-100">
                    {f.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t dark:border-slate-900 border-slate-200/80 bg-slate-900/20 py-12 z-10 mt-auto">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-500 to-indigo-600 flex items-center justify-center text-white">
                <Brain className="w-4.5 h-4.5" />
              </div>
              <span className="font-extrabold text-sm dark:text-slate-100 text-slate-950">MindMate AI @ BVRIT</span>
            </div>
            <p className="text-xs dark:text-slate-500 text-slate-400 leading-relaxed">
              Built specifically for B V Raju Institute of Technology (BVRIT), Narsapur. Combines Natural Language Pipelines, Semantic Vector RAG, and stress management tools.
            </p>
          </div>
          
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">BVRIT Campus Directory</h4>
            <div className="flex items-start gap-2 text-xs text-slate-500">
              <MapPin className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <span>Student Counseling Cell, BVRIT Campus, Narsapur, Medak District, Telangana - 502313.</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Mail className="w-3.5 h-3.5 text-indigo-400" /> wellness@bvrit.ac.in
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Student Emergency Disclaimer</h4>
            <p className="text-[11px] dark:text-slate-500 text-slate-400 leading-relaxed">
              If you are experiencing a mental health emergency, please contact your nearest healthcare provider, trusted family member, faculty mentor, or local emergency services immediately.
            </p>
          </div>
        </div>
        
        <div className="text-center text-[10px] dark:text-slate-600 text-slate-400 mt-10">
          &copy; {new Date().getFullYear()} MindMate AI - B V Raju Institute of Technology (BVRIT). All rights reserved.
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
