import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, BookOpen, Layers, FileText, Layout, User, Bot, Loader2, ArrowRight } from 'lucide-react';
import { marked } from 'marked';

export default function ChatWindow({
  messages,
  onSendMessage,
  isLoading,
  onOpenArtifact,
  activeArtifactId
}) {
  const [inputText, setInputText] = useState('');
  const [isShip30Mode, setIsShip30Mode] = useState(false);
  const [isArtifactMode, setIsArtifactMode] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    
    onSendMessage({
      message: inputText.trim(),
      isShip30: isShip30Mode,
      isArtifactRequest: isArtifactMode
    });
    
    setInputText('');
    setIsShip30Mode(false);
    setIsArtifactMode(false);
  };

  const handleQuickPrompt = (promptText, ship30 = false, artifact = false) => {
    if (isLoading) return;
    onSendMessage({
      message: promptText,
      isShip30: ship30,
      isArtifactRequest: artifact
    });
  };

  return (
    <div className="flex-1 h-full flex flex-col justify-between bg-[#080c16] relative overflow-hidden">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-10 left-1/3 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 z-10">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center space-y-8 py-12">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-xl shadow-indigo-500/20">
              <Sparkles className="w-8 h-8 text-white animate-pulse" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
                What product or growth question do you have today?
              </h2>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                Synthesizing knowledge across 300+ transcripts from *Lenny's Podcast* (Brian Chesky, Elena Verna, Shreyas Doshi, Marty Cagan & more).
              </p>
            </div>

            {/* Quick Suggestion Pills */}
            <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
              <button
                onClick={() => handleQuickPrompt("What did Brian Chesky say about founder-led product details?")}
                className="p-4 rounded-2xl bg-slate-900/80 hover:bg-indigo-950/60 border border-slate-800 hover:border-indigo-500/40 text-left transition-all group"
              >
                <div className="flex items-center justify-between text-indigo-400 text-xs font-semibold mb-1">
                  <span>Q&A Insight</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-xs text-slate-200 font-medium">Brian Chesky on Founder-Led Product Details</p>
              </button>

              <button
                onClick={() => handleQuickPrompt("Write a Ship30for30 essay on User Activation & Retention Loops", true, false)}
                className="p-4 rounded-2xl bg-slate-900/80 hover:bg-purple-950/60 border border-slate-800 hover:border-purple-500/40 text-left transition-all group"
              >
                <div className="flex items-center justify-between text-purple-400 text-xs font-semibold mb-1">
                  <span>Ship30for30 Skill</span>
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <p className="text-xs text-slate-200 font-medium">Essay on User Activation & Retention Loops</p>
              </button>

              <button
                onClick={() => handleQuickPrompt("Generate an interactive HTML PLG Growth Dashboard Artifact", false, true)}
                className="p-4 rounded-2xl bg-slate-900/80 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/40 text-left transition-all group"
              >
                <div className="flex items-center justify-between text-cyan-400 text-xs font-semibold mb-1">
                  <span>Artifact Generator</span>
                  <Layout className="w-3.5 h-3.5" />
                </div>
                <p className="text-xs text-slate-200 font-medium">Interactive PLG Dashboard UI Artifact</p>
              </button>

              <button
                onClick={() => handleQuickPrompt("What are Elena Verna's key growth metrics for Product-Led Growth?")}
                className="p-4 rounded-2xl bg-slate-900/80 hover:bg-emerald-950/60 border border-slate-800 hover:border-emerald-500/40 text-left transition-all group"
              >
                <div className="flex items-center justify-between text-emerald-400 text-xs font-semibold mb-1">
                  <span>Guest Deep-Dive</span>
                  <BookOpen className="w-3.5 h-3.5" />
                </div>
                <p className="text-xs text-slate-200 font-medium">Elena Verna's PLG Growth Metrics</p>
              </button>
            </div>
          </div>
        ) : (
          messages.map((m, idx) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={m.id || idx}
                className={`flex gap-4 max-w-4xl mx-auto ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shrink-0 mt-1 shadow-md shadow-indigo-600/30">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`space-y-3 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`p-4 rounded-2xl ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-600/20'
                        : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none shadow-xl'
                    }`}
                  >
                    {isUser ? (
                      <p className="text-sm font-medium whitespace-pre-wrap">{m.content}</p>
                    ) : (
                      <div
                        className="markdown-body"
                        dangerouslySetInnerHTML={{ __html: marked.parse(m.content || '') }}
                      />
                    )}
                  </div>

                  {/* Transcript Sources Citation Badge */}
                  {!isUser && m.sources && m.sources.length > 0 && (() => {
                    const uniqueSources = Array.from(
                      new Map(m.sources.map(s => [`${s.guest}-${s.title}`, s])).values()
                    );
                    return (
                      <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/20 space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                          <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Lenny's Podcast Transcript Citations:</span>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {uniqueSources.map((src, sIdx) => (
                            <span
                              key={sIdx}
                              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-indigo-500/30 text-[11px] text-indigo-200 font-medium"
                              title={src.snippet}
                            >
                              🎙️ {src.guest} ({src.title})
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Artifact Side-by-Side Trigger Button */}
                  {!isUser && m.artifact_id && (
                    <button
                      onClick={() => onOpenArtifact(m.artifact_id)}
                      className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all shadow-md ${
                        activeArtifactId === m.artifact_id
                          ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white border-cyan-400 shadow-cyan-500/20'
                          : 'bg-slate-900 hover:bg-slate-850 text-cyan-300 border-cyan-500/40 hover:border-cyan-400'
                      }`}
                    >
                      <Layout className="w-4 h-4 text-cyan-300" />
                      <span>View Generated Artifact Side-by-Side</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 shrink-0 mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Streaming / Thinking State Indicator */}
        {isLoading && (
          <div className="flex gap-4 max-w-4xl mx-auto">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shrink-0 mt-1">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-300 flex items-center gap-3">
              <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
              <span className="text-xs font-semibold text-slate-400">
                Searching Lenny's Podcast Transcripts & Synthesizing Response...
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Floating Prompt Input Bar */}
      <div className="p-4 bg-[#080c16]/90 border-t border-slate-800/80 backdrop-blur-lg z-20">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-2">
          {/* Skill & Mode Toggles */}
          <div className="flex items-center gap-2 px-1">
            <button
              type="button"
              onClick={() => setIsShip30Mode(!isShip30Mode)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                isShip30Mode
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Ship30for30 Skill</span>
            </button>

            <button
              type="button"
              onClick={() => setIsArtifactMode(!isArtifactMode)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                isArtifactMode
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Layout className="w-3.5 h-3.5" />
              <span>Generate Artifact</span>
            </button>
          </div>

          {/* Textarea Input Container */}
          <div className="relative flex items-center bg-slate-900/90 rounded-2xl border border-slate-700/80 focus-within:border-indigo-500 shadow-xl transition-all">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder={
                isShip30Mode
                  ? "Describe the topic for your 1,100–1,300 word Ship30for30 essay..."
                  : isArtifactMode
                  ? "Describe the HTML component or Markdown document artifact to generate..."
                  : "Ask a product management or growth question based on Lenny's Podcast..."
              }
              rows={1}
              className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 px-4 py-3.5 pr-14 focus:outline-none resize-none max-h-32 min-h-[48px]"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="absolute right-2 p-2.5 glow-btn rounded-xl disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
