import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Square,
  Globe,
  BarChart3,
  Image as ImageIcon,
  Paperclip,
  Volume2,
  VolumeX,
  Copy,
  Check,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  ExternalLink,
  ChevronDown,
  Edit3,
  X,
  Menu,
  Download,
  Share2,
  Sliders,
  FileText,
  Loader2,
} from 'lucide-react';
import { Message, Conversation, Attachment } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ChatAreaProps {
  conversation: Conversation | null;
  onSendMessage: (
    content: string,
    attachments?: Attachment[],
    enableSearchOverride?: boolean,
    forceChartOverride?: boolean
  ) => void;
  onStopGeneration: () => void;
  isStreaming: boolean;
  onRegenerate: () => void;
  onToggleSidebar: () => void;
  onOpenSettings: () => void;
  onOpenDownload: () => void;
  onOpenShare: () => void;
  currentPersonaName: string;
  defaultVoice: string;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  conversation,
  onSendMessage,
  onStopGeneration,
  isStreaming,
  onRegenerate,
  onToggleSidebar,
  onOpenSettings,
  onOpenDownload,
  onOpenShare,
  currentPersonaName,
  defaultVoice,
}) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [enableSearch, setEnableSearch] = useState(false);
  const [forceChart, setForceChart] = useState(false);

  // Audio playback state
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioLoadingId, setAudioLoadingId] = useState<string | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Copy feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Auto-scroll
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages, isStreaming]);

  // Handle textarea auto-resize
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        180
      )}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!input.trim() && attachments.length === 0) || isStreaming) return;

    let finalPrompt = input.trim();
    if (forceChart && !finalPrompt.toLowerCase().includes('chart')) {
      finalPrompt += '\n\nPlease present the data with an interactive ```chart block and visual comparison.';
    }

    onSendMessage(finalPrompt, attachments, enableSearch, forceChart);
    setInput('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();

      if (file.type.startsWith('image/')) {
        reader.onload = () => {
          setAttachments((prev) => [
            ...prev,
            {
              id: Math.random().toString(36).substring(7),
              name: file.name,
              mimeType: file.type,
              data: reader.result as string,
              size: file.size,
              previewUrl: reader.result as string,
            },
          ]);
        };
        reader.readAsDataURL(file);
      } else {
        // Text / CSV / Code / JSON document
        reader.onload = () => {
          const content = reader.result as string;
          // Append file text into prompt or attachment
          setInput((prev) =>
            prev
              ? `${prev}\n\n[Attached File: ${file.name}]\n\`\`\`\n${content.slice(
                  0,
                  8000
                )}\n\`\`\``
              : `Analyze this file (${file.name}):\n\`\`\`\n${content.slice(0, 8000)}\n\`\`\``
          );
        };
        reader.readAsText(file);
      }
    });

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // TTS playback using server Gemini TTS
  const handleReadAloud = async (message: Message) => {
    if (playingAudioId === message.id) {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      setPlayingAudioId(null);
      return;
    }

    // Stop existing audio if playing
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }

    setAudioLoadingId(message.id);

    try {
      const res = await fetch('/api/chat/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: message.content,
          voice: defaultVoice,
        }),
      });

      if (!res.ok) {
        throw new Error('TTS server error');
      }

      const data = await res.json();
      if (data.audio) {
        const audio = new Audio(`data:${data.mimeType};base64,${data.audio}`);
        currentAudioRef.current = audio;
        setPlayingAudioId(message.id);
        setAudioLoadingId(null);

        audio.onended = () => {
          setPlayingAudioId(null);
          currentAudioRef.current = null;
        };

        audio.onerror = () => {
          setPlayingAudioId(null);
          currentAudioRef.current = null;
        };

        await audio.play();
      } else {
        throw new Error('No audio returned');
      }
    } catch (err) {
      console.warn('Gemini TTS failed, falling back to Web Speech API:', err);
      setAudioLoadingId(null);

      // Fallback to Web Speech API
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const cleanText = message.content.replace(/```[\s\S]*?```/g, '').slice(0, 800);
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 1.0;
        setPlayingAudioId(message.id);
        utterance.onend = () => setPlayingAudioId(null);
        utterance.onerror = () => setPlayingAudioId(null);
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  const handleCopyMessage = (msg: Message) => {
    navigator.clipboard.writeText(msg.content);
    setCopiedId(msg.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportConversation = () => {
    if (!conversation) return;
    const mdLines = [
      `# ${conversation.title}`,
      `*Exported from Legend AI Assistant on ${new Date().toLocaleDateString()}*`,
      '',
    ];

    conversation.messages.forEach((m) => {
      mdLines.push(`### ${m.role === 'user' ? 'User' : 'Legend AI Assistant'}`);
      mdLines.push('');
      mdLines.push(m.content);
      mdLines.push('');
      mdLines.push('---');
      mdLines.push('');
    });

    const blob = new Blob([mdLines.join('\n')], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${conversation.title.replace(/\s+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const messages = conversation?.messages || [];

  return (
    <div className="flex h-full flex-1 flex-col bg-zinc-900 text-zinc-100 overflow-hidden relative">
      {/* Top Navbar */}
      <header className="flex h-14 items-center justify-between border-b border-zinc-800 bg-zinc-950/90 px-4 backdrop-blur-md z-10 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onToggleSidebar}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white md:hidden"
            title="Toggle Menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-zinc-100 truncate">
              {conversation?.title || 'New Conversation'}
            </h2>
            <div className="flex items-center gap-2 text-[11px] text-zinc-400">
              <span className="flex items-center gap-1 text-emerald-400">
                <Sparkles className="h-3 w-3" />
                <span>{currentPersonaName}</span>
              </span>
              <span>•</span>
              <span className="truncate">Gemini 3.8 Flash</span>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenShare}
            className="flex items-center gap-1.5 rounded-lg border border-teal-500/50 bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:from-emerald-500 hover:to-teal-500 transition shadow-sm"
            title="Share Legend AI Assistant with anyone via link or QR code"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>Share</span>
          </button>

          <button
            onClick={onOpenDownload}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-950/30 px-2.5 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-900/40 hover:text-emerald-200 transition shadow-xs"
            title="Download full project code or install as desktop/mobile app"
          >
            <Download className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden sm:inline font-semibold">Download</span>
          </button>

          <button
            onClick={exportConversation}
            disabled={messages.length === 0}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-700/80 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
            title="Export conversation to Markdown"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700/80 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
            title="Settings & Persona"
          >
            <Sliders className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* Messages Stream Container */}
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.length === 0 ? (
            // Empty State / Starter Suggestions
            <div className="py-8 md:py-14 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-zinc-950 shadow-lg shadow-emerald-500/20">
                <BarChart3 className="h-8 w-8 stroke-[2.5]" />
              </div>

              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">
                What can I help you visualize or solve today?
              </h1>
              <p className="mx-auto max-w-lg text-sm text-zinc-400 mb-8">
                Ask any question, brainstorm ideas, analyze data into dynamic interactive charts, execute code in sandboxes, or search the live web.
              </p>

              {/* Starter Prompt Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                {[
                  {
                    title: 'Compare 2025 Tech Revenue',
                    desc: 'Generate an interactive chart comparing Apple, Google, Microsoft, and Amazon.',
                    prompt:
                      'Generate a comparative revenue analysis of Apple, Microsoft, Google, and Amazon for 2024 vs 2025 with an interactive chart.',
                    icon: <BarChart3 className="h-4 w-4 text-emerald-400" />,
                  },
                  {
                    title: 'Interactive HTML Stopwatch',
                    desc: 'Build an interactive stopwatch with lap times that runs in the live sandbox.',
                    prompt:
                      'Write an interactive, beautifully styled HTML and JavaScript stopwatch app with start, pause, lap times, and reset.',
                    icon: <Sparkles className="h-4 w-4 text-cyan-400" />,
                  },
                  {
                    title: 'Search Latest Tech News',
                    desc: 'Query real-time Google Search for breakthrough AI research this week.',
                    prompt:
                      'Search Google for the latest groundbreaking developments in AI models and robotics over the last month and summarize key highlights.',
                    icon: <Globe className="h-4 w-4 text-blue-400" />,
                    search: true,
                  },
                  {
                    title: 'Global Renewable Energy Trends',
                    desc: 'Visualize solar, wind, and hydro growth over the past 5 years with insight summary.',
                    prompt:
                      'Create a trend analysis and interactive area chart of global renewable energy adoption (solar, wind, hydro) from 2020 to 2025.',
                    icon: <BarChart3 className="h-4 w-4 text-amber-400" />,
                    chart: true,
                  },
                ].map((card, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (card.search) setEnableSearch(true);
                      if (card.chart) setForceChart(true);
                      onSendMessage(card.prompt, [], card.search, card.chart);
                    }}
                    className="group flex flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4 transition hover:border-zinc-700 hover:bg-zinc-800/40 hover:shadow-lg text-left"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 group-hover:scale-105 transition">
                          {card.icon}
                        </span>
                        <h3 className="text-sm font-semibold text-zinc-200 group-hover:text-emerald-400 transition">
                          {card.title}
                        </h3>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed">{card.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // Message List
            messages.map((message) => {
              const isUser = message.role === 'user';
              const isPlaying = playingAudioId === message.id;
              const isLoadingAudio = audioLoadingId === message.id;

              return (
                <div
                  key={message.id}
                  className={`flex gap-3 md:gap-4 ${
                    isUser ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {/* Assistant Avatar */}
                  {!isUser && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-zinc-950 font-bold shadow-md shadow-emerald-500/10">
                      <BarChart3 className="h-4 w-4 stroke-[2.5]" />
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`relative max-w-[88%] md:max-w-[82%] rounded-2xl p-4 md:p-5 shadow-sm ${
                      isUser
                        ? 'bg-zinc-800/90 text-white rounded-tr-xs border border-zinc-700/60'
                        : 'bg-zinc-950/80 text-zinc-200 rounded-tl-xs border border-zinc-800/80'
                    }`}
                  >
                    {/* User Attached Images */}
                    {isUser && message.images && message.images.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-2">
                        {message.images.map((img, i) => (
                          <div
                            key={i}
                            className="relative overflow-hidden rounded-xl border border-zinc-700/80 bg-zinc-900 max-h-48 max-w-xs"
                          >
                            <img
                              src={
                                img.data.startsWith('data:')
                                  ? img.data
                                  : `data:${img.mimeType};base64,${img.data}`
                              }
                              alt="User uploaded attachment"
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Content */}
                    {isUser ? (
                      <div className="whitespace-pre-wrap text-sm md:text-[15px] leading-relaxed">
                        {message.content}
                      </div>
                    ) : (
                      <>
                        <MarkdownRenderer content={message.content} />

                        {/* Blinking typing cursor during active streaming */}
                        {message.isStreaming && (
                          <span className="inline-block h-4 w-2 translate-y-0.5 animate-pulse bg-emerald-400 ml-1 rounded-xs" />
                        )}

                        {/* Google Search Grounding Sources */}
                        {message.grounding &&
                          message.grounding.groundingChunks &&
                          message.grounding.groundingChunks.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-zinc-800/80">
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 mb-2">
                                <Globe className="h-3.5 w-3.5 text-blue-400" />
                                <span>Verified Web Sources</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {message.grounding.groundingChunks
                                  .filter((c) => c.web && c.web.uri)
                                  .map((c, i) => (
                                    <a
                                      key={i}
                                      href={c.web?.uri}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/90 px-2.5 py-1 text-xs text-zinc-300 hover:border-zinc-700 hover:text-white transition"
                                    >
                                      <span className="font-mono text-[10px] text-zinc-500">
                                        [{i + 1}]
                                      </span>
                                      <span className="truncate max-w-[200px]">
                                        {c.web?.title || 'Web Link'}
                                      </span>
                                      <ExternalLink className="h-3 w-3 text-zinc-500 shrink-0" />
                                    </a>
                                  ))}
                              </div>
                            </div>
                          )}

                        {/* Assistant Action Bar */}
                        {!message.isStreaming && (
                          <div className="mt-4 flex flex-wrap items-center gap-1 text-xs text-zinc-400 border-t border-zinc-800/60 pt-2.5">
                            {/* Read aloud TTS */}
                            <button
                              onClick={() => handleReadAloud(message)}
                              disabled={isLoadingAudio}
                              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition ${
                                isPlaying
                                  ? 'bg-emerald-500/20 text-emerald-400 font-medium'
                                  : 'hover:bg-zinc-800 hover:text-zinc-200'
                              }`}
                              title={isPlaying ? 'Stop audio' : 'Read aloud with Gemini TTS'}
                            >
                              {isLoadingAudio ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />
                              ) : isPlaying ? (
                                <VolumeX className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
                              ) : (
                                <Volume2 className="h-3.5 w-3.5" />
                              )}
                              <span>{isPlaying ? 'Playing...' : 'Read Aloud'}</span>
                            </button>

                            {/* Copy button */}
                            <button
                              onClick={() => handleCopyMessage(message)}
                              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 hover:bg-zinc-800 hover:text-zinc-200 transition"
                              title="Copy response"
                            >
                              {copiedId === message.id ? (
                                <>
                                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                                  <span className="text-emerald-400">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3.5 w-3.5" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>

                            {/* Regenerate */}
                            <button
                              onClick={onRegenerate}
                              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 hover:bg-zinc-800 hover:text-zinc-200 transition"
                              title="Regenerate answer"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              <span>Retry</span>
                            </button>

                            {/* Like & Dislike */}
                            <div className="ml-auto flex items-center gap-1">
                              <button
                                onClick={() => {
                                  message.rating = message.rating === 'like' ? undefined : 'like';
                                }}
                                className={`rounded-lg p-1.5 hover:bg-zinc-800 transition ${
                                  message.rating === 'like'
                                    ? 'text-emerald-400 bg-emerald-500/10'
                                    : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                                title="Good response"
                              >
                                <ThumbsUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  message.rating = message.rating === 'dislike' ? undefined : 'dislike';
                                }}
                                className={`rounded-lg p-1.5 hover:bg-zinc-800 transition ${
                                  message.rating === 'dislike'
                                    ? 'text-red-400 bg-red-500/10'
                                    : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                                title="Poor response"
                              >
                                <ThumbsDown className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* User Avatar */}
                  {isUser && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 font-semibold text-xs">
                      You
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area (Centered & ChatGPT styled) */}
      <div className="shrink-0 border-t border-zinc-800/80 bg-zinc-950/90 px-4 py-3 md:px-8 backdrop-blur-md">
        <div className="mx-auto max-w-3xl">
          {/* Attachment Previews */}
          {attachments.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200"
                >
                  {att.previewUrl ? (
                    <img
                      src={att.previewUrl}
                      alt={att.name}
                      className="h-6 w-6 rounded object-cover"
                    />
                  ) : (
                    <FileText className="h-4 w-4 text-emerald-400" />
                  )}
                  <span className="truncate max-w-[150px] font-medium">{att.name}</span>
                  <button
                    onClick={() => removeAttachment(att.id)}
                    className="text-zinc-400 hover:text-red-400"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Main Input Box */}
          <div className="relative flex flex-col rounded-2xl border border-zinc-700/80 bg-zinc-900/90 p-2 shadow-xl focus-within:border-emerald-500/80 focus-within:ring-1 focus-within:ring-emerald-500/40 transition">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything, describe a chart, or paste code..."
              rows={1}
              className="w-full resize-none bg-transparent px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none max-h-44 leading-relaxed"
            />

            {/* Bottom Input Controls Bar */}
            <div className="flex items-center justify-between border-t border-zinc-800/60 pt-2 px-1">
              {/* Feature Toggles */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Upload Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.csv,.json,.txt,.md,.js,.ts,.py"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900/80 px-2.5 py-1.5 text-xs font-medium text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 transition"
                  title="Upload image or text file"
                >
                  <Paperclip className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Attach</span>
                </button>

                {/* Web Search Grounding Toggle */}
                <button
                  type="button"
                  onClick={() => setEnableSearch(!enableSearch)}
                  className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                    enableSearch
                      ? 'border-blue-500/50 bg-blue-500/15 text-blue-300'
                      : 'border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                  title="Search the live web for up-to-date answers"
                >
                  <Globe className="h-3.5 w-3.5" />
                  <span>Web Search</span>
                </button>

                {/* Force Chart Mode Toggle */}
                <button
                  type="button"
                  onClick={() => setForceChart(!forceChart)}
                  className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                    forceChart
                      ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
                      : 'border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                  title="Enforce interactive SVG chart visualization"
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                  <span>Chart Mode</span>
                </button>
              </div>

              {/* Submit or Stop Button */}
              {isStreaming ? (
                <button
                  type="button"
                  onClick={onStopGeneration}
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition border border-red-500/30"
                  title="Stop generating"
                >
                  <Square className="h-3.5 w-3.5 fill-current" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  disabled={!input.trim() && attachments.length === 0}
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 transition shadow-md disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Send message"
                >
                  <Send className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="mt-1.5 text-center text-[11px] text-zinc-500">
            Legend AI Assistant can analyze data into charts, run code previews, and search the web.
          </div>
        </div>
      </div>
    </div>
  );
};
