import React, { useState, useEffect, useRef } from 'react';
import { Conversation, Message, Attachment, Persona } from './types';
import { PRESET_PERSONAS } from './personas';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { SettingsModal } from './components/SettingsModal';
import { DownloadModal } from './components/DownloadModal';
import { ShareModal } from './components/ShareModal';

const STORAGE_KEY = 'legend_ai_conversations_v1';
const SETTINGS_KEY = 'legend_ai_settings_v1';

export default function App() {
  // Load settings from localStorage
  const [currentPersonaId, setCurrentPersonaId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) return JSON.parse(saved).personaId || 'general';
    } catch (e) {}
    return 'general';
  });

  const [customInstructions, setCustomInstructions] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) return JSON.parse(saved).customInstructions || '';
    } catch (e) {}
    return '';
  });

  const [temperature, setTemperature] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) return JSON.parse(saved).temperature ?? 0.7;
    } catch (e) {}
    return 0.7;
  });

  const [voice, setVoice] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) return JSON.parse(saved).voice || 'Kore';
    } catch (e) {}
    return 'Kore';
  });

  // Save settings when changed
  useEffect(() => {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({
        personaId: currentPersonaId,
        customInstructions,
        temperature,
        voice,
      })
    );
  }, [currentPersonaId, customInstructions, temperature, voice]);

  // Load conversations
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}

    // Initial default conversation
    const initialId = 'conv_' + Math.random().toString(36).substring(2, 9);
    return [
      {
        id: initialId,
        title: 'New Chat',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
      },
    ];
  });

  const [activeConversationId, setActiveConversationId] = useState<string>(() => {
    return conversations[0]?.id || '';
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }, [conversations]);

  const activeConversation =
    conversations.find((c) => c.id === activeConversationId) || conversations[0] || null;

  const currentPersona =
    PRESET_PERSONAS.find((p) => p.id === currentPersonaId) || PRESET_PERSONAS[0];

  const handleNewChat = () => {
    const newId = 'conv_' + Math.random().toString(36).substring(2, 9);
    const newConv: Conversation = {
      id: newId,
      title: 'New Chat',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      systemPersonaId: currentPersonaId,
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConversationId(newId);
  };

  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => {
      const filtered = prev.filter((c) => c.id !== id);
      if (filtered.length === 0) {
        const freshId = 'conv_' + Math.random().toString(36).substring(2, 9);
        const fresh: Conversation = {
          id: freshId,
          title: 'New Chat',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [],
        };
        setActiveConversationId(freshId);
        return [fresh];
      }
      if (activeConversationId === id) {
        setActiveConversationId(filtered[0].id);
      }
      return filtered;
    });
  };

  const handleRenameConversation = (id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle, updatedAt: Date.now() } : c))
    );
  };

  const handleTogglePin = (id: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c))
    );
  };

  const handleClearAllChats = () => {
    const freshId = 'conv_' + Math.random().toString(36).substring(2, 9);
    const fresh: Conversation = {
      id: freshId,
      title: 'New Chat',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    };
    setConversations([fresh]);
    setActiveConversationId(freshId);
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);

    // Turn off streaming indicator on last message
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== activeConversationId) return c;
        const msgs = [...c.messages];
        if (msgs.length > 0 && msgs[msgs.length - 1].isStreaming) {
          msgs[msgs.length - 1] = {
            ...msgs[msgs.length - 1],
            isStreaming: false,
          };
        }
        return { ...c, messages: msgs };
      })
    );
  };

  const handleSendMessage = async (
    content: string,
    attachments: Attachment[] = [],
    enableSearch = false,
    forceChart = false
  ) => {
    if (!content.trim() && attachments.length === 0) return;

    let targetConvId = activeConversationId;
    let currentConv = activeConversation;

    if (!currentConv) {
      targetConvId = 'conv_' + Math.random().toString(36).substring(2, 9);
      currentConv = {
        id: targetConvId,
        title: 'New Chat',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
      };
      setConversations([currentConv]);
      setActiveConversationId(targetConvId);
    }

    // Auto update conversation title if currently 'New Chat'
    const newTitle =
      currentConv.messages.length === 0
        ? content.slice(0, 36) + (content.length > 36 ? '...' : '')
        : currentConv.title;

    const userMessage: Message = {
      id: 'msg_' + Math.random().toString(36).substring(2, 9),
      role: 'user',
      content,
      timestamp: Date.now(),
      images: attachments
        .filter((a) => a.mimeType.startsWith('image/'))
        .map((a) => ({
          data: a.data,
          mimeType: a.mimeType,
          name: a.name,
        })),
    };

    const assistantMessageId = 'msg_' + Math.random().toString(36).substring(2, 9);
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };

    // Update state with user message and streaming assistant placeholder
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === targetConvId) {
          return {
            ...c,
            title: newTitle,
            updatedAt: Date.now(),
            messages: [...c.messages, userMessage, assistantMessage],
          };
        }
        return c;
      })
    );

    setIsStreaming(true);
    abortControllerRef.current = new AbortController();

    try {
      // Build conversation history for API
      const history = [...(currentConv.messages || []), userMessage].map((m) => ({
        role: m.role,
        content: m.content,
        images: m.images,
      }));

      const systemPrompt = [
        currentPersona.systemPrompt,
        customInstructions,
        forceChart ? 'IMPORTANT: Generate an interactive ```chart block for the data.' : '',
      ]
        .filter(Boolean)
        .join('\n\n');

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          messages: history,
          systemInstruction: systemPrompt,
          enableSearch,
          temperature,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No readable stream in response');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulatedText = '';
      let groundingData: any = undefined;
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;

          const dataStr = trimmed.replace(/^data:\s*/, '');
          if (dataStr === '[DONE]') {
            break;
          }

          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.error) {
              accumulatedText += `\n\n⚠️ **Error:** ${parsed.error}`;
            } else {
              if (parsed.text) {
                accumulatedText += parsed.text;
              }
              if (parsed.grounding) {
                groundingData = parsed.grounding;
              }
            }

            // Stream update into state
            setConversations((prev) =>
              prev.map((c) => {
                if (c.id !== targetConvId) return c;
                const msgs = [...c.messages];
                const lastIdx = msgs.findIndex((m) => m.id === assistantMessageId);
                if (lastIdx !== -1) {
                  msgs[lastIdx] = {
                    ...msgs[lastIdx],
                    content: accumulatedText,
                    grounding: groundingData,
                    isStreaming: true,
                  };
                }
                return { ...c, messages: msgs };
              })
            );
          } catch (e) {
            // Non-JSON or partial chunk
          }
        }
      }

      // Finish streaming
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== targetConvId) return c;
          const msgs = [...c.messages];
          const lastIdx = msgs.findIndex((m) => m.id === assistantMessageId);
          if (lastIdx !== -1) {
            msgs[lastIdx] = {
              ...msgs[lastIdx],
              content: accumulatedText,
              grounding: groundingData,
              isStreaming: false,
            };
          }
          return { ...c, messages: msgs };
        })
      );
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Stream generation aborted by user');
      } else {
        console.error('Chat stream error:', err);
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== targetConvId) return c;
            const msgs = [...c.messages];
            const lastIdx = msgs.findIndex((m) => m.id === assistantMessageId);
            if (lastIdx !== -1) {
              msgs[lastIdx] = {
                ...msgs[lastIdx],
                content:
                  msgs[lastIdx].content +
                  `\n\n❌ **Error generating response:** ${err.message || 'Please check your connection and try again.'}`,
                isStreaming: false,
              };
            }
            return { ...c, messages: msgs };
          })
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleRegenerate = () => {
    if (!activeConversation || activeConversation.messages.length === 0 || isStreaming)
      return;

    const msgs = [...activeConversation.messages];
    // Find last user message
    let lastUserIndex = -1;
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === 'user') {
        lastUserIndex = i;
        break;
      }
    }

    if (lastUserIndex === -1) return;

    const lastUserPrompt = msgs[lastUserIndex].content;
    const lastUserAttachments = (msgs[lastUserIndex].images || []).map((img, i) => ({
      id: 'att_' + i,
      name: img.name || 'image.png',
      mimeType: img.mimeType,
      data: img.data,
    }));

    // Remove last assistant message
    const prunedMessages = msgs.slice(0, lastUserIndex);
    setConversations((prev) =>
      prev.map((c) => (c.id === activeConversation.id ? { ...c, messages: prunedMessages } : c))
    );

    // Resend
    handleSendMessage(lastUserPrompt, lastUserAttachments);
  };

  // Keyboard shortcut for Cmd/Ctrl+N
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleNewChat();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-950 font-sans antialiased text-zinc-100">
      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={(id) => setActiveConversationId(id)}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onTogglePin={handleTogglePin}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenDownload={() => setDownloadOpen(true)}
        onOpenShare={() => setShareOpen(true)}
        currentPersonaName={currentPersona.name}
      />

      {/* Main Chat Area */}
      <ChatArea
        conversation={activeConversation}
        onSendMessage={handleSendMessage}
        onStopGeneration={handleStopGeneration}
        isStreaming={isStreaming}
        onRegenerate={handleRegenerate}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenDownload={() => setDownloadOpen(true)}
        onOpenShare={() => setShareOpen(true)}
        currentPersonaName={currentPersona.name}
        defaultVoice={voice}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        currentPersonaId={currentPersonaId}
        onSelectPersona={(p) => setCurrentPersonaId(p.id)}
        customInstructions={customInstructions}
        onUpdateCustomInstructions={setCustomInstructions}
        temperature={temperature}
        onUpdateTemperature={setTemperature}
        voice={voice}
        onUpdateVoice={setVoice}
        onClearAllChats={handleClearAllChats}
      />

      {/* Download / Install App Modal */}
      <DownloadModal
        isOpen={downloadOpen}
        onClose={() => setDownloadOpen(false)}
      />

      {/* Share with Others Modal */}
      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
      />
    </div>
  );
}
