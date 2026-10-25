import React, { useState } from 'react';
import {
  Plus,
  MessageSquare,
  Search,
  Pin,
  Trash2,
  Edit2,
  Check,
  X,
  Settings,
  Sparkles,
  BarChart3,
  Sliders,
  ChevronLeft,
  Download,
  Share2,
} from 'lucide-react';
import { Conversation } from '../types';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onTogglePin: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  onOpenDownload: () => void;
  onOpenShare: () => void;
  currentPersonaName: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
  onTogglePin,
  isOpen,
  onClose,
  onOpenSettings,
  onOpenDownload,
  onOpenShare,
  currentPersonaName,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  // Group conversations
  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinned = filtered.filter((c) => c.pinned);
  const unpinned = filtered.filter((c) => !c.pinned);

  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  const todayList = unpinned.filter((c) => now - c.updatedAt < oneDay);
  const yesterdayList = unpinned.filter(
    (c) => now - c.updatedAt >= oneDay && now - c.updatedAt < 2 * oneDay
  );
  const previous7Days = unpinned.filter(
    (c) => now - c.updatedAt >= 2 * oneDay && now - c.updatedAt < 7 * oneDay
  );
  const olderList = unpinned.filter((c) => now - c.updatedAt >= 7 * oneDay);

  const startRename = (c: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(c.id);
    setEditTitle(c.title);
  };

  const saveRename = (id: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const renderConversationItem = (c: Conversation) => {
    const isActive = c.id === activeConversationId;
    const isEditing = c.id === editingId;

    return (
      <div
        key={c.id}
        onClick={() => {
          onSelectConversation(c.id);
          if (window.innerWidth < 768) onClose();
        }}
        className={`group relative flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-xs font-medium transition cursor-pointer ${
          isActive
            ? 'bg-zinc-800 text-white shadow-sm'
            : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {c.pinned ? (
            <Pin className="h-3.5 w-3.5 text-emerald-400 shrink-0 fill-emerald-400/20" />
          ) : (
            <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-70" />
          )}

          {isEditing ? (
            <form
              onSubmit={(e) => saveRename(c.id, e)}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 flex-1"
            >
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                autoFocus
                className="w-full bg-zinc-950 px-1.5 py-0.5 rounded text-xs text-white border border-emerald-500 focus:outline-none"
              />
              <button
                type="submit"
                className="text-emerald-400 hover:text-emerald-300 p-0.5"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="text-zinc-500 hover:text-zinc-400 p-0.5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </form>
          ) : (
            <span className="truncate">{c.title || 'New Chat'}</span>
          )}
        </div>

        {/* Hover Action icons */}
        {!isEditing && (
          <div
            className={`flex items-center gap-1 transition opacity-0 group-hover:opacity-100 ${
              isActive ? 'opacity-100' : ''
            }`}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTogglePin(c.id);
              }}
              title={c.pinned ? 'Unpin' : 'Pin to top'}
              className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-700/60"
            >
              <Pin className={`h-3 w-3 ${c.pinned ? 'text-emerald-400' : ''}`} />
            </button>
            <button
              onClick={(e) => startRename(c, e)}
              title="Rename"
              className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-700/60"
            >
              <Edit2 className="h-3 w-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteConversation(c.id);
              }}
              title="Delete chat"
              className="p-1 text-zinc-400 hover:text-red-400 rounded hover:bg-zinc-700/60"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 flex h-full w-72 flex-col border-r border-zinc-800 bg-zinc-950 text-zinc-200 transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* App Brand Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-zinc-950 shadow-md shadow-emerald-500/20 font-bold">
              <BarChart3 className="h-4.5 w-4.5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold text-sm tracking-tight text-white">
                <span>Legend AI</span>
                <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-400 border border-emerald-500/30">
                  Assistant
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-none">Smart Conversational AI</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 md:hidden"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) onClose();
            }}
            className="flex w-full items-center justify-between rounded-xl border border-zinc-700/80 bg-zinc-900/90 px-3.5 py-2.5 text-xs font-semibold text-white shadow-sm hover:border-emerald-500/50 hover:bg-zinc-800 hover:shadow-emerald-500/10 transition group"
          >
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-emerald-400 group-hover:scale-110 transition" />
              <span>New chat</span>
            </div>
            <kbd className="hidden sm:inline-block rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400">
              ⌘N
            </kbd>
          </button>

          {/* Search Chats Input */}
          <div className="relative mt-2">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chat history..."
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 py-2 pl-9 pr-3 text-xs text-zinc-200 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Conversations History List */}
        <div className="flex-1 overflow-y-auto px-3 space-y-4 py-2">
          {pinned.length > 0 && (
            <div>
              <div className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                <Pin className="h-2.5 w-2.5" />
                <span>Pinned</span>
              </div>
              <div className="space-y-0.5">{pinned.map(renderConversationItem)}</div>
            </div>
          )}

          {todayList.length > 0 && (
            <div>
              <div className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Today
              </div>
              <div className="space-y-0.5">{todayList.map(renderConversationItem)}</div>
            </div>
          )}

          {yesterdayList.length > 0 && (
            <div>
              <div className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Yesterday
              </div>
              <div className="space-y-0.5">{yesterdayList.map(renderConversationItem)}</div>
            </div>
          )}

          {previous7Days.length > 0 && (
            <div>
              <div className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Previous 7 Days
              </div>
              <div className="space-y-0.5">{previous7Days.map(renderConversationItem)}</div>
            </div>
          )}

          {olderList.length > 0 && (
            <div>
              <div className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Older
              </div>
              <div className="space-y-0.5">{olderList.map(renderConversationItem)}</div>
            </div>
          )}

          {filtered.length === 0 && (
            <div className="py-8 text-center text-xs text-zinc-500">
              {searchQuery ? 'No matching conversations' : 'No conversation history'}
            </div>
          )}
        </div>

        {/* Footer Area with Persona & Settings */}
        <div className="border-t border-zinc-800/80 bg-zinc-950 p-3 space-y-2">
          {/* Share public link button */}
          <button
            onClick={() => {
              onOpenShare();
              if (window.innerWidth < 768) onClose();
            }}
            className="flex w-full items-center justify-between rounded-xl border border-teal-500/40 bg-teal-950/20 px-3 py-2 text-xs font-semibold text-teal-300 hover:bg-teal-900/30 transition shadow-sm"
          >
            <div className="flex items-center gap-2">
              <Share2 className="h-3.5 w-3.5 text-teal-400" />
              <span>Share with Others</span>
            </div>
            <span className="rounded bg-teal-500/20 px-1.5 py-0.5 text-[9px] font-mono text-teal-300">
              Link
            </span>
          </button>

          {/* Download / Install App button */}
          <button
            onClick={() => {
              onOpenDownload();
              if (window.innerWidth < 768) onClose();
            }}
            className="flex w-full items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/30 transition shadow-sm"
          >
            <div className="flex items-center gap-2">
              <Download className="h-3.5 w-3.5 text-emerald-400" />
              <span>Download & Install App</span>
            </div>
            <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-mono text-emerald-400">
              PWA
            </span>
          </button>

          <div className="flex items-center justify-between rounded-xl bg-zinc-900/60 p-2.5 border border-zinc-800">
            <div className="flex items-center gap-2 truncate">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <div className="truncate">
                <div className="text-[11px] font-medium text-zinc-300 truncate">
                  {currentPersonaName}
                </div>
                <div className="text-[10px] text-zinc-500">Gemini 3.8 Flash</div>
              </div>
            </div>

            <button
              onClick={onOpenSettings}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
              title="Settings & Persona"
            >
              <Sliders className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
