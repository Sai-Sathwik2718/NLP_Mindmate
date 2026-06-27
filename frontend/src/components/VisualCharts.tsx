import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Helper to check dark mode state
const isDark = () => document.documentElement.classList.contains("dark");

// --- 1. Mood Timeline Chart (Line) ---
interface MoodLineChartProps {
  timeline: Array<{ date: string; score: number; notes?: string }>;
}

export const MoodLineChart: React.FC<MoodLineChartProps> = ({ timeline }) => {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
        No mood entries found. Log your mood to see trends!
      </div>
    );
  }

  const data = {
    labels: timeline.map((t) => t.date),
    datasets: [
      {
        label: "Mood Score",
        data: timeline.map((t) => t.score),
        borderColor: "#6366f1", // Indigo-500
        backgroundColor: "rgba(99, 102, 241, 0.15)",
        borderWidth: 3,
        tension: 0.35,
        fill: true,
        pointBackgroundColor: "#4f46e5",
        pointBorderColor: "#fff",
        pointHoverRadius: 6,
        pointRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const index = context.dataIndex;
            const score = context.raw;
            const note = timeline[index]?.notes;
            const labels = ["Sad 😢", "Anxious 😰", "Neutral 😐", "Motivated 🙂", "Excited 😄"];
            const scoreLabel = labels[score - 1] || score;
            return [`Mood: ${scoreLabel}`, note ? `Note: "${note}"` : "No notes logged."];
          },
        },
      },
    },
    scales: {
      y: {
        min: 1,
        max: 5,
        ticks: {
          stepSize: 1,
          callback: (value: any) => {
            const labels = ["😢", "😰", "😐", "🙂", "😄"];
            return labels[value - 1] || value;
          },
          color: isDark() ? "#94a3b8" : "#475569",
        },
        grid: {
          color: isDark() ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
        },
      },
      x: {
        ticks: {
          color: isDark() ? "#94a3b8" : "#475569",
        },
        grid: {
          display: false,
        },
      },
    },
  };

  return <div className="h-64"><Line data={data} options={options} /></div>;
};


// --- 2. Emotion Frequency Chart (Bar) ---
interface EmotionBarChartProps {
  emotions: Record<string, number>;
}

export const EmotionBarChart: React.FC<EmotionBarChartProps> = ({ emotions }) => {
  const labels = Object.keys(emotions);
  const values = Object.values(emotions);

  if (labels.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
        No conversation data yet. Send messages to see emotion logs.
      </div>
    );
  }

  // Capitalize labels
  const prettyLabels = labels.map((l) => l.charAt(0).toUpperCase() + l.slice(1));

  const data = {
    labels: prettyLabels,
    datasets: [
      {
        data: values,
        backgroundColor: [
          "rgba(16, 185, 129, 0.65)", // happy: emerald
          "rgba(59, 130, 246, 0.65)",  // sad: blue
          "rgba(239, 68, 68, 0.65)",   // angry: red
          "rgba(245, 158, 11, 0.65)",  // anxious: amber
          "rgba(99, 102, 241, 0.65)",  // depressed: indigo
          "rgba(217, 70, 239, 0.65)",  // excited: fuchsia
          "rgba(100, 116, 139, 0.65)", // neutral: slate
          "rgba(236, 72, 153, 0.65)",  // fear: pink
          "rgba(20, 184, 166, 0.65)"   // confused: teal
        ],
        borderColor: [
          "#10b981", "#3b82f6", "#ef4444", "#f59e0b", "#6366f1", "#d946ef", "#64748b", "#ec4899", "#14b8a6"
        ],
        borderWidth: 1.5,
        borderRadius: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          color: isDark() ? "#94a3b8" : "#475569",
        },
        grid: {
          color: isDark() ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
        },
      },
      x: {
        ticks: {
          color: isDark() ? "#94a3b8" : "#475569",
        },
        grid: {
          display: false,
        },
      },
    },
  };

  return <div className="h-64"><Bar data={data} options={options} /></div>;
};


// --- 3. Sentiment Doughnut Chart ---
interface SentimentDoughnutChartProps {
  sentiments: Record<string, number>;
}

export const SentimentDoughnutChart: React.FC<SentimentDoughnutChartProps> = ({ sentiments }) => {
  const labels = Object.keys(sentiments);
  const values = Object.values(sentiments);

  if (labels.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
        No sentiment logs. Start chatting to view data!
      </div>
    );
  }

  const data = {
    labels: labels,
    datasets: [
      {
        data: values,
        backgroundColor: [
          "rgba(16, 185, 129, 0.7)",  // Positive: emerald
          "rgba(239, 68, 68, 0.7)",   // Negative: red
          "rgba(100, 116, 139, 0.7)", // Neutral: slate
        ],
        borderColor: ["#10b981", "#ef4444", "#64748b"],
        borderWidth: 1.5,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          color: isDark() ? "#e2e8f0" : "#0f172a",
          padding: 15,
          font: {
            size: 11,
          },
        },
      },
    },
    cutout: "70%",
  };

  return <div className="h-64"><Doughnut data={data} options={options} /></div>;
};
