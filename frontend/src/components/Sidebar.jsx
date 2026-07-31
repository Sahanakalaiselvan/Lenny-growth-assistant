import React, { useState } from 'react';
import { Plus, MessageSquare, Trash2, Cpu, Cloud, Sparkles, Database, Search, Settings } from 'lucide-react';

export default function Sidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  config,
  provider,
  onToggleProvider,
  onOpenKeyModal
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSessions = sessions.filter(s =>
    s.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <aside className="w-80 h-full bg-[#0c1220] border-r border-slate-800/80 flex flex-col justify-between select-none">
      {/* Top Branding & New Chat */}
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-wide bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
              Lenny Growth AI
            </h1>
            <p className="text-[11px] text-indigo-400/80 font-medium">Lenny's Podcast Advisor</p>
          </div>
        </div>

        <button
          onClick={onNewChat}
          className="w-full py-3 px-4 glow-btn flex items-center justify-center gap-2 text-sm font-semibold tracking-wide"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Growth Chat</span>
        </button>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search sessions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-800 text-xs text-slate-200 pl-9 pr-3 py-2 rounded-xl focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Session History List */}
      <div className="flex-1 overflow-y-auto px-3 space-y-1">
        <div className="px-3 py-1 text-[11px] font-semibold text-slate-500 tracking-wider uppercase">
          Conversations ({filteredSessions.length})
        </div>
        
        {filteredSessions.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 font-medium">
            No active chats found. Start a new session above!
          </div>
        ) : (
          filteredSessions.map((s) => {
            const isActive = s.id === activeSessionId;
            return (
              <div
                key={s.id}
                onClick={() => onSelectSession(s.id)}
                className={`group relative flex items-center justify-between p-3 rounded-xl cursor-pointer text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-900/50 to-purple-900/30 text-white border border-indigo-500/40 shadow-md shadow-indigo-950/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate pr-2">
                  <MessageSquare className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                  <span className="truncate">{s.title || 'Untitled Chat'}</span>
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(s.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 transition-opacity"
                  title="Delete chat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom LLM Engine Config & Status */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            LLM Engine Selector
          </span>
          <button
            type="button"
            onClick={onOpenKeyModal}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-indigo-400 transition-colors"
            title="Configure Cloud API Keys"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-2 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => onToggleProvider('ollama')}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
              provider === 'ollama'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Local Ollama</span>
          </button>
          
          <button
            type="button"
            onClick={() => onToggleProvider('cloud')}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
              provider === 'cloud'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-1 ring-purple-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Cloud</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenKeyModal}
          className="w-full text-center text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors pt-0.5 block"
        >
          ⚙️ Configure API Keys
        </button>

        {/* Database & RAG Status Footer */}
        <div className="px-2 pt-1 flex items-center justify-between text-[11px] text-slate-500 font-medium border-t border-slate-800/50">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <Database className="w-3 h-3" />
            <span>Postgres DB</span>
          </div>
          <span className="text-slate-400">RAG: {config?.rag_chunk_count || 1200}+ chunks</span>
        </div>
      </div>
    </aside>
  );
}

