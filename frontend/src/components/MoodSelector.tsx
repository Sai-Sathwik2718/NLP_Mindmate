import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { AlertCircle, CheckCircle } from "lucide-react";

interface MoodSelectorProps {
  onLoggedSuccess?: () => void;
}

const MOODS = [
  { score: 1, label: "Sad", emoji: "😢", color: "text-blue-500 bg-blue-500/10 border-blue-500/30" },
  { score: 2, label: "Anxious", emoji: "😰", color: "text-amber-500 bg-amber-500/10 border-amber-500/30" },
  { score: 3, label: "Neutral", emoji: "😐", color: "text-slate-400 bg-slate-400/10 border-slate-400/30" },
  { score: 4, label: "Motivated", emoji: "🙂", color: "text-indigo-400 bg-indigo-400/10 border-indigo-400/30" },
  { score: 5, label: "Excited", emoji: "😄", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30" },
];

export const MoodSelector: React.FC<MoodSelectorProps> = ({ onLoggedSuccess }) => {
  const { api } = useApp();
  const [selectedMood, setSelectedMood] = useState<number>(3);
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMsg(null);

    try {
      await api.post("/mood", {
        mood_score: selectedMood,
        notes: notes.trim() || undefined,
      });

      setStatusMsg({ type: "success", text: "Mood recorded! Your mental health trends have been updated." });
      setNotes("");
      
      // Auto clear message after 3 seconds
      setTimeout(() => setStatusMsg(null), 3000);
      
      if (onLoggedSuccess) {
        onLoggedSuccess();
      }
    } catch (err: any) {
      console.error("Failed to log mood:", err);
      setStatusMsg({ type: "error", text: err.response?.data?.detail || "Failed to save mood log." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-slate-400 mb-4 text-center">
          How are you feeling right now?
        </label>
        
        {/* Emoji selection grid */}
        <div className="grid grid-cols-5 gap-3">
          {MOODS.map((m) => {
            const isSelected = selectedMood === m.score;
            return (
              <button
                key={m.score}
                type="button"
                onClick={() => setSelectedMood(m.score)}
                className={`
                  flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-300
                  ${isSelected 
                    ? `${m.color} scale-105 ring-2 ring-indigo-500/20 shadow-lg dark:bg-slate-800/80 bg-slate-100` 
                    : "border-transparent bg-slate-900/20 hover:bg-slate-900/40 text-slate-400 hover:scale-102"}
                `}
              >
                <span className="text-3xl mb-1 filter drop-shadow-sm select-none">{m.emoji}</span>
                <span className="text-xs font-medium">{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Optional journal notes */}
      <div>
        <label htmlFor="notes" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Add a brief note (What's on your mind?)
        </label>
        <textarea
          id="notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Studying is going hard today... or felt lonely at lunch..."
          className="w-full px-4 py-3 rounded-xl dark:bg-slate-950/60 bg-slate-100/50 border border-slate-800/60 dark:border-slate-800 border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 dark:text-slate-100 text-slate-900 placeholder-slate-500 text-sm resize-none"
        />
      </div>

      {/* Form status notification */}
      {statusMsg && (
        <div className={`p-3 rounded-xl flex items-start gap-2.5 text-sm leading-snug border ${
          statusMsg.type === "success" 
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
            : "bg-rose-500/10 border-rose-500/20 text-rose-400"
        }`}>
          {statusMsg.type === "success" ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Submission Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-600 hover:to-indigo-700 text-white font-medium text-sm transition-all duration-300 shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 focus:outline-none flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          "Save Mood Log"
        )}
      </button>
    </form>
  );
};
export default MoodSelector;
