import React, { useState } from 'react';
import { X, Sparkles, BarChart3, Code2, TrendingUp, Feather, Trash2, Volume2, Sliders } from 'lucide-react';
import { PRESET_PERSONAS } from '../personas';
import { Persona } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPersonaId: string;
  onSelectPersona: (persona: Persona) => void;
  customInstructions: string;
  onUpdateCustomInstructions: (val: string) => void;
  temperature: number;
  onUpdateTemperature: (val: number) => void;
  voice: string;
  onUpdateVoice: (voice: string) => void;
  onClearAllChats: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentPersonaId,
  onSelectPersona,
  customInstructions,
  onUpdateCustomInstructions,
  temperature,
  onUpdateTemperature,
  voice,
  onUpdateVoice,
  onClearAllChats,
}) => {
  const [activeTab, setActiveTab] = useState<'persona' | 'model' | 'voice' | 'data'>('persona');
  const [confirmClear, setConfirmClear] = useState(false);

  if (!isOpen) return null;

  const getPersonaIcon = (icon: string) => {
    switch (icon) {
      case 'BarChart3':
        return <BarChart3 className="h-4 w-4" />;
      case 'Code2':
        return <Code2 className="h-4 w-4" />;
      case 'TrendingUp':
        return <TrendingUp className="h-4 w-4" />;
      case 'Feather':
        return <Feather className="h-4 w-4" />;
      default:
        return <Sparkles className="h-4 w-4" />;
    }
  };

  const getTemperatureLabel = (temp: number) => {
    if (temp < 0.3) return 'Precise & Direct (Coding/Math)';
    if (temp < 0.8) return 'Balanced & Thoughtful (General)';
    return 'Creative & Expansive (Brainstorming/Writing)';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="flex h-[80vh] max-h-[640px] w-full max-w-2xl flex-col rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <Sliders className="h-5 w-5 text-emerald-400" />
            <h3 className="text-base font-semibold text-zinc-100">Legend AI Assistant Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/60 px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('persona')}
            className={`border-b-2 px-3 py-2 text-sm font-medium transition ${
              activeTab === 'persona'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            AI Persona
          </button>
          <button
            onClick={() => setActiveTab('model')}
            className={`border-b-2 px-3 py-2 text-sm font-medium transition ${
              activeTab === 'model'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Parameters
          </button>
          <button
            onClick={() => setActiveTab('voice')}
            className={`border-b-2 px-3 py-2 text-sm font-medium transition ${
              activeTab === 'voice'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Voice & Speech
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`border-b-2 px-3 py-2 text-sm font-medium transition ${
              activeTab === 'data'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Data Management
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'persona' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-zinc-200 mb-1">Preset AI Personas</h4>
                <p className="text-xs text-zinc-400 mb-3">
                  Choose how Legend AI Assistant responds and formats answers.
                </p>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {PRESET_PERSONAS.map((p) => {
                    const isSelected = p.id === currentPersonaId;
                    return (
                      <button
                        key={p.id}
                        onClick={() => onSelectPersona(p)}
                        className={`flex flex-col items-start gap-1.5 rounded-xl border p-3.5 text-left transition ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-950/20 shadow-sm shadow-emerald-500/10'
                            : 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-700 hover:bg-zinc-800/40'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`flex h-6 w-6 items-center justify-center rounded-md ${
                              isSelected
                                ? 'bg-emerald-500 text-black'
                                : 'bg-zinc-800 text-zinc-300'
                            }`}
                          >
                            {getPersonaIcon(p.icon)}
                          </span>
                          <span className="font-semibold text-sm text-zinc-100">{p.name}</span>
                        </div>
                        <p className="text-xs text-zinc-400 line-clamp-2">{p.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-sm font-medium text-zinc-200 mb-1.5">
                  Custom System Instructions
                </label>
                <p className="text-xs text-zinc-400 mb-2">
                  Add specific instructions for Legend AI Assistant (e.g. your company background, coding conventions, or tone).
                </p>
                <textarea
                  value={customInstructions}
                  onChange={(e) => onUpdateCustomInstructions(e.target.value)}
                  placeholder="e.g. Always include type definitions in TypeScript. When making charts, default to #10b981 for primary series..."
                  rows={4}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 p-3 text-xs text-zinc-200 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {activeTab === 'model' && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-zinc-200">
                    Creativity / Temperature
                  </label>
                  <span className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-xs text-emerald-400">
                    {temperature.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.5"
                  step="0.05"
                  value={temperature}
                  onChange={(e) => onUpdateTemperature(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <p className="mt-1 text-xs text-zinc-400">
                  Current mode: <strong className="text-zinc-200">{getTemperatureLabel(temperature)}</strong>
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4 space-y-2">
                <div className="text-sm font-semibold text-zinc-200">Active Model Engine</div>
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>Engine:</span>
                  <span className="font-mono text-zinc-300">Gemini 3.8 Flash</span>
                </div>
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>Grounding:</span>
                  <span className="text-emerald-400 font-medium">Google Search Grounding (Live)</span>
                </div>
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>Visualization:</span>
                  <span className="text-emerald-400 font-medium">Dynamic SVG Chart Engine</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'voice' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-zinc-200 mb-1">Text-to-Speech Voice</h4>
                <p className="text-xs text-zinc-400 mb-4">
                  Powered by Gemini 3.8 Flash-Lite-TTS for natural, lifelike speech output when clicking "Read Aloud".
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: 'Kore', label: 'Kore (Warm & Clear, Female-tone)' },
                    { id: 'Fenrir', label: 'Fenrir (Deep & Resonant, Male-tone)' },
                    { id: 'Puck', label: 'Puck (Enthusiastic & Bright)' },
                    { id: 'Charon', label: 'Charon (Calm & Authoritative)' },
                    { id: 'Zephyr', label: 'Zephyr (Smooth & Gentle)' },
                  ].map((v) => (
                    <button
                      key={v.id}
                      onClick={() => onUpdateVoice(v.id)}
                      className={`flex items-center justify-between rounded-xl border p-3 text-left transition ${
                        voice === v.id
                          ? 'border-emerald-500 bg-emerald-950/20 text-white'
                          : 'border-zinc-800 bg-zinc-950/40 text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Volume2 className="h-4 w-4 text-emerald-400" />
                        <span className="text-xs font-medium">{v.label}</span>
                      </div>
                      {voice === v.id && (
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-red-500/20 bg-red-950/10 p-4">
                <h4 className="text-sm font-semibold text-red-200 mb-1">Delete All Conversations</h4>
                <p className="text-xs text-zinc-400 mb-4">
                  This will permanently clear all saved chat sessions and messages stored locally in your browser.
                </p>

                {confirmClear ? (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        onClearAllChats();
                        setConfirmClear(false);
                        onClose();
                      }}
                      className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-500 transition shadow-md"
                    >
                      Yes, Clear Everything
                    </button>
                    <button
                      onClick={() => setConfirmClear(false)}
                      className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-700"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmClear(true)}
                    className="flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-950/30 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-900/40 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Clear All Conversations</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-800 bg-zinc-950 px-6 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
