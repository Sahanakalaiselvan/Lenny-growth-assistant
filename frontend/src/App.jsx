import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ChatWindow from './components/ChatWindow';
import ArtifactViewer from './components/ArtifactViewer';
import { CheckCircle2, AlertCircle, Key, X, Lock } from 'lucide-react';
import {
  fetchSessions,
  createSession,
  getSession,
  updateSession,
  deleteSession,
  sendChatMessage,
  fetchConfig,
  fetchArtifact,
  saveApiKeys
} from './services/api';

export default function App() {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [activeArtifact, setActiveArtifact] = useState(null);
  const [isArtifactPanelOpen, setIsArtifactPanelOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState(null);
  const [provider, setProvider] = useState('ollama'); // 'ollama' | 'cloud'
  const [notification, setNotification] = useState(null);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [anthropicInput, setAnthropicInput] = useState('');
  const [openaiInput, setOpenaiInput] = useState('');
  const [isSavingKeys, setIsSavingKeys] = useState(false);

  // Helper for small notifications
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // Provider Toggle Handler
  const handleToggleProvider = (targetProvider) => {
    if (targetProvider === 'ollama') {
      setProvider('ollama');
      showNotification('✓ Using Local Ollama', 'success');
    } else if (targetProvider === 'cloud') {
      const isConfigured = Boolean(config?.has_anthropic_key || config?.has_openai_key);
      if (!isConfigured) {
        showNotification('Cloud provider not configured.', 'error');
        setIsKeyModalOpen(true);
      } else {
        setProvider('cloud');
        showNotification('✓ Switched to Claude', 'success');
      }
    }
  };

  // Save API Keys Handler
  const handleSaveKeys = async (e) => {
    e.preventDefault();
    setIsSavingKeys(true);
    try {
      await saveApiKeys({
        anthropicApiKey: anthropicInput,
        openaiApiKey: openaiInput
      });
      const sysConfig = await fetchConfig();
      setConfig(sysConfig);
      setIsKeyModalOpen(false);

      if (sysConfig.has_anthropic_key || sysConfig.has_openai_key) {
        setProvider('cloud');
        showNotification('✓ Switched to Claude', 'success');
      } else {
        showNotification('API keys updated', 'success');
      }
    } catch (err) {
      console.error("Failed to save API keys:", err);
      showNotification('Failed to save API keys.', 'error');
    } finally {
      setIsSavingKeys(false);
    }
  };

  // 1. Initial Load: Config & Sessions
  useEffect(() => {
    async function init() {
      try {
        const sysConfig = await fetchConfig();
        setConfig(sysConfig);
        
        const sessionList = await fetchSessions();
        setSessions(sessionList);

        if (sessionList.length > 0) {
          loadSessionDetails(sessionList[0].id);
        } else {
          handleNewChat();
        }
      } catch (err) {
        console.error("Initialization error:", err);
      }
    }
    init();
  }, []);

  // 2. Load Session Details
  const loadSessionDetails = async (sessionId) => {
    try {
      setActiveSessionId(sessionId);
      const details = await getSession(sessionId);
      setActiveSession(details);
      
      // Auto-open last artifact if present
      if (details.artifacts && details.artifacts.length > 0) {
        setActiveArtifact(details.artifacts[0]);
      } else {
        setActiveArtifact(null);
      }
    } catch (err) {
      console.error("Failed to load session:", err);
    }
  };

  // 3. New Chat Creation
  const handleNewChat = async () => {
    try {
      const newSess = await createSession("New Growth Chat", provider, "llama3.2");
      setSessions(prev => [newSess, ...prev]);
      setActiveSessionId(newSess.id);
      setActiveSession({
        ...newSess,
        messages: [],
        artifacts: []
      });
      setActiveArtifact(null);
    } catch (err) {
      console.error("Failed to create new chat:", err);
    }
  };

  // 4. Delete Session
  const handleDeleteSession = async (sessionId) => {
    try {
      await deleteSession(sessionId);
      const updated = sessions.filter(s => s.id !== sessionId);
      setSessions(updated);
      if (activeSessionId === sessionId) {
        if (updated.length > 0) {
          loadSessionDetails(updated[0].id);
        } else {
          handleNewChat();
        }
      }
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  // 5. Update Session Title
  const handleUpdateTitle = async (sessionId, newTitle) => {
    try {
      await updateSession(sessionId, { title: newTitle });
      setSessions(prev =>
        prev.map(s => (s.id === sessionId ? { ...s, title: newTitle } : s))
      );
      if (activeSession) {
        setActiveSession({ ...activeSession, title: newTitle });
      }
    } catch (err) {
      console.error("Failed to update title:", err);
    }
  };

  // 6. Send Chat Message
  const handleSendMessage = async ({ message, isShip30, isArtifactRequest }) => {
    if (!activeSessionId) return;

    setIsLoading(true);

    // Optimistic UI User Message
    const tempUserMsg = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: message,
      created_at: new Date().toISOString()
    };

    setActiveSession(prev => ({
      ...prev,
      messages: [...(prev?.messages || []), tempUserMsg]
    }));

    try {
      const chatRes = await sendChatMessage({
        sessionId: activeSessionId,
        message,
        isShip30,
        isArtifactRequest,
        provider
      });

      // Update Messages in Session
      setActiveSession(prev => {
        const filtered = prev.messages.filter(m => m.id !== tempUserMsg.id);
        const updatedArtifacts = chatRes.artifact
          ? [chatRes.artifact, ...(prev.artifacts || [])]
          : prev.artifacts || [];

        return {
          ...prev,
          messages: [...filtered, chatRes.user_message, chatRes.assistant_message],
          artifacts: updatedArtifacts
        };
      });

      // Refresh Session Title in Sidebar List
      const updatedList = await fetchSessions();
      setSessions(updatedList);

      // If an artifact was generated, set active and open panel
      if (chatRes.artifact) {
        setActiveArtifact(chatRes.artifact);
        setIsArtifactPanelOpen(true);
      }
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // 7. Open Specific Artifact Side-by-Side
  const handleOpenArtifact = async (artifactId) => {
    try {
      const artData = await fetchArtifact(artifactId);
      setActiveArtifact(artData);
      setIsArtifactPanelOpen(true);
    } catch (err) {
      console.error("Failed to fetch artifact:", err);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#090d16] text-slate-100 font-sans selection:bg-indigo-500 selection:text-white relative">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 animate-in fade-in slide-in-from-top-3">
          <div
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-bold border backdrop-blur-md ${
              notification.type === 'error'
                ? 'bg-slate-900/95 border-rose-500/50 text-rose-300 shadow-rose-950/50'
                : 'bg-slate-900/95 border-emerald-500/50 text-emerald-300 shadow-emerald-950/50'
            }`}
          >
            {notification.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* API Key Configuration Modal */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0c1220] border border-slate-700/80 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-100">Configure Cloud API Keys</h3>
                  <p className="text-xs text-slate-400">Enable Claude or OpenAI LLM providers</p>
                </div>
              </div>
              <button
                onClick={() => setIsKeyModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveKeys} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-purple-400" />
                  <span>Anthropic API Key (Claude)</span>
                </label>
                <input
                  type="password"
                  placeholder="sk-ant-api03-..."
                  value={anthropicInput}
                  onChange={(e) => setAnthropicInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-100 px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-purple-500 transition-colors placeholder:text-slate-600 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>OpenAI API Key (GPT-4o)</span>
                </label>
                <input
                  type="password"
                  placeholder="sk-proj-..."
                  value={openaiInput}
                  onChange={(e) => setOpenaiInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-100 px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600 font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsKeyModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingKeys}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-lg shadow-purple-600/30 hover:scale-105 disabled:opacity-50"
                >
                  {isSavingKeys ? 'Saving...' : 'Save & Enable Cloud'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Left Sidebar */}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={loadSessionDetails}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        config={config}
        provider={provider}
        onToggleProvider={handleToggleProvider}
        onOpenKeyModal={() => setIsKeyModalOpen(true)}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 h-full flex flex-col overflow-hidden">
        <Header
          activeSession={activeSession}
          onUpdateTitle={handleUpdateTitle}
          isArtifactPanelOpen={isArtifactPanelOpen}
          onToggleArtifactPanel={() => setIsArtifactPanelOpen(!isArtifactPanelOpen)}
          hasArtifacts={Boolean(activeSession?.artifacts && activeSession.artifacts.length > 0)}
          provider={provider}
        />

        <div className="flex-1 flex overflow-hidden relative">
          <ChatWindow
            messages={activeSession?.messages || []}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            onOpenArtifact={handleOpenArtifact}
            activeArtifactId={activeArtifact?.id}
          />

          {/* Side-by-Side Artifact Panel */}
          {isArtifactPanelOpen && (
            <ArtifactViewer
              artifact={activeArtifact}
              onClose={() => setIsArtifactPanelOpen(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}


