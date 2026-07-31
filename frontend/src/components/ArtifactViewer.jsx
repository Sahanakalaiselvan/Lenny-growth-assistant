import React, { useState } from 'react';
import { X, Code2, Eye, Copy, Check, Sparkles, ExternalLink, FileText } from 'lucide-react';
import { marked } from 'marked';

export default function ArtifactViewer({ artifact, onClose }) {
  const [viewMode, setViewMode] = useState('preview'); // 'preview' | 'code'
  const [copied, setCopied] = useState(false);

  if (!artifact) {
    return (
      <div className="w-1/2 h-full bg-[#0c1220] border-l border-slate-800 p-8 flex flex-col items-center justify-center text-center text-slate-500">
        <Sparkles className="w-12 h-12 text-indigo-500/40 mb-4 animate-bounce" />
        <h3 className="text-base font-bold text-slate-300">No Artifact Selected</h3>
        <p className="text-xs text-slate-500 max-w-xs mt-2">
          Ask the assistant to generate a landing page, HTML UI component, growth framework, or Ship30for30 document to view it side-by-side!
        </p>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(artifact.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isHtml = artifact.artifact_type === 'html' || artifact.language === 'html';

  return (
    <div className="w-[50%] h-full bg-[#090d16] border-l border-slate-800 flex flex-col z-20 shadow-2xl animate-in slide-in-from-right duration-300">
      {/* Panel Top Header Bar */}
      <div className="h-16 px-6 bg-[#0c1220] border-b border-slate-800/90 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 truncate">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            {isHtml ? <Code2 className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
          </div>
          <div className="truncate">
            <h3 className="text-sm font-bold text-slate-100 truncate">{artifact.title || 'Generated Artifact'}</h3>
            <p className="text-[11px] text-indigo-400/90 uppercase tracking-wider font-semibold">
              {isHtml ? 'Interactive HTML Workspace' : 'Markdown Document'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Preview / Code View Mode Toggle */}
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                viewMode === 'preview'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
            <button
              onClick={() => setViewMode('code')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                viewMode === 'code'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Code</span>
            </button>
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl transition-all"
            title="Copy artifact content"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* Close Panel Button */}
          <button
            onClick={onClose}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 rounded-xl transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 overflow-hidden relative bg-[#060a12]">
        {viewMode === 'preview' ? (
          isHtml ? (
            <iframe
              title={artifact.title}
              srcDoc={artifact.content}
              className="w-full h-full border-none bg-white"
              sandbox="allow-scripts allow-modals"
            />
          ) : (
            <div className="p-8 h-full overflow-y-auto markdown-body text-slate-200">
              <div
                dangerouslySetInnerHTML={{ __html: marked.parse(artifact.content || '') }}
              />
            </div>
          )
        ) : (
          <pre className="p-6 h-full overflow-auto font-mono text-xs text-indigo-200 bg-[#060911] leading-relaxed selection:bg-indigo-900">
            <code>{artifact.content}</code>
          </pre>
        )}
      </div>
    </div>
  );
}
