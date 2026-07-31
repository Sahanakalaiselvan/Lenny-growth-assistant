import React, { useState } from 'react';
import { Sparkles, Edit2, Check, PanelRightOpen, PanelRightClose, BookOpen, Layers } from 'lucide-react';

export default function Header({
  activeSession,
  onUpdateTitle,
  isArtifactPanelOpen,
  onToggleArtifactPanel,
  hasArtifacts,
  provider
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [titleText, setTitleText] = useState(activeSession?.title || '');

  const handleSave = () => {
    if (titleText.trim() && activeSession) {
      onUpdateTitle(activeSession.id, titleText.trim());
    }
    setIsEditing(false);
  };

  return (
    <header className="h-16 border-b border-slate-800/80 bg-[#0c1220]/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
      {/* Session Title & Inline Edit */}
      <div className="flex items-center gap-3">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={titleText}
              onChange={(e) => setTitleText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              className="bg-slate-900 border border-indigo-500 text-sm text-white px-3 py-1 rounded-lg focus:outline-none"
              autoFocus
            />
            <button
              onClick={handleSave}
              className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditing(true)}>
            <h2 className="text-base font-bold text-slate-100 tracking-wide group-hover:text-indigo-400 transition-colors">
              {activeSession?.title || 'Growth Strategy Chat'}
            </h2>
            <Edit2 className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
      </div>

      {/* Right Badges & Controls */}
      <div className="flex items-center gap-3">
        {/* RAG Knowledge Base Indicator */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
          <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
          <span>Lenny's Transcripts RAG</span>
        </div>

        {/* Model Indicator Pill */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-300 text-xs font-semibold">
          <Layers className="w-3.5 h-3.5 text-purple-400" />
          <span>{provider === 'cloud' ? 'Claude' : 'Local Ollama'}</span>
        </div>

        {/* Artifact Viewer Toggle */}
        <button
          onClick={onToggleArtifactPanel}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
            isArtifactPanelOpen
              ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/30'
              : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600'
          }`}
        >
          {isArtifactPanelOpen ? (
            <PanelRightClose className="w-4 h-4 text-white" />
          ) : (
            <PanelRightOpen className="w-4 h-4 text-indigo-400" />
          )}
          <span>Artifact Workspace</span>
          {hasArtifacts && (
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          )}
        </button>
      </div>
    </header>
  );
}
