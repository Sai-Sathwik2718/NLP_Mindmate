import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { GlassCard } from "../components/GlassCard";
import { EmotionBarChart, SentimentDoughnutChart } from "../components/VisualCharts";
import { 
  Users, Star, Shield, AlertTriangle, Trash2, UserX, UserCheck, 
  Plus, CheckCircle, RefreshCw, Activity 
} from "lucide-react";

interface AnalyticsData {
  summary: {
    total_users: number;
    total_chats: number;
    total_messages: number;
    dau: number;
    weekly_chats: number;
    monthly_chats: number;
    avg_mood: number;
    avg_rating: number;
    feedback_count: number;
    crisis_handled: number;
  };
  charts: {
    intents: Record<string, number>;
    sentiments: Record<string, number>;
    emotions: Record<string, number>;
    sources: Record<string, number>;
  };
  activity_feed: Array<{
    id: number;
    username: string;
    action: string;
    details: string;
    time: string;
  }>;
}

interface UserRecord {
  id: number;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  is_suspended: boolean;
  created_at: string;
}

interface FAQRecord {
  id: number;
  category: string;
  question: string;
  answer: string;
  keywords?: string;
  created_at: string;
}

export const AdminPanel: React.FC = () => {
  const { api, user } = useApp();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [faqs, setFaqs] = useState<FAQRecord[]>([]);
  
  // Tab control
  const [activeTab, setActiveTab] = useState<"analytics" | "users" | "faqs" | "logs">("analytics");
  
  // Loading & statuses
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // FAQ Form State
  const [faqCategory, setFaqCategory] = useState("");
  const [faqQuestion, setFaqQuestion] = useState("");
  const [faqAnswer, setFaqAnswer] = useState("");
  const [faqKeywords, setFaqKeywords] = useState("");
  const [submittingFaq, setSubmittingFaq] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, usersRes, faqsRes] = await Promise.all([
        api.get("/admin/analytics"),
        api.get("/admin/users"),
        api.get("/admin/dataset/faqs")
      ]);
      setAnalytics(analyticsRes.data);
      setUsers(usersRes.data);
      setFaqs(faqsRes.data);
    } catch (err) {
      console.error("Failed to load admin dataset:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const triggerMsg = (type: "success" | "error", text: string) => {
    setActionMsg({ type, text });
    setTimeout(() => setActionMsg(null), 3000);
  };

  // User Actions
  const handleToggleSuspend = async (userId: number, currentStatus: boolean) => {
    try {
      await api.put(`/admin/users/${userId}/status`, { is_suspended: !currentStatus });
      triggerMsg("success", `User account ${currentStatus ? "activated" : "suspended"} successfully.`);
      loadData();
    } catch (err: any) {
      triggerMsg("error", err.response?.data?.detail || "Failed to update user status.");
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm("Are you sure you want to permanently delete this user account? This deletes all associated chats.")) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      triggerMsg("success", "User account deleted successfully.");
      loadData();
    } catch (err: any) {
      triggerMsg("error", err.response?.data?.detail || "Failed to delete user.");
    }
  };

  // FAQ Actions
  const handleAddFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingFaq(true);
    try {
      await api.post("/admin/dataset/faqs", {
        category: faqCategory.trim(),
        question: faqQuestion.trim(),
        answer: faqAnswer.trim(),
        keywords: faqKeywords.trim() || undefined
      });
      triggerMsg("success", "FAQ added and RAG Vector space updated.");
      setFaqCategory("");
      setFaqQuestion("");
      setFaqAnswer("");
      setFaqKeywords("");
      loadData();
    } catch (err: any) {
      triggerMsg("error", err.response?.data?.detail || "Failed to add FAQ.");
    } finally {
      setSubmittingFaq(false);
    }
  };

  const handleDeleteFaq = async (faqId: number) => {
    if (!window.confirm("Delete this FAQ guide and rebuild the index?")) return;
    try {
      await api.delete(`/admin/dataset/faqs/${faqId}`);
      triggerMsg("success", "FAQ deleted and RAG Vector index updated.");
      loadData();
    } catch (err: any) {
      triggerMsg("error", err.response?.data?.detail || "Failed to delete FAQ.");
    }
  };

  const handleRetrainRAG = async () => {
    try {
      await api.post("/admin/dataset/retrain");
      triggerMsg("success", "RAG Vector embeddings rebuild triggered successfully.");
      loadData();
    } catch (err: any) {
      triggerMsg("error", "Failed to trigger retraining.");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      await api.post("/admin/dataset/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      triggerMsg("success", "Bulk dataset uploaded and index rebuilt successfully!");
      loadData();
    } catch (err: any) {
      triggerMsg("error", err.response?.data?.detail || "Failed bulk upload.");
    }
  };

  if (loading && !analytics) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center dark:bg-slate-950 bg-slate-50">
        <span className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 dot-grid dark:bg-slate-950 bg-slate-50 flex-1 w-full">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b dark:border-slate-850 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold dark:text-slate-100 text-slate-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-indigo-400" />
            Administrative Analytics Panel
          </h1>
          <p className="text-xs dark:text-slate-400 text-slate-500 mt-1 leading-relaxed">
            Monitor NLP accuracy rates, user demographics, logs, and seed RAG knowledge datasets.
          </p>
        </div>
        <button
          onClick={loadData}
          className="shrink-0 px-4 py-2 rounded-xl border dark:border-slate-800 border-slate-200 dark:bg-slate-900/40 bg-white hover:bg-slate-100 dark:hover:bg-slate-850 text-xs font-semibold flex items-center gap-1.5 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Data
        </button>
      </div>

      {/* Tabs Row */}
      <div className="flex border-b dark:border-slate-850 border-slate-200 gap-6">
        {["analytics", "users", "faqs", "logs"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`
              pb-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 focus:outline-none capitalize
              ${activeTab === tab 
                ? "border-indigo-500 text-indigo-400" 
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-350"}
            `}
          >
            {tab === "faqs" ? "RAG FAQ Dataset" : tab}
          </button>
        ))}
      </div>

      {/* Notification Toast */}
      {actionMsg && (
        <div className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 max-w-xl mx-auto shadow-md leading-normal ${
          actionMsg.type === "success" 
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
            : "bg-rose-500/10 border-rose-500/20 text-rose-400"
        }`}>
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{actionMsg.text}</span>
        </div>
      )}

      {/* TABS CONTENT */}
      {activeTab === "analytics" && analytics && (
        <div className="space-y-8">
          
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <GlassCard className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl dark:bg-indigo-500/10 bg-indigo-500/5 text-indigo-500 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-extrabold">{analytics.summary.total_users}</div>
                <div className="text-[10px] font-semibold text-slate-500">Total Registered Users</div>
              </div>
            </GlassCard>

            <GlassCard className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl dark:bg-emerald-500/10 bg-emerald-500/5 text-emerald-500 flex items-center justify-center shrink-0">
                <Activity className="w-5 h-5" style={{ width: "20px", height: "20px" }} />
              </div>
              <div>
                <div className="text-xl font-extrabold">{analytics.summary.dau}</div>
                <div className="text-[10px] font-semibold text-slate-500">Daily Active Users (DAU)</div>
              </div>
            </GlassCard>

            <GlassCard className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl dark:bg-amber-500/10 bg-amber-500/5 text-amber-500 flex items-center justify-center shrink-0">
                <Star className="w-5 h-5 fill-amber-500/10" />
              </div>
              <div>
                <div className="text-xl font-extrabold">{analytics.summary.avg_rating} / 5</div>
                <div className="text-[10px] font-semibold text-slate-500">Avg Satisfaction ({analytics.summary.feedback_count} reviews)</div>
              </div>
            </GlassCard>

            <GlassCard className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl dark:bg-rose-500/10 bg-rose-500/5 text-rose-500 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-extrabold">{analytics.summary.crisis_handled}</div>
                <div className="text-[10px] font-semibold text-slate-500">Crisis Triggers Intervened</div>
              </div>
            </GlassCard>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <GlassCard className="p-6">
              <h3 className="text-xs font-bold dark:text-slate-350 text-slate-700 uppercase tracking-wider mb-6 border-b dark:border-slate-800 pb-3">
                Sentiment Distribution (User Inbounds)
              </h3>
              <SentimentDoughnutChart sentiments={analytics.charts.sentiments} />
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="text-xs font-bold dark:text-slate-350 text-slate-700 uppercase tracking-wider mb-6 border-b dark:border-slate-800 pb-3">
                Detected User Emotion Frequencies
              </h3>
              <EmotionBarChart emotions={analytics.charts.emotions} />
            </GlassCard>
          </div>

          {/* Intent breakdown & response sources */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Top Intents Table */}
            <GlassCard className="p-6">
              <h3 className="text-xs font-bold dark:text-slate-350 text-slate-700 uppercase tracking-wider mb-4 border-b dark:border-slate-800 pb-2.5">
                Top Mental Health Intent Classifications
              </h3>
              <div className="space-y-3.5">
                {Object.keys(analytics.charts.intents).length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500">No intent entries recorded.</div>
                ) : (
                  Object.entries(analytics.charts.intents).map(([intent, count], idx) => (
                    <div key={intent} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-slate-300">{intent}</span>
                      </div>
                      <span className="font-bold px-2 py-0.5 rounded bg-slate-900 text-slate-400 border dark:border-slate-800">{count} hits</span>
                    </div>
                  ))
                )}
              </div>
            </GlassCard>

            {/* Response Routing Sources */}
            <GlassCard className="p-6">
              <h3 className="text-xs font-bold dark:text-slate-350 text-slate-700 uppercase tracking-wider mb-4 border-b dark:border-slate-800 pb-2.5">
                Response Generation Routing Metrics
              </h3>
              <div className="space-y-3.5">
                {Object.entries(analytics.charts.sources).map(([source, count]) => {
                  const labelMap: Record<string, string> = {
                    "crisis": "🚨 Crisis Helpline Intervention",
                    "faq": "📖 FAQ Keyword Direct Matches",
                    "semantic_search": "🤖 RAG Semantic Embedding Matches",
                    "template": "📝 Intent-Emotion Templated Replies",
                    "fallback": "🔄 Standard Conversational Fallback"
                  };
                  return (
                    <div key={source} className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-400">{labelMap[source] || source}</span>
                      <span className="font-bold px-2.5 py-0.5 rounded-full dark:bg-indigo-500/10 bg-indigo-500/5 text-indigo-400 border border-indigo-500/20">{count} responses</span>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          </div>

        </div>
      )}

      {/* TAB: USERS LIST */}
      {activeTab === "users" && (
        <GlassCard className="p-6 overflow-hidden">
          <h2 className="text-xs font-bold dark:text-slate-350 text-slate-700 uppercase tracking-wider mb-6 border-b dark:border-slate-800 pb-3">
            Registered Student & Admin Accounts
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b dark:border-slate-800 text-slate-500">
                  <th className="pb-3 font-semibold">Username</th>
                  <th className="pb-3 font-semibold">Email</th>
                  <th className="pb-3 font-semibold">Role</th>
                  <th className="pb-3 font-semibold">Joined Date</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-slate-850 divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-900/5 dark:hover:bg-slate-900/20">
                    <td className="py-3.5 font-bold capitalize">{u.username}</td>
                    <td className="py-3.5 text-slate-400">{u.email}</td>
                    <td className="py-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.role === "admin" ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" : "bg-slate-900 text-slate-400 border dark:border-slate-850"
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-500">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                        u.is_suspended ? "text-rose-500" : "text-emerald-500"
                      }`}>
                        {u.is_suspended ? "Suspended" : "Active"}
                      </span>
                    </td>
                    <td className="py-3.5 text-right space-x-2">
                      {u.id !== user?.id && (
                        <>
                          <button
                            onClick={() => handleToggleSuspend(u.id, u.is_suspended)}
                            className={`p-1.5 rounded-lg border transition-all inline-flex items-center ${
                              u.is_suspended 
                                ? "dark:bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20" 
                                : "dark:bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20"
                            }`}
                            title={u.is_suspended ? "Activate account" : "Suspend account"}
                          >
                            {u.is_suspended ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-1.5 rounded-lg border dark:bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all inline-flex items-center"
                            title="Delete account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {/* TAB: RAG DATASET EDIT */}
      {activeTab === "faqs" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Add FAQ form */}
          <div className="lg:col-span-1">
            <GlassCard className="p-6">
              <h3 className="text-xs font-bold dark:text-slate-350 text-slate-700 uppercase tracking-wider mb-6 border-b dark:border-slate-800 pb-3 flex items-center justify-between flex-wrap gap-2">
                <span>Add FAQ / Guide</span>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/25 flex items-center gap-1 hover:bg-emerald-500/20 transition-all">
                    Upload CSV/JSON
                    <input type="file" accept=".csv,.json" onChange={handleFileUpload} className="hidden" />
                  </label>
                  <button
                    type="button"
                    onClick={handleRetrainRAG}
                    className="px-2 py-1 rounded bg-indigo-500/10 text-indigo-400 text-[10px] font-bold border border-indigo-500/25 flex items-center gap-1 hover:bg-indigo-500/20 transition-all focus:outline-none"
                    title="Force embeddings refresh"
                  >
                    <RefreshCw className="w-3 h-3" /> Rebuild
                  </button>
                </div>
              </h3>

              <form onSubmit={handleAddFaq} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Category</label>
                  <input
                    type="text"
                    required
                    value={faqCategory}
                    onChange={(e) => setFaqCategory(e.target.value)}
                    placeholder="Stress, Sleep, Career..."
                    className="w-full px-3 py-2.5 rounded-xl dark:bg-slate-950/60 bg-slate-100 border dark:border-slate-850 border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 text-xs dark:text-slate-100 text-slate-900 placeholder-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Question</label>
                  <input
                    type="text"
                    required
                    value={faqQuestion}
                    onChange={(e) => setFaqQuestion(e.target.value)}
                    placeholder="How do I beat final exam stress?"
                    className="w-full px-3 py-2.5 rounded-xl dark:bg-slate-950/60 bg-slate-100 border dark:border-slate-850 border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 text-xs dark:text-slate-100 text-slate-900 placeholder-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Answer (RAG Source Text)</label>
                  <textarea
                    required
                    rows={5}
                    value={faqAnswer}
                    onChange={(e) => setFaqAnswer(e.target.value)}
                    placeholder="Break study blocks into Pomodoro sessions... get plenty of rest..."
                    className="w-full px-3 py-2.5 rounded-xl dark:bg-slate-950/60 bg-slate-100 border dark:border-slate-850 border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 text-xs dark:text-slate-100 text-slate-900 placeholder-slate-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Keywords (Comma Separated)</label>
                  <input
                    type="text"
                    value={faqKeywords}
                    onChange={(e) => setFaqKeywords(e.target.value)}
                    placeholder="exam, studies, midterms"
                    className="w-full px-3 py-2.5 rounded-xl dark:bg-slate-950/60 bg-slate-100 border dark:border-slate-850 border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 text-xs dark:text-slate-100 text-slate-900 placeholder-slate-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingFaq}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-600 hover:to-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/10 flex items-center justify-center gap-1.5 focus:outline-none"
                >
                  <Plus className="w-4 h-4" /> Add FAQ Card
                </button>
              </form>
            </GlassCard>
          </div>

          {/* FAQs List Table */}
          <div className="lg:col-span-2">
            <GlassCard className="p-6">
              <h3 className="text-xs font-bold dark:text-slate-350 text-slate-700 uppercase tracking-wider mb-6 border-b dark:border-slate-800 pb-3">
                Wellness Guides FAQ Catalog ({faqs.length} articles)
              </h3>
              
              <div className="space-y-4 max-h-[34rem] overflow-y-auto pr-2">
                {faqs.map((faq) => (
                  <div
                    key={faq.id}
                    className="p-4 rounded-xl dark:bg-slate-950/40 bg-slate-100/50 border dark:border-slate-850 border-slate-200 flex justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
                          {faq.category}
                        </span>
                        {faq.keywords && (
                          <span className="text-[9px] text-slate-500">Keywords: {faq.keywords}</span>
                        )}
                      </div>
                      <h4 className="font-bold text-xs dark:text-slate-250 text-slate-800 mt-2">{faq.question}</h4>
                      <p className="text-[11px] dark:text-slate-400 text-slate-600 mt-1 leading-normal whitespace-pre-line">{faq.answer}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteFaq(faq.id)}
                      className="shrink-0 p-1.5 rounded-lg border dark:bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all h-fit"
                      title="Delete FAQ"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

        </div>
      )}

      {/* TAB: SYSTEM AUDIT LOGS */}
      {activeTab === "logs" && analytics && (
        <GlassCard className="p-6">
          <h2 className="text-xs font-bold dark:text-slate-350 text-slate-700 uppercase tracking-wider mb-6 border-b dark:border-slate-800 pb-3">
            System Security & Activity Audit Log Feed
          </h2>
          <div className="space-y-3 font-mono text-[10px] leading-relaxed max-h-[30rem] overflow-y-auto">
            {analytics.activity_feed.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded bg-slate-900/60 dark:bg-slate-950/60 border dark:border-slate-850 border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-slate-500">[{log.time}]</span>
                  <span className="text-indigo-400 capitalize font-semibold">{log.username}:</span>
                  <span className="text-slate-400 uppercase font-bold shrink-0">{log.action}</span>
                  <span className="text-slate-300 font-sans">{log.details}</span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

    </div>
  );
};

export default AdminPanel;
