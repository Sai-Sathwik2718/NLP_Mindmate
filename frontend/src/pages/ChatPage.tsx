import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import { 
  Plus, MessageSquare, Trash2, Send, Download, Search, Info, 
  Star, ChevronRight, User as UserIcon, Brain 
} from "lucide-react";

interface Message {
  id: number;
  chat_id: number;
  sender: "user" | "bot";
  content: string;
  timestamp: string;
  intent?: string;
  intent_confidence?: number;
  sentiment?: string;
  sentiment_confidence?: number;
  emotion?: string;
  emotion_confidence?: number;
  matched_faq_id?: number;
  is_crisis: boolean;
  response_source?: string;
  citation?: string;
}

export const ChatPage: React.FC = () => {
  const { 
    api, user, chatSessions, activeChatId, 
    setActiveChatId, refreshSessions 
  } = useApp();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [ratedMessages, setRatedMessages] = useState<Record<number, number>>({});
  
  // Ref for auto-scroll
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch messages when activeChatId changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (!activeChatId) {
        setMessages([]);
        return;
      }
      setLoadingMessages(true);
      try {
        const res = await api.get(`/chat/${activeChatId}/messages`);
        setMessages(res.data);
      } catch (err) {
        console.error("Failed to load messages:", err);
      } finally {
        setLoadingMessages(false);
      }
    };
    fetchMessages();
  }, [activeChatId]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleCreateChat = async () => {
    try {
      const res = await api.post("/chat/sessions", { title: "New Chat Session" });
      const newChat = res.data;
      setActiveChatId(newChat.id);
      await refreshSessions();
    } catch (err) {
      console.error("Failed to create chat session:", err);
    }
  };

  const handleDeleteChat = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this chat session?")) return;
    try {
      await api.delete(`/chat/sessions/${id}`);
      if (activeChatId === id) {
        setActiveChatId(null);
      }
      await refreshSessions();
    } catch (err) {
      console.error("Failed to delete chat session:", err);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || !activeChatId) return;
    
    // Add user message to UI immediately
    const tempUserMsg: Message = {
      id: Date.now(),
      chat_id: activeChatId,
      sender: "user",
      content: text,
      timestamp: new Date().toISOString(),
      is_crisis: false,
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setInputText("");
    setIsTyping(true);

    try {
      const res = await api.post(`/chat/${activeChatId}/messages`, { content: text });
      
      // Add bot message
      setMessages((prev) => [...prev, res.data]);
      
      // Update session title in sidebar if it changed from default
      refreshSessions();
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFeedback = async (messageId: number, rating: number) => {
    try {
      await api.post("/feedback", {
        message_id: messageId,
        rating: rating,
        comment: "Rated via quick stars UI"
      });
      setRatedMessages((prev) => ({ ...prev, [messageId]: rating }));
    } catch (err) {
      console.error("Failed to submit feedback:", err);
    }
  };

  const handleExport = () => {
    if (!activeChatId) return;
    // Route to direct browser download API
    const token = localStorage.getItem("mm_token");
    window.open(`http://localhost:8000/api/v1/chat/${activeChatId}/export?token=${token}`, "_blank");
  };

  // Perform search query filtering
  const filteredSessions = chatSessions.filter((session) =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeSession = chatSessions.find((s) => s.id === activeChatId);

  // Recommendation Quick replies depending on active intent of last message
  const lastBotMessage = [...messages].reverse().find(m => m.sender === "bot");
  const quickReplies = lastBotMessage?.is_crisis
    ? ["I need help", "Helpline Info"]
    : lastBotMessage?.intent === "Exam Stress"
    ? ["Let's do Pomodoro tips", "Beat test anxiety", "I have sleep issues"]
    : lastBotMessage?.intent === "Stress"
    ? ["Give me a breathing exercise", "Study breaks somatic", "Journaling tips"]
    : lastBotMessage?.intent === "Anxiety"
    ? ["Mindfulness grounding", "Calm my panic", "Need positive affirmations"]
    : ["I am stressed", "Let's do a breathing exercise", "Can't sleep tonight"];

  return (
    <div className="flex-1 flex overflow-hidden h-[calc(100vh-4rem)] dark:bg-slate-950 bg-slate-50">
      
      {/* Sidebar: Chat List */}
      <aside className="w-80 border-r dark:border-slate-800/80 border-slate-200 bg-white dark:bg-slate-950 flex flex-col shrink-0">
        
        {/* Search & Actions */}
        <div className="p-4 space-y-3">
          <button
            onClick={handleCreateChat}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-600 hover:to-indigo-700 text-white font-semibold text-xs transition-all hover:scale-101 flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/10"
          >
            <Plus className="w-4 h-4" /> New Support Chat
          </button>
          
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search chat history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl dark:bg-slate-900/60 bg-slate-100/50 border dark:border-slate-850 border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 text-xs dark:text-slate-100 text-slate-850 placeholder-slate-500"
            />
          </div>
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1.5 pb-4">
          {filteredSessions.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No sessions found.
            </div>
          ) : (
            filteredSessions.map((session) => {
              const isActive = session.id === activeChatId;
              return (
                <div
                  key={session.id}
                  onClick={() => setActiveChatId(session.id)}
                  className={`
                    group p-3 rounded-xl cursor-pointer transition-all duration-200 flex items-center justify-between border
                    ${isActive 
                      ? "dark:bg-slate-900/80 bg-slate-100 border-indigo-500/40 text-indigo-400 font-semibold" 
                      : "border-transparent dark:text-slate-300 text-slate-700 hover:bg-slate-900/30 hover:border-slate-800/40"}
                  `}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <MessageSquare className={`w-4 h-4 shrink-0 ${isActive ? "text-indigo-400 animate-pulse" : "text-slate-500"}`} />
                    <span className="text-xs truncate">{session.title}</span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteChat(session.id, e)}
                    className="p-1 rounded-md text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-200"
                    title="Delete Conversation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Chat Window */}
      <section className="flex-1 flex flex-col relative overflow-hidden dark:bg-slate-950 bg-slate-50">
        
        {activeChatId ? (
          <>
            {/* Chat Header */}
            <div className="h-16 px-6 border-b dark:border-slate-800/80 border-slate-200 flex items-center justify-between dark:bg-slate-950 bg-white">
              <div>
                <h2 className="text-xs font-bold dark:text-slate-200 text-slate-800 truncate max-w-sm sm:max-w-md">
                  {activeSession?.title}
                </h2>
                <div className="text-[9px] text-indigo-400 font-semibold uppercase tracking-wider">
                  MindMate AI - BVRIT Student Support Assistant
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleExport}
                  className="px-3 py-1.5 rounded-lg border dark:border-slate-800 border-slate-200 dark:bg-slate-900/40 bg-slate-100 hover:bg-slate-200 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
                  title="Export chat transcript"
                >
                  <Download className="w-3.5 h-3.5" /> Export
                </button>
              </div>
            </div>

            {/* Message Feed */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              
              {loadingMessages ? (
                <div className="h-full flex items-center justify-center">
                  <span className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                </div>
              ) : (
                messages.map((msg) => {
                  const isBot = msg.sender === "bot";
                  const rating = ratedMessages[msg.id] || 0;
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3.5 max-w-3xl ${isBot ? "" : "ml-auto flex-row-reverse"}`}
                    >
                      {/* Avatar */}
                      <div className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        isBot 
                          ? "bg-gradient-to-tr from-brand-500 to-indigo-600 text-white shadow shadow-indigo-500/20" 
                          : "dark:bg-slate-800 bg-slate-200 dark:text-slate-200 text-slate-700"
                      }`}>
                        {isBot ? <Brain className="w-4.5 h-4.5" /> : (user?.username ? user.username.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />)}
                      </div>

                      {/* Text box */}
                      <div className="space-y-2 max-w-[85%]">
                        <div className={`
                          px-4 py-3 rounded-2xl text-xs leading-relaxed
                          ${isBot 
                            ? "dark:bg-slate-900/50 bg-white border dark:border-slate-850 border-slate-200 shadow-sm text-slate-800 dark:text-slate-200" 
                            : "bg-gradient-to-r from-brand-500 to-indigo-600 text-white shadow-md shadow-indigo-500/10"}
                        `}>
                          {/* Parse simple markdown/linebreaks */}
                          <div className="whitespace-pre-line">{msg.content}</div>
                          
                          {/* Citation box if RAG search matched */}
                          {isBot && msg.citation && (
                            <div className="mt-3 pt-2.5 border-t dark:border-slate-800/80 border-slate-100 flex items-center gap-1.5 text-[10px] text-indigo-400 font-semibold">
                              <Info className="w-3.5 h-3.5 shrink-0" />
                              <span>Source: {msg.citation}</span>
                            </div>
                          )}
                        </div>

                        {/* Rating widget (only on bot messages) */}
                        {isBot && !msg.is_crisis && (
                          <div className="flex items-center gap-1.5 pl-1">
                            <span className="text-[10px] text-slate-500 font-medium">Was this helpful?</span>
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => {
                                const isHighlighted = rating >= star;
                                return (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => handleFeedback(msg.id, star)}
                                    disabled={rating > 0}
                                    className={`p-0.5 transition-colors focus:outline-none ${
                                      isHighlighted 
                                        ? "text-amber-400 hover:text-amber-400" 
                                        : "text-slate-600 hover:text-amber-400"
                                    }`}
                                  >
                                    <Star className={`w-3 h-3 ${isHighlighted ? "fill-amber-400" : ""}`} />
                                  </button>
                                );
                              })}
                            </div>
                            {rating > 0 && (
                              <span className="text-[9px] text-emerald-500 font-semibold">Thanks for feedback!</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {/* Bot typing bubble */}
              {isTyping && (
                <div className="flex gap-3.5 max-w-xl">
                  <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-tr from-brand-500 to-indigo-600 text-white flex items-center justify-center shadow shadow-indigo-500/20 shrink-0">
                    <Brain className="w-4.5 h-4.5" />
                  </div>
                  <div className="px-4 py-3.5 rounded-2xl dark:bg-slate-900/50 bg-white border dark:border-slate-850 border-slate-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick replies chips */}
            {messages.length > 0 && !isTyping && (
              <div className="px-6 py-2 flex flex-wrap gap-2 justify-center bg-slate-950/10">
                {quickReplies.map((reply, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(reply)}
                    className="px-3 py-1.5 rounded-full dark:bg-slate-900/60 bg-white hover:bg-indigo-500/5 dark:hover:bg-indigo-500/5 border dark:border-slate-850 border-slate-200 text-slate-600 dark:text-slate-350 text-[10px] font-medium transition-all hover:scale-102 flex items-center gap-0.5 focus:outline-none"
                  >
                    {reply} <ChevronRight className="w-3 h-3 text-slate-500" />
                  </button>
                ))}
              </div>
            )}

            {/* Input Bar */}
            <div className="p-4 border-t dark:border-slate-900 border-slate-200 dark:bg-slate-950 bg-white">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage(inputText);
                }}
                className="flex gap-3"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type your message... e.g. 'I have severe exam stress'"
                  className="flex-1 px-4 py-3 rounded-xl dark:bg-slate-900/60 bg-slate-100/50 border dark:border-slate-850 border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 text-xs dark:text-slate-100 text-slate-900 placeholder-slate-500"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="px-4.5 py-3 rounded-xl bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-600 hover:to-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/10 transition-all flex items-center justify-center focus:outline-none disabled:opacity-50 disabled:pointer-events-none"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center dot-grid">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-6 animate-pulse">
              <Brain className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold dark:text-slate-200 text-slate-800 mb-2">Select a Wellness Chat Session</h2>
            <p className="text-xs dark:text-slate-400 text-slate-500 max-w-sm leading-relaxed mb-6">
              Create a new conversation or choose an existing support timeline from the sidebar to chat with MindMate.
            </p>
            <button
              onClick={handleCreateChat}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-600 hover:to-indigo-700 text-white font-semibold text-xs shadow-lg shadow-indigo-600/15 flex items-center gap-1.5 transition-transform hover:scale-102"
            >
              <Plus className="w-4 h-4" /> Start New Chat
            </button>
          </div>
        )}
      </section>

    </div>
  );
};

export default ChatPage;
